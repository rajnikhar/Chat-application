const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/chatApp');

const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    scheduledAt: Date,
    sent: { type: Boolean, default: false },
    isScheduled: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the project root

io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle instant message
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, message } = data;
        const newMessage = new Message({ sender, receiver, message, sent: true });
        await newMessage.save();
        io.emit('newMessage', newMessage);
    });

    // Handle scheduled message
    socket.on('scheduleMessage', async (data) => {
        const { sender, receiver, message, scheduledAt } = data;
        const newMessage = new Message({
            sender,
            receiver,
            message,
            scheduledAt,
            isScheduled: true
        });
        await newMessage.save();
        io.emit('newMessage', newMessage); // Emit immediately as scheduled

        // Schedule the message using node-cron
        const scheduledDate = new Date(scheduledAt);
        const cronTime = `${scheduledDate.getMinutes()} ${scheduledDate.getHours()} ${scheduledDate.getDate()} ${scheduledDate.getMonth() + 1} *`;

        cron.schedule(cronTime, async () => {
            newMessage.sent = true;
            newMessage.isScheduled = false;
            await newMessage.save();
            io.emit('messageSent', newMessage);
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
server.listen(6000, () => {
    console.log('Server running on http://localhost:5000');
});
