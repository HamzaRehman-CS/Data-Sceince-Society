'use strict';
const fs = require('node:fs');
for (const name of ['.env', '.env.local']) if (fs.existsSync(name)) process.loadEnvFile(name);
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL privately before checking the database.');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 });
  try {
    const result = await pool.query("SELECT c.relname, c.relrowsecurity, has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS anon_access, has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS member_access FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname IN ('dss_state','dss_files')");
    if (result.rows.length !== 2 || result.rows.some(row => !row.relrowsecurity || row.anon_access || row.member_access)) throw new Error('Database protection check failed.');
    const state = await pool.query('SELECT data FROM public.dss_state WHERE id = 1');
    if (!state.rows[0]?.data?.content || !Array.isArray(state.rows[0].data.users)) throw new Error('Database content check failed.');
    console.log('Database connection, application state and browser access restrictions passed.');
  } finally { await pool.end(); }
}
main().catch(error => { console.error(/^(Database |Set DATABASE_URL)/.test(error.message) ? error.message : 'Database connection failed. Check credentials and connection settings.'); process.exitCode = 1; });
