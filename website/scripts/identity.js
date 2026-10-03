'use strict';
(() => {
  let filter='all',selectedTrack=new URLSearchParams(location.search).get('track')==='membership'||location.pathname.includes('opportunities')?'membership':'student';
  const form=document.getElementById('join-form');let formSignature;const loadedDrafts=new Set();
  async function restoreDraft(type,userId){
    const key=userId+':'+type;if(loadedDrafts.has(key))return;loadedDrafts.add(key);
    try{const response=await fetch('/api/member');if(!response.ok)return;const data=await response.json(),draft=data.applicationDrafts?.find(d=>d.type===type);
      if(!draft||form?.dataset.applicationType!==type||DSS.user?.id!==userId)return;
      for(const input of form.querySelectorAll('[data-question]'))if(!input.value&&draft.answers[input.dataset.question]!==undefined){const v=draft.answers[input.dataset.question];input.value=typeof v==='boolean'?(v?'yes':'no'):v??'';}
      const note=form.querySelector('[data-draft-status]');if(note)note.textContent='Saved draft restored. Review your answers before submitting.';
    }catch{}
  }
  function filterContent(){
    const host=document.querySelector('.collection-grid');if(!host)return;
    const cards=[...host.querySelectorAll('.content-card')],term=(document.getElementById('public-search')?.value||'').toLowerCase().trim();let count=0;
    const level=document.getElementById('experience-filter')?.value||'all';
    for(const card of cards){card.hidden=!(card.textContent.toLowerCase().includes(term)&&(filter==='all'||card.dataset.access===filter)&&(level==='all'||card.dataset.level===level||card.dataset.status===level));if(!card.hidden)count++;}
    document.getElementById('collection-count').textContent=count+' '+(count===1?'result':'results');document.getElementById('search-empty').hidden=count!==0||!cards.length;
  }
  function track(value){
    selectedTrack=value;
    document.querySelectorAll('[data-track]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.track===value)));
    account();
  }
  function account(){
    if(!form||!DSS.content)return;
    document.querySelectorAll('[data-track]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.track===selectedTrack)));
    const user=DSS.user,ambassador=form.dataset.ambassador==='true',type=ambassador?'ambassador':selectedTrack==='membership'?'membership':null;
    const preview=new URLSearchParams(location.search).has('edit')&&parent!==window;
    if(type&&!preview&&!DSS.content.applications[type].enabled){form.hidden=true;form.innerHTML='';formSignature=undefined;return;}
    const config=type?DSS.content.applications[type]:null;
    const signature=JSON.stringify([type,config,user?.id,user?.role,user?.status,user?.membershipApplication?.status,user?.ambassadorApplication?.status,DSS.authProvider]);
    form.hidden=false;
    if(formSignature===signature)return;formSignature=signature;
    const oldAnswers=Object.fromEntries([...form.querySelectorAll('[data-question]')].map(el=>[el.dataset.question,el.value]));
    const heading=document.getElementById('join-form-heading'),description=document.getElementById('join-form-description');
    const authEntry=(next)=>'<div class="account-entry-actions"><a class="soc-button primary" data-auth-signup href="/auth/signup?returnTo='+encodeURIComponent(next)+'">Create an account</a><a class="soc-button ghost" data-auth-login href="/auth/login?returnTo='+encodeURIComponent(next)+'">Login</a></div>';
    form.removeAttribute('data-application-type');form.classList.remove('account-entry');
    document.querySelectorAll('.join-reassurance').forEach(el=>el.hidden=!!user);
    if(!user&&DSS.authProvider!=='local'){
      heading.textContent='Create your account first';description.textContent=type?'Sign in or create an account, then complete your application.':'Start learning with the society.';
      form.classList.add('account-entry');form.innerHTML=authEntry(type==='ambassador'?'/ambassador.html':type==='membership'?'/join.html?track=membership':'/member-dashboard.html');return;
    }
    if(type&&!user){
      heading.textContent='Sign in to apply';description.textContent='Create a normal member account first, then submit your application.';
      form.innerHTML='<a class="soc-button primary" href="/login.html">Sign in</a><a class="soc-button ghost" href="/join.html">Create an account</a>';return;
    }
    if(user&&(!type||user.status!=='approved'||type==='membership'&&user.role!=='student'||type==='ambassador'&&!['student','member'].includes(user.role))){
      heading.textContent='Your account is ready';description.textContent='Open your workspace to see your resources and updates.';
      form.innerHTML='<a class="soc-button primary" href="/member-dashboard.html">Open your dashboard</a>';return;
    }
    if(type){
      const request=user?.[type==='membership'?'membershipApplication':'ambassadorApplication'];
      heading.textContent=type==='membership'?'Your membership application':'Your ambassador application';
      description.textContent='Answer the questions below. The society team reviews each application.';
      if(request?.status==='pending'){form.innerHTML='<p role="status">Your application is under review.</p><a class="soc-button primary" href="/member-dashboard.html">Track your application</a>';return;}
      form.dataset.applicationType=type;
      form.innerHTML='<div class="join-fields">'+config.questions.map(q=>{
        const id='applicant-'+(q.id==='studentId'?'student-id':q.id),saved=oldAnswers[q.id]??user?.profile?.[q.id]??'',value=escapeHTML(saved),required=q.required?' required':'',length=q.minLength?' minlength="'+q.minLength+'"':'';
        const attrs=' id="'+escapeHTML(id)+'" aria-label="'+escapeHTML(q.label)+(q.required?' *':'')+'" name="'+escapeHTML(q.id)+'" data-question="'+escapeHTML(q.id)+'"'+required;
        const input=q.type==='yesno'?'<select'+attrs+'><option value="">Select</option><option value="yes"'+(saved==='yes'?' selected':'')+'>Yes</option><option value="no"'+(saved==='no'?' selected':'')+'>No</option></select>':q.type==='textarea'?'<textarea'+attrs+length+' maxlength="5000" rows="4">'+value+'</textarea>':'<input'+attrs+length+' maxlength="5000" value="'+value+'">';
        return '<label class="join-field'+(q.type==='textarea'?' full':'')+'"><span>'+escapeHTML(q.label)+(q.required?' *':'')+'</span>'+input+'</label>';
      }).join('')+'</div><p class="application-privacy">These answers are for the society’s application review. Contact the team before sharing information you are unsure about.</p><p data-draft-status role="status"></p><p id="join-feedback" class="form-feedback" role="alert"></p><div class="content-actions"><button type="button" class="soc-button" data-save-application-draft>Save draft</button><button class="soc-button primary" id="form-submit-btn" type="submit">Submit application</button></div>';
      restoreDraft(type,user.id);
    }else{
      heading.textContent='Create a normal member account';description.textContent='Start learning with the society.';
      form.innerHTML='<div id="account-fields" class="join-fields">'+[['name','Full name','text'],['email','Email address','email'],['password','Password','password'],['confirm','Confirm password','password']].map(([id,label,type])=>'<label class="join-field"><span>'+label+'</span><input id="applicant-'+id+'" name="'+id+'" type="'+type+'" required'+(type==='password'?' minlength="10" maxlength="128" autocomplete="new-password"':'')+'></label>').join('')+'</div><p id="join-feedback" class="form-feedback" role="alert"></p><button class="soc-button primary submit-wide" id="form-submit-btn" type="submit">Create account</button>';
    }
  }
  document.addEventListener('input',event=>{if(event.target.id==='public-search')filterContent();});
  document.addEventListener('change',event=>{if(event.target.id==='experience-filter')filterContent();});
  document.addEventListener('click',async event=>{
    const draftButton=event.target.closest('[data-save-application-draft]');if(draftButton){
      draftButton.disabled=true;const answers={};for(const input of form.querySelectorAll('[data-question]'))answers[input.dataset.question]=input.tagName==='SELECT'?(input.value==='yes'?true:input.value==='no'?false:null):input.value;
      try{const response=await fetch('/api/member/application-draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:form.dataset.applicationType,answers})});const result=await response.json();if(!response.ok)throw Error(result.error);form.querySelector('[data-draft-status]').textContent='Draft saved to your account. You can return to it later.';}catch(error){form.querySelector('[data-draft-status]').textContent=error.message;}finally{draftButton.disabled=false;}return;
    }
    const button=event.target.closest('[data-content-filter]');
    if(button){filter=button.dataset.contentFilter;document.querySelectorAll('[data-content-filter]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});filterContent();}
    if(event.target.closest('[data-clear-search]')){document.getElementById('public-search').value='';document.querySelector('[data-content-filter="all"]').click();}
    const choice=event.target.closest('[data-track]');if(choice)track(choice.dataset.track);
  });
  document.addEventListener('dss:rendered',()=>{window.lucide?.createIcons();
    const toolbar=document.querySelector('.collection-toolbar');if(toolbar&&!document.getElementById('experience-filter')&&DSS.content){const events=!!document.getElementById('events-grid'),label=document.createElement('label');label.className='experience-filter';label.textContent=events?'Event status ':'Learning level ';const select=document.createElement('select');select.id='experience-filter';select.setAttribute('aria-label',events?'Event status':'Learning level');for(const value of events?['all','planned','confirmed','past']:['all','Beginner','Intermediate','Advanced']){const option=document.createElement('option');option.value=value;option.textContent=value==='all'?'All':value;select.append(option);}label.append(select);toolbar.append(label);}
    filterContent();account();});
  document.addEventListener('DOMContentLoaded',()=>window.lucide?.createIcons());
  if(form)account();
})();
