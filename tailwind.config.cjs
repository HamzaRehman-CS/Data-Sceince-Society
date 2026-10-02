module.exports = {
  content: ['./website/pages/*.html', './website/scripts/*.js'], darkMode: 'class',
  theme: { extend: { fontFamily: { heading: ['Outfit', 'sans-serif'], sans: ['Plus Jakarta Sans', 'sans-serif'], ui: ['Plus Jakarta Sans', 'sans-serif'], mono: ['Plus Jakarta Sans', 'monospace'] }, colors: { obsidian: '#030712', midnightNavy: '#0f172a', accentBlue: { light: 'rgb(var(--color-sky-rgb) / <alpha-value>)', DEFAULT: 'rgb(var(--color-accent-rgb) / <alpha-value>)', dark: '#0369a1' } } } }, plugins: []
};
