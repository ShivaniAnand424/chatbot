# ==========================================
# CORRIDOR SEVEN — FLASK BACKEND
# app.py
#
# HOW IT WORKS:
# 1. Loads the 3 trained .pkl files on startup
# 2. Receives chat messages from your website
# 3. Uses XGBoost to predict the intent
# 4. Queries MySQL to get real data
# 5. Returns a human-readable answer
#
# Run: python app.py
# ==========================================

# ==========================================
# PART A: IMPORTS & SETUP
# ==========================================
from flask import Flask, request, jsonify
from flask_cors import CORS          # allows your HTML pages to call this API
import pickle
import mysql.connector
from mysql.connector import Error
import os
from datetime import date

app = Flask(__name__)
CORS(app)   # needed so browser can call localhost:5000 from your HTML files

# ==========================================
# LOAD THE 3 BRAIN FILES (runs once on startup)
# ==========================================
print("Loading model files...")

with open('cafe_model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('vectorizer.pkl', 'rb') as f:
    vectorizer = pickle.load(f)

with open('label_encoder.pkl', 'rb') as f:
    le = pickle.load(f)

print("✅ Model loaded successfully!")

# ==========================================
# MYSQL CONNECTION CONFIG
# Change these values to match your MySQL setup
# ==========================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',            # your MySQL username
    'password': 'your_password',  # your MySQL password
    'database': 'c7_cafe_db'   # your database name
}

def get_db_connection():
    """Opens a fresh MySQL connection for each request."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Database connection error: {e}")
        return None


# ==========================================
# PART B: INTENT HANDLER FUNCTIONS
# Each function handles one intent type
# and returns a string answer.
# ==========================================

def handle_greeting():
    return "👋 Hello! Welcome to Corridor Seven. I can help you with our menu, prices, or orders. What would you like to know?"

def handle_goodbye():
    return "☕ Thanks for visiting Corridor Seven! See you soon."

def handle_hours_location():
    return (
        "📍 We're at <b>Ramdaspeth, Nagpur, Maharashtra</b>.<br>"
        "🕐 Mon–Fri: 7:30 AM – 10:00 PM<br>"
        "🕐 Sat–Sun: 8:00 AM – 11:00 PM"
    )

def handle_menu_inquiry(user_message):
    """Checks if the item the user asked about exists in our menu."""
    # C7 menu items — same as menu-data.js
    MENU_PRICES = {
        "soul latte": 185, "blacksmith": 210, "iced latte": 175,
        "double ducktape": 280, "caramel espresso bloom": 265,
        "cortado": 155, "flat white": 160, "cappuccino": 160,
        "nameless": 165, "latte": 160,
        "iced americano": 140, "espresso tonic": 185, "espresso ginger ale": 185,
        "americano": 130, "doppio": 120, "ristretto": 120, "espresso romano": 120,
        "veg bagel": 245, "veg burger": 255, "falafel burger": 235,
        "chicken bagel": 275, "chicken burger": 285,
        "smoked chicken burger": 315, "korean chicken burger": 325,
        "pesto mushroom half pounder": 345, "tomato bellpepper half pounder": 345,
        "clt half pounder": 365, "blt half pounder": 385,
        "crispies with mushroom": 195, "crispies with baked beans": 195,
        "honey butter toast": 290, "hot chocolate": 185,
        "blueberry hill": 245, "mixed berry smoothie": 245,
        "warm matcha latte": 195, "iced matcha latte": 185,
        "matcha mole latte": 195, "mountain bean black tea": 170,
        "apple cinnamon tea": 170, "hibiscus lemongrass tisane": 165,
        "the zen plum": 210, "cassava gold": 145, "sografik cassava": 175,
    }
    msg_lower = user_message.lower()
    for item, price in MENU_PRICES.items():
        if item in msg_lower:
            return f"✅ Yes, we serve <b>{item.title()}</b> at <b>₹{price}</b>. Want to order it? Visit our <a href='order.html'>order page</a>."
    return "I'm not sure about that item. Check our full <a href='menu.html'>menu page</a> for everything we serve!"

def handle_price_inquiry(user_message):
    """Returns the price of the item mentioned."""
    return handle_menu_inquiry(user_message)  # same logic — finds item and shows price

def handle_order_intent(user_message):
    """Responds to order requests by directing to the order page."""
    return "🛒 Great choice! Head to our <a href='order.html'>Order page</a> to place your order and we'll have it ready for you."

def handle_top_clients():
    """Queries MySQL for top 10 customers by total spending."""
    conn = get_db_connection()
    if not conn:
        return "❌ Database not connected. Please check your MySQL setup."
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name, phone, SUM(total) as total_spent, COUNT(*) as order_count
            FROM orders
            GROUP BY name, phone
            ORDER BY total_spent DESC
            LIMIT 10
        """)
        rows = cursor.fetchall()
        if not rows:
            return "No orders found yet. Place some orders first!"
        reply = "📊 <b>Top 10 clients by total spend:</b><br>"
        for i, (name, phone, spent, count) in enumerate(rows, 1):
            reply += f"{i}. {name} — ₹{spent:.0f} ({count} order{'s' if count > 1 else ''})<br>"
        return reply
    except Error as e:
        return f"Database query error: {e}"
    finally:
        conn.close()

