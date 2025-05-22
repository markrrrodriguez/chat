const socket = io();

// Use localStorage to persist userId between sessions
let userId = localStorage.getItem('userId');
if (!userId) {
  // Generate a simple random userId, you can improve this
  userId = Math.random().toString(36).substring(2, 10);
  localStorage.setItem('userId', userId);
}

// Emit 'hello' event with userId to register with the server
socket.emit('hello', userId);
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const typingIndicator = document.createElement('div');
typingIndicator.id = 'typing';
messages.after(typingIndicator);

let typing = false;
let timeout;

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
    socket.emit('typing', false);
    typing = false;
  }
});

input.addEventListener('input', () => {
  if (!typing) {
    typing = true;
    socket.emit('typing', true);
  }
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    typing = false;
    socket.emit('typing', false);
  }, 1000);
});

const userList = document.getElementById('user-list');

socket.on('user list', (users) => {
  userList.innerHTML = '';
  users.forEach(username => {
    const li = document.createElement('li');
    li.textContent = username;
    userList.appendChild(li);
  });
});

socket.on('chat message', ({ username, msg }) => {
  const item = document.createElement('li');
  item.textContent = `${username}: ${msg}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('typing', ({ username, isTyping }) => {
  typingIndicator.textContent = isTyping ? `${username} is typing...` : '';
});

socket.on('user connected', (username) => {
  const item = document.createElement('li');
  item.textContent = `${username} joined the chat`;
  item.style.fontStyle = 'italic';
  messages.appendChild(item);
});

socket.on('user disconnected', (username) => {
  const item = document.createElement('li');
  item.textContent = `${username} left the chat`;
  item.style.fontStyle = 'italic';
  messages.appendChild(item);
});
