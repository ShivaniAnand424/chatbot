/* ============================================
   CAFEBOT — SHARED STORAGE LAYER (Part A)
   This file acts as our temporary "database"
   until Step 2 (Flask + MySQL) is built.

   It uses sessionStorage so data survives
   moving between pages (Home -> Menu -> Order)
   but clears when the browser tab is closed.
   Later, these same function names will just
   call a Flask API instead of sessionStorage.
   ============================================ */

const STORE_KEY = 'cafebot_orders';

/* Get all orders currently saved.
   Returns an array of order objects. */
function getOrders() {
  const raw = sessionStorage.getItem(STORE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/* Save the full orders array back to sessionStorage. */
function saveOrders(orders) {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(orders));
}

/* Add one new order.
   orderData = { name, phone, items, total } */
function addOrder(orderData) {
  const orders = getOrders();

  const newOrder = {
    id: 'ORD' + Date.now(),          // simple unique id
    name: orderData.name,
    phone: orderData.phone,
    items: orderData.items,
    total: orderData.total,
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
}

/* Clear all orders (useful for testing) */
function clearOrders() {
  sessionStorage.removeItem(STORE_KEY);
}