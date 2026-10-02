const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { gzipSync } = require('node:zlib');

(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'dss-page-experience-'));
  const shots = path.resolve('.private/qa-experience');
  fs.mkdirSync(shots, { recursive: true });
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: '0', DSS_DATA_DIR: data, DSS_MANUAL_SETUP: '0' },
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
  });
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      let output = '';
      server.stdout.on('data', d => {
        output += d;
        const match = /DSS website: (http:\/\/localhost:\d+)/.exec(output);
        if (match) resolve(match[1]);
      });
      server.once('error', reject);
      server.once('exit', code => reject(new Error('Server exited ' + code)));
    });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(), errors = [], failedAssets = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) failedAssets.push(response.url()); });
    const names = ['index', 'about', 'projects', 'research', 'events', 'resources', 'blog', 'community', 'join', 'ambassador', 'opportunities', 'contact'];
    const signatures = new Set();
    const timings = [];
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const name of names) {
        const response = await page.goto(base + '/' + name + '.html', { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200, name);
        await page.waitForFunction(() => window.DSS?.content);
        await expect(page.locator('main h1')).toHaveCount(1);
        assert.equal(await page.locator('main h1').evaluate(el => getComputedStyle(el).color), await page.locator('body').evaluate(el => getComputedStyle(el).color), name + ' heading must contrast with its background');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ' overflow at ' + width);
        const ids = await page.locator('[data-cms-id]').evaluateAll(els => els.map(e => e.dataset.cmsId));
        assert.equal(new Set(ids).size, ids.length, name + ' duplicate editor IDs');
        assert.ok(await page.locator('[data-page-art]').count(), name + ' has no signature artwork');
        await expect(page.locator('i[data-lucide]')).toHaveCount(0);
        if (width === 1440) {
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.allSettled(document.getAnimations().filter(a => a.timeline === document.timeline && a.effect.getTiming().iterations !== Infinity).map(a => a.finished));
          });
          signatures.add(await page.locator('[data-page-art]').first().getAttribute('data-page-art'));
          await page.screenshot({ path: path.join(shots, name + '-desktop.png') });
          timings.push({ page: name, ...await page.evaluate(() => {
            const entry = performance.getEntriesByType('navigation')[0];
            return { domMs: Math.round(entry.domContentLoadedEventEnd), scriptBytes: performance.getEntriesByType('resource').filter(r => r.initiatorType === 'script').reduce((sum, r) => sum + r.transferSize, 0) };
          }) });
        }
        if (width === 390 && ['about', 'community', 'ambassador', 'resources', 'opportunities'].includes(name)) {
          await page.screenshot({ path: path.join(shots, name + '-mobile.png'), fullPage: true });
        }
      }
    }
    assert.equal(signatures.size, names.length, 'Every public page has a distinct artwork');
    console.log('48 responsive page checks passed.');

    await page.goto(base + '/research.html');
    const art = page.locator('[data-page-art]').first();
    await expect(art).toHaveAttribute('data-motion-running', 'true');
    await page.getByRole('button', { name: 'Pause page animations', exact: true }).click();
    await expect(art).toHaveAttribute('data-motion-running', 'false');
    await page.goto(base + '/index.html');
    await expect(page.locator('.surface-stage')).toHaveAttribute('data-running', 'false');
    await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#motion-toggle').click();
    await expect(page.locator('.surface-stage')).toHaveAttribute('data-running', 'true');
    await page.goto(base + '/research.html');
    await expect(page.locator('[data-page-art]')).toHaveAttribute('data-motion-running', 'true');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-page-art]')).toHaveClass(/motion-offscreen/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('main h1').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-page-art]')).toHaveAttribute('data-motion-running', 'false');
    await expect(page.locator('[data-page-motion-toggle]')).toBeDisabled();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => applySiteContent({ ...DSS.content, theme: { ...DSS.content.theme, canvasEnabled: false } }));
    await expect(page.locator('[data-page-art]')).toHaveAttribute('data-motion-running', 'false');
    // Static layout and content remain usable without JavaScript.
    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await staticContext.newPage();
    for (const name of ['about', 'community', 'ambassador']) {
      await staticPage.goto(base + '/' + name + '.html');
      await expect(staticPage.locator('main h1')).toBeVisible();
      assert.ok(await staticPage.locator('main').innerText());
    }
    await staticContext.close();

    // Public profiles, opportunities, and new editable sections remain connected to the CMS.
    const adminContext = await browser.newContext();
    await adminContext.request.post(base + '/api/auth/login', { data: { email: 'admin', password: 'pass' } });
    const draftResponse = await adminContext.request.get(base + '/api/admin/content');
    const model = await draftResponse.json();
    model.draft.collections.team.push({ id: 'campus-test', name: 'Campus Test Profile', category: 'ambassador', role: 'Campus ambassador', bio: 'A public profile approved for this test.' });
    model.draft.collections.opportunities.push({ id: 'private-opportunity-test', title: 'Member notebook collaboration', desc: 'A published member contribution opportunity.', type: 'Project', requiresAuth: true });
    model.draft.pages.about ||= {};
    model.draft.pages.about['cms-about-experience-fact-title-0'] = { text: 'A community of learners' };
    const saved = await (await adminContext.request.put(base + '/api/admin/content', { data: { revision: model.revision, content: model.draft } })).json();
    assert.ok(saved.revision);
    assert.equal((await adminContext.request.post(base + '/api/admin/publish', { data: { revision: saved.revision } })).status(), 200);
    await page.goto(base + '/about.html');
    await expect(page.locator('#society-at-a-glance')).toContainText('A community of learners');
    await expect(page.locator('#ambassador-grid .soc-team-card')).toHaveCount(1);
    await expect(page.locator('#ambassador-grid')).toContainText('Campus Test Profile');
    const teamCount = await page.locator('#team-grid .soc-team-card').count();
    await page.getByRole('button', { name: 'Directors', exact: true }).click();
    assert.ok(await page.locator('#team-grid .soc-team-card').count() < teamCount);
    await page.goto(base + '/opportunities.html');
    await expect(page.locator('#opportunities-grid')).not.toContainText('Member notebook collaboration');
    await expect(page.locator('.opportunity-access')).toBeVisible();
    const adminPage = await adminContext.newPage();
    await adminPage.goto(base + '/opportunities.html');
    await expect(adminPage.locator('#opportunities-grid')).toContainText('Member notebook collaboration');
    await adminPage.goto(base + '/about.html?edit=1');
    await expect(adminPage.locator('body')).toHaveClass(/page-motion-paused/);
    await adminPage.goto(base + '/admin.html');
    await adminPage.getByRole('button', { name: 'Content library', exact: true }).click();
    await adminPage.locator('#collection').selectOption('team');
    await adminPage.getByRole('button', { name: 'Add record', exact: true }).click();
    await expect(adminPage.getByLabel('Profile group', { exact: true })).toHaveValue('executive');
    await adminPage.getByLabel('Profile group', { exact: true }).selectOption('ambassador');
    await adminPage.getByRole('button', { name: 'Cancel', exact: true }).click();

    const extraBytes = ['website/styles/page-motion.css', 'website/scripts/page-motion.js'].reduce((sum, file) => sum + gzipSync(fs.readFileSync(file)).length, 0);
    assert.ok(extraBytes < 10000, 'Shared motion assets exceed the 10 KB gzip budget');
    assert.deepEqual(errors, []);
    assert.deepEqual(failedAssets, []);
    fs.writeFileSync(path.join(shots, 'local-performance.json'), JSON.stringify({ sharedMotionGzipBytes: extraBytes, timings }, null, 2));
    console.log(`Page experience passed: distinct artwork, pause persistence, offscreen pause, reduced motion, disabled motion, static fallback, public ambassador profiles, editable facts, member-only opportunities, editor mode and ${extraBytes} bytes of shared motion assets (gzip).`);
    console.log('Screenshots: ' + shots);
  } finally {
    await browser?.close();
    if (server.exitCode === null) { const exited = new Promise(r => server.once('exit', r)); server.kill(); await exited; }
    const resolved = path.resolve(data);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
