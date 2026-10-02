const {chromium,expect}=require('@playwright/test');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'dss-identity-')),shots=path.resolve('.private/qa-v3');fs.mkdirSync(shots,{recursive:true});
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,DSS_MANUAL_SETUP:'0',PORT:'0',DSS_DATA_DIR:data},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
 try{
 const base=await new Promise((resolve,reject)=>{let out='';server.stdout.on('data',d=>{out+=d;const m=/DSS website: (http:\/\/localhost:\d+)/.exec(out);if(m)resolve(m[1]);});server.on('error',reject);});
 browser=await chromium.launch({channel:'chrome',headless:true});
 const ac=await browser.newContext({viewport:{width:1440,height:1000}}),sc=await browser.newContext({viewport:{width:1440,height:1000}}),gc=await browser.newContext({viewport:{width:1440,height:1000}});
 const admin=await ac.newPage(),student=await sc.newPage(),guest=await gc.newPage(),errors=[];
 for(const c of [ac,sc,gc])c.setDefaultTimeout(15000);
 for(const p of [admin,student,guest])p.on('pageerror',e=>errors.push(e.message));
 await admin.goto(base+'/login.html');await admin.getByLabel('Email or username',{exact:true}).waitFor();
 assert.ok(!/administrator|admin portal|password.*pass|website owner/i.test(await admin.locator('body').innerText()));
 await admin.getByLabel('Email or username',{exact:true}).fill('admin');await admin.getByLabel('Password',{exact:true}).fill('pass');await admin.getByRole('button',{name:'Sign in'}).click();await admin.waitForURL('**/admin.html');
 await student.goto(base+'/join.html');
 for(const [id,value]of Object.entries({name:'Ayesha Learner',email:'learner@example.test',password:'Student-password-123',confirm:'Student-password-123'}))await student.locator('#applicant-'+id).fill(value);
 await student.getByRole('button',{name:'Create student account'}).click();await student.waitForURL('**/member-dashboard.html');await student.getByRole('heading',{name:'What will you learn today?'}).waitFor();
 let me=await (await sc.request.get(base+'/api/auth/me')).json();assert.equal(me.user.status,'approved');assert.equal(me.user.role,'student');
 assert.equal((await sc.request.get(base+'/api/admin/content')).status(),403);
 assert.equal((await sc.request.post(base+'/api/member/activity',{data:{title:'Unauthorized'}})).status(),403);
 await student.screenshot({path:path.join(shots,'student.png')});
 await student.goto(base+'/ambassador.html');await expect(student.locator('#account-fields')).toBeHidden();
 const fields={phone:'03001234567','student-id':'BSDS-2026-01',university:'Student test institution',major:'BS Data Science',city:'Lahore',cnic:'12345-1234567-1',pitch:'I will organise a beginner Python study group for students from multiple departments.'};
 for(const [id,value]of Object.entries(fields))await student.locator('#applicant-'+id).fill(value);
 for(const [id,value]of Object.entries({province:'Punjab',semester:'4',availability:'2–3 hours'}))await student.locator('#applicant-'+id).selectOption(value);
 await student.locator('#applicant-consent').check();await student.getByRole('button',{name:'Submit ambassador application'}).click();await student.waitForURL('**/member-dashboard.html');
 await expect(student.locator('.note').filter({hasText:'Ambassador application: pending'})).toBeVisible();
 me=await(await sc.request.get(base+'/api/auth/me')).json();assert.equal(me.user.role,'student');assert.equal(me.user.status,'approved');assert.equal(me.user.ambassadorApplication.profile.cnic,'12345-1234567-1');
 await admin.getByRole('button',{name:'Members & approvals',exact:true}).click();await admin.getByRole('button',{name:'Refresh',exact:true}).click();await admin.getByRole('button',{name:'Review application'}).click();
 await expect(admin.locator('#editor-dialog')).toContainText('12345-1234567-1');
 await admin.getByLabel('Ambassador application decision',{exact:true}).selectOption('approved');await admin.getByLabel('Feedback visible to the applicant').fill('Your campus plan is approved. Welcome!');await admin.getByRole('button',{name:'Save account review'}).click();await admin.locator('#editor-dialog').waitFor({state:'hidden'});
 await student.reload();await student.getByRole('heading',{name:'Campus activity',exact:true}).waitFor();
 await student.getByRole('button',{name:'Submit activity report'}).click();
 await student.getByLabel('Title',{exact:true}).fill('First campus Python session');await student.getByLabel('Date',{exact:true}).fill('2026-09-19');await student.getByLabel('Description',{exact:true}).fill('Introduced notebooks and basic data exploration to our study group.');await student.getByLabel('Attendees',{exact:true}).fill('18');await student.getByRole('button',{name:'Submit for review'}).click();await student.locator('#editor-dialog').waitFor({state:'hidden'});
 await admin.getByRole('button',{name:'Ambassador reports',exact:true}).click();await admin.getByRole('button',{name:'Refresh',exact:true}).click();await admin.getByRole('button',{name:'Review report',exact:true}).click();await admin.getByLabel('Status',{exact:true}).selectOption('approved');await admin.getByLabel('Review Note',{exact:true}).fill('Thanks for sharing the session.');await admin.getByRole('button',{name:'Save review'}).click();await admin.locator('#editor-dialog').waitFor({state:'hidden'});
 await student.reload();await expect(student.locator('.member-main')).toContainText('Thanks for sharing the session.');await student.screenshot({path:path.join(shots,'ambassador-portal.png')});
 // A new ambassador applicant requires the full form and cannot access protected features.
 const application={name:'Campus Applicant',email:'candidate@example.test',password:'Candidate-password-123',role:'ambassador',university:'Test institution',studentId:'2026-2',major:'BS Maths',phone:'03121234567',city:'Multan',province:'Punjab',semester:'3',cnic:'1234512345671',availability:'4–5 hours',pitch:'I will organise weekly data learning sessions for students on my campus.',consent:true};
 assert.equal((await gc.request.post(base+'/api/auth/register',{data:{...application,cnic:'123'}})).status(),400);
 assert.equal((await gc.request.post(base+'/api/auth/register',{data:{...application,consent:false}})).status(),400);
 assert.equal((await gc.request.post(base+'/api/auth/register',{data:application})).status(),201);
 assert.equal((await gc.request.post(base+'/api/member/register-event',{data:{id:1}})).status(),403);
 assert.equal((await gc.request.get(base+'/api/admin/overview')).status(),403);
 const pending=await(await gc.request.get(base+'/api/member')).json();assert.equal(pending.content,null);assert.equal(pending.user.status,'pending');
 await gc.request.post(base+'/api/auth/logout',{data:{}});
 // Upload a real PDF through the content form, publish, and open it as a member.
 await admin.getByRole('button',{name:'Content library',exact:true}).click();await admin.locator('#collection').selectOption('resources');await admin.getByRole('button',{name:'Add record',exact:true}).click();
 await admin.locator('#editor-dialog [name=title]').fill('Community test handbook');await admin.locator('#editor-dialog [name=desc]').fill('A test document uploaded through the editor.');
 await admin.locator('[data-media-upload=fileUrl]').setInputFiles({name:'community-guide.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF')});
 await expect(admin.locator('#editor-dialog [name=fileUrl]')).toHaveValue(/\/uploads\//);
 await admin.getByRole('button',{name:'Apply changes',exact:true}).click();await admin.locator('#editor-dialog').waitFor({state:'hidden'});
 const published=await(await sc.request.get(base+'/api/content')).json(),resource=published.collections.resources.find(r=>r.title==='Community test handbook');assert.ok(resource?.fileUrl);assert.equal((await sc.request.get(base+resource.fileUrl)).status(),200);assert.equal((await gc.request.get(base+resource.fileUrl)).status(),403);
 await admin.getByRole('button',{name:'Brand & settings',exact:true}).click();await admin.locator('[name=accent]').fill('#7e3b2f');await admin.locator('[name=canvasEnabled]').uncheck();await admin.getByRole('button',{name:'Publish changes'}).click();await expect(admin.locator('#save-state')).toHaveText('All changes are live');
 await guest.goto(base+'/index.html');await guest.waitForFunction(()=>DSS.content?.theme.accent==='#7e3b2f');await expect(guest.locator('.surface-stage')).toHaveAttribute('data-running','false');assert.equal(await guest.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--color-accent-blue').trim()),'#7e3b2f');
 assert.equal(await guest.evaluate(()=>DSS.content.heroSection.heroTitle),'Great minds.\nBetter together.');
 // Public content search and access filters retain real records.
 await guest.goto(base+'/resources.html');await guest.waitForFunction(()=>DSS.content);await guest.locator('#public-search').fill('no-matching-resource-xyz');await expect(guest.locator('#search-empty')).toBeVisible();await guest.getByRole('button',{name:'Clear search'}).click();await expect(guest.locator('#search-empty')).toBeHidden();
 const pages=['index','about','projects','research','events','resources','blog','community','join','ambassador','contact'];
 for(const width of [320,390,768]){await guest.setViewportSize({width,height:844});for(const name of pages){await guest.goto(base+'/'+name+'.html',{waitUntil:'domcontentloaded'});await guest.waitForFunction(()=>DSS.content);assert.ok(await guest.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} overflows at ${width}`);assert.equal(await guest.locator('main').count(),1);const ids=await guest.locator('[data-cms-id]').evaluateAll(els=>els.map(e=>e.dataset.cmsId));assert.equal(new Set(ids).size,ids.length,`${name} duplicate editor IDs`);}}
 await guest.setViewportSize({width:390,height:844});await guest.goto(base+'/about.html');await guest.screenshot({path:path.join(shots,'about-mobile.png'),fullPage:true});
 for(const p of [admin,student]){await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'portal mobile overflow');}
 await student.screenshot({path:path.join(shots,'ambassador-mobile.png'),fullPage:true});
 // No private application identity data or hashes escape to the public content API.
 const publicText=await(await gc.request.get(base+'/api/content')).text();assert.ok(!publicText.includes(application.cnic));assert.ok(!publicText.includes('12345-1234567-1'));
 assert.equal((await gc.request.get(base+'/.private/database.json')).status(),404);
 assert.deepEqual(errors,[]);
 console.log('Identity checks passed: hidden shared login, direct student registration, ambassador application validation, student-to-ambassador review, reports, inline PDF upload, member-only access, theme publication, motion controls, search, 33 responsive page checks and private data boundaries.');
 }finally{await browser?.close();if(server.exitCode===null){const exited=new Promise(r=>server.once('exit',r));server.kill();await exited;}}
})().catch(e=>{console.error(e);process.exitCode=1;});
