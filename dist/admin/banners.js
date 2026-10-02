window.renderBannerManager = ({ host, banners, field, modal, h, onChange }) => {
  host.innerHTML=`<div class="page-intro"><div><p class="eyebrow">Build the website</p><h1>Banners & announcements</h1><p>Small updates with a clear purpose. Announce registrations, share news, or point visitors to what is next.</p></div><button class="btn primary" id="new-banner">Create banner</button></div><div class="note">Choose a top announcement strip or a small floating card. Target specific pages and optionally set a start or end time. Changes follow your “Publish on apply” setting.</div><section class="panel" id="banner-list">${banners.map((banner,index)=>`<article class="banner-management-row"><div class="banner-sample ${h(banner.tone||'mint')}"><strong>${h(banner.label||'Announcement')}</strong><p>${h(banner.text)}</p><span>${h(banner.cta||'')}</span></div><div class="row"><div><strong>${banner.active?'Active':'Hidden'} · ${banner.placement==='floating'?'Floating card':'Top strip'}</strong><small>Pages: ${h(banner.pages||'all')}${banner.startsAt?' · From '+h(new Date(banner.startsAt).toLocaleString()):''}${banner.endsAt?' · Until '+h(new Date(banner.endsAt).toLocaleString()):''}</small></div><div class="toolbar"><button class="btn small" data-banner-edit="${index}">Edit</button><button class="btn small" data-banner-toggle="${index}">${banner.active?'Hide':'Show'}</button><button class="btn small danger" data-banner-delete="${index}">Delete</button></div></div></article>`).join('')||'<div class="empty">No banners. Create an announcement when you have news to share.</div>'}</section>`;
  const edit=index=>{
    const current=index===undefined?{id:crypto.randomUUID(),label:'Registration open',text:'Membership applications are open. Find your place in DSS.',cta:'Apply now',link:'join.html',active:true,placement:'top',tone:'mint',pages:'all',startsAt:'',endsAt:''}:banners[index];
    const fields=field('label',current.label)+field('text',current.text,{multiline:true,required:true,label:'Announcement text'})+field('cta',current.cta,{label:'Button text'})+field('link',current.link,{label:'Destination URL'})+field('placement',current.placement,{choices:['top','floating']})+field('tone',current.tone,{choices:['mint','sky','amber','rose']})+field('pages',current.pages||'all',{label:'Pages (all, or index,about,events…)'})+field('active',current.active,{label:'Visible when scheduled'})+field('startsAt',current.startsAt,{label:'Start time (optional ISO date/time)'})+field('endsAt',current.endsAt,{label:'End time (optional ISO date/time)'});
    modal(index===undefined?'Create banner':'Edit banner',fields,async form=>{
      const updated={...current};for(const el of form.querySelectorAll('[name]'))updated[el.name]=el.type==='checkbox'?el.checked:el.value;
      for(const key of ['startsAt','endsAt'])if(updated[key]){if(!Number.isFinite(Date.parse(updated[key])))throw Error('Use a valid date/time such as 2026-10-01T09:00:00+05:00.');updated[key]=new Date(updated[key]).toISOString();}
      if(updated.startsAt&&updated.endsAt&&Date.parse(updated.endsAt)<=Date.parse(updated.startsAt))throw Error('End time must be after start time.');
      if(index===undefined)banners.push(updated);else banners[index]=updated;await onChange();
    },'Apply banner');
  };
  host.querySelector('#new-banner').onclick=()=>edit();
  host.querySelector('#banner-list').onclick=async event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.bannerEdit!==undefined)return edit(Number(button.dataset.bannerEdit));
    if(button.dataset.bannerToggle!==undefined){const banner=banners[Number(button.dataset.bannerToggle)];banner.active=!banner.active;await onChange();}
    if(button.dataset.bannerDelete!==undefined&&confirm('Remove this banner?')){banners.splice(Number(button.dataset.bannerDelete),1);await onChange();}
  };
};
