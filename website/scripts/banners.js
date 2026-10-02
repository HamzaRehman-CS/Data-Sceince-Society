(() => {
  let timer;
  window.renderSiteBanners = content => {
    clearTimeout(timer);document.querySelectorAll('.dss-banners,.dss-floating-banners,#dss-announcement').forEach(el=>el.remove());
    const page=location.pathname.split('/').pop().replace('.html','')||'index',now=Date.now();
    const top=document.createElement('div');top.className='dss-banners';
    const floating=document.createElement('div');floating.className='dss-floating-banners';
    let next=Infinity;
    for(const banner of content.banners||[]) {
      if(!banner.active)continue;
      const start=banner.startsAt?Date.parse(banner.startsAt):0,end=banner.endsAt?Date.parse(banner.endsAt):Infinity;
      if(start>now)next=Math.min(next,start);if(end>now&&isFinite(end))next=Math.min(next,end);
      const pages=String(banner.pages||'all').split(',').map(p=>p.trim());
      if(start>now||end<=now||(!pages.includes('all')&&!pages.includes(page)))continue;
      const key='dss-banner-dismiss:'+banner.id+':'+JSON.stringify(banner);
      if(!new URLSearchParams(location.search).has('edit')&&sessionStorage.getItem(key))continue;
      const el=document.createElement('aside');el.className='dss-banner '+(banner.tone||'mint');el.dataset.bannerId=banner.id;el.setAttribute('aria-label','Society announcement');
      el.innerHTML=`${banner.label?`<strong>${esc(banner.label)}</strong>`:''}<span>${esc(banner.text)}</span>${banner.link&&banner.cta?`<a href="${esc(banner.link)}">${esc(banner.cta)}</a>`:''}<button type="button" aria-label="Dismiss announcement">×</button>`;
      el.querySelector('button').onclick=()=>{sessionStorage.setItem(key,'1');el.remove();};
      (banner.placement==='floating'?floating:top).append(el);
    }
    if(top.children.length)document.body.prepend(top);if(floating.children.length)document.body.append(floating);
    if(isFinite(next))timer=setTimeout(()=>window.renderSiteBanners(content),Math.min(2147483647,Math.max(100,next-now+100)));
  };
})();
