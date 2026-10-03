'use strict';
/* CSS artwork and one-shot reveals. No animation framework or scroll loop. */
(() => {
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const editing = new URLSearchParams(location.search).has('edit');
  let paused = false;
  try { paused = localStorage.getItem('dss_motion_paused') === 'true'; } catch {}
  const revealed = new WeakSet(), observed = new WeakSet(), animations = new Set();
  const allowed = () => !paused && !reduced.matches && !editing && !body.classList.contains('animation-disabled');
  function sync() {
    if(!document.querySelector('[data-page-motion-toggle]')){
      const button=document.createElement('button');button.type='button';button.className='footer-motion-control';button.dataset.pageMotionToggle='';button.innerHTML='<span>Stop Animation</span>';
      (document.querySelector('.footer-country')||document.querySelector('.auth-card')||document.querySelector('.member-main')||document.querySelector('.workspace .main')||document.getElementById('app')||body).append(button);
    }
    body.classList.add('page-motion-ready');
    body.classList.toggle('page-motion-paused', !allowed());
    body.classList.toggle('page-motion-sleep', document.hidden);
    document.querySelectorAll('[data-page-art]').forEach(el => {
      el.dataset.motionRunning = String(!el.classList.contains('motion-offscreen') && allowed() && !document.hidden);
    });
    for (const button of document.querySelectorAll('[data-page-motion-toggle]')) {
      button.hidden = false;
      button.disabled = reduced.matches || body.classList.contains('animation-disabled');
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', reduced.matches ? 'Motion reduced by your device settings' : paused ? 'Resume Animation' : 'Stop Animation');
      button.querySelector('span').textContent = reduced.matches ? 'Reduced motion' : paused ? 'Resume Animation' : 'Stop Animation';
    }
    if (!allowed() || document.hidden) for (const animation of animations) animation.finish();
    document.dispatchEvent(new CustomEvent('dss:motionchange', { detail: { paused } }));
  }
  const reveals = 'main .section-top, .pathway, .project-card, .resource-card, .paper-card, .event-card, .journal-card, .soc-team-card, .values-list > div, .role-card, .norm-card, .society-facts > div, .programme-step, .team-group-heading';
  const revealObserver = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      revealObserver.unobserve(target);
      if (revealed.has(target)) continue;
      revealed.add(target);
      if (!allowed() || document.hidden || !target.animate) continue;
      // Reveal content when it enters the viewport; never hide it while waiting.
      const animation = target.animate([
        { opacity: .25, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 550, easing: 'cubic-bezier(.2,.7,.2,1)' });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    }
  }, { threshold: .08 });
  const artObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.classList.toggle('motion-offscreen', !entry.isIntersecting);
      entry.target.dataset.motionRunning = String(entry.isIntersecting && allowed() && !document.hidden);
    }
  }, { threshold: .05 });
  function observe() {
    // Disconnect detached collection cards before observing freshly published content.
    revealObserver.disconnect();
    document.querySelectorAll(reveals).forEach(el => { if (!revealed.has(el)) revealObserver.observe(el); });
    document.querySelectorAll('[data-page-art]').forEach(el => {
      if (!observed.has(el)) { observed.add(el); artObserver.observe(el); }
    });
    sync();
  }
  function togglePreference() {
    paused = !paused;
    try { localStorage.setItem('dss_motion_paused', String(paused)); } catch {}
    sync();
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-page-motion-toggle]')) togglePreference();
  });
  document.addEventListener('dss:motiontoggle', togglePreference);
  document.addEventListener('dss:rendered', observe);
  document.addEventListener('dss:team-rendered', observe);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { for (const animation of animations) animation.cancel(); });
  window.addEventListener('pageshow', sync);
  window.addEventListener('storage',event=>{if(event.key==='dss_motion_paused'){paused=event.newValue==='true';sync();}});
  const app=document.getElementById('app');if(app)new MutationObserver(observe).observe(app,{childList:true});
  observe();
})();
