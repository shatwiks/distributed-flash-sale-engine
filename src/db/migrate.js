const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function runMigration() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  console.log(`[Migration] Reading schema from: ${schemaPath}`);
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('[Migration] Executing schema.sql against PostgreSQL...');
    await pool.query(sql);
    console.log('[Migration] Database tables created / verified successfully.');
  } catch (err) {
    console.error('[Migration Error] Failed to execute schema.sql:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigration();
