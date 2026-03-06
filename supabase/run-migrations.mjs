/**
 * Phase 8 migration runner — uses node-postgres (pg) for direct DB access.
 *
 * Setup (one-time):
 *   1. Go to Supabase dashboard → Settings → Database → Connection string → URI
 *   2. Add to .env.local:  DATABASE_URL=postgresql://postgres:[password]@db.gssjwzxxlvhjlvvmzqox.supabase.co:5432/postgres
 *   3. Run:  node supabase/run-migrations.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = join(__dir, '..', '.env.local');
const envVars = {};
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const eq = line.indexOf('=');
  if (eq > 0) envVars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});

const DATABASE_URL = envVars['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error(
    'Add DATABASE_URL to .env.local.\n' +
    'Get it from: Supabase dashboard → Settings → Database → Connection string → URI'
  );
  process.exit(1);
}

// ── Dynamic import of pg (install if missing) ─────────────────────────────────
let Client;
try {
  ({ Client } = await import('pg'));
} catch {
  console.log('Installing pg…');
  const { execSync } = await import('child_process');
  execSync('npm install pg --no-save', { stdio: 'inherit' });
  ({ Client } = await import('pg'));
}

// ── Run each SQL file in alphabetical order ───────────────────────────────────
const files = readdirSync(__dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

console.log(`\nRunning ${files.length} migrations:\n`);

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const file of files) {
  process.stdout.write(`  ${file}… `);
  const sql = readFileSync(join(__dir, file), 'utf8');
  try {
    await client.query(sql);
    console.log('✓');
  } catch (err) {
    console.log(`✗\n    ${err.message}`);
  }
}

await client.end();
console.log('\nDone.\n');
