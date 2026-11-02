import { build } from 'esbuild';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { auditBuild } from './audit-build.mjs';
import { CHECKOUT_SCHEMA, HOLD_SCHEMA } from '../server/checkout-store.mjs';

const assetsOnly = process.argv.includes('--assets-only');
const output = resolve('out');
// Clean only the generated output; never touch .env or the local checkout ledger.
await rm(output, { recursive: true, force: true });
const result = spawnSync(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'build'], { stdio: 'inherit', env: process.env });
if (result.status !== 0) process.exit(result.status || 1);

for (const name of ['_headers', '_redirects']) {
  try { await copyFile(resolve('public', name), resolve(output, name)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

if (!assetsOnly) {
  const bundle = await build({ entryPoints: ['server/cloudflare-entry.mjs'], outfile: resolve(output, '_worker.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, sourcemap: false, metafile: true, legalComments: 'none' });
  if (Object.values(bundle.metafile.outputs).some(file => file.imports.length)) throw new Error('The server bundle has unresolved imports.');
  await writeFile(resolve(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*', '/_worker.js*', '/_functions/*', '/server/*', '/functions/*', '/.env*', '/.dev.vars*', '/.booking-data/*', '/.git/*', '/*.map'], exclude: [] }, null, 2) + '\n');
  await mkdir('cloudflare', { recursive: true });
  await writeFile('cloudflare/checkout-schema.sql', CHECKOUT_SCHEMA.trim() + '\n');
  await mkdir('cloudflare/migrations', { recursive: true });
  await writeFile('cloudflare/migrations/0001-booking-holds.sql', HOLD_SCHEMA.trim() + '\n');
}

const audit = await auditBuild(output, { requireWorker: !assetsOnly });
console.log(`Build complete: ${output}`);
console.log(`Security audit: ${JSON.stringify(audit)}`);
