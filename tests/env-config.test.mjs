import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/check-booking-env.mjs');
const secret = 'fake-secret-must-not-appear-in-env-check-output';
const valid = { SQUARE_ACCESS_TOKEN: secret, SQUARE_LOCATION_ID: 'shop', SQUARE_ENVIRONMENT: 'production', BOOKING_ENABLED: 'true', CHECKOUT_RECOVERY_SECRET: secret, BOOKING_ALLOWED_ORIGINS: 'https://shop.test', SQUARE_WEBHOOK_SIGNATURE_KEY: secret, SQUARE_WEBHOOK_NOTIFICATION_URL: 'https://shop.test/api/booking/webhook' };
function check(overrides = {}, flags = []) {
  const folder = mkdtempSync(join(tmpdir(), 'waterloo-env-test-'));
  try {
    writeFileSync(join(folder, '.env'), Object.entries({ ...valid, ...overrides }).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n'), { mode: 0o600 });
    const result = spawnSync(process.execPath, [script, ...flags], { cwd: folder, encoding: 'utf8', env: { PATH: process.env.PATH } });
    const output = `${result.stdout}${result.stderr}`;
    assert.ok(!output.includes(secret));
    return { code: result.status, output };
  } finally { rmSync(folder, { recursive: true, force: true }); }
}

test('complete env readiness check succeeds without disclosing any secret values', () => {
  const result = check();
  assert.equal(result.code, 0);
  assert.match(result.output, /Local booking configuration: OK/);
});
test('missing webhook key is actionable and strict webhook checks fail', () => {
  assert.match(check({ SQUARE_WEBHOOK_SIGNATURE_KEY: '' }).output, /TODO: SQUARE_WEBHOOK_SIGNATURE_KEY/);
  assert.equal(check({ SQUARE_WEBHOOK_SIGNATURE_KEY: '' }, ['--require-webhook']).code, 1);
});
test('invalid origins, recovery keys, environment and required Square settings fail closed', () => {
  for (const invalid of [{ BOOKING_ALLOWED_ORIGINS: 'https://shop.test/extra' }, { CHECKOUT_RECOVERY_SECRET: 'short' }, { SQUARE_ENVIRONMENT: 'invalid' }, { SQUARE_ACCESS_TOKEN: '' }, { SQUARE_WEBHOOK_NOTIFICATION_URL: 'http://shop.test/api/booking/webhook' }, { BOOKING_DEMO_PORT: '99999' }]) assert.equal(check(invalid).code, 1);
});
