CREATE TABLE IF NOT EXISTS booking_holds (
  id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, encrypted TEXT NOT NULL,
  staff_id TEXT NOT NULL, starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'ACTIVE'
);
CREATE INDEX IF NOT EXISTS booking_hold_staff ON booking_holds(staff_id, starts_at, ends_at, expires_at);
