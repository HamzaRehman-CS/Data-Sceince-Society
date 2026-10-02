/**
 * Data Science Society - Sanity Studio Universal Control Center Engine
 * Version 2.0 | Clean, Intuitive, Real-Time Full Site Management Engine
 */

(function () {
  'use strict';

  // Active Navigation State
  let activeTab = 'desk';
  let activeDeskItem = 'themeSettings';
  let activeCollectionId = null;
  let activeSearchTerm = '';

  // Cross-tab BroadcastChannel for Real-Time Sync with Website (http://localhost:3000)
  const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dss_sanity_sync') : null;

  // Helper Escape Functions
  function escapeQuotes(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function safeJSONParse(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      const parsed = JSON.parse(data);
      if (Array.isArray(fallback) && fallback.length > 0 && (!Array.isArray(parsed) || parsed.length === 0)) {
        return fallback;
      }
      return parsed;
    } catch (e) {
      return fallback;
    }
  }

  function getColorVal(varName, fallback) {
    if (varName === '--color-accent-blue') return localStorage.getItem('dss_color_accent') || fallback;
    if (varName === '--color-accent-sky') return localStorage.getItem('dss_color_sky') || fallback;
    if (varName === '--color-obsidian') return localStorage.getItem('dss_color_bg') || fallback;
    if (varName === '--color-surface') return localStorage.getItem('dss_color_surface') || fallback;
    return fallback;
  }

  // 📁 Direct File Upload & Link Universal Engine Component
  function renderLinkAndFileUploadEngine({ prefix, link = '', fileUrl = '', fileName = '', fileSize = '', requiresAuth = true, linkLabel = 'External Direct Link / URL', linkPlaceholder = 'https://...', fileLabel = 'Upload Document / Preprint / Asset', fileHelp = 'Upload PDF, DOCX, ZIP, or Jupyter Notebooks' }) {
    return `
      <div class="p-4 bg-[#181b22] border border-[#2e333d] rounded-2xl space-y-3.5 mt-4">
        <div class="flex items-center justify-between border-b border-[#2e333d] pb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold uppercase text-sky-400">🔗 LINKS & DIRECT FILE UPLOADS</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">Dual Mode</span>
          </div>
          <span class="text-[10px] font-mono text-studio-muted">Access Control & Assets</span>
        </div>

        <!-- Option 1: Direct Link URL -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block text-[11px] font-mono text-studio-muted font-semibold">1. ${escapeHTML(linkLabel)}</label>
            ${link ? `<a href="${escapeQuotes(link)}" target="_blank" class="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1">Test Link ↗</a>` : ''}
          </div>
          <input type="text" id="${prefix}-field-link" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-mono" placeholder="${escapeQuotes(linkPlaceholder)}" value="${escapeQuotes(link)}">
          <p class="text-[10px] font-mono text-studio-muted mt-1">Paste any external webpage URL, arXiv preprint, IEEE DOI, Colab notebook, or registration URL.</p>
        </div>

        <!-- Option 2: Direct File Upload -->
        <div>
          <label class="block text-[11px] font-mono text-studio-muted font-semibold mb-1">2. ${escapeHTML(fileLabel)}</label>
          <div class="p-3 bg-[#0e1013] border border-dashed border-[#3a404d] rounded-xl space-y-2">
            <div class="flex items-center justify-between gap-3">
              <label class="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md">
                <span>📁 Choose File to Upload</span>
                <input type="file" id="${prefix}-file-input" onchange="handleStudioFileUpload(this, '${prefix}')" class="hidden" accept=".pdf,.docx,.doc,.zip,.ipynb,.csv,.py,.txt,.pptx">
              </label>
              <span class="text-[10px] font-mono text-studio-muted">${escapeHTML(fileHelp)}</span>
            </div>

            <div id="${prefix}-upload-status"></div>

            <div id="${prefix}-file-preview-box">
              ${fileUrl ? `
                <div class="flex items-center justify-between p-2.5 bg-[#1e222a] border border-[#2e333d] rounded-xl">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-lg">📄</span>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-white block truncate">${escapeHTML(fileName || 'Attached File')}</span>
                      <span class="text-[10px] font-mono text-emerald-400">${escapeHTML(fileSize || 'Attached')} • Ready & Linked</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <a href="${escapeQuotes(fileUrl)}" target="_blank" download class="text-[10px] text-sky-400 hover:text-sky-300 font-mono font-bold px-2 py-1 bg-sky-500/10 rounded-lg">Preview</a>
                    <button type="button" onclick="removeStudioFile('${prefix}')" class="text-[10px] text-rose-400 hover:text-rose-300 font-mono font-bold px-2 py-1 bg-rose-500/10 rounded-lg">Remove</button>
                  </div>
                </div>
              ` : `<span class="text-[10px] text-studio-muted font-mono block py-1">No direct file uploaded yet. You can add a link above or upload a file here.</span>`}
            </div>

            <input type="hidden" id="${prefix}-field-fileurl" value="${escapeQuotes(fileUrl)}">
            <input type="hidden" id="${prefix}-field-filename" value="${escapeQuotes(fileName)}">
            <input type="hidden" id="${prefix}-field-filesize" value="${escapeQuotes(fileSize)}">
          </div>
        </div>

        <!-- Access Control / Member Gating Toggle -->
        <div class="pt-2 border-t border-[#2e333d] flex items-start gap-2.5">
          <input type="checkbox" id="${prefix}-field-requires-auth" class="mt-1 rounded bg-[#0e1013] border-[#3a404d] text-sanityRed focus:ring-0 cursor-pointer w-4 h-4" ${requiresAuth !== false ? 'checked' : ''}>
          <div>
            <label for="${prefix}-field-requires-auth" class="text-xs font-mono font-bold text-slate-200 cursor-pointer block">
              🔒 Require Student Member / Admin Login to Access Link & File
            </label>
            <p class="text-[10px] font-mono text-studio-muted leading-tight mt-0.5">
              When enabled, guest visitors will see a prompt <span class="text-sky-300">"🔒 Login to View Links & Files"</span>. Only authenticated student members and admins will see the active download buttons and external links.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // Window File Upload Handler for Studio
  window.handleStudioFileUpload = async function(input, prefix) {
    const file = input.files?.[0];
    if (!file) return;

    const statusEl = document.getElementById(`${prefix}-upload-status`);
    if (statusEl) statusEl.innerHTML = `<span class="text-amber-400 font-mono text-[11px] animate-pulse">Uploading ${escapeHTML(file.name)}...</span>`;

    const reader = new FileReader();
    reader.onload = async function(e) {
      const dataUrl = e.target.result;
      let finalUrl = dataUrl;
      let finalSize = `${(file.size / 1024).toFixed(1)} KB`;
      if (file.size >= 1024 * 1024) {
        finalSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      }

      try {
        const res = await fetch('/api/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileData: dataUrl })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.url) {
            finalUrl = json.url;
            finalSize = json.fileSize || finalSize;
          }
        }
      } catch (err) {
        console.warn('Server upload notice, using DataURL:', err);
      }

      document.getElementById(`${prefix}-field-fileurl`).value = finalUrl;
      document.getElementById(`${prefix}-field-filename`).value = file.name;
      document.getElementById(`${prefix}-field-filesize`).value = finalSize;

      const previewBox = document.getElementById(`${prefix}-file-preview-box`);
      if (previewBox) {
        previewBox.innerHTML = `
          <div class="flex items-center justify-between p-2.5 bg-[#1e222a] border border-[#2e333d] rounded-xl">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-lg">📄</span>
              <div class="min-w-0">
                <span class="text-xs font-bold text-white block truncate">${escapeHTML(file.name)}</span>
                <span class="text-[10px] font-mono text-emerald-400">${escapeHTML(finalSize)} • Ready to Save</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="${escapeQuotes(finalUrl)}" target="_blank" download class="text-[10px] text-sky-400 hover:text-sky-300 font-mono font-bold px-2 py-1 bg-sky-500/10 rounded-lg">Preview</a>
              <button type="button" onclick="removeStudioFile('${prefix}')" class="text-[10px] text-rose-400 hover:text-rose-300 font-mono font-bold px-2 py-1 bg-rose-500/10 rounded-lg">Remove</button>
            </div>
          </div>
        `;
      }

      if (statusEl) statusEl.innerHTML = `<span class="text-emerald-400 font-mono text-[11px]">✓ Uploaded successfully</span>`;
      window.saveActiveDocument();
    };
    reader.readAsDataURL(file);
  };

  // Window File Removal Handler for Studio
  window.removeStudioFile = function(prefix) {
    document.getElementById(`${prefix}-field-fileurl`).value = '';
    document.getElementById(`${prefix}-field-filename`).value = '';
    document.getElementById(`${prefix}-field-filesize`).value = '';
    const previewBox = document.getElementById(`${prefix}-file-preview-box`);
    if (previewBox) {
      previewBox.innerHTML = `<span class="text-[10px] text-studio-muted font-mono block py-1">No direct file uploaded yet.</span>`;
    }
    const fileInput = document.getElementById(`${prefix}-file-input`);
    if (fileInput) fileInput.value = '';
    window.saveActiveDocument();
  };

  // Schema Form Definitions & Renderers
  const schemaRenderers = {
    // 🎨 Theme & Typography
    themeSettings: {
      title: '🎨 Theme Colors, Typography & Visuals',
      subtitle: "schemaType: 'themeSettings' • Master visual design engine",
      type: 'document',
      icon: 'palette',
      render: () => {
        const headingFont = localStorage.getItem('dss_font_heading') || "'Outfit', sans-serif";
        const bodyFont = localStorage.getItem('dss_font_body') || "'Plus Jakarta Sans', sans-serif";
        const bgCanvas = localStorage.getItem('dss_canvas_enabled') !== 'false';
        const canvasOpacity = localStorage.getItem('dss_canvas_opacity') || '75';

        return `
          <div class="space-y-6">
            <!-- Colors Block -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-[#262930] pb-3">
                <div>
                  <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Color Palette Engine</h3>
                  <p class="text-[11px] text-studio-muted mt-0.5">Control live accent colors, glowing highlights, and deep obsidian surface tones across every page.</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Primary Accent Color</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="field-accent-color-picker" onchange="syncColorInput('field-accent-color-picker', 'field-accent-color')" class="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-[#262930] p-0.5" value="${getColorVal('--color-accent-blue', '#0284c7')}">
                    <input type="text" id="field-accent-color" oninput="syncColorPicker('field-accent-color', 'field-accent-color-picker')" class="flex-1 bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-sanityRed focus:outline-none" value="${getColorVal('--color-accent-blue', '#0284c7')}">
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Light Sky Accent</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="field-sky-color-picker" onchange="syncColorInput('field-sky-color-picker', 'field-sky-color')" class="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-[#262930] p-0.5" value="${getColorVal('--color-accent-sky', '#38bdf8')}">
                    <input type="text" id="field-sky-color" oninput="syncColorPicker('field-sky-color', 'field-sky-color-picker')" class="flex-1 bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-sanityRed focus:outline-none" value="${getColorVal('--color-accent-sky', '#38bdf8')}">
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Obsidian Dark Background</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="field-bg-color-picker" onchange="syncColorInput('field-bg-color-picker', 'field-bg-color')" class="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-[#262930] p-0.5" value="${getColorVal('--color-obsidian', '#030712')}">
                    <input type="text" id="field-bg-color" oninput="syncColorPicker('field-bg-color', 'field-bg-color-picker')" class="flex-1 bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-sanityRed focus:outline-none" value="${getColorVal('--color-obsidian', '#030712')}">
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Card Surface Hex</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="field-surface-color-picker" onchange="syncColorInput('field-surface-color-picker', 'field-surface-color')" class="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-[#262930] p-0.5" value="${getColorVal('--color-surface', '#0f172a')}">
                    <input type="text" id="field-surface-color" oninput="syncColorPicker('field-surface-color', 'field-surface-color-picker')" class="flex-1 bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-sanityRed focus:outline-none" value="${getColorVal('--color-surface', '#0f172a')}">
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Default Theme Mode</label>
                  <select id="field-theme-mode" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sanityRed focus:outline-none">
                    <option value="dark" ${localStorage.getItem('dss_theme_mode') !== 'light' ? 'selected' : ''}>Dark Mode (Default Obsidian)</option>
                    <option value="light" ${localStorage.getItem('dss_theme_mode') === 'light' ? 'selected' : ''}>Light Mode</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Typography Block -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="border-b border-[#262930] pb-3">
                <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Typography & Font Engine</h3>
                <p class="text-[11px] text-studio-muted mt-0.5">Select high-performance Google Fonts for headings and body reading.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Heading Font Family</label>
                  <select id="field-font-heading-select" onchange="document.getElementById('field-font-heading').value = this.value" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none mb-2">
                    <option value="'Outfit', sans-serif" ${headingFont.includes('Outfit') ? 'selected' : ''}>Outfit (Modern Geometric - Default)</option>
                    <option value="'Space Grotesk', sans-serif" ${headingFont.includes('Space Grotesk') ? 'selected' : ''}>Space Grotesk (Tech & Cyber)</option>
                    <option value="'Syne', sans-serif" ${headingFont.includes('Syne') ? 'selected' : ''}>Syne (Artistic & Bold)</option>
                    <option value="'Inter', sans-serif" ${headingFont.includes('Inter') ? 'selected' : ''}>Inter (Clean Neo-Grotesque)</option>
                    <option value="'Poppins', sans-serif" ${headingFont.includes('Poppins') ? 'selected' : ''}>Poppins (Smooth Rounded)</option>
                    <option value="'Plus Jakarta Sans', sans-serif" ${headingFont.includes('Jakarta') ? 'selected' : ''}>Plus Jakarta Sans (Ultra Premium)</option>
                  </select>
                  <input type="text" id="field-font-heading" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 focus:border-sanityRed focus:outline-none" value="${escapeQuotes(headingFont)}">
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Body & UI Font Family</label>
                  <select id="field-font-body-select" onchange="document.getElementById('field-font-body').value = this.value" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none mb-2">
                    <option value="'Plus Jakarta Sans', sans-serif" ${bodyFont.includes('Jakarta') ? 'selected' : ''}>Plus Jakarta Sans (Default)</option>
                    <option value="'Inter', sans-serif" ${bodyFont.includes('Inter') ? 'selected' : ''}>Inter</option>
                    <option value="'Space Grotesk', sans-serif" ${bodyFont.includes('Space Grotesk') ? 'selected' : ''}>Space Grotesk</option>
                    <option value="'Poppins', sans-serif" ${bodyFont.includes('Poppins') ? 'selected' : ''}>Poppins</option>
                  </select>
                  <input type="text" id="field-font-body" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 focus:border-sanityRed focus:outline-none" value="${escapeQuotes(bodyFont)}">
                </div>
              </div>
            </div>

            <!-- Background Visuals Block -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="border-b border-[#262930] pb-3">
                <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">3D WebGL Background Canvas</h3>
                <p class="text-[11px] text-studio-muted mt-0.5">Control the interactive particle/quantum sphere background.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div class="flex items-center gap-3">
                  <input type="checkbox" id="field-canvas-enabled" class="w-4 h-4 text-sanityRed rounded bg-[#0e1013] border-[#262930]" ${bgCanvas ? 'checked' : ''}>
                  <label for="field-canvas-enabled" class="text-xs text-white font-medium">Enable 3D Background Canvas</label>
                </div>

                <div>
                  <div class="flex justify-between items-center text-[11px] font-mono text-studio-muted mb-1">
                    <span>Canvas Opacity</span>
                    <span id="canvas-opacity-val">${canvasOpacity}%</span>
                  </div>
                  <input type="range" id="field-canvas-opacity" min="10" max="100" value="${canvasOpacity}" oninput="document.getElementById('canvas-opacity-val').innerText = this.value + '%'" class="w-full accent-sanityRed bg-[#0e1013]">
                </div>
              </div>
            </div>

            <!-- Custom CSS Overrides -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-3">
              <div class="border-b border-[#262930] pb-2">
                <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Custom CSS Injection</h3>
                <p class="text-[11px] text-studio-muted mt-0.5">Inject direct custom CSS rules into all live website pages.</p>
              </div>
              <textarea id="field-custom-css" rows="4" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs font-mono text-emerald-400 focus:border-sanityRed focus:outline-none" placeholder="/* Example: .glass-panel { backdrop-filter: blur(30px); } */">${escapeQuotes(localStorage.getItem('dss_custom_css') || '')}</textarea>
            </div>
          </div>
        `;
      },
      save: () => {
        const accent = document.getElementById('field-accent-color').value;
        const sky = document.getElementById('field-sky-color').value;
        const bg = document.getElementById('field-bg-color').value;
        const surface = document.getElementById('field-surface-color').value;
        const mode = document.getElementById('field-theme-mode').value;
        const fontHeading = document.getElementById('field-font-heading').value;
        const fontBody = document.getElementById('field-font-body').value;
        const canvasEnabled = document.getElementById('field-canvas-enabled').checked;
        const canvasOpacity = document.getElementById('field-canvas-opacity').value;
        const customCss = document.getElementById('field-custom-css').value;

        localStorage.setItem('dss_color_accent', accent);
        localStorage.setItem('dss_color_sky', sky);
        localStorage.setItem('dss_color_bg', bg);
        localStorage.setItem('dss_color_surface', surface);
        localStorage.setItem('dss_theme_mode', mode);
        localStorage.setItem('dss_font_heading', fontHeading);
        localStorage.setItem('dss_font_body', fontBody);
        localStorage.setItem('dss_canvas_enabled', canvasEnabled);
        localStorage.setItem('dss_canvas_opacity', canvasOpacity);
        localStorage.setItem('dss_custom_css', customCss);

        if (syncChannel) {
          syncChannel.postMessage({
            type: 'THEME_UPDATED',
            payload: { accent, sky, bg, surface, mode, fontHeading, fontBody, canvasEnabled, canvasOpacity, customCss }
          });
        }
      }
    },

    // ⚙️ Global Site Branding & Header/Footer
    siteSettings: {
      title: '⚙️ Global Site Branding, Navigation & Social Links',
      subtitle: "schemaType: 'siteSettings' • Master identity, header links & footer configuration",
      type: 'document',
      icon: 'globe',
      render: () => {
        const logoImg = localStorage.getItem('dss_logo_image') || '';
        const defaultNav = [
          { label: 'Home', url: 'index.html', highlight: false },
          { label: 'About Us', url: 'about.html', highlight: false },
          { label: 'Opportunities', url: 'join.html', highlight: true },
          { label: 'Contact Us', url: 'contact.html', highlight: false }
        ];
        const navLinks = safeJSONParse('dss_nav_links', defaultNav);

        return `
          <div class="space-y-6">
            <!-- Brand Identity -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="border-b border-[#262930] pb-3">
                <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Brand Identity & Logo</h3>
                <p class="text-[11px] text-studio-muted mt-0.5">Define your society's name, tagline, SEO meta description, and logo image.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Site Name (Brand Title)</label>
                  <input type="text" id="field-site-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_site_title') || 'Data Science Society')}">
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Custom Logo Image URL (Optional)</label>
                  <div class="flex items-center gap-2">
                    <input type="url" id="field-logo-image" oninput="updateLogoPreview(this.value)" class="flex-1 bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" placeholder="https://example.com/logo.png" value="${escapeQuotes(logoImg)}">
                    <div id="logo-preview-box" class="w-10 h-10 rounded-xl bg-[#0e1013] border border-[#262930] flex items-center justify-center overflow-hidden">
                      ${logoImg ? `<img src="${logoImg}" class="w-full h-full object-contain">` : `<span class="text-[9px] text-studio-muted font-mono">SVG</span>`}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">SEO Meta Description</label>
                <textarea id="field-site-desc" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(localStorage.getItem('dss_site_desc') || 'Data Science Society (DSS) — Advancing Deep Learning, Quantum Neural Structures, and Open Science Computing.')}</textarea>
              </div>
            </div>

            <!-- Top Announcement Banner -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="border-b border-[#262930] pb-3">
                <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Top Notification Bar</h3>
                <p class="text-[11px] text-studio-muted mt-0.5">Show a dynamic announcement or launch bar across the top of all pages.</p>
              </div>

              <div class="flex items-center gap-3">
                <input type="checkbox" id="field-banner-active" class="w-4 h-4 text-sanityRed rounded bg-[#0e1013] border-[#262930]" ${localStorage.getItem('dss_banner_active') === 'true' ? 'checked' : ''}>
                <label for="field-banner-active" class="text-xs text-white font-medium">Display Announcement Banner</label>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Banner Message</label>
                  <input type="text" id="field-banner-text" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_banner_text') || '🚀 Applications for Fall 2026 AI Research Fellowships are now open!')}">
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Banner Action Link</label>
                  <input type="text" id="field-banner-link" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_banner_link') || 'join.html')}">
                </div>
              </div>
            </div>

            <!-- Footer & Social Links -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="border-b border-[#262930] pb-3">
                <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Footer Copyright, Headquarters & Socials</h3>
                <p class="text-[11px] text-studio-muted mt-0.5">Control contact metadata and official social profiles.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Footer Copyright Line</label>
                  <input type="text" id="field-footer-copyright" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_footer_copyright') || '© 2026 Data Science Society. All Rights Reserved.')}">
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Public Contact Email</label>
                  <input type="email" id="field-contact-email" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_contact_email') || 'contact@datasciencesociety.org')}">
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">GitHub Organization URL</label>
                  <input type="url" id="field-social-github" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-mono" value="${escapeQuotes(localStorage.getItem('dss_social_github') || 'https://github.com/datasciencesociety')}">
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Twitter / X URL</label>
                  <input type="url" id="field-social-x" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-mono" value="${escapeQuotes(localStorage.getItem('dss_social_x') || 'https://x.com/datasciencesoc')}">
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Discord / Community Server</label>
                  <input type="url" id="field-social-discord" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-mono" value="${escapeQuotes(localStorage.getItem('dss_social_discord') || 'https://discord.gg/datascience')}">
                </div>
              </div>
            </div>
          </div>
        `;
      },
      save: () => {
        const title = document.getElementById('field-site-title').value;
        const logoImg = document.getElementById('field-logo-image').value;
        const desc = document.getElementById('field-site-desc').value;
        const bannerActive = document.getElementById('field-banner-active').checked;
        const bannerText = document.getElementById('field-banner-text').value;
        const bannerLink = document.getElementById('field-banner-link').value;
        const copyright = document.getElementById('field-footer-copyright').value;
        const email = document.getElementById('field-contact-email').value;
        const github = document.getElementById('field-social-github').value;
        const x = document.getElementById('field-social-x').value;
        const discord = document.getElementById('field-social-discord').value;

        localStorage.setItem('dss_site_title', title);
        localStorage.setItem('dss_logo_image', logoImg);
        localStorage.setItem('dss_site_desc', desc);
        localStorage.setItem('dss_banner_active', bannerActive);
        localStorage.setItem('dss_banner_text', bannerText);
        localStorage.setItem('dss_banner_link', bannerLink);
        localStorage.setItem('dss_footer_copyright', copyright);
        localStorage.setItem('dss_contact_email', email);
        localStorage.setItem('dss_social_github', github);
        localStorage.setItem('dss_social_x', x);
        localStorage.setItem('dss_social_discord', discord);

        if (syncChannel) syncChannel.postMessage({ type: 'SETTINGS_UPDATED' });
      }
    },

    // 📢 Announcement Banners & Alerts
    bannerSettings: {
      title: '📢 Announcement Banners, Shapes & Placement Controls',
      subtitle: "schemaType: 'bannerSettings' • Control banner shapes (Box, Pill, Line), placement positions, page routes & glow animations",
      type: 'document',
      icon: 'megaphone',
      render: () => {
        const active = localStorage.getItem('dss_banner_active') !== 'false';
        const badge = localStorage.getItem('dss_banner_badge') || '⚡ HACKATHON';
        const text = localStorage.getItem('dss_banner_text') || 'Fall 2026 AI Hackathon Registration Open';
        const subtext = localStorage.getItem('dss_banner_subtext') || 'Join 500+ researchers and build frontier multi-agent AI systems.';
        const targetPage = localStorage.getItem('dss_banner_target_page') || 'events.html';
        const customUrl = localStorage.getItem('dss_banner_custom_url') || '';
        const cta = localStorage.getItem('dss_banner_cta') || 'Click to Register →';
        const shape = localStorage.getItem('dss_banner_shape') || 'box-card';
        const position = localStorage.getItem('dss_banner_position') || 'bottom-left';
        const animation = localStorage.getItem('dss_banner_animation') || 'float-pulse';
        const gradient = localStorage.getItem('dss_banner_gradient') || 'sky-indigo';

        setTimeout(() => { if (typeof window.renderBannerMockup === 'function') window.renderBannerMockup(); }, 50);

        return `
          <div class="space-y-6">
            <!-- Live Banner Preview Card -->
            <div class="p-5 bg-gradient-to-r from-[#141619] to-[#1a1d24] border border-[#262930] rounded-2xl space-y-3">
              <div class="flex items-center justify-between border-b border-[#262930] pb-2">
                <span class="text-[11px] font-mono uppercase tracking-wider text-studio-muted font-bold flex items-center gap-1.5">
                  <i data-lucide="eye" class="w-3.5 h-3.5 text-sky-400"></i>
                  Live Interactive Banner Preview
                </span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  ${active ? 'ACTIVE ON WEBSITE' : 'MUTED'}
                </span>
              </div>

              <!-- Preview container -->
              <div class="p-4 bg-[#0e1013] border border-[#262930] rounded-xl flex items-center justify-center min-h-[140px] relative overflow-hidden">
                <div id="banner-live-mockup" class="w-full flex items-center justify-center">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

            <!-- Shape & Placement Controls -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="border-b border-[#262930] pb-3 flex items-center justify-between">
                <div>
                  <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Shape, Placement & Display Format</h3>
                  <p class="text-[11px] text-studio-muted mt-0.5">Select visual shape (Box Card, Pill Capsule, Line Streamer) and screen anchor.</p>
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="field-banner-active" onchange="renderBannerMockup()" class="w-4 h-4 text-sanityRed rounded bg-[#0e1013] border-[#262930]" ${active ? 'checked' : ''}>
                  <label for="field-banner-active" class="text-xs text-white font-bold cursor-pointer">Enable Banner</label>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">1. Banner Shape</label>
                  <select id="field-banner-shape" onchange="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sanityRed focus:outline-none font-semibold">
                    <option value="box-card" ${shape === 'box-card' ? 'selected' : ''}>📦 Box Shape (Rich Card Box)</option>
                    <option value="pill-capsule" ${shape === 'pill-capsule' ? 'selected' : ''}>💊 Capsule / Pill Shape (Single-Line Compact)</option>
                    <option value="line-streamer" ${shape === 'line-streamer' ? 'selected' : ''}>〰️ Line Streamer (Flowing Particle Line)</option>
                    <option value="bar-header" ${shape === 'bar-header' ? 'selected' : ''}>📌 Full-Width Pinned Bar</option>
                    <option value="corner-ribbon" ${shape === 'corner-ribbon' ? 'selected' : ''}>📐 Corner Origami Ribbon</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">2. Screen Placement</label>
                  <select id="field-banner-position" onchange="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sanityRed focus:outline-none font-semibold">
                    <option value="bottom-left" ${position === 'bottom-left' ? 'selected' : ''}>↙️ Bottom Left (Floating)</option>
                    <option value="bottom-right" ${position === 'bottom-right' ? 'selected' : ''}>↘️ Bottom Right (Floating)</option>
                    <option value="top-left" ${position === 'top-left' ? 'selected' : ''}>↖️ Top Left (Floating below nav)</option>
                    <option value="top-right" ${position === 'top-right' ? 'selected' : ''}>↗️ Top Right (Floating below nav)</option>
                    <option value="bottom-center" ${position === 'bottom-center' ? 'selected' : ''}>⬇️ Bottom Center (Floating Dock)</option>
                    <option value="top-center" ${position === 'top-center' ? 'selected' : ''}>⬆️ Top Center (Floating Dock)</option>
                    <option value="top-bar" ${position === 'top-bar' ? 'selected' : ''}>🔝 Top Header (Pinned full width)</option>
                    <option value="bottom-bar" ${position === 'bottom-bar' ? 'selected' : ''}>🔚 Bottom Footer (Pinned full width)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">3. Motion Dynamics</label>
                  <select id="field-banner-animation" onchange="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sanityRed focus:outline-none font-semibold">
                    <option value="float-pulse" ${animation === 'float-pulse' ? 'selected' : ''}>✨ Floating Hover + Pulsing Glow</option>
                    <option value="flow-rtl" ${animation === 'flow-rtl' ? 'selected' : ''}>🌊 Flowing Particle Streamer (Right-to-Left)</option>
                    <option value="flow-ltr" ${animation === 'flow-ltr' ? 'selected' : ''}>🏄 Flowing Particle Streamer (Left-to-Right)</option>
                    <option value="slide-in" ${animation === 'slide-in' ? 'selected' : ''}>🚀 Smooth Slide-In from Edge</option>
                    <option value="bounce-subtle" ${animation === 'bounce-subtle' ? 'selected' : ''}>🎯 Subtle Attention Bounce</option>
                    <option value="static-glass" ${animation === 'static-glass' ? 'selected' : ''}>🧊 Static Frosted Glass (No motion)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Content & Page Routing Configuration -->
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="border-b border-[#262930] pb-3">
                <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Banner Content, Badges & Destination Links</h3>
                <p class="text-[11px] text-studio-muted mt-0.5">Customize the text message, badge tag, action button and target destination page.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Badge Tag Text</label>
                  <input type="text" id="field-banner-badge" oninput="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(badge)}" placeholder="⚡ HACKATHON">
                </div>

                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Call-To-Action Button Label</label>
                  <input type="text" id="field-banner-cta" oninput="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(cta)}" placeholder="Click to Register →">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Main Headline Title</label>
                <input type="text" id="field-banner-text" oninput="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(text)}" placeholder="Fall 2026 AI Hackathon Registration Open">
              </div>

              <div>
                <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Secondary Subtext / Description (Shown prominently in Box shape)</label>
                <input type="text" id="field-banner-subtext" oninput="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:border-sanityRed focus:outline-none" value="${escapeQuotes(subtext)}" placeholder="Join 500+ researchers and build frontier multi-agent AI systems.">
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Connect with Target Page</label>
                  <select id="field-banner-target-page" onchange="toggleCustomUrlField(this.value); renderBannerMockup();" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none">
                    <option value="events.html" ${targetPage === 'events.html' ? 'selected' : ''}>🎯 Events & Hackathons (events.html)</option>
                    <option value="join.html" ${targetPage === 'join.html' ? 'selected' : ''}>🚀 Membership & Fellowships (join.html)</option>
                    <option value="login.html" ${targetPage === 'login.html' ? 'selected' : ''}>🔐 Member Portal Login (login.html)</option>
                    <option value="research.html" ${targetPage === 'research.html' ? 'selected' : ''}>📄 Academic Research (research.html)</option>
                    <option value="projects.html" ${targetPage === 'projects.html' ? 'selected' : ''}>💻 Code Repositories (projects.html)</option>
                    <option value="blog.html" ${targetPage === 'blog.html' ? 'selected' : ''}>📰 Society Blog & News (blog.html)</option>
                    <option value="resources.html" ${targetPage === 'resources.html' ? 'selected' : ''}>📚 Learning Resources (resources.html)</option>
                    <option value="about.html" ${targetPage === 'about.html' ? 'selected' : ''}>🌐 About Us (about.html)</option>
                    <option value="contact.html" ${targetPage === 'contact.html' ? 'selected' : ''}>✉️ Contact Us (contact.html)</option>
                    <option value="custom" ${targetPage === 'custom' ? 'selected' : ''}>🔗 Custom External Link...</option>
                  </select>
                </div>

                <div id="custom-url-container" class="${targetPage === 'custom' ? '' : 'hidden'}">
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Custom External URL</label>
                  <input type="url" id="field-banner-custom-url" oninput="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-mono" placeholder="https://..." value="${escapeQuotes(customUrl)}">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Color Accent & Glow Theme</label>
                <select id="field-banner-gradient" onchange="renderBannerMockup()" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none">
                  <option value="sky-indigo" ${gradient === 'sky-indigo' ? 'selected' : ''}>Electric Sky & Deep Indigo (Default)</option>
                  <option value="emerald-teal" ${gradient === 'emerald-teal' ? 'selected' : ''}>Cyber Emerald & Neon Teal</option>
                  <option value="amber-rose" ${gradient === 'amber-rose' ? 'selected' : ''}>Solar Amber & Flame Rose</option>
                  <option value="purple-cyan" ${gradient === 'purple-cyan' ? 'selected' : ''}>Violet Amethyst & Cyan Pulse</option>
                  <option value="monochrome-gold" ${gradient === 'monochrome-gold' ? 'selected' : ''}>Monochrome Gold & Obsidian</option>
                </select>
              </div>
            </div>
          </div>
        `;
      },
      save: () => {
        const active = document.getElementById('field-banner-active').checked;
        const badge = document.getElementById('field-banner-badge').value;
        const text = document.getElementById('field-banner-text').value;
        const subtext = document.getElementById('field-banner-subtext') ? document.getElementById('field-banner-subtext').value : '';
        const targetPage = document.getElementById('field-banner-target-page').value;
        const customUrl = document.getElementById('field-banner-custom-url') ? document.getElementById('field-banner-custom-url').value : '';
        const cta = document.getElementById('field-banner-cta').value;
        const shape = document.getElementById('field-banner-shape').value;
        const position = document.getElementById('field-banner-position').value;
        const animation = document.getElementById('field-banner-animation').value;
        const gradient = document.getElementById('field-banner-gradient').value;

        localStorage.setItem('dss_banner_active', active);
        localStorage.setItem('dss_banner_badge', badge);
        localStorage.setItem('dss_banner_text', text);
        localStorage.setItem('dss_banner_subtext', subtext);
        localStorage.setItem('dss_banner_target_page', targetPage);
        localStorage.setItem('dss_banner_custom_url', customUrl);
        localStorage.setItem('dss_banner_cta', cta);
        localStorage.setItem('dss_banner_shape', shape);
        localStorage.setItem('dss_banner_position', position);
        localStorage.setItem('dss_banner_animation', animation);
        localStorage.setItem('dss_banner_gradient', gradient);

        const finalLink = targetPage === 'custom' && customUrl ? customUrl : targetPage;
        localStorage.setItem('dss_banner_link', finalLink);

        const badgeEl = document.getElementById('badge-banner-status');
        if (badgeEl) {
          badgeEl.textContent = active ? 'LIVE' : 'OFF';
          badgeEl.className = active 
            ? 'text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold'
            : 'text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-700/40 text-zinc-400 font-bold';
        }

        if (typeof window.syncToApiServer === 'function') {
          window.syncToApiServer();
        }

        if (syncChannel) {
          syncChannel.postMessage({
            type: 'BANNER_UPDATED',
            payload: { active, badge, text, subtext, targetPage, customUrl, cta, shape, position, animation, gradient, finalLink }
          });
        }
      }
    },

    // 🏠 Homepage Hero & Headings
    heroSection: {
      title: '🏠 Homepage Hero & CTA Buttons',
      subtitle: "schemaType: 'heroSection' • Primary banner headline and call to actions",
      type: 'document',
      icon: 'sparkles',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Main Hero Heading & Copy</h3>
              <p class="text-[11px] text-studio-muted mt-0.5">The first headline users see on http://localhost:3000.</p>
            </div>

            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Hero Main Title (H1)</label>
              <input type="text" id="field-hero-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_home_hero_title') || 'Computing The Infinite Future.')}">
            </div>

            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Hero Subtitle / Description</label>
              <textarea id="field-hero-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_home_hero_desc') || 'Advancing the frontier of deep representation learning, quantum neural structures, and artificial intelligence to resolve complex global challenges.')}</textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="p-3 bg-[#1a1c22] rounded-xl border border-[#262930] space-y-2">
                <span class="text-[10px] font-mono text-sky-400 font-bold uppercase">Primary Button</span>
                <input type="text" id="field-hero-btn1-text" class="w-full bg-[#0e1013] border border-[#262930] rounded-lg px-3 py-1.5 text-xs text-white" placeholder="Label" value="${escapeQuotes(localStorage.getItem('dss_hero_btn1_text') || 'Apply For Membership')}">
                <input type="text" id="field-hero-btn1-link" class="w-full bg-[#0e1013] border border-[#262930] rounded-lg px-3 py-1.5 text-xs text-white font-mono" placeholder="Link URL" value="${escapeQuotes(localStorage.getItem('dss_hero_btn1_link') || 'join.html')}">
              </div>

              <div class="p-3 bg-[#1a1c22] rounded-xl border border-[#262930] space-y-2">
                <span class="text-[10px] font-mono text-purple-400 font-bold uppercase">Secondary Button</span>
                <input type="text" id="field-hero-btn2-text" class="w-full bg-[#0e1013] border border-[#262930] rounded-lg px-3 py-1.5 text-xs text-white" placeholder="Label" value="${escapeQuotes(localStorage.getItem('dss_hero_btn2_text') || 'Explore About Us')}">
                <input type="text" id="field-hero-btn2-link" class="w-full bg-[#0e1013] border border-[#262930] rounded-lg px-3 py-1.5 text-xs text-white font-mono" placeholder="Link URL" value="${escapeQuotes(localStorage.getItem('dss_hero_btn2_link') || 'about.html')}">
              </div>
            </div>
          </div>
        </div>
      `,
      save: () => {
        const title = document.getElementById('field-hero-title').value;
        const desc = document.getElementById('field-hero-desc').value;
        const btn1Text = document.getElementById('field-hero-btn1-text').value;
        const btn1Link = document.getElementById('field-hero-btn1-link').value;
        const btn2Text = document.getElementById('field-hero-btn2-text').value;
        const btn2Link = document.getElementById('field-hero-btn2-link').value;

        localStorage.setItem('dss_home_hero_title', title);
        localStorage.setItem('dss_home_hero_desc', desc);
        localStorage.setItem('dss_hero_btn1_text', btn1Text);
        localStorage.setItem('dss_hero_btn1_link', btn1Link);
        localStorage.setItem('dss_hero_btn2_text', btn2Text);
        localStorage.setItem('dss_hero_btn2_link', btn2Link);

        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 🛡️ Mission, Vision & Pillars
    missionVision: {
      title: '🛡️ Core Value Pillars (Mission, Vision, Values)',
      subtitle: "schemaType: 'missionVision' • Three featured pillar cards on Homepage",
      type: 'document',
      icon: 'shield',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Pillar 1: Academic Synergy</h3>
              <p class="text-[11px] text-studio-muted mt-0.5">Card 1 title & statement.</p>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Title</label>
              <input type="text" id="field-pillar1-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_pillar1_title') || 'Academic Synergy')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Statement Description</label>
              <textarea id="field-pillar1-desc" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(localStorage.getItem('dss_home_mission') || 'Bridging academia and enterprise, DSS coordinates computing infrastructure to accelerate foundational AI modeling.')}</textarea>
            </div>
          </div>

          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Pillar 2: Decentralized AI</h3>
              <p class="text-[11px] text-studio-muted mt-0.5">Card 2 title & statement.</p>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Title</label>
              <input type="text" id="field-pillar2-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_pillar2_title') || 'Decentralized AI')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Statement Description</label>
              <textarea id="field-pillar2-desc" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(localStorage.getItem('dss_home_vision') || 'Structuring open science research blocks that offer decentralized datasets and high-performance tensor computing pipelines.')}</textarea>
            </div>
          </div>

          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Pillar 3: Open Access</h3>
              <p class="text-[11px] text-studio-muted mt-0.5">Card 3 title & statement.</p>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Title</label>
              <input type="text" id="field-pillar3-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_pillar3_title') || 'Open Access')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Statement Description</label>
              <textarea id="field-pillar3-desc" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(localStorage.getItem('dss_home_values') || 'Providing royalty-free models, preprints, and open source gym environments to support developers worldwide.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_pillar1_title', document.getElementById('field-pillar1-title').value);
        localStorage.setItem('dss_home_mission', document.getElementById('field-pillar1-desc').value);
        localStorage.setItem('dss_pillar2_title', document.getElementById('field-pillar2-title').value);
        localStorage.setItem('dss_home_vision', document.getElementById('field-pillar2-desc').value);
        localStorage.setItem('dss_pillar3_title', document.getElementById('field-pillar3-title').value);
        localStorage.setItem('dss_home_values', document.getElementById('field-pillar3-desc').value);

        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📢 Sponsored Campaign / Ad Banner
    adBanner: {
      title: '📢 Sponsored Campaign & Ad Banner',
      subtitle: "schemaType: 'advertisement' • Dynamic homepage promotional card",
      type: 'document',
      icon: 'megaphone',
      render: () => {
        const ad = safeJSONParse('dss_advertisement', {
          active: true,
          headline: 'Accelerate Your AI Inference on HyperScale GPU Clusters',
          desc: 'Sponsored by CloudCompute Labs. Experience sub-millisecond transformer inference with enterprise SLA.',
          sponsor: 'CloudCompute Labs',
          btnText: 'Claim Free GPU Credits',
          btnLink: '#'
        });
        return `
          <div class="space-y-6">
            <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
              <div class="flex items-center gap-3">
                <input type="checkbox" id="field-ad-active" class="w-4 h-4 text-sanityRed rounded bg-[#0e1013] border-[#262930]" ${ad.active !== false ? 'checked' : ''}>
                <label for="field-ad-active" class="text-xs text-white font-medium">Display Campaign Banner on Homepage</label>
              </div>

              <div>
                <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Headline</label>
                <input type="text" id="field-ad-headline" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(ad.headline)}">
              </div>

              <div>
                <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Description</label>
                <textarea id="field-ad-desc" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(ad.desc)}</textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Sponsor Name</label>
                  <input type="text" id="field-ad-sponsor" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(ad.sponsor)}">
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Button Text</label>
                  <input type="text" id="field-ad-btn" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(ad.btnText)}">
                </div>
                <div>
                  <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Button Destination Link</label>
                  <input type="text" id="field-ad-btn-link" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-mono" value="${escapeQuotes(ad.btnLink || '#')}">
                </div>
              </div>
            </div>
          </div>
        `;
      },
      save: () => {
        const adObj = {
          active: document.getElementById('field-ad-active').checked,
          headline: document.getElementById('field-ad-headline').value,
          desc: document.getElementById('field-ad-desc').value,
          sponsor: document.getElementById('field-ad-sponsor').value,
          btnText: document.getElementById('field-ad-btn').value,
          btnLink: document.getElementById('field-ad-btn-link').value,
        };
        localStorage.setItem('dss_advertisement', JSON.stringify(adObj));
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: About Us
    pageAbout: {
      title: '📄 About Us Page Copy & Story',
      subtitle: "schemaType: 'pageAbout' • Edit about.html headings & story",
      type: 'document',
      icon: 'file-text',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">About Us Hero & Overview</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-about-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_about_title') || 'Our Purpose & Origins')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Introductory Paragraph</label>
              <textarea id="field-about-intro" rows="4" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_about_intro') || 'Data Science Society was created to bring students, researchers, and developers together to build powerful AI models, learn cutting-edge technology, and solve real-world problems through open collaboration.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_about_title', document.getElementById('field-about-title').value);
        localStorage.setItem('dss_about_intro', document.getElementById('field-about-intro').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Research
    pageResearch: {
      title: '📄 Research Page Copy & Headings',
      subtitle: "schemaType: 'pageResearch' • Edit research.html headings",
      type: 'document',
      icon: 'microscope',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Research Page Header</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-research-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_research_title') || 'Academic Research & Preprints')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Subtitle Description</label>
              <textarea id="field-research-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_research_desc') || 'Open access publications, mathematical preprints, and foundational models developed in collaboration with global university labs.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_research_title', document.getElementById('field-research-title').value);
        localStorage.setItem('dss_research_desc', document.getElementById('field-research-desc').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Projects
    pageProjects: {
      title: '📄 Projects Page Copy & Repos',
      subtitle: "schemaType: 'pageProjects' • Edit projects.html headings",
      type: 'document',
      icon: 'folder-git-2',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Projects Page Header</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-projects-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_projects_title') || 'Code Repositories & Tools')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Subtitle Description</label>
              <textarea id="field-projects-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_projects_desc') || 'Explore production-grade open source tools, PyTorch model implementations, and edge execution frameworks maintained by society contributors.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_projects_title', document.getElementById('field-projects-title').value);
        localStorage.setItem('dss_projects_desc', document.getElementById('field-projects-desc').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Blog
    pageBlog: {
      title: '📄 Blog Page Copy & Articles',
      subtitle: "schemaType: 'pageBlog' • Edit blog.html headings",
      type: 'document',
      icon: 'newspaper',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Blog Page Header</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-blog-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_blog_title') || 'Society Insights & Dispatches')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Subtitle Description</label>
              <textarea id="field-blog-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_blog_desc') || 'Read regular technical dispatches, system reviews, and algorithmic breakdowns authored by our research fellows.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_blog_title', document.getElementById('field-blog-title').value);
        localStorage.setItem('dss_blog_desc', document.getElementById('field-blog-desc').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Events
    pageEvents: {
      title: '📄 Events Page Copy & Hackathons',
      subtitle: "schemaType: 'pageEvents' • Edit events.html headings",
      type: 'document',
      icon: 'calendar',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Events Page Header</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-events-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_events_title') || 'Global Events & Hackathons')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Subtitle Description</label>
              <textarea id="field-events-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_events_desc') || "Participate in virtual workshops, competitive AI coding hackathons, and regional conferences hosted by the society's research units.")}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_events_title', document.getElementById('field-events-title').value);
        localStorage.setItem('dss_events_desc', document.getElementById('field-events-desc').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Resources
    pageResources: {
      title: '📄 Resources Page Copy & Handbooks',
      subtitle: "schemaType: 'pageResources' • Edit resources.html headings",
      type: 'document',
      icon: 'library',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Resources Page Header</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-resources-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_resources_title') || 'Curated Resources & Handbooks')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Subtitle Description</label>
              <textarea id="field-resources-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_resources_desc') || 'Curated deep learning curricula, interactive simulation notebooks, mathematical cheatsheets, and framework guides.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_resources_title', document.getElementById('field-resources-title').value);
        localStorage.setItem('dss_resources_desc', document.getElementById('field-resources-desc').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Opportunities / Join
    pageJoin: {
      title: '📄 Opportunities / Join Page Copy',
      subtitle: "schemaType: 'pageJoin' • Edit join.html headings & benefits",
      type: 'document',
      icon: 'user-plus',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Join Page Header & Benefits</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-join-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_join_title') || 'Become A Member')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Subtitle / Pitch</label>
              <textarea id="field-join-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(localStorage.getItem('dss_join_desc') || 'Gain priority access to our compute clusters, research preprints, hackathons, and global mentor network.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_join_title', document.getElementById('field-join-title').value);
        localStorage.setItem('dss_join_desc', document.getElementById('field-join-desc').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Contact
    pageContact: {
      title: '📄 Contact Page Information & Headings',
      subtitle: "schemaType: 'pageContact' • Edit contact.html address & email",
      type: 'document',
      icon: 'mail',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Contact Page Headings & Details</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Page Title (H1)</label>
              <input type="text" id="field-contact-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(localStorage.getItem('dss_contact_title') || 'Direct Inquiries & Headquarters')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Headquarters Physical Address</label>
              <input type="text" id="field-contact-address" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_contact_address') || '100 Innovation Parkway, Suite 400, Tech Campus, NY 10001')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Official Contact Email</label>
              <input type="email" id="field-contact-email" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(localStorage.getItem('dss_contact_email') || 'contact@datasciencesociety.org')}">
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_contact_title', document.getElementById('field-contact-title').value);
        localStorage.setItem('dss_contact_address', document.getElementById('field-contact-address').value);
        localStorage.setItem('dss_contact_email', document.getElementById('field-contact-email').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 📄 Page Content: Community Protocols
    pageCommunity: {
      title: '📄 Community Protocols & Standards',
      subtitle: "schemaType: 'pageCommunity' • Edit 3 society governance protocols",
      type: 'document',
      icon: 'file-check-2',
      render: () => `
        <div class="space-y-6">
          <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl space-y-4">
            <div class="border-b border-[#262930] pb-3">
              <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">3 Core Governance Protocols</h3>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Protocol 1 (Open Source Licensing)</label>
              <textarea id="field-proto1" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(localStorage.getItem('dss_community_proto1') || 'DSS forums and repositories welcome open source code contributions under strict Apache 2.0 or MIT licensing terms.')}</textarea>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Protocol 2 (Compute Allocation)</label>
              <textarea id="field-proto2" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(localStorage.getItem('dss_community_proto2') || 'Fellowship requests and compute resource allocation applications are peer-reviewed quarterly by our leadership board.')}</textarea>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Protocol 3 (Academic Summits)</label>
              <textarea id="field-proto3" rows="2" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none">${escapeQuotes(localStorage.getItem('dss_community_proto3') || 'All local university chapters coordinate summits following standard academic safety and validation guidelines.')}</textarea>
            </div>
          </div>
        </div>
      `,
      save: () => {
        localStorage.setItem('dss_community_proto1', document.getElementById('field-proto1').value);
        localStorage.setItem('dss_community_proto2', document.getElementById('field-proto2').value);
        localStorage.setItem('dss_community_proto3', document.getElementById('field-proto3').value);
        if (syncChannel) syncChannel.postMessage({ type: 'CONTENT_UPDATED' });
      }
    },

    // 👥 Team & Leadership Directory Collection
    teamList: {
      title: '👥 Team & Leadership Directory',
      subtitle: "schemaType: 'teamMember' • Manage Executive, Director & Subteam members",
      type: 'collection',
      storageKey: 'dss_team',
      icon: 'users',
      renderItemCard: (item) => `
        <div class="flex items-center gap-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'}" class="w-10 h-10 rounded-xl object-cover border border-[#262930]">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white truncate">${escapeHTML(item.name)}</span>
              <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#262930] text-sky-300 uppercase">${escapeHTML(item.category || 'executive')}</span>
            </div>
            <p class="text-[11px] font-mono text-accentBlue truncate">${escapeHTML(item.role)}</p>
          </div>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Full Name</label>
              <input type="text" id="team-field-name" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(item?.name || '')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Team Category</label>
              <select id="team-field-category" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none">
                <option value="executive" ${item?.category === 'executive' ? 'selected' : ''}>Executive Board</option>
                <option value="director" ${item?.category === 'director' ? 'selected' : ''}>Directorate</option>
                <option value="subteam" ${item?.category === 'subteam' ? 'selected' : ''}>Subteams & Squads</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Official Role / Title</label>
              <input type="text" id="team-field-role" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(item?.role || '')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Funny Tagline / Personality Role</label>
              <input type="text" id="team-field-funny" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(item?.funnyRole || '')}">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Holographic Badge Label</label>
              <input type="text" id="team-field-badge" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none uppercase font-mono" value="${escapeQuotes(item?.badge || '')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Profile Photo URL</label>
              <div class="flex items-center gap-2">
                <input type="url" id="team-field-image" oninput="updateItemImagePreview(this.value, 'team-img-preview')" class="flex-1 bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(item?.image || '')}">
                <img id="team-img-preview" src="${item?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'}" class="w-9 h-9 rounded-xl object-cover border border-[#262930]">
              </div>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Bio / Description</label>
            <textarea id="team-field-bio" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(item?.bio || '')}</textarea>
          </div>
        </div>
      `,
      getFormData: () => ({
        name: document.getElementById('team-field-name').value,
        category: document.getElementById('team-field-category').value,
        role: document.getElementById('team-field-role').value,
        funnyRole: document.getElementById('team-field-funny').value,
        badge: document.getElementById('team-field-badge').value,
        image: document.getElementById('team-field-image').value,
        bio: document.getElementById('team-field-bio').value
      })
    },

    // 📰 Blog Articles Collection
    postsList: {
      title: '📰 Blog Articles & Dispatches',
      subtitle: "schemaType: 'post' • Technical dispatches, tutorials & supplementary files",
      type: 'collection',
      storageKey: 'dss_blogs',
      icon: 'edit-3',
      renderItemCard: (item) => `
        <div class="flex items-center gap-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&q=80'}" class="w-10 h-10 rounded-xl object-cover border border-[#262930]">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white truncate">${escapeHTML(item.title)}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              <span class="text-[10px] font-mono text-studio-muted">${escapeHTML(item.tag)} • ${escapeHTML(item.date)}</span>
              ${item.fileUrl ? '<span class="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">📁 File</span>' : ''}
              ${item.link ? '<span class="text-[9px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30">🔗 Link</span>' : ''}
              ${item.requiresAuth !== false ? '<span class="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">🔒 Member Gate</span>' : ''}
            </div>
          </div>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Article Title</label>
            <input type="text" id="post-field-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(item?.title || '')}">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Category Tag</label>
              <input type="text" id="post-field-tag" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white uppercase font-mono" value="${escapeQuotes(item?.tag || 'DEEP LEARNING')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Author</label>
              <input type="text" id="post-field-author" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white uppercase font-mono" value="${escapeQuotes(item?.author || 'DR. AISHA VANCE')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Publication Date</label>
              <input type="text" id="post-field-date" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white uppercase font-mono" value="${escapeQuotes(item?.date || 'DEC 2026')}">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Cover Image URL</label>
            <div class="flex items-center gap-2">
              <input type="url" id="post-field-image" oninput="updateItemImagePreview(this.value, 'post-img-preview')" class="flex-1 bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none" value="${escapeQuotes(item?.image || 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&q=80')}">
              <img id="post-img-preview" src="${item?.image || 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&q=80'}" class="w-9 h-9 rounded-xl object-cover border border-[#262930]">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Excerpt / Abstract</label>
            <textarea id="post-field-excerpt" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(item?.excerpt || '')}</textarea>
          </div>

          <!-- Dual Mode: External Link and/or Direct File Upload -->
          ${renderLinkAndFileUploadEngine({
            prefix: 'post',
            link: item?.link || '',
            fileUrl: item?.fileUrl || '',
            fileName: item?.fileName || '',
            fileSize: item?.fileSize || '',
            requiresAuth: item?.requiresAuth !== false,
            linkLabel: 'Article Reference Web Link / External Source',
            linkPlaceholder: 'https://medium.com/... or https://arxiv.org/...',
            fileLabel: 'Upload Article Supplementary PDF / Codebook',
            fileHelp: 'Upload PDF report, cheatsheet, or notebook'
          })}
        </div>
      `,
      getFormData: () => ({
        title: document.getElementById('post-field-title').value,
        tag: document.getElementById('post-field-tag').value,
        author: document.getElementById('post-field-author').value,
        date: document.getElementById('post-field-date').value,
        image: document.getElementById('post-field-image').value,
        excerpt: document.getElementById('post-field-excerpt').value,
        link: document.getElementById('post-field-link')?.value || '',
        fileUrl: document.getElementById('post-field-fileurl')?.value || '',
        fileName: document.getElementById('post-field-filename')?.value || '',
        fileSize: document.getElementById('post-field-filesize')?.value || '',
        requiresAuth: document.getElementById('post-field-requires-auth') ? document.getElementById('post-field-requires-auth').checked : true
      })
    },

    // 📚 Research Papers Collection
    papersList: {
      title: '📚 Research Papers & Preprints',
      subtitle: "schemaType: 'researchPaper' • Peer-reviewed papers, arXiv preprints & PDF uploads",
      type: 'collection',
      storageKey: 'dss_papers',
      icon: 'book-open',
      renderItemCard: (item) => `
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-mono text-accentBlue font-bold uppercase block">${escapeHTML(item.journal || 'Journal')}</span>
            <div class="flex items-center gap-1">
              ${item.fileUrl ? '<span class="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">📁 PDF</span>' : ''}
              ${item.link && item.link !== '#' ? '<span class="text-[9px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30">🔗 Link</span>' : ''}
              ${item.requiresAuth !== false ? '<span class="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">🔒 Auth Gate</span>' : ''}
            </div>
          </div>
          <h4 class="text-xs font-bold text-white truncate mt-0.5">${escapeHTML(item.title)}</h4>
          <p class="text-[10px] text-studio-muted truncate font-mono">${escapeHTML(item.authors || '')}</p>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Paper Title</label>
            <input type="text" id="paper-field-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(item?.title || '')}">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Authors</label>
              <input type="text" id="paper-field-authors" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white" value="${escapeQuotes(item?.authors || '')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Journal / Conference Venue</label>
              <input type="text" id="paper-field-journal" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white font-mono" value="${escapeQuotes(item?.journal || '')}">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Abstract / Summary</label>
            <textarea id="paper-field-excerpt" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(item?.excerpt || '')}</textarea>
          </div>

          <!-- Dual Mode: External DOI/arXiv Link and/or Direct PDF File Upload -->
          ${renderLinkAndFileUploadEngine({
            prefix: 'paper',
            link: item?.link || '',
            fileUrl: item?.fileUrl || '',
            fileName: item?.fileName || '',
            fileSize: item?.fileSize || '',
            requiresAuth: item?.requiresAuth !== false,
            linkLabel: 'External DOI / arXiv / IEEE Webpage Link',
            linkPlaceholder: 'https://arxiv.org/abs/... or https://doi.org/...',
            fileLabel: 'Direct Research Paper Preprint PDF Upload',
            fileHelp: 'Upload official preprint PDF or publication manuscript'
          })}
        </div>
      `,
      getFormData: () => ({
        title: document.getElementById('paper-field-title').value,
        authors: document.getElementById('paper-field-authors').value,
        journal: document.getElementById('paper-field-journal').value,
        excerpt: document.getElementById('paper-field-excerpt').value,
        link: document.getElementById('paper-field-link')?.value || '',
        fileUrl: document.getElementById('paper-field-fileurl')?.value || '',
        fileName: document.getElementById('paper-field-filename')?.value || '',
        fileSize: document.getElementById('paper-field-filesize')?.value || '',
        requiresAuth: document.getElementById('paper-field-requires-auth') ? document.getElementById('paper-field-requires-auth').checked : true
      })
    },

    // 📅 Events Collection
    eventsList: {
      title: '📅 Events & Hackathons',
      subtitle: "schemaType: 'event' • Upcoming summits, hackathons & registration links",
      type: 'collection',
      storageKey: 'dss_events',
      icon: 'calendar',
      renderItemCard: (item) => `
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 font-bold uppercase">${escapeHTML(item.type || 'Workshop')}</span>
            <div class="flex items-center gap-1">
              ${item.fileUrl ? '<span class="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">📁 File</span>' : ''}
              ${item.link ? '<span class="text-[9px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30">🔗 Link</span>' : ''}
              ${item.requiresAuth !== false ? '<span class="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">🔒 Gate</span>' : ''}
            </div>
          </div>
          <h4 class="text-xs font-bold text-white truncate mt-1">${escapeHTML(item.title)}</h4>
          <p class="text-[10px] text-studio-muted truncate font-mono">${escapeHTML(item.loc || '')} • ${escapeHTML(item.date || '')}</p>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Event Title</label>
            <input type="text" id="event-field-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(item?.title || '')}">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Event Type</label>
              <select id="event-field-type" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none">
                <option value="Workshop" ${item?.type === 'Workshop' ? 'selected' : ''}>Workshop</option>
                <option value="Hackathon" ${item?.type === 'Hackathon' ? 'selected' : ''}>Hackathon</option>
                <option value="Conference" ${item?.type === 'Conference' ? 'selected' : ''}>Conference</option>
                <option value="Symposium" ${item?.type === 'Symposium' ? 'selected' : ''}>Symposium</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Date & Time</label>
              <input type="text" id="event-field-date" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white font-mono" value="${escapeQuotes(item?.date || 'Nov 15, 2026')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Location / Venue</label>
              <input type="text" id="event-field-loc" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white font-mono" value="${escapeQuotes(item?.loc || 'Virtual / Hybrid')}">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Event Description</label>
            <textarea id="event-field-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(item?.desc || '')}</textarea>
          </div>

          <!-- Dual Mode: External Registration/Zoom Link and/or Event PDF/Slide Deck Upload -->
          ${renderLinkAndFileUploadEngine({
            prefix: 'event',
            link: item?.link || '',
            fileUrl: item?.fileUrl || '',
            fileName: item?.fileName || '',
            fileSize: item?.fileSize || '',
            requiresAuth: item?.requiresAuth !== false,
            linkLabel: 'Event Registration URL / Virtual Meeting Room Link',
            linkPlaceholder: 'https://zoom.us/j/... or https://luma.com/...',
            fileLabel: 'Event Schedule / Workshop Slide Deck PDF Upload',
            fileHelp: 'Upload schedule PDF, slide deck, or event briefing'
          })}
        </div>
      `,
      getFormData: () => ({
        title: document.getElementById('event-field-title').value,
        type: document.getElementById('event-field-type').value,
        date: document.getElementById('event-field-date').value,
        loc: document.getElementById('event-field-loc').value,
        desc: document.getElementById('event-field-desc').value,
        link: document.getElementById('event-field-link')?.value || '',
        fileUrl: document.getElementById('event-field-fileurl')?.value || '',
        fileName: document.getElementById('event-field-filename')?.value || '',
        fileSize: document.getElementById('event-field-filesize')?.value || '',
        requiresAuth: document.getElementById('event-field-requires-auth') ? document.getElementById('event-field-requires-auth').checked : true
      })
    },

    // 💻 Projects Collection
    projectsList: {
      title: '💻 Open Science Projects',
      subtitle: "schemaType: 'project' • Open source repositories, demos & source packages",
      type: 'collection',
      storageKey: 'dss_projects',
      icon: 'code',
      renderItemCard: (item) => `
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-mono text-indigo-400 font-bold uppercase">${escapeHTML(item.type || 'Library')}</span>
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-mono text-emerald-400">★ ${escapeHTML(item.stars || '1k')}</span>
              ${item.fileUrl ? '<span class="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">ZIP</span>' : ''}
              ${item.link ? '<span class="text-[9px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30">Repo</span>' : ''}
            </div>
          </div>
          <h4 class="text-xs font-bold text-white truncate mt-1">${escapeHTML(item.title)}</h4>
          <p class="text-[10px] text-studio-muted truncate font-mono">${escapeHTML(item.lang || 'Python')}</p>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Project Name</label>
            <input type="text" id="project-field-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(item?.title || '')}">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Category Type</label>
              <input type="text" id="project-field-type" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white" value="${escapeQuotes(item?.type || 'Core Library')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Language / Stack</label>
              <input type="text" id="project-field-lang" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white font-mono" value="${escapeQuotes(item?.lang || 'Python')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">GitHub Stars Count</label>
              <input type="text" id="project-field-stars" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white font-mono" value="${escapeQuotes(item?.stars || '1.4k')}">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Description</label>
            <textarea id="project-field-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(item?.desc || '')}</textarea>
          </div>

          <!-- Dual Mode: External GitHub / Live Demo Link and/or Direct Source Archive (.zip) Upload -->
          ${renderLinkAndFileUploadEngine({
            prefix: 'project',
            link: item?.link || '',
            fileUrl: item?.fileUrl || '',
            fileName: item?.fileName || '',
            fileSize: item?.fileSize || '',
            requiresAuth: item?.requiresAuth !== false,
            linkLabel: 'GitHub Repository / Live Demo URL',
            linkPlaceholder: 'https://github.com/organization/repo',
            fileLabel: 'Direct Source Code Archive (.zip) / Model Weights Upload',
            fileHelp: 'Upload project ZIP, weights archive, or tarball'
          })}
        </div>
      `,
      getFormData: () => ({
        title: document.getElementById('project-field-title').value,
        type: document.getElementById('project-field-type').value,
        lang: document.getElementById('project-field-lang').value,
        stars: document.getElementById('project-field-stars').value,
        desc: document.getElementById('project-field-desc').value,
        link: document.getElementById('project-field-link')?.value || '',
        fileUrl: document.getElementById('project-field-fileurl')?.value || '',
        fileName: document.getElementById('project-field-filename')?.value || '',
        fileSize: document.getElementById('project-field-filesize')?.value || '',
        requiresAuth: document.getElementById('project-field-requires-auth') ? document.getElementById('project-field-requires-auth').checked : true
      })
    },

    // 📚 Resources Collection
    resourcesList: {
      title: '📚 Learning Resources & Codebooks',
      subtitle: "schemaType: 'resource' • Interactive handbooks, documentation & PDF uploads",
      type: 'collection',
      storageKey: 'dss_resources',
      icon: 'file-code',
      renderItemCard: (item) => `
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-mono text-cyan-400 font-bold uppercase">${escapeHTML(item.type || 'Guide')}</span>
            <div class="flex items-center gap-1">
              ${item.fileUrl ? '<span class="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">📁 File</span>' : ''}
              ${item.link ? '<span class="text-[9px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30">🔗 Link</span>' : ''}
              ${item.requiresAuth !== false ? '<span class="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">🔒 Gate</span>' : ''}
            </div>
          </div>
          <h4 class="text-xs font-bold text-white truncate mt-0.5">${escapeHTML(item.title)}</h4>
          <p class="text-[10px] text-studio-muted truncate font-mono">${escapeHTML(item.length || 'Online')}</p>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Resource Title</label>
            <input type="text" id="resource-field-title" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" value="${escapeQuotes(item?.title || '')}">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Category Type</label>
              <input type="text" id="resource-field-type" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white" value="${escapeQuotes(item?.type || 'Core Documentation')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Length / Notebook Count</label>
              <input type="text" id="resource-field-length" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white font-mono" value="${escapeQuotes(item?.length || '120 pages')}">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Description</label>
            <textarea id="resource-field-desc" rows="3" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl p-3 text-xs text-white focus:border-sanityRed focus:outline-none leading-relaxed">${escapeQuotes(item?.desc || '')}</textarea>
          </div>

          <!-- Dual Mode: External Handbook Link and/or Direct PDF/Notebook Upload -->
          ${renderLinkAndFileUploadEngine({
            prefix: 'resource',
            link: item?.link || '',
            fileUrl: item?.fileUrl || '',
            fileName: item?.fileName || '',
            fileSize: item?.fileSize || '',
            requiresAuth: item?.requiresAuth !== false,
            linkLabel: 'Handbook External Link / Colab / Notion / Google Drive',
            linkPlaceholder: 'https://colab.research.google.com/... or https://drive.google.com/...',
            fileLabel: 'Direct Learning Handbook PDF / Jupyter Notebook (.ipynb) / Dataset Upload',
            fileHelp: 'Upload handbook PDF, notebook, or codebook ZIP'
          })}
        </div>
      `,
      getFormData: () => ({
        title: document.getElementById('resource-field-title').value,
        type: document.getElementById('resource-field-type').value,
        length: document.getElementById('resource-field-length').value,
        desc: document.getElementById('resource-field-desc').value,
        link: document.getElementById('resource-field-link')?.value || '',
        fileUrl: document.getElementById('resource-field-fileurl')?.value || '',
        fileName: document.getElementById('resource-field-filename')?.value || '',
        fileSize: document.getElementById('resource-field-filesize')?.value || '',
        requiresAuth: document.getElementById('resource-field-requires-auth') ? document.getElementById('resource-field-requires-auth').checked : true
      })
    },

    // 📊 Key Statistics Collection
    statsList: {
      title: '📊 Key Statistics & Metrics',
      subtitle: "schemaType: 'stat' • Metric counters on homepage",
      type: 'collection',
      storageKey: 'dss_stats',
      icon: 'bar-chart-3',
      renderItemCard: (item) => `
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-white">${escapeHTML(item.name || '')}</span>
          <span class="text-xs font-mono font-bold text-emerald-400 bg-[#0e1013] px-2 py-0.5 rounded border border-[#262930]">${escapeHTML(item.value || '')}</span>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Metric Label</label>
              <input type="text" id="stat-field-name" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-bold" placeholder="e.g. Global Members" value="${escapeQuotes(item?.name || '')}">
            </div>
            <div>
              <label class="block text-[11px] font-mono text-studio-muted mb-1.5 font-semibold">Metric Value / Counter</label>
              <input type="text" id="stat-field-value" class="w-full bg-[#0e1013] border border-[#262930] rounded-xl px-3.5 py-2 text-xs text-white focus:border-sanityRed focus:outline-none font-mono" placeholder="e.g. 12k+" value="${escapeQuotes(item?.value || '')}">
            </div>
          </div>
        </div>
      `,
      getFormData: () => ({
        name: document.getElementById('stat-field-name').value,
        value: document.getElementById('stat-field-value').value
      })
    },

    // 📥 Submissions & Inquiries Inbox
    inquiriesList: {
      title: '📥 Submissions & Inquiries Inbox',
      subtitle: "schemaType: 'inquiry' • Form submissions from website visitors",
      type: 'collection',
      storageKey: 'dss_inquiries',
      icon: 'inbox',
      renderItemCard: (item) => `
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 font-bold uppercase">${escapeHTML(item.type || 'Contact')}</span>
            <span class="text-[10px] font-mono text-studio-muted">${escapeHTML(item.date || '')}</span>
          </div>
          <h4 class="text-xs font-bold text-white truncate mt-1">${escapeHTML(item.name || 'Anonymous')}</h4>
          <p class="text-[10px] text-studio-muted truncate font-mono">${escapeHTML(item.email || '')}</p>
        </div>
      `,
      renderItemForm: (item) => `
        <div class="space-y-4">
          <div class="p-4 bg-[#141619] rounded-2xl border border-[#262930] space-y-3">
            <div class="flex justify-between items-center">
              <div>
                <span class="text-xs font-mono text-rose-400 uppercase font-bold">// ${escapeHTML(item?.type || 'General Inquiry')}</span>
                <h3 class="text-base font-bold text-white">${escapeHTML(item?.name || 'Visitor')}</h3>
                <p class="text-xs font-mono text-sky-400 mt-0.5">${escapeHTML(item?.email || '')}</p>
              </div>
              <a href="mailto:${escapeQuotes(item?.email || '')}?subject=Re: Data Science Society Inquiry" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <i data-lucide="reply" class="w-3.5 h-3.5"></i>
                <span>Reply via Email</span>
              </a>
            </div>

            <div class="pt-3 border-t border-[#262930]">
              <span class="text-[10px] font-mono text-studio-muted uppercase font-bold block mb-1">Message Content:</span>
              <p class="text-xs text-slate-200 bg-[#0e1013] p-3 rounded-xl border border-[#262930] leading-relaxed">${escapeHTML(item?.message || 'No message text provided.')}</p>
            </div>
          </div>
        </div>
      `,
      getFormData: () => ({})
    }
  };

  // Switch Desk Item
  window.selectDeskItem = function (key) {
    activeDeskItem = key;
    activeCollectionId = null;

    // Update Sidebar Active Styles
    document.querySelectorAll('#desk-navigation-list button').forEach(btn => {
      btn.classList.remove('studio-active-item');
    });
    const activeBtn = document.getElementById(`item-${key}`);
    if (activeBtn) activeBtn.classList.add('studio-active-item');

    const config = schemaRenderers[key];
    if (!config) return;

    const collectionColumn = document.getElementById('desk-collection-column');
    const headerTitle = document.getElementById('active-document-title');
    const headerSubtitle = document.getElementById('active-document-subtitle');
    const iconWrapper = document.getElementById('doc-type-icon-wrapper');
    const formContainer = document.getElementById('active-form-fields-container');

    if (headerTitle) headerTitle.innerText = config.title;
    if (headerSubtitle) headerSubtitle.innerText = config.subtitle;
    if (iconWrapper) iconWrapper.innerHTML = `<i data-lucide="${config.icon}" class="w-4 h-4 text-sanityRed"></i>`;

    if (config.type === 'collection') {
      if (collectionColumn) collectionColumn.classList.remove('hidden');
      renderCollectionItemsList(key);
    } else {
      if (collectionColumn) collectionColumn.classList.add('hidden');
      if (formContainer) formContainer.innerHTML = config.render();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };

  // Render Collection Items Column
  function renderCollectionItemsList(key) {
    const config = schemaRenderers[key];
    const items = safeJSONParse(config.storageKey, []);
    const columnTitle = document.getElementById('collection-column-title');
    const listContainer = document.getElementById('collection-items-list');

    if (columnTitle) columnTitle.innerText = `${config.title} (${items.length})`;
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="p-6 text-center text-studio-muted text-xs">
          <p>No items found in this collection.</p>
          <button onclick="createNewCollectionItem()" class="mt-3 px-3 py-1.5 bg-sanityRed/20 hover:bg-sanityRed text-sanityRed hover:text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Create First Item</span>
          </button>
        </div>
      `;
      const formContainer = document.getElementById('active-form-fields-container');
      if (formContainer) formContainer.innerHTML = `<div class="p-12 text-center text-studio-muted text-xs">Select an item from the list or click "+ Create" to add a new document.</div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    items.forEach((item, index) => {
      const isActive = activeCollectionId === (item.id || index);
      const card = document.createElement('div');
      card.className = `p-3 rounded-xl cursor-pointer border transition-all ${isActive ? 'bg-[#22252c] border-sanityRed/50 shadow-md' : 'bg-[#141619] border-[#262930] hover:bg-[#1a1c22]'}`;
      card.onclick = () => selectCollectionItem(key, item.id || index);
      card.innerHTML = config.renderItemCard(item);
      listContainer.appendChild(card);
    });

    if (activeCollectionId === null && items.length > 0) {
      selectCollectionItem(key, items[0].id || 0);
    }
  }

  // Select a Collection Item
  window.selectCollectionItem = function (key, id) {
    activeCollectionId = id;
    const config = schemaRenderers[key];
    const items = safeJSONParse(config.storageKey, []);
    const item = items.find((it, idx) => (it.id || idx) === id) || items[0];

    const formContainer = document.getElementById('active-form-fields-container');
    if (!formContainer) return;

    formContainer.innerHTML = `
      <div class="space-y-6">
        <div class="p-5 bg-[#141619] border border-[#262930] rounded-2xl">
          <div class="flex justify-between items-center border-b border-[#262930] pb-3 mb-4">
            <h3 class="text-xs font-mono font-bold uppercase text-white tracking-wider">Document Details</h3>
            <button onclick="deleteCurrentCollectionItem('${key}', ${id})" class="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Delete Document</span>
            </button>
          </div>
          ${config.renderItemForm(item)}
        </div>
      </div>
    `;

    renderCollectionItemsList(key);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  // Create New Collection Item
  window.createNewCollectionItem = function () {
    const config = schemaRenderers[activeDeskItem];
    if (!config || config.type !== 'collection') return;

    const items = safeJSONParse(config.storageKey, []);
    const newItem = { id: Date.now() };
    items.unshift(newItem);
    localStorage.setItem(config.storageKey, JSON.stringify(items));

    activeCollectionId = newItem.id;
    renderCollectionItemsList(activeDeskItem);
    selectCollectionItem(activeDeskItem, newItem.id);
    updateStudioBadges();
  };

  // Delete Collection Item
  window.deleteCurrentCollectionItem = function (key, id) {
    if (!confirm('Are you sure you want to delete this document from Sanity?')) return;
    const config = schemaRenderers[key];
    let items = safeJSONParse(config.storageKey, []);
    items = items.filter((it, idx) => (it.id || idx) !== id);
    localStorage.setItem(config.storageKey, JSON.stringify(items));

    activeCollectionId = null;
    renderCollectionItemsList(key);
    updateStudioBadges();

    if (syncChannel) syncChannel.postMessage({ type: 'COLLECTION_UPDATED' });
    if (typeof window.syncToApiServer === 'function') {
      window.syncToApiServer();
    }
    showSaveToast('Document deleted and synced.');
  };

  // Save Active Document
  window.saveActiveDocument = function () {
    const config = schemaRenderers[activeDeskItem];
    if (!config) return;

    if (config.type === 'document') {
      config.save();
    } else if (config.type === 'collection') {
      const items = safeJSONParse(config.storageKey, []);
      const formData = config.getFormData();
      const index = items.findIndex((it, idx) => (it.id || idx) === activeCollectionId);

      if (index !== -1) {
        items[index] = { ...items[index], ...formData };
      } else {
        items.unshift({ id: activeCollectionId || Date.now(), ...formData });
      }

      localStorage.setItem(config.storageKey, JSON.stringify(items));
      if (syncChannel) syncChannel.postMessage({ type: 'COLLECTION_UPDATED' });
      renderCollectionItemsList(activeDeskItem);
    }

    if (typeof window.syncToApiServer === 'function') {
      window.syncToApiServer();
    }

    updateStudioBadges();
    showSaveToast('Changes saved and synced live to http://localhost:3000');
  };

  // Publish All Changes globally across entire site
  window.publishAllStudioChanges = async function () {
    window.saveActiveDocument();
    if (typeof window.syncToApiServer === 'function') {
      await window.syncToApiServer();
    }
    if (syncChannel) {
      syncChannel.postMessage({ type: 'FORCE_FULL_RESYNC' });
    }
    showSaveToast('🚀 All Sanity Studio changes published and live-synced to website!');
  };

  // Save Config Tab
  window.saveSanityConfig = function () {
    const projId = document.getElementById('config-project-id').value;
    const dataset = document.getElementById('config-dataset').value;
    const token = document.getElementById('config-token').value;

    localStorage.setItem('dss_sanity_project_id', projId);
    localStorage.setItem('dss_sanity_dataset', dataset);
    localStorage.setItem('dss_sanity_token', token);

    showSaveToast('Sanity Configuration Saved!');
  };

  // Export Full JSON Backup
  window.exportAllSiteJSON = function () {
    const dump = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dss_')) {
        dump[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanity-dss-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSaveToast('Exported Full Site JSON Backup!');
  };

  // Reset to Factory Defaults
  window.resetToFactoryDefaults = function () {
    if (!confirm('Warning: This will reset all customized styles, text, and documents back to initial defaults. Continue?')) return;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dss_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    if (syncChannel) syncChannel.postMessage({ type: 'RESET_ALL' });
    location.reload();
  };

  // Live Toast Notification
  function showSaveToast(message) {
    const statusText = document.getElementById('doc-save-status');
    if (statusText) {
      statusText.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i><span>Saved & Synced</span>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    let toast = document.getElementById('studio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'studio-toast';
      toast.className = 'fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-bold rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-4 opacity-0 flex items-center gap-2';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>${escapeHTML(message)}</span>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
    }, 3000);
  }

  // Live Helpers
  window.syncColorInput = function (pickerId, inputId) {
    const val = document.getElementById(pickerId).value;
    document.getElementById(inputId).value = val;
    window.saveActiveDocument();
  };

  window.syncColorPicker = function (inputId, pickerId) {
    const val = document.getElementById(inputId).value;
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      document.getElementById(pickerId).value = val;
      window.saveActiveDocument();
    }
  };

  window.updateLogoPreview = function (url) {
    const box = document.getElementById('logo-preview-box');
    if (box) {
      box.innerHTML = url ? `<img src="${url}" class="w-full h-full object-contain">` : `<span class="text-[9px] text-studio-muted font-mono">SVG</span>`;
    }
  };

  window.updateItemImagePreview = function (url, previewId) {
    const img = document.getElementById(previewId);
    if (img && url) img.src = url;
  };

  // Studio Tab Switching
  window.switchStudioTab = function (tab) {
    activeTab = tab;
    ['desk', 'vision', 'settings'].forEach(t => {
      const view = document.getElementById(`view-${t}`);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (view) view.classList.toggle('hidden', t !== tab);
      if (btn) {
        if (t === tab) {
          btn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#22252c] text-white flex items-center gap-1.5 transition-all';
        } else {
          btn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-studio-muted hover:text-white flex items-center gap-1.5 transition-all';
        }
      }
    });

    if (tab === 'vision') executeGroqQuery();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  // Publish All
  window.publishAllStudioChanges = function () {
    window.saveActiveDocument();
    if (syncChannel) syncChannel.postMessage({ type: 'PUBLISH_ALL' });
    showSaveToast('✨ Published all content live across website tabs!');
  };

  // Update Badges
  function updateStudioBadges() {
    const stats = safeJSONParse('dss_stats', []);
    const posts = safeJSONParse('dss_blogs', []);
    const papers = safeJSONParse('dss_papers', []);
    const team = safeJSONParse('dss_team', []);
    const events = safeJSONParse('dss_events', []);
    const projects = safeJSONParse('dss_projects', []);
    const resources = safeJSONParse('dss_resources', []);
    const inquiries = safeJSONParse('dss_inquiries', []);

    const el = (id, val) => {
      const b = document.getElementById(id);
      if (b) b.innerText = val;
    };

    el('badge-stats-count', stats.length);
    el('badge-posts-count', posts.length);
    el('badge-papers-count', papers.length);
    el('badge-team-count', team.length);
    el('badge-events-count', events.length);
    el('badge-projects-count', projects.length);
    el('badge-resources-count', resources.length);
    el('badge-inquiries-count', inquiries.length);
  }

  // Vision GROQ Execution
  window.executeGroqQuery = function () {
    const queryInput = document.getElementById('groq-query-input');
    const resultOutput = document.getElementById('groq-result-output');
    const timeOutput = document.getElementById('groq-exec-time');
    if (!queryInput || !resultOutput) return;

    const startTime = performance.now();
    const query = queryInput.value.trim();

    try {
      let result = null;
      if (query.includes('themeSettings')) {
        result = {
          _type: 'themeSettings',
          accentColorHex: localStorage.getItem('dss_color_accent') || '#0284c7',
          accentColorLightHex: localStorage.getItem('dss_color_sky') || '#38bdf8',
          darkBackgroundHex: localStorage.getItem('dss_color_bg') || '#030712',
          headingFontFamily: localStorage.getItem('dss_font_heading') || "'Outfit', sans-serif",
          bodyFontFamily: localStorage.getItem('dss_font_body') || "'Plus Jakarta Sans', sans-serif",
          themeModeDefault: localStorage.getItem('dss_theme_mode') || 'dark'
        };
      } else if (query.includes('siteSettings')) {
        result = {
          _type: 'siteSettings',
          siteTitle: localStorage.getItem('dss_site_title') || 'Data Science Society',
          siteDesc: localStorage.getItem('dss_site_desc'),
          footerCopyright: localStorage.getItem('dss_footer_copyright'),
          bannerActive: localStorage.getItem('dss_banner_active') === 'true'
        };
      } else if (query.includes('bannerSettings')) {
        result = {
          _type: 'bannerSettings',
          bannerActive: localStorage.getItem('dss_banner_active') !== 'false',
          badgeText: localStorage.getItem('dss_banner_badge') || '🚀 LIVE EVENT',
          bannerText: localStorage.getItem('dss_banner_text') || 'Fall 2026 AI Hackathon Registration Open — Click to Register!',
          targetPage: localStorage.getItem('dss_banner_target_page') || 'events.html',
          customUrl: localStorage.getItem('dss_banner_custom_url') || '',
          ctaText: localStorage.getItem('dss_banner_cta') || 'Click to Register →',
          bannerStyle: localStorage.getItem('dss_banner_style') || 'floating-left',
          colorGradient: localStorage.getItem('dss_banner_gradient') || 'sky-indigo'
        };
      } else if (query.includes('teamMember')) {
        result = safeJSONParse('dss_team', []);
      } else if (query.includes('post')) {
        result = safeJSONParse('dss_blogs', []);
      } else if (query.includes('researchPaper')) {
        result = safeJSONParse('dss_papers', []);
      } else if (query.includes('event')) {
        result = safeJSONParse('dss_events', []);
      } else if (query.includes('project')) {
        result = safeJSONParse('dss_projects', []);
      } else if (query.includes('resource')) {
        result = safeJSONParse('dss_resources', []);
      } else if (query.includes('stat')) {
        result = safeJSONParse('dss_stats', []);
      } else {
        result = { status: 'Executed', query, matched: 0, result: [] };
      }

      const elapsed = Math.round(performance.now() - startTime);
      if (timeOutput) timeOutput.innerText = `${elapsed}ms`;
      resultOutput.innerText = JSON.stringify(result, null, 2);
    } catch (err) {
      resultOutput.innerText = `Error: ${err.message}`;
    }
  };

  window.setQueryPreset = function (preset) {
    const input = document.getElementById('groq-query-input');
    if (input) {
      input.value = preset;
      executeGroqQuery();
    }
  };

  // Banner Mockup & Custom URL Helpers
  window.toggleCustomUrlField = function (val) {
    const container = document.getElementById('custom-url-container');
    if (container) {
      if (val === 'custom') {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    }
  };

  window.renderBannerMockup = function () {
    const mockup = document.getElementById('banner-live-mockup');
    if (!mockup) return;

    const active = document.getElementById('field-banner-active')?.checked ?? true;
    const badge = document.getElementById('field-banner-badge')?.value || '⚡ HACKATHON';
    const text = document.getElementById('field-banner-text')?.value || 'Fall 2026 AI Hackathon Registration Open';
    const subtext = document.getElementById('field-banner-subtext')?.value || 'Join 500+ researchers and build frontier multi-agent AI systems.';
    const cta = document.getElementById('field-banner-cta')?.value || 'Click to Register →';
    const shape = document.getElementById('field-banner-shape')?.value || 'box-card';
    const position = document.getElementById('field-banner-position')?.value || 'bottom-left';
    const animation = document.getElementById('field-banner-animation')?.value || 'float-pulse';
    const gradient = document.getElementById('field-banner-gradient')?.value || 'sky-indigo';

    if (!active) {
      mockup.innerHTML = `
        <div class="text-center py-6 px-4">
          <div class="text-xs text-amber-400 font-mono font-bold mb-1">⚠️ BANNER IS DISABLED</div>
          <p class="text-[11px] text-studio-muted">Check "Enable Banner" above to activate and display across the live site.</p>
        </div>
      `;
      return;
    }

    let gradientClass = 'bg-slate-900/95 border-sky-500/40 text-sky-200 shadow-sky-500/20';
    let badgeColor = 'bg-sky-500/25 text-sky-300 border-sky-400/40';
    let btnColor = 'bg-sky-500 text-black hover:bg-sky-400 shadow-sky-500/40';
    let dotColor = 'bg-sky-400';

    if (gradient === 'emerald-teal') {
      gradientClass = 'bg-slate-900/95 border-emerald-500/40 text-emerald-200 shadow-emerald-500/20';
      badgeColor = 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40';
      btnColor = 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/40';
      dotColor = 'bg-emerald-400';
    } else if (gradient === 'amber-rose') {
      gradientClass = 'bg-slate-900/95 border-amber-500/40 text-amber-200 shadow-amber-500/20';
      badgeColor = 'bg-amber-500/25 text-amber-300 border-amber-400/40';
      btnColor = 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/40';
      dotColor = 'bg-amber-400';
    } else if (gradient === 'purple-cyan') {
      gradientClass = 'bg-slate-900/95 border-purple-500/40 text-purple-200 shadow-purple-500/20';
      badgeColor = 'bg-purple-500/25 text-purple-300 border-purple-400/40';
      btnColor = 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-cyan-500/40';
      dotColor = 'bg-fuchsia-400';
    } else if (gradient === 'monochrome-gold') {
      gradientClass = 'bg-slate-900/95 border-amber-400/50 text-amber-100 shadow-amber-500/30';
      badgeColor = 'bg-amber-400/20 text-amber-300 border-amber-400/40';
      btnColor = 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/40';
      dotColor = 'bg-amber-300';
    }

    let animClass = '';
    if (animation === 'float-pulse') animClass = 'animate-pulse';
    else if (animation === 'bounce-subtle') animClass = 'animate-bounce';

    const metaTag = `<span class="text-[9px] font-mono uppercase tracking-wider text-studio-muted mt-2 block text-center">Placement: <b>${position}</b> • Motion: <b>${animation}</b></span>`;

    if (shape === 'box-card') {
      mockup.innerHTML = `
        <div class="w-full max-w-md ${animClass}">
          <div class="p-4 rounded-2xl border ${gradientClass} backdrop-blur-2xl shadow-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="flex h-2 w-2 relative shrink-0">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 ${dotColor}"></span>
                </span>
                <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}">${escapeHTML(badge)}</span>
              </div>
              <span class="text-slate-400 text-xs hover:text-white cursor-pointer">&times;</span>
            </div>
            <div>
              <h4 class="text-xs font-bold text-white font-heading">${escapeHTML(text)}</h4>
              ${subtext ? `<p class="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">${escapeHTML(subtext)}</p>` : ''}
            </div>
            <div class="pt-1 flex items-center justify-between">
              <span class="text-[11px] font-bold px-3 py-1.5 rounded-xl ${btnColor} shadow-md cursor-pointer transition-transform">${escapeHTML(cta)}</span>
              <span class="text-[10px] text-studio-muted font-mono">Live Interactive Mockup</span>
            </div>
          </div>
          ${metaTag}
        </div>
      `;
    } else if (shape === 'pill-capsule') {
      mockup.innerHTML = `
        <div class="w-full max-w-xl flex flex-col items-center ${animClass}">
          <div class="inline-flex items-center gap-3 p-2 pl-3.5 pr-2 rounded-full border ${gradientClass} backdrop-blur-2xl shadow-2xl">
            <span class="flex h-2 w-2 relative shrink-0">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 ${dotColor}"></span>
            </span>
            <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}">${escapeHTML(badge)}</span>
            <span class="text-xs font-medium text-slate-200 truncate max-w-xs">${escapeHTML(text)}</span>
            <span class="text-[11px] font-bold px-3 py-1.5 rounded-full ${btnColor} shrink-0 cursor-pointer shadow-md">${escapeHTML(cta)}</span>
          </div>
          ${metaTag}
        </div>
      `;
    } else if (shape === 'line-streamer') {
      mockup.innerHTML = `
        <div class="w-full overflow-hidden rounded-xl border ${gradientClass} p-3 backdrop-blur-2xl">
          <div class="whitespace-nowrap flex items-center gap-6 text-xs font-medium">
            <div class="flex items-center gap-2.5 shrink-0">
              <span class="flex h-2 w-2 relative shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 ${dotColor}"></span>
              </span>
              <span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeColor}">${escapeHTML(badge)}</span>
              <span class="text-slate-100 font-semibold">${escapeHTML(text)}</span>
              <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg ${btnColor} cursor-pointer">${escapeHTML(cta)}</span>
            </div>
            <span class="text-studio-muted font-mono text-xs">• • •</span>
            <div class="flex items-center gap-2.5 shrink-0">
              <span class="flex h-2 w-2 relative shrink-0">
                <span class="relative inline-flex rounded-full h-2 w-2 ${dotColor}"></span>
              </span>
              <span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeColor}">${escapeHTML(badge)}</span>
              <span class="text-slate-100 font-semibold">${escapeHTML(text)}</span>
              <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg ${btnColor} cursor-pointer">${escapeHTML(cta)}</span>
            </div>
          </div>
          ${metaTag}
        </div>
      `;
    } else if (shape === 'bar-header') {
      mockup.innerHTML = `
        <div class="w-full rounded-xl border ${gradientClass} p-3 flex items-center justify-between text-xs backdrop-blur-2xl">
          <div class="flex items-center gap-2.5">
            <span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeColor}">${escapeHTML(badge)}</span>
            <span class="text-slate-200 font-medium">${escapeHTML(text)}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold px-3 py-1 rounded-lg ${btnColor} cursor-pointer">${escapeHTML(cta)}</span>
            <span class="text-slate-400 text-sm hover:text-white cursor-pointer">&times;</span>
          </div>
        </div>
        ${metaTag}
      `;
    } else {
      // corner-ribbon
      mockup.innerHTML = `
        <div class="w-full max-w-sm flex items-center justify-between p-3.5 rounded-2xl border ${gradientClass} backdrop-blur-2xl">
          <div class="flex items-center gap-2.5">
            <span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeColor}">${escapeHTML(badge)}</span>
            <span class="text-xs text-white font-bold">${escapeHTML(text)}</span>
          </div>
          <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg ${btnColor} cursor-pointer">${escapeHTML(cta)}</span>
        </div>
        ${metaTag}
      `;
    }
  };

  // 📡 Real-Time Synchronizer to Backend API
  window.syncToApiServer = async function () {
    try {
      const payload = {
        theme: {
          accent: localStorage.getItem('dss_color_accent') || '#0284c7',
          sky: localStorage.getItem('dss_color_sky') || '#38bdf8',
          bg: localStorage.getItem('dss_color_bg') || '#030712',
          surface: localStorage.getItem('dss_color_surface') || '#0f172a',
          mode: localStorage.getItem('dss_theme_mode') || 'dark',
          fontHeading: localStorage.getItem('dss_font_heading') || "'Outfit', sans-serif",
          fontBody: localStorage.getItem('dss_font_body') || "'Plus Jakarta Sans', sans-serif",
          canvasEnabled: localStorage.getItem('dss_canvas_enabled') !== 'false',
          canvasOpacity: localStorage.getItem('dss_canvas_opacity') || '80',
          customCss: localStorage.getItem('dss_custom_css') || ''
        },
        siteSettings: {
          siteTitle: localStorage.getItem('dss_site_title') || 'Data Science Society',
          logoImage: localStorage.getItem('dss_logo_image') || '',
          siteDesc: localStorage.getItem('dss_site_desc') || 'Data Science Society (DSS) — Advancing Deep Learning, Quantum Neural Structures, and Open Science Computing.',
          footerCopyright: localStorage.getItem('dss_footer_copyright') || '© 2026 Data Science Society. All Rights Reserved.',
          contactEmail: localStorage.getItem('dss_contact_email') || 'contact@datasciencesociety.org',
          socialGithub: localStorage.getItem('dss_social_github') || 'https://github.com/datasciencesociety',
          socialX: localStorage.getItem('dss_social_x') || 'https://x.com/datasciencesoc',
          socialDiscord: localStorage.getItem('dss_social_discord') || 'https://discord.gg/datascience'
        },
        bannerSettings: {
          bannerActive: localStorage.getItem('dss_banner_active') !== 'false',
          badgeText: localStorage.getItem('dss_banner_badge') || '⚡ HACKATHON',
          bannerText: localStorage.getItem('dss_banner_text') || 'Fall 2026 AI Hackathon Registration Open',
          subText: localStorage.getItem('dss_banner_subtext') || 'Join 500+ researchers and build frontier multi-agent AI systems.',
          targetPage: localStorage.getItem('dss_banner_target_page') || 'events.html',
          customUrl: localStorage.getItem('dss_banner_custom_url') || '',
          ctaText: localStorage.getItem('dss_banner_cta') || 'Click to Register →',
          shape: localStorage.getItem('dss_banner_shape') || 'box-card',
          position: localStorage.getItem('dss_banner_position') || 'bottom-left',
          animation: localStorage.getItem('dss_banner_animation') || 'float-pulse',
          colorGradient: localStorage.getItem('dss_banner_gradient') || 'sky-indigo'
        },
        heroSection: {
          heroTagline: localStorage.getItem('dss_hero_tagline') || 'Advanced Research & Open Source Computing',
          heroTitle: localStorage.getItem('dss_home_hero_title') || localStorage.getItem('dss_hero_title') || 'Architecting the Future of Frontier Intelligence.',
          heroSubtitle: localStorage.getItem('dss_home_hero_desc') || localStorage.getItem('dss_hero_subtitle') || 'Data Science Society unites elite researchers, algorithmic engineers, and domain specialists to construct verifiable, decentralized artificial intelligence ecosystems.',
          primaryCtaText: localStorage.getItem('dss_hero_btn1_text') || localStorage.getItem('dss_hero_primary_text') || 'Apply for Membership',
          primaryCtaLink: localStorage.getItem('dss_hero_btn1_link') || localStorage.getItem('dss_hero_primary_link') || 'join.html',
          secondaryCtaText: localStorage.getItem('dss_hero_btn2_text') || localStorage.getItem('dss_hero_secondary_text') || 'Explore Research',
          secondaryCtaLink: localStorage.getItem('dss_hero_btn2_link') || localStorage.getItem('dss_hero_secondary_link') || 'research.html'
        },
        pillars: {
          pillar1Title: localStorage.getItem('dss_pillar1_title') || 'Academic Synergy',
          pillar1Desc: localStorage.getItem('dss_home_mission') || localStorage.getItem('dss_pillar1_desc') || 'Collaborative research cohorts bridging theoretical machine learning and scalable real-world implementations.',
          pillar2Title: localStorage.getItem('dss_pillar2_title') || 'Decentralized AI',
          pillar2Desc: localStorage.getItem('dss_home_vision') || localStorage.getItem('dss_pillar2_desc') || 'Pioneering distributed neural architectures, verifiable compute paradigms, and federated learning protocols.',
          pillar3Title: localStorage.getItem('dss_pillar3_title') || 'Open Access',
          pillar3Desc: localStorage.getItem('dss_home_values') || localStorage.getItem('dss_pillar3_desc') || 'Commitment to 100% open-source datasets, preprints, algorithmic frameworks, and reproducibility standards.'
        },
        pageHeaders: {
          about: {
            title: localStorage.getItem('dss_about_title') || localStorage.getItem('dss_page_about_title') || 'Pioneering the Frontiers of Data & Artificial Intelligence',
            desc: localStorage.getItem('dss_about_intro') || localStorage.getItem('dss_page_about_desc') || 'The Data Science Society is an elite academic and engineering collective dedicated to advancing theoretical breakthroughs, decentralized architectures, and sovereign AI.'
          },
          research: {
            title: localStorage.getItem('dss_research_title') || localStorage.getItem('dss_page_research_title') || 'Frontier AI & Machine Learning Research',
            desc: localStorage.getItem('dss_research_desc') || localStorage.getItem('dss_page_research_desc') || 'Explore peer-reviewed preprints, neural architectures, and reproducible empirical benchmarks produced by our research labs.'
          },
          projects: {
            title: localStorage.getItem('dss_projects_title') || localStorage.getItem('dss_page_projects_title') || 'Open Source Systems & Repositories',
            desc: localStorage.getItem('dss_projects_desc') || localStorage.getItem('dss_page_projects_desc') || 'High-throughput machine learning frameworks, distributed compute engines, and verifiable tooling maintained by society fellows.'
          },
          blog: {
            title: localStorage.getItem('dss_blog_title') || localStorage.getItem('dss_page_blog_title') || 'Society Dispatches & Technical Essays',
            desc: localStorage.getItem('dss_blog_desc') || localStorage.getItem('dss_page_blog_desc') || 'Deep dives into quantum neural representations, mechanistic interpretability, and sovereign compute economics.'
          },
          events: {
            title: localStorage.getItem('dss_events_title') || localStorage.getItem('dss_page_events_title') || 'Symposia, Hackathons & Technical Summits',
            desc: localStorage.getItem('dss_events_desc') || localStorage.getItem('dss_page_events_desc') || 'Join our upcoming global hackathons, research symposiums, and peer-to-peer engineering workshops.'
          },
          resources: {
            title: localStorage.getItem('dss_resources_title') || localStorage.getItem('dss_page_resources_title') || 'Learning Curricula & Open Access Tooling',
            desc: localStorage.getItem('dss_resources_desc') || localStorage.getItem('dss_page_resources_desc') || 'Curated deep learning curricula, interactive simulation notebooks, mathematical cheatsheets, and framework guides.'
          },
          join: {
            title: localStorage.getItem('dss_join_title') || localStorage.getItem('dss_page_join_title') || 'Join the Research Society',
            desc: localStorage.getItem('dss_join_desc') || localStorage.getItem('dss_page_join_desc') || 'Apply for Fellowship, Academic Membership, or Partner Cohorts to collaborate with elite practitioners.'
          },
          contact: {
            title: localStorage.getItem('dss_contact_title') || localStorage.getItem('dss_page_contact_title') || 'Connect with Our Research Directors',
            desc: localStorage.getItem('dss_contact_address') || localStorage.getItem('dss_page_contact_desc') || '100 Innovation Parkway, Suite 400, Tech Campus, NY 10001'
          }
        },
        collections: {
          blogs: safeJSONParse('dss_blogs', []),
          papers: safeJSONParse('dss_papers', []),
          events: safeJSONParse('dss_events', []),
          projects: safeJSONParse('dss_projects', []),
          resources: safeJSONParse('dss_resources', []),
          team: safeJSONParse('dss_team', []),
          stats: safeJSONParse('dss_stats', [])
        },
        advertisement: safeJSONParse('dss_advertisement', {}),
        community: {
          proto1: localStorage.getItem('dss_community_proto1') || '',
          proto2: localStorage.getItem('dss_community_proto2') || '',
          proto3: localStorage.getItem('dss_community_proto3') || ''
        }
      };

      // POST to local API
      await fetch('/api/sanity-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Also POST to port 3000 if running on port 3333
      if (window.location.port !== '3000') {
        try {
          await fetch('http://localhost:3000/api/sanity-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (e2) {}
      }
    } catch (e) {
      console.warn('API Sync notice:', e);
    }
  };

  // 📥 Initial Content Hydration from Central API
  window.loadInitialDataFromApi = async function () {
    try {
      const res = await fetch('/api/sanity-content', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      if (data.theme) {
        if (data.theme.accent) localStorage.setItem('dss_color_accent', data.theme.accent);
        if (data.theme.sky) localStorage.setItem('dss_color_sky', data.theme.sky);
        if (data.theme.bg) localStorage.setItem('dss_color_bg', data.theme.bg);
        if (data.theme.surface) localStorage.setItem('dss_color_surface', data.theme.surface);
        if (data.theme.mode) localStorage.setItem('dss_theme_mode', data.theme.mode);
        if (data.theme.fontHeading) localStorage.setItem('dss_font_heading', data.theme.fontHeading);
        if (data.theme.fontBody) localStorage.setItem('dss_font_body', data.theme.fontBody);
        if (data.theme.canvasEnabled !== undefined) localStorage.setItem('dss_canvas_enabled', data.theme.canvasEnabled);
        if (data.theme.canvasOpacity) localStorage.setItem('dss_canvas_opacity', data.theme.canvasOpacity);
        if (data.theme.customCss) localStorage.setItem('dss_custom_css', data.theme.customCss);
      }

      if (data.siteSettings) {
        if (data.siteSettings.siteTitle) localStorage.setItem('dss_site_title', data.siteSettings.siteTitle);
        if (data.siteSettings.logoImage !== undefined) localStorage.setItem('dss_logo_image', data.siteSettings.logoImage);
        if (data.siteSettings.siteDesc) localStorage.setItem('dss_site_desc', data.siteSettings.siteDesc);
        if (data.siteSettings.footerCopyright) localStorage.setItem('dss_footer_copyright', data.siteSettings.footerCopyright);
        if (data.siteSettings.contactEmail) localStorage.setItem('dss_contact_email', data.siteSettings.contactEmail);
        if (data.siteSettings.socialGithub) localStorage.setItem('dss_social_github', data.siteSettings.socialGithub);
        if (data.siteSettings.socialX) localStorage.setItem('dss_social_x', data.siteSettings.socialX);
        if (data.siteSettings.socialDiscord) localStorage.setItem('dss_social_discord', data.siteSettings.socialDiscord);
      }

      if (data.bannerSettings) {
        if (data.bannerSettings.bannerActive !== undefined) localStorage.setItem('dss_banner_active', data.bannerSettings.bannerActive);
        if (data.bannerSettings.badgeText) localStorage.setItem('dss_banner_badge', data.bannerSettings.badgeText);
        if (data.bannerSettings.bannerText) localStorage.setItem('dss_banner_text', data.bannerSettings.bannerText);
        if (data.bannerSettings.subText !== undefined) localStorage.setItem('dss_banner_subtext', data.bannerSettings.subText);
        if (data.bannerSettings.targetPage) localStorage.setItem('dss_banner_target_page', data.bannerSettings.targetPage);
        if (data.bannerSettings.customUrl !== undefined) localStorage.setItem('dss_banner_custom_url', data.bannerSettings.customUrl);
        if (data.bannerSettings.ctaText) localStorage.setItem('dss_banner_cta', data.bannerSettings.ctaText);
        if (data.bannerSettings.shape) localStorage.setItem('dss_banner_shape', data.bannerSettings.shape);
        if (data.bannerSettings.position) localStorage.setItem('dss_banner_position', data.bannerSettings.position);
        if (data.bannerSettings.animation) localStorage.setItem('dss_banner_animation', data.bannerSettings.animation);
        if (data.bannerSettings.colorGradient) localStorage.setItem('dss_banner_gradient', data.bannerSettings.colorGradient);
        const link = data.bannerSettings.targetPage === 'custom' && data.bannerSettings.customUrl ? data.bannerSettings.customUrl : data.bannerSettings.targetPage;
        localStorage.setItem('dss_banner_link', link);
      }

      if (data.heroSection) {
        if (data.heroSection.heroTagline) localStorage.setItem('dss_hero_tagline', data.heroSection.heroTagline);
        if (data.heroSection.heroTitle) {
          localStorage.setItem('dss_home_hero_title', data.heroSection.heroTitle);
          localStorage.setItem('dss_hero_title', data.heroSection.heroTitle);
        }
        if (data.heroSection.heroSubtitle) {
          localStorage.setItem('dss_home_hero_desc', data.heroSection.heroSubtitle);
          localStorage.setItem('dss_hero_subtitle', data.heroSection.heroSubtitle);
        }
        if (data.heroSection.primaryCtaText) {
          localStorage.setItem('dss_hero_btn1_text', data.heroSection.primaryCtaText);
          localStorage.setItem('dss_hero_primary_text', data.heroSection.primaryCtaText);
        }
        if (data.heroSection.primaryCtaLink) {
          localStorage.setItem('dss_hero_btn1_link', data.heroSection.primaryCtaLink);
          localStorage.setItem('dss_hero_primary_link', data.heroSection.primaryCtaLink);
        }
        if (data.heroSection.secondaryCtaText) {
          localStorage.setItem('dss_hero_btn2_text', data.heroSection.secondaryCtaText);
          localStorage.setItem('dss_hero_secondary_text', data.heroSection.secondaryCtaText);
        }
        if (data.heroSection.secondaryCtaLink) {
          localStorage.setItem('dss_hero_btn2_link', data.heroSection.secondaryCtaLink);
          localStorage.setItem('dss_hero_secondary_link', data.heroSection.secondaryCtaLink);
        }
      }

      if (data.pillars) {
        if (data.pillars.pillar1Title) localStorage.setItem('dss_pillar1_title', data.pillars.pillar1Title);
        if (data.pillars.pillar1Desc) {
          localStorage.setItem('dss_home_mission', data.pillars.pillar1Desc);
          localStorage.setItem('dss_pillar1_desc', data.pillars.pillar1Desc);
        }
        if (data.pillars.pillar2Title) localStorage.setItem('dss_pillar2_title', data.pillars.pillar2Title);
        if (data.pillars.pillar2Desc) {
          localStorage.setItem('dss_home_vision', data.pillars.pillar2Desc);
          localStorage.setItem('dss_pillar2_desc', data.pillars.pillar2Desc);
        }
        if (data.pillars.pillar3Title) localStorage.setItem('dss_pillar3_title', data.pillars.pillar3Title);
        if (data.pillars.pillar3Desc) {
          localStorage.setItem('dss_home_values', data.pillars.pillar3Desc);
          localStorage.setItem('dss_pillar3_desc', data.pillars.pillar3Desc);
        }
      }

      if (data.pageHeaders) {
        Object.keys(data.pageHeaders).forEach(k => {
          const item = data.pageHeaders[k];
          if (item.title) {
            localStorage.setItem(`dss_${k}_title`, item.title);
            localStorage.setItem(`dss_page_${k}_title`, item.title);
          }
          if (item.desc) {
            localStorage.setItem(`dss_${k}_intro`, item.desc);
            localStorage.setItem(`dss_${k}_desc`, item.desc);
            localStorage.setItem(`dss_page_${k}_desc`, item.desc);
          }
        });
      }

      if (data.collections) {
        if (Array.isArray(data.collections.blogs) && data.collections.blogs.length > 0) localStorage.setItem('dss_blogs', JSON.stringify(data.collections.blogs));
        if (Array.isArray(data.collections.papers) && data.collections.papers.length > 0) localStorage.setItem('dss_papers', JSON.stringify(data.collections.papers));
        if (Array.isArray(data.collections.events) && data.collections.events.length > 0) localStorage.setItem('dss_events', JSON.stringify(data.collections.events));
        if (Array.isArray(data.collections.projects) && data.collections.projects.length > 0) localStorage.setItem('dss_projects', JSON.stringify(data.collections.projects));
        if (Array.isArray(data.collections.resources) && data.collections.resources.length > 0) localStorage.setItem('dss_resources', JSON.stringify(data.collections.resources));
        if (Array.isArray(data.collections.team) && data.collections.team.length > 0) localStorage.setItem('dss_team', JSON.stringify(data.collections.team));
        if (Array.isArray(data.collections.stats) && data.collections.stats.length > 0) localStorage.setItem('dss_stats', JSON.stringify(data.collections.stats));
      }

      if (data.advertisement) {
        localStorage.setItem('dss_advertisement', JSON.stringify(data.advertisement));
      }
      if (data.community) {
        if (data.community.proto1) localStorage.setItem('dss_community_proto1', data.community.proto1);
        if (data.community.proto2) localStorage.setItem('dss_community_proto2', data.community.proto2);
        if (data.community.proto3) localStorage.setItem('dss_community_proto3', data.community.proto3);
      }
    } catch (e) {
      console.warn('Error loading initial data from API:', e);
    }
  };

  // Search Filter in Desk
  window.filterDeskItems = function (term) {
    const termLower = (term || '').toLowerCase();
    document.querySelectorAll('#desk-navigation-list button').forEach(btn => {
      const text = btn.innerText.toLowerCase();
      btn.style.display = text.includes(termLower) ? 'flex' : 'none';
    });
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.loadInitialDataFromApi === 'function') {
      await window.loadInitialDataFromApi();
    }
    selectDeskItem('themeSettings');
    updateStudioBadges();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

})();
