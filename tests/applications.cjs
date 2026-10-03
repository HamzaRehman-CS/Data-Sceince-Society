'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
test('admin application windows, configurable questions, three roles, approvals and restart persistence',{timeout:60000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dss-applications-'));let child,base;
 async function start(){child=spawn(process.execPath,['backend.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,DATABASE_URL:'',WORKOS_API_KEY:'',WORKOS_CLIENT_ID:'',ADMIN_USERNAME:'',ADMIN_PASSWORD_HASH:'',VERCEL:'',NODE_ENV:'test',DSS_MANUAL_SETUP:'0',DSS_DATA_DIR:dir,PORT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});base=await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',chunk=>{output+=chunk;const match=/DSS website: (http:\/\/localhost:\d+)/.exec(output);if(match)resolve(match[1]);});child.on('error',reject);});}
 async function stop(){if(child.exitCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}}
 function client(){return{cookie:'',async request(route,method='GET',data){const response=await fetch(base+route,{method,headers:{Cookie:this.cookie,...(data===undefined?{}:{'Content-Type':'application/json',Origin:base})},body:data===undefined?undefined:JSON.stringify(data)});if(response.headers.get('set-cookie'))this.cookie=response.headers.get('set-cookie').split(';')[0];return{status:response.status,value:await response.json().catch(()=>null)};}};}
 try{
  await start();const admin=client(),normal=client(),guest=client();
  assert.equal((await admin.request('/api/auth/login','POST',{username:'admin',password:'pass'})).status,200);
  assert.equal((await normal.request('/api/auth/register','POST',{name:'Normal Member',email:'normal@example.test',password:'Test-password-123',role:'admin'})).status,201);
  const id=(await normal.request('/api/auth/me')).value.user.id;
  for(const route of ['/ambassador','/ambassador.html','/membership','/opportunities.html','/join.html?track=membership'])assert.equal((await guest.request(route)).status,404,route);
  assert.equal((await guest.request('/join.html')).status,200);
  assert.equal((await guest.request('/ambassador.html?edit=1')).status,404);
  assert.equal((await admin.request('/ambassador.html?edit=1')).status,200);
  assert.equal((await normal.request('/api/member/membership-application','POST',{university:'U',interest:'Python',motivation:'I want to contribute to society projects.'})).status,403);
  assert.equal((await guest.request('/api/auth/register','POST',{name:'Closed',email:'closed@example.test',password:'Test-password-123',membershipApplication:true})).status,403);
  let model=(await admin.request('/api/admin/content')).value;
  const config=structuredClone(model.draft.applications);
  config.membership={enabled:true,questions:[{id:'why',label:'Why join?',type:'textarea',required:true,minLength:20},{id:'available',label:'Can you join weekly?',type:'yesno',required:true}]};
  assert.equal((await normal.request('/api/admin/live-settings','PUT',{revision:model.revision,applications:config})).status,403);
  assert.equal((await admin.request('/api/admin/live-settings','PUT',{revision:model.revision,applications:config})).status,200);
  assert.equal((await guest.request('/opportunities.html')).status,200);
  assert.equal((await guest.request('/ambassador.html')).status,404);
  assert.equal((await normal.request('/api/member/membership-application','POST',{answers:{why:'short',available:'yes'}})).status,400);
  assert.equal((await normal.request('/api/member/membership-application','POST',{answers:{why:'I want to contribute accessible society resources.',available:'maybe'}})).status,400);
  assert.equal((await normal.request('/api/member/membership-application','POST',{answers:{why:'I want to contribute accessible society resources.',available:'no',role:'admin'}})).status,201);
  let user=(await normal.request('/api/member')).value.user;
  assert.equal(user.role,'student');assert.equal(user.status,'approved');assert.equal(user.membershipApplication.answers.available.value,false);
  assert.equal((await normal.request('/api/member/membership-application','POST',{})).status,409);
  model=(await admin.request('/api/admin/content')).value;config.membership.questions[0].label='Updated question';config.membership.enabled=false;
  assert.equal((await admin.request('/api/admin/live-settings','PUT',{revision:model.revision,applications:config})).status,200);
  assert.equal((await admin.request('/api/admin/live-settings','PUT',{revision:model.revision,applications:config})).status,409);
  assert.equal((await normal.request('/api/member')).value.user.membershipApplication.answers.why.label,'Why join?');
  assert.equal((await admin.request('/api/admin/users','PATCH',{id,role:'student',status:'approved',membershipDecision:'approved'})).status,200);
  assert.equal((await normal.request('/api/member')).value.user.role,'member');
  assert.equal((await normal.request('/api/member/cabinet-application','POST',{})).status,404);
  assert.equal((await admin.request('/api/admin/users','PATCH',{id,role:'cabinet',status:'approved'})).status,400);
  model=(await admin.request('/api/admin/content')).value;config.ambassador={enabled:true,questions:[{id:'lead',label:'Will you lead a campus activity?',type:'yesno',required:true,mustBeYes:true}]};
  assert.equal((await admin.request('/api/admin/live-settings','PUT',{revision:model.revision,applications:config})).status,200);
  assert.equal((await normal.request('/api/member/ambassador-application','POST',{answers:{lead:'no'}})).status,400);
  assert.equal((await normal.request('/api/member/ambassador-application','POST',{answers:{lead:'yes'}})).status,201);
  assert.equal((await normal.request('/api/member')).value.user.role,'member');
  assert.equal((await admin.request('/api/admin/users','PATCH',{id,role:'member',status:'approved',applicationDecision:'approved'})).status,200);
  assert.equal((await normal.request('/api/member')).value.user.role,'ambassador');
  assert.equal((await guest.request('/api/content')).value.applications.membership.enabled,false);
  await stop();await start();assert.equal((await normal.request('/api/member')).value.user.role,'ambassador');assert.equal((await guest.request('/ambassador.html')).status,200);assert.equal((await guest.request('/opportunities.html')).status,404);
 }finally{await stop();fs.rmSync(dir,{recursive:true,force:true});}
});
