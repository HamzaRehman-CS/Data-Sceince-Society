'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const fsp = fs.promises, scrypt = require('node:util').promisify(crypto.scrypt), { gzipSync } = require('node:zlib');
const ROOT = __dirname, DATA = process.env.DSS_DATA_DIR || path.join(ROOT, '.private');
fs.mkdirSync(DATA, { recursive: true });
const DB = path.join(DATA, 'database.json'), clone = v => structuredClone(v);
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'sanity-data.json'), 'utf8'));
seed.pages ||= {}; seed.blocks ||= {}; seed.announcements ||= [];
seed.collections.navigation ||= ['index:Home','about:About','research:Research','projects:Projects','events:Events','blog:Blog','resources:Resources','community:Community','join:Join us','contact:Contact','member-dashboard:My dashboard'].map(value => { const [page,title]=value.split(':'); return {id:'nav-'+page,title,link:page+'.html',requiresAuth:false}; });
seed.collections.announcements ||= [];
seed.portal ||= { loginHeading: 'Welcome back.', loginDescription: 'Your people. Your projects. Your next possibility.', studentDescription: 'Your space to learn, build and connect with students across Pakistan.', ambassadorDescription: 'Lead your campus. Share opportunities. Help your community grow.' };
for (const [key, records] of Object.entries(seed.collections || {})) records.forEach((record, i) => { record.id ??= `${key}-${i + 1}`; });
let db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, 'utf8')) : { users: [], sessions: [], inquiries: [], registrations: [], bookmarks: [], activities: [], audit: [], uploads: [], content: clone(seed), draft: clone(seed), revision: 1, publishedRevision: 1, history: [] };
// Upgrade only untouched design defaults; preserve accounts, drafts and custom copy.
const designDefaults=JSON.parse(fs.readFileSync(path.join(ROOT,'website/design-defaults.json'),'utf8'));
function upgradeDesign(content){
  const professionalBios=[
    'Leads the society’s direction and brings teams together around learning, collaboration and meaningful student projects.',
    'Supports team leads and coordinates programmes that help members turn ideas into shared learning experiences.',
    'Keeps society planning, communications and documentation organised so every team can contribute effectively.',
    'Coordinates workshops, meetups and society events, from programme planning to the member experience.',
    'Builds relationships and communicates opportunities that connect the society with its wider community.',
    'Shares society news, learning opportunities and member stories across the society’s digital channels.',
    'Shapes the visual identity of society activities and creates welcoming, consistent experiences for members.',
    'Supports event logistics, venue preparation and on-the-day coordination for society activities.',
    'Builds and maintains the society’s digital experience, helping members find information and stay connected.'
  ];
  for(const member of content.collections?.team||[]){const index=seed.collections.team.findIndex(original=>String(original.id)===String(member.id)&&original.name===member.name);if(index>=0&&member.bio===seed.collections.team[index].bio)member.bio=professionalBios[index]||member.bio;}
  if(content._designVersion===2)return;
  for(const group of ['heroSection','pillars']){content[group] ||= {};for(const [key,value] of Object.entries(designDefaults.next[group]))if(content[group][key]===undefined||content[group][key]===designDefaults.previous[group][key])content[group][key]=value;}
  content.pageHeaders ||= {};content.pageHeaders.about ||= {};
  for(const [key,value] of Object.entries(designDefaults.next.about))if(content.pageHeaders.about[key]===undefined||content.pageHeaders.about[key]===designDefaults.previous.about[key])content.pageHeaders.about[key]=value;
  if(!Array.isArray(content.banners)){const old=content.bannerSettings||{};const unchanged=old.bannerText===seed.bannerSettings?.bannerText;content.banners=old.bannerText?[{id:'membership-announcement',label:unchanged?'Applications open':old.badgeText||'Society update',text:unchanged?'Your next chapter starts here. DSS membership applications are open.':old.bannerText,cta:unchanged?'Find your place':old.ctaText||'Learn more',link:unchanged?'join.html':old.targetPage==='custom'?old.customUrl:old.targetPage||'events.html',active:old.bannerActive!==false,placement:'top',tone:'mint',pages:'all',startsAt:'',endsAt:''}]:[];}
  content.theme ||= {};content.theme.canvasEnabled ??= true;content.theme.canvasOpacity ??= '65';content._designVersion=2;
}
upgradeDesign(db.content);upgradeDesign(db.draft);
// Migrate only untouched defaults; custom content and page edits take precedence.
const refreshDefaults = JSON.parse(fs.readFileSync(path.join(ROOT, 'website/identity-defaults.json'), 'utf8'));
function refreshIdentity(content) {
  if (content._identityVersion === 3) return;
  const localEvents = [
    {title:'Python & Data: The First Notebook',type:'Beginner workshop',loc:'Online · Pakistan',date:'Schedule to be announced',desc:'A practical introduction to Python, notebooks, and exploring your first dataset. Programme details will be announced by the society.'},
    {title:'Build for Pakistan: A Data Challenge',type:'Community challenge',loc:'Pakistan · Format to be announced',date:'Schedule to be announced',desc:'Explore how data can help answer questions that matter to communities in Pakistan. The society will share the brief and schedule here.'},
    {title:'The DSS Community Meetup',type:'Community meetup',loc:'Pakistan · Venue to be announced',date:'Schedule to be announced',desc:'Meet fellow learners, exchange project ideas, and hear from the community. Watch this space for confirmed details.'},
    {title:'From Dataset to Dashboard',type:'Practical workshop',loc:'Online · Pakistan',date:'Schedule to be announced',desc:'Learn to ask useful questions, explore a dataset, and communicate your findings. Session details will be confirmed by the society.'}
  ];
  for (const event of content.collections?.events || []) {
    const index=seed.collections.events.findIndex(e=>String(e.id)===String(event.id));
    if(index<0 || !localEvents[index])continue;
    for(const [key,value] of Object.entries(localEvents[index]))if(event[key]===seed.collections.events[index][key])event[key]=value;
  }
  for (const [group, fields] of Object.entries(refreshDefaults)) {
    content[group] ||= {};
    for (const [key, value] of Object.entries(fields)) {
      if (group === 'pageHeaders') {
        content[group][key] ||= {};
        for (const [field, text] of Object.entries(value)) if (!content[group][key][field] || content[group][key][field] === seed[group]?.[key]?.[field] || content[group][key][field] === designDefaults.next[key]?.[field]) content[group][key][field] = text;
      } else if (content[group][key] === undefined || content[group][key] === seed[group]?.[key] || content[group][key] === designDefaults.next[group]?.[key] || content[group][key] === 'One account for students, ambassadors, and administrators.') content[group][key] = value;
    }
  }
  content._identityVersion = 3;
}
refreshIdentity(db.content); refreshIdentity(db.draft);
const visualDefaults = JSON.parse(fs.readFileSync(path.join(ROOT,'website/visual-defaults.json'),'utf8'));
function upgradeVisual(content) {
  if(content._visualVersion===4)return;
  for(const [group,values]of Object.entries(visualDefaults)){
    content[group] ||= {};
    for(const [key,value]of Object.entries(values)){
      if(group==='pageHeaders'){
        content[group][key] ||= {};
        for(const [field,text]of Object.entries(value))if(!content[group][key][field]||content[group][key][field]===refreshDefaults[group]?.[key]?.[field])content[group][key][field]=text;
      }else if(group==='theme'||content[group][key]===undefined||content[group][key]===refreshDefaults[group]?.[key]||content[group][key]===designDefaults.next[group]?.[key]||content[group][key]===seed[group]?.[key])content[group][key]=value;
    }
  }
  content.collections.opportunities ||= [];
  content._visualVersion=4;
}
upgradeVisual(db.content);upgradeVisual(db.draft);
db.contributions ||= [];
for(const user of db.users)if(user.role==='student'&&user.status==='pending')user.role='member';
if (!db.users.some(u => u.role === 'admin') && process.env.DSS_MANUAL_SETUP !== '1') {
  const salt = crypto.randomBytes(16).toString('hex');
  db.users.push({ id: crypto.randomUUID(), username: 'admin', name: 'Society administrator', email: 'admin@dss.local', password: salt + ':' + crypto.scryptSync('pass', salt, 64).toString('hex'), role: 'admin', status: 'approved', createdAt: new Date().toISOString() });
  fs.writeFileSync(DB, JSON.stringify(db, null, 2), { mode: 0o600 });
}
const tokenFile = path.join(DATA, 'setup-token');
let setupToken = '';
if (!db.users.some(u => u.role === 'admin')) {
  setupToken = fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, 'utf8') : crypto.randomBytes(24).toString('hex');
  fs.writeFileSync(tokenFile, setupToken, { mode: 0o600 });
}
let queue = Promise.resolve();
function mutate(fn) {
  const run = queue.then(async () => {
    const before = clone(db);
    try { const value = await fn(); await fsp.writeFile(DB + '.tmp', JSON.stringify(db, null, 2), { mode: 0o600 }); await fsp.rename(DB + '.tmp', DB); return value; }
    catch (error) { db = before; throw error; }
  }); queue = run.catch(() => {}); return run;
}
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function clean(value, max = 2000) { return String(value ?? '').trim().slice(0, max); }
function email(value) { const result = clean(value, 254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'Enter a valid email address.'); return result; }
function validateAmbassador(profile, consent) {
  for (const key of ['university','studentId','major','phone','city','province','semester','cnic','pitch','availability']) if (!profile[key]) fail(400, 'Complete all required ambassador application fields.');
  if (!/^(?:\+92|0)3\d{9}$/.test(profile.phone.replace(/[\s-]/g, ''))) fail(400, 'Enter a Pakistani mobile number, such as 03001234567.');
  if (!/^\d{5}-?\d{7}-?\d$/.test(profile.cnic)) fail(400, 'Enter your 13-digit CNIC or B-form number.');
  if (profile.pitch.length < 30) fail(400, 'Tell us about your campus plan in at least 30 characters.');
  if (profile.portfolio && !/^https?:\/\//.test(profile.portfolio)) fail(400, 'Use a full website URL for your portfolio.');
  if (consent !== true) fail(400, 'Confirm your consent to application review.');
  profile.consentAt = new Date().toISOString();
}
function safeURL(value) { return !value || /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#|[a-z0-9_-]+\.html(?:[?#]|$))/i.test(value) && !/[\x00-\x20<>"'\\]/.test(value); }
const collections = ['blogs', 'papers', 'events', 'projects', 'resources', 'team', 'stats', 'navigation', 'announcements', 'opportunities'];
const pages = ['index', 'about', 'research', 'projects', 'events', 'blog', 'resources', 'community', 'join', 'ambassador', 'opportunities', 'contact', 'login', 'member-dashboard'];
function validateContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) fail(400, 'Invalid content.');
  if(!Array.isArray(content.banners)||content.banners.length>20)fail(400,'Use a banner list of at most 20 items.');
  const bannerIds=new Set();for(const banner of content.banners){
    if(!banner||typeof banner.id!=='string'||bannerIds.has(banner.id)||!['top','floating'].includes(banner.placement)||!['mint','sky','amber','rose'].includes(banner.tone)||typeof banner.active!=='boolean')fail(400,'Invalid banner settings.');bannerIds.add(banner.id);
    if(!clean(banner.text))fail(400,'A banner needs announcement text.');
    for(const key of ['startsAt','endsAt'])if(banner[key]&&!Number.isFinite(Date.parse(banner[key])))fail(400,'Invalid banner schedule.');
    if(banner.startsAt&&banner.endsAt&&Date.parse(banner.endsAt)<=Date.parse(banner.startsAt))fail(400,'Banner end must be after its start.');
    if(String(banner.pages||'all').split(',').some(p=>!['all',...pages].includes(p.trim())))fail(400,'Choose valid page names for your banner.');
  }
  for(const key of ['accent','sky','bg','surface','ink','muted','deep','line'])if(content.theme?.[key]&&!/^#[0-9a-f]{6}$/i.test(content.theme[key]))fail(400,`Use a six-digit hex color for ${key}, such as #176b51.`);
  for (const key of collections) {
    if (!Array.isArray(content.collections?.[key]) || content.collections[key].length > 500) fail(400, `Invalid ${key} collection.`);
    const ids = new Set(); for (const item of content.collections[key]) {
      if (!item || !['string', 'number'].includes(typeof item.id) || ids.has(String(item.id))) fail(400, 'Every record needs a unique ID.'); ids.add(String(item.id));
    }
  }
  function visit(value, depth = 0) {
    if (depth > 12) fail(400, 'Content is too deeply nested.'); if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) fail(400, 'Invalid field.');
      if (typeof child === 'string' && child.length > 50000) fail(400, 'A field is too long.');
      if ((/(?:link|url|image|src|href)$/i.test(key) || key === 'targetPage' && child !== 'custom') && typeof child === 'string' && !safeURL(child)) fail(400, `Use a safe web address for ${key}.`);
      visit(child, depth + 1);
    }
  } visit(content);
  for (const [name, fields] of Object.entries(content.pages || {})) {
    if (!pages.includes(name) || !fields || typeof fields !== 'object') fail(400, 'Invalid page.');
    for (const [id, props] of Object.entries(fields)) {
      if (!/^cms-[a-z0-9-]+$/.test(id) || !props || typeof props !== 'object') fail(400, 'Invalid page element.');
      if (Object.keys(props).some(k => !['text', 'href', 'src', 'alt', 'hidden'].includes(k))) fail(400, 'Invalid page property.');
    }
  }
}
function publicUser(u) { const { password, passwordReset, ...safe } = u; return safe; }
async function hash(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) fail(400, 'Use a password of 10–128 characters.');
  const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`;
}
async function verify(password, stored) { const [salt, key] = stored.split(':'); return crypto.timingSafeEqual(Buffer.from(key, 'hex'), await scrypt(String(password).slice(0, 128), salt, 64)); }
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function currentUser(req) {
  const cookie = /(?:^|;\s*)dss_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
  const session = cookie && db.sessions.find(s => s.token === digest(cookie) && s.expires > Date.now()); return session ? db.users.find(u => u.id === session.userId) : null;
}
function authorize(req, role) {
  const user = currentUser(req); if (!user) fail(401, 'Please sign in.');
  if (role === 'admin' && (user.role !== 'admin' || user.status !== 'approved')) fail(403, 'Administrator access required.');
  if (role === 'approved' && user.status !== 'approved') fail(403, 'Your application must be approved first.'); return user;
}
function sessionCookie(res, value, clear = false) { res.setHeader('Set-Cookie', `dss_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${clear ? 0 : 604800}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`); }
function newSession(user, res) { const value = crypto.randomBytes(32).toString('hex'); db.sessions = db.sessions.filter(s => s.expires > Date.now()); db.sessions.push({ token: digest(value), userId: user.id, expires: Date.now() + 604800000 }); sessionCookie(res, value); }
function audit(user, action) { db.audit.unshift({ id: crypto.randomUUID(), actor: user.email, action, date: new Date().toISOString() }); db.audit = db.audit.slice(0, 500); }
const limits = new Map();
function rateLimit(req, scope, maximum = 12) {
  const key = scope + req.socket.remoteAddress, now = Date.now();
  if (limits.size > 5000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
  let entry = limits.get(key); if (!entry || entry.until < now) { entry = { count: 0, until: now + 900000 }; limits.set(key, entry); }
  if (++entry.count > maximum) fail(429, 'Too many attempts. Please try again in 15 minutes.');
}
async function body(req) {
  let size = 0; const chunks = []; for await (const chunk of req) { size += chunk.length; if (size > 15 * 1024 * 1024) fail(413, 'Maximum request size is 15 MB.'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { fail(400, 'Invalid JSON request.'); }
}
function json(res, data, code = 200) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function visibleContent(user) {
  const content = clone(db.content);
  if(!['admin','member','ambassador'].includes(user?.role)||user?.status!=='approved')content.collections.opportunities=[];
  if (user?.status !== 'approved') for (const key of collections) content.collections[key] = content.collections[key].map(record => {
    if (record.requiresAuth === false || ['team', 'stats'].includes(key)) return record;
    const { link, fileUrl, fileName, ...safe } = record; return safe;
  }); return { ...content, _revision: db.publishedRevision };
}
const streams = new Set();
function broadcast() { for (const res of streams) res.write(`data: ${db.publishedRevision}\n\n`); }
function requireRevision(value) { if (value !== db.revision) fail(409, 'Someone else changed the draft. Reload before saving.'); }
function recordExists(collection, id) { return db.content.collections[collection]?.find(x => String(x.id) === String(id)); }
async function api(req, res, url) {
  const route = url.pathname, method = req.method;
  if (!['GET', 'HEAD'].includes(method)) {
    const origin = req.headers.origin, expected = process.env.PUBLIC_ORIGIN || `http://${req.headers.host}`;
    if ((origin && origin !== expected) || req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'Request origin is not allowed.');
    if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Use application/json.');
  }
  if (route === '/api/auth/me' && method === 'GET') return json(res, { user: currentUser(req) ? publicUser(currentUser(req)) : null, setupRequired: !db.users.some(u => u.role === 'admin') });
  if (route === '/api/auth/setup' && method === 'POST') {
    rateLimit(req, 'setup'); const input = await body(req), password = await hash(input.password);
    await mutate(() => {
      if (!setupToken || db.users.some(u => u.role === 'admin') || input.token !== setupToken) fail(403, 'Use the one-time setup link printed by the server.');
      const user = { id: crypto.randomUUID(), name: clean(input.name, 100) || 'Administrator', email: email(input.email), password, role: 'admin', status: 'approved', createdAt: new Date().toISOString() };
      if (db.users.some(u => u.email === user.email)) fail(409, 'This email already has an account.'); db.users.push(user); newSession(user, res); audit(user, 'Created administrator account');
    }); setupToken = ''; await fsp.rm(tokenFile, { force: true }); return json(res, { success: true });
  }
  if (route === '/api/auth/register' && method === 'POST') {
    rateLimit(req, 'register', 20); const input = await body(req), address = email(input.email), name = clean(input.name, 100);
    if (!name) fail(400, 'Enter your full name.'); const password = await hash(input.password), profile = {};
    for (const key of ['university', 'studentId', 'major', 'phone', 'interest', 'motivation', 'campusSize', 'focus', 'certifications', 'pitch', 'city', 'province', 'semester', 'cnic', 'experience', 'availability', 'portfolio']) profile[key] = clean(input[key]);
    if (input.role === 'ambassador') validateAmbassador(profile, input.consent);
    await mutate(() => {
      if (db.users.some(u => u.email === address)) fail(409, 'This email already has an account. Please sign in.');
      const user = { id: crypto.randomUUID(), email: address, name, password, role: input.role === 'ambassador' ? 'ambassador' : input.membershipApplication === true ? 'member' : 'student', status: input.role === 'ambassador' || input.membershipApplication === true ? 'pending' : 'approved', profile, reviewNote: '', createdAt: new Date().toISOString() }; db.users.push(user); newSession(user, res);
    }); return json(res, { success: true }, 201);
  }
  if (route === '/api/auth/login' && method === 'POST') {
    rateLimit(req, 'login', 30); const input = await body(req), identifier = clean(input.email || input.username).toLowerCase(), user = db.users.find(u => u.email === identifier || u.username === identifier);
    if (!user || !await verify(input.password, user.password)) fail(401, 'Your sign-in details are incorrect.');
    await mutate(() => newSession(user, res)); return json(res, { user: publicUser(user) });
  }
  if (route === '/api/auth/logout' && method === 'POST') {
    const cookie = /(?:^|;\s*)dss_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
    await mutate(() => { db.sessions = db.sessions.filter(s => s.token !== digest(cookie || '')); }); sessionCookie(res, '', true); return json(res, { success: true });
  }
  if (route === '/api/auth/password' && method === 'POST') {
    rateLimit(req, 'password'); const user = authorize(req), input = await body(req);
    if (!await verify(input.currentPassword, user.password)) fail(400, 'Current password is incorrect.'); const password = await hash(input.password);
    await mutate(() => { user.password = password; db.sessions = db.sessions.filter(s => s.userId !== user.id); newSession(user, res); }); return json(res, { success: true });
  }
  if (route === '/api/sanity-content' && method === 'GET') return json(res, visibleContent(currentUser(req)));
  if (route === '/api/changes' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`data: ${db.publishedRevision}\n\n`); streams.add(res); req.on('close', () => streams.delete(res)); return;
  }
  if (route === '/api/admin/content' && method === 'GET') { authorize(req, 'admin'); return json(res, { draft: db.draft, revision: db.revision, publishedRevision: db.publishedRevision, history: db.history.map(({ content, ...h }) => h) }); }
  if (route === '/api/admin/content' && method === 'PUT') {
    const user = authorize(req, 'admin'), input = await body(req); validateContent(input.content);
    await mutate(() => { requireRevision(input.revision); db.draft = input.content; db.revision++; audit(user, 'Saved website draft'); }); return json(res, { revision: db.revision });
  }
  if (route === '/api/admin/publish' && method === 'POST') {
    const user = authorize(req, 'admin'), input = await body(req);
    await mutate(() => {
      requireRevision(input.revision); validateContent(db.draft); db.history.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), actor: user.email, content: clone(db.content) }); db.history = db.history.slice(0, 20);
      db.content = clone(db.draft); db.publishedRevision++; audit(user, 'Published website');
    }); broadcast(); return json(res, { success: true });
  }
  if (route === '/api/admin/restore' && method === 'POST') {
    const user = authorize(req, 'admin'), input = await body(req);
    await mutate(() => { requireRevision(input.revision); const version = db.history.find(h => h.id === input.id); if (!version) fail(404, 'Version not found.'); db.draft = clone(version.content); upgradeDesign(db.draft); upgradeVisual(db.draft); db.revision++; audit(user, 'Restored earlier version to draft'); }); return json(res, { success: true });
  }
  if (route === '/api/admin/overview' && method === 'GET') { authorize(req, 'admin'); return json(res, { users: db.users.map(publicUser), inquiries: db.inquiries, activities: db.activities, contributions: db.contributions, registrations: db.registrations, audit: db.audit, uploads: db.uploads }); }
  if (route === '/api/admin/reset-password' && method === 'POST') {
    const admin = authorize(req, 'admin'), input = await body(req), token = crypto.randomBytes(32).toString('hex');
    await mutate(() => { const user = db.users.find(u => u.id === input.id); if (!user || user.role === 'admin') fail(400, 'Choose a member account.'); user.passwordReset = { token: digest(token), expires: Date.now() + 3600000 }; audit(admin, 'Created password reset link for ' + user.email); });
    return json(res, { url: '/login.html?reset=' + token });
  }
  if (route === '/api/auth/reset-password' && method === 'POST') {
    rateLimit(req, 'reset'); const input = await body(req), password = await hash(input.password);
    await mutate(() => { const user = db.users.find(u => u.passwordReset?.token === digest(String(input.token || '')) && u.passwordReset.expires > Date.now()); if (!user) fail(400, 'This reset link is invalid or expired. Ask the team for a new one.'); user.password = password; delete user.passwordReset; db.sessions = db.sessions.filter(s => s.userId !== user.id); });
    return json(res, { success: true });
  }
  if (route === '/api/admin/users' && method === 'PATCH') {
    const admin = authorize(req, 'admin'), input = await body(req);
    await mutate(() => {
      const user = db.users.find(u => u.id === input.id); if (!user) fail(404, 'Account not found.'); if (user.role === 'admin') fail(400, 'Administrator accounts cannot be changed here.');
      if (!['pending', 'approved', 'rejected', 'suspended'].includes(input.status) || !['student', 'member', 'ambassador'].includes(input.role)) fail(400, 'Invalid role or status.');
      Object.assign(user, { status: input.status, role: input.role, reviewNote: clean(input.reviewNote), reviewedAt: new Date().toISOString() }); audit(admin, `Updated account ${user.email}: ${user.role}, ${user.status}`);
      if (user.ambassadorApplication?.status === 'pending' && input.applicationDecision) {
        if (!['approved','rejected'].includes(input.applicationDecision)) fail(400, 'Choose a valid application decision.');
        user.ambassadorApplication.status = input.applicationDecision; user.ambassadorApplication.reviewNote=clean(input.reviewNote);
        if (input.applicationDecision === 'approved') { user.role = 'ambassador'; user.profile = { ...user.profile, ...user.ambassadorApplication.profile }; }
      }
      if(user.membershipApplication?.status==='pending'&&input.membershipDecision){
        if(!['approved','rejected'].includes(input.membershipDecision))fail(400,'Choose a valid membership decision.');
        user.membershipApplication.status=input.membershipDecision;
        user.membershipApplication.reviewNote=clean(input.reviewNote);
        if(input.membershipDecision==='approved'){user.role='member';user.profile={...user.profile,...user.membershipApplication.profile};}
      }
    }); broadcast(); return json(res, { success: true });
  }
  if (route === '/api/contact' && method === 'POST') {
    rateLimit(req, 'contact'); const input = await body(req), inquiry = { id: crypto.randomUUID(), name: clean(input.name, 100), email: email(input.email), message: clean(input.message, 10000), status: 'new', date: new Date().toISOString() };
    if (!inquiry.name || !inquiry.message) fail(400, 'Please complete all fields.'); await mutate(() => db.inquiries.unshift(inquiry)); return json(res, { success: true }, 201);
  }
  if (route === '/api/admin/inquiry' && method === 'PATCH') {
    const user = authorize(req, 'admin'), input = await body(req);
    await mutate(() => { const inquiry = db.inquiries.find(i => i.id === input.id); if (!inquiry) fail(404, 'Inquiry not found.'); inquiry.status = input.status === 'resolved' ? 'resolved' : 'new'; audit(user, 'Updated inquiry status'); }); return json(res, { success: true });
  }
  if (route === '/api/member' && method === 'GET') { const user = authorize(req); return json(res, { user: publicUser(user), registrations: db.registrations.filter(r => r.userId === user.id), bookmarks: db.bookmarks.filter(r => r.userId === user.id), activities: db.activities.filter(a => a.userId === user.id), contributions:db.contributions.filter(c=>c.userId===user.id), content: user.status === 'approved' ? visibleContent(user) : null }); }
  if(route==='/api/member/membership-application'&&method==='POST'){
    const user=authorize(req,'approved'),input=await body(req);
    if(user.role!=='student')fail(403,'This application is for student accounts.');
    if(user.membershipApplication?.status==='pending')fail(409,'Your membership application is already under review.');
    const profile={university:clean(input.university),interest:clean(input.interest),motivation:clean(input.motivation)};
    if(!profile.university||!profile.interest||profile.motivation.length<20)fail(400,'Add your institution, interests, and a short introduction of at least 20 characters.');
    await mutate(()=>{user.membershipApplication={status:'pending',profile,submittedAt:new Date().toISOString()};});return json(res,{success:true},201);
  }
  if(route==='/api/member/contribution'&&method==='POST'){
    const user=authorize(req,'approved'),input=await body(req);
    if(!['member','ambassador'].includes(user.role))fail(403,'Society membership is required.');
    const title=clean(input.title,150),description=clean(input.description,5000),link=clean(input.link);
    if(!title||description.length<20||!safeURL(link))fail(400,'Add a title, at least 20 characters describing your contribution, and a valid optional link.');
    await mutate(()=>db.contributions.unshift({id:crypto.randomUUID(),userId:user.id,name:user.name,title,description,link,status:'pending',reviewNote:'',date:new Date().toISOString()}));return json(res,{success:true},201);
  }
  if(route==='/api/admin/contribution'&&method==='PATCH'){
    const admin=authorize(req,'admin'),input=await body(req);
    if(!['pending','approved','rejected'].includes(input.status))fail(400,'Invalid review status.');
    await mutate(()=>{const c=db.contributions.find(c=>c.id===input.id);if(!c)fail(404,'Contribution not found.');c.status=input.status;c.reviewNote=clean(input.reviewNote);audit(admin,'Reviewed contribution: '+c.title);});broadcast(); return json(res,{success:true});
  }
  if (route === '/api/member/profile' && method === 'PUT') {
    const user = authorize(req), input = await body(req), name = clean(input.name, 100); if (!name) fail(400, 'Name is required.');
    await mutate(() => { user.name = name; user.profile ||= {}; for (const key of ['university', 'studentId', 'major', 'interest']) user.profile[key] = clean(input[key]); }); broadcast(); return json(res, { success: true });
  }
  if (route === '/api/member/ambassador-application' && method === 'POST') {
    const user = authorize(req, 'approved'), input = await body(req);
    if (!['student','member'].includes(user.role)) fail(400, 'Only students and members can apply here.');
    if (user.ambassadorApplication?.status === 'pending') fail(409, 'Your application is already under review.');
    const profile = {};
    for (const key of ['university','studentId','major','phone','city','province','semester','cnic','pitch','experience','availability','portfolio']) profile[key] = clean(input[key]);
    validateAmbassador(profile, input.consent);
    await mutate(() => { user.ambassadorApplication = { profile, status: 'pending', submittedAt: new Date().toISOString() }; });
    return json(res, { success: true }, 201);
  }
  if (route === '/api/member/register-event' && method === 'POST') {
    const user = authorize(req, 'approved'), input = await body(req), event = recordExists('events', input.id); if (!event) fail(404, 'Event no longer available.');
    if (!input.cancel && event.startDate && new Date(event.startDate+'T23:59:59+05:00').getTime() < Date.now()) fail(400, 'Registration for this event has closed.');
    await mutate(() => { db.registrations = db.registrations.filter(r => !(r.userId === user.id && String(r.eventId) === String(input.id))); if (!input.cancel) db.registrations.push({ id: crypto.randomUUID(), userId: user.id, eventId: event.id, title: event.title, date: new Date().toISOString() }); }); return json(res, { success: true });
  }
  if (route === '/api/member/bookmark' && method === 'POST') {
    const user = authorize(req, 'approved'), input = await body(req); if (!['papers', 'resources', 'projects', 'blogs'].includes(input.collection) || !recordExists(input.collection, input.id)) fail(404, 'Resource not found.');
    await mutate(() => { db.bookmarks = db.bookmarks.filter(b => !(b.userId === user.id && b.collection === input.collection && String(b.recordId) === String(input.id))); if (!input.remove) db.bookmarks.push({ userId: user.id, collection: input.collection, recordId: input.id }); }); return json(res, { success: true });
  }
  if (route === '/api/member/activity' && method === 'POST') {
    const user = authorize(req, 'approved'); if (user.role !== 'ambassador') fail(403, 'Ambassador access required.'); const input = await body(req), title = clean(input.title, 150), description = clean(input.description, 5000);
    if (!title || !description || !/^\d{4}-\d{2}-\d{2}$/.test(input.date || '') || !Number.isFinite(Date.parse(input.date)) || !safeURL(input.link || '')) fail(400, 'Enter a title, description, date, and valid evidence link.');
    await mutate(() => db.activities.unshift({ id: crypto.randomUUID(), userId: user.id, name: user.name, university: user.profile?.university || '', title, description, date: input.date, attendees: Math.max(0, Math.min(100000, Number(input.attendees) || 0)), link: clean(input.link), status: 'pending', reviewNote: '' })); return json(res, { success: true }, 201);
  }
  if (route === '/api/admin/activity' && method === 'PATCH') {
    const user = authorize(req, 'admin'), input = await body(req); if (!['approved', 'rejected', 'pending'].includes(input.status)) fail(400, 'Invalid review status.');
    await mutate(() => { const activity = db.activities.find(a => a.id === input.id); if (!activity) fail(404, 'Activity not found.'); activity.status = input.status; activity.reviewNote = clean(input.reviewNote); audit(user, `Reviewed activity: ${activity.title}`); }); broadcast(); return json(res, { success: true });
  }
  if (route === '/api/upload-file' && method === 'POST') {
    const user = authorize(req, 'admin'), input = await body(req), ext = path.extname(clean(input.fileName, 150)).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.zip', '.docx', '.pptx', '.csv', '.ipynb', '.txt'].includes(ext)) fail(400, 'Unsupported file type.');
    const file = Buffer.from(String(input.fileData || '').split(',').pop(), 'base64'); if (!file.length || file.length > 10 * 1024 * 1024) fail(400, 'Choose a file up to 10 MB.');
    const signatures = { '.png': '89504e470d0a1a0a', '.jpg': 'ffd8ff', '.jpeg': 'ffd8ff', '.gif': '47494638', '.pdf': '25504446', '.zip': '504b', '.docx': '504b', '.pptx': '504b', '.webp': '52494646' };
    if (signatures[ext] && !file.toString('hex').startsWith(signatures[ext])) fail(400, 'File content does not match its extension.');
    const name = crypto.randomUUID() + ext, dir = path.join(DATA, 'uploads'); await fsp.mkdir(dir, { recursive: true }); await fsp.writeFile(path.join(dir, name), file);
    const upload = { url: '/uploads/' + name, fileName: clean(input.fileName, 150), fileSize: `${(file.length / 1024).toFixed(1)} KB`, public: input.public === true, date: new Date().toISOString() };
    await mutate(() => { db.uploads.unshift(upload); audit(user, 'Uploaded ' + upload.fileName); }); return json(res, { success: true, ...upload }, 201);
  }
  fail(404, 'Endpoint not found.');
}
const MIME = { '.woff2':'font/woff2', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf', '.zip': 'application/zip' }, fileCache = new Map();
async function serve(req, res, url) {
  let route; try { route = decodeURIComponent(url.pathname); } catch { fail(400, 'Invalid URL.'); }
  if (route === '/' || route === '') route = '/index.html';
  if (route === '/admin-login.html') { res.writeHead(302, { Location: '/login.html' }); return res.end(); }
  if (route.startsWith('/studio')) { res.writeHead(302, { Location: '/admin.html' }); return res.end(); }
  if (!path.extname(route)) route += '.html'; let file;
  if (route.startsWith('/uploads/')) {
    const name = path.basename(route); if (route !== '/uploads/' + name) fail(403, 'Forbidden.');
    const user = currentUser(req), refs = collections.flatMap(k => db.content.collections[k]).filter(r => r.fileUrl === route), uploaded = db.uploads.find(u => u.url === route);
    const allowed = user?.status === 'approved' || (refs.length ? refs.every(r => r.requiresAuth === false) : uploaded?.public === true);
    if (!allowed) fail(403, 'Approved membership is required to download this file.');
    file = uploaded ? path.join(DATA, 'uploads', name) : path.join(ROOT, 'uploads', name); res.setHeader('Cache-Control', 'private, no-store');
    if (!/\.(png|jpe?g|gif|webp)$/i.test(name)) res.setHeader('Content-Disposition', 'attachment');
  } else {
    const routes=Object.fromEntries(pages.map(p=>['/'+p+'.html',(['login','member-dashboard'].includes(p)?'accounts/':'website/pages/')+p+'.html']));
    Object.assign(routes,{'/admin.html':'admin/index.html','/build.html':'admin/index.html','/app.js':'website/scripts/app.js','/sanity-client.js':'website/scripts/content.js','/style.css':'website/styles/base.css','/portal.js':'admin/portal.js','/portal.css':'admin/portal.css'});
    for(const asset of ['assets/dss-mark.svg','assets/fonts/inter-latin.woff2','accounts/workspace.css','website/styles/blueprint.css','website/styles/page-motion.css','website/scripts/page-motion.js','website/scripts/catalog.js','website/scripts/data-surface.js','assets/tailwind.css','assets/lucide.js','website/styles/society.css','website/styles/identity.css','website/scripts/identity.js','website/scripts/background.js','website/scripts/banners.js','website/scripts/society.js','website/scripts/editor-bridge.js','admin/editor.js','admin/banners.js'])routes['/'+asset]=asset;
    if(!routes[route])fail(404,'Page not found.');file=path.join(ROOT,routes[route]);
  }
  let stat; try { stat = await fsp.stat(file); } catch { fail(404, 'File not found.'); }
  const ext = path.extname(file), compress = ['.html', '.js', '.css'].includes(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || ''), etag = `"${stat.size}-${stat.mtimeMs}-${compress ? 'gz' : 'raw'}"`;
  res.setHeader('ETag', etag); res.setHeader('Vary', 'Accept-Encoding'); if (!res.hasHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(); }
  let cached = fileCache.get(file); if (!cached || cached.mtime !== stat.mtimeMs) { const data = await fsp.readFile(file); cached = { mtime: stat.mtimeMs, data, gzip: ['.html', '.js', '.css'].includes(ext) ? gzipSync(data) : null }; fileCache.set(file, cached); }
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream'); if (compress) res.setHeader('Content-Encoding', 'gzip'); res.end(req.method === 'HEAD' ? undefined : compress ? cached.gzip : cached.data);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try { const url = new URL(req.url, 'http://localhost'); if (url.pathname.startsWith('/api/')) await api(req, res, url); else if (['GET', 'HEAD'].includes(req.method)) await serve(req, res, url); else fail(405, 'Method not allowed.'); }
  catch (error) { if (res.headersSent) return res.end(); if (typeof error.code !== 'number') console.error(error); json(res, { error: typeof error.code === 'number' ? error.message : 'Server error. Please try again.' }, typeof error.code === 'number' ? error.code : 500); }
});
const heartbeat = setInterval(() => { for (const res of streams) res.write(': keepalive\n\n'); }, 25000); heartbeat.unref();
const port = process.env.PORT !== undefined ? Number(process.env.PORT) : 3000;
server.listen(port, process.env.HOST || '127.0.0.1', () => { console.log(`DSS website: http://localhost:${server.address().port}`); if (setupToken) console.log(`Create your administrator account: http://localhost:${server.address().port}/login.html?setup=${setupToken}`); });
