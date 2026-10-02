const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), { spawn } = require('node:child_process');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(),'dss-browser-')), root = path.join(__dirname,'..'), shots = path.join(root,'.private','qa'); fs.mkdirSync(shots,{recursive:true});
  const server = spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,DSS_MANUAL_SETUP:'1',PORT:'0',DSS_DATA_DIR:data},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  try {
    const base = await new Promise((resolve,reject)=>{let out='';server.stdout.on('data',v=>{out+=v;const m=/DSS website: (http:\/\/localhost:\d+)/.exec(out);if(m)resolve(m[1]);});server.on('error',reject);});
    browser = await chromium.launch({channel:'chrome',headless:true});
    const context = await browser.newContext({viewport:{width:1440,height:1000}}), page = await context.newPage(), errors=[];
    context.setDefaultTimeout(20000); context.setDefaultNavigationTimeout(30000);
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/login.html?setup='+fs.readFileSync(path.join(data,'setup-token'),'utf8'));
    await page.getByLabel('Full name').fill('Website Owner');await page.getByLabel('Email address').fill('owner@example.test');await page.getByLabel('Password (at least 10 characters)').fill('Owner-password-123');await page.getByRole('button',{name:'Create administrator account'}).click();
    await page.waitForURL('**/admin.html');await page.getByRole('heading',{name:'Your society, at a glance.'}).waitFor();
    await page.screenshot({path:path.join(shots,'admin-desktop.png'),fullPage:true});
    await page.getByRole('button',{name:'Page editor',exact:true}).click();
    const frame = page.frameLocator('#page-preview');await frame.locator('#home-hero-title').waitFor();await page.locator('#element-list button').first().waitFor();
    await frame.locator('#home-hero-title').click();await page.getByLabel('Text content').fill('A better future, built together.');await page.getByRole('button',{name:'Apply to preview'}).click();
    await expect(frame.locator('#home-hero-title')).toHaveText('A better future, built together.');
    await page.getByRole('button',{name:'Publish changes'}).click();await page.getByText('All changes are live').waitFor();
    await page.screenshot({path:path.join(shots,'page-editor.png'),fullPage:true});
    const visitorContext = await browser.newContext({viewport:{width:1440,height:1000}}), visitor = await visitorContext.newPage();visitor.on('pageerror',e=>errors.push(e.message));
    visitorContext.setDefaultTimeout(20000); visitorContext.setDefaultNavigationTimeout(30000);
    await visitor.goto(base+'/index.html');await visitor.getByRole('heading',{name:'A better future, built together.'}).waitFor();await visitor.screenshot({path:path.join(shots,'website-desktop.png'),fullPage:true});
    for(const name of ['about','research','projects','events','blog','resources','community','join','contact']){await visitor.goto(base+'/'+name+'.html');await visitor.waitForFunction(()=>window.DSS?.content);assert.equal(await visitor.locator('main').count(),1,name);}
    await visitor.locator('#contact-name').fill('Visitor Test');await visitor.locator('#contact-email').fill('visitor@example.test');await visitor.locator('#contact-message').fill('A message sent from the real browser form.');await visitor.locator('form [type=submit]').click();await visitor.getByText('Your message has reached the DSS team.').waitFor();
    await visitor.goto(base+'/join.html');await visitor.waitForFunction(()=>window.DSS?.content);
    await visitor.locator('[data-track=membership]').click();
    const inputs = {'applicant-name':'Student Test','applicant-email':'student@example.test','applicant-university':'Test University','applicant-phone':'03001234567','applicant-password':'Student-password-123','applicant-confirm':'Student-password-123','applicant-student-id':'TEST-101','applicant-interest':'Data science','applicant-motivation':'I want to learn and contribute.'};for(const [id,value]of Object.entries(inputs))await visitor.locator('#'+id).fill(value);
    await visitor.getByRole('button',{name:'Submit application',exact:true}).click();await visitor.waitForURL('**/member-dashboard.html');await visitor.getByRole('heading',{name:'Application pending'}).waitFor();
    await page.getByRole('button',{name:'Members & approvals',exact:true}).click();await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Review application'}).click();await page.getByLabel('Status',{exact:true}).selectOption('approved');await page.getByLabel('Feedback visible to the applicant').fill('Welcome aboard.');await page.getByRole('button',{name:'Save account review'}).click();await page.locator('#editor-dialog').waitFor({state:'hidden'});
    await expect(visitor.locator('body')).toHaveAttribute('data-member-role','member');await visitor.locator('[data-member-tab=events]').click();await visitor.getByRole('heading',{name:'Events & registrations'}).waitFor();await visitor.getByRole('button',{name:'Register',exact:true}).first().click();await visitor.getByRole('button',{name:'Cancel registration',exact:true}).first().waitFor();await visitor.locator('[data-member-tab=library]').click();await visitor.getByRole('button',{name:'Save resource',exact:true}).first().click();await visitor.getByRole('button',{name:'Remove saved',exact:true}).first().waitFor();await visitor.screenshot({path:path.join(shots,'student-desktop.png'),fullPage:true});
    await visitor.setViewportSize({width:390,height:844});await visitor.screenshot({path:path.join(shots,'student-mobile.png'),fullPage:true});assert.ok(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'member mobile overflow');
    await visitor.goto(base+'/index.html');await visitor.waitForFunction(()=>window.DSS?.content);await visitor.screenshot({path:path.join(shots,'website-mobile.png'),fullPage:true});assert.ok(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'website mobile overflow');await visitor.getByRole('button',{name:'Open navigation'}).click();await visitor.getByRole('dialog').waitFor();await visitor.keyboard.press('Escape');
    await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Overview',exact:true}).click();await page.screenshot({path:path.join(shots,'admin-mobile.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin mobile overflow');
    assert.deepEqual(errors,[]);console.log('Browser checks passed: setup, page editing, publishing, all public pages, contact, registration, approval, event registration, saved resources, mobile layout and navigation. Screenshots: '+shots);
  } catch(error) { if(browser) for(const [i,context] of browser.contexts().entries()) { const p=context.pages()[0];if(p) { await p.screenshot({path:path.join(shots,'failure-'+i+'.png'),fullPage:true}).catch(()=>{});console.log((await p.locator('body').innerText()).slice(-6000)); } } throw error;
  } finally {await browser?.close();await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);server.kill();});fs.rmSync(data,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});

