'use strict';
(() => {
  let teamFilter = 'all';
  const groups = {
    executive: ['Executive team', 'Direction, coordination, and society leadership.'],
    director: ['Directors', 'The people guiding programmes and activities.'],
    subteam: ['Society teams', 'The people bringing the day-to-day work to life.'],
    ambassador: ['Student ambassadors', 'Connecting the society across campuses.'],
    other: ['Society members', 'Contributing their time, ideas, and skills.']
  };
  const category = member => Object.hasOwn(groups, member.category) ? member.category : 'other';
  const portrait = (member, heading = 'h4') => `<article class="soc-team-card" data-record="team:${esc(member.id)}"><div class="soc-portrait"><span class="portrait-initials" aria-hidden="true">${esc(String(member.name || '').trim().split(/\s+/).map(n => n[0]).slice(0, 2).join(''))}</span>${member.image ? `<img src="${esc(member.image)}" alt="${esc(member.name)}" loading="lazy" decoding="async" width="500" height="540">` : ''}</div><div class="team-copy"><span class="team-category">${esc(groups[category(member)][0])}</span><${heading}>${esc(member.name)}</${heading}><p class="team-role">${esc(member.role)}</p><p>${esc(member.bio)}</p></div></article>`;
  function renderTeam(records) {
    const team = document.getElementById('team-grid');
    if (!team) return;
    // Public profiles are independent of private application/account data.
    const members = (records.team || []).filter(m => category(m) !== 'ambassador');
    const keys = teamFilter === 'all' ? ['executive', 'director', 'subteam', 'other'] : [teamFilter];
    team.innerHTML = keys.map(key => {
      const list = members.filter(m => category(m) === key);
      if (!list.length) return '';
      return `<section class="team-group" aria-labelledby="team-group-${key}"><div class="team-group-heading"><h3 id="team-group-${key}">${esc(groups[key][0])}</h3><p>${esc(groups[key][1])}</p></div><div class="team-grid">${list.map(m => portrait(m)).join('')}</div></section>`;
    }).join('') || '<p class="empty-content">Team members in this group will appear here when their profiles are published.</p>';
    const ambassadors = (records.team || []).filter(m => category(m) === 'ambassador');
    const ambassadorGrid = document.getElementById('ambassador-grid');
    if (ambassadorGrid) {
      ambassadorGrid.innerHTML = ambassadors.map(m => portrait(m)).join('');
      document.getElementById('ambassador-directory').hidden = ambassadors.length === 0;
    }
  }
  window.renderSocietyContent = () => {
    if (!DSS.content) return;
    const records = DSS.content.collections;
    const projects = document.getElementById('home-projects');
    if (projects) projects.innerHTML = (records.projects || []).slice(0, 2).map((r, i) => projectCard(r, i, true)).join('');
    const events = document.getElementById('home-events');
    if (events) events.innerHTML = [...(records.events || [])].sort((a,b)=>Number(b.status==='confirmed')-Number(a.status==='confirmed')||(a.startDate||'9999').localeCompare(b.startDate||'9999')).slice(0, 2).map(item => `<article class="home-event" data-record="events:${esc(item.id)}"><div class="date-tile">${eventDate(item)}</div><div><p class="record-kicker">${esc(item.type)}</p><h3>${esc(item.title)}</h3><p>${esc(item.date)} · ${esc(item.loc)}</p></div><a href="detail.html?collection=events&amp;id=${encodeURIComponent(item.id)}" class="text-link">Event details</a></article>`).join('');
    renderTeam(records);
    const opportunities = document.getElementById('opportunities-grid');
    if (opportunities) {
      const eligible = DSS.user?.status === 'approved' && ['admin', 'member', 'ambassador'].includes(DSS.user.role);
      opportunities.innerHTML = eligible ? (records.opportunities || []).map(item => `<article class="role-card" data-record="opportunities:${esc(item.id)}"><p class="role-status">${esc(item.type || 'Society opportunity')}</p><h3>${esc(item.title)}</h3><p>${esc(item.desc)}</p>${item.link ? `<a class="text-link" href="${esc(item.link)}" target="_blank" rel="noopener">View opportunity</a>` : '<a class="text-link" href="member-dashboard.html">Open your workspace</a>'}</article>`).join('') || '<p class="empty-content">New opportunities will appear here when the society publishes them. You can also follow updates in your member workspace.</p>' : '<div class="opportunity-access"><h3>A workspace for your next contribution.</h3><p>Published opportunities are available to approved society members and ambassadors. Apply below or sign in with your existing account.</p><a class="soc-button ghost" href="login.html">Sign in to view opportunities</a></div>';
    }
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-team-filter]');
    if (!button || !['all', 'executive', 'director', 'subteam'].includes(button.dataset.teamFilter)) return;
    teamFilter = button.dataset.teamFilter;
    document.querySelectorAll('[data-team-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    renderTeam(DSS.content?.collections || {});
    document.dispatchEvent(new CustomEvent('dss:team-rendered'));
  });
  document.addEventListener('error', event => { if (event.target.matches?.('.soc-portrait img')) event.target.hidden = true; }, true);
})();
