import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHoldService } from '../server/holds.mjs';
import { CHECKOUT_SCHEMA, HOLD_SCHEMA, createCheckoutStore } from '../server/checkout-store.mjs';

const secret = 'test-only-hold-secret-at-least-thirty-two-characters';
const base = { staffId: 'tatar', staffName: 'Tatar', durationMinutes: 40, serviceVariationVersion: 123 };
const slots = ['11:00', '11:20', '11:40'].map(clock => ({ ...base, id: clock, startAt: `2026-10-30T${clock}:00Z` }));

test('the additive hold migration is repeatable and preserves existing encrypted reservation records', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(CHECKOUT_SCHEMA.replace(HOLD_SCHEMA, ''));
  db.prepare('INSERT INTO checkouts (id,auth_hash,encrypted,phase,terminal,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run('old-reference','existing-auth','existing-encrypted-data','COMPLETE',1,1,1);
  db.exec(HOLD_SCHEMA); db.exec(HOLD_SCHEMA);
  assert.equal(db.prepare('SELECT encrypted FROM checkouts WHERE id = ?').get('old-reference').encrypted,'existing-encrypted-data');
  assert.equal(db.prepare('SELECT count(*) AS total FROM booking_holds').get().total,0);
  db.close();
});
const input = (slotId = '11:00', serviceId = 'classic') => ({ id: crypto.randomUUID(), token: 'x'.repeat(64), date: '2026-10-30', staffId: 'tatar', slotId, serviceId });
function fixture() {
  const db = new DatabaseSync(':memory:'); db.exec(CHECKOUT_SCHEMA);
  const store = createCheckoutStore({ first: async (sql,args) => db.prepare(sql).get(...args), all: async (sql,args) => db.prepare(sql).all(...args), run: async (sql,args) => ({ changes: db.prepare(sql).run(...args).changes }) });
  let current = Date.parse('2026-10-30T09:00:00Z');
  const holds = createHoldService({ store, secret, now: () => current, availability: async selection => ({ slots, service: { id: selection.serviceId, price: 3700 }, policy: { version: 'policy' } }) });
  return { holds, store, db, now: () => current, elapse: ms => { current += ms; } };
}

test('a hold lasts exactly ten server minutes; status and idempotent reload never extend it', async () => {
  const f=fixture(), details=input(); const first=await f.holds.create(details);
  assert.equal(Date.parse(first.expiresAt)-Date.parse(first.serverNow),600000);
  f.elapse(240000);
  assert.equal((await f.holds.create(details)).expiresAt,first.expiresAt);
  f.elapse(360000);
  assert.equal((await f.holds.status(details)).status,'EXPIRED');
  await assert.rejects(f.holds.active(details),/hold has ended/);
  assert.equal((await f.holds.create(input())).status,'ACTIVE');
});

test('concurrent same-slot claims have exactly one winner and partial overlaps across services are blocked', async () => {
  const f=fixture();
  const results=await Promise.allSettled([f.holds.create(input()), f.holds.create(input())]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  await assert.rejects(f.holds.create(input('11:20','another-service')),/holding this time/);
  assert.equal((await f.holds.create(input('11:40'))).status,'ACTIVE');
});

test('holds are encrypted, authenticated and cannot be reused for a different selection', async () => {
  const f=fixture(), details=input(); await f.holds.create(details);
  await assert.rejects(f.holds.release({...details,token:'z'.repeat(64)}),/verified/);
  await assert.rejects(f.holds.create({...details,serviceId:'another'}),/another selection/);
  assert.equal((await f.holds.status(details)).status,'ACTIVE');
  const row=f.db.prepare('SELECT * FROM booking_holds').get();
  assert.ok(!row.encrypted.includes('classic'));
  assert.ok(!JSON.stringify(row).includes(details.token));
});

test('explicit release makes the interval available immediately', async () => {
  const f=fixture(), first=input(); await f.holds.create(first);
  assert.equal((await f.holds.release(first)).status,'RELEASED');
  assert.equal((await f.holds.create(input())).status,'ACTIVE');
});

test('only an active unexpired hold can transfer atomically to a processing reservation', async () => {
  const f=fixture(), first=input(); await f.holds.create(first);
  const start=Date.parse(slots[0].startAt), end=start+40*60000;
  assert.equal(await f.store.claimSlot('forged','tatar',start,end,f.now(),true),false);
  assert.equal(await f.store.claimSlot(first.id,'tatar',start,end,f.now(),true),true);
  await f.store.consumeHold(first.id);
  f.elapse(600001);
  await assert.rejects(f.holds.create(input()),/holding this time/);
  await f.holds.release(first); // A browser release cannot unlock a processing claim.
  await assert.rejects(f.holds.create(input()),/holding this time/);
  await f.store.releaseSlot(first.id);
  assert.equal((await f.holds.create(input())).status,'ACTIVE');
});

test('claiming an expired hold fails, even if the client timer claims time remains', async () => {
  const f=fixture(), first=input(); await f.holds.create(first); f.elapse(600000);
  const start=Date.parse(slots[0].startAt);
  assert.equal(await f.store.claimSlot(first.id,'tatar',start,start+40*60000,f.now(),true),false);
});
