/* Runs inside the preview; it never waits for images or the window load event. */
(() => {
  if (!new URLSearchParams(location.search).has('edit') || parent === window) return;
  const send = (type, detail = {}) => parent.postMessage({ channel: 'dss-editor', type, ...detail }, location.origin);
  let selected, applying = false;
  const describe = el => ({ id: el.dataset.cmsId, tag: el.tagName, text: (el.innerText || el.textContent).trim(), canText: el.dataset.cmsText === 'true', href: el.getAttribute('href'), src: el.getAttribute('src'), alt: el.getAttribute('alt'), hidden: el.hidden, parentLink: el.tagName !== 'A' ? el.closest('a[data-cms-id]')?.dataset.cmsId : null, parentSection: el.tagName !== 'SECTION' ? el.closest('section[data-cms-id]')?.dataset.cmsId : null });
  function inventory() {
    send('inventory', { elements: [...document.querySelectorAll('[data-cms-id]')].map(describe) });
  }
  function select(id, scroll = false) {
    const el = document.querySelector(`[data-cms-id="${CSS.escape(id)}"]`); if (!el) return;
    document.querySelectorAll('[data-editor-selected]').forEach(n => n.removeAttribute('data-editor-selected'));
    el.setAttribute('data-editor-selected', ''); selected = id;
    if (scroll && !el.hidden) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    send('selected', { element: describe(el) });
  }
  function boot() {
    document.documentElement.classList.add('cms-editing');
    const style = document.createElement('style');
    style.textContent = '[data-cms-id]:hover{outline:2px dashed #34d399!important;outline-offset:3px;cursor:crosshair!important}[data-editor-selected]{outline:3px solid #34d399!important;outline-offset:5px}[contenteditable]{cursor:text!important}';
    document.head.append(style);
    document.addEventListener('click', event => {
      if (event.target.closest('[contenteditable]')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const record = event.target.closest('[data-record]');
      if (record) { send('record', { record: record.dataset.record }); return; }
      const block = event.target.closest('[data-block]');
      if (block) { send('block', { index: Number(block.dataset.block) }); return; }
      if (event.target.closest('[data-banner-id]')) { send('banners'); return; }
      const element = event.target.closest('[data-cms-id]'); if (element) select(element.dataset.cmsId);
    }, true);
    document.addEventListener('dblclick', event => {
      const el = event.target.closest('[data-cms-text="true"]'); if (!el) return;
      event.preventDefault(); el.contentEditable = 'plaintext-only'; el.focus();
      const original = el.innerText;
      const keydown = e => { if (e.key === 'Escape') { el.innerText = original; el.blur(); } };
      el.addEventListener('keydown', keydown);
      el.addEventListener('blur', () => { const text=el.innerText; el.removeAttribute('contenteditable'); el.removeEventListener('keydown',keydown); send('inline-edit', { id: el.dataset.cmsId, text }); }, { once: true });
    });
    document.addEventListener('submit', e => e.preventDefault(), true);
    send('ready'); inventory();
  }
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.channel !== 'dss-editor') return;
    const message = event.data;
    if (message.type === 'apply' && window.applySiteContent) {
      applying = true; window.applySiteContent(message.content); applying = false;
      inventory(); if (selected) select(selected); send('applied');
    }
    if (message.type === 'select') select(message.id, true);
    if (message.type === 'ping') send('ready');
  });
  document.addEventListener('dss:rendered', () => { if (!applying) { send('ready'); inventory(); } });
  // This script is placed after the page content. Bind now, even if a deferred
  // icon script or an image still prevents DOMContentLoaded/window.load.
  boot();
})();
