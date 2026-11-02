import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleCloudflareRequest } from '../server/cloudflare-entry.mjs';
import { CHECKOUT_SCHEMA } from '../server/checkout-store.mjs';

function fixture() {
  const db = new DatabaseSync(':memory:'); db.exec(CHECKOUT_SCHEMA);
  const env = {
    CHECKOUT_RECOVERY_SECRET: 'test-only-long-secret-for-cloudflare-rate-limits',
    CHECKOUT_DB: { prepare: sql => ({ bind: (...args) => ({ first: async () => db.prepare(sql).get(...args) || null, all: async () => ({ results: db.prepare(sql).all(...args) }), run: async () => ({ meta: { changes: db.prepare(sql).run(...args).changes } }) }) }) },
    ASSETS: { fetch: async () => new Response('public asset') },
  };
  const tasks = [];
  return { db, env, tasks, ctx: { waitUntil: task => tasks.push(task) } };
}
const request = (path, options = {}) => new Request(`https://shop.test${path}`, options);

test('private Worker, env, source and source-map paths are never served as assets', async () => {
  const f = fixture();
  for (const path of ['/_worker.js', '/_worker.js.map', '/_functions/route.js', '/server/checkout.mjs', '/functions/api.js', '/.env', '/.env.production', '/.dev.vars', '/.booking-data/checkouts.sqlite', '/.git/config', '/assets/app.js.map']) assert.equal((await handleCloudflareRequest(request(path), f.env, f.ctx)).status, 404, path);
  assert.equal(await (await handleCloudflareRequest(request('/.well-known/apple-developer-merchantid-domain-association'), f.env, f.ctx)).text(), 'public asset');
});

test('missing database or recovery secret fails closed without exposing settings', async () => {
  const f = fixture();
  const response = await handleCloudflareRequest(request('/api/booking/config'), { ASSETS: f.env.ASSETS }, f.ctx);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.ok(!(await response.text()).includes(f.env.CHECKOUT_RECOVERY_SECRET));
});

test('cross-origin and untrusted host requests are rejected before using the database', async () => {
  const f = fixture();
  assert.equal((await handleCloudflareRequest(request('/api/booking/reservation/prepare', { method: 'POST', headers: { Origin: 'https://attacker.test' } }), f.env, f.ctx)).status, 403);
  assert.equal((await handleCloudflareRequest(request('/api/booking/config', { headers: { 'Sec-Fetch-Site': 'cross-site' } }), f.env, f.ctx)).status, 403);
  assert.equal((await handleCloudflareRequest(request('/api/booking/config'), { ...f.env, BOOKING_ALLOWED_ORIGINS: 'https://other.test' }, f.ctx)).status, 403);
  assert.equal(f.db.prepare('SELECT count(*) AS count FROM booking_rate_limits').get().count, 0);
});

test('rate limits are atomic, grouped, and do not store IP addresses', async () => {
  const f = fixture();
  for (let i = 0; i < 60; i++) await handleCloudflareRequest(request('/api/booking/config', { headers: { 'CF-Connecting-IP': '192.0.2.42' } }), f.env, f.ctx);
  const response = await handleCloudflareRequest(request('/api/booking/config', { headers: { 'CF-Connecting-IP': '192.0.2.42' } }), f.env, f.ctx);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  const rows = f.db.prepare('SELECT * FROM booking_rate_limits').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].hits, 61);
  assert.ok(!JSON.stringify(rows).includes('192.0.2.42'));
});

test('unsupported methods, unknown APIs and oversized requests fail before reaching Square', async () => {
  const f = fixture();
  assert.equal((await handleCloudflareRequest(request('/api/other'), f.env, f.ctx)).status, 404);
  assert.equal((await handleCloudflareRequest(request('/api/booking/config', { method: 'DELETE' }), f.env, f.ctx)).status, 405);
  assert.equal((await handleCloudflareRequest(request('/api/booking/reservation/confirm', { method: 'POST', headers: { Origin: 'https://shop.test', 'Content-Length': '9000' }, body: 'x'.repeat(9000) }), f.env, f.ctx)).status, 413);
});

test('unsigned webhook requests cannot trigger recovery', async () => {
  const f = fixture();
  const env = { ...f.env, SQUARE_WEBHOOK_SIGNATURE_KEY: 'test-webhook-key', SQUARE_WEBHOOK_NOTIFICATION_URL: 'https://shop.test/api/booking/webhook' };
  assert.equal((await handleCloudflareRequest(request('/api/booking/webhook', { method: 'POST', body: '{}' }), env, f.ctx)).status, 403);
  assert.equal(f.tasks.length, 0);
});

test('valid signed webhooks are deduplicated and only then schedule recovery', async () => {
  const f = fixture();
  const env = { ...f.env, SQUARE_WEBHOOK_SIGNATURE_KEY: 'test-webhook-key', SQUARE_WEBHOOK_NOTIFICATION_URL: 'https://shop.test/api/booking/webhook' };
  const body = JSON.stringify({ event_id: 'event-1', type: 'booking.created' });
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(env.SQUARE_WEBHOOK_NOTIFICATION_URL + body)))));
  for (let i = 0; i < 2; i++) assert.equal((await handleCloudflareRequest(request('/api/booking/webhook', { method: 'POST', headers: { 'x-square-hmacsha256-signature': signature }, body }), env, f.ctx)).status, 200);
  await Promise.all(f.tasks);
  assert.equal(f.tasks.length, 1);
  assert.equal(f.db.prepare('SELECT count(*) AS count FROM booking_webhook_events').get().count, 1);
  assert.equal((await handleCloudflareRequest(request('/api/booking/webhook', { method: 'POST', headers: { 'x-square-hmacsha256-signature': signature }, body: body + ' ' }), env, f.ctx)).status, 403);
});
