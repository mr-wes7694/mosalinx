const fs = require('fs');

const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    ssl: config.db.ssl
        ? {
            ca: process.env.DB_SSL_CA
                ? process.env.DB_SSL_CA.replace(/\\n/g, '\n')
                : fs.readFileSync(
                    process.env.DB_SSL_CA_PATH || './certs/ca.pem',
                    'utf8'
                ),
            rejectUnauthorized: true,
        }
        : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = pool;