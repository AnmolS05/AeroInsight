const { Pool } = require('pg');

const isLocalDb = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalDb ? false : (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' 
        ? { rejectUnauthorized: false } 
        : true)
});

db.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

db.connect((err, client, release) => {
    if (err) {
        console.error('Initial database connection failed (falling back to graceful handling):', err.message);
    } else {
        console.log('Connected to the PostgreSQL database.');
        release();
    }
});

// Initialize tables
const initDB = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS flights (
                id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS telemetry (
                id SERIAL PRIMARY KEY,
                flight_id TEXT,
                latitude REAL,
                longitude REAL,
                altitude REAL,
                battery REAL,
                issue TEXT,
                timestamp TEXT,
                FOREIGN KEY (flight_id) REFERENCES flights (id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                flight_id TEXT,
                report_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (flight_id) REFERENCES flights (id)
            )
        `);
    } catch (err) {
        console.error('Database initialization error:', err.message || err);
    }
};

// Resilient In-Memory Fallback Store (active when PostgreSQL is disconnected or starting up)
const inMemoryStore = {
    flights: new Map(),
    telemetry: new Map(),
    reports: new Map(),

    saveFlight(id, data = {}) {
        const record = { id, created_at: data.created_at || new Date().toISOString() };
        this.flights.set(id, record);
        return record;
    },
    saveTelemetry(flightId, points = []) {
        this.telemetry.set(flightId, points);
    },
    saveReport(flightId, reportText) {
        this.reports.set(flightId, reportText);
    },
    getFlights() {
        return Array.from(this.flights.values());
    },
    getTelemetry(flightId) {
        return this.telemetry.get(flightId) || [];
    },
    getReport(flightId) {
        return this.reports.get(flightId) || null;
    },
    deleteFlight(flightId) {
        this.flights.delete(flightId);
        this.telemetry.delete(flightId);
        this.reports.delete(flightId);
    }
};

db.inMemoryStore = inMemoryStore;

initDB();

module.exports = db;
