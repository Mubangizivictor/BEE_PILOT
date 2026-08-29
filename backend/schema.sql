PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS fare_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  minimum_town_fare INTEGER NOT NULL DEFAULT 10000,
  base_fare INTEGER NOT NULL DEFAULT 5000,
  town_rate_per_km INTEGER NOT NULL DEFAULT 2500,
  outstation_rate_per_km INTEGER NOT NULL DEFAULT 3500,
  rate_per_minute INTEGER NOT NULL DEFAULT 0,
  waiting_per_15_minutes INTEGER NOT NULL DEFAULT 5000,
  night_surcharge_percent INTEGER NOT NULL DEFAULT 15,
  deposit_percent INTEGER NOT NULL DEFAULT 30,
  special_hire_day_rate INTEGER NOT NULL DEFAULT 450000,
  return_factor REAL NOT NULL DEFAULT 1.5,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO fare_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  public_token TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_at TEXT NOT NULL,
  passengers INTEGER NOT NULL DEFAULT 1,
  bags INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  distance_meters INTEGER,
  duration_seconds INTEGER,
  total_fare INTEGER NOT NULL,
  deposit_required INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  trip_status TEXT NOT NULL DEFAULT 'awaiting_confirmation',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('mtn_momo', 'airtel_money', 'bank')),
  transaction_reference TEXT NOT NULL,
  received_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  issued_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
