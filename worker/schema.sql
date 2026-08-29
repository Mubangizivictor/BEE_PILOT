DROP TABLE IF EXISTS bookings;
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    customerName TEXT,
    customerPhone TEXT,
    pickupLocation TEXT,
    destination TEXT,
    date TEXT,
    time TEXT,
    passengers INTEGER,
    bags INTEGER,
    serviceType TEXT,
    totalFare REAL,
    depositAmount REAL,
    status TEXT DEFAULT 'awaiting_confirmation',
    paymentMethod TEXT,
    notes TEXT,
    createdAt TEXT,
    paymentConfirmed INTEGER DEFAULT 0
);
