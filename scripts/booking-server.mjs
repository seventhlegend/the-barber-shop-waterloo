import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createBookingApi, MAX_BOOKING_BODY_BYTES } from '../server/square-booking.mjs';
import { createLocalCheckoutStore } from '../server/local-checkout-store.mjs';
import { isPrivatePath } from '../server/cloudflare-entry.mjs';

const root = resolve('out');
const ledger = createLocalCheckoutStore();
const api = createBookingApi({ ...process.env, CHECKOUT_RECOVERY_SECRET: process.env.CHECKOUT_RECOVERY_SECRET || ledger.secret }, { store: ledger.store });
const port = Number(process.env.BOOKING_DEMO_PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
let recovering = false;
setInterval(async () => { if (recovering) return; recovering = true; try { await api.recoverPending(); } catch { /* Persisted attempts are retried on the next pass. */ } finally { recovering = false; } }, 30000).unref();

createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || '/', `http://${incoming.headers.host || `localhost:${port}`}`);
    if (isPrivatePath(url.pathname)) { outgoing.writeHead(404); outgoing.end('Not found'); return; }
    if (url.pathname.startsWith('/api/booking/')) {
      const chunks = [];
      let size = 0;
      for await (const chunk of incoming) {
        size += chunk.length;
        if (size > MAX_BOOKING_BODY_BYTES) { outgoing.writeHead(413); outgoing.end('Request too large'); return; }
        chunks.push(chunk);
      }
      const request = new Request(url, { method: incoming.method, headers: incoming.headers, ...(['GET', 'HEAD'].includes(incoming.method) ? {} : { body: Buffer.concat(chunks) }) });
      const response = await api(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(await response.text());
      return;
    }
    if (!['GET', 'HEAD'].includes(incoming.method)) { outgoing.writeHead(405); outgoing.end(); return; }
    if (url.pathname === '/booking-demo' || url.pathname.startsWith('/booking-demo/')) { outgoing.writeHead(301, { Location: '/book/' }); outgoing.end(); return; }
    let file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (file !== root && !file.startsWith(root + sep)) { outgoing.writeHead(403); outgoing.end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const data = await readFile(file);
    const security = extname(file) === '.html' && (url.pathname === '/book' || url.pathname.startsWith('/book/')) ? { 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; frame-src 'none'; connect-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'" } : {};
    outgoing.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', ...security });
    outgoing.end(incoming.method === 'HEAD' ? undefined : data);
  } catch {
    outgoing.writeHead(404, { 'Content-Type': 'text/plain' });
    outgoing.end('Not found. Run pnpm build:static before starting the booking server.');
  }
}).listen(port, '127.0.0.1', () => console.log(`Booking: http://localhost:${port}/book/`));
