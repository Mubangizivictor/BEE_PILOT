-- Drop existing tables if they exist (Be careful in production, but here we are setting up)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS fare_settings;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS admin_users;

-- Bookings Table
CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    pickupLocation TEXT NOT NULL,
    destination TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    passengers INTEGER NOT NULL,
    bags INTEGER DEFAULT 0,
    serviceType TEXT NOT NULL,
    totalFare REAL NOT NULL,
    depositAmount REAL NOT NULL,
    currency TEXT DEFAULT 'UGX',
    status TEXT DEFAULT 'draft', -- draft, awaiting_payment, payment_submitted, confirmed, scheduled, in_progress, completed, cancelled
    paymentMethod TEXT,
    notes TEXT,
    distanceKm REAL,
    durationMins REAL,
    fareSnapshot TEXT, -- JSON snapshot of fare rules at time of booking
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fare Settings Table
CREATE TABLE fare_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    configKey TEXT UNIQUE NOT NULL,
    configValue TEXT NOT NULL, -- JSON string
    version INTEGER DEFAULT 1,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    bookingId TEXT NOT NULL,
    method TEXT NOT NULL, -- momo, airtel, bank
    amount REAL NOT NULL,
    transactionRef TEXT,
    status TEXT DEFAULT 'unpaid', -- unpaid, awaiting_verification, confirmed, rejected, refunded
    verifiedBy TEXT,
    verifiedAt DATETIME,
    ownerNote TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bookingId) REFERENCES bookings(id)
);

-- Drivers Table
CREATE TABLE drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    plateNumber TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- Sedan, SUV, Van
    status TEXT DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    userId TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users (Simple PIN-based auth for v1 as requested, but stored hashed in prod)
CREATE TABLE admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
);

-- Initial Fare Settings
INSERT INTO fare_settings (configKey, configValue) VALUES ('default_fares', '{
    "baseFare": 1250,
    "perKm": 850,
    "perMin": 130,
    "minFare": 6000,
    "intercityBase": 10000,
    "intercityPerKm": 1300,
    "intercityThresholdKm": 25,
    "waitingTimePer15Min": 5000,
    "nightSurchargeRate": 0.15,
    "depositRate": 0.30,
    "returnTripFactor": 1.5,
    "specialHireDayRate": 450000
}');

-- Indexes
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_token ON bookings(token);
CREATE INDEX idx_payments_bookingId ON payments(bookingId);
