import { createReservationCrypto } from './booking-crypto.mjs';
export { createReservationCrypto } from './booking-crypto.mjs';
import { policyFromProfile } from './booking-summary.mjs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FLOW = 'PAY_AT_SHOP_V1';
const terminal = phase => ['COMPLETE', 'FAILED'].includes(phase);

export class ReservationError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}


function customerInput(input, today) {
  const fields = ['givenName', 'familyName', 'email', 'phone'];
  if (!input || fields.some(field => typeof input[field] !== 'string')) throw new ReservationError('Enter your contact details.');
  const customer = Object.fromEntries(fields.map(field => [field, input[field].trim()]));
  if (!customer.givenName || !customer.familyName || customer.givenName.length > 100 || customer.familyName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || customer.email.length > 254) throw new ReservationError('Check your name and email address.');
  customer.phone = customer.phone.replace(/[\s().-]/g, '');
  if (customer.phone.startsWith('0')) customer.phone = `+44${customer.phone.slice(1)}`;
  if (!/^\+[1-9]\d{8,14}$/.test(customer.phone)) throw new ReservationError('Enter a valid phone number, including country code for numbers outside the UK.');
  if (input.consent !== true) throw new ReservationError('Please agree to share your contact details for this booking.');
  if (input.birthday) {
    const birthday = input.birthday;
    if (typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday) || !Number.isFinite(Date.parse(`${birthday}T12:00:00Z`)) || new Date(`${birthday}T12:00:00Z`).toISOString().slice(0, 10) !== birthday || birthday < '1900-01-01' || birthday > today) throw new ReservationError('Choose a valid date of birth, or leave it empty.');
    customer.birthday = birthday;
  }
  return customer;
}

function rejectPaymentInput(input) {
  if (['sourceId', 'verificationToken', 'paymentId', 'payment', 'card', 'cardNonce', 'amount_money'].some(key => Object.hasOwn(input, key))) throw new ReservationError('Online payments are not accepted. Confirm your appointment and pay at the shop.');
}

