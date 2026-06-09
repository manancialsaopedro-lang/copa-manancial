import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");
const CONFIG_FILE = path.join(DATA_DIR, "event_config.json");
const INGREDIENTS_FILE = path.join(DATA_DIR, "ingredients.json");

const DEFAULT_CONFIG = {
  date: "Sábado, dia 13",
  time: "19:30",
  location: "Sede da Manancial - Salão de Eventos",
  matchText: "Brasil vs Marrocos",
  pixKey: "stcaioaug@gmail.com",
  pixReceiver: "Janaina",
  whatsContact: "5511999999999",
  whatsMessage: "Oi Janaina! Aqui está o comprovante do Pix para a Copa Manancial de {nome}. Valor: {valor}"
};

const DEFAULT_INGREDIENTS = [
  { id: "pao", name: "Pão de Brioche", emoji: "🍞", cost: 1.50, isDefault: true, category: "base" },
  { id: "hamburguer", name: "Hambúrguer Gourmet", emoji: "🍔", cost: 3.00, isDefault: true, category: "protein" },
  { id: "queijo", name: "Queijo Mussarela", emoji: "🧀", cost: 1.20, isDefault: true, category: "protein" },
  { id: "ovo", name: "Ovo Frito", emoji: "🍳", cost: 0.80, isDefault: false, category: "protein" },
  { id: "bacon", name: "Bacon Crocante", emoji: "🥓", cost: 2.00, isDefault: false, category: "protein" },
  { id: "calabresa", name: "Calabresa Defumada", emoji: "🍕", cost: 1.50, isDefault: false, category: "protein" },
  { id: "alface", name: "Alface Fresca", emoji: "🥬", cost: 0.30, isDefault: false, category: "salad" },
  { id: "tomate", name: "Tomate Laminado", emoji: "🍅", cost: 0.50, isDefault: false, category: "salad" },
  { id: "rucula", name: "Rúcula Silvestre", emoji: "🌿", cost: 0.45, isDefault: false, category: "salad" },
  { id: "maionese", name: "Maionese Artesanal", emoji: "💛", cost: 0.40, isDefault: false, category: "sauce" },
  { id: "ketchup", name: "Ketchup Heinz", emoji: "❤️", cost: 0.40, isDefault: false, category: "sauce" },
];

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
}
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
}
if (!fs.existsSync(INGREDIENTS_FILE)) {
  fs.writeFileSync(INGREDIENTS_FILE, JSON.stringify(DEFAULT_INGREDIENTS, null, 2), "utf-8");
}

app.use(express.json());

// API endpoints
// Get event configuration
app.get("/api/event-config", (req, res) => {
  try {
    const data = fs.readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(data);
    res.json(config);
  } catch (error) {
    console.error("Error reading config file:", error);
    res.status(500).json({ error: "Failed to load config" });
  }
});

// Update event configuration
app.post("/api/event-config", (req, res) => {
  try {
    const { date, time, location, matchText, pixKey, pixReceiver, whatsContact, whatsMessage } = req.body;
    
    const config = {
      date: typeof date === "string" ? date.trim() : "",
      time: typeof time === "string" ? time.trim() : "",
      location: typeof location === "string" ? location.trim() : "",
      matchText: typeof matchText === "string" ? matchText.trim() : "",
      pixKey: typeof pixKey === "string" ? pixKey.trim() : "",
      pixReceiver: typeof pixReceiver === "string" ? pixReceiver.trim() : "",
      whatsContact: typeof whatsContact === "string" ? whatsContact.replace(/\D/g, "") : "",
      whatsMessage: typeof whatsMessage === "string" ? whatsMessage.trim() : ""
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    res.json(config);
  } catch (error) {
    console.error("Error saving config file:", error);
    res.status(500).json({ error: "Failed to save config" });
  }
});

// Get ingredients list
app.get("/api/ingredients", (req, res) => {
  try {
    const data = fs.readFileSync(INGREDIENTS_FILE, "utf-8");
    const ingredients = JSON.parse(data);
    res.json(ingredients);
  } catch (error) {
    console.error("Error reading ingredients file:", error);
    res.status(500).json({ error: "Failed to load ingredients" });
  }
});

// Update ingredients list
app.post("/api/ingredients", (req, res) => {
  try {
    const newIngredients = req.body;
    if (!Array.isArray(newIngredients)) {
      res.status(400).json({ error: "Ingredients must be an array" });
      return;
    }
    
    // Simple validation of structure
    const updated = newIngredients.map((ing: any) => ({
      id: String(ing.id),
      name: String(ing.name),
      emoji: String(ing.emoji),
      cost: typeof ing.cost === "number" ? ing.cost : parseFloat(ing.cost) || 0,
      isDefault: !!ing.isDefault,
      category: String(ing.category)
    }));
    
    fs.writeFileSync(INGREDIENTS_FILE, JSON.stringify(updated, null, 2), "utf-8");
    res.json(updated);
  } catch (error) {
    console.error("Error saving ingredients file:", error);
    res.status(500).json({ error: "Failed to save ingredients" });
  }
});

// Get all orders / registrations
app.get("/api/orders", (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    const orders = JSON.parse(data);
    res.json(orders);
  } catch (error) {
    console.error("Error reading orders file:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// Save a new order
app.post("/api/orders", (req, res) => {
  try {
    const { name, confirmed, ingredients, drink, scoreBrazil, scoreMorocco, timestamp, appetite } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "Name is a required field" });
      return;
    }

    const data = fs.readFileSync(DATA_FILE, "utf-8");
    const orders = JSON.parse(data);

    const newOrder = {
      id: "ord_" + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      confirmed: !!confirmed,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      drink: typeof drink === "string" ? drink.trim() : "",
      scoreBrazil: typeof scoreBrazil === "number" ? scoreBrazil : 0,
      scoreMorocco: typeof scoreMorocco === "number" ? scoreMorocco : 0,
      timestamp: timestamp || new Date().toISOString(),
      appetite: typeof appetite === "number" ? appetite : undefined,
    };

    orders.push(newOrder);
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), "utf-8");

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ error: "Failed to save order" });
  }
});

// Clear all orders (Admin reset functionality)
app.post("/api/orders/clear", (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    res.json({ success: true, message: "All orders cleared" });
  } catch (error) {
    console.error("Error clearing orders:", error);
    res.status(500).json({ error: "Failed to clear orders" });
  }
});

// Delete a single order (Admin manipulation)
app.delete("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    let orders = JSON.parse(data);
    
    const initialLength = orders.length;
    orders = orders.filter((o: any) => o.id !== id);
    
    if (orders.length === initialLength) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), "utf-8");
    res.json({ success: true, message: `Order ${id} deleted` });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// Setup Vite middleware in Development mode, otherwise static files in Production mode
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
