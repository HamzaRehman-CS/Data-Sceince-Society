const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..'); process.chdir(root);
execFileSync(process.execPath, ['scripts/build-icons.cjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'assets/input.css', '-o', 'assets/tailwind.css', '--minify'], { stdio: 'inherit' });
fs.mkdirSync('dist/assets', { recursive: true });
for (const name of ['server.js','backend.js','sanity-data.json']) fs.copyFileSync(name, path.join('dist', name));
for(const dir of ['website','admin','accounts'])fs.cpSync(dir,path.join('dist',dir),{recursive:true});
for (const name of ['tailwind.css', 'lucide.js', 'dss-mark.svg']) fs.copyFileSync(path.join('assets', name), path.join('dist/assets', name));
fs.cpSync('uploads', 'dist/uploads', { recursive: true });
fs.writeFileSync('dist/package.json', JSON.stringify({ name: 'dss-website', private: true, scripts: { start: 'node server.js' } }, null, 2));
console.log('Built dist. Run it with node dist/server.js; a Node server is required.');

fs.cpSync('assets/fonts','dist/assets/fonts',{recursive:true});
