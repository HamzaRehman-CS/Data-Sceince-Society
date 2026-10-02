const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
(async()=>{
 const root=path.join(__dirname,'..'),data=fs.mkdtempSync(path.join(os.tmpdir(),'dss-design-')),shots=path.join(root,'.private','qa');fs.mkdirSync(shots,{recursive:true});
 const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,DSS_MANUAL_SETUP:'1',PORT:'0',DSS_DATA_DIR:data},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let out='';server.stdout.on('data',d=>{out+=d;const match=/DSS website: (http:\/\/localhost:\d+)/.exec(out);if(match)resolve(match[1]);});server.on('error',reject);});
  browser=await chromium.launch({channel:'chrome',headless:true});const adminContext=await browser.newContext({viewport:{width:1440,height:1000}}),visitorContext=await browser.newContext({viewport:{width:1440,height:1000}});adminContext.setDefaultTimeout(15000);visitorContext.setDefaultTimeout(15000);
  const setup=fs.readFileSync(path.join(data,'setup-token'),'utf8');await adminContext.request.post(base+'/api/auth/setup',{data:{token:setup,name:'Editor Test',email:'editor@example.test',password:'Editor-test-password-123'}});
  const visitor=await visitorContext.newPage(),admin=await adminContext.newPage(),errors=[];for(const p of [visitor,admin])p.on('pageerror',error=>errors.push(error.message));
  await visitor.goto(base+'/index.html',{waitUntil:'domcontentloaded'});await expect(visitor.locator('#home-hero-title')).toHaveText('Great minds. Better together.');await visitor.locator('#home-projects .project-card').first().waitFor();
  await expect(visitor.locator('.surface-stage')).toHaveAttribute('data-running','true');
  await visitor.screenshot({path:path.join(shots,'home-v2-desktop.png')});
  await visitor.emulateMedia({reducedMotion:'reduce'});await expect(visitor.locator('.surface-stage')).toHaveAttribute('data-running','false');await visitor.emulateMedia({reducedMotion:'no-preference'});
  // Deliberately stall the deferred icon dependency: page editing must work before load.
  let unblock;const hold=new Promise(resolve=>unblock=resolve);
  await admin.route('**/assets/lucide.js',async route=>{await hold;await route.continue().catch(()=>{});});
  await admin.goto(base+'/build',{waitUntil:'domcontentloaded'});await admin.locator('#editor-status').filter({hasText:'Ready'}).waitFor();
  const frame=admin.frameLocator('#page-preview');await frame.locator('#home-hero-title').click();await admin.getByLabel('Text content').fill('Build your next idea with DSS.');await admin.getByRole('button',{name:'Apply to preview',exact:true}).click();
  await expect(frame.locator('#home-hero-title')).toHaveText('Build your next idea with DSS.');await expect(visitor.locator('#home-hero-title')).toHaveText('Build your next idea with DSS.');unblock();
  // Headings with line breaks and links with arrow icons must also be editable.
  const secondaryHeading=frame.getByRole('heading',{name:'The right people change what’s possible.'});await secondaryHeading.click();await admin.getByLabel('Text content').fill('Learn and build together.');await admin.getByRole('button',{name:'Apply to preview',exact:true}).click();await expect(visitor.getByRole('heading',{name:'Learn and build together.'})).toBeVisible();
  await frame.getByText('Get to know our society',{exact:true}).click();await admin.getByLabel('Text content').fill('Discover our purpose');await admin.getByRole('button',{name:'Apply to preview',exact:true}).click();await admin.getByRole('button',{name:'Edit containing link',exact:true}).click();await admin.getByLabel('Link URL').fill('about.html#team');await admin.getByRole('button',{name:'Apply to preview',exact:true}).click();await expect(visitor.getByRole('link',{name:'Discover our purpose'})).toHaveAttribute('href','about.html#team');
  // Cross-page selection, local draft mode, direct typing and a return to the page.
  await admin.locator('#live-apply').uncheck();await admin.locator('#page-select').selectOption('about');await admin.locator('#editor-status').filter({hasText:'Ready'}).waitFor();
  await frame.locator('#page-about-title').dblclick();await frame.locator('#page-about-title').fill('People make the difference.');await admin.getByRole('heading',{name:'Element settings'}).click();
  await expect(admin.locator('#save-state')).toHaveText('Unsaved changes');await admin.getByRole('button',{name:'Save draft',exact:true}).click();await expect(admin.locator('#save-state')).toHaveText('Draft saved · not yet published');
  await admin.locator('#page-select').selectOption('index');await admin.locator('#editor-status').filter({hasText:'Ready'}).waitFor();await admin.locator('#page-select').selectOption('about');await expect(frame.locator('#page-about-title')).toHaveText('People make the difference.');
  await admin.getByRole('button',{name:'Publish changes'}).click();await expect(admin.locator('#save-state')).toHaveText('All changes are live');
  await admin.screenshot({path:path.join(shots,'editor-v2-desktop.png')});
  // Banner creation, scheduling display, edit and deletion all reach another browser.
  await admin.getByRole('button',{name:'Banners',exact:true}).click();await admin.locator('#live-apply').check();await admin.getByRole('button',{name:'Create banner',exact:true}).click();
  await admin.getByLabel('Announcement text').fill('Design regression registration is open.');await admin.getByLabel('Placement',{exact:true}).selectOption('floating');await admin.getByRole('button',{name:'Apply banner',exact:true}).click();
  await expect(visitor.locator('.dss-floating-banners')).toContainText('Design regression registration is open.');
  await admin.screenshot({path:path.join(shots,'banners-v2-desktop.png')});
  const bannerRow=admin.locator('.banner-management-row').filter({hasText:'Design regression registration is open.'});await bannerRow.getByRole('button',{name:'Edit',exact:true}).click();await admin.getByLabel('Announcement text').fill('Registration now updated.');await admin.getByRole('button',{name:'Apply banner',exact:true}).click();await expect(visitor.locator('.dss-floating-banners')).toContainText('Registration now updated.');
  await admin.locator('.banner-management-row').filter({hasText:'Registration now updated.'}).getByRole('button',{name:'Hide',exact:true}).click();await expect(visitor.locator('.dss-floating-banners')).toHaveCount(0);
  admin.once('dialog',dialog=>dialog.accept());await admin.locator('.banner-management-row').filter({hasText:'Registration now updated.'}).getByRole('button',{name:'Delete',exact:true}).click();await expect(admin.locator('.banner-management-row').filter({hasText:'Registration now updated.'})).toHaveCount(0);
  await visitor.goto(base+'/about.html',{waitUntil:'domcontentloaded'});await expect(visitor.locator('#page-about-title')).toHaveText('People make the difference.');await visitor.screenshot({path:path.join(shots,'about-v2-desktop.png')});await visitor.locator('#team').scrollIntoViewIfNeeded();await visitor.screenshot({path:path.join(shots,'team-v2-desktop.png')});
  const total=await visitor.locator('.soc-team-card').count();await visitor.getByRole('button',{name:'Directors',exact:true}).click();assert.ok((await visitor.locator('.soc-team-card').count())<total);await visitor.getByRole('button',{name:'Everyone',exact:true}).click();
  for(const width of [320,390,768])for(const url of ['/index.html','/about.html']){await visitor.setViewportSize({width,height:844});await visitor.goto(base+url,{waitUntil:'domcontentloaded'});await visitor.waitForFunction(()=>window.DSS?.content);assert.ok(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),url+' '+width+'px overflow');if(width===390)await visitor.screenshot({path:path.join(shots,url.includes('index')?'home-v2-mobile.png':'about-v2-mobile.png')});}
  assert.deepEqual(errors,[]);console.log('Design regression passed: stalled-load editor, selection, inline typing, cross-page drafts, instant publication, banner create/edit/hide/delete, animation, reduced motion, team filtering and mobile layouts.');
 }catch(error){if(browser)for(const [i,ctx]of browser.contexts().entries()){const p=ctx.pages()[0];if(p){await p.screenshot({path:path.join(shots,'design-failure-'+i+'.png')}).catch(()=>{});console.log(await p.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).filter(el=>el.right>innerWidth+1)));}}throw error;}
 finally{await browser?.close();await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);server.kill();});fs.rmSync(data,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
