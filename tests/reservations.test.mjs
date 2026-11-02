import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createReservationCrypto, createReservationService } from '../server/reservations.mjs';
import { createHoldService } from '../server/holds.mjs';
import { policyFromProfile } from '../server/booking-summary.mjs';
import { CHECKOUT_SCHEMA, createCheckoutStore } from '../server/checkout-store.mjs';

const secret = 'test-only-recovery-secret-at-least-thirty-two-characters';
const slot = { id: '2026-10-30T11:00:00Z|tatar', startAt: '2026-10-30T11:00:00Z', staffId: 'tatar', staffName: 'Tatar', durationMinutes: 40, serviceVariationVersion: 123 };
const service = { id: 'classic', name: 'Classic Haircut & Styling', price: 3700, currency: 'GBP', durationMinutes: 40 };
const customer = { givenName: 'Booking', familyName: 'Test', email: 'booking@example.com', phone: '07700900000', consent: true };
const profile = { booking_enabled: true, support_seller_level_writes: true, booking_policy: 'ACCEPT_ALL', allow_user_cancel: true, business_appointment_settings: { cancellation_window_seconds: 10800 } };
const policy = await policyFromProfile(profile);
const input = () => ({ id: crypto.randomUUID(), token: 'x'.repeat(64), date: '2026-10-30', staffId: 'tatar', serviceId: service.id, slotId: slot.id, expectedAmount: 3700, policyAccepted: true, policyVersion: policy.version, customer });
function fixture(options = {}) {
  const database = new DatabaseSync(':memory:'); database.exec(CHECKOUT_SCHEMA);
  const store = createCheckoutStore({ first: async (sql, args) => database.prepare(sql).get(...args), all: async (sql, args) => database.prepare(sql).all(...args), run: async (sql, args) => ({ changes: database.prepare(sql).run(...args).changes }) });
  const calls = []; const saved = new Map();
  let booking, amount = options.amount ?? 3700, available = true, failed = false, time = Date.parse('2026-10-30T09:00:00Z');
  const square = async (path, body, method = body ? 'POST' : 'GET') => {
    assert.ok(!path.includes('/payments'), 'A reservation must never call Payments API');
    calls.push({ path, body: structuredClone(body), method });
    if (options.pausePath === path && !failed) { failed = true; throw Object.assign(new Error('Disconnected'), { uncertain: true }); }
    const key = body?.idempotency_key;
    if (key && saved.has(key)) { assert.deepEqual(body, saved.get(key).body); return structuredClone(saved.get(key).result); }
    let result;
    if (path === '/v2/bookings/business-booking-profile') result = { business_booking_profile: profile };
    else if (path === '/v2/customers/search') result = { customers: options.existingCustomer ? [{ id: 'existing-customer', phone_number: '+447700900000', ...(options.existingBirthday ? { birthday: options.existingBirthday } : {}) }] : [] };
    else if (path.startsWith('/v2/customers/') && method === 'PUT') result = { customer: { id: 'existing-customer', birthday: body.birthday } };
    else if (path === '/v2/customers') result = { customer: { id: 'customer' } };
    else if (path === '/v2/bookings') {
      if (options.bookingFailed) throw new Error('Rejected');
      booking = { id: 'booking', status: options.pending ? 'PENDING' : 'ACCEPTED', version: 0, ...body.booking }; result = { booking };
    } else if (path.startsWith('/v2/bookings?')) result = { bookings: options.conflict && (!options.conflictAfterCreate || booking) ? [{ id: 'external', status: 'ACCEPTED', start_at: '2026-10-30T11:20:00Z', appointment_segments: [{ team_member_id: 'tatar', duration_minutes: 40 }] }] : [] };
    else if (path.endsWith('/cancel')) { booking.status = 'CANCELLED_BY_SELLER'; result = { booking }; }
    else if (path === '/v2/bookings/booking') result = { booking: options.cancelBeforeVerification ? { ...booking, status: 'CANCELLED_BY_SELLER' } : booking };
    else throw new Error(`Unexpected mock call: ${path}`);
    if (key) saved.set(key, { body: structuredClone(body), result: structuredClone(result) });
    if (options.responseLost && path === '/v2/bookings' && !failed) { failed = true; throw Object.assign(new Error('Lost booking response'), { uncertain: true }); }
    return structuredClone(result);
  };
  const availability = async selection => { calls.push({ path: 'availability', method: 'GET', selection }); return { slots: available ? [slot] : [], service: { ...service, price: amount }, policy }; };
  const holds = createHoldService({ store, secret, availability, now: () => time });
  const create = () => createReservationService({ store, secret, square, availability, holds, now: () => time, locationId: 'shop', environment: 'sandbox' });
  const api = create();
  const prepare = async details => { await holds.create(details); return api.prepare(details); };
  return { api, prepare, holds, create, store, database, calls, booking: () => booking, price: value => { amount = value; }, available: value => { available = value; }, time: value => { time = value; } };
}

