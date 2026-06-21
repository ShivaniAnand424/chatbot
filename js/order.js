/* ============================================
   ORDER PAGE — cart logic
   Requires MENU_DATA (menu-data.js) and
   addOrder() (storage.js) to already be loaded.
   ============================================ */

let cart = {}; // { itemId: quantity }

/* Render the searchable item list on the left */
function renderItemList() {
  const query = document.getElementById('item-search').value.trim().toLowerCase();
  const listEl = document.getElementById('item-list');

  const filtered = query
    ? MENU_DATA.filter(item => item.name.toLowerCase().includes(query))
    : MENU_DATA;

  if (filtered.length === 0) {
    listEl.innerHTML = '<p class="no-results">No items match your search.</p>';
    return;
  }

  // Group filtered items by category so the list stays organised
  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  let html = '';
  for (const category in grouped) {
    html += `<p class="list-group-title">${category}</p>`;
    grouped[category].forEach(item => {
      const qty = cart[item.id] || 0;
      html += `
        <div class="picker-row">
          <div class="picker-info">
            <div class="picker-name">${item.name}</div>
            <div class="picker-price">₹${item.price}</div>
          </div>
          ${qty === 0
            ? `<button class="add-btn" onclick="addToCart('${item.id}')">+ Add</button>`
            : `<div class="qty-control">
                 <button onclick="changeQty('${item.id}', -1)">−</button>
                 <span>${qty}</span>
                 <button onclick="changeQty('${item.id}', 1)">+</button>
               </div>`
          }
        </div>`;
    });
  }
  listEl.innerHTML = html;
}

/* Add an item to the cart for the first time */
function addToCart(itemId) {
  cart[itemId] = 1;
  renderItemList();
  renderCart();
}

/* Increase / decrease quantity, removing the item if it hits 0 */
function changeQty(itemId, delta) {
  cart[itemId] = (cart[itemId] || 0) + delta;
  if (cart[itemId] <= 0) delete cart[itemId];
  renderItemList();
  renderCart();
}

/* Render the cart summary + total on the right */
function renderCart() {
  const cartEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const submitBtn = document.getElementById('submit-btn');
  const itemIds = Object.keys(cart);

  if (itemIds.length === 0) {
    cartEl.innerHTML = '<p class="cart-empty">No items added yet. Tap "+" on any item to add it here.</p>';
    totalEl.textContent = '₹0';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Add items to place order';
    return;
  }

  let total = 0;
  let html = '';
  itemIds.forEach(id => {
    const item = MENU_DATA.find(m => m.id === id);
    const qty = cart[id];
    const lineTotal = item.price * qty;
    total += lineTotal;
    html += `
      <div class="cart-line">
        <span class="cart-line-name">${item.name} <span class="cart-line-qty">×${qty}</span></span>
        <span class="cart-line-price">₹${lineTotal}</span>
      </div>`;
  });

  cartEl.innerHTML = html;
  totalEl.textContent = '₹' + total;
  submitBtn.disabled = false;
  submitBtn.textContent = 'Place order';
}

/* Build a plain-text summary of the cart, e.g. "2x Flat White, 1x Veg Bagel" */
function buildItemsSummary() {
  return Object.keys(cart).map(id => {
    const item = MENU_DATA.find(m => m.id === id);
    return `${cart[id]}x ${item.name}`;
  }).join(', ');
}

/* Calculate the cart total in rupees */
function calculateTotal() {
  return Object.keys(cart).reduce((sum, id) => {
    const item = MENU_DATA.find(m => m.id === id);
    return sum + item.price * cart[id];
  }, 0);
}

/* Handle the final form submission */
function handleOrderSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();

  const phoneOk = /^[0-9+\-\s]{7,15}$/.test(phone);
  const phoneError = document.getElementById('phone-error');
  if (!phoneOk) {
    phoneError.classList.add('show');
    return;
  }
  phoneError.classList.remove('show');

  if (Object.keys(cart).length === 0) return; // safety check, button should already be disabled

  const itemsSummary = buildItemsSummary();
  const total = calculateTotal();

  const savedOrder = addOrder({
    name: name,
    phone: phone,
    items: itemsSummary,
    total: total
  });

  document.getElementById('order-form-wrap').style.display = 'none';
  document.getElementById('confirm-box').classList.add('show');
  document.getElementById('confirm-summary').textContent = `${itemsSummary} — ₹${total}`;
  document.getElementById('confirm-id').textContent = 'Order ID: ' + savedOrder.id;
}

/* Reset everything to place a new order */
function resetOrderForm() {
  cart = {};
  document.getElementById('order-form').reset();
  document.getElementById('item-search').value = '';
  renderItemList();
  renderCart();
  document.getElementById('order-form-wrap').style.display = 'block';
  document.getElementById('confirm-box').classList.remove('show');
}

/* Initial render on page load */
document.addEventListener('DOMContentLoaded', () => {
  renderItemList();
  renderCart();
});