import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CHECKOUT_SCHEMA } from '../server/checkout-store.mjs';

// Resolve the runtime shipped with the pinned Cloudflare CLI. Never load local .env.
const require = createRequire(await realpath('node_modules/wrangler/package.json'));
const { Miniflare, Log, LogLevel, convertV4MiniflareOptions } = await import(pathToFileURL(require.resolve('miniflare')).href);
const root = resolve('out');
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: true, scriptPath: resolve('out/_worker.js'), compatibilityDate: '2026-10-01',
  d1Databases: ['CHECKOUT_DB'], bindings: { CHECKOUT_RECOVERY_SECRET: 'test-only-recovery-secret-not-production' }, log: new Log(LogLevel.ERROR),
  serviceBindings: { ASSETS: async request => {
    const path = new URL(request.url).pathname;
    let file = resolve(root, `.${decodeURIComponent(path)}`);
    if (!file.startsWith(root + sep) && file !== root) return new Response('Not found', { status: 404 });
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      return new Response(await readFile(file), { headers: { 'Content-Type': extname(file) === '.html' ? 'text/html' : 'application/octet-stream' } });
    } catch { return new Response('Not found', { status: 404 }); }
  } },
}));
try {
  const database = await runtime.getD1Database('CHECKOUT_DB');
  for (const statement of CHECKOUT_SCHEMA.split(';').map(value => value.trim()).filter(Boolean)) await database.prepare(statement).run();
  assert.equal((await runtime.dispatchFetch('https://shop.test/')).status, 200);
  for (const path of ['/book/', '/book/daytime/', '/book/vip/']) {
    const response = await runtime.dispatchFetch(`https://shop.test${path}`);
    assert.equal(response.status, 200, path);
    assert.ok(!(await response.text()).includes('book.squareup.com'), `${path} must keep booking on this site`);
  }
  const home = await (await runtime.dispatchFetch('https://shop.test/')).text();
  assert.ok(home.includes('href="/book/"'), 'The home page must link to the booking selection.');
  assert.ok(!home.includes('book.squareup.com'), 'No home-page CTA may send visitors to Square hosted booking.');
  assert.ok((await readFile('out/_redirects', 'utf8')).includes('/booking-demo/* /book/ 301'), 'Cloudflare must redirect the old demo URL.');
  assert.ok((await readFile('out/_headers', 'utf8')).startsWith('/book/*\n'), 'Booking pages must retain their Content Security Policy.');
  for (const path of ['/_worker.js', '/.env', '/server/checkout.mjs', '/assets/private.js.map']) assert.equal((await runtime.dispatchFetch(`https://shop.test${path}`)).status, 404);
  const config = await runtime.dispatchFetch('https://shop.test/api/booking/config');
  assert.equal(config.status, 503, 'No Square secrets were loaded, so the API must fail closed.');
  assert.equal(config.headers.get('Cache-Control'), 'no-store');
  assert.equal((await runtime.dispatchFetch('https://shop.test/api/booking/reservation/confirm', { method: 'POST', headers: { Origin: 'https://attacker.test' }, body: '{}' })).status, 403);
  assert.equal((await runtime.dispatchFetch('https://shop.test/api/booking/webhook', { method: 'POST', body: '{}' })).status, 404);
  console.log('Cloudflare workerd validation passed: assets, private-path denial, D1 rate-limit schema, missing-secret guards, Origin checks and webhook guard. No production credentials or network payment calls were used.');
} finally { await runtime.dispose(); }
