import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { CHECKOUT_SCHEMA, createCheckoutStore } from './checkout-store.mjs';

export function createLocalCheckoutStore({ directory = '.booking-data' } = {}) {
  const folder = resolve(directory);
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  chmodSync(folder, 0o700);
  const secretFile = resolve(folder, 'recovery-secret');
  let secret;
  try { secret = readFileSync(secretFile, 'utf8').trim(); }
  catch { secret = randomBytes(32).toString('hex'); writeFileSync(secretFile, secret, { mode: 0o600, flag: 'wx' }); }
  const filename = resolve(folder, 'checkouts.sqlite');
  const database = new DatabaseSync(filename);
  chmodSync(filename, 0o600);
  database.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  database.exec(CHECKOUT_SCHEMA);
  const store = createCheckoutStore({
    first: async (sql, args) => database.prepare(sql).get(...args),
    all: async (sql, args) => database.prepare(sql).all(...args),
    run: async (sql, args) => ({ changes: database.prepare(sql).run(...args).changes }),
  });
  return { store, secret, close: () => database.close() };
}
