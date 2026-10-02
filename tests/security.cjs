'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
test('private routes, member ownership, audience privacy, content validation and persistent contact quotas',{timeout:90000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dss-security-'));let child,base;
 async function start(){child=spawn(process.execPath,['server.js'],{env:{...process.env,DATABASE_URL:'',WORKOS_API_KEY:'',WORKOS_CLIENT_ID:'',ADMIN_USERNAME:'',ADMIN_PASSWORD_HASH:'',VERCEL:'',NODE_ENV:'test',DSS_MANUAL_SETUP:'0',DSS_DATA_DIR:dir,PORT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Server timeout')),15000);child.stdout.on('data',chunk=>{output+=chunk;const match=/DSS website: (http:\/\/localhost:\d+)/.exec(output);if(match){clearTimeout(timer);resolve(match[1]);}});child.on('error',reject);});}
 async function stop(){if(child.exitCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}}
 function client(){return{cookie:'',async request(route,method='GET',body){const r=await fetch(base+route,{method,redirect:'manual',headers:{Cookie:this.cookie,...(body===undefined?{}:{'Content-Type':'application/json',Origin:base})},body:body===undefined?undefined:JSON.stringify(body)});const cookie=r.headers.get('set-cookie');if(cookie)this.cookie=cookie.split(';')[0];return{status:r.status,headers:r.headers,value:await r.json().catch(()=>null)};}};}
 try{
  await start();const admin=client(),one=client(),two=client(),guest=client();
  assert.equal((await admin.request('/api/auth/login','POST',{username:'admin',password:'pass'})).status,200);
  for(const [c,name]of [[one,'One'],[two,'Two']])assert.equal((await c.request('/api/auth/register','POST',{name,email:name.toLowerCase()+'@example.test',password:'Test-password-123'})).status,201);
  const first=(await one.request('/api/auth/me')).value.user,second=(await two.request('/api/auth/me')).value.user;
  assert.equal((await one.request('/api/member/profile','PUT',{id:second.id,name:'My own edited name'})).status,200);
  assert.equal((await two.request('/api/member')).value.user.name,'Two');assert.equal((await one.request('/api/member')).value.user.id,first.id);
  assert.equal((await one.request('/api/admin/users','PATCH',{id:second.id,role:'admin',status:'approved'})).status,403);
  assert.equal((await guest.request('/api/member')).status,401);
  for(const route of ['/.env.local','/.private/admin-login.txt','/.private/database.json','/backend.js','/lib/storage.js','/admin.html','/build','/private-admin.html'])assert.equal((await guest.request(route)).status,404,route);
  const home=await guest.request('/');assert.match(home.headers.get('content-security-policy'),/object-src 'none'/);assert.match(home.headers.get('permissions-policy'),/camera=\(\)/);
  let model=(await admin.request('/api/admin/content')).value;
  const unsafe=structuredClone(model.draft);unsafe.collections.navigation.push({id:'forbidden-admin',title:'Admin',link:'/admin',requiresAuth:false});assert.equal((await admin.request('/api/admin/content','PUT',{revision:model.revision,content:unsafe})).status,400);
  const script=structuredClone(model.draft);script.heroSection.primaryCtaLink='javascript:alert(1)';assert.equal((await admin.request('/api/admin/content','PUT',{revision:model.revision,content:script})).status,400);
  model.draft.collections.announcements.push({id:'private-announcement',title:'Private campus note',body:'AMBASSADOR-ONLY-DETAIL',audience:'ambassador',requiresAuth:true});
  const saved=await admin.request('/api/admin/content','PUT',{revision:model.revision,content:model.draft});assert.equal(saved.status,200);
  assert.equal((await admin.request('/api/admin/publish','POST',{revision:saved.value.revision})).status,200);
  assert.ok(!JSON.stringify((await guest.request('/api/content')).value).includes('AMBASSADOR-ONLY-DETAIL'));assert.ok(!JSON.stringify((await one.request('/api/content')).value).includes('AMBASSADOR-ONLY-DETAIL'));
  assert.equal((await admin.request('/api/admin/users','PATCH',{id:second.id,role:'ambassador',status:'approved'})).status,200);
  assert.ok(JSON.stringify((await two.request('/api/content')).value).includes('AMBASSADOR-ONLY-DETAIL'));
  for(let i=0;i<12;i++)assert.equal((await guest.request('/api/contact','POST',{name:'Quota test',email:'quota@example.test',message:'Unique verification '+i})).status,201);
  assert.equal((await guest.request('/api/contact','POST',{name:'Quota test',email:'quota@example.test',message:'Over quota'})).status,429);
  await stop();await start();assert.equal((await guest.request('/api/contact','POST',{name:'Quota test',email:'quota@example.test',message:'After restart'})).status,429);
  assert.equal((await guest.request('/api/contact','POST',[])).status,400);
 }finally{await stop();fs.rmSync(dir,{recursive:true,force:true});}
});
