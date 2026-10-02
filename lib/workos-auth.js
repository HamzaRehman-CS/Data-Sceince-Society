'use strict';
const crypto = require('node:crypto');

function createAuth({ env = process.env, client } = {}) {
  const enabled = !!(env.WORKOS_API_KEY && env.WORKOS_CLIENT_ID);
  if (!!env.WORKOS_API_KEY !== !!env.WORKOS_CLIENT_ID) throw new Error('Set both WORKOS_API_KEY and WORKOS_CLIENT_ID.');
  if (!enabled) return { enabled: false };
  if ((env.WORKOS_COOKIE_PASSWORD || '').length < 32) throw new Error('WORKOS_COOKIE_PASSWORD must contain at least 32 characters.');
  const origin = env.PUBLIC_ORIGIN || 'http://localhost:3000';
  const redirectUri = env.WORKOS_REDIRECT_URI || origin + '/callback';
  if (new URL(redirectUri).origin !== new URL(origin).origin) throw new Error('WorkOS callback and PUBLIC_ORIGIN must use the same origin.');
  const secure = new URL(origin).protocol === 'https:';
  if ((env.VERCEL || env.NODE_ENV === 'production') && !secure) throw new Error('Production WorkOS login requires an HTTPS PUBLIC_ORIGIN.');
  const workos = client || new (require('@workos-inc/node').WorkOS)(env.WORKOS_API_KEY, { clientId: env.WORKOS_CLIENT_ID });
  const admins = new Set((env.WORKOS_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
  function cookie(req, name) {
    const value = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1);
    try { return decodeURIComponent(value || ''); } catch { return ''; }
  }
  function setCookie(res, name, value, maxAge) {
    const existing = res.getHeader('Set-Cookie') || [];
    res.setHeader('Set-Cookie', [...(Array.isArray(existing) ? existing : [existing]), `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`]);
  }
  const sign = value => crypto.createHmac('sha256', env.WORKOS_COOKIE_PASSWORD).update(value).digest('base64url');
  const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
  function sealFlow(flow) { const value = Buffer.from(JSON.stringify(flow)).toString('base64url'); return value + '.' + sign(value); }
  function readFlow(req) {
    const [value, signature = ''] = cookie(req, 'dss_auth_flow').split('.');
    if (!value) return null;
    const actual = Buffer.from(signature), expected = Buffer.from(sign(value));
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    try { const flow = JSON.parse(Buffer.from(value, 'base64url')); return flow.expires > Date.now() ? flow : null; } catch { return null; }
  }
  function redirect(res, destination) { res.writeHead(302, { Location: destination, 'Cache-Control': 'no-store' }); res.end(); }
  async function identity(req, res, db={}) {
    const value = cookie(req, 'dss_workos');
    if (!value) return null;
    const revoked=(db.revokedWorkosSessions||[]).filter(x=>x.expires>Date.now());
    if(revoked.some(x=>x.token===digest(value))){setCookie(res,'dss_workos','',0);return null;}
    let session, result;
    try {
      session = workos.userManagement.loadSealedSession({ sessionData: value, cookiePassword: env.WORKOS_COOKIE_PASSWORD });
      result = await session.authenticate();
    } catch {
      setCookie(res, 'dss_workos', '', 0); return null;
    }
    if (!result.authenticated) {
      try {result = await session.refresh();}catch(error){if([400,401,403,404].includes(error.status)||error.code==='invalid_grant'){setCookie(res,'dss_workos','',0);return null;}throw Object.assign(new Error('Sign-in service is temporarily unavailable. Please retry.'),{code:503});}
      if (result.authenticated) setCookie(res, 'dss_workos', result.sealedSession, 604800);
      else if (result.retryable) throw Object.assign(new Error('Sign-in service is temporarily unavailable. Please retry.'), { code: 503 });
      else setCookie(res, 'dss_workos', '', 0);
    }
    if(result.sessionId&&revoked.some(x=>x.sessionId===result.sessionId)){setCookie(res,'dss_workos','',0);return null;}
    req.authSessionId=result.sessionId;
    return result.authenticated && result.user?.emailVerified === true ? result.user : null;
  }
  async function route(req, res, url, saveIdentity) {
    if (req.method !== 'GET' || !['/auth/login', '/auth/signup', '/callback'].includes(url.pathname)) return false;
    if (url.pathname !== '/callback') {
      if (req.headers['sec-fetch-site'] === 'cross-site' && url.searchParams.has('returnTo')) return redirect(res, origin + '/auth/login'), true;
      const next = url.searchParams.get('returnTo');
      const returnTo = ['/join.html?track=membership', '/ambassador.html', '/member-dashboard.html'].includes(next) ? next : '/member-dashboard.html';
      const { url: authorizationUrl, codeVerifier, state } = await workos.userManagement.getAuthorizationUrlWithPKCE({
        clientId: env.WORKOS_CLIENT_ID, provider: 'authkit', redirectUri,
        screenHint: url.pathname === '/auth/signup' ? 'sign-up' : 'sign-in'
      });
      setCookie(res, 'dss_auth_flow', sealFlow({ state, codeVerifier, returnTo, expires: Date.now() + 600000 }), 600);
      redirect(res, authorizationUrl); return true;
    }
    const flow = readFlow(req); setCookie(res, 'dss_auth_flow', '', 0);
    if (!flow || url.searchParams.get('state') !== flow.state || !url.searchParams.get('code') || url.searchParams.has('error')) {
      redirect(res, origin + '/login.html?authError=callback'); return true;
    }
    try {
      const result = await workos.userManagement.authenticateWithCode({
        clientId: env.WORKOS_CLIENT_ID, code: url.searchParams.get('code'), codeVerifier: flow.codeVerifier,
        session: { sealSession: true, cookiePassword: env.WORKOS_COOKIE_PASSWORD }
      });
      if (!result.sealedSession || result.user?.emailVerified !== true) throw new Error('Unverified account');
      const user = await saveIdentity(result.user, admins.has(result.user.email.toLowerCase()));
      setCookie(res, 'dss_workos', result.sealedSession, 604800);
      setCookie(res, 'dss_session', '', 0);
      redirect(res, origin + (user.role === 'admin' ? '/admin.html' : flow.returnTo));
    } catch {
      redirect(res, origin + '/login.html?authError=signin');
    }
    return true;
  }
  async function logout(req, res, db={}) {
    const value = cookie(req, 'dss_workos');
    if (value) {
      let sessionId;
      try {const url=await workos.userManagement.loadSealedSession({sessionData:value,cookiePassword:env.WORKOS_COOKIE_PASSWORD}).getLogoutUrl();sessionId=new URL(url).searchParams.get('session_id');}catch{}
      if(sessionId){
        db.revokedWorkosSessions=(db.revokedWorkosSessions||[]).filter(x=>x.expires>Date.now()&&x.token!==digest(value));
        db.revokedWorkosSessions.push({token:digest(value),sessionId,expires:Date.now()+604800000});
        try{await workos.userManagement.revokeSession({sessionId});}catch(error){if(![400,404].includes(error.status))console.error('WorkOS session revocation is temporarily unavailable. The website session has been blocked.');}
      }
    }
    setCookie(res, 'dss_workos', '', 0); setCookie(res, 'dss_auth_flow', '', 0); setCookie(res, 'dss_session', '', 0);
    return origin + '/?signedOut=1';
  }
  return { enabled, identity, route, logout, admins };
}
module.exports = { createAuth };
