'use strict';
(() => {
  window.projectArtwork = (index = 0) => `<svg viewBox="0 0 480 240" fill="none" aria-hidden="true">${index % 2 === 0 ? Array.from({length:14},(_,i)=>`<path d="M30 ${170+i*3} Q140 ${20+i*8} 240 ${110+i*5} T450 ${50+i*9}" stroke="currentColor" stroke-opacity="${.15+i*.045}" stroke-width="2"/>`).join('') : `<g stroke="currentColor" stroke-opacity=".3">${[60,120,180].flatMap(y=>[70,120,170].map(z=>`<path d="M100 ${y}L240 ${z}L380 ${240-y}"/>`)).join('')}</g><g fill="currentColor">${[100,240,380].flatMap(x=>[60,120,180].map(y=>`<circle cx="${x}" cy="${y}" r="${x===240?10:7}"/>`)).join('')}</g>`}</svg>`;
  const record = (item,key) => `data-record="${key}:${esc(item.id)}" data-access="${item.requiresAuth===false?'open':'member'}"`;
  const image = (item, fallback) => item.image ? `<img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" decoding="async" width="800" height="500">` : fallback;
  const action = (item,key) => `<div class="content-actions">${actions(item,key)}</div>`;
  window.projectCard = (item,index,home=false) => `<article class="project-card content-card" ${record(item,'projects')}><div class="project-art art-${index%3}">${image(item,projectArtwork(index))}</div><div class="project-copy"><p class="record-kicker">${esc([item.type,item.lang].filter(Boolean).join(' · '))}</p><h3>${esc(item.title)}</h3><p>${esc(item.desc)}</p>${home?'<a class="text-link" href="projects.html">Explore project</a>':action(item,'projects')}</div></article>`;
  window.eventDate = item => {const d=item.startDate?new Date(item.startDate+'T12:00:00'):null;return d&&!isNaN(d)?`<strong>${d.getDate()}</strong><span>${d.toLocaleDateString('en',{month:'short'})}</span>`:'<i data-lucide="calendar-days"></i><span>Upcoming</span>';};
  window.renderCatalog = () => {
    for(const [key,id] of Object.entries({projects:'projects-grid',resources:'resources-grid',papers:'papers-grid',events:'events-grid',blogs:'blogs-grid'})){
      const host=document.getElementById(id);if(!host)continue;
      host.innerHTML=(DSS.content.collections[key]||[]).map((item,i)=>{
        if(key==='projects')return projectCard(item,i);
        if(key==='resources')return `<article class="resource-card content-card" ${record(item,key)}><div class="resource-cover cover-${i%3}"><i data-lucide="${/video/i.test(item.type)?'play':/course/i.test(item.type)?'layers':'book-open'}"></i><span>${esc(item.type||'Resource')}</span></div><div class="resource-copy"><p class="record-kicker">${esc(item.length||'Self-paced learning')}</p><h3>${esc(item.title)}</h3><p>${esc(item.desc)}</p>${action(item,key)}</div></article>`;
        if(key==='papers')return `<article class="paper-card content-card" ${record(item,key)}><div class="paper-icon"><i data-lucide="file-text"></i></div><div class="paper-copy"><p class="record-kicker">${esc(item.journal||'Research')}</p><h3>${esc(item.title)}</h3><p class="paper-authors">${esc(item.authors)}</p><details><summary>Read abstract</summary><p>${esc(item.excerpt)}</p></details>${action(item,key)}</div></article>`;
        if(key==='events')return `<article class="event-card content-card" ${record(item,key)}><div class="event-calendar">${eventDate(item)}</div><div class="event-copy"><p class="record-kicker">${esc(item.type)}</p><h3>${esc(item.title)}</h3><p>${esc(item.desc)}</p><div class="event-meta"><span><i data-lucide="clock"></i>${esc(item.date)}</span><span><i data-lucide="map-pin"></i>${esc(item.loc)}</span></div>${action(item,key)}</div></article>`;
        return `<article class="journal-card content-card" ${record(item,key)}><div class="journal-image art-${i%3}">${image(item,projectArtwork(i))}</div><div class="journal-copy"><p class="record-kicker">${esc(item.tag)}</p><h3>${esc(item.title)}</h3><p>${esc(item.excerpt)}</p><p class="journal-byline">${esc([item.author,item.date].filter(Boolean).join(' · '))}</p>${action(item,key)}</div></article>`;
      }).join('')||'<p class="empty-content">New content will appear here when it is published.</p>';
    }
  };
  document.addEventListener('error',e=>{if(e.target.matches?.('.journal-image img,.project-art img')){e.target.replaceWith(Object.assign(document.createElement('span'),{className:'image-placeholder',textContent:'Data Science Society'}));}},true);
})();
