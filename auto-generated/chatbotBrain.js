/* ============================================
   CAFEBOT — CHATBOT LOGIC (Part A: UI behaviour)
   Handles opening/closing the chat panel,
   rendering messages, and capturing input.
   This file must be loaded AFTER storage.js
   on every page (since it uses getOrders()).
   ============================================ */

let chatOpen = false;
let chatInitialized = false;

/* These get assigned once the page loads */
let panel, messagesEl, inputEl, sendBtn;

function initChatRefs() {
  panel = document.getElementById('chat-panel');
  messagesEl = document.getElementById('chat-messages');
  inputEl = document.getElementById('chat-input');
  sendBtn = document.getElementById('chat-send');
}

/* Format current time like "10:42 AM" */
function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* Add a message bubble to the chat window */
function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `msg ${sender}`; // 'msg bot' or 'msg user'
  div.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${now()}</div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight; // auto-scroll down
}

/* Show animated "..." typing dots while bot "thinks" */
function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typing';
  div.innerHTML = `<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

/* Open or close the chat panel */
function toggleChat() {
  chatOpen = !chatOpen;
  panel.classList.toggle('open', chatOpen);

  if (chatOpen && !chatInitialized) {
    chatInitialized = true;
    setTimeout(() => {
      addMessage('👋 Hi! I\'m your Brewed &amp; Co. assistant. Ask me about orders, customers, or sales — I read live from our order data.', 'bot');
    }, 300);
    const badge = document.getElementById('chat-unread');
    if (badge) badge.style.display = 'none';
  }
}

/* Called when user clicks Send or presses Enter */
function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  inputEl.value = '';
  inputEl.style.height = '';
  sendBtn.disabled = true;

  showTyping();
  setTimeout(() => {
    removeTyping();
    const reply = getBotReply(text); // defined in Part B
    addMessage(reply, 'bot');
    sendBtn.disabled = false;
  }, 900);
}

/* Quick reply chips call this */
function sendChip(btn) {
  inputEl.value = btn.textContent;
  sendMessage();
}

/* Enter key sends message, Shift+Enter makes a new line */
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

/* Textarea grows as user types more lines */
function autoGrow(el) {
  el.style.height = '';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

/* Run once the page has fully loaded */
document.addEventListener('DOMContentLoaded', initChatRefs);


/* ============================================
   CHATBOT LOGIC (Part B: The ML Pipeline Brain)
   Sends input text straight to the local Python
   XGBoost server instead of checking hardcoded loops.
   ============================================ */

/* We override your old sendMessage function to support async/await fetch operations */
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  // 1. Render user message instantly in your UI window
  addMessage(text, 'user');
  inputEl.value = '';
  inputEl.style.height = '';
  sendBtn.disabled = true;

  // 2. Turn on the animated thinking dots "..."
  showTyping();

  try {
    // 3. Send the query string directly over to your Flask application port 5000
    const response = await fetch('http://127.0.0.1:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });

    const data = await response.json();
    
    // 4. Remove typing dots and present your real ML output prediction
    removeTyping();
    addMessage(data.response, 'bot');

  } catch (error) {
    console.error("Pipeline connection failure:", error);
    removeTyping();
    addMessage("⚠️ Couldn't reach the ML server. Please make sure your terminal is running 'python app.py'!", "bot");
  } finally {
    sendBtn.disabled = false;
  }
}