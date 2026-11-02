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

CREATE TABLE IF NOT EXISTS booking_holds (
  id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, encrypted TEXT NOT NULL,
  staff_id TEXT NOT NULL, starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'ACTIVE'
);
CREATE INDEX IF NOT EXISTS booking_hold_staff ON booking_holds(staff_id, starts_at, ends_at, expires_at);
