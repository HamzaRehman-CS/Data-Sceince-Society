'use strict';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
window.escapeHTML = esc;
document.addEventListener('DOMContentLoaded', () => window.lucide?.createIcons());
window.DSS = { user: null, content: null };
window.api = async (url, method = 'GET', data) => {
  const response = await fetch(url, { method, credentials: 'same-origin', headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to complete this request.'); return result;
};
window.showAdminToast = (message, type = 'success') => {
  let toast = document.getElementById('site-feedback');
  if (!toast) { toast = document.createElement('div'); toast.id = 'site-feedback'; toast.setAttribute('role', 'status'); document.body.append(toast); }
  toast.textContent = message; toast.className = 'site-toast ' + type; toast.hidden = false;
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
};
window.toggleTheme = () => { const dark = !document.documentElement.classList.contains('dark'); document.documentElement.classList.toggle('dark', dark); document.body.classList.toggle('dark', dark); localStorage.setItem('dss_dark_mode', String(dark)); };
window.toggleHamburgerMenu = () => {
  let menu = document.getElementById('site-menu');
  if (!menu) {
    menu = document.createElement('dialog'); menu.id = 'site-menu';
    menu.innerHTML = `<div class="menu-head"><a class="soc-brand" href="index.html" style="gap:10px; text-decoration:none"><div class="brand-symbol" style="width:40px; color:var(--blue)"><svg viewBox="-3 0 78 44" fill="none" aria-hidden="true"><path d="M35.8 22C28.5 11 22.5 7 16 7A15 15 0 0 0 16 37c6.5 0 12.5-4 19.8-15ZM36.2 22C43.5 11 49.5 7 56 7a15 15 0 0 1 0 30c-6.5 0-12.5-4-19.8-15Z" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span style="font-size:15px; font-weight:700; line-height:1.15; color:var(--soc-ink)">Data Science<br>Society</span></a><button aria-label="Close navigation">×</button></div><nav>` + (DSS.content?.collections.navigation || []).filter(item => !item.requiresAuth || window.DSS?.user).map(item => `<a href="${esc(item.link)}">${esc(item.title)}</a>`).join('') + '</nav>';
    menu.setAttribute('aria-label','Society navigation');
    if (DSS.content?.siteSettings?.logoImage) { const image = new Image(); image.src=DSS.content.siteSettings.logoImage; image.alt=''; image.className='custom-brand-logo'; image.width=52; image.height=40; menu.querySelector('.brand-symbol').replaceWith(image); }
    if (DSS.content?.siteSettings?.siteTitle) menu.querySelector('.soc-brand > span').textContent=DSS.content.siteSettings.siteTitle;
    document.body.append(menu); menu.querySelector('button').onclick = () => menu.close();
  }
  menu.open ? menu.close() : menu.showModal();
};
function actions(item, collection) {
  const approved = DSS.user?.status === 'approved';
  const gated = item.requiresAuth !== false && !approved;
  if (gated) return '<a class="content-action" href="login.html">Sign in to access</a>';
  let result = item.fileUrl ? `<a class="content-action" href="${esc(item.fileUrl)}" target="_blank" rel="noopener">Download ${/\.pdf(?:$|\?)/i.test(item.fileUrl)?'PDF':'file'}</a>` : '';
  if (item.link) result += `<a class="content-action" href="${esc(item.link)}" target="_blank" rel="noopener">${({events:"Event details",projects:"View project",blogs:"Read article",papers:"View publication"})[collection]||"Open resource"}</a>`;
  if (collection === 'events') result += `<button class="content-action" data-register="${esc(item.id)}">Register for event</button>`;
  if (['papers', 'projects', 'resources', 'blogs'].includes(collection) && approved) result += `<button class="content-action" data-save="${esc(item.id)}" data-collection="${collection}">Save to dashboard</button>`;
  return result;
}
window.renderActivePageContent = () => {
  const content = DSS.content; if (!content) return;
  window.renderCatalog?.();
  window.renderSocietyContent?.();
};
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-register], [data-save]'); if (!button) return;
  if (!DSS.user) { location.href = 'login.html'; return; }
  button.disabled = true;
  try {
    if (button.dataset.register) { await api('/api/member/register-event', 'POST', { id: button.dataset.register }); showAdminToast('Registration saved. View it in your dashboard.'); }
    else { await api('/api/member/bookmark', 'POST', { id: button.dataset.save, collection: button.dataset.collection }); showAdminToast('Saved to your dashboard.'); }
  } catch (error) { showAdminToast(error.message, 'error'); } finally { button.disabled = false; }
});
window.handleContactFormSubmit = async event => {
  event.preventDefault(); const form = event.target, button = form.querySelector('[type=submit]'); button.disabled = true;
  try { await api('/api/contact', 'POST', { name: document.getElementById('contact-name').value, email: document.getElementById('contact-email').value, message: document.getElementById('contact-message').value }); showAdminToast('Your message has reached the DSS team.'); form.reset(); }
  catch (error) { showAdminToast(error.message, 'error'); } finally { button.disabled = false; }
};
window.handleJoinSubmission = async event => {
  event.preventDefault(); const form = event.target, button = form.querySelector('[type=submit]'); button.disabled = true;
  const value = id => document.getElementById('applicant-' + id)?.value || '';
  try {
    const ambassador = form.dataset.ambassador === 'true', existing = ['student','member'].includes(DSS.user?.role) && DSS.user.status === 'approved';
    if (!existing && value('password') !== value('confirm')) throw new Error('Your passwords don’t match. Please check both fields.');
    const data = { name: value('name'), email: value('email'), password: value('password'), role: ambassador ? 'ambassador' : 'student', membershipApplication: document.getElementById('application-track-type').value === 'General Member Application', university: value('university'), studentId: value('student-id'), phone: value('phone'), major: value('major'), interest: value('interest'), motivation: value('motivation'), pitch: value('pitch'), city:value('city'), province:value('province'), semester:value('semester'), cnic:value('cnic'), experience:value('experience'), availability:value('availability'), portfolio:value('portfolio'), consent:document.getElementById('applicant-consent')?.checked === true };
    if(existing && !ambassador && !data.membershipApplication) { location.href='member-dashboard.html'; return; }
    await api(existing ? ambassador ? '/api/member/ambassador-application' : '/api/member/membership-application' : '/api/auth/register', 'POST', data);
    location.href = 'member-dashboard.html';
  } catch (error) { const feedback=document.getElementById('join-feedback'); if(feedback) {feedback.textContent=error.message;feedback.scrollIntoView({block:'nearest'});} else showAdminToast(error.message, 'error'); } finally { button.disabled = false; }
};
