const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const http = require('http');
const apiRoutes = require('./routes');
const { checkAndResetBoard } = require('./services/resetService');
const socketIO = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Socket.IO
socketIO.init(server);

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

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

