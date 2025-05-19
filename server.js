const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
  const username = getRandomUsername();
  users.set(socket.id, username);
  console.log(`${username} connected`);

  socket.broadcast.emit('user connected', username);

  socket.on('chat message', (msg) => {
    io.emit('chat message', { username, msg });
  });

  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', { username, isTyping });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    socket.broadcast.emit('user disconnected', username);
    console.log(`${username} disconnected`);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
