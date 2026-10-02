'use strict';
const crypto=require('node:crypto'),scrypt=require('node:util').promisify(crypto.scrypt);
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
function createAdminAuth({env=process.env}={}){
 const username=(env.ADMIN_USERNAME||'').trim().toLowerCase(),stored=env.ADMIN_PASSWORD_HASH||'';
 const enabled=!!username && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored);
 const configHash=digest(username+':'+stored);
 function token(req){return /(?:^|;\s*)dss_admin=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];}
 function cookie(res,value,clear=false){const old=res.getHeader('Set-Cookie')||[];res.setHeader('Set-Cookie',[...(Array.isArray(old)?old:[old]),`dss_admin=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${clear?0:3600}${env.VERCEL||env.NODE_ENV==='production'?'; Secure':''}`]);}
 function identity(state,req){
  if(!enabled)return null;
  const value=token(req),session=value&&state.sessions.find(s=>s.scope==='private-admin'&&s.token===digest(value)&&s.configHash===configHash&&s.expires>Date.now());
  return session?state.users.find(u=>u.id===session.userId&&u.managedAdmin===true&&u.role==='admin'&&u.status==='approved')||null:null;
 }
 async function signIn(state,req,res,input){
  if(!enabled)return {status:503,error:'Administrator sign-in is not configured.'};
  const ip=env.VERCEL?(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket.remoteAddress):req.socket.remoteAddress;
  const fingerprint=digest(String(ip)),now=Date.now();
  state.adminLoginAttempts=(state.adminLoginAttempts||[]).filter(a=>a.until>now).slice(-4096);
  let attempt=state.adminLoginAttempts.find(a=>a.fingerprint===fingerprint);
  if(attempt?.count>=8)return {status:429,error:'Too many attempts. Please try again in 15 minutes.'};
  const [salt,key]=stored.split(':'),actual=await scrypt(String(input.password||'').slice(0,128),salt,64);
  const valid=crypto.timingSafeEqual(Buffer.from(key,'hex'),actual)&&String(input.username||'').trim().toLowerCase()===username;
  if(!valid){if(!attempt){attempt={fingerprint,count:0,until:now+900000};state.adminLoginAttempts.push(attempt);}attempt.count++;return {status:401,error:'Your administrator sign-in details are incorrect.'};}
  state.adminLoginAttempts=state.adminLoginAttempts.filter(a=>a.fingerprint!==fingerprint);
  let user=state.users.find(u=>u.managedAdmin===true);
  if(!user){user={id:crypto.randomUUID(),name:'Society administrator',email:env.ADMIN_EMAIL||'administrator@dss.local',managedAdmin:true,role:'admin',status:'approved',profile:{},createdAt:new Date().toISOString()};state.users.push(user);}
  const value=crypto.randomBytes(32).toString('hex');
  state.sessions=state.sessions.filter(s=>s.expires>now && !(s.scope==='private-admin'&&s.userId===user.id));
  state.sessions.push({token:digest(value),scope:'private-admin',configHash,userId:user.id,expires:now+3600000});cookie(res,value);
  return {status:200,user};
 }
 function signOut(state,req,res){const value=token(req);state.sessions=state.sessions.filter(s=>!(s.scope==='private-admin'&&s.token===digest(value||'')));cookie(res,'',true);}
 return {enabled,identity,signIn,signOut};
}
module.exports={createAdminAuth};
