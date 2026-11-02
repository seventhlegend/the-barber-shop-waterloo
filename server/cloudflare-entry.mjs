import { createBookingApi, MAX_BOOKING_BODY_BYTES } from './square-booking.mjs';
import { createD1CheckoutStore } from './checkout-store.mjs';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
const json = (body, status) => new Response(JSON.stringify(body), { status, headers });
const encoder = new TextEncoder();
const privatePath = /(?:^|\/)(?:\.env[^/]*|\.dev\.vars[^/]*|\.git|\.booking-data|server|functions|_functions|_worker\.js[^/]*)(?:\/|$)|\.map$/i;

export function isPrivatePath(path) {
  try { return privatePath.test(decodeURIComponent(path)); } catch { return true; }
}

async function limitRequest(request, env, url, now = Date.now()) {
  const origin = request.headers.get('origin');
  const allowed = (env.BOOKING_ALLOWED_ORIGINS || url.origin).split(',').map(value => value.trim());
  if (!allowed.includes(url.origin) || (origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Please use the booking form on this site.' }, 403);
  if (request.method === 'POST' && origin !== url.origin) return json({ error: 'Please use the booking form on this site.' }, 403);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return json({ error: 'A secure connection is required.' }, 403);
  if (!env.CHECKOUT_DB || !(env.CHECKOUT_RECOVERY_SECRET?.length >= 32)) return json({ error: 'Online booking is not configured yet. Please contact the shop.' }, 503);
  const group = url.pathname.endsWith('/status') ? 'status' : (url.pathname.includes('/checkout/') || url.pathname.includes('/reservation/') || url.pathname.includes('/hold/')) ? 'checkout' : 'calendar';
  const maximum = group === 'checkout' ? 10 : group === 'status' ? 120 : 60;
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${env.CHECKOUT_RECOVERY_SECRET}:${request.headers.get('cf-connecting-ip') || 'unknown'}:${group}:${Math.floor(now / 60000)}`));
  const key = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  const row = await env.CHECKOUT_DB.prepare('INSERT INTO booking_rate_limits (key, hits, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1 RETURNING hits').bind(key, now + 120000).first();
  if (row.hits > maximum) {
    const response = json({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
    response.headers.set('Retry-After', '60');
    return response;
  }
  await env.CHECKOUT_DB.prepare('DELETE FROM booking_rate_limits WHERE expires_at < ?').bind(now).run();
  return null;
}

async function webhook(request, env, ctx, api) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY || !env.SQUARE_WEBHOOK_NOTIFICATION_URL || !env.CHECKOUT_DB) return json({ error: 'Not found.' }, 404);
  if (request.url !== env.SQUARE_WEBHOOK_NOTIFICATION_URL) return json({ error: 'Invalid notification URL.' }, 403);
  const signature = request.headers.get('x-square-hmacsha256-signature');
  if (!signature || signature.length > 128 || Number(request.headers.get('content-length')) > 262144) return json({ error: 'Invalid notification.' }, 403);
  const reader = request.body?.getReader();
  let size = 0;
  const chunks = [];
  if (!reader) return json({ error: 'Invalid notification.' }, 400);
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 262144) { await reader.cancel(); return json({ error: 'Notification too large.' }, 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = new TextDecoder().decode(bytes);
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  let verified = false;
  try { verified = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(signature), char => char.charCodeAt(0)), encoder.encode(env.SQUARE_WEBHOOK_NOTIFICATION_URL + body)); } catch { /* Malformed signature. */ }
  if (!verified) return json({ error: 'Invalid notification signature.' }, 403);
  let event;
  try { event = JSON.parse(body); } catch { return json({ error: 'Invalid notification.' }, 400); }
  if (!event.event_id || typeof event.event_id !== 'string' || event.event_id.length > 128 || !['booking.created', 'booking.updated'].includes(event.type)) return json({ received: true }, 200);
  const inserted = await env.CHECKOUT_DB.prepare('INSERT INTO booking_webhook_events (event_id, received_at) VALUES (?, ?) ON CONFLICT(event_id) DO NOTHING RETURNING event_id').bind(event.event_id, Date.now()).first();
  if (inserted) ctx.waitUntil(Promise.resolve(api.recoverPending()).catch(() => {}));
  return json({ received: true }, 200);
}

export async function handleCloudflareRequest(request, env, ctx = { waitUntil() {} }) {
  const url = new URL(request.url);
  if (isPrivatePath(url.pathname)) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if (!url.pathname.startsWith('/api/booking/')) return json({ error: 'Not found.' }, 404);
  try {
    const api = createBookingApi(env, { store: env.CHECKOUT_DB ? createD1CheckoutStore(env.CHECKOUT_DB) : undefined });
    if (url.pathname === '/api/booking/webhook') return await webhook(request, env, ctx, api);
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
    if (Number(request.headers.get('content-length')) > MAX_BOOKING_BODY_BYTES) return json({ error: 'Request too large.' }, 413);
    const rejected = await limitRequest(request, env, url);
    if (rejected) return rejected;
    return await api(request);
  } catch { return json({ error: 'Online booking is temporarily unavailable. Please try again or contact the shop.' }, 503); }
}

export default { fetch: handleCloudflareRequest };
