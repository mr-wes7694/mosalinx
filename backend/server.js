const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const pool = require('./config/database');
const logger = require('./middleware/logger');
const userRoutes = require('./routes/userRoutes');
const resourceRoutes = require('./routes/resourceRoutes');

const app = express();

app.use(cors());
app.use(logger);
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Mosalinx backend is running!' });
});

const startServer = async () => {
    try {
        await pool.query('SELECT 1');

        console.log('Database connection successful.');

        app.listen(config.port, () => {
            console.log("Mosalinx backend is running on port " + config.port);
        });
    } catch (error) {
        console.error('Database connection failed:');
        console.error(error);
        process.exit(1);
    }
};

startServer();
