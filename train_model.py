# ==========================================
# CORRIDOR SEVEN — CHATBOT BRAIN
# train_model.py
#
# Same structure as your college approach:
# TF-IDF + XGBoost + LabelEncoder
# Run this in VS Code terminal: python train_model.py
# ==========================================

# ==========================================
# STEP 1: LIBRARIES
# ==========================================
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix

# ==========================================
# STEP 2: BUILD THE TRAINING DATASET
# ==========================================
# This is your cafe's real menu — same items from menu.html
# Each item generates 3 types of questions customers actually ask
C7_MENU = [
    # Espresso with milk
    "Soul Latte", "Blacksmith", "Iced Latte", "Double Ducktape",
    "Caramel Espresso Bloom", "Cortado", "Flat White", "Cappuccino",
    "Nameless", "Latte",
    # Espresso no milk
    "Iced Americano", "Espresso Tonic", "Espresso Ginger Ale",
    "Americano", "Doppio", "Ristretto", "Espresso Romano",
    # Savouries
    "Veg Bagel", "Veg Burger", "Falafel Burger", "Chicken Bagel",
    "Chicken Burger", "Smoked Chicken Burger", "Korean Chicken Burger",
    "Pesto Mushroom Half Pounder", "Tomato Bellpepper Half Pounder",
    "CLT Half Pounder", "BLT Half Pounder",
    "Crispies with Mushroom", "Crispies with Baked Beans",
    "Honey Butter Toast",
    # Non-coffee
    "Hot Chocolate", "Blueberry Hill", "Mixed Berry Smoothie",
    "Warm Matcha Latte", "Iced Matcha Latte", "Matcha Mole Latte",
    "Mountain Bean Black Tea", "Apple Cinnamon Tea",
    "Hibiscus Lemongrass Tisane", "The Zen Plum",
    "Cassava Gold", "Sografik Cassava",
]

chatbot_data = []

# Generate menu-based intents from real C7 items
for item in C7_MENU:
    name = item.lower()
    chatbot_data.extend([
        # Menu inquiry — does it exist?
        {"User_Query": f"do you have {name}", "Intent_Class": "menu_inquiry"},
        {"User_Query": f"is {name} available", "Intent_Class": "menu_inquiry"},
        {"User_Query": f"do you serve {name}", "Intent_Class": "menu_inquiry"},
        {"User_Query": f"can I get a {name}", "Intent_Class": "menu_inquiry"},

        # Price inquiry — how much?
        {"User_Query": f"how much is {name}", "Intent_Class": "price_inquiry"},
        {"User_Query": f"price of {name}", "Intent_Class": "price_inquiry"},
        {"User_Query": f"what does {name} cost", "Intent_Class": "price_inquiry"},
        {"User_Query": f"{name} price", "Intent_Class": "price_inquiry"},

        # Order intent — I want this
        {"User_Query": f"i want a {name}", "Intent_Class": "order_intent"},
        {"User_Query": f"order a {name}", "Intent_Class": "order_intent"},
        {"User_Query": f"can i order {name}", "Intent_Class": "order_intent"},
        {"User_Query": f"give me a {name}", "Intent_Class": "order_intent"},
    ])

# Admin / analytics intents — these are what YOUR chatbot answers
# (questions only staff/owner would ask — reads from MySQL in production)
admin_intents = [
    # Top clients
    ("show top 10 clients", "top_clients"),
    ("who are the top customers", "top_clients"),
    ("best customers by spending", "top_clients"),
    ("top clients this month", "top_clients"),
    ("who spends the most", "top_clients"),
    ("highest spending customers", "top_clients"),
    ("list top 10 buyers", "top_clients"),
    ("top customers today", "top_clients"),

    # Revenue / sales
    ("what is today's revenue", "revenue_query"),
    ("total sales today", "revenue_query"),
    ("how much did we earn today", "revenue_query"),
    ("show total revenue", "revenue_query"),
    ("total earnings this week", "revenue_query"),
    ("how much money today", "revenue_query"),
    ("revenue report", "revenue_query"),

    # Order stats
    ("how many orders today", "order_stats"),
    ("total orders placed", "order_stats"),
    ("show recent orders", "order_stats"),
    ("last order placed", "order_stats"),
    ("how many orders this week", "order_stats"),
    ("show all orders", "order_stats"),
    ("number of orders", "order_stats"),

    # Best seller
    ("what is the best seller", "best_seller"),
    ("most popular item", "best_seller"),
    ("what do customers order most", "best_seller"),
    ("top selling item", "best_seller"),
    ("most ordered drink", "best_seller"),
    ("which item sells the most", "best_seller"),
]

