const express = require('express');
const config = require('./config/config');
const logger = require('./middleware/logger');
const app = express();

app.use(logger);
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Mosalinx backend is running!' });
});

app.listen(config.port, () => {
    console.log(`Mosalinx backend is running on port ${config.port}`);
});