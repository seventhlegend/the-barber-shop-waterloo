// Shared by the local server and Cloudflare Pages Functions.
import { ReservationError, createReservationService } from './reservations.mjs';
import { atLocation, CatalogError, serviceCategoryId, serviceFromCatalog } from './booking-catalog.mjs';
import { DAYTIME_CATEGORY_ID, VIP_CATEGORY_ID, VIP_POLICY, isServiceSlot } from '../src/lib/booking-policy.mjs';
import { createHoldService, HoldError } from './holds.mjs';
import { policyFromProfile, serviceTotals } from './booking-summary.mjs';
export const SERVICE_ID = 'TKQNC5W2UA3KODCVAO62QVZC';
export const TIME_ZONE = 'Europe/London';
export const MAX_BOOKING_BODY_BYTES = 8192;

class BookingError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function londonDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}

export function londonMidnight(date) {
  const base = Date.parse(`${date}T00:00:00Z`);
  let result = base;
  // Resolve local midnight against London's GMT/BST offset, including DST days.
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(result);
    const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    result += base - local;
  }
  return result;
}

function nextDate(date, days = 1) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

function validDate(date, now) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || nextDate(date, 0) !== date) throw new BookingError('Choose a valid appointment date.');
  const today = londonDate(new Date(now));
  if (date < today || date > nextDate(today, 60)) throw new BookingError('Choose a date within the next 60 days.');
}

