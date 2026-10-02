'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const fs = require('node:fs');
const path = require('node:path');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

function createStorage({ env = process.env, pool: providedPool } = {}) {
  if (!env.DATABASE_URL && !providedPool) return null;
  const { Pool } = require('pg');
  const pool = providedPool || new Pool({ connectionString: env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000, idleTimeoutMillis: 20000 });
  const context = new AsyncLocalStorage();
  let ready;
  pool.on?.('error', () => { ready = null; });
  async function initialize(seed) {
    if (!ready) ready = (async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query("SET LOCAL lock_timeout = '10s'");
        await client.query("SET LOCAL statement_timeout = '15s'");
        await client.query('SELECT pg_advisory_xact_lock(1967357)');
        await client.query(schema);
        await client.query('INSERT INTO public.dss_state (id, data) VALUES (1, $1) ON CONFLICT DO NOTHING', [JSON.stringify(seed)]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
      finally { client.release(); }
    })().catch(error => { ready = null; throw error; });
    return ready;
  }
  let queue = Promise.resolve();
  function run(seed, handler, {readOnly=false}={}) {
    const operation = queue.then(async () => {
      await initialize(seed); const client = await pool.connect();
      if(readOnly){
        try{const {rows}=await client.query('SELECT data FROM public.dss_state WHERE id = 1');return await context.run({client,readOnly:true},()=>handler(rows[0].data));}
        finally{client.release();}
      }
      try {
        await client.query('BEGIN');
        await client.query("SET LOCAL lock_timeout = '10s'");
        await client.query("SET LOCAL statement_timeout = '15s'");
        const { rows } = await client.query('SELECT data FROM public.dss_state WHERE id = 1 FOR UPDATE');
        const result = await context.run({client,readOnly:false}, () => handler(rows[0].data));
        await client.query('COMMIT'); return result;
      } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
      finally { client.release(); }
    });
    queue = operation.catch(() => {}); return operation;
  }
  const transaction = (write=false) => { const current=context.getStore();if(!current)throw new Error('Storage operation requires an active transaction.');if(write&&current.readOnly)throw new Error('Cannot write during a read-only request.');return current.client; };
  return {
    run,
    save: data => transaction(true).query('UPDATE public.dss_state SET data = $1 WHERE id = 1', [JSON.stringify(data)]),
    writeFile: (name, data) => transaction(true).query('INSERT INTO public.dss_files (name, data) VALUES ($1, $2)', [name, data]),
    readFile: async name => (await transaction().query('SELECT data FROM public.dss_files WHERE name = $1', [name])).rows[0]?.data,
    close: () => pool.end()
  };
}
module.exports = { createStorage };
