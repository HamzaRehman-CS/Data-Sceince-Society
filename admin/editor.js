/* Preview transport is independent of portal/account rendering. */
window.DSSPageEditor = class {
  constructor({ frame, draft, onSelect, onInventory, onRecord, onBlock, onInlineEdit, onBanners, onStatus }) {
    this.frame = frame; this.draft = draft;
    this.listener = event => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.channel !== 'dss-editor') return;
      const message = event.data;
      if (message.type === 'ready') { this.apply(); onStatus('Ready · click to select, double-click to type'); }
      if (message.type === 'selected') onSelect(message.element);
      if (message.type === 'inventory') onInventory(message.elements);
      if (message.type === 'record') onRecord(message.record);
      if (message.type === 'block') onBlock(message.index);
      if (message.type === 'inline-edit') onInlineEdit(message);
      if (message.type === 'banners') onBanners();
      if (message.type === 'applied') onStatus('Ready · click to select, double-click to type');
    };
    window.addEventListener('message', this.listener);
    onStatus('Connecting to preview…');
    // Handles a cached iframe that became ready before the listener was attached.
    this.retry = setInterval(() => { if (frame.isConnected) this.send('ping'); else this.destroy(); }, 1500);
    this.timeout = setTimeout(() => { clearInterval(this.retry); }, 12000);
  }
  send(type, detail = {}) { this.frame.contentWindow?.postMessage({ channel: 'dss-editor', type, ...detail }, location.origin); }
  apply() { this.send('apply', { content: this.draft() }); clearInterval(this.retry); }
  select(id) { this.send('select', { id }); }
  destroy() { clearInterval(this.retry); clearTimeout(this.timeout); window.removeEventListener('message', this.listener); }
};
