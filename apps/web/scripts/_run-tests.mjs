import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const raw = readFileSync('c:/Users/finst/Projects/perfect-cleaners/apps/web/.env.local', 'utf-8');
const env = { ...process.env };
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  const key = t.slice(0, i).trim();
  const val = t.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  env[key] = val;
}

const args = process.argv.slice(2);
const result = spawnSync('npx', ['playwright', 'test', ...args], {
  cwd: 'c:/Users/finst/Projects/perfect-cleaners/apps/web',
  env,
  stdio: 'inherit',
  shell: true,
});
process.exit(result.status ?? 1);