export function createBookingApi(env, { fetcher = fetch, now = () => Date.now(), store } = {}) {
  const environment = env.SQUARE_ENVIRONMENT || 'production';
  const bookingReady = (env.BOOKING_ENABLED ?? env.CHECKOUT_ENABLED) === 'true' && !!store && (env.CHECKOUT_RECOVERY_SECRET?.length || 0) >= 32;
  async function square(path, body, method = body ? 'POST' : 'GET') {
    if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID) throw new BookingError('Square is not configured. Please contact the shop or use Square booking.', 503);
    if (!['production', 'sandbox'].includes(environment)) throw new BookingError('Choose a valid Square environment.', 503);
    const calendarRead = method === 'GET' && (path.startsWith('/v2/catalog/object/') || path.startsWith('/v2/catalog/list?') || path.startsWith('/v2/bookings/team-member-booking-profiles?') || path === '/v2/bookings/business-booking-profile');
    const search = method === 'POST' && ['/v2/bookings/availability/search', '/v2/orders/calculate'].includes(path);
    const reservationPath = (method === 'POST' && ['/v2/customers/search', '/v2/customers', '/v2/bookings'].includes(path)) || (method === 'GET' && (path.startsWith('/v2/bookings?') || /^\/v2\/bookings\/[^/]+$/.test(path))) || (method === 'PUT' && /^\/v2\/customers\/[^/]+$/.test(path)) || (method === 'POST' && /^\/v2\/bookings\/[^/]+\/cancel$/.test(path));
    if (!(calendarRead || search || (bookingReady && reservationPath))) throw new BookingError('This Square operation is not available.', 403);
    let response;
    try {
      response = await fetcher(`https://${environment === 'sandbox' ? 'connect.squareupsandbox.com' : 'connect.squareup.com'}${path}`, {
        method,
        headers: { Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`, 'Square-Version': env.SQUARE_API_VERSION || '2026-09-16', 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(12000),
      });
    } catch { throw Object.assign(new BookingError('Square could not be reached. Please try again.', 502), { uncertain: true }); }
    let data;
    try { data = await response.json(); } catch { throw Object.assign(new BookingError('Square returned an unreadable response. Please try again.', 502), { uncertain: true }); }
    if (!response.ok || data.errors?.length) {
      const codes = data.errors?.map(error => error.code) || [];
      throw Object.assign(new BookingError('Square could not complete this request. Please try again.', 502), { uncertain: response.status >= 500 || response.status === 429, codes });
    }
    return data;
  }

  async function bookableTeam() {
    const members = [];
    let cursor;
    do {
      const query = new URLSearchParams({ bookable_only: 'true', location_id: env.SQUARE_LOCATION_ID || '', limit: '100', ...(cursor ? { cursor } : {}) });
      const data = await square(`/v2/bookings/team-member-booking-profiles?${query}`);
      members.push(...data.team_member_booking_profiles || []);
      cursor = data.cursor;
    } while (cursor && members.length < 1000);
    if (cursor) throw new BookingError('The staff list could not be checked completely.', 503);
    return members;
  }

  async function selectedService(serviceId = SERVICE_ID) {
    if (typeof serviceId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(serviceId)) throw new BookingError('Choose an available service.');
    const [catalog, team] = await Promise.all([
      square(`/v2/catalog/object/${encodeURIComponent(serviceId)}?include_related_objects=true`), bookableTeam(),
    ]);
    const variation = catalog.object;
    const parent = catalog.related_objects?.find(item => item.id === variation?.item_variation_data?.item_id);
    if (variation?.id !== serviceId) throw new BookingError('Choose an available service.');
    return serviceTotals(serviceFromCatalog(variation, parent, team, env.SQUARE_LOCATION_ID), square, env.SQUARE_LOCATION_ID);
  }

  async function bookingPolicy() {
    return policyFromProfile((await square('/v2/bookings/business-booking-profile')).business_booking_profile);
  }

  async function config() {
    const [objects, team, policy] = await Promise.all([(async () => {
      const objects = [];
      let cursor;
      do {
        const query = new URLSearchParams({ types: 'ITEM,CATEGORY', ...(cursor ? { cursor } : {}) });
        const data = await square(`/v2/catalog/list?${query}`);
        objects.push(...data.objects || []);
        cursor = data.cursor;
      } while (cursor && objects.length < 10000);
      if (cursor) throw new BookingError('The service list could not be checked completely.', 503);
      return objects;
    })(), bookableTeam(), bookingPolicy()]);
    const services = objects.filter(item => atLocation(item, env.SQUARE_LOCATION_ID) && serviceCategoryId(item)).flatMap(item =>
      (item.item_data.variations || []).filter(variation => atLocation(variation, env.SQUARE_LOCATION_ID) && variation.item_variation_data?.available_for_booking && variation.item_variation_data.service_duration > 0).map(variation => serviceFromCatalog(variation, item, team, env.SQUARE_LOCATION_ID))
    );
    services.sort((a, b) => (a.id === SERVICE_ID ? -1 : b.id === SERVICE_ID ? 1 : a.name.localeCompare(b.name)));
    if (!services.length) throw new BookingError('No services are currently available for online booking.', 503);
    const categories = [DAYTIME_CATEGORY_ID, VIP_CATEGORY_ID].map(id => ({ id, name: objects.find(item => item.id === id)?.category_data?.name || (id === VIP_CATEGORY_ID ? 'VIP After Hours' : 'Daytime Services') }));
    const service = services.find(service => service.id === SERVICE_ID) || services[0];
    return {
      mode: bookingReady ? 'reservation' : 'preview', timeZone: TIME_ZONE, today: londonDate(new Date(now())), maxDate: nextDate(londonDate(new Date(now())), 60),
      categories,
      services, service, staff: service.staff, policy, paymentsEnabled: false, bookingsEnabled: bookingReady, paymentPolicy: 'PAY_AT_SHOP', environment,
    };
  }

  async function availability(input, { excludeHoldId } = {}) {
    validDate(input.date, now());
    if (!excludeHoldId && input.holdId) {
      if (!holds) throw new HoldError('Appointment holding is not available.', 503);
      excludeHoldId = (await holds.active({ id: input.holdId, token: input.holdToken })).id;
    }
    const [service, policy] = await Promise.all([selectedService(input.serviceId), bookingPolicy()]);
    const settings = { service, staff: service.staff };
    if (input.staffId !== 'any' && !settings.staff.some(member => member.id === input.staffId)) throw new BookingError('Choose a barber who offers this service.');
    const start = Math.max(londonMidnight(input.date), now() + (service.categoryId === VIP_CATEGORY_ID ? VIP_POLICY.minimumLeadMinutes * 60000 : 60000));
    const end = londonMidnight(nextDate(input.date));
    if (start >= end) return { slots: [], service: settings.service, policy, checkedAt: new Date(now()).toISOString() };
    // Square owns each person's daily hours, breaks and exceptions. The local
    // category rule only divides live starts at 20:00; no old closing-time copy.
    const assigned = settings.staff.filter(member => input.staffId === 'any' || member.id === input.staffId).map(member => member.id);
    if (!assigned.length) return { slots: [], service, policy, checkedAt: new Date(now()).toISOString() };
    // Square requires a search window of at least one hour. A valid late VIP
    // start can leave less time until midnight; widen the read, then filter below.
    const searchStart = service.categoryId === VIP_CATEGORY_ID ? Math.min(start, end - 3600000) : start;
    const data = await square('/v2/bookings/availability/search', { query: { filter: {
      location_id: env.SQUARE_LOCATION_ID,
      start_at_range: { start_at: new Date(searchStart).toISOString(), end_at: new Date(end).toISOString() },
      segment_filters: [{ service_variation_id: service.id, team_member_id_filter: { any: assigned } }],
    } } });
    const blocked = store?.blockedSlots && assigned.length ? await store.blockedSlots(assigned, start, end, now(), excludeHoldId) : [];
    const seen = new Set();
    const slots = (data.availabilities || []).flatMap(slot => {
      const segment = slot.appointment_segments?.[0];
      const timestamp = Date.parse(slot.start_at);
      const finish = timestamp + segment?.duration_minutes * 60000;
      if (slot.location_id !== env.SQUARE_LOCATION_ID || slot.appointment_segments?.length !== 1 || segment?.service_variation_id !== service.id || !assigned.includes(segment.team_member_id) || !Number.isFinite(timestamp) || !Number.isFinite(finish) || timestamp < start || timestamp >= end || londonDate(new Date(timestamp)) !== input.date || finish > end || segment.duration_minutes !== service.durationMinutes) return [];
      if (!isServiceSlot(slot.start_at, segment.duration_minutes, service, now(), segment.team_member_id)) return [];
      if (blocked.some(value => value.staff_id === segment.team_member_id && value.starts_at < finish && value.ends_at > timestamp)) return [];
      const id = `${slot.start_at}|${segment.team_member_id}`;
      if (seen.has(id)) return [];
      seen.add(id);
      return [{ id, startAt: slot.start_at, staffId: segment.team_member_id, staffName: settings.staff.find(member => member.id === segment.team_member_id).name, durationMinutes: segment.duration_minutes, serviceVariationVersion: segment.service_variation_version }];
    }).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt) || a.staffName.localeCompare(b.staffName));
    return { slots, service: settings.service, policy, checkedAt: new Date(now()).toISOString() };
  }

  const holds = bookingReady ? createHoldService({ store, secret: env.CHECKOUT_RECOVERY_SECRET, availability, now }) : null;
  const reservation = bookingReady ? createReservationService({ store, secret: env.CHECKOUT_RECOVERY_SECRET, square, availability, holds, now, locationId: env.SQUARE_LOCATION_ID, environment }) : null;
  const handle = async function handle(request) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
    const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
    try {
      const url = new URL(request.url);
      const route = url.pathname.replace(/\/$/, '');
      if (request.method === 'GET' && route === '/api/booking/config') return respond(await config());
      if (['/api/booking/checkout/prepare', '/api/booking/checkout/commit', '/api/booking/payments'].includes(route)) return respond({ error: 'Online payments are no longer available. Reload the page to book and pay at the shop.' }, 410);
      const legacyStatus = route === '/api/booking/checkout/status';
      const holdRoute = route.startsWith('/api/booking/hold/');
      const reservationRoute = route.startsWith('/api/booking/reservation/') || legacyStatus || holdRoute;
      if (request.method !== 'POST' || !['/api/booking/availability', '/api/booking/review', ...(reservation ? ['/api/booking/reservation/prepare', '/api/booking/reservation/confirm', '/api/booking/reservation/status', '/api/booking/checkout/status', '/api/booking/hold/create', '/api/booking/hold/status', '/api/booking/hold/release'] : [])].includes(route)) return respond({ error: 'This booking operation is not available.' }, 405);
      if (reservationRoute && request.headers.get('origin') !== url.origin) throw new BookingError('Please use the booking form on this site.', 403);
      if (reservationRoute && url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new BookingError('A secure connection is required for booking.', 403);
      if (request.headers.get('origin') && request.headers.get('origin') !== url.origin) throw new BookingError('Please use the booking form on this site.', 403);
      if (!request.headers.get('content-type')?.startsWith('application/json')) throw new BookingError('Send the appointment selection as JSON.', 415);
      if (Number(request.headers.get('content-length')) > MAX_BOOKING_BODY_BYTES) throw new BookingError('The request is too large.', 413);
      const reader = request.body?.getReader();
      let raw = '';
      let size = 0;
      const decoder = new TextDecoder();
      if (reader) while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BOOKING_BODY_BYTES) { await reader.cancel(); throw new BookingError('The request is too large.', 413); }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
      let input;
      try { input = JSON.parse(raw); } catch { throw new BookingError('The appointment selection could not be read.'); }
      if (!input || typeof input !== 'object') throw new BookingError('Choose an appointment.');
      if (holdRoute) return respond(await holds[route.split('/').pop()](input));
      if (reservationRoute) {
        const operation = route.split('/').pop();
        const result = operation === 'status' ? await reservation.status(input, !legacyStatus) : await reservation[operation](input);
        return respond(result, result.status === 'PROCESSING' ? 202 : 200);
      }
      const result = await availability(input);
      if (route.endsWith('/availability')) return respond(result);
      const slot = result.slots.find(slot => slot.id === input.slotId);
      if (!slot) throw new BookingError('That appointment is no longer available. Please choose another time.', 409);
      return respond({ mode: 'preview', slot, service: result.service, policy: result.policy, price: result.service.price, currency: result.service.currency, checkedAt: result.checkedAt, paymentStatus: 'NOT_TAKEN', bookingStatus: 'NOT_CREATED' });
    } catch (error) {
      const known = error instanceof BookingError || error instanceof CatalogError || error instanceof ReservationError || error instanceof HoldError;
      return respond({ error: known ? error.message : 'The booking service could not complete this request. Please try again.' }, known ? error.status : 500);
    }
  };
  handle.recoverPending = () => reservation?.recoverPending();
  return handle;
}
