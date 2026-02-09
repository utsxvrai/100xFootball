const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const apiRoutes = require('./routes');
const { checkAndResetBoard } = require('./services/resetService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Schedule Global Reset every day at midnight UTC
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled 24h reset...');
    checkAndResetBoard(true); // Force reset
}, {
    scheduled: true,
    timezone: "UTC"
});

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
