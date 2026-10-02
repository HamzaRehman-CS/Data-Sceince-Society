// Bundle only the Lucide glyphs referenced by the public templates and scripts.
const fs = require('node:fs');
const { icons } = require('lucide');
const names = new Set(['play', 'layers', 'book-open']);
for (const directory of ['website/pages', 'website/scripts']) {
  for (const file of fs.readdirSync(directory).filter(f => /\.(html|js)$/.test(f))) {
    const source = fs.readFileSync(directory + '/' + file, 'utf8');
    for (const [, name] of source.matchAll(/data-lucide="([a-z][a-z0-9-]*)"/g)) names.add(name);
  }
}
const nodes = {};
for (const name of [...names].sort()) {
  const key = name.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('');
  if (!icons[key]) throw new Error('Unknown Lucide icon: ' + name);
  nodes[name] = icons[key];
}
const license = fs.readFileSync(require.resolve('lucide/package.json').replace(/package\.json$/, 'LICENSE'), 'utf8');
const runtime = `
'use strict';
(() => {
  const icons = ${JSON.stringify(nodes)};
  const namespace = 'http://www.w3.org/2000/svg';
  function element([name, attrs = {}, children = []]) {
    const el = document.createElementNS(namespace, name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    for (const child of children) el.append(element(child));
    return el;
  }
  window.lucide = {
    createIcons() {
      for (const source of document.querySelectorAll('i[data-lucide]')) {
        const name = source.dataset.lucide, definition = icons[name];
        if (!definition) continue;
        const svg = element(definition);
        for (const attr of source.attributes) svg.setAttribute(attr.name, attr.value);
        svg.classList.add('lucide', 'lucide-' + name);
        if (!svg.hasAttribute('aria-label') && !svg.hasAttribute('role')) svg.setAttribute('aria-hidden', 'true');
        source.replaceWith(svg);
      }
    }
  };
})();
`;
fs.writeFileSync('assets/lucide.js', '/* Lucide icon data (ISC). Native DSS rendering adapter.\n' + license + '\n*/\n' + runtime);
console.log(`Built ${names.size} local icons (${fs.statSync('assets/lucide.js').size} bytes).`);
