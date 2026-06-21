/* ============================================
   SHARED MENU DATA
   Single source of truth for item names & prices.
   Used by order.html's item picker so the cart
   total always matches real menu prices.
   ============================================ */

const MENU_DATA = [
  // Espresso · with milk
  { name: 'Soul Latte', price: 185, category: 'Espresso · with milk' },
  { name: 'Blacksmith', price: 210, category: 'Espresso · with milk' },
  { name: 'Iced Latte', price: 175, category: 'Espresso · with milk' },
  { name: 'Double Ducktape', price: 280, category: 'Espresso · with milk' },
  { name: 'Caramel Espresso Bloom', price: 265, category: 'Espresso · with milk' },
  { name: 'Cortado', price: 155, category: 'Espresso · with milk' },
  { name: 'Flat White', price: 160, category: 'Espresso · with milk' },
  { name: 'Cappuccino', price: 160, category: 'Espresso · with milk' },
  { name: 'Nameless', price: 165, category: 'Espresso · with milk' },
  { name: 'Latte', price: 160, category: 'Espresso · with milk' },

  // Espresso · no milk
  { name: 'Iced Americano', price: 140, category: 'Espresso · no milk' },
  { name: 'Espresso Tonic', price: 185, category: 'Espresso · no milk' },
  { name: 'Espresso Ginger Ale', price: 185, category: 'Espresso · no milk' },
  { name: 'Americano', price: 130, category: 'Espresso · no milk' },
  { name: 'Doppio', price: 120, category: 'Espresso · no milk' },
  { name: 'Ristretto', price: 120, category: 'Espresso · no milk' },
  { name: 'Espresso Romano', price: 120, category: 'Espresso · no milk' },

  // Burger to bagel
  { name: 'Veg Bagel', price: 245, category: 'Burger to bagel' },
  { name: 'Veg Burger', price: 255, category: 'Burger to bagel' },
  { name: 'Falafel Burger', price: 235, category: 'Burger to bagel' },
  { name: 'Chicken Bagel', price: 275, category: 'Burger to bagel' },
  { name: 'Chicken Burger', price: 285, category: 'Burger to bagel' },
  { name: 'Smoked Chicken Burger', price: 315, category: 'Burger to bagel' },
  { name: 'Korean Chicken Burger', price: 325, category: 'Burger to bagel' },

  // Sandwiches & small plates
  { name: 'Pesto Mushroom Half Pounder', price: 345, category: 'Sandwiches & plates' },
  { name: 'Tomato Bellpepper Half Pounder', price: 345, category: 'Sandwiches & plates' },
  { name: 'CLT Half Pounder', price: 365, category: 'Sandwiches & plates' },
  { name: 'BLT Half Pounder', price: 385, category: 'Sandwiches & plates' },
  { name: 'Crispies with Mushroom', price: 195, category: 'Sandwiches & plates' },
  { name: 'Crispies with Baked Beans', price: 195, category: 'Sandwiches & plates' },

  // Newly launched
  { name: 'Honey Butter Toast', price: 290, category: 'Newly launched' },

  // Non-coffee & experimental
  { name: 'Cassava Gold', price: 145, category: 'Non-coffee & experimental' },
  { name: 'Sografik Cassava', price: 175, category: 'Non-coffee & experimental' },
  { name: 'Sografik Cassava — Ginger Ale', price: 175, category: 'Non-coffee & experimental' },
  { name: 'Hot Chocolate', price: 185, category: 'Non-coffee & experimental' },
  { name: 'Blueberry Hill', price: 245, category: 'Non-coffee & experimental' },
  { name: 'Mixed Berry Smoothie', price: 245, category: 'Non-coffee & experimental' },
  { name: 'Warm Matcha Latte', price: 195, category: 'Non-coffee & experimental' },
  { name: 'Iced Matcha Latte', price: 185, category: 'Non-coffee & experimental' },
  { name: 'Matcha Mole Latte', price: 195, category: 'Non-coffee & experimental' },
  { name: 'Mountain Bean Black Tea', price: 170, category: 'Non-coffee & experimental' },
  { name: 'Apple Cinnamon Tea', price: 170, category: 'Non-coffee & experimental' },
  { name: 'Hibiscus Lemongrass Tisane', price: 165, category: 'Non-coffee & experimental' },
  { name: 'The Zen Plum', price: 210, category: 'Non-coffee & experimental' },
];

/* Auto-generate a unique id for each item from its name,
   e.g. "Flat White" -> "flat-white"
   order.js uses these ids to track cart quantities. */
MENU_DATA.forEach(item => {
  item.id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
});