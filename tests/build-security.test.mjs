import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditBuild } from '../scripts/audit-build.mjs';

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), 'barber-build-audit-'));
  try {
    await mkdir(join(directory, '.well-known'));
    for (const [name, content] of Object.entries({ 'index.html': '<html>Booking</html>', '_worker.js': 'export default {}', '_routes.json': '{}', '.well-known/apple-developer-merchantid-domain-association': 'public-domain-association' })) await writeFile(join(directory, name), content);
    return await run(directory);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('a clean complete Cloudflare export passes artifact auditing', () => fixture(async directory => {
  const result = await auditBuild(directory, { secrets: [] });
  assert.equal(result.secretOccurrences, 0);
  assert.equal(result.serverBundle, true);
}));

test('env files, local databases, source maps and raw server files cannot be packaged', async () => {
  for (const name of ['.env', '.env.production', '.dev.vars', 'private.sqlite', 'app.js.map', 'server/private.js']) await fixture(async directory => {
    if (name.includes('/')) await mkdir(join(directory, 'server'));
    await writeFile(join(directory, name), 'private artifact');
    await assert.rejects(auditBuild(directory, { secrets: [] }), /private artifact/);
  });
});

test('actual secret values are rejected even inside the server bundle', () => fixture(async directory => {
  await writeFile(join(directory, '_worker.js'), 'const accidentalToken = "test-secret-must-not-ship"; export default {}');
  await assert.rejects(auditBuild(directory, { secrets: ['test-secret-must-not-ship'] }), /private value/);
}));

test('server-only configuration references cannot enter public client files', () => fixture(async directory => {
  await writeFile(join(directory, 'app.js'), 'window.token = process.env.SQUARE_ACCESS_TOKEN');
  await assert.rejects(auditBuild(directory, { secrets: [] }), /public asset/);
}));


test('payment SDKs and Payments API code cannot return in a booking-only release', async () => {
  for (const code of ['https://web.squarecdn.com/v1/square.js', 'https://pay.google.com', '/v2/payments']) await fixture(async directory => {
    await writeFile(join(directory, 'app.js'), code);
    await assert.rejects(auditBuild(directory, { secrets: [] }), /removed online-payment integration/);
  });
});
