export interface Order {
  id: string;
  name: string;
  confirmed: boolean;
  ingredients: string[];
  drink?: string;
  scoreBrazil: number;
  scoreMorocco: number;
  timestamp: string;
  appetite?: number;
}

export interface EventConfig {
  date: string;
  time: string;
  location: string;
  matchText: string;
  pixKey: string;
  pixReceiver: string;
  whatsContact: string;
  whatsMessage: string;
}

export interface IngredientInfo {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  isDefault: boolean;
  category: "base" | "protein" | "salad" | "sauce";
}

export const INGREDIENTS_LIST: IngredientInfo[] = [
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
