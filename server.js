const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static('public'));

const adjectives = fs.readFileSync('adjectives.txt', 'utf-8').trim().split('\n');
const nouns = fs.readFileSync('nouns.txt', 'utf-8').trim().split('\n');

function getRandomUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

// Persistence
const USERS_FILE = 'users.json';
const CHAT_LOG_FILE = 'chatlog.json';

let persistedUsers = {};
let chatHistory = [];

if (fs.existsSync(USERS_FILE)) {
  persistedUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

if (fs.existsSync(CHAT_LOG_FILE)) {
  chatHistory = JSON.parse(fs.readFileSync(CHAT_LOG_FILE, 'utf-8'));
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(persistedUsers, null, 2), 'utf-8');
}

function saveChatHistory() {
  fs.writeFileSync(CHAT_LOG_FILE, JSON.stringify(chatHistory.slice(-1000), null, 2), 'utf-8');
}

const users = new Map(); // socket.id => username

io.on('connection', (socket) => {
  socket.on('hello', (userId) => {
    if (!persistedUsers[userId]) {
      persistedUsers[userId] = getRandomUsername();
      saveUsers();
    }

    socket.userId = userId;
    socket.username = persistedUsers[userId];
    users.set(socket.id, socket.username);

    console.log(`${socket.username} connected`);
    socket.emit('chat history', chatHistory);
    socket.broadcast.emit('user connected', socket.username);
    io.emit('user list', Array.from(users.values()));

    socket.on('chat message', (msg) => {
      const message = {
        username: socket.username,
        msg: msg.trim().slice(0, 500),
        timestamp: Date.now()
      };
      chatHistory.push(message);
      saveChatHistory();
      io.emit('chat message', message);
    });

    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('typing', {
        username: socket.username,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`${socket.username} disconnected`);
      users.delete(socket.id);
      socket.broadcast.emit('user disconnected', socket.username);
      io.emit('user list', Array.from(users.values()));
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
