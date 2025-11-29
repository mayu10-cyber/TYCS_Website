const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
// Load .env from project root if available, then fallback to current dir
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
    'http://localhost', // Covers all localhost ports
    'http://127.0.0.1', // Covers all 127.0.0.1 ports
    'file://', // For direct file access
    'null' // For some edge cases
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            return callback(null, true);
        }

        const msg = `CORS blocked for origin: ${origin}`;
        console.error(msg);
        return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// MySQL configuration
const DB_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const DB_PORT = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
const DB_USER = process.env.MYSQL_USER || 'root';
const DB_PASSWORD = Object.prototype.hasOwnProperty.call(process.env, 'MYSQL_PASSWORD')
    ? process.env.MYSQL_PASSWORD
    : '';
const DB_NAME = process.env.MYSQL_DATABASE || 'reviewsDB';

let pool; // MySQL connection pool

async function initDatabase() {
    if (!DB_HOST || !DB_USER || !DB_NAME) {
        throw new Error('Database configuration missing. Please set MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE in your .env file.');
    }
    // Ensure database exists (connect without database first)
    const adminConnection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD
    });
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await adminConnection.end();

    // Create pool for the target database
    pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // Ensure table exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            department VARCHAR(255) NOT NULL,
            rating DECIMAL(2,1) NOT NULL,
            feedback TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Attempt to adjust column type if table pre-existed
    try {
        await pool.query('ALTER TABLE reviews MODIFY COLUMN rating DECIMAL(2,1) NOT NULL');
    } catch (e) {
        // ignore if already correct or lacking permissions
    }

    console.log(`MySQL connected on ${DB_HOST}:${DB_PORT} (db: ${DB_NAME}) and ensured schema exists`);
}

// API Endpoints
app.post('/api/feedback', async (req, res) => {
    try {
        const { name, department, rating, feedback } = req.body;

        // Basic validation
        if (!name || !department || !feedback) {
            return res.status(400).json({ error: 'Name, department and feedback are required' });
        }
        const ratingNum = Number(rating);
        const isHalfStep = Number.isFinite(ratingNum) && Math.abs(ratingNum * 2 - Math.round(ratingNum * 2)) < 1e-9;
        if (!Number.isFinite(ratingNum) || ratingNum < 0.5 || ratingNum > 5 || !isHalfStep) {
            return res.status(400).json({ error: 'Rating must be between 0.5 and 5.0 in 0.5 steps' });
        }

        const [result] = await pool.query(
            'INSERT INTO reviews (name, department, rating, feedback) VALUES (?, ?, ?, ?)',
            [name, department, ratingNum, feedback]
        );

        // Return the inserted row shape compatible with frontend
        res.status(201).json({
            id: result.insertId,
            name,
            department,
            rating: Number(ratingNum.toFixed(1)),
            feedback,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('POST /api/feedback error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/feedback', async (req, res) => {
    try {
        console.log('Fetching reviews...');
        const [rows] = await pool.query('SELECT name, department, rating, feedback, created_at FROM reviews ORDER BY rating DESC');
        console.log(`Found ${rows.length} reviews`);
        // Map created_at to createdAt for compatibility (not used by frontend but harmless)
        const mapped = rows.map(r => ({
            name: r.name,
            department: r.department,
            rating: r.rating,
            feedback: r.feedback,
            createdAt: r.created_at
        }));
        res.json(mapped);
    } catch (err) {
        console.error('GET /api/feedback error:', err);
        res.status(500).json({
            error: 'Failed to fetch reviews',
            details: err.message
        });
    }
});

// Add health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        res.json({ status: 'OK', dbStatus: 'connected', database: DB_NAME, timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', dbStatus: err.message, timestamp: new Date() });
    }
});

const PORT = process.env.PORT || 5502;

async function start() {
    try {
        await initDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Try these endpoints:');
            console.log(`http://localhost:${PORT}/api/health`);
            console.log(`http://localhost:${PORT}/api/feedback`);
        });
    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
}

start();