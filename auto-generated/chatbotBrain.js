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
   CHATBOT LOGIC (Part B: The "brain")
   This reads real data from storage.js
   and decides how to answer the user.
   ============================================ */

function getBotReply(userText) {
  const msg = userText.toLowerCase();
  const orders = getOrders(); // comes from storage.js

  /* ── No orders yet ── */
  if (orders.length === 0) {
    return "There are no orders placed yet. Once customers place orders on the Order page, I'll be able to answer questions about them!";
  }

  /* ── "top clients" or "best customers" ── */
  if (msg.includes('top client') || msg.includes('best customer') || msg.includes('top customer')) {
    return buildTopClientsReply(orders);
  }

  /* ── "today" orders/revenue ── */
  if (msg.includes('today')) {
    return buildTodayReply(orders);
  }

  /* ── total orders count ── */
  if (msg.includes('how many order') || msg.includes('total order')) {
    return `📦 We have <b>${orders.length}</b> order(s) recorded so far.`;
  }

  /* ── total revenue ── */
  if (msg.includes('revenue') || msg.includes('total sales') || msg.includes('total earning')) {
    const total = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return `💰 Total revenue so far: <b>₹${total.toFixed(2)}</b> across ${orders.length} order(s).`;
  }

  /* ── last order ── */
  if (msg.includes('last order') || msg.includes('latest order') || msg.includes('recent order')) {
    const last = orders[orders.length - 1];
    return `🧾 Latest order: <b>${last.name}</b> (${last.phone})<br>Items: ${last.items}<br>Total: ₹${last.total}`;
  }

  /* ── search by customer name ── */
  const nameMatch = orders.find(o => msg.includes(o.name.toLowerCase()));
  if (nameMatch) {
    const customerOrders = orders.filter(o => o.name.toLowerCase() === nameMatch.name.toLowerCase());
    const spent = customerOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return `👤 <b>${nameMatch.name}</b> has placed ${customerOrders.length} order(s), total spend ₹${spent.toFixed(2)}.`;
  }

  /* ── fallback: didn't understand ── */
  return `I'm not sure how to answer that yet. Try asking:<br>
    • "Top clients"<br>
    • "Today's orders"<br>
    • "Total revenue"<br>
    • "Last order"`;
}

/* Helper: builds the "top clients" answer by grouping orders per customer */
function buildTopClientsReply(orders) {
  const totals = {}; // { "Rahul": 450, "Priya": 220, ... }

  orders.forEach(o => {
    const key = o.name;
    totals[key] = (totals[key] || 0) + Number(o.total || 0);
  });

  // Convert to array, sort highest spend first, take top 10
  const ranked = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let reply = '📊 <b>Top clients by total spend:</b><br>';
  ranked.forEach(([name, total], i) => {
    reply += `${i + 1}. ${name} — ₹${total.toFixed(2)}<br>`;
  });
  return reply;
}

/* Helper: builds today's orders/revenue summary */
function buildTodayReply(orders) {
  const todayStr = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);

  if (todaysOrders.length === 0) {
    return "No orders have been placed today yet.";
  }

  const total = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  return `📅 <b>Today's summary:</b><br>Orders: ${todaysOrders.length}<br>Revenue: ₹${total.toFixed(2)}`;
}