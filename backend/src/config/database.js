const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the PostgreSQL database.');
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
        console.error('Database initialization error:', err);
    }
};

initDB();

module.exports = db;
