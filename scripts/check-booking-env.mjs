import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

// Report names and readiness only. Never print values, tokens or fingerprints.
let local = {};
try { local = parseEnv(await readFile('.env', 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw new Error('The local .env file could not be read.'); }
const env = { ...local, ...process.env };
const errors = [];
const warnings = [];
for (const name of ['SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID']) {
  if (!env[name]?.trim()) errors.push(`${name} is missing.`);
}
if (!['production', 'sandbox'].includes(env.SQUARE_ENVIRONMENT || 'production')) errors.push('SQUARE_ENVIRONMENT must be production or sandbox.');
const bookingEnabled = env.BOOKING_ENABLED ?? env.CHECKOUT_ENABLED ?? 'false';
if (!['true', 'false'].includes(bookingEnabled)) errors.push('BOOKING_ENABLED must be true or false.');
if (bookingEnabled === 'true' && (env.CHECKOUT_RECOVERY_SECRET?.length || 0) < 32) errors.push('CHECKOUT_RECOVERY_SECRET must contain at least 32 characters. Preserve the existing key.');
if (env.SQUARE_API_VERSION && !/^\d{4}-\d{2}-\d{2}$/.test(env.SQUARE_API_VERSION)) errors.push('SQUARE_API_VERSION must use YYYY-MM-DD.');
if (!env.BOOKING_ALLOWED_ORIGINS) warnings.push('BOOKING_ALLOWED_ORIGINS is unset; the Worker defaults to the request origin.');
else for (const value of env.BOOKING_ALLOWED_ORIGINS.split(',')) {
  try { const url = new URL(value.trim()); if (url.protocol !== 'https:' || url.origin !== value.trim()) throw new Error(); }
  catch { errors.push('BOOKING_ALLOWED_ORIGINS must contain comma-separated HTTPS origins without paths.'); break; }
}
if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY) warnings.push('SQUARE_WEBHOOK_SIGNATURE_KEY is empty. Copy the endpoint Signature Key from Square; webhook recovery is not enabled yet.');
if (!env.SQUARE_WEBHOOK_NOTIFICATION_URL) warnings.push('SQUARE_WEBHOOK_NOTIFICATION_URL is missing.');
else {
  try { const url = new URL(env.SQUARE_WEBHOOK_NOTIFICATION_URL); if (url.protocol !== 'https:' || url.pathname !== '/api/booking/webhook' || url.search || url.hash) throw new Error(); }
  catch { errors.push('SQUARE_WEBHOOK_NOTIFICATION_URL must be the exact HTTPS /api/booking/webhook URL.'); }
}
if (env.BOOKING_DEMO_PORT && (!/^\d+$/.test(env.BOOKING_DEMO_PORT) || Number(env.BOOKING_DEMO_PORT) < 1 || Number(env.BOOKING_DEMO_PORT) > 65535)) errors.push('BOOKING_DEMO_PORT must be a port from 1 to 65535.');
for (const error of errors) console.error(`ERROR: ${error}`);
for (const warning of warnings) console.warn(`TODO: ${warning}`);
console.log('Cloudflare additionally requires a CHECKOUT_DB D1 binding and checkout-schema.sql. Apply cloudflare/migrations/0001-booking-holds.sql for this upgrade. The local .env does not configure Cloudflare.');
console.log('Online payments are disabled in code. No Square Application ID or wallet setup is required. Booking webhooks are configured separately.');
if (errors.length || (process.argv.includes('--require-webhook') && (!env.SQUARE_WEBHOOK_SIGNATURE_KEY || !env.SQUARE_WEBHOOK_NOTIFICATION_URL))) process.exitCode = 1;
else console.log('Local booking configuration: OK. No secret values were printed.');
