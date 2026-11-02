import { createReservationCrypto } from './booking-crypto.mjs';
import { HOLD_DURATION_MS } from '../src/lib/booking-policy.mjs';

export class HoldError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}
const valid = input => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id || '') && /^[a-zA-Z0-9_-]{40,100}$/.test(input.token || '');

export function createHoldService({ store, secret, availability, now = () => Date.now() }) {
  const crypto = createReservationCrypto(secret);
  async function read(input) {
    if (!valid(input)) throw new HoldError('This appointment hold could not be verified.', 403);
    const row = await store.getHold(input.id);
    if (!row || row.auth_hash !== await (await crypto).auth(`${input.id}:${input.token}`)) throw new HoldError('This appointment hold could not be verified.', 403);
    return { row, data: await (await crypto).open(row.encrypted) };
  }
  function state(row, data) {
    return { id: row.id, status: row.state === 'ACTIVE' && row.expires_at <= now() ? 'EXPIRED' : row.state, expiresAt: new Date(row.expires_at).toISOString(), serverNow: new Date(now()).toISOString(), ...data };
  }
  async function status(input) { const { row, data } = await read(input); return state(row, data); }
  async function create(input) {
    if (!valid(input)) throw new HoldError('Start a new appointment hold.', 400);
    if (await store.getHold(input.id)) {
      const result = await status(input);
      if (result.service.id !== input.serviceId || result.slot.id !== input.slotId || result.date !== input.date) throw new HoldError('This hold belongs to another selection. Choose your time again.');
      if (result.status !== 'ACTIVE') throw new HoldError('This appointment hold has ended. Choose your time again.');
      return result; // An idempotent retry never renews the deadline.
    }
    const result = await availability({ date: input.date, serviceId: input.serviceId, staffId: input.staffId }, { excludeHoldId: input.id });
    const slot = result.slots.find(value => value.id === input.slotId);
    if (!slot) throw new HoldError('That appointment is no longer available. Choose another time.');
    const data = { date: input.date, service: result.service, slot, policy: result.policy };
    const createdAt = now();
    const inserted = await store.insertHold({ id: input.id, authHash: await (await crypto).auth(`${input.id}:${input.token}`), encrypted: await (await crypto).seal(data), staffId: slot.staffId, start: Date.parse(slot.startAt), end: Date.parse(slot.startAt) + slot.durationMinutes * 60000, expiresAt: createdAt + HOLD_DURATION_MS }, createdAt);
    if (!inserted) {
      if (await store.getHold(input.id)) return create(input);
      throw new HoldError('Another customer is holding this time. Choose another appointment.');
    }
    return status(input);
  }
  async function active(input) {
    const result = await status(input);
    if (result.status !== 'ACTIVE') throw new HoldError('Your 10-minute hold has ended. Choose your time again.');
    return result;
  }
  async function release(input) {
    await read(input);
    await store.releaseHold(input.id);
    return status(input);
  }
  return { create, status, active, release };
}