test('prepare does not create a customer or booking; confirmation books a paid service without any payment', async () => {
  const f = fixture(), details = input();
  assert.equal((await f.prepare(details)).status, 'READY');
  assert.ok(f.calls.every(call => call.method === 'GET'));
  const result = await f.api.confirm({ ...details, confirmed: true });
  assert.equal(result.status, 'COMPLETE'); assert.equal(result.amount, 3700);
  assert.equal(result.paymentStatus, 'PAY_AT_SHOP'); assert.equal(result.bookingStatus, 'ACCEPTED');
  assert.equal(result.paymentId, undefined);
  assert.match(f.booking().seller_note, /PAY AT SHOP. Quoted service price £37.00. NO ONLINE PAYMENT TAKEN/);
  assert.doesNotMatch(f.booking().seller_note, /PAID ONLINE|DO NOT CHARGE AGAIN/);
  assert.ok(f.calls.filter(c => c.path === 'availability').every(c => c.selection.serviceId === service.id));
});

test('free consultation books without a payment and uses an accurate seller note', async () => {
  const f = fixture({ amount: 0 }), details = { ...input(), expectedAmount: 0 }; await f.prepare(details);
  const result = await f.api.confirm({ ...details, confirmed: true });
  assert.equal(result.status, 'COMPLETE'); assert.equal(result.paymentStatus, 'NOT_REQUIRED');
  assert.match(f.booking().seller_note, /FREE CONSULTATION/);
});

test('duplicate confirms and restart reuse one Square booking', async () => {
  const f = fixture(), details = input(); await f.prepare(details);
  const first = await f.api.confirm({ ...details, confirmed: true });
  const second = await f.create().confirm({ ...details, confirmed: true });
  assert.equal(first.bookingId, second.bookingId);
  assert.equal(f.calls.filter(c => c.path === '/v2/bookings').length, 1);
});

test('lost booking response recovers the exact persisted body with the same idempotency key', async () => {
  const f = fixture({ responseLost: true }), details = input(); await f.prepare(details);
  assert.equal((await f.api.confirm({ ...details, confirmed: true })).status, 'PROCESSING');
  assert.equal((await f.create().status(details, true)).status, 'COMPLETE');
  assert.equal(f.calls.filter(c => c.path === '/v2/bookings').length, 2);
});

test('webhook recovery can finish a reservation without a browser', async () => {
  const f = fixture({ pausePath: '/v2/customers' }), details = input(); await f.prepare(details);
  assert.equal((await f.api.confirm({ ...details, confirmed: true })).status, 'PROCESSING');
  await f.create().recoverPending(); assert.equal((await f.api.status(details)).status, 'COMPLETE');
});

test('price, availability and expired selection changes fail before a booking is created', async () => {
  for (const type of ['price', 'availability', 'expiry']) {
    const f = fixture(), details = input(); await f.prepare(details);
    if (type === 'price') f.price(3900);
    if (type === 'availability') f.available(false);
    if (type === 'expiry') f.time(Date.parse('2026-10-30T09:16:00Z'));
    assert.equal((await f.api.confirm({ ...details, confirmed: true })).status, 'FAILED');
    assert.equal(f.booking(), undefined);
  }
});

test('conflicts are rejected before creation and own bookings are cancelled if a conflict appears after creation', async () => {
  for (const after of [false, true]) {
    const f = fixture({ conflict: true, conflictAfterCreate: after }), details = input(); await f.prepare(details);
    assert.equal((await f.api.confirm({ ...details, confirmed: true })).status, 'FAILED');
    if (after) assert.equal(f.booking().status, 'CANCELLED_BY_SELLER'); else assert.equal(f.booking(), undefined);
  }
});

test('pending or externally cancelled Square bookings never show confirmation', async () => {
  for (const options of [{ pending: true }, { cancelBeforeVerification: true }, { bookingFailed: true }]) {
    const f = fixture(options), details = input(); await f.prepare(details);
    assert.equal((await f.api.confirm({ ...details, confirmed: true })).status, 'FAILED');
  }
});

test('an overlapping hold prevents another customer from preparing the same time', async () => {
  const f = fixture({ pausePath: '/v2/customers' }), first = input(), second = input(); await f.prepare(first);
  await assert.rejects(f.prepare(second), /holding this time/);
  assert.equal((await f.api.confirm({ ...first, confirmed: true })).status, 'PROCESSING');
  await f.api.recoverPending(); assert.equal((await f.api.status(first)).status, 'COMPLETE');
});

test('contact data is encrypted, tokens authenticate status and drafts never book automatically', async () => {
  const f = fixture(), details = input(); await f.prepare(details);
  assert.ok(!JSON.stringify(f.database.prepare('SELECT * FROM checkouts').all()).includes(customer.email));
  await assert.rejects(f.api.status({ ...details, token: 'z'.repeat(64) }), /verified/);
  await f.api.recoverPending(); assert.equal((await f.api.status(details, true)).status, 'READY');
  assert.equal(f.booking(), undefined);
});

