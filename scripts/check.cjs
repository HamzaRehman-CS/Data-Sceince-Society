const fs = require('node:fs'), { execFileSync } = require('node:child_process');
const scripts=['server.js','backend.js',...['website/scripts','admin'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.js')).map(f=>dir+'/'+f))];
for (const file of scripts) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
for (const file of ['website/pages','accounts','admin'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.html')).map(f=>dir+'/'+f))) {
  const source = fs.readFileSync(file, 'utf8');
  console.log(file + ': ' + [...source.matchAll(/on(?:click|submit|change)="([^"]+)/g)].map(m => m[1]).join(' | '));
  if (/cdn.tailwindcss.com|three.min.js|gsap.min.js|lenis.min.js|dss_admin_auth|password === 'PASS'/.test(source)) throw new Error('Legacy runtime found in ' + file);
}
