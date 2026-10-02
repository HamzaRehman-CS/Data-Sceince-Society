const { chromium } = require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'dss-preview-')),shots=path.resolve('.private/qa-v3');fs.mkdirSync(shots,{recursive:true});
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'0',DSS_DATA_DIR:data},windowsHide:true,stdio:['ignore','pipe','inherit']});let browser;
 try{
 const base=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=/DSS website: (http:\/\/localhost:\d+)/.exec(d.toString());if(m)resolve(m[1]);});server.on('error',reject);server.on('exit',code=>reject(new Error('Server exited '+code)));});
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage();p.on('pageerror',e=>console.log('PAGE ERROR',e.message));
 for(const name of ['index','about','projects','ambassador','login']){await p.goto(base+'/'+name+'.html');await p.waitForTimeout(400);await p.screenshot({path:path.join(shots,name+'.png'),fullPage:false});console.log(name,await p.locator('h1,h2').first().textContent());}
 await p.getByLabel('Email or username',{exact:true}).fill('admin');await p.getByLabel('Password',{exact:true}).fill('pass');await p.getByRole('button',{name:'Sign in'}).click();await p.waitForURL('**/admin.html');await p.getByRole('heading',{name:'Your society, at a glance.'}).waitFor();await p.screenshot({path:path.join(shots,'admin.png')});
 await p.getByRole('button',{name:'Brand & settings',exact:true}).click();await p.screenshot({path:path.join(shots,'settings.png')});
 await p.setViewportSize({width:390,height:844});await p.goto(base+'/index.html');await p.waitForTimeout(400);await p.screenshot({path:path.join(shots,'mobile.png'),fullPage:true});
 console.log('Screenshots:',shots);
 }finally{await browser?.close();server.kill();await new Promise(r=>server.once('exit',r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
