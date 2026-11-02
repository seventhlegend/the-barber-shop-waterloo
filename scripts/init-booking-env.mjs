import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// A new checkout gets its own key. Never replace an existing environment/key.
const template = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
try {
  await writeFile('.env', template.replace(/^CHECKOUT_RECOVERY_SECRET=$/m, `CHECKOUT_RECOVERY_SECRET=${randomBytes(32).toString('hex')}`), { flag: 'wx', mode: 0o600 });
  console.log('Created private .env with online booking disabled and a new recovery key. Add Square credentials locally; see PROJECT_GUIDE.md. No secret values were printed.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Existing .env preserved. For an existing deployment, keep the same recovery key as Cloudflare.');
}