export function createReservationService({ store, secret, square, availability, holds, now = () => Date.now(), locationId, environment }) {
  const cryptoReady = createReservationCrypto(secret);
  async function read(id, token) {
    if (!uuid.test(id || '') || !/^[a-zA-Z0-9_-]{40,100}$/.test(token || '')) throw new ReservationError('This booking reference could not be verified.', 403);
    const row = await store.get(id);
    if (!row || row.auth_hash !== await (await cryptoReady).auth(`${id}:${token}`)) throw new ReservationError('This booking reference could not be verified.', 403);
    return { row, data: await (await cryptoReady).open(row.encrypted) };
  }
  function publicState(id, data) {
    if (data.flow !== FLOW) return { id, status: 'NEEDS_ATTENTION', service: data.service, slot: data.slot, amount: data.service?.price, bookingId: data.booking?.id, legacy: true, error: 'This reference belongs to the previous booking system. Please contact the shop to check the existing booking and payment status before booking again.' };
    return {
      id, status: data.phase === 'COMPLETE' ? 'COMPLETE' : data.phase === 'FAILED' ? 'FAILED' : data.phase === 'DRAFT' ? (!Number.isFinite(data.holdExpiresAt) || now() >= data.holdExpiresAt ? 'EXPIRED' : 'READY') : 'PROCESSING',
      service: data.service, slot: data.slot, amount: data.service.price, currency: data.service.currency,
      paymentStatus: data.service.price === 0 ? 'NOT_REQUIRED' : 'PAY_AT_SHOP',
      ...(data.phase === 'FAILED' ? { error: data.error || 'The appointment could not be booked. Please try again.' } : {}),
      ...(data.phase === 'DRAFT' && (!Number.isFinite(data.holdExpiresAt) || now() >= data.holdExpiresAt) ? { error: 'Your 10-minute hold has ended. Choose your time again.' } : {}),
      ...(data.phase === 'COMPLETE' ? { bookingId: data.booking.id, bookingStatus: 'ACCEPTED' } : {}),
      ...(data.phase === 'RESERVATION_CANCEL_PENDING' ? { message: 'We are checking the calendar and releasing this appointment. Keep your reference and check its status before booking again.' } : {}),
    };
  }
  async function prepare(input) {
    rejectPaymentInput(input);
    if (!uuid.test(input.id || '') || !/^[a-zA-Z0-9_-]{40,100}$/.test(input.token || '')) throw new ReservationError('Start a new reservation.');
    if (await store.get(input.id)) {
      const { data } = await read(input.id, input.token);
      if (data.flow === FLOW && data.phase === 'DRAFT' && (data.service.id !== input.serviceId || data.slot.id !== input.slotId || data.date !== input.date || data.service.price !== input.expectedAmount)) throw new ReservationError('This reference already belongs to another selection. Start a new reservation.', 409);
      return publicState(input.id, data);
    }
    const held = await holds.active({ id: input.id, token: input.token });
    if (held.service.id !== input.serviceId || held.slot.id !== input.slotId || held.date !== input.date || (input.staffId !== 'any' && held.slot.staffId !== input.staffId)) throw new ReservationError('This hold belongs to another appointment. Choose your time again.', 409);
    const customer = customerInput(input.customer, new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now()));
    const appointmentNote = input.appointmentNote ?? '';
    if (typeof appointmentNote !== 'string' || appointmentNote.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(appointmentNote)) throw new ReservationError('Keep your appointment note to 1,000 characters.');
    const result = await availability({ date: input.date, staffId: held.slot.staffId, serviceId: input.serviceId }, { excludeHoldId: input.id });
    const slot = result.slots.find(slot => slot.id === input.slotId);
    if (!slot) throw new ReservationError('That time is no longer available. Please choose another appointment.', 409);
    if (slot.durationMinutes !== held.slot.durationMinutes) throw new ReservationError('The service duration has changed. Choose your time again to hold the full appointment.', 409);
    if (result.service.price !== input.expectedAmount) throw new ReservationError('The service price has changed in Square. Please review the updated price before confirming.', 409);
    if (!Number.isSafeInteger(slot.serviceVariationVersion)) throw new ReservationError('Square could not verify the current service version. Please refresh.', 503);
    const profile = (await square('/v2/bookings/business-booking-profile')).business_booking_profile;
    if (!profile?.booking_enabled || !profile.support_seller_level_writes || profile.booking_policy !== 'ACCEPT_ALL') throw new ReservationError('Online booking is not available for this calendar. Please contact the shop.', 503);
    const policy = await policyFromProfile(profile);
    if (input.policyAccepted !== true || input.policyVersion !== policy.version) throw new ReservationError('Read and accept the current cancellation policy before confirming.', 409);
    const data = { flow: FLOW, phase: 'DRAFT', service: result.service, slot, date: input.date, customer, appointmentNote: appointmentNote.trim(), policy, policyAcceptedAt: now(), holdExpiresAt: Date.parse(held.expiresAt), createdAt: now(), environment, locationId };
    await store.insert({ id: input.id, authHash: await (await cryptoReady).auth(`${input.id}:${input.token}`), encrypted: await (await cryptoReady).seal(data), phase: data.phase, now: now() });
    return publicState(input.id, (await read(input.id, input.token)).data);
  }
  async function advance(id) {
    const owner = crypto.randomUUID();
    if (!await store.acquire(id, owner, now())) return;
    let data;
    async function save(phase) { data.phase = phase; await store.save(id, owner, await (await cryptoReady).seal(data), phase, terminal(phase), now()); }
    async function validateSelection() {
      const current = await availability({ date: data.date, staffId: data.slot.staffId, serviceId: data.service.id }, { excludeHoldId: id });
      if (current.service.price !== data.service.price || !current.slots.some(slot => slot.id === data.slot.id && slot.serviceVariationVersion === data.slot.serviceVariationVersion)) throw new ReservationError('The price or appointment has changed. Please review it again.', 409);
      if (current.policy && current.policy.version !== data.policy.version) throw new ReservationError('The cancellation policy has changed. Please review it again.', 409);
    }
    async function checkConflicts() {
      const starts = Date.parse(data.slot.startAt);
      const ends = starts + data.slot.durationMinutes * 60000;
      let cursor;
      for (let page = 0; page < 20; page++) {
        const query = new URLSearchParams({ location_id: locationId, team_member_id: data.slot.staffId, start_at_min: new Date(starts - 86400000).toISOString(), start_at_max: new Date(ends).toISOString(), limit: '100', ...(cursor ? { cursor } : {}) });
        const result = await square(`/v2/bookings?${query}`);
        for (const booking of result.bookings || []) {
          if (booking.id === data.booking?.id || !['ACCEPTED', 'PENDING'].includes(booking.status)) continue;
          let start = Date.parse(booking.start_at);
          for (const segment of booking.appointment_segments || []) {
            const end = start + (segment.duration_minutes + (segment.intermission_minutes || 0)) * 60000;
            if (segment.team_member_id === data.slot.staffId && start < ends && end > starts) throw new ReservationError('That appointment was just taken. Please choose another time.', 409);
            start = end;
          }
        }
        cursor = result.cursor;
        if (!cursor) return;
      }
      throw new ReservationError('The calendar could not be checked safely. Please try again.', 503);
    }
    async function cancelOwnBooking() {
      if (data.booking?.id) {
        const booking = (await square(`/v2/bookings/${encodeURIComponent(data.booking.id)}`)).booking;
        if (!booking) throw Object.assign(new Error('Booking status unavailable'), { uncertain: true });
        if (['ACCEPTED', 'PENDING'].includes(booking.status)) {
          const cancelled = (await square(`/v2/bookings/${encodeURIComponent(booking.id)}/cancel`, { idempotency_key: `rcancel-${id}`, booking_version: booking.version })).booking;
          if (!cancelled || ['ACCEPTED', 'PENDING'].includes(cancelled.status)) throw Object.assign(new Error('Booking cancellation pending'), { uncertain: true });
        }
      }
      delete data.customer;
      await save('FAILED');
      await store.releaseSlot(id);
      await store.releaseHold(id);
    }
    try {
      const row = await store.get(id);
      if (!row || row.terminal) return;
      data = await (await cryptoReady).open(row.encrypted);
      // Never resume, authorize, capture or cancel payments from the old system.
      if (data.flow !== FLOW) return;
      if (data.environment !== environment || data.locationId !== locationId) throw Object.assign(new ReservationError('This booking belongs to another Square environment.', 409), { environmentMismatch: true });
      if (data.phase === 'DRAFT') {
        if (!Number.isFinite(data.holdExpiresAt) || now() >= data.holdExpiresAt) throw new ReservationError('Your 10-minute hold has ended. Choose your time again.', 409);
        await validateSelection();
        const starts = Date.parse(data.slot.startAt);
        if (!await store.claimSlot(id, data.slot.staffId, starts, starts + data.slot.durationMinutes * 60000, now(), true)) throw new ReservationError('The hold has ended or another reservation is using this time. Choose another appointment.', 409);
        await store.consumeHold(id);
        await save('RESERVATION_PRECHECK_PENDING');
      }
      if (data.phase === 'RESERVATION_PRECHECK_PENDING') {
        await validateSelection();
        await checkConflicts();
        await save('RESERVATION_CUSTOMER_PENDING');
      }
      if (data.phase === 'RESERVATION_CUSTOMER_PENDING') {
        const matches = (await square('/v2/customers/search', { query: { filter: { email_address: { exact: data.customer.email } } }, limit: 100 })).customers || [];
        const existing = matches.find(customer => customer.phone_number?.replace(/[\s().-]/g, '') === data.customer.phone);
        const customer = existing || (await square('/v2/customers', { idempotency_key: `rc-${id}`, given_name: data.customer.givenName, family_name: data.customer.familyName, email_address: data.customer.email, phone_number: data.customer.phone, ...(data.customer.birthday ? { birthday: data.customer.birthday } : {}) })).customer;
        if (!customer?.id) throw Object.assign(new Error('Customer creation pending'), { uncertain: true });
        if (existing && data.customer.birthday && !existing.birthday) {
          const updated = await square(`/v2/customers/${encodeURIComponent(customer.id)}`, { birthday: data.customer.birthday, ...(Number.isSafeInteger(existing.version) ? { version: existing.version } : {}) }, 'PUT');
          if (updated.customer?.id !== customer.id) throw Object.assign(new Error('Birthday update pending'), { uncertain: true });
        }
        data.customerId = customer.id;
        await validateSelection();
        await checkConflicts();
        const quote = new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.service.currency }).format(data.service.price / 100);
        const customerNote = [data.appointmentNote, data.customer.birthday && existing?.birthday && existing.birthday !== data.customer.birthday ? `Birthday supplied: ${data.customer.birthday}. Existing profile birthday retained.` : ''].filter(Boolean).join('\n');
        data.bookingRequest = { idempotency_key: `rb-${id}`, booking: { location_id: locationId, customer_id: customer.id, start_at: data.slot.startAt, ...(customerNote ? { customer_note: customerNote } : {}), appointment_segments: [{ duration_minutes: data.slot.durationMinutes, team_member_id: data.slot.staffId, service_variation_id: data.service.id, service_variation_version: data.slot.serviceVariationVersion }], seller_note: `WEBSITE BOOKING. ${data.service.price === 0 ? 'FREE CONSULTATION.' : `PAY AT SHOP. Quoted service price ${quote}.`} NO ONLINE PAYMENT TAKEN. Website reference ${id}.` } };
        await save('RESERVATION_CREATE_PENDING');
      }
      if (data.phase === 'RESERVATION_CREATE_PENDING') {
        // After an uncertain result replay exactly this body, never create a new key.
        const booking = (await square('/v2/bookings', data.bookingRequest)).booking;
        if (!booking?.id) throw Object.assign(new Error('Booking creation pending'), { uncertain: true });
        data.booking = booking;
        delete data.bookingRequest;
        await save('RESERVATION_VERIFY_PENDING');
      }
      if (data.phase === 'RESERVATION_VERIFY_PENDING') {
        const booking = (await square(`/v2/bookings/${encodeURIComponent(data.booking.id)}`)).booking;
        if (booking?.status !== 'ACCEPTED') throw new ReservationError('Square could not confirm your appointment. Please choose another time.');
        data.booking = booking;
        await checkConflicts();
        delete data.customer;
        await save('COMPLETE');
        await store.releaseSlot(id);
      }
      if (data.phase === 'RESERVATION_CANCEL_PENDING') await cancelOwnBooking();
    } catch (error) {
      if (!data || error.environmentMismatch) throw error;
      if (error.uncertain) await save(data.phase);
      else {
        data.error = error instanceof ReservationError ? error.message : 'The appointment could not be booked. Please try again.';
        await save('RESERVATION_CANCEL_PENDING');
        try { await cancelOwnBooking(); } catch { await save('RESERVATION_CANCEL_PENDING'); }
      }
    } finally { await store.release(id, owner); }
  }
  async function status(input, resume = false) {
    let { data } = await read(input.id, input.token);
    if (resume && data.flow === FLOW && !terminal(data.phase) && data.phase !== 'DRAFT') { await advance(input.id); data = (await read(input.id, input.token)).data; }
    return publicState(input.id, data);
  }
  async function confirm(input) {
    rejectPaymentInput(input);
    if (input.confirmed !== true) throw new ReservationError('Please confirm your appointment.');
    const { data } = await read(input.id, input.token);
    if (data.flow !== FLOW) throw new ReservationError('This reference belongs to the previous system. Please contact the shop.', 409);
    await advance(input.id);
    return status(input);
  }
  async function recoverPending() {
    for (const row of await store.pending()) { try { await advance(row.id); } catch { /* Retry the persisted request on the next recovery pass. */ } }
  }
  return { prepare, confirm, status, recoverPending };
}
