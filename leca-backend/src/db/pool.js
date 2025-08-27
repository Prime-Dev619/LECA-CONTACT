const { Pool } = require('pg');
const { databaseUrl } = require('../config/env');

const pool = new Pool({ connectionString: databaseUrl, max: 10, idleTimeoutMillis: 30000 });

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PG error', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    // eslint-disable-next-line no-console
    console.log('slow query', { text, duration, rows: res.rowCount });
  }
  return res;
}

module.exports = { pool, query };

