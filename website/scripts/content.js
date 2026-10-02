'use strict';
(() => {
  let revision, stream, loading;
  const page = location.pathname.split('/').pop().replace('.html', '') || 'index';
  const text = (selector, value) => { if (value !== undefined) document.querySelectorAll(selector).forEach(el => { el.textContent = value; }); };
  const attr = (selector, key, value) => { if (value !== undefined) document.querySelectorAll(selector).forEach(el => el.setAttribute(key, value)); };
  const original = new Map();
  const brandCopies=[...document.querySelectorAll('.soc-brand')].map(el=>[el,el.innerHTML]);
  const brandHome=document.querySelector('header > a[title]'), brandMarkup=brandHome?.innerHTML;
  document.querySelectorAll('[data-cms-id]').forEach(el => original.set(el.dataset.cmsId, { text: el.innerHTML, hidden: el.hidden, href: el.getAttribute('href'), src: el.getAttribute('src'), alt: el.getAttribute('alt') }));
  window.applySiteContent = content => {
    DSS.content = content;
    document.getElementById('site-menu')?.remove();
    if(brandHome)brandHome.innerHTML=brandMarkup;
    brandCopies.forEach(([el,markup])=>el.innerHTML=markup);
    for (const [id, initial] of original) {
      const el = document.querySelector(`[data-cms-id="${id}"]`); if (!el) continue;
      if (el.dataset.cmsText === 'true') el.innerHTML = initial.text;
      el.hidden = initial.hidden; for (const k of ['href', 'src', 'alt']) if (initial[k] !== null) el.setAttribute(k, initial[k]);
    }
    const theme = content.theme || {}, site = content.siteSettings || {}, hero = content.heroSection || {};
    window.applyBackgroundSettings?.(theme);
    for(const [key,variable] of [['accent','--color-accent-rgb'],['sky','--color-sky-rgb']])if(/^#[0-9a-f]{6}$/i.test(theme[key]||''))document.documentElement.style.setProperty(variable,theme[key].slice(1).match(/../g).map(part=>parseInt(part,16)).join(' '));
    const dark = localStorage.getItem('dss_dark_mode') !== null ? localStorage.getItem('dss_dark_mode') === 'true' : theme.mode === 'dark';
    document.documentElement.classList.toggle('dark', dark); document.body.classList.toggle('dark', dark);
    for (const [key, variable] of Object.entries({ accent: '--color-accent-blue', sky: '--color-accent-sky', bg: '--color-obsidian', surface: '--color-surface', ink:'--soc-ink', muted:'--soc-muted', deep:'--forest', line:'--soc-line', fontHeading: '--font-heading', fontBody: '--font-body' })) { if (theme[key]) document.documentElement.style.setProperty(variable, theme[key]); else document.documentElement.style.removeProperty(variable); }
    document.body.classList.toggle('animation-disabled', theme.canvasEnabled === false); window.updateDataSurface?.(theme);
    let css = document.getElementById('cms-custom-css'); if (!css) { css = document.createElement('style'); css.id = 'cms-custom-css'; document.head.append(css); } css.textContent = theme.customCss || '';
    text('header > a[title] > span, footer .font-semibold', site.siteTitle); text('#footer-copyright', site.footerCopyright);
    if (site.siteDesc) attr('meta[name=description]', 'content', site.siteDesc);
    if (site.logoImage) { for(const brand of document.querySelectorAll('.soc-brand')){const logo=brand.querySelector('.brand-symbol');if(logo){const image=Object.assign(document.createElement('img'),{src:site.logoImage,alt:site.siteTitle||'DSS',width:40,height:40});image.className='custom-brand-logo';logo.replaceWith(image);}} }
    text('#home-hero-title', hero.heroTitle); text('#home-hero-desc', hero.heroSubtitle); text('#home-hero-tagline, section#hero span.font-mono', hero.heroTagline);
    const art=document.querySelector('.data-art');
    if(art){
      document.querySelector('.hero-custom-image')?.remove();art.hidden=!!hero.heroImage;
      if(hero.heroImage){const image=document.createElement('img');image.className='hero-custom-image';image.src=hero.heroImage;image.alt=hero.heroImageAlt||'Data Science Society community';image.width=600;image.height=624;image.decoding='async';art.after(image);}
      document.documentElement.style.setProperty('--sphere-opacity',String(Math.max(10,Math.min(100,Number(theme.canvasOpacity)||55))/100));
    }
    const heroLinks = document.querySelector('#home-hero-title')?.closest('section')?.querySelectorAll('a') || [];
    [ ['primaryCtaText', 'primaryCtaLink'], ['secondaryCtaText', 'secondaryCtaLink'] ].forEach(([label, link], index) => { const el = heroLinks[index]; if (el) { if (hero[label] !== undefined) (el.querySelector('span') || el).textContent = hero[label]; if (hero[link] !== undefined) el.setAttribute('href', hero[link]); } });
    ['mission', 'vision', 'values'].forEach((name, i) => { text('#home-' + name + '-text', content.pillars?.['pillar' + (i + 1) + 'Desc']); const heading = document.querySelector('#home-' + name + '-text')?.parentElement.querySelector('h3'); if (heading && content.pillars?.['pillar' + (i + 1) + 'Title'] !== undefined) heading.textContent = content.pillars['pillar' + (i + 1) + 'Title']; });
    const headings = content.pageHeaders?.[page];
    if (headings) { text('main h1', headings.title); text(`#${page}-intro, #${page}-desc, #page-${page}-desc, #page-${page}-intro, #${page}-intro-text`, headings.desc); if (headings.seoTitle) document.title = headings.seoTitle; if (headings.seoDescription) attr('meta[name=description]', 'content', headings.seoDescription); }
    document.querySelectorAll('.soc-links a').forEach(link=>{const initial=original.get(link.dataset.cmsId);const key=(initial?.href||link.getAttribute('href')||'').replace('.html','');const record=content.collections.navigation?.find(n=>n.id==='nav-'+key);if(record){link.textContent=record.title;link.href=record.link;link.dataset.record='navigation:'+record.id;}});
    text('#contact-email-text', site.contactEmail); text('#contact-address-text', site.contactAddress);
    document.getElementById('cms-social-links')?.remove();
    const socials = [['GitHub',site.socialGithub],['X',site.socialX],['Discord',site.socialDiscord]].filter(([,url])=>url);
    if(socials.length){const nav=document.createElement('nav');nav.id='cms-social-links';nav.setAttribute('aria-label','Society social links');nav.className='flex gap-6 justify-center mt-6 text-sm';nav.innerHTML=socials.map(([label,url])=>`<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${label}</a>`).join('');document.querySelector('footer')?.append(nav);}
    renderActivePageContent();
    document.querySelectorAll('#cms-added-blocks').forEach(el => el.remove());
    const blocks = content.blocks?.[page] || [];
    if (blocks.length) {
      const container = document.createElement('div'); container.id = 'cms-added-blocks'; container.className = 'max-w-7xl mx-auto px-6 py-12 space-y-8';
      container.innerHTML = blocks.map((b,index) => ({...b,index})).filter(b => !b.hidden).map(b => `<section data-block="${b.index}" class="glass-panel rounded-3xl p-8"><h2 class="text-3xl mb-4">${escapeHTML(b.title)}</h2>${b.image ? `<img loading="lazy" decoding="async" src="${escapeHTML(b.image)}" alt="${escapeHTML(b.alt || b.title)}" class="rounded-2xl mb-6 w-full max-w-2xl">` : ''}<p class="whitespace-pre-line">${escapeHTML(b.body)}</p>${b.link ? `<a class="content-action" href="${escapeHTML(b.link)}">${escapeHTML(b.linkText || 'Learn more')}</a>` : ''}</section>`).join('');
      document.querySelector('main')?.append(container);
    }
    for (const [id, props] of Object.entries(content.pages?.[page] || {})) {
      const el = document.querySelector(`[data-cms-id="${id}"]`); if (!el) continue;
      if (props.text !== undefined && el.dataset.cmsText === 'true') el.textContent = props.text;
      for (const key of ['src', 'alt', 'href']) if (props[key] !== undefined) el.setAttribute(key, props[key]);
      if (props.hidden !== undefined) el.hidden = props.hidden;
    }
    window.renderSiteBanners?.(content);
    document.querySelectorAll('img').forEach(el => { el.decoding = 'async'; if (!el.closest('header')) el.loading = 'lazy'; });
    document.querySelectorAll('a[href="login.html"]').forEach(el => { if (DSS.user) { el.href = DSS.user.role === 'admin' ? 'admin.html' : 'member-dashboard.html'; (el.querySelector('span') || el).textContent = 'Dashboard'; } });
    document.dispatchEvent(new CustomEvent('dss:rendered'));
  };
  async function sync() {
    if (loading) return loading;
    loading = (async () => { const content = await api('/api/content'); if (revision !== content._revision) { revision = content._revision; applySiteContent(content); } })();
    try { await loading; } catch (error) { showAdminToast('Live content is unavailable. Reload to try again.', 'error'); } finally { loading = null; }
  }
  function connect() {
    if (document.hidden || stream || new URLSearchParams(location.search).has('edit')) return;
    stream = new EventSource('/api/changes'); stream.onmessage = e => { if (Number(e.data) !== revision) sync(); };
  }
  document.addEventListener('visibilitychange', () => { if(new URLSearchParams(location.search).has('edit'))return; if (document.hidden) { stream?.close(); stream = null; } else { revision = undefined; sync(); connect(); } });
  window.addEventListener('pagehide', () => stream?.close());
  window.addEventListener('pageshow', e => { if (e.persisted) { revision = undefined; sync(); connect(); } });
  (async () => { try { const account = await api('/api/auth/me'); DSS.user = account.user; DSS.authProvider = account.authProvider; await sync(); connect(); } catch (error) { showAdminToast(error.message, 'error'); } })();
})();