for query, intent in admin_intents:
    chatbot_data.append({"User_Query": query, "Intent_Class": intent})

# General conversational intents
general_intents = [
    # Greetings
    ("hi", "greeting"), ("hello", "greeting"), ("hey there", "greeting"),
    ("namaste", "greeting"), ("good morning", "greeting"),
    ("good evening", "greeting"), ("howdy", "greeting"),

    # Goodbye
    ("bye", "goodbye"), ("goodbye", "goodbye"), ("see you", "goodbye"),
    ("thanks bye", "goodbye"), ("take care", "goodbye"),

    # Hours & location
    ("what time do you open", "hours_location"),
    ("when do you close", "hours_location"),
    ("where is corridor seven", "hours_location"),
    ("what are your timings", "hours_location"),
    ("location of cafe", "hours_location"),
    ("address of c7", "hours_location"),
    ("are you open now", "hours_location"),
    ("opening hours", "hours_location"),
]

for query, intent in general_intents:
    chatbot_data.append({"User_Query": query, "Intent_Class": intent})

# Build DataFrame
df = pd.DataFrame(chatbot_data)
df.to_csv('cafe_chatbot_dataset.csv', index=False)
print(f"✅ Dataset created: {len(df)} training samples")

# ==========================================
# STEP 3: EDA (same as your college code)
# ==========================================
print("\n--- Dataset Info ---")
df.info()
print("\nMissing values:\n", df.isnull().sum())

plt.figure(figsize=(12, 5))
sns.countplot(x='Intent_Class', data=df, palette='viridis')
plt.title('Distribution of C7 Cafe Chatbot Intent Classes')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('intent_distribution.png')
plt.show()
print("📊 Chart saved as intent_distribution.png")

# ==========================================
# STEP 4: PREPROCESSING & ENCODING
# ==========================================
le = LabelEncoder()
df['Target_Label'] = le.fit_transform(df['Intent_Class'])

print("\nIntent → Label mapping:")
for intent, label in zip(le.classes_, range(len(le.classes_))):
    print(f"  {label} → {intent}")

X = df['User_Query']
y = df['Target_Label']

# 80% train, 20% test — same as your Colab
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# TF-IDF vectorizer — same as your Colab
vectorizer = TfidfVectorizer()
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ==========================================
# STEP 5: MODEL TRAINING (XGBoost)
# ==========================================
model = xgb.XGBClassifier(eval_metric='mlogloss', random_state=42)
model.fit(X_train_vec, y_train)

y_pred = model.predict(X_test_vec)
acc = accuracy_score(y_test, y_pred)
print(f"\n🚀 XGBoost Accuracy: {round(acc * 100, 2)}%")

# Confusion Matrix — same as your Colab
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=le.classes_, yticklabels=le.classes_)
plt.xlabel('Predicted Intent')
plt.ylabel('Actual Intent')
plt.title('Confusion Matrix — C7 Chatbot (XGBoost)')
plt.tight_layout()
plt.savefig('confusion_matrix.png')
plt.show()
print("📊 Confusion matrix saved as confusion_matrix.png")

# ==========================================
# STEP 6: QUICK TEST (try it before saving)
# ==========================================
def predict_intent(user_message):
    """Test any message against the trained model"""
    vec = vectorizer.transform([user_message.lower()])
    label = model.predict(vec)[0]
    intent = le.inverse_transform([label])[0]
    proba = model.predict_proba(vec)[0].max()
    return intent, round(proba * 100, 1)

print("\n--- Quick test predictions ---")
test_messages = [
    "hi there",
    "how much is a flat white",
    "i want to order a chicken burger",
    "show me top 10 clients",
    "what is today's revenue",
    "how many orders today",
    "where is the cafe located",
]
for msg in test_messages:
    intent, confidence = predict_intent(msg)
    print(f"  '{msg}' → {intent} ({confidence}% confident)")

# ==========================================
# STEP 7: SAVE THE BRAIN FILES (same as your Colab)
# ==========================================
with open('cafe_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

with open('label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)

print("\n🎉 Saved: cafe_model.pkl, vectorizer.pkl, label_encoder.pkl")
print("Next step: run app.py to start the Flask backend!")
