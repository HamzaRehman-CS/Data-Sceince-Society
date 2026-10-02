'use strict';
const {chromium,expect:baseExpect}=require('@playwright/test');
const expect=baseExpect.configure({timeout:15000});
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'.private','qa-v2.1');
const password='Qa-only-owner-password-123',salt=crypto.randomBytes(16).toString('hex'),hash=salt+':'+crypto.scryptSync(password,salt,64).toString('hex');
async function start(extra={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dss-workspace-'));
 const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,DATABASE_URL:'',WORKOS_API_KEY:'',WORKOS_CLIENT_ID:'',WORKOS_COOKIE_PASSWORD:'',ADMIN_USERNAME:'owner',ADMIN_PASSWORD_HASH:hash,VERCEL:'',PUBLIC_ORIGIN:'',WORKOS_REDIRECT_URI:'',NODE_ENV:'test',DSS_MANUAL_SETUP:'1',DSS_DATA_DIR:dir,PORT:'0',...extra},windowsHide:true,stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Server startup timed out')),15000);child.stdout.on('data',chunk=>{output+=chunk;const match=/DSS website: (http:\/\/localhost:\d+)/.exec(output);if(match){clearTimeout(timer);resolve(match[1]);}});child.on('error',reject);});
 return{base,async stop(){if(child.exitCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}fs.rmSync(dir,{recursive:true,force:true});}};
}
(async()=>{
 fs.mkdirSync(shots,{recursive:true});const local=await start(),cloud=await start({WORKOS_API_KEY:'sk_test_fake',WORKOS_CLIENT_ID:'client_test',WORKOS_COOKIE_PASSWORD:'x'.repeat(32)});let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],contexts=[];
  async function context(){const c=await browser.newContext({viewport:{width:1440,height:1000}});c.setDefaultTimeout(20000);contexts.push(c);return c;}
  function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' '+m.location().url);});}
  const ac=await context(),admin=await ac.newPage();observe(admin);
  await admin.goto(local.base+'/admin');await admin.getByLabel('Administrator ID').fill('owner');await admin.getByLabel('Password',{exact:true}).fill(password);await admin.getByRole('button',{name:'Sign in',exact:true}).click();await admin.getByRole('heading',{name:'Your society, at a glance.'}).waitFor();
  await admin.getByRole('button',{name:'Role workspaces',exact:true}).click();await expect(admin.getByRole('heading',{name:'Role workspaces',exact:true})).toBeVisible();assert.ok(!(await admin.locator('.sidebar').innerText()).includes('undefined'));
  const pc=await context(),publicPage=await pc.newPage();observe(publicPage);
  const publicChecks=[];
  for(const name of ['join','opportunities','ambassador']){
   await publicPage.goto(cloud.base+'/'+name+'.html');await publicPage.waitForFunction(()=>window.DSS?.authProvider==='workos'&&window.DSS?.content);
   await expect(publicPage.locator('.application-card h2')).toHaveText('Create your account first');assert.equal(await publicPage.locator('#join-form h2').count(),0);
   assert.equal(await publicPage.locator('#join-form input[type=password]').count(),0);await expect(publicPage.locator('[data-auth-login]')).toHaveText('Login');
   if(name==='join'){
    await publicPage.locator('[data-track=membership]').click();await expect(publicPage.locator('[data-track=membership]')).toHaveAttribute('aria-pressed','true');
    for(const selector of ['[data-auth-signup]','[data-auth-login]'])assert.equal(new URL(await publicPage.locator(selector).getAttribute('href'),cloud.base).searchParams.get('returnTo'),'/join.html?track=membership');
    await publicPage.locator('[data-track=student]').click();assert.equal(new URL(await publicPage.locator('[data-auth-login]').getAttribute('href'),cloud.base).searchParams.get('returnTo'),'/member-dashboard.html');
   }
   for(const width of [320,768,1440]){await publicPage.setViewportSize({width,height:1000});assert.ok(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow '+width);publicChecks.push(name+':'+width);}
   await publicPage.setViewportSize({width:390,height:844});await publicPage.screenshot({path:path.join(shots,name+'-mobile.png'),fullPage:true});
  }
  await publicPage.goto(cloud.base+'/index.html');await publicPage.waitForFunction(()=>window.DSS?.content);await publicPage.getByRole('button',{name:'Open navigation'}).click();assert.equal(await publicPage.locator('#site-menu a').evaluateAll(links=>links.filter(a=>/\/(?:admin|build)(?:\.|\/|$)/.test(new URL(a.href).pathname)).length),0);await publicPage.keyboard.press('Escape');
  const roles={};
  for(const role of ['student','member','cabinet','ambassador']){
   const c=await context();const r=await c.request.post(local.base+'/api/auth/register',{data:{name:'QA '+role,email:role+'@example.test',password:'Qa-student-password-123'}});assert.equal(r.status(),201);
   const me=await(await c.request.get(local.base+'/api/auth/me')).json();if(role!=='student')assert.equal((await ac.request.patch(local.base+'/api/admin/users',{data:{id:me.user.id,role:role==='ambassador'?'ambassador':'member',status:'approved',...(role==='cabinet'?{cabinetPosition:'Secretary'}:{})}})).status(),200);
   const p=await c.newPage();observe(p);await p.goto(local.base+'/member-dashboard.html');await expect(p.locator('body')).toHaveAttribute('data-workspace-role',role);
   const expected={student:'What will you learn today?',member:'Make your next contribution.',cabinet:'Lead your team with clarity.',ambassador:'Bring your campus together.'};await expect(p.getByRole('heading',{name:expected[role]})).toBeVisible();
   if(role!=='student')assert.equal(await p.getByRole('link',{name:'Apply for membership',exact:true}).count(),0);
   if(role==='cabinet')assert.equal(await p.getByRole('button',{name:'Apply for a cabinet position',exact:true}).count(),0);
   if(role==='ambassador')assert.equal(await p.getByRole('link',{name:'Apply for ambassador',exact:true}).count(),0);
   for(const width of [320,768,1440]){await p.setViewportSize({width,height:1000});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),role+' overflow '+width);}
   await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(shots,role+'-mobile.png'),fullPage:true});roles[role]={page:p,context:c,id:me.user.id};
  }
  // Change the actual admin workspace form; an already-open member page must refresh.
  await admin.locator('#workspace-settings [name=studentHeading]').fill('A precise learning space.');await admin.locator('#workspace-settings [name=studentEventsEnabled]').uncheck();await admin.getByRole('button',{name:'Apply workspace changes',exact:true}).click();
  await expect(roles.student.page.getByRole('heading',{name:'A precise learning space.'})).toBeVisible();assert.equal(await roles.student.page.locator('[data-member-tab=events]').count(),0);
  // Update a role on the server while its page stays open; no event-stream dependency.
  assert.equal((await ac.request.patch(local.base+'/api/admin/users',{data:{id:roles.student.id,role:'member',status:'approved'}})).status(),200);
  await expect(roles.student.page.locator('body')).toHaveAttribute('data-workspace-role','member');
  // Page editor still publishes the main website successfully under the security policy.
  const vc=await context(),visitor=await vc.newPage();observe(visitor);await visitor.goto(local.base+'/index.html');await visitor.waitForFunction(()=>window.DSS?.content);
  await admin.getByRole('button',{name:'Page editor',exact:true}).click();const frame=admin.frameLocator('#page-preview');await frame.locator('#home-hero-title').waitFor();await frame.locator('#home-hero-title').click();await admin.getByLabel('Text content').fill('Learning, led by the community.');await admin.getByRole('button',{name:'Apply to preview',exact:true}).click();await expect(visitor.locator('#home-hero-title')).toHaveText('Learning, led by the community.');
  await admin.setViewportSize({width:390,height:844});await admin.getByRole('button',{name:'Overview',exact:true}).click();assert.ok(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await admin.screenshot({path:path.join(shots,'admin-mobile.png'),fullPage:true});
  await admin.getByRole('button',{name:'Sign out',exact:true}).click();await expect(admin.getByRole('heading',{name:'Administrator sign in'})).toBeVisible();assert.equal((await ac.request.get(local.base+'/api/admin/content')).status(),401);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({publicResponsiveChecks:publicChecks.length,roleResponsiveChecks:12,adminPasswordFlow:true,roleWorkspaceControls:true,liveRoleAndContentUpdates:true,pageEditor:true,consoleErrors:0,screenshots:shots}));
 }catch(error){if(browser){for(const [i,c]of browser.contexts().entries()){const page=c.pages()[0];if(page)await page.screenshot({path:path.join(shots,'failure-'+i+'.png'),fullPage:true}).catch(()=>{});}}throw error;}
 finally{await browser?.close();await local.stop();await cloud.stop();}
})().catch(error=>{console.error(error);process.exitCode=1;});
