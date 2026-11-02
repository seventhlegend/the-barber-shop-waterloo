export const HOLD_SCHEMA = `
CREATE TABLE IF NOT EXISTS booking_holds (
  id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, encrypted TEXT NOT NULL,
  staff_id TEXT NOT NULL, starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'ACTIVE'
);
CREATE INDEX IF NOT EXISTS booking_hold_staff ON booking_holds(staff_id, starts_at, ends_at, expires_at);
`;

export const CHECKOUT_SCHEMA = `
CREATE TABLE IF NOT EXISTS checkouts (
  id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, encrypted TEXT NOT NULL,
  phase TEXT NOT NULL, terminal INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  lease_owner TEXT, lease_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS checkout_slots (
  checkout_id TEXT PRIMARY KEY, staff_id TEXT NOT NULL, starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS checkout_slot_staff ON checkout_slots(staff_id, starts_at, ends_at);
CREATE TABLE IF NOT EXISTS booking_rate_limits (
  key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS booking_rate_expiry ON booking_rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS booking_webhook_events (
  event_id TEXT PRIMARY KEY, received_at INTEGER NOT NULL
);
${HOLD_SCHEMA}
`;

// All transitions use a database lease. Slot claims are a single atomic SQL statement.
export function createCheckoutStore(db) {
  return {
    get: id => db.first('SELECT * FROM checkouts WHERE id = ?', [id]),
    async insert(row) {
      await db.run('INSERT INTO checkouts (id, auth_hash, encrypted, phase, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING', [row.id, row.authHash, row.encrypted, row.phase, row.now, row.now]);
    },
    async acquire(id, owner, now) {
      return (await db.run('UPDATE checkouts SET lease_owner = ?, lease_until = ? WHERE id = ? AND lease_until < ?', [owner, now + 300000, id, now])).changes === 1;
    },
    async save(id, owner, data, phase, terminal, now) {
      const result = await db.run('UPDATE checkouts SET encrypted = ?, phase = ?, terminal = ?, updated_at = ? WHERE id = ? AND lease_owner = ?', [data, phase, terminal ? 1 : 0, now, id, owner]);
      if (result.changes !== 1) throw new Error('Checkout lease lost');
    },
    release: (id, owner) => db.run('UPDATE checkouts SET lease_until = 0, lease_owner = NULL WHERE id = ? AND lease_owner = ?', [id, owner]),
    async claimSlot(id, staffId, start, end, now, requireHold = false) {
      const result = await db.run(`INSERT INTO checkout_slots (checkout_id, staff_id, starts_at, ends_at) SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM checkout_slots WHERE staff_id = ? AND starts_at < ? AND ends_at > ? AND checkout_id != ?) AND NOT EXISTS (SELECT 1 FROM booking_holds WHERE staff_id = ? AND starts_at < ? AND ends_at > ? AND expires_at > ? AND state = 'ACTIVE' AND id != ?) ${requireHold ? "AND EXISTS (SELECT 1 FROM booking_holds WHERE id = ? AND state = 'ACTIVE' AND expires_at > ? AND staff_id = ? AND starts_at = ? AND ends_at = ?)" : ''} ON CONFLICT(checkout_id) DO NOTHING`, [id, staffId, start, end, staffId, end, start, id, staffId, end, start, now, id, ...(requireHold ? [id, now, staffId, start, end] : [])]);
      return result.changes === 1 || !!await db.first('SELECT checkout_id FROM checkout_slots WHERE checkout_id = ?', [id]);
    },
    releaseSlot: id => db.run('DELETE FROM checkout_slots WHERE checkout_id = ?', [id]),
    pending: () => db.all("SELECT id FROM checkouts WHERE terminal = 0 AND phase LIKE 'RESERVATION_%' ORDER BY updated_at LIMIT 20", []),
    getHold: id => db.first('SELECT * FROM booking_holds WHERE id = ?', [id]),
    async insertHold(row, now) {
      const result = await db.run("INSERT INTO booking_holds (id, auth_hash, encrypted, staff_id, starts_at, ends_at, expires_at, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM booking_holds WHERE staff_id = ? AND starts_at < ? AND ends_at > ? AND expires_at > ? AND state = 'ACTIVE') AND NOT EXISTS (SELECT 1 FROM checkout_slots WHERE staff_id = ? AND starts_at < ? AND ends_at > ?) ON CONFLICT(id) DO NOTHING", [row.id, row.authHash, row.encrypted, row.staffId, row.start, row.end, row.expiresAt, now, row.staffId, row.end, row.start, now, row.staffId, row.end, row.start]);
      return result.changes === 1;
    },
    releaseHold: id => db.run("UPDATE booking_holds SET state = 'RELEASED' WHERE id = ? AND state = 'ACTIVE'", [id]),
    consumeHold: id => db.run("UPDATE booking_holds SET state = 'CONSUMED' WHERE id = ? AND state = 'ACTIVE'", [id]),
    blockedSlots: (staffIds, start, end, now, exceptId = '') => db.all(`SELECT staff_id, starts_at, ends_at FROM booking_holds WHERE staff_id IN (${staffIds.map(() => '?').join(',')}) AND starts_at < ? AND ends_at > ? AND expires_at > ? AND state = 'ACTIVE' AND id != ? UNION ALL SELECT staff_id, starts_at, ends_at FROM checkout_slots WHERE staff_id IN (${staffIds.map(() => '?').join(',')}) AND starts_at < ? AND ends_at > ? AND checkout_id != ?`, [...staffIds, end, start, now, exceptId, ...staffIds, end, start, exceptId]),
  };
}

export function createD1CheckoutStore(database) {
  return createCheckoutStore({
    first: (sql, args) => database.prepare(sql).bind(...args).first(),
    all: async (sql, args) => (await database.prepare(sql).bind(...args).all()).results,
    run: async (sql, args) => ({ changes: (await database.prepare(sql).bind(...args).run()).meta.changes }),
  });
}