test('explicit consent and confirmation are required; an exact customer match is reused', async () => {
  const f = fixture({ existingCustomer: true }), details = input();
  await assert.rejects(f.prepare({ ...details, customer: { ...customer, consent: false } }), /agree/);
  await f.prepare(details); await assert.rejects(f.api.confirm(details), /confirm your appointment/);
  await f.api.confirm({ ...details, confirmed: true });
  assert.ok(!f.calls.some(c => c.path === '/v2/customers'));
  assert.equal(f.booking().customer_id, 'existing-customer');
});

test('card tokens and payment inputs are rejected rather than silently accepted', async () => {
  const f = fixture(), details = input();
  await assert.rejects(f.prepare({ ...details, sourceId: 'cnon:card' }), /not accepted/);
  await f.prepare(details);
  for (const field of ['sourceId', 'verificationToken', 'payment', 'card', 'amount_money']) await assert.rejects(f.api.confirm({ ...details, confirmed: true, [field]: 'forged' }), /not accepted/);
  assert.equal(f.booking(), undefined);
});

test('legacy authorized, pending and completed payment records cannot be resumed or reported as pay-at-shop', async () => {
  for (const phase of ['DRAFT', 'AUTH_PENDING', 'AUTHORIZED', 'CAPTURE_PENDING', 'MARK_PAID_PENDING', 'COMPLETE']) {
    const f = fixture(), details = input(), crypto = await createReservationCrypto(secret);
    await f.store.insert({ id: details.id, authHash: await crypto.auth(`${details.id}:${details.token}`), encrypted: await crypto.seal({ phase, service, slot, environment: 'sandbox', locationId: 'shop', payment: { id: 'old-payment' }, booking: { id: 'old-booking' } }), phase, now: Date.now() });
    const state = await f.api.status(details, true);
    assert.equal(state.status, 'NEEDS_ATTENTION'); assert.equal(state.legacy, true);
    assert.equal(state.paymentStatus, undefined);
    await assert.rejects(f.api.confirm({ ...details, confirmed: true }), /previous system/);
    await f.api.recoverPending(); assert.equal(f.calls.length, 0);
  }
});

test('date of birth and appointment note reach Square only on explicit confirmation', async () => {
  const f=fixture(), details={...input(),customer:{...customer,birthday:'1990-05-20'},appointmentNote:'Please use scissors.'};
  await f.prepare(details);
  assert.ok(!f.calls.some(c=>c.path==='/v2/customers'));
  assert.equal((await f.api.confirm({...details,confirmed:true})).status,'COMPLETE');
  assert.equal(f.calls.find(c=>c.path==='/v2/customers').body.birthday,'1990-05-20');
  assert.equal(f.booking().customer_note,'Please use scissors.');
});

test('birthday validation, note size, policy acceptance and direct hold bypass are enforced server-side', async () => {
  for(const birthday of ['2026-02-30','2027-01-01','not-a-date']) {
    const f=fixture(); await assert.rejects(f.prepare({...input(),customer:{...customer,birthday}}),/date of birth/);
  }
  {const f=fixture(); await assert.rejects(f.prepare({...input(),appointmentNote:'a'.repeat(1001)}),/1,000/);}
  {const f=fixture(); await assert.rejects(f.prepare({...input(),policyAccepted:false}),/cancellation policy/);}
  {const f=fixture(); await assert.rejects(f.prepare({...input(),policyVersion:'old-policy'}),/cancellation policy/);}
  {const f=fixture(); await assert.rejects(f.api.prepare(input()),/hold could not be verified/);}
});

test('existing birthdays are preserved; a missing birthday can be filled without replacing other customer fields', async () => {
  for(const existingBirthday of [undefined,'1985-02-03']) {
    const f=fixture({existingCustomer:true,existingBirthday}), details={...input(),customer:{...customer,birthday:'1990-05-20'}};
    await f.prepare(details); await f.api.confirm({...details,confirmed:true});
    const updates=f.calls.filter(c=>c.method==='PUT');
    assert.equal(updates.length,existingBirthday?0:1);
    if(existingBirthday) assert.match(f.booking().customer_note,/Existing profile birthday retained/);
    else assert.deepEqual(updates[0].body,{birthday:'1990-05-20'});
  }
});

test('processing recovery keeps its slot locked after the ten-minute browser hold ends', async () => {
  const f=fixture({pausePath:'/v2/customers'}), details=input(); await f.prepare(details);
  assert.equal((await f.api.confirm({...details,confirmed:true})).status,'PROCESSING');
  f.time(Date.parse('2026-10-30T09:11:00Z'));
  assert.equal((await f.create().status(details,true)).status,'COMPLETE');
});
