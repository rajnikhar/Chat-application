const socket = io();

const messagesDiv = document.getElementById('messages');
const sendButton = document.getElementById('sendButton');
const scheduleButton = document.getElementById('scheduleButton');
const messageText = document.getElementById('messageText');
const scheduleTime = document.getElementById('scheduleTime');

// Receive and display new messages
socket.on('newMessage', (data) => {
    const messageElem = document.createElement('div');
    messageElem.classList.add('message');

    if (data.isScheduled && !data.sent) {
        messageElem.classList.add('scheduled');
        messageElem.textContent = `${data.sender}: ${data.message} (Scheduled for ${new Date(data.scheduledAt).toLocaleTimeString()})`;
    } else if (data.sent) {
        messageElem.classList.add('sent');
        messageElem.textContent = `${data.sender}: ${data.message} (Sent)`;
    } else {
        messageElem.classList.add('received');
        messageElem.textContent = `${data.sender}: ${data.message}`;
    }

    messagesDiv.appendChild(messageElem);
});

// Update UI when a scheduled message is sent
socket.on('messageSent', (data) => {
    const scheduledMessages = document.querySelectorAll('.scheduled');
    scheduledMessages.forEach(msg => {
        if (msg.textContent.includes(data.message)) {
            msg.classList.remove('scheduled');
            msg.classList.add('sent');
            msg.textContent = `${data.sender}: ${data.message} (Sent)`;
        }
    });
});

// Send message immediately
sendButton.addEventListener('click', () => {
    const message = messageText.value;
    if (message.trim() !== "") {
        socket.emit('sendMessage', { sender: 'User1', receiver: 'User2', message });
        messageText.value = '';
    }
});

// Schedule a message
scheduleButton.addEventListener('click', () => {
    const message = messageText.value;
    const scheduledAt = scheduleTime.value;
    if (message && scheduledAt) {
        socket.emit('scheduleMessage', {
            sender: 'User1', receiver: 'User2', message, scheduledAt
        });
        messageText.value = '';
        scheduleTime.value = '';
    } else {
        alert('Please enter a message and select a time.');
    }
});
