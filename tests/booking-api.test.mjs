import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { CHECKOUT_SCHEMA, createCheckoutStore } from '../server/checkout-store.mjs';
import { createBookingApi, londonMidnight, SERVICE_ID } from '../server/square-booking.mjs';
import { BRAZILIAN_SERVICE_ID, DAYTIME_CATEGORY_ID, DAYTIME_POLICY, VIP_CATEGORY_ID, isDaytimeSlot, isVipSlot, isServiceSlot } from '../src/lib/booking-policy.mjs';

const TATAR_ID = 'TMwTM4USQOtky2wH';
const BEYHAN_ID = 'TMjP0H-6qwXwl7ie';

const env = { SQUARE_ACCESS_TOKEN: 'test-secret-must-never-leak', SQUARE_LOCATION_ID: 'shop', SQUARE_ENVIRONMENT: 'production', CHECKOUT_ENABLED: 'true' };
const now = () => Date.parse('2026-10-29T10:00:00Z');
const segment = { service_variation_id: SERVICE_ID, team_member_id: TATAR_ID, duration_minutes: 40, service_variation_version: 123 };
const slot = { start_at: '2026-10-30T11:00:00Z', location_id: 'shop', appointment_segments: [segment] };

function fixture(availability = [slot], options = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    if (options.failure) throw new Error('private internal details');
    const variations = [{ id: SERVICE_ID, item_variation_data: { item_id: 'classic', available_for_booking: true, team_member_ids: [TATAR_ID, BEYHAN_ID], service_duration: 2400000, pricing_type: 'FIXED_PRICING', price_money: { amount: 4100, currency: 'GBP' }, ...(typeof options.variation === 'function' ? options.variation() : options.variation) } }];
    const classic = { id: 'classic', type: 'ITEM', item_data: { name: 'Classic Haircut & Styling', product_type: 'APPOINTMENTS_SERVICE', categories: [{ id: DAYTIME_CATEGORY_ID }], variations } };
    const objects = typeof options.items === 'function' ? options.items(classic) : options.items || [classic];
    if (url.includes('/catalog/list?')) return Response.json({ objects });
    if (url.includes('/catalog/object/')) {
      const id = new URL(url).pathname.split('/').pop();
      const parent = objects.find(item => item.item_data?.variations?.some(value => value.id === id));
      return Response.json({ object: parent?.item_data.variations.find(value => value.id === id), related_objects: parent ? [parent] : [] });
    }
    if (new URL(url).pathname === '/v2/bookings/business-booking-profile' && !options.square) return Response.json({ business_booking_profile: { booking_enabled: true, support_seller_level_writes: true, booking_policy: 'ACCEPT_ALL', allow_user_cancel: true, business_appointment_settings: { cancellation_window_seconds: 10800 } } });
    if (url.includes('/team-member-booking-profiles?')) return Response.json({ errors: [], team_member_booking_profiles: [{ team_member_id: TATAR_ID, display_name: 'Tatar', is_bookable: true }, { team_member_id: BEYHAN_ID, display_name: 'Bayhan', is_bookable: true }, { team_member_id: 'other', display_name: 'Other', is_bookable: true }] });
    if (!url.endsWith('/availability/search') && options.square) return Response.json(await options.square(new URL(url).pathname, init));
    assert.ok(url.endsWith('/availability/search'), 'Only the read-only search endpoint may receive POST');
    return Response.json({ availabilities: typeof availability === 'function' ? availability() : availability, errors: [] });
  };
  return { api: createBookingApi(options.checkout ? { ...env, CHECKOUT_RECOVERY_SECRET: 'test-only-recovery-secret-at-least-32-chars', ...options.env } : env, { fetcher, now: options.now || now, ...(options.checkout ? { store: options.store || { get: async () => undefined, getHold: async () => undefined } } : {}) }), calls };
}
const vipId = 'vip-classic';
const vipItem = classic => ({ id: 'vip-parent', type: 'ITEM', item_data: { name: 'Classic Haircut & Styling - VIP Hours', description_plaintext: 'Square VIP description', product_type: 'APPOINTMENTS_SERVICE', categories: [{ id: VIP_CATEGORY_ID }], variations: [{ id: vipId, item_variation_data: { ...classic.item_data.variations[0].item_variation_data, item_id: 'vip-parent', price_money: { amount: 8200, currency: 'GBP' }, team_member_ids: [BEYHAN_ID] } }] } });
const request = (route, body, extra = {}) => new Request(`https://barber.test/api/booking/${route}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://barber.test', ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const selection = { date: '2026-10-30', staffId: 'any' };

test('London midnight respects the spring and autumn DST changes', () => {
  assert.equal(new Date(londonMidnight('2026-03-29')).toISOString(), '2026-03-29T00:00:00.000Z');
  assert.equal(new Date(londonMidnight('2026-03-30')).toISOString(), '2026-03-29T23:00:00.000Z');
  assert.equal(new Date(londonMidnight('2026-10-25')).toISOString(), '2026-10-24T23:00:00.000Z');
  assert.equal(new Date(londonMidnight('2026-10-26')).toISOString(), '2026-10-26T00:00:00.000Z');
});

test('config exposes only assigned barbers and uses the Square service price directly', async () => {
  const { api } = fixture();
  const response = await api(request('config'));
  const text = await response.text();
  assert.ok(!text.includes(env.SQUARE_ACCESS_TOKEN));
  const config = JSON.parse(text);
  assert.deepEqual(config.staff.map(staff => staff.name), ['Tatar', 'Bayhan']);
  assert.equal(config.service.price, 4100);
  assert.equal(config.service.durationMinutes, 40);
  assert.equal(config.paymentsEnabled, false);
  assert.equal(config.bookingsEnabled, false);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('availability uses live Square results, removes duplicates, unassigned staff, wrong services and evening slots', async () => {
  const { api, calls } = fixture([slot, slot, { ...slot, appointment_segments: [{ ...segment, team_member_id: 'other' }] }, { ...slot, appointment_segments: [{ ...segment, service_variation_id: 'vip' }] }, { ...slot, start_at: '2026-10-30T20:00:00Z' }, { ...slot, start_at: '2026-10-30T21:30:00Z' }]);
  const response = await api(request('availability', selection));
  const result = await response.json();
  assert.equal(result.slots.length, 1);
  assert.equal(result.slots[0].staffName, 'Tatar');
  const search = JSON.parse(calls.find(call => call.init.method === 'POST').init.body);
  assert.deepEqual(search.query.filter.segment_filters[0].team_member_id_filter.any, [TATAR_ID, BEYHAN_ID]);
});

test('empty calendar stays empty and does not fabricate appointments', async () => {
  const { api } = fixture([]);
  assert.deepEqual((await (await api(request('availability', selection))).json()).slots, []);
});

test('review rechecks Square and rejects a stale selection without taking payment', async () => {
  let available = true;
  const { api } = fixture(() => available ? [slot] : []);
  const first = await (await api(request('availability', selection))).json();
  available = false;
  const response = await api(request('review', { ...selection, slotId: first.slots[0].id }));
  assert.equal(response.status, 409);
});

test('valid review uses the Square price and explicitly reports no payment and no booking', async () => {
  const { api, calls } = fixture();
  const response = await api(request('review', { ...selection, slotId: `${slot.start_at}|${TATAR_ID}`, price: 1 }));
  const result = await response.json();
  assert.equal(result.price, 4100);
  assert.equal(result.service.price, result.price);
  assert.equal(result.paymentStatus, 'NOT_TAKEN');
  assert.equal(result.bookingStatus, 'NOT_CREATED');
  assert.equal(calls.filter(call => call.init.method === 'POST').length, 1);
});

test('Square price changes are reflected on refresh and rechecked at payment preview', async () => {
  let amount = 4100;
  const { api } = fixture([slot], { variation: () => ({ price_money: { amount, currency: 'GBP' } }) });
  assert.equal((await (await api(request('config'))).json()).service.price, 4100);
  amount = 4750;
  assert.equal((await (await api(request('availability', selection))).json()).service.price, 4750);
  amount = 4900;
  const result = await (await api(request('review', { ...selection, slotId: `${slot.start_at}|${TATAR_ID}`, price: 1 }))).json();
  assert.equal(result.price, 4900);
  assert.equal(result.service.price, 4900);
});

test('Square location-specific service prices take precedence', async () => {
  const { api } = fixture([slot], { variation: { price_description: 'Enjoy %10 OFF - £37', location_overrides: [{ location_id: 'another-shop', price_money: { amount: 9999, currency: 'GBP' } }, { location_id: 'shop', price_money: { amount: 3900, currency: 'GBP' } }] } });
  const result = await (await api(request('config'))).json();
  assert.equal(result.service.price, 3900);
});

test('missing or variable Square prices fail without falling back to a manually set price', async () => {
  for (const variation of [{ price_money: null }, { pricing_type: 'VARIABLE_PRICING' }, { price_money: { amount: -1, currency: 'GBP' } }, { location_overrides: [{ location_id: 'shop', pricing_type: 'VARIABLE_PRICING' }] }]) {
    const { api } = fixture([slot], { variation });
    assert.equal((await api(request('config'))).status, 503);
  }
});

test('invalid dates, unauthorized barbers and cross-origin requests are rejected', async () => {
  const { api } = fixture();
  for (const body of [{ ...selection, date: '2026-02-30' }, { ...selection, date: '2026-10-28' }, { ...selection, date: '2027-01-31' }, { ...selection, staffId: 'other' }]) assert.equal((await api(request('availability', body))).status, 400);
  assert.equal((await api(request('availability', selection, { Origin: 'https://other.test' }))).status, 403);
});

test('mutation routes stay blocked without a durable ledger and recovery secret, even with CHECKOUT_ENABLED=true', async () => {
  const { api, calls } = fixture();
  for (const route of ['checkout', 'bookings', 'customers']) assert.equal((await api(request(route, {}))).status, 405);
  assert.equal(calls.length, 0);
});

test('upstream errors are actionable and never disclose secrets or internal errors', async () => {
  const { api } = fixture([], { failure: true });
  const response = await api(request('config'));
  assert.equal(response.status, 502);
  const text = await response.text();
  assert.ok(!text.includes('private internal'));
  assert.ok(!text.includes(env.SQUARE_ACCESS_TOKEN));
});

test('invalid JSON and oversized requests fail without calling Square', async () => {
  const { api, calls } = fixture();
  const malformed = new Request('https://barber.test/api/booking/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await api(malformed)).status, 400);
  assert.equal((await api(request('review', { large: 'a'.repeat(9000) }))).status, 413);
  assert.equal(calls.length, 0);
});

test('Square numeric prices stay authoritative even when the unchanged description quotes a discount', async () => {
  let priceDescription = 'Haircuts %10 OFF - £37';
  let amount = 4100;
  const { api } = fixture([slot], { variation: () => ({ price_description: priceDescription, price_money: { amount, currency: 'GBP' } }) });
  const first = await (await api(request('config'))).json();
  assert.equal(first.services[0].price, 4100);
  assert.equal(first.services[0].basePrice, 4100);
  assert.equal(first.services[0].priceDescription, priceDescription);
  assert.equal(first.services[0].priceSource, 'SQUARE_PRICE_MONEY');
  priceDescription = 'Haircuts %10 OFF - £38.50';
  const available = await (await api(request('availability', selection))).json();
  assert.equal(available.service.price, 4100);
  assert.equal(available.service.priceDescription, priceDescription);
  amount = 4750;
  const review = await (await api(request('review', { ...selection, serviceId: SERVICE_ID, slotId: slot.start_at + '|' + TATAR_ID, price: 1 }))).json();
  assert.equal(review.price, 4750);
  assert.equal(review.service.price, 4750);
  assert.equal(review.service.priceDescription, priceDescription);
});

test('Square descriptions are passed through as text without interpreting amounts, percentages or ranges', async () => {
  for (const price_description of ['', 'Enjoy %10 OFF', 'From £37', '£37 or £41', '£37–40', 'Contact us', '50% deposit £20', '  Square text  ']) {
    const { api } = fixture([slot], { variation: { price_description } });
    const response = await api(request('config'));
    assert.equal(response.status, 200, price_description);
    const config = await response.json();
    assert.equal(config.service.price, 4100, price_description);
    assert.equal(config.service.priceDescription, price_description);
    assert.equal(config.service.priceSource, 'SQUARE_PRICE_MONEY');
  }
});

test('catalog includes all daytime services and selected-service staff and duration drive the search', async () => {
  const secondId = 'scissor-service';
  const items = classic => [classic, {
    id: 'scissor', type: 'ITEM', item_data: { name: 'Scissor Precision Cut', product_type: 'APPOINTMENTS_SERVICE', categories: [{ id: DAYTIME_CATEGORY_ID }], variations: [{ id: secondId, item_variation_data: { ...classic.item_data.variations[0].item_variation_data, item_id: 'scissor', team_member_ids: [BEYHAN_ID], service_duration: 2700000, price_money: { amount: 4400, currency: 'GBP' }, price_description: 'Enjoy %10 OFF - £39' } }] },
  }];
  const correct = { ...slot, appointment_segments: [{ service_variation_id: secondId, team_member_id: BEYHAN_ID, duration_minutes: 45 }] };
  const { api, calls } = fixture([slot, correct, { ...correct, appointment_segments: [{ ...correct.appointment_segments[0], duration_minutes: 40 }] }], { items });
  const config = await (await api(request('config'))).json();
  assert.equal(config.services.length, 2);
  const result = await (await api(request('availability', { ...selection, serviceId: secondId }))).json();
  assert.equal(result.service.price, 4400);
  assert.equal(result.service.priceDescription, 'Enjoy %10 OFF - £39');
  assert.equal(result.slots.length, 1);
  assert.equal(result.slots[0].staffId, BEYHAN_ID);
  assert.equal(result.slots[0].durationMinutes, 45);
  const search = JSON.parse(calls.find(call => call.init.method === 'POST').init.body);
  assert.equal(search.query.filter.segment_filters[0].service_variation_id, secondId);
  assert.deepEqual(search.query.filter.segment_filters[0].team_member_id_filter.any, [BEYHAN_ID]);
  assert.equal((await api(request('availability', { ...selection, serviceId: secondId, staffId: TATAR_ID }))).status, 400);
});

test('nonbookable, deleted, unknown-category, ambiguous-category and other-location services are rejected even with a forged API selection', async () => {
  for (const modify of [
    classic => { classic.item_data.categories = [{ id: 'vip-category' }]; },
    classic => { classic.item_data.categories = [{ id: DAYTIME_CATEGORY_ID }, { id: VIP_CATEGORY_ID }]; },
    classic => { classic.item_data.variations[0].item_variation_data.available_for_booking = false; },
    classic => { classic.is_deleted = true; },
    classic => { classic.item_data.product_type = 'REGULAR'; },
    classic => { classic.present_at_all_locations = false; classic.present_at_location_ids = ['another-shop']; },
    classic => { classic.item_data.variations[0].absent_at_location_ids = ['shop']; },
  ]) {
    const { api } = fixture([slot], { items: classic => { modify(classic); return [classic]; } });
    assert.equal((await api(request('availability', { ...selection, serviceId: SERVICE_ID }))).status, 400);
    assert.equal((await api(request('review', { ...selection, serviceId: SERVICE_ID, slotId: slot.start_at + '|' + TATAR_ID }))).status, 400);
  }
  const { api } = fixture();
  for (const serviceId of ['unknown', '../vip', {}, null]) assert.equal((await api(request('availability', { ...selection, serviceId }))).status, 400);
});

test('daytime cutoff is a shared London start-time rule, permitting later finishes and handling BST', async () => {
  assert.equal(isDaytimeSlot('2026-10-30T19:45:00Z', 40), true);
  assert.equal(isDaytimeSlot('2026-10-30T20:00:00Z', 40), false);
  assert.equal(isDaytimeSlot('2026-07-01T18:45:00Z', 40), true); // 19:45 BST
  assert.equal(isDaytimeSlot('2026-07-01T19:00:00Z', 40), false); // 20:00 BST
  const evening = { ...slot, start_at: '2026-10-30T19:45:00Z' };
  const late = { ...slot, start_at: '2026-10-30T20:00:00Z' };
  const { api } = fixture([evening, late]);
  const result = await (await api(request('availability', selection))).json();
  assert.deepEqual(result.slots.map(value => value.startAt), [evening.start_at]);
  assert.equal((await api(request('review', { ...selection, slotId: late.start_at + '|' + TATAR_ID }))).status, 409);
});

test('Brazilian Blow-Dry only starts from 18:00 until before 20:00, and may finish later', async () => {
  const { api } = fixture([17, 18, 19, 20].map(hour => ({ ...slot, start_at: `2026-10-30T${hour}:00:00Z`, appointment_segments: [{ ...segment, service_variation_id: BRAZILIAN_SERVICE_ID, duration_minutes: 150 }] })), {
    items: classic => { const variation = classic.item_data.variations[0]; variation.id = BRAZILIAN_SERVICE_ID; variation.item_variation_data.service_duration = 9000000; return [classic]; },
  });
  const result = await (await api(request('availability', { ...selection, serviceId: BRAZILIAN_SERVICE_ID }))).json();
  assert.equal(result.slots.length, 2);
  assert.deepEqual(result.slots.map(value => value.startAt), ['2026-10-30T18:00:00Z', '2026-10-30T19:00:00Z']);
});

test('the documented single switch enforces a finishing cutoff when enabled', () => {
  try {
    DAYTIME_POLICY.requireFinishByCutoff = true;
    assert.equal(isDaytimeSlot('2026-10-30T19:20:00Z', 40), true);
    assert.equal(isDaytimeSlot('2026-10-30T19:21:00Z', 40), false);
    assert.equal(isDaytimeSlot('2026-10-30T18:00:00Z', 150, 18 * 60), false);
  } finally { DAYTIME_POLICY.requireFinishByCutoff = false; }
});

test('reservation prepare rejects forged daytime evening and unknown service selections before any customer or payment write', async () => {
  const late = { ...slot, start_at: '2026-10-30T20:00:00Z' };
  const { api, calls } = fixture([late], { checkout: true });
  const details = { ...selection, serviceId: SERVICE_ID, id: crypto.randomUUID(), token: 'x'.repeat(64), slotId: late.start_at + '|' + TATAR_ID, expectedAmount: 4100, customer: { givenName: 'Test', familyName: 'Booking', email: 'test@example.com', phone: '07700900000', consent: true } };
  assert.equal((await api(request('hold/create', details))).status, 409);
  assert.equal((await api(request('hold/create', { ...details, serviceId: 'vip' }))).status, 400);
  assert.ok(calls.every(call => call.init.method === 'GET' || call.url.endsWith('/availability/search')));
});


test('booking configuration never exposes a payment SDK configuration, even with legacy payment flags', async () => {
  const { api } = fixture([slot], { checkout: true });
  const result = await (await api(request('config'))).json();
  assert.equal(result.bookingsEnabled, true);
  assert.equal(result.paymentsEnabled, false);
  assert.equal(result.paymentPolicy, 'PAY_AT_SHOP');
  assert.equal(result.payment, undefined);
});

test('old payment submissions are gone and cannot be reactivated with card tokens', async () => {
  const { api, calls } = fixture([slot], { checkout: true });
  for (const route of ['checkout/prepare', 'checkout/commit', 'payments']) assert.equal((await api(request(route, { sourceId: 'cnon:test' }))).status, 410);
  assert.equal(calls.length, 0);
});

for (const vip of [false, true]) test(`full HTTP ${vip ? 'VIP' : 'daytime'} booking journey accepts confirmation, records pay-at-shop and never reaches the Payments API`, async () => {
  const db = new DatabaseSync(':memory:'); db.exec(CHECKOUT_SCHEMA);
  const store = createCheckoutStore({ first: async (sql,args) => db.prepare(sql).get(...args), all: async (sql,args) => db.prepare(sql).all(...args), run: async (sql,args) => ({ changes: db.prepare(sql).run(...args).changes }) });
  let booking;
  const appointment = vip ? { ...slot, start_at: '2026-10-30T20:00:00Z', appointment_segments: [{ ...segment, service_variation_id: vipId, team_member_id: BEYHAN_ID }] } : slot;
  const price = vip ? 8200 : 4100;
  const { api, calls } = fixture([appointment], { checkout: true, store, env: { BOOKING_ENABLED: 'true', CHECKOUT_ENABLED: 'false' }, items: vip ? classic => [classic, vipItem(classic)] : undefined, variation: vip ? {} : { price_description: 'Haircuts %10 OFF - £37' }, square: async (path, init) => {
    assert.ok(!path.includes('/payments'));
    if (path === '/v2/bookings/business-booking-profile') return { business_booking_profile: { booking_enabled: true, support_seller_level_writes: true, booking_policy: 'ACCEPT_ALL' } };
    if (path === '/v2/customers/search') return { customers: [] };
    if (path === '/v2/customers') return { customer: { id: 'test-customer' } };
    if (path === '/v2/bookings' && init.method === 'GET') return { bookings: booking ? [booking] : [] };
    if (path === '/v2/bookings') { booking = { id: 'test-booking', status: 'ACCEPTED', ...JSON.parse(init.body).booking }; return { booking }; }
    if (path === '/v2/bookings/test-booking') return { booking };
    throw Error('Unexpected mock request');
  } });
  const config = await (await api(request('config'))).json();
  assert.equal(config.bookingsEnabled, true); assert.equal(config.paymentsEnabled, false);
  const selected = { ...selection, serviceId: vip ? vipId : SERVICE_ID, slotId: appointment.start_at + (vip ? '|' + BEYHAN_ID : '|' + TATAR_ID) };
  assert.equal((await api(request('review', selected))).status, 200);
  const reference = { id: crypto.randomUUID(), token: 't'.repeat(64) };
  const heldResponse = await api(request('hold/create', { ...reference, ...selected }));
  assert.equal(heldResponse.status, 200);
  const held = await heldResponse.json();
  assert.equal(held.service.price, price);
  const details = { ...reference, ...selected, policyAccepted: true, policyVersion: held.policy.version, expectedAmount: price, appointmentNote: '漢'.repeat(1000), customer: { givenName: '漢'.repeat(100), familyName: '漢'.repeat(100), email: 'test@example.com', phone: '07700900000', birthday: '1990-05-20', consent: true } };
  if (!vip) {
    assert.equal((await api(request('reservation/prepare', { ...details, expectedAmount: 3700 }))).status, 409, 'A price copied from the discount description must never be accepted.');
    assert.ok(!calls.some(call => new URL(call.url).pathname.startsWith('/v2/customers') || new URL(call.url).pathname === '/v2/bookings'), 'A rejected description-based quote must not create a customer or booking.');
  }
  const prepared = await api(request('reservation/prepare', details));
  assert.equal(prepared.status, 200);
  assert.equal((await prepared.json()).status, 'READY');
  const confirmed = await api(request('reservation/confirm', { ...reference, confirmed: true }));
  assert.equal(confirmed.status, 200);
  const result = await confirmed.json();
  assert.equal(result.status, 'COMPLETE'); assert.equal(result.paymentStatus, 'PAY_AT_SHOP'); assert.equal(result.amount, price);
  assert.equal(booking.appointment_segments[0].service_variation_id, vip ? vipId : SERVICE_ID);
  assert.match(booking.seller_note, /NO ONLINE PAYMENT TAKEN/);
  assert.ok(booking.seller_note.includes(`Quoted service price £${(price / 100).toFixed(2)}`));
  assert.equal(booking.customer_note, '漢'.repeat(1000));
  assert.equal((await (await api(request('reservation/status', reference))).json()).bookingId, 'test-booking');
  assert.ok(!calls.some(call => new URL(call.url).pathname.includes('/payments')));
  db.close();
});

test('public availability hides site holds; only an authenticated owner can see their held interval', async()=>{
 const db=new DatabaseSync(':memory:');db.exec(CHECKOUT_SCHEMA);
 const store=createCheckoutStore({first:async(sql,args)=>db.prepare(sql).get(...args),all:async(sql,args)=>db.prepare(sql).all(...args),run:async(sql,args)=>({changes:db.prepare(sql).run(...args).changes})});
 const {api}=fixture([slot],{checkout:true,store});
 const selected={...selection,serviceId:SERVICE_ID,slotId:slot.start_at+'|' + TATAR_ID};
 const owner={id:crypto.randomUUID(),token:'x'.repeat(64)};
 assert.equal((await api(request('hold/create',{...owner,...selected}))).status,200);
 assert.equal((await(await api(request('availability',selected))).json()).slots.length,0);
 assert.equal((await(await api(request('availability',{...selected,excludeHoldId:owner.id}))).json()).slots.length,0);
 assert.equal((await api(request('availability',{...selected,holdId:owner.id,holdToken:'z'.repeat(64)}))).status,403);
 assert.equal((await(await api(request('availability',{...selected,holdId:owner.id,holdToken:owner.token}))).json()).slots.length,1);
 assert.equal((await api(request('hold/release',{...owner,token:'z'.repeat(64)}))).status,403);
 assert.equal((await api(request('hold/release',owner))).status,200);
 assert.equal((await(await api(request('availability',selected))).json()).slots.length,1);
 db.close();
});

test('VIP category, prices, descriptions, duration and assigned staff come directly from Square', async () => {
  let vipPrice = 9100;
  const { api, calls } = fixture([], { items: classic => {
    const vip = vipItem(classic);
    Object.assign(vip.item_data.variations[0].item_variation_data, { price_money: { amount: vipPrice, currency: 'GBP' }, service_duration: 2700000 });
    return [classic, vip, { id: VIP_CATEGORY_ID, type: 'CATEGORY', category_data: { name: 'VIP After Hours' } }];
  } });
  const config = await (await api(request('config'))).json();
  assert.deepEqual(config.categories.map(value => value.id), [DAYTIME_CATEGORY_ID, VIP_CATEGORY_ID]);
  const vip = config.services.find(value => value.id === vipId);
  assert.equal(vip.categoryId, VIP_CATEGORY_ID); assert.equal(vip.name, 'Classic Haircut & Styling - VIP Hours');
  assert.equal(vip.description, 'Square VIP description'); assert.equal(vip.price, 9100); assert.equal(vip.durationMinutes, 45);
  assert.deepEqual(vip.staff, [{ id: BEYHAN_ID, name: 'Bayhan' }]);
  vipPrice = 9300;
  assert.equal((await (await api(request('availability', { ...selection, serviceId: vipId }))).json()).service.price, 9300);
  const search = JSON.parse(calls.find(value => value.url.endsWith('/availability/search')).init.body);
  assert.equal(search.query.filter.segment_filters[0].service_variation_id, vipId);
  assert.deepEqual(search.query.filter.segment_filters[0].team_member_id_filter.any, [BEYHAN_ID]);
  assert.equal((await api(request('availability', { ...selection, serviceId: vipId, staffId: TATAR_ID }))).status, 400);
});

test('VIP accepts only live evening slots that finish by midnight; forged category flags cannot change either rule', async () => {
  const vipSlot = start => ({ ...slot, start_at: `2026-10-30T${start}:00Z`, appointment_segments: [{ ...segment, service_variation_id: vipId, team_member_id: BEYHAN_ID }] });
  const { api } = fixture(['19:45', '20:00', '23:20', '23:21'].map(vipSlot), { items: classic => [classic, vipItem(classic)] });
  const selected = { ...selection, serviceId: vipId, categoryId: DAYTIME_CATEGORY_ID, mode: 'daytime' };
  const result = await (await api(request('availability', selected))).json();
  assert.deepEqual(result.slots.map(value => value.startAt), ['2026-10-30T20:00:00Z', '2026-10-30T23:20:00Z']);
  for (const start of ['19:45', '23:21']) assert.equal((await api(request('review', { ...selected, slotId: vipSlot(start).start_at + '|' + BEYHAN_ID }))).status, 409);
  const daytime = fixture([{ ...slot, start_at: '2026-10-30T20:00:00Z' }]).api;
  assert.deepEqual((await (await daytime(request('availability', { ...selection, serviceId: SERVICE_ID, categoryId: VIP_CATEGORY_ID, mode: 'vip' }))).json()).slots, []);
});

test('shared VIP policy respects GMT/BST, midnight, weekends and the exact 90-minute lead boundary', () => {
  const early = Date.parse('2026-01-01T00:00:00Z');
  assert.equal(isVipSlot('2026-11-07T20:00:00Z', 40, early), true); // Saturday
  assert.equal(isVipSlot('2026-11-08T23:20:00Z', 40, early), true); // Sunday, ends midnight
  assert.equal(isVipSlot('2026-11-08T23:21:00Z', 40, early), false);
  assert.equal(isVipSlot('2026-11-09T00:00:00Z', 40, early), false);
  assert.equal(isVipSlot('2026-07-01T19:00:00Z', 40, early), true); // 20:00 BST
  assert.equal(isVipSlot('2026-07-01T18:59:00Z', 40, early), false);
  assert.equal(isVipSlot('2026-07-01T22:20:00Z', 40, early), true); // Midnight BST finish
  assert.equal(isVipSlot('2026-07-01T22:21:00Z', 40, early), false);
  const now = Date.parse('2026-10-30T18:30:00Z');
  assert.equal(isVipSlot('2026-10-30T20:00:00Z', 40, now), true);
  assert.equal(isVipSlot('2026-10-30T20:00:00Z', 40, now + 1), false);
  assert.equal(isServiceSlot('2026-10-30T20:00:00Z', 40, { categoryId: 'other' }, now), false);
});

test('VIP minimum lead is enforced again when holding, reviewing and confirming, without customer writes', async () => {
  const db = new DatabaseSync(':memory:'); db.exec(CHECKOUT_SCHEMA);
  const store = createCheckoutStore({ first: async (sql,args) => db.prepare(sql).get(...args), all: async (sql,args) => db.prepare(sql).all(...args), run: async (sql,args) => ({ changes: db.prepare(sql).run(...args).changes }) });
  let current = Date.parse('2026-10-30T18:30:00Z');
  const appointment = { ...slot, start_at: '2026-10-30T20:00:00Z', appointment_segments: [{ ...segment, service_variation_id: vipId, team_member_id: BEYHAN_ID }] };
  const { api, calls } = fixture([appointment], { now: () => current, checkout: true, store, items: classic => [classic, vipItem(classic)] });
  const selected = { ...selection, serviceId: vipId, slotId: appointment.start_at + '|' + BEYHAN_ID };
  const reference = { id: crypto.randomUUID(), token: 't'.repeat(64) };
  const heldResponse = await api(request('hold/create', { ...reference, ...selected }));
  assert.equal(heldResponse.status, 200);
  const held = await heldResponse.json();
  const details = { ...reference, ...selected, expectedAmount: 8200, policyAccepted: true, policyVersion: held.policy.version, customer: { givenName: 'Test', familyName: 'Booking', email: 'test@example.com', phone: '07700900000', consent: true } };
  assert.equal((await api(request('reservation/prepare', details))).status, 200);
  current += 1; // Still inside the hold, but less than 90 minutes before the appointment.
  assert.equal((await api(request('review', { ...selected, holdId: reference.id, holdToken: reference.token }))).status, 409);
  assert.equal((await api(request('hold/create', { ...selected, id: crypto.randomUUID(), token: reference.token }))).status, 409);
  const confirmed = await (await api(request('reservation/confirm', { ...reference, confirmed: true }))).json();
  assert.equal(confirmed.status, 'FAILED');
  assert.ok(calls.every(value => value.init.method === 'GET' || value.url.endsWith('/availability/search')));
  db.close();
});

test('daytime holds also block overlapping VIP starts for the same specialist', async () => {
  const db = new DatabaseSync(':memory:'); db.exec(CHECKOUT_SCHEMA);
  const store = createCheckoutStore({ first: async (sql,args) => db.prepare(sql).get(...args), all: async (sql,args) => db.prepare(sql).all(...args), run: async (sql,args) => ({ changes: db.prepare(sql).run(...args).changes }) });
  const daytime = { ...slot, start_at: '2026-10-30T19:45:00Z', appointment_segments: [{ ...segment, team_member_id: BEYHAN_ID }] };
  const vip = { ...slot, start_at: '2026-10-30T20:00:00Z', appointment_segments: [{ ...segment, service_variation_id: vipId, team_member_id: BEYHAN_ID }] };
  const { api } = fixture([daytime, vip], { checkout: true, store, items: classic => [classic, vipItem(classic)] });
  const owner = { id: crypto.randomUUID(), token: 'x'.repeat(64) };
  assert.equal((await api(request('hold/create', { ...owner, ...selection, serviceId: SERVICE_ID, slotId: daytime.start_at + '|' + BEYHAN_ID }))).status, 200);
  assert.deepEqual((await (await api(request('availability', { ...selection, serviceId: vipId }))).json()).slots, []);
  assert.equal((await api(request('hold/create', { ...owner, id: crypto.randomUUID(), ...selection, serviceId: vipId, slotId: vip.start_at + '|' + BEYHAN_ID }))).status, 409);
  await api(request('hold/release', owner));
  assert.equal((await (await api(request('availability', { ...selection, serviceId: vipId }))).json()).slots.length, 1);
  db.close();
});

test('late same-day VIP searches respect Square’s one-hour minimum without bypassing the lead time', async () => {
  const appointments = ['23:00', '23:20', '23:21'].map(start => ({ ...slot, start_at: `2026-10-30T${start}:00Z`, appointment_segments: [{ ...segment, service_variation_id: vipId, team_member_id: BEYHAN_ID }] }));
  const { api, calls } = fixture(appointments, { now: () => Date.parse('2026-10-30T21:50:00Z'), items: classic => [classic, vipItem(classic)] });
  const result = await (await api(request('availability', { ...selection, serviceId: vipId }))).json();
  assert.deepEqual(result.slots.map(value => value.startAt), ['2026-10-30T23:20:00Z']);
  const range = JSON.parse(calls.find(value => value.url.endsWith('/availability/search')).init.body).query.filter.start_at_range;
  assert.equal(range.start_at, '2026-10-30T23:00:00.000Z');
  assert.equal(Date.parse(range.end_at) - Date.parse(range.start_at), 3600000);
});

test('VIP catalog admits only the two verified barbers while daytime keeps all Square assignments', async () => {
  const { api } = fixture([], { items: classic => {
    classic.item_data.variations[0].item_variation_data.team_member_ids = [TATAR_ID, BEYHAN_ID, 'other'];
    const vip = vipItem(classic);
    vip.item_data.variations[0].item_variation_data.team_member_ids = [TATAR_ID, BEYHAN_ID, 'other'];
    return [classic, vip];
  } });
  const config = await (await api(request('config'))).json();
  assert.deepEqual(config.services.find(value => value.id === vipId).staff.map(value => value.id), [TATAR_ID, BEYHAN_ID]);
  assert.deepEqual(config.services.find(value => value.id === SERVICE_ID).staff.map(value => value.id), [TATAR_ID, BEYHAN_ID, 'other']);
  assert.equal((await api(request('availability', { ...selection, serviceId: vipId, staffId: 'other' }))).status, 400);
});

test('VIP working days follow live Square availability, including later changes to weekdays', async () => {
  for (const [date, expected] of [['2026-10-30', [TATAR_ID]], ['2026-10-31', [BEYHAN_ID]], ['2026-11-01', []], ['2026-11-02', [TATAR_ID, BEYHAN_ID]]]) {
    const appointments = expected.map(staffId => ({ ...slot, start_at: date + 'T20:00:00Z', appointment_segments: [{ ...segment, service_variation_id: vipId, team_member_id: staffId }] }));
    const { api, calls } = fixture(appointments, { items: classic => { const vip = vipItem(classic); vip.item_data.variations[0].item_variation_data.team_member_ids = [TATAR_ID, BEYHAN_ID]; return [classic, vip]; } });
    const result = await (await api(request('availability', { date, serviceId: vipId, staffId: 'any' }))).json();
    assert.deepEqual(result.slots.map(value => value.staffId).sort(), [...expected].sort(), date);
    const search = JSON.parse(calls.find(value => value.url.endsWith('/availability/search')).init.body);
    assert.deepEqual(search.query.filter.segment_filters[0].team_member_id_filter.any, [TATAR_ID, BEYHAN_ID]);
    const direct = await (await api(request('availability', { date, serviceId: vipId, staffId: BEYHAN_ID }))).json();
    assert.equal(direct.slots.length, expected.includes(BEYHAN_ID) ? 1 : 0, date);
  }
});

test('VIP staff restrictions never manufacture slots or override Square service assignments', async () => {
  assert.equal(isServiceSlot('2026-10-31T20:00:00Z', 40, { categoryId: VIP_CATEGORY_ID }, now(), BEYHAN_ID), true);
  assert.equal(isServiceSlot('2026-10-31T20:00:00Z', 40, { categoryId: VIP_CATEGORY_ID }, now(), TATAR_ID), true);
  for (const id of ['other', '__proto__', 'constructor', '', undefined]) assert.equal(isServiceSlot('2026-10-31T20:00:00Z', 40, { categoryId: VIP_CATEGORY_ID }, now(), id), false);
  const { api } = fixture([], { items: classic => [classic, vipItem(classic)] });
  assert.deepEqual((await (await api(request('availability', { date: '2026-10-31', serviceId: vipId, staffId: 'any' }))).json()).slots, []);
  assert.equal((await api(request('availability', { date: '2026-10-31', serviceId: vipId, staffId: TATAR_ID }))).status, 400);
});

test('Daytime closing time changes in Square from 19:15 to 17:15 are reflected without changing local rules', async () => {
  const make = clock => ({ ...slot, start_at: '2026-10-30T' + clock + ':00Z' });
  let current = [make('16:35'), make('18:35'), make('20:00')];
  const { api } = fixture(() => current);
  const selected = { ...selection, serviceId: SERVICE_ID };
  const first = await (await api(request('availability', selected))).json();
  assert.deepEqual(first.slots.map(value => value.startAt), ['2026-10-30T16:35:00Z', '2026-10-30T18:35:00Z']);
  current = [make('16:35'), make('20:00')];
  const refreshed = await (await api(request('availability', selected))).json();
  assert.deepEqual(refreshed.slots.map(value => value.startAt), ['2026-10-30T16:35:00Z']);
  assert.equal((await api(request('review', { ...selected, slotId: first.slots[1].id }))).status, 409);
});

test('VIP opening times, closing times and breaks change only when Square returns different slots', async () => {
  const make = clock => ({ ...slot, start_at: '2026-10-30T' + clock + ':00Z', appointment_segments: [{ ...segment, service_variation_id: vipId, team_member_id: BEYHAN_ID }] });
  let current = ['19:15', '20:00', '21:00', '22:00', '22:35', '23:20'].map(make);
  const { api } = fixture(() => current, { items: classic => [classic, vipItem(classic)] });
  const selected = { ...selection, serviceId: vipId };
  const first = await (await api(request('availability', selected))).json();
  assert.deepEqual(first.slots.map(value => value.startAt.slice(11,16)), ['20:00', '21:00', '22:00', '22:35', '23:20']);
  current = [make('22:00'), make('22:35')]; // Square now opens at 22:00 and closes at 23:15.
  const refreshed = await (await api(request('availability', selected))).json();
  assert.deepEqual(refreshed.slots.map(value => value.startAt.slice(11,16)), ['22:00', '22:35']);
  assert.equal((await api(request('review', { ...selected, slotId: first.slots[0].id }))).status, 409);
  current = [];
  assert.deepEqual((await (await api(request('availability', selected))).json()).slots, []);
});
