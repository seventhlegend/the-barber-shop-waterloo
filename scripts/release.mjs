import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Every release gets the same checks; no manual sequence to remember.
for (const args of [
  ...(existsSync('.env') ? [['scripts/check-booking-env.mjs']] : []),
  ['--test', 'tests/booking-api.test.mjs', 'tests/reservations.test.mjs', 'tests/holds.test.mjs', 'tests/booking-summary.test.mjs', 'tests/cloudflare.test.mjs', 'tests/build-security.test.mjs', 'tests/env-config.test.mjs'],
  ['scripts/build-static.mjs'],
  ['scripts/test-cloudflare-runtime.mjs'],
  ['scripts/release-zip.mjs'],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
