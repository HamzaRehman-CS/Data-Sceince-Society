'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pretty = key => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
  const api = async (url, method = 'GET', data) => {
    const response = await fetch(url, { method, credentials: 'same-origin', headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
    const result = await response.json(); if (!response.ok) throw Object.assign(new Error(result.error || 'Request failed.'), { status: response.status }); return result;
  };
  function toast(message, error = false) { let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); } el.className = 'toast' + (error ? ' error' : ''); el.textContent = message; el.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => el.hidden = true, 5500); }
  const badge = status => `<span class="badge ${h(status)}">${h(status)}</span>`;
  const empty = message => `<div class="empty">${h(message)}</div>`;
  const btn = (label, action, extra = '', className = '') => `<button type="button" class="btn ${className}" data-action="${action}" ${extra}>${label}</button>`;
  const intro = (title, desc, action = '') => `<div class="page-intro"><div><p class="eyebrow">Data Science Society</p><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;
  let brand = '<a class="brand" href="index.html"><span class="brand-mark"><img src="/assets/dss-mark.svg" alt="" width="60" height="40"></span><span>Data Science<br>Society</span></a>';
  function field(key, value = '', options = {}) {
    const label = options.label || ({deep:'Feature panel colour',line:'Border colour',heroImage:'Hero image (optional)',heroImageAlt:'Hero image description',canvasEnabled:'Enable decorative motion',canvasOpacity:'Animation visibility (10–100)',accent:'Primary / button colour',sky:'Highlight colour',bg:'Page background',surface:'Card background',ink:'Text colour',muted:'Secondary text colour',cnic:'CNIC / B-form',studentId:'Student ID',availability:'Weekly commitment',pitch:'Campus activity plan'})[key] || pretty(key), required = options.required ? 'required' : '';
    if (typeof value === 'boolean') return `<label class="field"><span>${h(label)}</span><input name="${h(key)}" type="checkbox" ${value ? 'checked' : ''}></label>`;
    if (options.choices) return `<label class="field"><span>${h(label)}</span><select name="${h(key)}" aria-label="${h(label)}">${options.choices.map(v => `<option value="${h(v)}" ${value === v ? 'selected' : ''}>${h(key==='role'?({student:'Normal member',member:'Society member',ambassador:'Ambassador'})[v]||pretty(v):pretty(v))}</option>`).join('')}</select></label>`;
    const multiline = options.multiline || String(value).includes('\n') || /desc|body|excerpt|bio|pitch|motivation|customCss|reviewNote|message|subtitle/i.test(key);
    const media = ['image','logoImage','heroImage','fileUrl','src'].includes(key);
    return `<label class="field"><span>${h(label)}</span>${multiline ? `<textarea name="${h(key)}" aria-label="${h(label)}" ${required}>${h(value)}</textarea>` : `<input name="${h(key)}" aria-label="${h(label)}" value="${h(value)}" type="${options.type || (['accent','sky','bg','surface','ink','muted','deep','line'].includes(key) ? 'color' : typeof value === 'number' ? 'number' : 'text')}" ${required} ${options.type === 'password' ? `${options.current ? '' : 'minlength="10"'} maxlength="128" autocomplete="${options.current ? 'current-password' : 'new-password'}"` : ''}>`}${media ? `<span class="media-field-actions"><select data-media-select="${h(key)}" aria-label="Choose existing ${h(label)}"><option value="">Choose from media library…</option>${(overview?.uploads || []).filter(u => key === 'fileUrl' || /\.(png|jpe?g|webp|gif)$/i.test(u.url)).map(u=>`<option value="${h(u.url)}">${h(u.fileName)}</option>`).join('')}</select><span class="inline-upload">Upload ${key === 'fileUrl' ? 'document' : 'image'}<input type="file" data-media-upload="${h(key)}" aria-label="Upload ${h(label)}" accept="${key === 'fileUrl' ? '.pdf,.zip,.docx,.pptx,.csv,.txt,.ipynb' : '.png,.jpg,.jpeg,.webp,.gif'}"></span></span>` : ''}</label>`;
  }
  function values(form, template = {}) {
    const result = {}; for (const input of form.querySelectorAll('[name]')) result[input.name] = input.type === 'checkbox' ? input.checked : typeof template[input.name] === 'number' ? Number(input.value) : input.value;
    return result;
  }
  function modal(title, fields, onSave, saveText = 'Apply changes') {
    $('#editor-dialog')?.remove(); const dialog = document.createElement('dialog'); dialog.id = 'editor-dialog';
    dialog.innerHTML = `<div class="dialog-head"><h2>${h(title)}</h2><button class="btn small" type="button" data-close aria-label="Close dialog">×</button></div><form class="dialog-body"><div class="fields two">${fields}</div><p class="feedback" role="alert"></p><div class="dialog-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">${h(saveText)}</button></div></form>`;
    document.body.append(dialog); dialog.querySelectorAll('[data-close]').forEach(b => b.onclick = () => dialog.close());
    dialog.querySelector('form').onsubmit = async event => { event.preventDefault(); const button = dialog.querySelector('[type=submit]'); button.disabled = true; try { await onSave(event.target); dialog.close(); } catch (error) { dialog.querySelector('.feedback').textContent = error.message; } finally { button.disabled = false; } };
    dialog.showModal();
  }
  let auth, model, overview, member, active = 'overview', collection = 'blogs', dirty = false, page = 'index', selected;
  let libraryLevel='all', libraryFilter='all', librarySearch='', libraryLimit=6;
  let pageEditor, selectedElement, liveApply=true, publishing=false;
  const reportPolicy="Submit a PDF report in Google Drive for every task. In your own words, explain what you did, what you learned and the result. Your marks are based on both the task you performed and the report you submitted. AI-written reports receive zero marks, the task is rejected, and no certificate or award is issued.";
  const schema = {
    opportunities: { title:'',type:'Project',desc:'',link:'',requiresAuth:true },
    showcase:{title:'',author:'',desc:'',body:'',link:'',image:'',published:false,requiresAuth:false},
    learningProjects:{assessmentPolicy:reportPolicy,title:'',summary:'',level:'Beginner',duration:'',guidelines:'',deliverables:'',benefits:'Completion certificate after administrator approval.',published:true},
    faq:{title:'',body:'',requiresAuth:false},
    roadmap:{title:'',level:'Beginner',duration:'',prerequisites:'',outcome:'',resourceId:''},
    blogs: { body:'',level:'Beginner',duration:'',title: '', tag: '', author: '', date: '', excerpt: '', image: '', link: '', fileUrl: '', fileName: '', requiresAuth: false },
    papers: { title: '', authors: '', journal: '', excerpt: '', link: '', fileUrl: '', fileName: '', requiresAuth: true },
    events: { status:'planned',time:'',duration:'',organizer:'DSS',eligibility:'',cost:'',bring:'',prerequisites:'',body:'',recap:'',title: '', type: '', date: '', startDate: '', loc: '', desc: '', link: '', fileUrl: '', fileName: '', requiresAuth: false },
    projects: { level:'Beginner',stage:'Practice brief',problem:'',outcome:'',contributors:'',helpWanted:'',body:'',title: '', type: '', lang: '', desc: '',  link: '', fileUrl: '', fileName: '', requiresAuth: false },
    resources: { level:'Beginner',duration:'',prerequisites:'',outcome:'',body:'',title: '', type: '', length: '', desc: '', link: '', fileUrl: '', fileName: '', requiresAuth: true },
    team: { name: '', role: '', category: 'executive', bio: '', image: '', badge: '', funnyRole: '' }, stats: { name: '', value: '' },
    navigation: { title: '', link: '', requiresAuth: false }, announcements: { title: '', body: '', audience: 'all', requiresAuth: false }
  };
  function markDirty() { dirty = true; $('#save-state').textContent = 'Unsaved changes'; }
  async function applyEdit() {
    markDirty();if(!liveApply)return;
    if(publishing)throw new Error('A change is being published. Please wait a moment.');
    publishing=true;
    try{await saveDraft();await api('/api/admin/publish','POST',{revision:model.revision});notifyPublished();$('#save-state').textContent='All changes are live';toast('Published. Your website is updated.');}
    finally{publishing=false;}
  }
  let websitePublishTimer;
  function scheduleWebsitePublish(){clearTimeout(websitePublishTimer);websitePublishTimer=setTimeout(()=>{if(publishing){scheduleWebsitePublish();return;}applyEdit().catch(error=>toast(error.message,true));},250);}
  function notifyPublished(){if(typeof BroadcastChannel==='function'){const channel=new BroadcastChannel('dss-live-content');channel.postMessage('published');channel.close();}}
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  async function saveDraft() {
    if (!model) return;
    if(liveSettingsTimer){clearTimeout(liveSettingsTimer);liveSettingsTimer=undefined;await saveLiveSettings();}await settingsQueue;
    if (active === 'settings' && $('#settings-form')) { const form = $('#settings-form'); for (const input of form.querySelectorAll('[data-group]')) model.draft[input.dataset.group][input.name] = input.type === 'checkbox' ? input.checked : input.value; }
    const result = await api('/api/admin/content', 'PUT', { revision: model.revision, content: model.draft }); model.revision = result.revision; dirty = false;
    $('#save-state').textContent = 'Draft saved · not yet published'; toast('Draft saved. Publish when you are ready.');
  }
  function applyPortalTheme(theme = {}) {
    if (/^#[0-9a-f]{6}$/i.test(theme.accent || '')) document.documentElement.style.setProperty('--brand', theme.accent);
  }
  document.addEventListener('change', async event => {
    const input = event.target, name = input.dataset.mediaSelect || input.dataset.mediaUpload;
    if (!name) return;
    const form = input.closest('form'), target = form?.querySelector('[name="'+name+'"]');
    if (!target) return;
    try {
      if (input.dataset.mediaSelect) { if (!input.value) return; target.value=input.value; }
      else {
        const file=input.files[0]; if(!file)return;
        if(file.size>10*1024*1024)throw new Error('Choose a file up to 10 MB.');
        input.disabled=true;
        const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
        const result=await api('/api/upload-file','POST',{fileName:file.name,fileData:data,public:!form.elements.requiresAuth?.checked});
        target.value=result.url; overview.uploads.unshift(result);
        if(name==='fileUrl' && form.elements.fileName)form.elements.fileName.value=file.name;
        toast('Uploaded and attached. Apply your changes when ready.');
      }
      target.dispatchEvent(new Event('input',{bubbles:true}));
    } catch(error){toast(error.message,true);} finally {input.disabled=false;}
  });
  function adminLogin() {
    $('#app').innerHTML = `<main class="auth-form" style="min-height:100vh"><div class="auth-card">${brand}<p class="eyebrow">Website administration</p><h1>Administrator sign in</h1><p class="muted">Enter your administrator ID and password.</p><form id="admin-login-form" class="fields">${field('username','',{required:true,label:'Administrator ID'})}${field('password','',{type:'password',required:true,current:true,label:'Password'})}<p class="feedback" role="alert"></p><button class="btn primary" type="submit">Sign in</button></form><p style="margin-top:24px"><a href="/">Back to the website</a></p></div></main>`;
    $('#admin-login-form').onsubmit = async event => { event.preventDefault(); const form=event.target,button=form.querySelector('button'); button.disabled=true; try { await api('/api/admin/login','POST',values(form)); location.replace('/admin'); } catch(error) { form.querySelector('.feedback').textContent=error.message; } finally { button.disabled=false; } };
  }
  function login() {
    if (auth.authProvider === 'workos' || auth.authProvider === 'unconfigured') {
      const available = auth.authProvider === 'workos';
      const failed = new URLSearchParams(location.search).has('authError');
      $('#app').innerHTML = '<main class="auth-form" style="min-height:100vh"><div class="auth-card">'+brand+'<p class="eyebrow">Welcome to your society</p><h1>'+h(auth.site?.portal?.loginHeading||'Welcome back.')+'</h1><p class="muted">'+h(auth.site?.portal?.loginDescription||'Start learning with the society.')+'</p>'+(failed?'<p class="feedback" role="alert">We could not complete sign-in. Please try again.</p>':'')+(available?'<div class="fields"><a class="btn primary" href="/auth/login">Sign in</a><a class="btn" href="/auth/signup">Create an account</a></div>':'<p role="status">Sign-in is temporarily unavailable. Please try again later.</p>')+'<p style="margin-top:24px"><a href="index.html">Back to the website</a></p></div></main>';
      return;
    }
    const token = new URLSearchParams(location.search).get('setup'), setup = !!token && auth.setupRequired;
    const reset = new URLSearchParams(location.search).get('reset');
    if (reset) {
      $('#app').innerHTML = `<main class="auth-form" style="min-height:100vh"><div class="auth-card">${brand}<h1>Reset your password</h1><p class="muted">Choose a new password. This link can be used once and expires after one hour.</p><form id="reset-form" class="fields">${field('password', '', { type:'password',required:true,label:'New password (at least 10 characters)' })}<p class="feedback" role="alert"></p><button class="btn primary">Set new password</button></form></div></main>`;
      $('#reset-form').onsubmit = async event => { event.preventDefault(); const form=event.target,button=form.querySelector('button');button.disabled=true;try{await api('/api/auth/reset-password','POST',{...values(form),token:reset});location.replace('login.html');}catch(error){form.querySelector('.feedback').textContent=error.message;}finally{button.disabled=false;} }; return;
    }
    $('#app').innerHTML = `<div class="auth-layout"><section class="auth-story">${brand}<div><p class="eyebrow">Learn. Build. Belong.</p><h1>A little curiosity.<br>A world of possibility.</h1><p>Your next chapter starts with people who get it. Learn, create, and grow with a community of students across Pakistan.</p></div><div class="auth-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div><footer><small>Rooted in Pakistan. Open to possibility.</small><span lang="ur" dir="rtl">مل کر آگے بڑھیں</span></footer></section><main class="auth-form"><div class="auth-card">${brand}<p class="eyebrow">${setup ? 'First-time setup' : 'Welcome back'}</p><h2>${setup ? 'Create your admin account' : 'Sign in to your society'}</h2><p class="muted">${setup ? 'Choose the credentials you will use to manage your website.' : 'Your people. Your projects. Your next possibility.'}</p><form id="login-form" class="fields">${setup ? field('name', '', { required: true, label: 'Full name' }) : ''}${field('email', '', { type: setup ? 'email' : 'text', required: true, label: setup ? 'Email address' : 'Email or username' })}${field('password', '', { type: 'password', required: true, current: !setup, label: setup ? 'Password (at least 10 characters)' : 'Password' })}<p class="feedback" role="alert"></p><button class="btn primary" type="submit">${setup ? 'Create administrator account' : 'Sign in'}</button></form><p class="muted" style="margin-top:24px;font-size:.85rem">New here? <a href="join.html">Create a student account</a></p><p><a href="contact.html"><small>Need help accessing your account?</small></a></p></div></main></div>`;
    $('#login-form [name=email]').autocomplete = 'username';
    $('#login-form [name=password]').autocomplete = setup ? 'new-password' : 'current-password';
    if (!setup && auth.site?.portal) { $('.auth-card h2').textContent=auth.site.portal.loginHeading; $('.auth-card > p.muted').textContent=auth.site.portal.loginDescription; }
    $('#login-form').onsubmit = async event => {
      event.preventDefault(); const form = event.target, button = form.querySelector('button'); button.disabled = true;
      try { const result = await api('/api/auth/' + (setup ? 'setup' : 'login'), 'POST', { ...values(form), token }); const redirect = new URLSearchParams(location.search).get('redirect'); const destination = setup || result.user.role === 'admin' ? '/admin' : redirect && /^(?:index|about|events|projects|resources|research|blog|community)\.html$/.test(redirect) ? redirect : 'member-dashboard.html'; location.href = destination; }
      catch (error) { form.querySelector('.feedback').textContent = error.message; } finally { button.disabled = false; }
    };
  }
  function adminShell() {
    const tabs = { overview: 'Overview', pages: 'Page editor', collections: 'Content library', settings: 'Brand & settings', workspaces:'Role workspaces', applications:'Applications & questions', banners: 'Banners', members: 'Members & approvals', tasks:'Cabinet & tasks',projects:'Projects & courses', activities: 'Ambassador reports', contributions:'Contributions', inbox: 'Contact inbox', media: 'Media library', history: 'History & backup', account: 'Account & security' };
    $('#app').innerHTML = `<aside class="sidebar">${brand}<nav aria-label="Administration">${Object.entries(tabs).map(([key, name]) => `<button data-tab="${key}" class="${key === active ? 'active' : ''}"><span class="nav-icon" aria-hidden="true">${({projects:"◇",tasks:"✓",applications:"?",workspaces:"▦",contributions:"▤",overview:"◈",pages:"▤",collections:"▦",settings:"◐",banners:"⚑",members:"♙",activities:"↗",inbox:"✉",media:"▧",history:"↶",account:"⌘"})[key]}</span>${name}</button>`).join('')}</nav><div class="side-bottom"><p>Website administration<br><small>${h(auth.user.email)}</small></p><a href="index.html" target="_blank">View live website</a></div></aside><div class="workspace"><header class="topbar"><div><strong>Society workspace</strong><small id="save-state">Published website · draft ready to edit</small></div><div class="toolbar"><span class="live-toggle">Changes publish on apply</span>${btn('Save draft', 'save')}${btn('Publish changes', 'publish', '', 'primary')}${btn('Sign out', 'logout')}</div></header><main class="main" id="main"></main></div>`;
    if(location.pathname.startsWith('/build'))active='pages';
    const nav=$('.sidebar nav');const buildLabel=document.createElement('span');buildLabel.className='nav-group-label';buildLabel.textContent='Build the website';nav.insertBefore(buildLabel,nav.querySelector('[data-tab=pages]'));const adminLabel=document.createElement('span');adminLabel.className='nav-group-label';adminLabel.textContent='Society administration';nav.insertBefore(adminLabel,nav.querySelector('[data-tab=members]'));
    renderAdmin();
  }
  let liveSettingsTimer,settingsQueue=Promise.resolve(),settingsGeneration=0;
  function scheduleLiveSettings(){settingsGeneration++;clearTimeout(liveSettingsTimer);liveSettingsTimer=setTimeout(()=>saveLiveSettings().catch(error=>toast(error.message,true)),250);}
  function saveLiveSettings(){
    clearTimeout(liveSettingsTimer);liveSettingsTimer=undefined;const generation=settingsGeneration,payload=structuredClone({portal:model.draft.portal,applications:model.draft.applications});
    const run=settingsQueue.then(async()=>{
      const result=await api('/api/admin/live-settings','PUT',{revision:model.revision,...payload});model.revision=result.revision;model.publishedRevision=result.publishedRevision;
      if(generation===settingsGeneration){dirty=false;$('#save-state').textContent='All portal and application settings are live';}notifyPublished();
    });settingsQueue=run.catch(()=>{});return run;
  }
  function applicationReview(user){
    return ['membershipApplication','ambassadorApplication'].filter(key=>user[key]?.answers).map(key=>'<div class="full"><h3>'+h(key==='membershipApplication'?'Membership answers':'Ambassador answers')+'</h3>'+Object.values(user[key].answers).map(answer=>'<p><strong>'+h(answer.label)+':</strong> '+h(answer.value===true?'Yes':answer.value===false?'No':answer.value??'Unanswered')+'</p>').join('')+'</div>').join('');
  }
  function editQuestion(type,index){
    const questions=model.draft.applications[type].questions,original=index===undefined?{id:'q-'+crypto.randomUUID(),label:'',type:'text',required:true,minLength:0,mustBeYes:false}:questions[index];
    modal(index===undefined?'Add question':'Edit question',field('label',original.label,{label:'Question',required:true})+field('type',original.type,{label:'Answer type',choices:['text','textarea','yesno']})+field('required',original.required,{label:'Required answer'})+field('minLength',original.minLength||0,{label:'Minimum text length'})+field('mustBeYes',original.mustBeYes||false,{label:'Require Yes (yes/no only)'}),async form=>{
      const data=values(form,{minLength:0});if(data.type!=='yesno')data.mustBeYes=false;
      const question={...original,...data};if(index===undefined)questions.push(question);else questions[index]=question;
      settingsGeneration++;await saveLiveSettings();renderAdmin();toast('Question saved to the website.');
    },'Save question');
  }
  function renderApplications(main){
    main.innerHTML=intro('Applications & questions','Open or close each application window. Edit questions for membership and ambassadorship; changes go live when saved.')+'<div class="grid">'+['membership','ambassador'].map(type=>{
      const config=model.draft.applications[type];return '<section class="panel"><h2>'+h(type==='membership'?'Society membership':'Ambassadorship')+'</h2><label class="field"><span>Applications open</span><input type="checkbox" data-application-toggle="'+type+'" '+(config.enabled?'checked':'')+'></label><p class="muted">Closing removes the application page, forms and links across the website.</p><div>'+config.questions.map((q,i)=>'<div class="row"><div><strong>'+h(q.label)+'</strong><small>'+h(q.type==='yesno'?'Yes / No':q.type==='textarea'?'Long answer':'Text answer')+' · '+(q.required?'Required':'Optional')+'</small></div><div class="toolbar">'+btn('↑','move-question','data-type="'+type+'" data-index="'+i+'" data-step="-1"','small')+btn('↓','move-question','data-type="'+type+'" data-index="'+i+'" data-step="1"','small')+btn('Edit','edit-question','data-type="'+type+'" data-index="'+i+'"','small')+btn('Remove','delete-question','data-type="'+type+'" data-index="'+i+'"','small danger')+'</div></div>').join('')+'</div>'+btn('Add question','add-question','data-type="'+type+'"','primary')+'</section>';
    }).join('')+'</div>';
    main.querySelectorAll('[data-application-toggle]').forEach(toggle=>toggle.onchange=async()=>{
      toggle.disabled=true;model.draft.applications[toggle.dataset.applicationToggle].enabled=toggle.checked;settingsGeneration++;
      try{await saveLiveSettings();toast('Application window updated.');}catch(error){toggle.checked=!toggle.checked;model.draft.applications[toggle.dataset.applicationToggle].enabled=toggle.checked;toast(error.message,true);}finally{toggle.disabled=false;}
    });
  }
  function renderAdmin() {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === active));
    if(active!=='pages')pageEditor?.destroy();
    const main = $('#main');
    if(active==='banners'){model.draft.banners ||= [];window.renderBannerManager({host:main,banners:model.draft.banners,field,modal,h,onChange:async()=>{try{await applyEdit();renderAdmin();}catch(error){toast(error.message,true);throw error;}}});}
    if(active==='applications')renderApplications(main);
    if(active==='tasks')renderTaskAdmin(main);
    if(active==='projects')renderProjectAdmin(main);
    if (active === 'overview') {
      const pending = overview.users.filter(u => u.status === 'pending' || u.ambassadorApplication?.status === 'pending' || u.membershipApplication?.status === 'pending').length;
      main.innerHTML = intro('Your society, at a glance.', 'Keep your community moving. Review applications, update your website, and follow the work happening across campuses.', '<a class="btn" href="index.html" target="_blank">Open website</a>') + `<div class="metrics">${[[overview.users.filter(u => u.status === 'approved' && u.role !== 'admin').length, 'Active members'], [pending, 'Awaiting approval'], [overview.registrations.length, 'Event registrations'], [overview.activities.filter(a => a.status === 'pending').length, 'Reports to review']].map(([n, label]) => `<div class="metric"><span>${label}</span><strong>${n}</strong><small>From your community</small></div>`).join('')}</div><div class="grid"><section class="panel"><h2>Make it yours</h2><p class="muted">Select any page to edit its words, links and pictures. Manage cards in the content library. Save your draft, then publish it to everyone.</p><div class="toolbar">${btn('Edit a page', 'tab', 'data-value="pages"', 'primary')}${btn('Review members', 'tab', 'data-value="members"')}</div></section><section class="panel"><h2>Recent activity</h2>${overview.audit.slice(0, 5).map(a => `<div class="row"><div><strong>${h(a.action)}</strong><small>${h(a.actor)} · ${new Date(a.date).toLocaleString()}</small></div></div>`).join('') || empty('Your administration activity will appear here.')}</section></div><div class="note">Publish confirmed event details and genuine student work. Practice briefs and planned sessions are labelled on the website. Manage learning steps and student FAQ in Content library.</div>`;
    }
    if (active === 'overview' && overview.registrations.length) main.insertAdjacentHTML('beforeend', `<section class="panel"><h2>Event registrations</h2>${overview.registrations.map(r=>{const user=overview.users.find(u=>u.id===r.userId);return `<div class="row"><div><strong>${h(r.title)}</strong><small>${h(user?.name)} · ${h(user?.email)} · ${new Date(r.date).toLocaleDateString()}</small></div></div>`;}).join('')}</section>`);
    if (active === 'collections') {
      const items = model.draft.collections[collection] || [];
      main.innerHTML = intro('Content library', 'Create, update, reorder, or remove the cards displayed across your website.') + `<section class="panel"><div class="toolbar"><label class="field">Collection<select id="collection">${Object.keys(schema).map(k => `<option value="${k}" ${k === collection ? 'selected' : ''}>${pretty(k)}</option>`).join('')}</select></label><input class="search" id="content-search" aria-label="Search content" placeholder="Search this collection…">${btn('Add record', 'add-record', '', 'primary')}</div><div id="records">${items.map((item, i) => `<div class="row record-row" data-search="${h((item.title || item.name || '').toLowerCase())}"><div class="details"><strong>${h(item.title || item.name)}</strong><small>${h(item.type || item.role || item.tag || item.journal || item.value || '')}</small> ${item.requiresAuth ? badge('members only') : ''}</div><div class="toolbar">${btn('↑', 'move-record', `data-index="${i}" data-step="-1" aria-label="Move up"`, 'small')}${btn('↓', 'move-record', `data-index="${i}" data-step="1" aria-label="Move down"`, 'small')}${btn('Edit', 'edit-record', `data-index="${i}"`, 'small')}${btn('Delete', 'delete-record', `data-index="${i}"`, 'small danger')}</div></div>`).join('') || empty('No records. Add the first one to get started.')}</div></section>`;
      $('#collection').onchange = e => { collection = e.target.value; renderAdmin(); }; $('#content-search').oninput = e => document.querySelectorAll('.record-row').forEach(row => row.hidden = !row.dataset.search.includes(e.target.value.toLowerCase()));
    }
    if (active === 'settings') {
      const groups = ['siteSettings', 'heroSection', 'pillars', 'theme'];
      main.innerHTML = intro('Brand & settings', 'Manage your identity, home page, announcement and visual theme. Page-specific details can also be changed in the page editor.') + `<form id="settings-form" class="grid">${groups.map(group => `<section class="panel"><h2>${pretty(group)}</h2><div class="fields">${Object.entries(model.draft[group] || {}).filter(([key]) => !['shape', 'position', 'animation', 'colorGradient', 'mode'].includes(key)).map(([key, value]) => field(key, value, key === 'mode' ? { choices: ['light', 'dark'] } : {} ).replace(/name="/g, `data-group="${group}" name="`)).join('')}</div></section>`).join('')}</form><p class="note">Edits remain in your draft until you publish. The lightweight logo animation can be enabled or hidden above. Banner controls are in the dedicated Banners section.</p>`;
      $('#settings-form').oninput = event => { const input = event.target; if(!input.dataset.group)return; model.draft[input.dataset.group][input.name] = input.type === 'checkbox' ? input.checked : input.value; applyPortalTheme(model.draft.theme); markDirty();scheduleWebsitePublish(); }; $('#settings-form').onsubmit = e => e.preventDefault();
    }
    if(active==='workspaces'){
      main.innerHTML=intro('Role workspaces','Control the headings, welcome messages and visible sections for each role.')+'<form id="workspace-settings" class="grid">'+['login','student','member','ambassador','game','task','learning','faq'].map(role=>'<section class="panel"><h2>'+({login:'Sign-in page',student:'Normal member',member:'Society member',ambassador:'Ambassador',game:'Homepage activity',task:'Assigned-work wording',learning:'Learning path wording',faq:'Student FAQ wording'})[role]+'</h2><div class="fields">'+Object.entries(model.draft.portal).filter(([key])=>key.startsWith(role)).map(([key,value])=>field(key,value,{label:pretty(key.slice(role.length))}).replace(/name="/g,'data-group="portal" name="')).join('')+'</div></section>').join('')+'</form><div class="toolbar" style="margin-top:24px">'+btn('Apply workspace changes','apply-workspaces','','primary')+'</div><p class="note">Publish on apply updates the live workspaces. Settings are saved directly to the website. Open pages check for changes every 0.5 seconds.</p>';
      $('#workspace-settings').oninput=event=>{const input=event.target;if(!input.dataset.group)return;model.draft.portal[input.name]=input.type==='checkbox'?input.checked:input.value;markDirty();scheduleLiveSettings();};$('#workspace-settings').onsubmit=event=>event.preventDefault();
    }
    if (active === 'account') main.innerHTML = intro('Account & security', 'Manage the credentials for your society workspace.') + `<section class="panel account-panel"><div class="account-avatar">${h(auth.user.name.charAt(0))}</div><h2>${h(auth.user.name)}</h2><p class="muted">${h(auth.user.username || auth.user.email)}</p>${auth.privateAdmin?'<p class="muted">Administrator credentials are managed by the website owner. Sessions expire after one hour.</p>':'<p class="muted">Password changes take effect immediately and sign out other active sessions.</p>'+btn('Change password','password','','primary')}</section>`;
    if (active === 'members') {
      const nonAdmins = overview.users.filter(u => u.role !== 'admin');
      const memberships = nonAdmins.filter(u => u.membershipApplication?.status === 'pending');
      const others = nonAdmins.filter(u => u.membershipApplication?.status !== 'pending');
      main.innerHTML = intro('Members & approvals', 'Review membership and ambassador applications, and manage the three account modes.', btn('Refresh', 'refresh')) + `<section class="panel" style="margin-bottom: 24px"><h2>Membership Requests</h2>${memberships.map(u => `<div class="row member-row" data-search="${h([u.name, u.email, u.role, u.status].join(' ').toLowerCase())}"><div class="details"><strong>${h(u.name)} ${badge(u.status)} ${badge('membership applicant')}</strong><p>${h(u.email)}</p><small>${h(({student:'Normal member',member:'Society member',ambassador:'Ambassador'})[u.role]||u.role)} · ${h(u.profile?.university || 'University not provided')}</small></div>${btn('Review application', 'review-user', `data-id="${h(u.id)}"`)}</div>`).join('') || empty('No pending membership requests.')}</section><section class="panel"><h2>Normal members, society members & ambassadors</h2><input class="search" id="member-search" aria-label="Search members" placeholder="Search name, email, role or status…">${others.map(u => `<div class="row member-row" data-search="${h([u.name, u.email, u.role, u.status].join(' ').toLowerCase())}"><div class="details"><strong>${h(u.name)} ${badge(u.status)} ${u.ambassadorApplication?.status === 'pending' ? badge('ambassador applicant') : ''}</strong><p>${h(u.email)}</p><small>${h(({student:'Normal member',member:'Society member',ambassador:'Ambassador'})[u.role]||u.role)} · ${h(u.profile?.university || 'University not provided')}</small></div>${btn('Review application', 'review-user', `data-id="${h(u.id)}"`)}</div>`).join('') || empty('Applications will appear here when students register.')}</section>`;
      $('#member-search').oninput = e => document.querySelectorAll('.member-row').forEach(row => row.hidden = !row.dataset.search.includes(e.target.value.toLowerCase()));
    }
    if(active==='contributions')main.innerHTML=intro('Member contributions','Review submitted work and share feedback.',btn('Refresh','refresh'))+`<section class="panel">${(overview.contributions||[]).map(c=>`<article class="row"><div><strong>${h(c.title)} ${badge(c.status)}</strong><small>${h(c.name)}</small><p>${h(c.description)}</p>${c.projectLink?'<a href="'+h(c.projectLink)+'" target="_blank" rel="noopener">Project link ↗</a>':''} ${c.reportLink?'<a href="'+h(c.reportLink)+'" target="_blank" rel="noopener">Report link ↗</a>':''}</div>${btn('Review contribution','review-contribution',`data-id="${h(c.id)}"`)}</article>`).join('')||empty('Submitted contributions will appear here.')}</section>`;
    if (active === 'inbox') main.innerHTML = intro('Contact inbox', 'Read messages submitted through your website and track what has been handled.', btn('Refresh', 'refresh')) + `<section class="panel">${overview.inquiries.map(i => `<article class="row"><div class="details"><strong>${h(i.name)} ${badge(i.status)}</strong><small>${h(i.email)} · ${new Date(i.date).toLocaleString()}</small><p class="prewrap">${h(i.message)}</p></div>${btn(i.status === 'resolved' ? 'Reopen' : 'Mark resolved', 'inquiry', `data-id="${h(i.id)}" data-status="${i.status === 'resolved' ? 'new' : 'resolved'}"`)}</article>`).join('') || empty('No messages yet. Website contact submissions appear here.')}</section>`;
    if (active === 'activities') main.innerHTML = intro('Ambassador reports', 'Review campus activities and share feedback with the ambassador.', btn('Refresh', 'refresh')) + `<section class="panel">${overview.activities.map(a => `<article class="row"><div class="details"><strong>${h(a.title)} ${badge(a.status)}</strong><small>${h(a.name)} · ${h(a.university)} · ${h(a.date)}</small><p>${h(a.description)}</p><small>${a.attendees} attendees</small></div>${btn('Review report', 'review-activity', `data-id="${h(a.id)}"`)}</article>`).join('') || empty('Ambassador activity reports will appear here.')}</section>`;
    if (active === 'media') main.innerHTML = intro('Media library', 'Upload images and documents, then use their URLs in your page editor or content records. Maximum file size: 10 MB.', btn('Upload file', 'upload', '', 'primary')) + `<section class="panel">${overview.uploads.map(u => `<div class="row"><div class="details"><strong>${h(u.fileName)}</strong><small>${h(u.fileSize)} · ${u.public ? 'Public' : 'Members only until published as public content'}</small><p><code>${h(u.url)}</code></p></div><div class="toolbar"><a class="btn" href="${h(u.url)}" target="_blank">Open</a>${btn('Copy URL', 'copy', `data-url="${h(u.url)}"`)}</div></div>`).join('') || empty('Upload your first image or document. Existing sample attachments can be replaced from the content library.')}</section>`;
    if (active === 'history') main.innerHTML = intro('History & backup', 'Restore a previous publication into the draft for review, or export your content. Account records are kept separately.') + `<section class="panel"><div class="toolbar">${btn('Export content JSON', 'export', '', 'primary')}${btn('Import content JSON', 'import')}</div><div class="note">Restoring a version changes the draft. Publish only after reviewing it. The 20 most recent previous publications are retained.</div>${model.history.map(v => `<div class="row"><div><strong>${new Date(v.date).toLocaleString()}</strong><small>${h(v.actor)}</small></div>${btn('Restore to draft', 'restore', `data-id="${h(v.id)}"`)}</div>`).join('') || empty('Publish your first change to create a restore point.')}</section><section class="panel"><h2>Audit log</h2>${overview.audit.slice(0, 50).map(a => `<div class="row"><div><strong>${h(a.action)}</strong><small>${h(a.actor)} · ${new Date(a.date).toLocaleString()}</small></div></div>`).join('')}</section>`;
    if (active === 'pages') renderPageEditor();
  }
  function editRecord(index) {
    const existing = index === undefined ? { ...schema[collection], id: crypto.randomUUID() } : model.draft.collections[collection][index];
    const record = { ...schema[collection], ...existing };
    modal((index === undefined ? 'Add ' : 'Edit ') + pretty(collection), Object.entries(record).filter(([k]) => k !== 'id').map(([key, value]) => field(key, value, { required: ['title', 'name'].includes(key), type: key === 'startDate' ? 'date' : undefined, ...(key==='level'?{choices:['Beginner','Intermediate','Advanced']}:collection==='events'&&key==='status'?{choices:['planned','confirmed','past']}:{}), ...(collection === 'team' && key === 'category' ? {choices: [...new Set(['executive','director','subteam','ambassador',value])],label:'Profile group'} : {}) })).join('') + '<p class="muted full">Use Media library to upload an image or document, then paste its URL above. “Requires auth” restricts files and links to approved accounts.</p>' + (collection === 'team' ? '<p class="muted full">Ambassador profiles appear in the dedicated campus section on About. Publish only profile details the person has agreed to share. These profiles do not expose member applications.</p>' : ''), async form => {
      const updated = { ...record, ...values(form, record) }; if (index === undefined) model.draft.collections[collection].push(updated); else model.draft.collections[collection][index] = updated; await applyEdit(); renderAdmin();
    });
  }
  function renderPageEditor() {
    pageEditor?.destroy();
    $('#main').innerHTML=intro('Page editor','Click an element to edit its settings, or double-click text to write directly in the preview.')+`<div class="panel toolbar"><label class="field">Page<select id="page-select">${['index','about','research','projects','events','blog','resources','community','join','ambassador','opportunities','contact','login','student-dashboard','member-dashboard','ambassador-dashboard','start','detail','learn'].map(p=>`<option ${p===page?'selected':''}>${p}</option>`).join('')}</select></label>${btn('Desktop','preview-size','data-width="100%"')}${btn('Mobile','preview-size','data-width="390px"')}${btn('Page heading & SEO','page-meta')}${btn('Add section','add-block')}${btn('Manage added sections','manage-blocks')}</div><div class="editor-grid"><div class="preview-wrap"><div class="preview-bar"><span>${page}.html</span><span id="editor-status" role="status">Connecting…</span></div><iframe title="Page preview" id="page-preview"></iframe></div><aside class="panel inspector"><h2>Element settings</h2><div id="inspector">${empty('Select text, a picture, a link, or a whole section in the preview.')}</div><label class="field" style="margin-top:20px">Find an element<input id="element-search" placeholder="Heading, image, section…"></label><div class="section-list" id="element-list"></div></aside></div>`;
    $('#page-select').onchange=e=>{page=e.target.value;renderPageEditor();};
    const frame=$('#page-preview');
    pageEditor=new DSSPageEditor({frame,draft:()=>model.draft,onStatus:text=>{if($('#editor-status'))$('#editor-status').textContent=text;},onSelect:selectElement,
      onInventory:elements=>{if(!$('#element-list'))return;$('#element-list').innerHTML=elements.map(el=>`<button type="button" data-select-element="${h(el.id)}">${h(el.tag.toLowerCase()+': '+(el.alt||el.text||el.id).slice(0,55))}</button>`).join('');},
      onRecord:record=>{const split=record.indexOf(':');collection=record.slice(0,split);const id=record.slice(split+1);const index=model.draft.collections[collection]?.findIndex(r=>String(r.id)===id);if(index>=0)editRecord(index);},
      onBlock:index=>editBlock(index),onBanners:()=>{active='banners';renderAdmin();},
      onInlineEdit:async edit=>{model.draft.pages ||= {};model.draft.pages[page] ||= {};model.draft.pages[page][edit.id]={...model.draft.pages[page][edit.id],text:edit.text};try{await applyEdit();}catch(error){toast(error.message,true);}}});
    frame.src='/'+page+'.html?edit=1';
    $('#element-search').oninput=e=>document.querySelectorAll('#element-list button').forEach(button=>button.hidden=!button.textContent.toLowerCase().includes(e.target.value.toLowerCase()));
  }
  function selectElement(el) {
    if(!el)return;selected=el.id;selectedElement=el;
    const props=model.draft.pages?.[page]?.[selected]||{};
    $('#inspector').innerHTML=`<small>${h(el.tag.toLowerCase())} · ${h(selected)}</small><form id="element-form" style="margin-top:18px">${el.canText?field('text',props.text??el.text,{multiline:true,label:'Text content'}):''}${el.tag==='A'?field('href',props.href??el.href,{label:'Link URL'}):''}${el.tag==='IMG'?field('src',props.src??el.src,{label:'Image URL'})+field('alt',props.alt??el.alt,{label:'Image description'}):''}${field('hidden',props.hidden??el.hidden,{label:'Hide this element'})}<button class="btn primary" type="submit">Apply to preview</button>${btn('Reset this element','reset-element')}</form>${el.parentLink?btn('Edit containing link','parent-link'):''}${el.parentSection?btn('Select whole section','parent-section'):''}<p class="muted" style="font-size:12px">${liveApply?'Publish on apply is enabled: applying this change also updates the live website.':'Changes stay in your draft until you publish.'}</p>`;
    $('#element-form').onsubmit=async e=>{e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]');button.disabled=true;model.draft.pages ||= {};model.draft.pages[page] ||= {};model.draft.pages[page][selected]=values(form);try{await applyEdit();pageEditor.apply();if(!liveApply)toast('Preview updated. Your change is in the draft.');}catch(error){toast(error.message,true);}finally{button.disabled=false;}};
  }
  function editBlock(index) {
    model.draft.blocks ||= {}; model.draft.blocks[page] ||= [];
    const block = index === undefined ? { id: crypto.randomUUID(), title: '', body: '', image: '', alt: '', link: '', linkText: '', hidden: false } : model.draft.blocks[page][index];
    modal('Page section', Object.entries(block).filter(([key]) => key !== 'id').map(([key, value]) => field(key, value)).join(''), async form => { const value = { ...block, ...values(form) }; if (index === undefined) model.draft.blocks[page].push(value); else model.draft.blocks[page][index] = value; await applyEdit(); renderPageEditor(); });
  }
  async function refresh() { overview = await api('/api/admin/overview'); renderAdmin(); }
  async function upload() {
    modal('Upload a file', '<label class="field full">Choose image or document<input type="file" name="file" required accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.zip,.docx,.pptx,.csv,.txt,.ipynb"></label>' + field('public', true, { label: 'Public file (turn off for members-only documents)' }), async form => {
      const file = form.elements.file.files[0]; if (!file || file.size > 10 * 1024 * 1024) throw new Error('Choose a file up to 10 MB.');
      const fileData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await api('/api/upload-file', 'POST', { fileName: file.name, fileData, public: form.elements.public.checked }); toast('Uploaded. Copy the URL into your content or page editor.'); await refresh();
    }, 'Upload file');
  }
  function updateBrand(content){const site=content?.siteSettings||{};brand='<a class="brand" href="index.html"><span class="brand-mark"><img src="'+h(site.logoImage||'/assets/dss-mark.svg')+'" alt="" width="60" height="40"></span><span>'+h(site.siteTitle||'Data Science Society')+'</span></a>';}
  let memberLoading;
  async function loadMember() { if(memberLoading)return memberLoading;memberLoading=(async()=>{member = await api('/api/member'); if(member.content) applyPortalTheme(member.content.theme); updateBrand(member.content);renderMember();})();try{await memberLoading;}finally{memberLoading=null;} }
  function renderLibrary() {
    const host=$('#library-results');if(!host)return;
    const records=['resources','papers','projects','blogs'].flatMap(key=>(member.content.collections[key]||[]).map(record=>({key,record}))).filter(({key,record})=>(libraryFilter==='all'||key===libraryFilter)&&(libraryLevel==='all'||record.level===libraryLevel)&&(record.title+' '+(record.desc||record.excerpt||'')).toLowerCase().includes(librarySearch.toLowerCase()));
    host.innerHTML=records.slice(0,libraryLimit).map(({key,record})=>memberResource(record,key)).join('')||empty('No resources match your search.');
    $('#library-more').hidden=records.length<=libraryLimit;
  }
  function memberResource(record, key) {
    const saved = member.bookmarks.some(b => b.collection === key && String(b.recordId) === String(record.id));
    return `<article class="member-card"><small>${h(record.type || record.tag || record.journal || key)}</small><h3>${h(record.title)}</h3><p>${h(record.desc || record.excerpt || '')}</p><div class="toolbar"><a class="btn small" href="detail.html?collection=${key}&amp;id=${encodeURIComponent(record.id)}">Read details</a>${record.fileUrl ? `<a class="btn small" href="${h(record.fileUrl)}" target="_blank">Download</a>` : ''}${record.link ? `<a class="btn small" href="${h(record.link)}" target="_blank" rel="noopener">Open</a>` : ''}${btn(saved ? 'Remove saved' : 'Save resource', 'bookmark', `data-id="${h(record.id)}" data-key="${key}" data-remove="${saved}"`, 'small')}</div></article>`;
  }
  let pendingPortalContent;
  const previewParams=new URLSearchParams(location.search),portalPreview=previewParams.has('edit')&&parent!==window;
  function portalPage(){return document.body.dataset.portal==='login'?'login':member?.user.role==='ambassador'?'ambassador-dashboard':member?.user.role==='member'?'member-dashboard':'student-dashboard';}
  function applyPortalEdits(content){
    const key=portalPage();
    const selectors={
      'greeting':'.member-greeting h1',
      'profile-button':'.member-head [data-action=profile]','logout-button':'.member-head [data-action=logout]',
      'story-heading':'.auth-story h1','story-description':'.auth-story > div > p:not(.eyebrow)','story-footer':'.auth-story footer small','story-urdu':'.auth-story footer span',
      'signin-button':'#login-form button[type=submit]','signup-link':'.auth-card a[href="join.html"]','story-tagline':'.auth-story .eyebrow',
      'saved-metric':'.metric:nth-child(1) > span','events-metric':'.metric:nth-child(2) > span','work-metric':'.metric:nth-child(3) > span',
      'report-button':'#member-content [data-action=new-activity]','contribution-button':'#member-content [data-action=new-contribution]',
      'welcome-panel':'.workspace-welcome','applications-panel':'.membership-invite','role-title':'.member-greeting p','welcome-heading':'.workspace-welcome h2','welcome-description':'.workspace-welcome span','welcome-title':'.workspace-welcome p',
      'signin-heading':'.auth-card h1,.auth-card h2','signin-description':'.auth-card > p.muted',
      'library-heading':'.starter-resources + h2','application-heading':'.membership-invite h2','application-description':'.membership-invite p',
      'website-link':'.member-head a.btn','library-link':'.member-tabs [data-member-tab=library]','home-tab':'.member-tabs [data-member-tab=home]','events-tab':'.member-tabs [data-member-tab=events]','saved-tab':'.member-tabs [data-member-tab=saved]','contributions-tab':'.member-tabs [data-member-tab=contributions]',
      'contribution-heading':'#member-content > .panel h2','login-footer':'.auth-card > p:last-child a'
    };
    for(const [id,selector]of Object.entries(selectors))document.querySelectorAll(selector).forEach((el,i)=>{
      el.dataset.cmsId='cms-'+key+'-'+id+(i?'-'+i:'');el.dataset.cmsText=String(!el.matches('section'));
    });
    document.querySelectorAll('.auth-card .field > span,#member-content h2,#member-content > .panel > p,#member-content > .panel > .page-intro p').forEach(el=>{
      if(el.dataset.cmsId)return;const name=el.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,100);
      el.dataset.cmsId='cms-'+key+'-copy-'+name;el.dataset.cmsText='true';
    });
    const headings=content.pageHeaders?.[key];if(headings){const mainHeading=document.querySelector('.member-greeting h1,.auth-card h1,.auth-card h2');if(headings.title&&mainHeading)mainHeading.textContent=headings.title;if(headings.seoTitle)document.title=headings.seoTitle;}
    const added=document.createElement('div');added.id='portal-added-blocks';
    added.innerHTML=(content.blocks?.[key]||[]).map((block,index)=>({...block,index})).filter(block=>!block.hidden).map(block=>'<section class="panel" data-block="'+block.index+'"><h2>'+h(block.title)+'</h2><p>'+h(block.body)+'</p>'+(block.image?'<img src="'+h(block.image)+'" alt="'+h(block.alt||'')+'" style="max-width:100%">':'')+(block.link?'<a class="btn" href="'+h(block.link)+'">'+h(block.linkText||'Learn more')+'</a>':'')+'</section>').join('');
    $('#portal-added-blocks')?.remove();document.querySelector('.member-main,.auth-card')?.append(added);
    for(const [id,props]of Object.entries(content.pages?.[key]||{})){
      const el=document.querySelector('[data-cms-id="'+CSS.escape(id)+'"]');if(!el)continue;
      if(props.text!==undefined&&el.dataset.cmsText==='true')el.textContent=props.text;
      for(const prop of ['href','src','alt'])if(props[prop]!==undefined)el.setAttribute(prop,props[prop]);
      if(props.hidden!==undefined)el.hidden=props.hidden;
    }
    document.dispatchEvent(new CustomEvent('dss:rendered'));
  }
  window.applySiteContent=content=>{
    if(!auth||document.body.dataset.portal==='member'&&!member){pendingPortalContent=content;return;}
    applyPortalTheme(content.theme);updateBrand(content);
    if(document.body.dataset.portal==='login'){auth.site=content;login();applyPortalEdits(content);}
    else if(member){member.content=content;renderMember();}
  };
  let memberTab='home';
  function taskRows(tasks,adminView=false){
    return [...tasks].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).map(t=>`<article class="task-card"><div class="task-heading"><div><small>${h(t.type)}${t.eventId?' · '+h((adminView?model.draft:member.content).collections.events.find(e=>String(e.id)===String(t.eventId))?.title||'Event'):''}</small><h3>${h(t.title)}</h3></div>${badge(t.status)}</div><p>${h(t.description)}</p><div class="task-meta">${adminView?'<span>Assigned to '+h(t.assigneeName)+'</span>':''}<span>${t.dueDate?'Due '+h(t.dueDate)+' · Pakistan time':'No deadline set'}</span>${t.dueDate&&t.status!=='completed'&&t.dueDate<new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Karachi'})?badge('overdue'):''}</div>${t.submission?'<div class="note"><strong>Work update</strong><p>'+h(t.submission)+'</p>'+(t.evidenceLink?'<a href="'+h(t.evidenceLink)+'" target="_blank" rel="noopener">View evidence</a>':'')+'</div>':''}${t.reportLink?'<a href="'+h(t.reportLink)+'" target="_blank" rel="noopener">PDF learning report ↗</a>':''}${t.marks===0?'<p>Zero marks · report rejected. No award.</p>':''}${t.reviewNote?'<div class="note"><strong>Administrator feedback</strong><p>'+h(t.reviewNote)+'</p></div>':''}<div class="toolbar">${adminView?btn('Edit / review','edit-task','data-id="'+h(t.id)+'"','small')+btn('Remove','delete-task','data-id="'+h(t.id)+'"','small danger'):t.status!=='completed'?btn('Update work','update-task','data-id="'+h(t.id)+'"','small primary'):''}</div></article>`).join('')||empty('No assigned work yet. New assignments will appear here.');
  }
  function editTask(id){
    const task=(overview.tasks||[]).find(t=>t.id===id)||{title:'',description:'',assigneeId:'',type:'daily',dueDate:'',eventId:'',status:'todo',reviewNote:''};
    const people=overview.users.filter(u=>u.status==='approved'&&(u.role==='admin'||u.role==='ambassador'||u.role==='member'&&u.cabinetPosition));
    if(!people.some(u=>u.id===auth.user.id))people.push(auth.user);
    const select=(key,label,rows)=>'<label class="field"><span>'+label+'</span><select name="'+key+'" aria-label="'+label+'" required>'+rows.map(([value,label])=>'<option value="'+h(value)+'" '+(String(task[key])===String(value)?'selected':'')+'>'+h(label)+'</option>').join('')+'</select></label>';
    modal(id?'Edit & review assigned work':'Assign work',field('title',task.title,{required:true})+field('description',task.description,{label:'Instructions',required:true,multiline:true})+select('assigneeId','Assign to',[['','Choose a person'],...people.map(u=>[u.id,u.name+' · '+(u.cabinetPosition||u.role)])])+field('type',task.type,{choices:['daily','event','general']})+field('dueDate',task.dueDate,{type:'date',label:'Due date (Pakistan time)'})+select('eventId','Related event',[['','No event'],...model.draft.collections.events.map(e=>[e.id,e.title])])+field('status',task.status,{choices:['todo','in-progress','submitted','completed','rejected']})+field('reviewNote',task.reviewNote,{label:'Feedback visible to the assignee'})+field('aiWrittenReport',task.aiWrittenReport===true,{label:'Reject AI-written report · zero marks'})+'<p class="full muted">'+h(reportPolicy)+'</p>',async form=>{await api('/api/admin/tasks',id?'PUT':'POST',{...values(form),...(id?{id}:{})});await refresh();toast('Assignment saved.');},'Save assignment');
    $('#editor-dialog select[name=eventId]').required=false;
  }
  function renderTaskAdmin(main){
    main.innerHTML=intro('Cabinet & assigned work','Appoint society-member positions, assign daily or event jobs, and review cabinet, ambassador and administrator work.',btn('Assign work','new-task','','primary'))+'<section class="panel"><h2>Cabinet appointments</h2><p class="muted">A cabinet position belongs to a society-member account. Only appointed members see the assigned-work option.</p>'+(overview.users.filter(u=>u.role==='member'&&u.status==='approved').map(u=>'<div class="row"><div><strong>'+h(u.name)+'</strong><small>'+h(u.cabinetPosition||'Society member · no cabinet position')+'</small></div>'+btn('Appoint / edit position','review-user','data-id="'+h(u.id)+'"','small')+'</div>').join('')||empty('Approve a society member to appoint a cabinet position.'))+'</section><section class="panel"><h2>Task board</h2><div class="toolbar"><label class="field">Assignee<select id="task-assignee-filter"><option value="all">Everyone</option>'+[...new Map((overview.tasks||[]).map(t=>[t.assigneeId,t.assigneeName])).entries()].map(([id,name])=>'<option value="'+h(id)+'">'+h(name)+'</option>').join('')+'</select></label><label class="field">Status<select id="task-status-filter">'+['all','todo','in-progress','submitted','completed','rejected'].map(s=>'<option>'+s+'</option>').join('')+'</select></label></div><div id="task-board"></div></section>';
    const update=()=>{$('#task-board').innerHTML=taskRows((overview.tasks||[]).filter(t=>($('#task-assignee-filter').value==='all'||t.assigneeId===$('#task-assignee-filter').value)&&($('#task-status-filter').value==='all'||t.status===$('#task-status-filter').value)),true);};$('#task-assignee-filter').onchange=update;$('#task-status-filter').onchange=update;update();
  }
  function learningPanel(){
    const courses=member.content.collections.learningProjects||[],work=member.coursework||[],next=courses.find(c=>!c.locked&&c.id!=='starter-project'&&work.find(a=>a.projectId===c.id&&a.status!=='approved'))||courses.find(c=>c.id==='starter-project');
    return '<section class="panel learning-dashboard"><div class="page-intro"><div><p class="eyebrow">'+work.filter(a=>a.status==='approved').length+' projects approved</p><h2>'+h(member.content.portal.learningHeading||'Your project studio')+'</h2><p>'+h(next?.title||'Start with a small project.')+'</p></div><a class="btn primary" href="learn.html?project='+encodeURIComponent(next?.id||'starter-project')+'">Open project</a></div><a class="btn" href="start.html">View the project pathway</a></section>';
  }
  function projectPanel(){
    const courses=member.content.collections.learningProjects||[],work=member.coursework||[];
    return '<section class="panel"><div class="page-intro"><div><h2>Your project pathway</h2><p>The starter is open. Member projects require a personal administrator assignment.</p></div><a class="btn" href="start.html">Full pathway</a></div>'+courses.map(c=>{const a=work.find(w=>w.projectId===c.id&&w.access==='assigned');return '<article class="row"><div><strong>'+h(c.title)+'</strong><small>'+h(c.locked?'Locked · administrator assignment required':a?a.status.replace(/-/g,' '):'Open starter')+'</small>'+(a?.reviewNote?'<p>'+h(a.reviewNote)+'</p>':'')+'</div>'+(!c.locked?'<a class="btn small" href="learn.html?project='+encodeURIComponent(c.id)+'">Open workspace</a>':'<span class="badge">Locked</span>')+'</article>';}).join('')+'</section>'+'<section class="panel"><h2>Your certificates</h2>'+work.filter(a=>a.access==='assigned'&&a.status==='approved'&&a.certificate&&member.user.role==='member').map(a=>'<div class="row"><div><strong>'+h(a.title)+'</strong><small>'+h(a.certificate.id)+'</small></div><a class="btn small primary" href="'+h(a.certificate.downloadUrl)+'" target="_blank" rel="noopener">Get certificate</a></div>').join('')+(!work.some(a=>a.access==='assigned'&&a.status==='approved'&&a.certificate&&member.user.role==='member')?empty('Certificates appear after an administrator approves a member project and issues its certificate. The starter does not award a certificate.'):'')+'</section>';
  }
  function editLearningProject(id){
    const course=model.draft.collections.learningProjects.find(c=>c.id===id)||{...schema.learningProjects,id:crypto.randomUUID()};
    modal(id?'Edit project guidelines':'Create member project',Object.entries(course).filter(([key])=>key!=='id').map(([key,value])=>field(key,value,{required:['title','guidelines'].includes(key),multiline:['guidelines','deliverables','benefits','assessmentPolicy'].includes(key)})).join('')+'<p class="full muted">The starter stays open and has no certificate. Every other project stays locked until assigned to a society member. Publish your brief before assigning it.</p>',async form=>{const updated={...course,...values(form,course)};const index=model.draft.collections.learningProjects.findIndex(c=>c.id===course.id);if(index<0)model.draft.collections.learningProjects.push(updated);else model.draft.collections.learningProjects[index]=updated;await applyEdit();renderAdmin();},'Save project guidelines');
  }
  function assignLearningProject(){
    const people=overview.users.filter(u=>u.role==='member'&&u.status==='approved'),courses=model.draft.collections.learningProjects.filter(c=>c.id!=='starter-project'&&c.published);
    const select=(key,label,rows)=>'<label class="field"><span>'+label+'</span><select name="'+key+'" aria-label="'+label+'" required><option value="">Choose…</option>'+rows.map(([v,t])=>'<option value="'+h(v)+'">'+h(t)+'</option>').join('')+'</select></label>';
    modal('Assign a member project',select('userId','Society member',people.map(u=>[u.id,u.name+' · '+u.email]))+select('projectId','Project',courses.map(c=>[c.id,c.title]))+field('instructions','',{label:'Personal instructions',multiline:true})+field('dueDate','',{type:'date',label:'Deadline (Pakistan time)'}),async form=>{await api('/api/admin/coursework','POST',values(form));await refresh();toast('Project access assigned.');},'Assign project');
  }
  function renderProjectAdmin(main){
    const work=overview.coursework||[];
    main.innerHTML=intro('Projects & courses','Manage briefs, choose each member’s projects, review both submission links and issue completion certificates.',btn('Create member project','new-learning-project')+btn('Assign project','assign-learning-project','','primary'))+'<section class="panel"><h2>Project guidelines</h2>'+model.draft.collections.learningProjects.map(c=>'<div class="row"><div><strong>'+h(c.title)+'</strong><small>'+h(c.id==='starter-project'?'Open starter · no certificate':c.published?'Members · assigned access':'Unpublished member project')+'</small></div>'+btn('Edit guidelines','edit-learning-project','data-id="'+h(c.id)+'"','small')+'</div>').join('')+'</section><section class="panel"><h2>Assignments & submissions</h2><div class="toolbar"><label class="field">Status<select id="coursework-status"><option value="all">All</option>'+['assigned','submitted','changes-requested','approved','rejected'].map(s=>'<option>'+s+'</option>').join('')+'</select></label><input id="coursework-search" class="search" aria-label="Search projects or members" placeholder="Search project or member"></div><div id="coursework-board"></div></section>';
    const update=()=>{$('#coursework-board').innerHTML=work.filter(a=>($('#coursework-status').value==='all'||a.status===$('#coursework-status').value)&&(a.title+' '+a.name+' '+a.email).toLowerCase().includes($('#coursework-search').value.toLowerCase())).map(a=>'<article class="task-card"><div class="task-heading"><div><small>'+h(a.name)+' · '+h(a.email)+'</small><h3>'+h(a.title)+'</h3></div>'+badge(a.access==='revoked'?'access revoked':a.status)+'</div>'+(a.dueDate?'<p>Due '+h(a.dueDate)+'</p>':'')+(a.submission?'<div class="toolbar"><a class="btn small" href="'+h(a.submission.projectLink)+'" target="_blank" rel="noopener">Project link ↗</a><a class="btn small" href="'+h(a.submission.reportLink)+'" target="_blank" rel="noopener">Report link ↗</a></div><p>'+h(a.submission.note)+'</p>':'<p class="muted">Waiting for the student’s project and report links.</p>')+(a.reviewNote?'<p>'+h(a.reviewNote)+'</p>':'')+'<div class="toolbar">'+(a.submission&&a.access==='assigned'?btn('Review submission','review-coursework','data-id="'+h(a.id)+'"','small'):'')+(a.status==='approved'&&a.projectId!=='starter-project'&&a.access==='assigned'?btn(a.certificate?'Replace certificate':'Issue certificate','issue-course-certificate','data-id="'+h(a.id)+'"','small primary'):'')+(a.certificate?btn('Revoke certificate','revoke-course-certificate','data-id="'+h(a.id)+'"','small danger')+'<small>'+h(a.certificate.id)+'</small>':'')+(a.projectId!=='starter-project'&&a.access==='assigned'?btn('Revoke access','revoke-course-access','data-id="'+h(a.id)+'"','small danger'):'')+'</div></article>').join('')||empty('Assignments and starter submissions will appear here.');};$('#coursework-status').onchange=update;$('#coursework-search').oninput=update;update();
  }
  function renderMember() {
    const user=member.user, approved=user.status==='approved', ambassador=user.role==='ambassador', society=user.role==='member', contributor=ambassador||society;
    const cabinet=society&&!!user.cabinetPosition,hasTasks=approved&&(cabinet||ambassador);
    const workspaceRole=ambassador?'ambassador':society?'member':'student',portal=member.content?.portal||{};
    const enabled=feature=>portal[workspaceRole+feature+'Enabled']!==false;
    document.body.dataset.workspaceRole=workspaceRole;
    document.body.dataset.memberRole=user.role;
    const roleTitle=portal[workspaceRole+'Title']||(ambassador?'Campus workspace':society?'Society workspace':'Learning dashboard');
    document.title=roleTitle+' | Data Science Society';
    const tabs={home:portal[workspaceRole+'OverviewLabel']||(ambassador?'Campus overview':society?'Member overview':'My learning'),...(enabled('Library')?{library:'Library',saved:'Saved resources'}:{}),...(enabled('Events')?{events:'Events'}:{}),...(contributor&&enabled('Contributions')?{contributions:'Contributions'}:{})};
    tabs.projects='My projects';
    if(hasTasks)tabs.tasks='Assigned work';
    if(!tabs[memberTab])memberTab='home';
    const notes=['membershipApplication','ambassadorApplication'].filter(k=>user[k]&&user[k].status!=='approved').map(k=>`<div class="note"><strong>${k==='membershipApplication'?'Membership':'Ambassador'} application: ${h(user[k].status)}</strong><p>${h(user[k].reviewNote||'Track your application here. Your current account remains available.')}</p>${btn('Check application status','member-refresh')}</div>`).join('');
    const metrics=[[member.bookmarks.length,'Saved resources'],[member.registrations.length,'Event registrations'],[ambassador?member.activities.filter(a=>a.status==='approved').length:society?(member.contributions||[]).length:member.content?.collections.resources.length,ambassador?'Approved activities':society?'Contributions':'Learning resources']];
    const reports=ambassador&&portal.ambassadorActivitiesEnabled!==false?`<section class="panel"><div class="page-intro"><div><h2>Campus activity</h2><p>Your reports and feedback from the society team.</p></div>${btn('Submit activity report','new-activity','','primary')}</div>${member.activities.map(a=>`<article class="row"><div><strong>${h(a.title)} ${badge(a.status)}</strong><small>${h(a.date)} · ${a.attendees} attendees</small><p>${h(a.description)}</p>${a.reviewNote?`<div class="note">${h(a.reviewNote)}</div>`:''}</div></article>`).join('')||empty('Submit your first report after a campus activity.')}</section>`:'';
    const opportunities=contributor&&enabled('Contributions')?`<section class="panel"><h2>Contribution opportunities</h2>${(member.content?.collections.opportunities||[]).map(o=>`<article class="member-card"><small>${h(o.type)}</small><h3>${h(o.title)}</h3><p>${h(o.desc)}</p>${o.link?`<a class="btn small" href="${h(o.link)}" target="_blank" rel="noopener">View opportunity</a>`:''}</article>`).join('')||empty('The society team will publish opportunities here. You can also propose your own contribution.')}</section>`:'';
    const contributionPanel=enabled('Contributions')?`<section class="panel"><div class="page-intro"><div><h2>Your contributions</h2><p>Share a project, article, or idea with the team.</p></div>${btn('Submit contribution','new-contribution','','primary')}</div>${(member.contributions||[]).map(c=>`<article class="row"><div><strong>${h(c.title)} ${badge(c.status)}</strong><p>${h(c.description)}</p>${c.reviewNote?`<div class="note">${h(c.reviewNote)}</div>`:''}</div></article>`).join('')||empty('Your submitted work and review feedback will appear here.')}</section>`:'';
    let panel='';
    if(!approved)panel=`<section class="panel"><h2>Application ${h(user.status)}</h2><p>${user.status==='pending'?'Your application is waiting for review. We’ll show the decision here.':'Contact the society team if you have questions about your access.'}</p>${user.reviewNote?`<div class="note">${h(user.reviewNote)}</div>`:''}${btn('Check application status','member-refresh','','primary')} <a class="btn" href="contact.html">Contact the team</a></section>`;
    else if(memberTab==='home')panel=`<section class="workspace-welcome"><div><p>${h(roleTitle)}</p><h2>${h(portal[workspaceRole+'Heading']||(ambassador?'Bring your campus together.':society?'Make your next contribution.':'What will you learn today?'))}</h2><span>${h(portal[workspaceRole+'Description']||'Your place in the society.')}</span></div><div class="workspace-lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></section><div class="metrics">${metrics.map(([n,t])=>`<div class="metric"><span>${t}</span><strong>${h(n)}</strong></div>`).join('')}</div>${notes}${(member.content.collections.announcements||[]).filter(a=>!a.audience||a.audience==='all'||a.audience===user.role||a.audience===workspaceRole).map(a=>`<div class="note"><strong>${h(a.title)}</strong><p>${h(a.body)}</p></div>`).join('')}${ambassador?reports+opportunities:contributor?opportunities+contributionPanel:`<section class="panel" ${enabled('Library')?'':'hidden'}><div class="page-intro"><div><h2>${h(portal.studentLibraryHeading)}</h2><p>${h(portal.studentLibraryDescription)}</p></div><button class="btn" data-member-tab="library">Explore the library</button></div><div class="starter-resources">${member.content.collections.resources.slice(0,3).map(r=>memberResource(r,'resources')).join('')}</div></section>${member.content.applications.membership.enabled||member.content.applications.ambassador.enabled?`<section class="membership-invite"><div><h2>${h(portal.studentApplicationHeading)}</h2><p>${h(portal.studentApplicationDescription)}</p></div>${member.content.applications.membership.enabled?'<a class="btn primary" href="join.html?track=membership">Apply for membership</a>':''}${member.content.applications.ambassador.enabled?'<a class="btn" href="ambassador.html">Apply for ambassadorship</a>':''}</section>`:''}`}`;
    else if(memberTab==='projects')panel=projectPanel();
    else if(memberTab==='tasks'&&hasTasks)panel='<section class="panel"><h2>'+h(portal.taskHeading||'Your assigned work')+'</h2><p class="muted">'+h(portal.taskDescription||'Daily responsibilities and event jobs appointed by the society team.')+'</p>'+taskRows(member.tasks||[])+'</section>';
    else if(memberTab==='contributions')panel=opportunities+contributionPanel;
    else if(memberTab==='saved')panel=`<section class="panel"><h2>Your saved resources</h2>${member.bookmarks.map(b=>{const r=member.content.collections[b.collection]?.find(r=>String(r.id)===String(b.recordId));return r?memberResource(r,b.collection):'';}).join('')||empty('Save something from the library to find it here.')}</section>`;
    else if(memberTab==='library')panel=`<section class="panel"><h2>Explore the library</h2><div class="toolbar"><label class="field">Type<select id="library-filter">${['all','resources','papers','projects','blogs'].map(k=>`<option value="${k}" ${k===libraryFilter?'selected':''}>${pretty(k)}</option>`).join('')}</select></label><label class="field">Level<select id="library-level">${['all','Beginner','Intermediate','Advanced'].map(level=>'<option value="'+level+'" '+(level===libraryLevel?'selected':'')+'>'+level+'</option>').join('')}</select></label><input class="search" id="library-search" aria-label="Search resources" placeholder="Search resources" value="${h(librarySearch)}"></div><div id="library-results"></div><button class="btn" id="library-more" data-action="more-resources">Show more resources</button></section>`;
    else if(memberTab==='events')panel=`<section class="panel"><h2>Events & registrations</h2>${member.content.collections.events.map(e=>{const registered=member.registrations.some(r=>String(r.eventId)===String(e.id)),past=e.startDate&&new Date(e.startDate+'T23:59:59+05:00')<new Date();return `<article class="member-card"><small>${h(e.date)} · ${h(e.loc)}</small><h3>${h(e.title)}</h3><p>${h(e.desc)}</p><div class="toolbar">${registered?badge('registered'):''}${(!past&&e.status!=='planned'&&e.status!=='past')||registered?btn(registered?'Cancel registration':'Register','event',`data-id="${h(e.id)}" data-cancel="${registered}"`,registered?'small':'small primary'):badge(e.status==='planned'?'planned · details to be confirmed':'registration closed')}<a class="btn small" href="detail.html?collection=events&amp;id=${encodeURIComponent(e.id)}">Event details</a></div></article>`;}).join('')||empty('New events will appear here.')}</section>`;
    if(approved&&memberTab==='home'){
      const registeredNext=member.registrations.map(r=>member.content.collections.events.find(e=>String(e.id)===String(r.eventId))).filter(e=>e&&e.startDate&&Date.parse(e.startDate+'T23:59:59+05:00')>=Date.now()).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];
      const nextTask=(member.tasks||[]).filter(t=>t.status!=='completed').sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'))[0];
      panel=panel.replace('</section>','</section>'+(!contributor?learningPanel():hasTasks?'<section class="panel assigned-summary"><p class="eyebrow">'+h(cabinet?user.cabinetPosition:'Ambassador responsibilities')+'</p><h2>'+h(nextTask?.title||'Your assigned work')+'</h2><p>'+h(nextTask?nextTask.description:'Your administrator will appoint daily and event jobs here.')+'</p><button class="btn primary" data-member-tab="tasks">View assigned work ('+(member.tasks||[]).filter(t=>t.status!=='completed').length+')</button></section>':''));
      if(contributor)panel=panel.replace('</section>','</section>'+learningPanel());
      if(registeredNext)panel='<section class="note"><strong>Your next registered event: '+h(registeredNext.title)+'</strong><p>'+h(registeredNext.date)+' · '+h(registeredNext.time||'Time to be confirmed')+'</p><a href="detail.html?collection=events&amp;id='+encodeURIComponent(registeredNext.id)+'">View event details</a></section>'+panel;
      const history=['membershipApplication','ambassadorApplication'].filter(k=>user[k]?.status==='approved');if(history.length)panel+='<details class="panel"><summary>Application history</summary>'+history.map(k=>'<p>'+h(k==='membershipApplication'?'Society membership':'Ambassadorship')+' · approved</p>').join('')+'</details>';
    }
    $('#app').innerHTML=`<header class="member-topbar"><div class="member-head">${brand}<div class="toolbar"><a class="btn" href="index.html">Website</a>${btn('Profile','profile')}${btn('Sign out','logout')}</div></div></header><main class="member-main"><div class="member-greeting"><div><p>${h(roleTitle)}</p><h1>Hello, ${h(user.name.split(' ')[0])}.</h1></div><div class="role-reputation">${badge(user.role==='student'?'Normal member':user.role==='member'?'Society member':'Ambassador')}${cabinet?'<span class="cabinet-position">'+h(user.cabinetPosition)+'</span>':''}<small>${ambassador?member.activities.filter(a=>a.status==='approved').length+' approved activities':society?(member.contributions||[]).filter(c=>c.status==='approved').length+' approved contributions':(member.coursework||[]).filter(a=>a.status==='approved').length+' projects approved'}</small></div></div>${approved?`<div class="workspace-pathways">${member.content?.applications?.membership.enabled&&user.role==='student'&&user.membershipApplication?.status!=='pending'?'<a class="btn" href="join.html?track=membership">Apply for membership</a>':''}${member.content?.applications?.ambassador.enabled&&!ambassador&&user.ambassadorApplication?.status!=='pending'?'<a class="btn" href="ambassador.html">Apply for ambassador</a>':''}</div><nav class="member-tabs" aria-label="Your workspace">${Object.entries(tabs).map(([k,t])=>`<button data-member-tab="${k}" aria-current="${k===memberTab?'page':'false'}">${t}</button>`).join('')}</nav>`:''}<div id="member-content">${panel}</div></main>`;
    applyPortalEdits(member.content||{});
    if($('#library-filter')){renderLibrary();$('#library-level').onchange=e=>{libraryLevel=e.target.value;libraryLimit=6;renderLibrary();};$('#library-filter').onchange=e=>{libraryFilter=e.target.value;libraryLimit=6;renderLibrary();};$('#library-search').oninput=e=>{librarySearch=e.target.value;libraryLimit=6;renderLibrary();};}
  }

  document.addEventListener('click', async event => {
    const memberButton=event.target.closest('[data-member-tab]');if(memberButton){memberTab=memberButton.dataset.memberTab;renderMember();return;}
    const tab = event.target.closest('[data-tab]'); if (tab) { active = tab.dataset.tab; overview=await api('/api/admin/overview'); if(active==='history'&&!dirty){try{model=await api('/api/admin/content');}catch(error){toast(error.message,true);}} renderAdmin(); return; }
    const select = event.target.closest('[data-select-element]'); if(select){pageEditor.select(select.dataset.selectElement);return;}
    const button = event.target.closest('[data-action]'); if (!button) return; const action = button.dataset.action; button.disabled = true;
    try {
      if (action === 'logout') { if (dirty && !confirm('Leave without saving your draft changes?')) return; const result = await api(auth.privateAdmin ? '/api/admin/logout' : '/api/auth/logout', 'POST', {}); dirty = false; location.href = result.logoutUrl || 'login.html'; }
      if (action === 'save') await saveDraft();
      if(action==='apply-workspaces')await saveLiveSettings();
      if (action === 'publish') { await saveDraft(); await api('/api/admin/publish', 'POST', { revision: model.revision });notifyPublished(); model = await api('/api/admin/content'); $('#save-state').textContent = 'All changes are live'; toast('Published. Your website has updated for visitors.'); }
      if (action === 'tab') { active = button.dataset.value; renderAdmin(); }
      if (action === 'refresh') await refresh();
      if(action==='new-learning-project')editLearningProject();
      if(action==='edit-learning-project')editLearningProject(button.dataset.id);
      if(action==='assign-learning-project')assignLearningProject();
      if(action==='revoke-course-access'&&confirm('Remove this person’s project access?')){await api('/api/admin/coursework','PATCH',{id:button.dataset.id,action:'revoke'});await refresh();toast('Project access revoked.');}
      if(action==='revoke-course-certificate'&&confirm('Revoke this certificate?')){await api('/api/admin/coursework','PATCH',{id:button.dataset.id,action:'revoke-certificate'});await refresh();toast('Certificate revoked.');}
      if(action==='review-coursework'){
        const assignment=overview.coursework.find(a=>a.id===button.dataset.id);
        modal('Review '+assignment.title,'<div class="full"><p>'+h(assignment.name)+'</p><a class="btn" href="'+h(assignment.submission.projectLink)+'" target="_blank" rel="noopener">Open project</a> <a class="btn" href="'+h(assignment.submission.reportLink)+'" target="_blank" rel="noopener">Open report</a></div>'+field('status',assignment.status==='approved'?'approved':'changes-requested',{choices:['changes-requested','approved','rejected']})+field('reviewNote',assignment.reviewNote||'',{label:'Feedback to the student',multiline:true})+field('aiWrittenReport',assignment.aiWrittenReport===true,{label:'Reject AI-written report · zero marks'})+'<p class="full muted">'+h(reportPolicy)+'</p>',async form=>{await api('/api/admin/coursework','PATCH',{id:assignment.id,...values(form)});await refresh();toast('Project review saved.');},'Save review');
      }
      if(action==='issue-course-certificate'){
        const assignment=overview.coursework.find(a=>a.id===button.dataset.id);
        modal('Issue certificate',field('fileUrl',assignment.certificate?.sourceUrl||'',{label:'Certificate PDF or Google Drive link',required:true})+'<p class="full muted">Use a Google Drive certificate link, or upload a PDF in Media library with “Public file” turned off. The certificate is available only to this recipient after approval.</p>',async form=>{await api('/api/admin/coursework','PATCH',{id:assignment.id,action:'certificate',certificateUrl:values(form).fileUrl});await refresh();toast('Certificate issued to the student.');},'Issue certificate');
      }
      if(action==='new-task')editTask();
      if(action==='edit-task')editTask(button.dataset.id);
      if(action==='delete-task'&&confirm('Remove this assignment?')){await api('/api/admin/tasks','DELETE',{id:button.dataset.id});await refresh();toast('Assignment removed.');}
      if(action==='update-task'){
        const task=(member.tasks||[]).find(t=>t.id===button.dataset.id);if(!task)throw Error('Task no longer available.');
        modal('Update your assigned work',field('status',task.status,{choices:['todo','in-progress','submitted']})+field('submission',task.submission||'',{label:'Work completed / progress update',multiline:true})+field('evidenceLink',task.evidenceLink||'',{label:'Evidence URL (optional)'})+field('reportLink',task.reportLink||'',{label:'PDF learning report link (Google Drive)',type:'url'})+'<p class="full muted">'+h(member.content.portal.reportPolicy||reportPolicy)+'</p>',async form=>{await api('/api/member/task','PATCH',{id:task.id,...values(form)});await loadMember();toast('Work update sent to the administrator.');},'Save work update');
      }
      if(action==='learning-step'){await api('/api/member/learning','PUT',{id:button.dataset.id,completed:button.dataset.completed!=='true'});await loadMember();}
      if(action==='add-question'||action==='edit-question')editQuestion(button.dataset.type,action==='edit-question'?Number(button.dataset.index):undefined);
      if(action==='delete-question'&&confirm('Remove this question? Existing application answers are retained.')){model.draft.applications[button.dataset.type].questions.splice(Number(button.dataset.index),1);settingsGeneration++;await saveLiveSettings();renderAdmin();}
      if(action==='move-question'){const rows=model.draft.applications[button.dataset.type].questions,i=Number(button.dataset.index),j=i+Number(button.dataset.step);if(j>=0&&j<rows.length){[rows[i],rows[j]]=[rows[j],rows[i]];settingsGeneration++;await saveLiveSettings();renderAdmin();}}
      if (action === 'add-record') editRecord();
      if (action === 'edit-record') editRecord(Number(button.dataset.index));
      if (action === 'delete-record' && confirm('Remove this record from the draft?')) { model.draft.collections[collection].splice(Number(button.dataset.index), 1); await applyEdit(); renderAdmin(); }
      if (action === 'move-record') { const i = Number(button.dataset.index), j = i + Number(button.dataset.step), rows = model.draft.collections[collection]; if (j >= 0 && j < rows.length) { [rows[i], rows[j]] = [rows[j], rows[i]]; await applyEdit(); renderAdmin(); } }
      if (action === 'review-user') { const u = overview.users.find(u => u.id === button.dataset.id); modal('Review ' + u.name, '<div class="full">' + Object.entries(u.ambassadorApplication?.status === 'pending' ? {...u.profile,...u.ambassadorApplication.profile} : u.membershipApplication?.status === 'pending' ? {...u.profile,...u.membershipApplication.profile} : u.profile || {}).filter(([, v]) => v).map(([k, v]) => `<p><strong>${h(pretty(k))}:</strong> ${h(v)}</p>`).join('') + '</div>' + field('role', u.role, { choices: ['student', 'member', 'ambassador'] }) + field('status', u.status, { choices: ['pending', 'approved', 'rejected', 'suspended'] }) + applicationReview(u) + (u.ambassadorApplication?.status === 'pending' ? field('applicationDecision','',{label:'Ambassador application decision',choices:['','approved','rejected']}) : '') + (u.membershipApplication?.status === 'pending' ? field('membershipDecision','',{label:'Membership application decision',choices:['','approved','rejected']}) : '') + field('cabinetPosition',u.cabinetPosition||'',{label:'Cabinet position (society members only; blank removes appointment)'}) + field('reviewNote', u.reviewNote || '', { label: 'Feedback visible to the applicant' }) + `<div class="full">${btn('Create password reset link', 'reset-member', `data-id="${h(u.id)}"`)}</div>`, async form => { await api('/api/admin/users', 'PATCH', { id: u.id, ...values(form) }); await refresh(); toast('Account updated.'); }, 'Save account review'); }
      if (action === 'inquiry') { await api('/api/admin/inquiry', 'PATCH', { id: button.dataset.id, status: button.dataset.status }); await refresh(); }
      if (action === 'review-activity') { const a = overview.activities.find(a => a.id === button.dataset.id); modal('Review activity', `<div class="full"><h3>${h(a.title)}</h3><p>${h(a.description)}</p>${a.link ? `<a href="${h(a.link)}" target="_blank" rel="noopener">View evidence</a>` : ''}</div>` + field('status', a.status, { choices: ['pending', 'approved', 'rejected'] }) + field('reviewNote', a.reviewNote), async form => { await api('/api/admin/activity', 'PATCH', { id: a.id, ...values(form) }); await refresh(); }, 'Save review'); }
      if (action === 'upload') await upload();
      if (action === 'copy') { await navigator.clipboard.writeText(button.dataset.url); toast('URL copied.'); }
      if (action === 'export') { const blob = new Blob([JSON.stringify(model.draft, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dss-content-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
      if (action === 'import') modal('Import content backup', '<label class="field full">Content JSON file<input name="backup" type="file" accept=".json" required></label><p class="full muted">This replaces your draft content. Save and publish after reviewing it.</p>', async form => { const input = JSON.parse(await form.elements.backup.files[0].text()); const result = await api('/api/admin/content', 'PUT', { revision: model.revision, content: input }); model = await api('/api/admin/content'); dirty = false; $('#save-state').textContent = 'Backup imported to draft'; renderAdmin(); }, 'Import to draft');
      if (action === 'restore' && confirm('Replace the current draft with this previous publication?')) { await api('/api/admin/restore', 'POST', { id: button.dataset.id, revision: model.revision }); model = await api('/api/admin/content'); dirty = false; $('#save-state').textContent = 'Previous version restored to draft'; renderAdmin(); }
      if (action === 'preview-size') { $('#page-preview').style.maxWidth = button.dataset.width; $('#page-preview').style.margin = 'auto'; }
      if(action==='reset-element'){delete model.draft.pages?.[page]?.[selected];await applyEdit();pageEditor.apply();}
      if(action==='parent-link'||action==='parent-section')pageEditor.select(action==='parent-link'?selectedElement.parentLink:selectedElement.parentSection);
      if (action === 'add-block') editBlock();
      if (action === 'manage-blocks') modal('Added sections', (model.draft.blocks?.[page] || []).map((b, i) => `<div class="row full"><strong>${h(b.title)}</strong><div class="toolbar">${btn('↑', 'move-block', `data-index="${i}" data-step="-1"`)}${btn('↓', 'move-block', `data-index="${i}" data-step="1"`)}${btn('Edit', 'edit-block', `data-index="${i}"`)}${btn('Delete', 'delete-block', `data-index="${i}"`)}</div></div>`).join('') || empty('No added sections on this page.'), () => {}, 'Done');
      if (action === 'edit-block') { $('#editor-dialog').close(); editBlock(Number(button.dataset.index)); }
      if (action === 'move-block') { const rows = model.draft.blocks[page], i = Number(button.dataset.index), j = i + Number(button.dataset.step); if (j >= 0 && j < rows.length) { [rows[i], rows[j]] = [rows[j], rows[i]]; await applyEdit(); $('#editor-dialog').close(); renderPageEditor(); } }
      if (action === 'delete-block' && confirm('Delete this added section from the draft?')) { model.draft.blocks[page].splice(Number(button.dataset.index), 1); await applyEdit(); $('#editor-dialog').close(); renderPageEditor(); }
      if (action === 'page-meta') { const defaults={title:'',desc:'',seoTitle:'',seoDescription:''}, current={...defaults,...model.draft.pageHeaders?.[page]};modal('Page heading & search appearance',Object.entries(current).map(([key,value])=>field(key,value)).join(''),async form=>{model.draft.pageHeaders ||= {};model.draft.pageHeaders[page]=values(form);await applyEdit();renderPageEditor();}); }
      if (action === 'reset-member' && auth.authProvider === 'workos') { toast('Members can use password recovery on the secure sign-in page.'); return; }
      if (action === 'reset-member') { const result=await api('/api/admin/reset-password','POST',{id:button.dataset.id});const link=location.origin+result.url;modal('Password reset link','<p class="full muted">Share this link privately with the member. It expires in one hour and can only be used once. No email has been sent.</p>'+field('resetLink',link),async()=>{await navigator.clipboard.writeText(link);toast('Reset link copied.');},'Copy reset link'); }
      if (action === 'more-resources') { libraryLimit+=6;renderLibrary(); }
      if (action === 'member-refresh') await loadMember();
      if (action === 'event') { await api('/api/member/register-event', 'POST', { id: button.dataset.id, cancel: button.dataset.cancel === 'true' }); await loadMember(); toast('Registration updated.'); }
      if (action === 'bookmark') { await api('/api/member/bookmark', 'POST', { id: button.dataset.id, collection: button.dataset.key, remove: button.dataset.remove === 'true' }); await loadMember(); toast('Saved resources updated.'); }
      if(action==='new-contribution')modal('Submit a contribution',field('title','',{required:true})+field('description','',{required:true,multiline:true})+field('projectLink','',{label:'Project link (GitHub or Drive)',required:true,type:'url'})+field('reportLink','',{label:'Report link (Google Drive PDF)',required:true,type:'url'})+'<p class="full muted">'+h(member.content.portal.reportPolicy||reportPolicy)+'</p>',async form=>{await api('/api/member/contribution','POST',values(form));await loadMember();toast('Contribution submitted.');},'Submit for review');
      if(action==='review-contribution'){const c=overview.contributions.find(c=>c.id===button.dataset.id);modal('Review contribution',`<div class="full"><h3>${h(c.title)}</h3><p>${h(c.description)}</p>${c.link?`<a href="${h(c.link)}" target="_blank" rel="noopener">View contribution</a>`:''}</div>`+field('status',c.status,{choices:['pending','approved','rejected']})+field('reviewNote',c.reviewNote)+field('aiWrittenReport',c.aiWrittenReport===true,{label:'Reject AI-written report · zero marks'})+'<p class="full muted">'+h(reportPolicy)+'</p>',async form=>{await api('/api/admin/contribution','PATCH',{id:c.id,...values(form)});await refresh();},'Save review');}
      if (action === 'new-activity') modal('Submit campus activity', field('title', '', { required: true }) + field('date', '', { type: 'date', required: true }) + field('description', '', { required: true }) + field('attendees', 0) + field('link', '', { label: 'Evidence URL (optional)' }), async form => { await api('/api/member/activity', 'POST', values(form, { attendees: 0 })); await loadMember(); toast('Report submitted for review.'); }, 'Submit for review');
      if (action === 'profile') { const u = member.user; modal('Your profile', field('name', u.name, { required: true }) + ['university', 'studentId', 'major', 'interest'].map(k => field(k, u.profile?.[k] || '')).join('') + `<div class="full">${btn('Change password', 'password')}</div>`, async form => { await api('/api/member/profile', 'PUT', values(form)); await loadMember(); toast('Profile updated.'); }, 'Save profile'); }
      if (action === 'password' && auth.authProvider === 'workos') { location.href='/auth/login'; return; }
      if (action === 'password') modal('Change password', field('currentPassword', '', { type: 'password', required: true, current: true }) + field('password', '', { type: 'password', required: true, label: 'New password' }), async form => { await api('/api/auth/password', 'POST', values(form)); toast('Password changed. Other sessions have been signed out.'); }, 'Change password');
    } catch (error) { toast(error.message, true); } finally { button.disabled = false; }
  });
  (async () => {
    try {
      auth = await api('/api/auth/me'); const kind = document.body.dataset.portal;
      if (kind === 'login') {
        auth.site=pendingPortalContent||await api('/api/content');applyPortalTheme(auth.site.theme);updateBrand(auth.site);login();applyPortalEdits(auth.site);
        if(!portalPreview){
          let loginRevision=auth.site._revision,loginTimer;
          const syncLogin=async()=>{try{if(!document.hidden){const version=await api('/api/revision');if(version.publishedRevision!==loginRevision&&!document.activeElement?.matches('input,textarea,select')){const site=await api('/api/content');loginRevision=site._revision;window.applySiteContent(site);}}}catch{}finally{loginTimer=setTimeout(syncLogin,500);}};
          syncLogin();window.addEventListener('pagehide',()=>clearTimeout(loginTimer));
        }return;
      }
      if (kind === 'admin' && (!auth.user || auth.user.role !== 'admin' || (auth.privateAdminConfigured && !auth.privateAdmin))) { adminLogin(); return; }
      if(portalPreview&&kind==='member'&&auth.user?.role==='admin'){
        const previewModel=await api('/api/admin/content'),role=location.pathname.includes('ambassador-dashboard')?'ambassador':location.pathname.includes('student-dashboard')?'student':'member';
        member={user:{id:'preview',name:'Preview member',role,status:'approved',profile:{}},registrations:[],bookmarks:[],activities:[],contributions:[],content:pendingPortalContent||previewModel.draft};updateBrand(member.content);applyPortalTheme(member.content.theme);renderMember();return;
      }
      if (!auth.user) { location.replace('login.html'); return; }
      if(kind==='member'&&auth.user.role==='admin'&&!portalPreview){location.replace('/admin');return;}
      if (kind === 'admin') { if (auth.user.role !== 'admin') { location.replace('member-dashboard.html'); return; } [model, overview] = await Promise.all([api('/api/admin/content'), api('/api/admin/overview')]); applyPortalTheme(model.draft.theme); updateBrand(model.draft); adminShell();
        let adminRevision,adminTimer,adminPending=false,adminChecking=false;
        const syncAdmin=async()=>{
          if(document.hidden||$('#editor-dialog')?.open||document.activeElement?.matches('input,textarea,select')||dirty){adminPending=true;return;}
          adminPending=false;
          overview=await api('/api/admin/overview');model=await api('/api/admin/content');renderAdmin();
        };
        const checkAdmin=async()=>{clearTimeout(adminTimer);if(adminChecking)return;adminChecking=true;try{if(!document.hidden){const version=await api('/api/revision');if(adminRevision!==version.stateRevision){adminRevision=version.stateRevision;await syncAdmin();}else if(adminPending)await syncAdmin();}}catch{}finally{adminChecking=false;adminTimer=setTimeout(checkAdmin,500);}};
        window.addEventListener('pagehide',()=>clearTimeout(adminTimer));window.addEventListener('pageshow',event=>{if(event.persisted)checkAdmin();});window.addEventListener('focus',checkAdmin);checkAdmin();
      }
      else {
        await loadMember();let pendingRefresh=false,lastRevision,timer,checking=false;
        const syncMember=async()=>{
          if(document.hidden||$('#editor-dialog')?.open||document.activeElement?.matches('input,textarea,select')){pendingRefresh=true;return;}
          pendingRefresh=false;try{await loadMember();}catch(error){if(error.status===401)location.replace('/login.html');else toast(error.message,true);}
        };
        const check=async()=>{
          clearTimeout(timer);if(checking)return;checking=true;
          try{if(!document.hidden){const version=await api('/api/revision');if(lastRevision!==version.stateRevision){lastRevision=version.stateRevision;await syncMember();}}}catch{}finally{checking=false;timer=setTimeout(check,500);}
        };
        document.addEventListener('close',()=>{if(pendingRefresh)syncMember();},true);
        document.addEventListener('focusout',()=>{if(pendingRefresh)setTimeout(syncMember,0);});
        document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncMember();check();}});
        window.addEventListener('focus',check);window.addEventListener('pagehide',()=>clearTimeout(timer));window.addEventListener('pageshow',event=>{if(event.persisted)check();});
        const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('dss-live-content'):null;channel?.addEventListener('message',check);
        check();
      }
    } catch (error) { $('#app').innerHTML = `<main class="member-main"><section class="panel"><h1>Unable to load the portal</h1><p>${h(error.message)}</p><a class="btn primary" href="${h(location.pathname)}">Try again</a></section></main>`; }
  })();
})();
