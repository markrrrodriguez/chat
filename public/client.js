const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static('public'));

const db = new Database('chat.sqlite');

// Load adjectives and nouns
const adjectives = fs.readFileSync('adjectives.txt', 'utf-8').trim().split('\n');
const nouns = fs.readFileSync('nouns.txt', 'utf-8').trim().split('\n');

function getRandomUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

// --- Initialize Database Tables ---
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    username TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    username TEXT,
    msg TEXT,
    timestamp INTEGER
  )
`).run();

// --- Runtime User Map ---
const users = new Map(); // socket.id => username

// --- Socket Handling ---
io.on('connection', (socket) => {
  socket.on('hello', (userId) => {
    let user = db.prepare(`SELECT * FROM users WHERE userId = ?`).get(userId);

    if (!user) {
      const newUsername = getRandomUsername();
      db.prepare(`INSERT INTO users (userId, username) VALUES (?, ?)`).run(userId, newUsername);
      user = { userId, username: newUsername };
    }

    socket.userId = user.userId;
    socket.username = user.username;
    users.set(socket.id, socket.username);

    console.log(`${socket.username} connected`);

    // Send last 100 messages
    const history = db.prepare(`
      SELECT username, msg, timestamp FROM messages
      ORDER BY timestamp DESC LIMIT 100
    `).all().reverse();

    socket.emit('chat history', history);
    socket.broadcast.emit('user connected', socket.username);
    io.emit('user list', Array.from(users.values()));

    // Chat message
    socket.on('chat message', (msg) => {
      msg = msg.trim().slice(0, 500);
      const timestamp = Date.now();

      db.prepare(`
        INSERT INTO messages (userId, username, msg, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(socket.userId, socket.username, msg, timestamp);

      io.emit('chat message', { username: socket.username, msg, timestamp });
    });

    // Typing
    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('typing', {
        username: socket.username,
        isTyping
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`${socket.username} disconnected`);
      users.delete(socket.id);
      socket.broadcast.emit('user disconnected', socket.username);
      io.emit('user list', Array.from(users.values()));
    });
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
