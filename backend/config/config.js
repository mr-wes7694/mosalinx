// Configuration file for the backend server
require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        name: process.env.DB_NAME || 'mosalinx_dev',
        user: process.env.DB_USER || 'mosalinx_dev',
        password: process.env.DB_PASSWORD,
    },

    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    },
};

module.exports = config;