const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStorage } = require('../lib/storage');
const { committedResponse } = require('../lib/committed-response');

function fakePool() {
  let state, transaction, commits = 0, failCommit = false;
  return {
    failNextCommit() { failCommit = true; },
    state: () => structuredClone(state),
    commits: () => commits,
    async connect() {
      return { release() {}, async query(sql, values) {
        if (sql === 'BEGIN') transaction = structuredClone(state);
        else if (sql.startsWith('INSERT INTO public.dss_state')) transaction ||= JSON.parse(values[0]);
        else if (sql.startsWith('UPDATE public.dss_state')) transaction = JSON.parse(values[0]);
        else if (sql.startsWith('SELECT data FROM public.dss_state')) return { rows: [{ data: structuredClone(transaction) }] };
        else if (sql === 'COMMIT') { if (failCommit) { failCommit = false; throw new Error('Database unavailable'); } state = transaction; commits++; }
        else if (sql === 'ROLLBACK') transaction = undefined;
        return { rows: [] };
      } };
    },
    async end() {}
  };
}
function response() {
  return { headers: { 'x-content-type-options': 'nosniff' }, sent: [], statusCode: 200,
    getHeaders() { return this.headers; }, getHeaderNames() { return Object.keys(this.headers); },
    setHeader(name, value) { this.headers[name] = value; }, removeHeader(name) { delete this.headers[name]; },
    writeHead(...args) { this.sent.push(['head', ...args]); return this; },
    write(...args) { this.sent.push(['write', ...args]); return true; },
    end(...args) { this.sent.push(['end', ...args]); return this; }
  };
}
test('concurrent updates serialize, failed commits roll back and later requests recover', async () => {
  const pool = fakePool(), storage = createStorage({ pool }), seed = { count: 0 };
  await Promise.all(Array.from({ length: 5 }, () => storage.run(seed, async state => { state.count++; await storage.save(state); })));
  assert.equal(pool.state().count, 5);
  await assert.rejects(storage.run(seed, async state => { state.count = 99; await storage.save(state); pool.failNextCommit(); }));
  assert.equal(pool.state().count, 5);
  await storage.run(seed, async state => { state.count++; await storage.save(state); });
  assert.equal(pool.state().count, 6);
  assert.throws(() => storage.save({ count: 100 }), /active transaction/);
});
test('commit failure sends no success response or session cookie; successful streams continue after commit', async () => {
  const res = response();
  await assert.rejects(committedResponse(res, async () => { res.setHeader('set-cookie', 'session=abc'); res.writeHead(201); res.end('Saved'); throw new Error('Commit failed'); }));
  assert.deepEqual(res.sent, []); assert.equal(res.headers['set-cookie'], undefined); assert.equal(res.headers['x-content-type-options'], 'nosniff');
  await committedResponse(res, async () => { res.writeHead(200); res.write('initial'); assert.deepEqual(res.sent, []); });
  res.write('next');
  assert.deepEqual(res.sent, [['head', 200], ['write', 'initial'], ['write', 'next']]);
});
