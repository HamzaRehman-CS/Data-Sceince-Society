const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
test('accounts, CMS publishing, permissions, files, community workflows and restart persistence', { timeout: 120000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dss-integration-'));
  let child, base, setup;
  async function start() {
    child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, DSS_MANUAL_SETUP: '1', PORT: '0', DSS_DATA_DIR: dir }, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
    await new Promise((resolve, reject) => { let out = ''; child.stdout.on('data', data => { out += data; const match = /DSS website: (http:\/\/localhost:\d+)/.exec(out); if (match) { base = match[1]; resolve(); } }); child.once('error', reject); child.once('exit', code => { if (code) reject(new Error('Server exited ' + code)); }); });
    if (fs.existsSync(path.join(dir, 'setup-token'))) setup = fs.readFileSync(path.join(dir, 'setup-token'), 'utf8');
  }
  async function stop() { if (child.exitCode !== null) return; await new Promise(resolve => { child.once('exit', resolve); child.kill(); }); }
  function client() {
    return { cookie: '', async request(url, method = 'GET', data, headers = {}) {
      const response = await fetch(base + url, { method, headers: { Cookie: this.cookie, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, body: data === undefined ? undefined : JSON.stringify(data), redirect: 'manual' });
      if (response.headers.get('set-cookie')) this.cookie = response.headers.get('set-cookie').split(';')[0];
      const text = await response.text(); let value; try { value = JSON.parse(text); } catch { value = text; }
      return { status: response.status, value, headers: response.headers };
    } };
  }
  try {
    await start(); const admin = client(), student = client(), ambassador = client(), guest = client();
    assert.equal((await guest.request('/api/admin/overview')).status, 401);
    for (const file of ['/server.js','/backend.js','/sanity-data.json','/.private/database.json','/studio/studio-app.js','/dist/sanity-data.json','/website/design-defaults.json']) assert.ok([302,404].includes((await guest.request(file)).status), file);
    for(const route of ['/','/about.html','/admin','/build','/admin/editor.js','/website/scripts/background.js'])assert.equal((await guest.request(route)).status,200,route);
    assert.equal((await guest.request('/api/sanity-content','POST',{})).status,404);
    assert.equal((await admin.request('/api/auth/setup','POST',{ token: setup, name: 'Site Owner', email: 'owner@example.test', password: 'Owner-password-123' })).status,200);
    assert.equal((await guest.request('/api/auth/setup','POST',{ token: setup, email:'second@example.test', password:'Password-123' })).status,403);
    assert.equal((await guest.request('/api/auth/login','POST',{email:'owner@example.test',password:'wrong'})).status,401);
    assert.equal((await student.request('/api/auth/register','POST',{name:'Test Student',email:'student@example.test',password:'Student-password-123',role:'admin',membershipApplication:true})).status,201);
    assert.equal((await student.request('/api/auth/me')).value.user.role,'member');
    assert.equal((await student.request('/api/member')).value.user.status,'pending');
    assert.equal((await student.request('/api/admin/content')).status,403);
    assert.equal((await student.request('/api/member/register-event','POST',{id:1})).status,403);
    assert.equal((await ambassador.request('/api/auth/register','POST',{name:'Test Ambassador',email:'ambassador@example.test',password:'Ambassador-password-123',role:'ambassador',university:'Test University',studentId:'BS-101',major:'Data Science',phone:'03001234567',city:'Lahore',province:'Punjab',semester:'4',cnic:'12345-1234567-1',availability:'2–3 hours',consent:true,pitch:'Run monthly practical workshops.'})).status,201);
    let users = (await admin.request('/api/admin/overview')).value.users;
    for (const user of users.filter(u => u.role !== 'admin')) assert.equal((await admin.request('/api/admin/users','PATCH',{id:user.id,status:'approved',role:user.role,reviewNote:'Welcome to DSS.'})).status,200);
    let model = (await admin.request('/api/admin/content')).value;
    assert.ok(model.draft.collections.team[0].bio.includes('Leads the society'));
    const invalidBanner=structuredClone(model.draft);invalidBanner.banners=[{id:'invalid',text:'An invalid schedule',active:true,placement:'top',tone:'mint',pages:'all',startsAt:'2026-09-11T00:00:00Z',endsAt:'2026-09-10T00:00:00Z'}];
    assert.equal((await admin.request('/api/admin/content','PUT',{revision:model.revision,content:invalidBanner})).status,400);
    invalidBanner.banners[0].endsAt='';invalidBanner.banners[0].link='javascript:alert(1)';
    assert.equal((await admin.request('/api/admin/content','PUT',{revision:model.revision,content:invalidBanner})).status,400);
    const originalTitle = model.draft.heroSection.heroTitle;
    model.draft.heroSection.heroTitle = 'Published integration test title';
    model.draft.collections.resources = [{id:'protected-test',title:'Private handbook',requiresAuth:true,fileUrl:'/uploads/deep_learning_core_handbook.pdf',link:'https://example.com/members'}];
    let saved = await admin.request('/api/admin/content','PUT',{revision:model.revision,content:model.draft}); assert.equal(saved.status,200,JSON.stringify(saved.value));
    assert.equal((await guest.request('/api/sanity-content')).value.heroSection.heroTitle,originalTitle);
    assert.equal((await admin.request('/api/admin/content','PUT',{revision:model.revision,content:model.draft})).status,409);
    assert.equal((await admin.request('/api/admin/publish','POST',{revision:saved.value.revision},{Origin:'https://evil.example'})).status,403);
    assert.equal((await admin.request('/api/admin/publish','POST',{revision:saved.value.revision})).status,200);
    const publicContent = (await guest.request('/api/sanity-content')).value;
    assert.equal(publicContent.heroSection.heroTitle,'Published integration test title');
    assert.equal(publicContent.collections.resources[0].fileUrl,undefined);
    assert.equal((await guest.request('/uploads/deep_learning_core_handbook.pdf')).status,403);
    assert.equal((await student.request('/uploads/deep_learning_core_handbook.pdf')).status,200);
    assert.equal((await student.request('/api/member/bookmark','POST',{collection:'resources',id:'protected-test'})).status,200);
    assert.equal((await student.request('/api/member/bookmark','POST',{collection:'resources',id:'protected-test'})).status,200);
    assert.equal((await student.request('/api/member')).value.bookmarks.length,1);
    const eventId = model.draft.collections.events[0].id;
    for (let i=0;i<2;i++) assert.equal((await student.request('/api/member/register-event','POST',{id:eventId})).status,200);
    assert.equal((await student.request('/api/member')).value.registrations.length,1);
    assert.equal((await student.request('/api/member/activity','POST',{title:'Forbidden'})).status,403);
    assert.equal((await ambassador.request('/api/member/activity','POST',{title:'Campus workshop',description:'Introduced 20 students to Python.',date:'2026-09-10',attendees:20,link:'https://example.com/report'})).status,201);
    const report = (await admin.request('/api/admin/overview')).value.activities[0];
    assert.equal((await admin.request('/api/admin/activity','PATCH',{id:report.id,status:'approved',reviewNote:'Great work.'})).status,200);
    assert.equal((await ambassador.request('/api/member')).value.activities[0].reviewNote,'Great work.');
    assert.equal((await guest.request('/api/contact','POST',{name:'Visitor',email:'visitor@example.test',message:'Please help with membership.'})).status,201);
    assert.equal((await admin.request('/api/admin/overview')).value.inquiries[0].message,'Please help with membership.');
    assert.equal((await guest.request('/api/upload-file','POST',{fileName:'x.txt',fileData:'aGVsbG8='})).status,401);
    assert.equal((await admin.request('/api/upload-file','POST',{fileName:'attack.html',fileData:'aGVsbG8='})).status,400);
    assert.equal((await admin.request('/api/upload-file','POST',{fileName:'fake.png',fileData:'aGVsbG8='})).status,400);
    const upload = await admin.request('/api/upload-file','POST',{fileName:'notes.txt',fileData:Buffer.from('Genuine notes').toString('base64'),public:true}); assert.equal(upload.status,201);
    assert.equal((await guest.request(upload.value.url)).value,'Genuine notes');
    model = (await admin.request('/api/admin/content')).value;
    model.draft.collections.resources = []; saved = await admin.request('/api/admin/content','PUT',{revision:model.revision,content:model.draft});
    await admin.request('/api/admin/publish','POST',{revision:saved.value.revision});
    assert.equal((await guest.request('/api/sanity-content')).value.collections.resources.length,0);
    model = (await admin.request('/api/admin/content')).value;
    assert.equal((await admin.request('/api/admin/restore','POST',{revision:model.revision,id:model.history[0].id})).status,200);
    assert.equal((await admin.request('/api/admin/content')).value.draft.collections.resources.length,1);
    const studentId = users.find(u => u.role === 'member').id;
    await admin.request('/api/admin/users','PATCH',{id:studentId,status:'suspended',role:'student'});
    assert.equal((await student.request('/api/member/bookmark','POST',{collection:'papers',id:1})).status,403);
    await stop(); await start();
    assert.equal((await admin.request('/api/admin/overview')).value.inquiries.length,1);
    assert.equal((await student.request('/api/auth/me')).value.user.status,'suspended');
    assert.equal((await ambassador.request('/api/auth/password','POST',{currentPassword:'Ambassador-password-123',password:'New-ambassador-password-123'})).status,200);
    await ambassador.request('/api/auth/logout','POST',{});
    assert.equal((await ambassador.request('/api/member')).status,401);
    assert.equal((await ambassador.request('/api/auth/login','POST',{email:'ambassador@example.test',password:'New-ambassador-password-123'})).status,200);
    const reset = await admin.request('/api/admin/reset-password','POST',{id:users.find(u=>u.role==='ambassador').id}); assert.equal(reset.status,200);
    const resetToken = new URL(reset.value.url,base).searchParams.get('reset');
    assert.equal((await guest.request('/api/auth/reset-password','POST',{token:resetToken,password:'Recovered-password-123'})).status,200);
    assert.equal((await ambassador.request('/api/member')).status,401);
    assert.equal((await guest.request('/api/auth/reset-password','POST',{token:resetToken,password:'Replay-password-123'})).status,400);
    assert.equal((await ambassador.request('/api/auth/login','POST',{email:'ambassador@example.test',password:'Recovered-password-123'})).status,200);
    const stored = fs.readFileSync(path.join(dir,'database.json'),'utf8'); assert.ok(!stored.includes('Student-password-123')); assert.ok(!stored.includes('Owner-password-123'));
  } finally { await stop(); fs.rmSync(dir,{recursive:true,force:true}); }
});
