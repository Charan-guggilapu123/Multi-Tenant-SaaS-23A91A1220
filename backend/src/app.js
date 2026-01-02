const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const runMigrations = require('./utils/migrate');
const seedDatabase = require('../seeds/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
app.use(express.json());

// CORS
// Allow requests from configured frontend origins (include Vite default 5173)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
    origin: [
        frontendUrl,
        'http://localhost:3000',
        'http://frontend:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
    credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes); // Includes users
app.use('/api/users', userRoutes);     // Direct user ops
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
    const db = require('./config/db');
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// Start Server
async function startServer() {
    try {
        // Run Migrations
        await runMigrations();

        // Run Seeds
        // We only seed if specific flag or env? 
        // "Database Initialization (MANDATORY - Automatic Only): Migrations and seed data MUST load automatically"
        // So we run it every time. Seed script should be idempotent (it checks for existence).
        await seedDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Startup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
