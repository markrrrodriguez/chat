const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = new Map(); // socket.id -> username

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  const username = `User${Math.floor(Math.random() * 1000)}`;
  users.set(socket.id, username);

  io.emit('user connected', username);
  io.emit('user list', Array.from(users.values()));

  socket.on('chat message', (msg) => {
    io.emit('chat message', { username, msg });
  });

  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', { username, isTyping });
  });

  socket.on('disconnect', () => {
    io.emit('user disconnected', username);
    users.delete(socket.id);
    io.emit('user list', Array.from(users.values()));
  });
});

server.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
