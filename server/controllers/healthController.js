const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const os = require('os');

exports.getSystemHealth = async (req, res) => {
    try {
        const start = Date.now();
        const healthStatus = {
            server: {
                status: 'online',
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                loadAverage: os.loadavg(),
                platform: os.platform(),
                hostname: os.hostname()
            },
            database: {
                status: 'unknown',
                latency: 0,
                name: sequelize.getDialect() === 'postgres' ? 'Neon PostgreSQL' : 'SQLite Local'
            },
            stats: {
                totalLeads: 0,
                totalUsers: 0,
                totalAttendancesLast30Days: 0
            },
            timestamp: new Date()
        };

        // 1. Check Database
        try {
            const dbStart = Date.now();
            await sequelize.authenticate();
            // Run a simple query to ensure responsiveness
            await sequelize.query('SELECT 1');
            healthStatus.database.latency = Date.now() - dbStart;
            healthStatus.database.status = 'online';
        } catch (dbError) {
            console.error('Database Health Check Failed:', dbError);
            healthStatus.database.status = 'offline';
            healthStatus.database.error = dbError.message;
        }

        // 2. Fetch Basic Stats (only if DB is online)
        if (healthStatus.database.status === 'online') {
            try {
                const [leadsCount, usersCount] = await Promise.all([
                    Lead.count(),
                    User.count()
                ]);

                // Count attendances in the last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                // Check if Attendance model exists/is imported correctly before querying
                let attendancesCount = 0;
                try {
                    attendancesCount = await Attendance.count({
                        where: {
                            createdAt: {
                                [Sequelize.Op.gte]: thirtyDaysAgo
                            }
                        }
                    });
                } catch (e) {
                    console.warn('Attendance count failed, possibly due to missing table or logic', e);
                }

                healthStatus.stats.totalLeads = leadsCount;
                healthStatus.stats.totalUsers = usersCount;
                healthStatus.stats.totalAttendancesLast30Days = attendancesCount;

            } catch (statsError) {
                console.error('Stats Health Check Failed:', statsError);
                healthStatus.stats.error = 'Failed to retrieve stats';
            }
        }

        // Response Time
        const duration = Date.now() - start;
        res.set('X-Response-Time', `${duration}ms`);

        res.json(healthStatus);

    } catch (error) {
        console.error('Health Check Critical Error:', error);
        res.status(500).json({
            status: 'critical_failure',
            error: error.message
        });
    }
};
