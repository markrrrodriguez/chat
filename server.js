const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static('public'));

// Helper: Generate random username
function getRandomUsername() {
  const adjectives = fs.readFileSync('adjectives.txt', 'utf-8').trim().split('\n');
  const nouns = fs.readFileSync('nouns.txt', 'utf-8').trim().split('\n');

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective} ${noun}`;
}

const users = new Map(); // socket.id => username

io.on('connection', (socket) => {
  socket.username = getRandomUsername();
  users.set(socket.id, socket.username);
  console.log(`${socket.username} connected`);

  socket.broadcast.emit('user connected', socket.username);
  io.emit('user list', Array.from(users.values()));

  socket.on('chat message', (msg) => {
    io.emit('chat message', { username: socket.username, msg });
  });

  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', { username: socket.username, isTyping });
  });

  socket.on('disconnect', () => {
    console.log(`${socket.username} disconnected`);
    users.delete(socket.id);
    socket.broadcast.emit('user disconnected', socket.username);
    io.emit('user list', Array.from(users.values()));
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://localhost:3000');
});
