'use strict';
(() => {
  let progress=[],loadedUser=null;
  const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paragraphs=text=>String(text||'').split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+html(p).replace(/\n/g,'<br>')+'</p>').join('');
  async function loadProgress(){
    if(!window.DSS?.user||DSS.user.id===loadedUser)return;
    loadedUser=DSS.user.id;
    try{const response=await fetch('/api/member');if(response.ok){progress=(await response.json()).learning||[];render();}}catch{}
  }
  function render(){
    const content=window.DSS?.content;if(!content)return;
    const portal=content.portal||{},start=document.getElementById('learning-path');
    const faq=document.getElementById('student-faq');if(faq)faq.innerHTML='<h2 data-cms-id="cms-start-faq-heading" data-cms-text="true">'+html(portal.faqHeading||'Questions students ask')+'</h2>'+(content.collections.faq||[]).map(q=>'<details data-record="faq:'+html(q.id)+'"><summary>'+html(q.title)+'</summary>'+paragraphs(q.body)+'</details>').join('');
    const weekly=document.getElementById('student-highlights');if(weekly){
      const resource=content.collections.learningProjects?.find(r=>r.id==='starter-project'),event=content.collections.events.find(e=>e.status==='confirmed'&&e.startDate&&Date.parse(e.startDate+'T23:59:59+05:00')>=Date.now());
      weekly.innerHTML='<div class="section-top"><div><p class="record-kicker">A small step, every week</p><h2 data-cms-id="cms-index-weekly-heading" data-cms-text="true">Something useful to start with.</h2></div><a class="text-link" href="start.html">Follow the learning path</a></div><div class="highlight-grid"><article><p class="record-kicker">Beginner pick</p><h3>'+html(resource?.title||'Your first data question')+'</h3><p>'+html(resource?.summary||'Begin with the project pathway.')+'</p><a class="text-link" href="'+(resource?'learn.html?project='+encodeURIComponent(resource.id):'start.html')+'">Begin the starter</a></article><article><p class="record-kicker">Community calendar</p><h3>'+html(event?.title||'Explore what is being planned')+'</h3><p>'+html(event?event.date+' · '+event.loc:'Confirmed dates, eligibility and registration will be published in Events. Planned sessions are clearly marked.')+'</p><a class="text-link" href="events.html">View events</a></article></div>';
    }
    const showcase=document.getElementById('student-showcase');if(showcase){const stories=(content.collections.showcase||[]).filter(s=>s.published===true);showcase.hidden=!stories.length;showcase.closest('section').hidden=!stories.length;showcase.innerHTML=stories.length?'<div class="section-top"><div><p class="record-kicker">Student work</p><h2>Built by our community.</h2></div></div><div class="highlight-grid">'+stories.map(s=>'<article data-record="showcase:'+html(s.id)+'"><p class="record-kicker">'+html(s.author)+'</p><h3>'+html(s.title)+'</h3><p>'+html(s.desc)+'</p><a class="text-link" href="detail.html?collection=showcase&amp;id='+encodeURIComponent(s.id)+'">Read the story</a></article>').join('')+'</div>':'';}
    const detail=document.getElementById('record-detail');if(detail){
      const params=new URLSearchParams(location.search),key=params.get('collection')||'resources',id=params.get('id');
      const allowed=['events','projects','resources','blogs','papers','showcase'];
      const item=allowed.includes(key)?(content.collections[key]||[]).filter(r=>key!=='showcase'||r.published===true).find(r=>String(r.id)===id)||(!id?content.collections[key][0]:null):null;
      if(!item){detail.innerHTML='<h1>This item is no longer available.</h1><p>Explore the current library instead.</p><a class="soc-button" href="resources.html">Browse resources</a>';return;}
      document.title=item.title+' | Data Science Society';
      const metadata=key==='events'?[['Status',item.status||'Details to be confirmed'],['Date',item.date||'To be confirmed'],['Time (Pakistan)',item.time||'To be confirmed'],['Duration',item.duration||'To be confirmed'],['Venue / room',item.loc||'To be confirmed'],['Organiser',item.organizer||'DSS'],['Who can attend',item.eligibility||'Check with the organiser'],['Cost',item.cost||'To be confirmed'],['Bring',item.bring||'To be confirmed'],['Before attending',item.prerequisites||'To be confirmed']]:[['Level',item.level||'See the description'],['Time needed',item.duration||item.length||'Self-paced'],['Before starting',item.prerequisites||'See the description'],...(key==='projects'?[['Stage',item.stage||'Details to be confirmed'],['Contributors',item.contributors||'To be confirmed']]:[])];
      detail.innerHTML='<a class="text-link" href="'+({blogs:'blog',papers:'research',showcase:'projects'}[key]||key)+'.html">← Back to '+html(key)+'</a><article data-record="'+key+':'+html(item.id)+'"><p class="record-kicker">'+html(item.type||item.tag||key)+'</p><h1>'+html(item.title)+'</h1><p class="detail-lead">'+html(item.desc||item.excerpt)+'</p><dl class="detail-meta">'+metadata.map(([k,v])=>'<div><dt>'+html(k)+'</dt><dd>'+html(v)+'</dd></div>').join('')+'</dl>'+(item.requiresAuth!==false&&DSS.user?.status!=='approved'?'<p>Sign in to read this item and access its materials.</p><a class="soc-button primary" href="login.html">Sign in</a>':'<div class="reading-body">'+(item.problem?'<h2>The question</h2>'+paragraphs(item.problem):'')+(item.outcome?'<h2>What you will create</h2>'+paragraphs(item.outcome):'')+paragraphs(item.body||'The society will add full details here. Check back for updates.')+(item.helpWanted?'<h2>How you can help</h2>'+paragraphs(item.helpWanted):'')+(key==='events'&&item.recap?'<h2>Event recap</h2>'+paragraphs(item.recap):'')+'</div><div class="content-actions">'+(window.actions?actions(item,key,true):'')+'</div>')+'</article>';
    }
  }
  document.addEventListener('click',async event=>{
    const step=event.target.closest('[data-learning-step]');if(step){step.disabled=true;try{const complete=step.dataset.completed!=='true',response=await fetch('/api/member/learning',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:step.dataset.learningStep,completed:complete})});const result=await response.json();if(!response.ok)throw Error(result.error);progress=progress.filter(p=>p.stepId!==step.dataset.learningStep);if(complete)progress.push({stepId:step.dataset.learningStep});render();}catch(error){window.showAdminToast?.(error.message);step.disabled=false;}}
  });
  document.addEventListener('dss:rendered',render);
  window.renderStudentExperience=render;
})();
