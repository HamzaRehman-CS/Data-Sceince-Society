'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createAdminAuth}=require('../lib/admin-auth');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const salt='0123456789abcdef0123456789abcdef',password='test-password-only-not-live';
const hash=salt+':'+crypto.scryptSync(password,salt,64).toString('hex');
const env={ADMIN_USERNAME:'owner',ADMIN_PASSWORD_HASH:hash,VERCEL:'1'};
const response=()=>({headers:{},getHeader(k){return this.headers[k];},setHeader(k,v){this.headers[k]=v;}});
const request=(cookie='')=>({headers:{cookie,'x-vercel-forwarded-for':'192.0.2.1'},socket:{remoteAddress:'127.0.0.1'}});
test('private admin sessions require the server password, use secure cookies, and cannot come from member roles',async()=>{
 const auth=createAdminAuth({env}),state={users:[],sessions:[]},res=response();
 assert.equal((await auth.signIn(state,request(),response(),{username:'owner',password:'wrong'})).status,401);
 assert.equal(state.adminLoginAttempts[0].count,1);
 assert.equal((await auth.signIn(state,request(),res,{username:'owner',password})).status,200);
 const cookie=res.headers['Set-Cookie'][0];assert.match(cookie,/HttpOnly; SameSite=Lax; Path=\/; Max-Age=3600; Secure/);
 const token=/dss_admin=([^;]+)/.exec(cookie)[1];assert.notEqual(state.sessions[0].token,token);
 const req=request('dss_admin='+token);assert.equal(auth.identity(state,req).role,'admin');
 state.users[0].managedAdmin=false;assert.equal(auth.identity(state,req),null);state.users[0].managedAdmin=true;
 assert.equal(auth.identity(state,request('dss_admin='+'f'.repeat(64))),null);
 const changed=createAdminAuth({env:{...env,ADMIN_PASSWORD_HASH:salt+':'+crypto.scryptSync('changed-password',salt,64).toString('hex')}});
 assert.equal(changed.identity(state,req),null);
 auth.signOut(state,req,response());assert.equal(auth.identity(state,req),null);
});
test('administrator lockout survives a new server instance and malformed configuration fails closed',async()=>{
 let state={users:[],sessions:[]};
 for(let i=0;i<8;i++){const auth=createAdminAuth({env});assert.equal((await auth.signIn(state,request(),response(),{username:'owner',password:'wrong'})).status,401);state=JSON.parse(JSON.stringify(state));}
 assert.equal((await createAdminAuth({env}).signIn(state,request(),response(),{username:'owner',password})).status,429);
 assert.equal((await createAdminAuth({env:{}}).signIn(state,request(),response(),{username:'owner',password})).status,503);
});
test('the /admin password flow protects real administration APIs and revokes sessions on logout',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dss-private-admin-'));
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,DATABASE_URL:'',WORKOS_API_KEY:'',WORKOS_CLIENT_ID:'',ADMIN_USERNAME:'owner',ADMIN_PASSWORD_HASH:hash,VERCEL:'',NODE_ENV:'test',DSS_MANUAL_SETUP:'1',DSS_DATA_DIR:dir,PORT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 let base;
 try{
  await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Test server did not start')),15000);child.stdout.on('data',chunk=>{output+=chunk;const match=/DSS website: (http:\/\/localhost:\d+)/.exec(output);if(match){base=match[1];clearTimeout(timer);resolve();}});child.once('error',reject);child.once('exit',code=>{if(code)reject(new Error('Server exited '+code));});});
  const request=async(route,method='GET',input,cookie='',origin=base)=>fetch(base+route,{method,headers:{Cookie:cookie,...(input?{'Content-Type':'application/json',Origin:origin}:{})},body:input?JSON.stringify(input):undefined,redirect:'manual'});
  assert.equal((await request('/admin')).status,200);
  for(const legacy of ['/admin.html','/admin/','/admin-login.html','/admin/index.html','/build','/build.html','/private-admin.html'])assert.equal((await request(legacy)).status,404,legacy);
  assert.equal((await request('/api/admin/content')).status,401);
  assert.equal((await request('/api/admin/login','POST',{username:'owner',password},'','https://evil.example')).status,403);
  assert.equal((await request('/api/admin/login','POST',{username:'owner',password:'wrong'})).status,401);
  const login=await request('/api/admin/login','POST',{username:'owner',password});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await (await request('/api/auth/me','GET',undefined,cookie)).json()).privateAdmin,true);
  assert.equal((await request('/api/admin/overview','GET',undefined,cookie)).status,200);
  assert.equal((await request('/api/auth/password','POST',{currentPassword:password,password:'unused-password'},cookie)).status,400);
  assert.equal((await request('/api/admin/content','GET',undefined,'dss_admin='+'0'.repeat(64))).status,401);
  assert.equal((await request('/api/admin/logout','POST',{},cookie)).status,200);
  assert.equal((await request('/api/admin/content','GET',undefined,cookie)).status,401);
 }finally{child.kill();await new Promise(resolve=>child.exitCode!==null?resolve():child.once('exit',resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
