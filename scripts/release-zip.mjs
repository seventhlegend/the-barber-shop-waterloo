import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { auditBuild } from './audit-build.mjs';

await auditBuild('out');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const archive = resolve(`the-barber-shop-cloudflare-build-${stamp}-${crypto.randomUUID().slice(0, 8)}.zip`);
const result = spawnSync('zip', ['-q', '-r', archive, ...(await readdir('out')).sort()], { cwd: resolve('out'), stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
const extracted = await mkdtemp(join(tmpdir(), 'waterloo-release-audit-'));
try {
  const unpacked = spawnSync('unzip', ['-q', archive, '-d', extracted], { stdio: 'inherit' });
  if (unpacked.status !== 0) throw new Error('The release ZIP could not be verified.');
  await auditBuild(extracted);
} catch (error) {
  await rm(archive, { force: true });
  throw error;
} finally { await rm(extracted, { recursive: true, force: true }); }
const checksum = createHash('sha256').update(await readFile(archive)).digest('hex');
await writeFile(`${archive}.sha256`, `${checksum}  ${archive.split('/').pop()}\n`);
console.log(`Created ${archive}`);
console.log(`Verified extracted ZIP; SHA-256 saved beside archive. Only public build output and the server Worker are packaged; no .env or local database.`);
