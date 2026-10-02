'use strict';
(() => {
  let filter='all',selectedTrack=new URLSearchParams(location.search).get('track')==='membership'||document.getElementById('application-track-type')?.value==='General Member Application'?'membership':'student';
  const form=document.getElementById('join-form'), initialForm=form?.innerHTML;
  function filterContent(){
    const host=document.querySelector('.collection-grid');if(!host)return;
    const cards=[...host.querySelectorAll('.content-card')],term=(document.getElementById('public-search')?.value||'').toLowerCase().trim();let count=0;
    for(const card of cards){card.hidden=!(card.textContent.toLowerCase().includes(term)&&(filter==='all'||card.dataset.access===filter));if(!card.hidden)count++;}
    document.getElementById('collection-count').textContent=count+' '+(count===1?'result':'results');document.getElementById('search-empty').hidden=count!==0||!cards.length;
  }
  function track(value){
    selectedTrack=value;
    document.querySelectorAll('[data-track]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.track===value)));
    account();
  }
  function account(){
    if(!form)return;
    const heading=document.getElementById('join-form-heading'),description=document.getElementById('join-form-description'),ambassador=form.dataset.ambassador==='true';
    const anonymous=!DSS.user && DSS.authProvider!=='local';
    if(anonymous){
      form.dataset.accountGate='true';form.classList.add('account-entry');
      const next=ambassador?'/ambassador.html':selectedTrack==='membership'?'/join.html?track=membership':'/member-dashboard.html';
      heading.textContent='Create your account first';
      description.textContent=ambassador?'Sign in or create an account, then complete your ambassador application.':selectedTrack==='membership'?'Sign in or create an account, then apply for society membership.':'One account gives you a place to learn and join the society.';
      form.innerHTML='<div class="account-entry-actions"><a class="soc-button primary" data-auth-signup href="/auth/signup?returnTo='+encodeURIComponent(next)+'">Create an account</a><a class="soc-button ghost" data-auth-login href="/auth/login?returnTo='+encodeURIComponent(next)+'">Login</a></div>';
      document.querySelectorAll('.join-reassurance').forEach(el=>el.hidden=true);
      return;
    }
    if(form.dataset.accountGate){form.innerHTML=initialForm;delete form.dataset.accountGate;form.classList.remove('account-entry');}
    const user=DSS.user,application=selectedTrack==='membership';
    if(!ambassador){
      const extra=document.getElementById('membership-extra-fields');extra.hidden=!application;
      document.getElementById('application-track-type').value=application?'General Member Application':'Student Account';
      for(const id of ['university','interest','motivation'])document.getElementById('applicant-'+id).required=application;
      document.getElementById('applicant-motivation').minLength=20;
      heading.textContent=application?'Your membership application':user?'Your student account':'Create a student account';
      description.textContent=application?'Tell us how you would like to contribute. The society team reviews each application.':'Start learning with the society.';
      document.getElementById('form-submit-btn').textContent=application?'Submit application':user?'Open your dashboard':'Create student account';
    }
    if(!user)return;
    document.querySelectorAll('.join-reassurance').forEach(el=>el.hidden=true);
    if(['student','member'].includes(user.role)&&user.status==='approved'){
      document.getElementById('account-fields').hidden=true;document.querySelectorAll('#account-fields input').forEach(input=>input.disabled=true);
      for(const [key,value]of Object.entries(user.profile||{})){const input=document.getElementById('applicant-'+(key==='studentId'?'student-id':key));if(input&&!input.value)input.value=value;}
      if(!ambassador&&user.role==='student'&&selectedTrack==='student'){
        heading.textContent='Your account is ready';description.textContent='Open your learning dashboard, or select Society member to apply.';
        form.innerHTML='<a class="soc-button primary" href="member-dashboard.html">Open your dashboard</a>';form.dataset.accountGate='true';return;
      }
      const request=ambassador?user.ambassadorApplication:user.membershipApplication;
      if(request?.status==='pending'){document.getElementById('join-feedback').textContent='Your application is under review. Follow its progress in your dashboard.';document.getElementById('form-submit-btn').disabled=true;}
      if(!ambassador&&user.role==='member'){heading.textContent='You are a society member';description.textContent='Your resources, contributions and updates are in your workspace.';form.innerHTML='<a class="soc-button primary" href="member-dashboard.html">Open your workspace</a>';form.dataset.accountGate='true';}
    }else{heading.textContent='Your society account';description.textContent='Follow your access and applications in your workspace.';form.innerHTML='<a class="soc-button primary" href="member-dashboard.html">Open your dashboard</a>';form.dataset.accountGate='true';}
  }
  document.addEventListener('input',event=>{if(event.target.id==='public-search')filterContent();});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-content-filter]');
    if(button){filter=button.dataset.contentFilter;document.querySelectorAll('[data-content-filter]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});filterContent();}
    if(event.target.closest('[data-clear-search]')){document.getElementById('public-search').value='';document.querySelector('[data-content-filter="all"]').click();}
    const choice=event.target.closest('[data-track]');if(choice)track(choice.dataset.track);
  });
  document.addEventListener('dss:rendered',()=>{window.lucide?.createIcons();filterContent();account();});
  document.addEventListener('DOMContentLoaded',()=>window.lucide?.createIcons());
  if(form)account();
})();
