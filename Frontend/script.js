const chatBox = document.getElementById('chat-box');
const ws = new WebSocket('ws://127.0.0.1:8000/ws');

// WebSocket connection handlers
ws.onopen = function () {
    console.log("✅ Connected to WebSocket server");
};

ws.onerror = function (error) {
    console.error("❌ WebSocket error:", error);
};

ws.onclose = function () {
    console.warn("⚠️ WebSocket closed");
};

// Display typing animation and handle bot response
ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    console.log("🤖 Bot replied:", data.response);

    typingIndicator();

    setTimeout(() => {
        displayMessage(data.response, 'bot');
    }, 2000);
};

// Function to display messages with avatars and timestamps
function displayMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    avatarDiv.textContent = sender === 'user' ? '👤' : '🤖';

    const messageContent = document.createElement('span');
    messageContent.textContent = message;

    const timestampDiv = document.createElement('span');
    timestampDiv.classList.add('timestamp');
    const currentTime = new Date().toLocaleTimeString();
    timestampDiv.textContent = `(${currentTime})`;

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timestampDiv);

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to send message
function sendMessage(message) {
    if (message) {
        displayMessage(message, 'user');
        ws.send(message);
    }
}

// Handle user input (Enter key or button click)
const inputField = document.getElementById('user-input');
inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const message = inputField.value.trim();
        sendMessage(message);
        inputField.value = '';
    }
});

document.getElementById('send-btn').addEventListener('click', () => {
    const message = inputField.value.trim();
    sendMessage(message);
    inputField.value = '';
});

// Typing animation
function typingIndicator() {
    const typingMessage = document.createElement("div");
    typingMessage.classList.add("message", "bot-message", "typing-indicator");
    typingMessage.textContent = "Friday is typing...";
    chatBox.appendChild(typingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        typingMessage.remove();
    }, 2000);
}

// Theme toggle
const toggleBtn = document.getElementById("themeToggleBtn");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️";
} else {
    toggleBtn.textContent = "🌙";
}

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    toggleBtn.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});
