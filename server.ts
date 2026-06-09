import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { Pool } from "pg";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");
const CONFIG_FILE = path.join(DATA_DIR, "event_config.json");
const INGREDIENTS_FILE = path.join(DATA_DIR, "ingredients.json");

type IngredientCategory = "base" | "protein" | "salad" | "sauce";

interface EventConfig {
  date: string;
  time: string;
  location: string;
  matchText: string;
  pixKey: string;
  pixReceiver: string;
  whatsContact: string;
  whatsMessage: string;
}

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  isDefault: boolean;
  category: IngredientCategory;
}

interface OrderRecord {
  id: string;
  name: string;
  confirmed: boolean;
  ingredients: string[];
  drink: string;
  scoreBrazil: number;
  scoreMorocco: number;
  timestamp: string;
  appetite?: number;
}

const DEFAULT_CONFIG: EventConfig = {
  date: "Sábado, dia 13",
  time: "19:30",
  location: "Sede da Manancial - Salão de Eventos",
  matchText: "Brasil vs Marrocos",
  pixKey: "stcaioaug@gmail.com",
  pixReceiver: "Janaina",
  whatsContact: "5511999999999",
  whatsMessage: "Oi Janaina! Aqui está o comprovante do Pix para a Copa Manancial de {nome}. Valor: {valor}",
};

const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: "pao", name: "Pão de Brioche", emoji: "🍞", cost: 1.5, isDefault: true, category: "base" },
  { id: "hamburguer", name: "Hambúrguer Gourmet", emoji: "🍔", cost: 3, isDefault: true, category: "protein" },
  { id: "queijo", name: "Queijo Mussarela", emoji: "🧀", cost: 1.2, isDefault: true, category: "protein" },
  { id: "ovo", name: "Ovo Frito", emoji: "🍳", cost: 0.8, isDefault: false, category: "protein" },
  { id: "bacon", name: "Bacon Crocante", emoji: "🥓", cost: 2, isDefault: false, category: "protein" },
  { id: "calabresa", name: "Calabresa Defumada", emoji: "🍕", cost: 1.5, isDefault: false, category: "protein" },
  { id: "alface", name: "Alface Fresca", emoji: "🥬", cost: 0.3, isDefault: false, category: "salad" },
  { id: "tomate", name: "Tomate Laminado", emoji: "🍅", cost: 0.5, isDefault: false, category: "salad" },
  { id: "rucula", name: "Rúcula Silvestre", emoji: "🌿", cost: 0.45, isDefault: false, category: "salad" },
  { id: "maionese", name: "Maionese Artesanal", emoji: "💛", cost: 0.4, isDefault: false, category: "sauce" },
  { id: "ketchup", name: "Ketchup Heinz", emoji: "❤️", cost: 0.4, isDefault: false, category: "sauce" },
];

const databaseUrl = process.env.DATABASE_URL?.trim();
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      enableChannelBinding: databaseUrl.includes("channel_binding=require"),
    } as ConstructorParameters<typeof Pool>[0] & { enableChannelBinding: boolean })
  : null;

function ensureLocalDataFiles() {
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
}

function readLocalJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson(file: string, data: unknown) {
  ensureLocalDataFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

async function initializeDatabase() {
  if (!pool) {
    ensureLocalDataFiles();
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ($1, $2), ($3, $4)
     ON CONFLICT (key) DO NOTHING;`,
    [
      "event_config",
      JSON.stringify(readLocalJson(CONFIG_FILE, DEFAULT_CONFIG)),
      "ingredients",
      JSON.stringify(readLocalJson(INGREDIENTS_FILE, DEFAULT_INGREDIENTS)),
    ]
  );

  const localOrders = readLocalJson<OrderRecord[]>(DATA_FILE, []);
  for (const order of localOrders) {
    await pool.query(
      `INSERT INTO orders (id, data)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING;`,
      [order.id, JSON.stringify(order)]
    );
  }

  console.log("Database storage enabled: Neon/Postgres");
}

const dbReady = initializeDatabase();

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  if (!pool) return fallback;
  await dbReady;
  const result = await pool.query<{ value: T }>("SELECT value FROM app_settings WHERE key = $1", [key]);
  return result.rows[0]?.value ?? fallback;
}

async function writeSetting(key: string, value: unknown) {
  if (!pool) return;
  await dbReady;
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = now();`,
    [key, JSON.stringify(value)]
  );
}

async function getEventConfig() {
  if (!pool) return readLocalJson(CONFIG_FILE, DEFAULT_CONFIG);
  return readSetting("event_config", DEFAULT_CONFIG);
}

async function saveEventConfig(config: EventConfig) {
  if (!pool) {
    writeLocalJson(CONFIG_FILE, config);
    return;
  }
  await writeSetting("event_config", config);
}

async function getIngredients() {
  if (!pool) return readLocalJson(INGREDIENTS_FILE, DEFAULT_INGREDIENTS);
  return readSetting("ingredients", DEFAULT_INGREDIENTS);
}

async function saveIngredients(ingredients: Ingredient[]) {
  if (!pool) {
    writeLocalJson(INGREDIENTS_FILE, ingredients);
    return;
  }
  await writeSetting("ingredients", ingredients);
}

async function getOrders() {
  if (!pool) return readLocalJson<OrderRecord[]>(DATA_FILE, []);
  await dbReady;
  const result = await pool.query<{ data: OrderRecord }>("SELECT data FROM orders ORDER BY created_at ASC");
  return result.rows.map((row) => row.data);
}

async function saveOrder(order: OrderRecord) {
  if (!pool) {
    const orders = readLocalJson<OrderRecord[]>(DATA_FILE, []);
    orders.push(order);
    writeLocalJson(DATA_FILE, orders);
    return;
  }
  await dbReady;
  await pool.query("INSERT INTO orders (id, data) VALUES ($1, $2)", [order.id, JSON.stringify(order)]);
}

async function clearOrders() {
  if (!pool) {
    writeLocalJson(DATA_FILE, []);
    return;
  }
  await dbReady;
  await pool.query("DELETE FROM orders");
}

async function deleteOrder(id: string) {
  if (!pool) {
    const orders = readLocalJson<OrderRecord[]>(DATA_FILE, []);
    const nextOrders = orders.filter((order) => order.id !== id);
    if (nextOrders.length === orders.length) return false;
    writeLocalJson(DATA_FILE, nextOrders);
    return true;
  }

  await dbReady;
  const result = await pool.query("DELETE FROM orders WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

function sanitizeConfig(body: Partial<EventConfig>): EventConfig {
  return {
    date: typeof body.date === "string" ? body.date.trim() : "",
    time: typeof body.time === "string" ? body.time.trim() : "",
    location: typeof body.location === "string" ? body.location.trim() : "",
    matchText: typeof body.matchText === "string" ? body.matchText.trim() : "",
    pixKey: typeof body.pixKey === "string" ? body.pixKey.trim() : "",
    pixReceiver: typeof body.pixReceiver === "string" ? body.pixReceiver.trim() : "",
    whatsContact: typeof body.whatsContact === "string" ? body.whatsContact.replace(/\D/g, "") : "",
    whatsMessage: typeof body.whatsMessage === "string" ? body.whatsMessage.trim() : "",
  };
}

function sanitizeIngredients(input: unknown): Ingredient[] {
  if (!Array.isArray(input)) {
    throw new Error("Ingredients must be an array");
  }

  return input.map((ing: Partial<Ingredient>) => ({
    id: String(ing.id),
    name: String(ing.name),
    emoji: String(ing.emoji),
    cost: typeof ing.cost === "number" ? ing.cost : parseFloat(String(ing.cost)) || 0,
    isDefault: !!ing.isDefault,
    category: String(ing.category) as IngredientCategory,
  }));
}

function createOrder(body: Partial<OrderRecord>): OrderRecord {
  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    throw new Error("Name is a required field");
  }

  return {
    id: "ord_" + Math.random().toString(36).substr(2, 9),
    name: body.name.trim(),
    confirmed: !!body.confirmed,
    ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
    drink: typeof body.drink === "string" ? body.drink.trim() : "",
    scoreBrazil: typeof body.scoreBrazil === "number" ? body.scoreBrazil : 0,
    scoreMorocco: typeof body.scoreMorocco === "number" ? body.scoreMorocco : 0,
    timestamp: body.timestamp || new Date().toISOString(),
    appetite: typeof body.appetite === "number" ? body.appetite : undefined,
  };
}

app.use(express.json());

app.get("/api/event-config", async (req, res) => {
  try {
    res.json(await getEventConfig());
  } catch (error) {
    console.error("Error loading config:", error);
    res.status(500).json({ error: "Failed to load config" });
  }
});

app.post("/api/event-config", async (req, res) => {
  try {
    const config = sanitizeConfig(req.body);
    await saveEventConfig(config);
    res.json(config);
  } catch (error) {
    console.error("Error saving config:", error);
    res.status(500).json({ error: "Failed to save config" });
  }
});

app.get("/api/ingredients", async (req, res) => {
  try {
    res.json(await getIngredients());
  } catch (error) {
    console.error("Error loading ingredients:", error);
    res.status(500).json({ error: "Failed to load ingredients" });
  }
});

app.post("/api/ingredients", async (req, res) => {
  try {
    const ingredients = sanitizeIngredients(req.body);
    await saveIngredients(ingredients);
    res.json(ingredients);
  } catch (error) {
    console.error("Error saving ingredients:", error);
    const status = error instanceof Error && error.message.includes("array") ? 400 : 500;
    res.status(status).json({ error: "Failed to save ingredients" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    res.json(await getOrders());
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const order = createOrder(req.body);
    await saveOrder(order);
    res.status(201).json(order);
  } catch (error) {
    console.error("Error saving order:", error);
    const status = error instanceof Error && error.message.includes("Name") ? 400 : 500;
    res.status(status).json({ error: status === 400 ? "Name is a required field" : "Failed to save order" });
  }
});

app.post("/api/orders/clear", async (req, res) => {
  try {
    await clearOrders();
    res.json({ success: true, message: "All orders cleared" });
  } catch (error) {
    console.error("Error clearing orders:", error);
    res.status(500).json({ error: "Failed to clear orders" });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const deleted = await deleteOrder(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ success: true, message: `Order ${req.params.id} deleted` });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

async function setupVite() {
  await dbReady;

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