def handle_revenue_query():
    """Returns today's total revenue from MySQL."""
    conn = get_db_connection()
    if not conn:
        return "❌ Database not connected. Please check your MySQL setup."
    try:
        cursor = conn.cursor()
        today = date.today().isoformat()
        cursor.execute("""
            SELECT SUM(total), COUNT(*)
            FROM orders
            WHERE DATE(created_at) = %s
        """, (today,))
        row = cursor.fetchone()
        total, count = row
        if not total:
            return f"📅 No orders placed yet today ({today})."
        return (
            f"💰 <b>Today's revenue ({today}):</b><br>"
            f"Total: <b>₹{total:.0f}</b><br>"
            f"Orders: <b>{count}</b><br>"
            f"Avg order: <b>₹{(total/count):.0f}</b>"
        )
    except Error as e:
        return f"Database query error: {e}"
    finally:
        conn.close()

def handle_order_stats():
    """Returns total order count and the most recent order."""
    conn = get_db_connection()
    if not conn:
        return "❌ Database not connected. Please check your MySQL setup."
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*), SUM(total) FROM orders")
        total_orders, total_revenue = cursor.fetchone()
        cursor.execute("""
            SELECT name, items, total, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 1
        """)
        last = cursor.fetchone()
        if not total_orders or total_orders == 0:
            return "No orders placed yet."
        reply = (
            f"📦 <b>Order stats:</b><br>"
            f"Total orders: <b>{total_orders}</b><br>"
            f"Total revenue: <b>₹{total_revenue:.0f}</b><br>"
        )
        if last:
            reply += f"<br>🧾 Last order: <b>{last[0]}</b> — {last[1]} (₹{last[2]})"
        return reply
    except Error as e:
        return f"Database query error: {e}"
    finally:
        conn.close()

def handle_best_seller():
    """Finds the most ordered item from the orders table."""
    conn = get_db_connection()
    if not conn:
        return "❌ Database not connected. Please check your MySQL setup."
    try:
        cursor = conn.cursor()
        # Count how many times each item name appears across all orders
        cursor.execute("SELECT items FROM orders")
        all_items = cursor.fetchall()
        if not all_items:
            return "No orders yet — place some orders to see best sellers!"
        from collections import Counter
        item_counter = Counter()
        for (items_str,) in all_items:
            # items are stored like "2x Flat White, 1x Veg Bagel"
            for part in items_str.split(','):
                part = part.strip()
                if 'x ' in part:
                    qty_str, name = part.split('x ', 1)
                    try:
                        qty = int(qty_str.strip())
                        item_counter[name.strip()] += qty
                    except ValueError:
                        item_counter[part] += 1
                else:
                    item_counter[part] += 1
        top3 = item_counter.most_common(3)
        reply = "🏆 <b>Best sellers:</b><br>"
        for i, (item, count) in enumerate(top3, 1):
            reply += f"{i}. {item} — ordered {count} time{'s' if count > 1 else ''}<br>"
        return reply
    except Error as e:
        return f"Database query error: {e}"
    finally:
        conn.close()


# ==========================================
# PART C: THE MAIN /chat ENDPOINT
# This is what your chatbot.js calls
# ==========================================
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({'reply': 'Please type a message!'})

    # Step 1: Vectorize the user's message
    message_vec = vectorizer.transform([user_message.lower()])

    # Step 2: Predict intent using XGBoost
    predicted_label = model.predict(message_vec)[0]
    intent = le.inverse_transform([predicted_label])[0]
    confidence = model.predict_proba(message_vec)[0].max()

    print(f"Message: '{user_message}' → Intent: {intent} ({confidence:.0%} confident)")

    # Step 3: Route to the right handler based on intent
    if intent == 'greeting':
        reply = handle_greeting()
    elif intent == 'goodbye':
        reply = handle_goodbye()
    elif intent == 'hours_location':
        reply = handle_hours_location()
    elif intent == 'menu_inquiry':
        reply = handle_menu_inquiry(user_message)
    elif intent == 'price_inquiry':
        reply = handle_price_inquiry(user_message)
    elif intent == 'order_intent':
        reply = handle_order_intent(user_message)
    elif intent == 'top_clients':
        reply = handle_top_clients()
    elif intent == 'revenue_query':
        reply = handle_revenue_query()
    elif intent == 'order_stats':
        reply = handle_order_stats()
    elif intent == 'best_seller':
        reply = handle_best_seller()
    else:
        reply = (
            "I didn't quite understand that. Try asking:<br>"
            "• 'How much is a flat white?'<br>"
            "• 'Show top 10 clients'<br>"
            "• 'Today's revenue'<br>"
            "• 'Best seller'"
        )

    return jsonify({'reply': reply, 'intent': intent})


# ==========================================
# PART D: MYSQL TABLE SETUP ROUTE
# Visit http://localhost:5000/setup-db once
# to create the orders table automatically
# ==========================================
@app.route('/setup-db')
def setup_db():
    conn = get_db_connection()
    if not conn:
        return "❌ Could not connect to MySQL. Check DB_CONFIG in app.py."
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE DATABASE IF NOT EXISTS c7_cafe_db
        """)
        cursor.execute("USE c7_cafe_db")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(30) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                items TEXT NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        return "✅ Database and orders table created successfully!"
    except Error as e:
        return f"❌ Error: {e}"
    finally:
        conn.close()


# ==========================================
# START THE SERVER
# ==========================================
if __name__ == '__main__':
    print("\n🚀 Corridor Seven chatbot server starting...")
    print("📡 Chatbot API: http://localhost:5000/chat")
    print("🗄️  Setup DB:   http://localhost:5000/setup-db  (run once)")
    print("Press Ctrl+C to stop\n")
    app.run(debug=True, port=5000)