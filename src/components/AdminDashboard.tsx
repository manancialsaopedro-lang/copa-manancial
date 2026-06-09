import React, { useState } from "react";
import { 
  Users, Trophy, DollarSign, ShoppingCart, Share2, Clipboard, 
  Trash2, AlertCircle, RefreshCw, Layers, CheckCircle, XCircle, Settings, Edit, HelpCircle,
  TrendingUp, BarChart2, PieChart as PieIcon, Activity
} from "lucide-react";
import { Order, INGREDIENTS_LIST, IngredientInfo, EventConfig } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

const INGREDIENT_CALORIES: Record<string, number> = {
  pao: 280,
  hamburguer: 380,
  queijo: 150,
  ovo: 90,
  bacon: 160,
  calabresa: 140,
  alface: 10,
  tomate: 15,
  rucula: 10,
  maionese: 90,
  ketchup: 40,
};

interface AdminDashboardProps {
  orders: Order[];
  onClearAll: () => Promise<void>;
  onRefresh: () => void;
  onSimulateReply: () => void;
  isSimulating: boolean;
  onDeleteOrder: (id: string) => Promise<boolean>;
  eventConfig: EventConfig;
  onUpdateConfig: (newConfig: EventConfig) => Promise<boolean>;
  ingredientsList: IngredientInfo[];
  onUpdateIngredients: (newIngredients: IngredientInfo[]) => Promise<boolean>;
}

export default function AdminDashboard({ 
  orders, 
  onClearAll, 
  onRefresh, 
  onSimulateReply, 
  isSimulating,
  onDeleteOrder,
  eventConfig,
  onUpdateConfig,
  ingredientsList,
  onUpdateIngredients
}: AdminDashboardProps) {
  const currentIngredients = ingredientsList || INGREDIENTS_LIST;
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
  const [isConfigSaving, setIsConfigSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<EventConfig>({ ...eventConfig });

  const [isEditingIngredients, setIsEditingIngredients] = useState<boolean>(false);
  const [editingIngredientsList, setEditingIngredientsList] = useState<IngredientInfo[]>([]);
  const [isIngredientsSaving, setIsIngredientsSaving] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Recharts toggles
  const [bolaoChartTab, setBolaoChartTab] = useState<"freq" | "timeline" | "outcome">("freq");

  // Filter confirmed youth members
  const confirmedAttendees = orders.filter(o => o.confirmed);
  const totalRegistrations = orders.length;
  const totalConfirmed = confirmedAttendees.length;
  const totalAbsent = orders.filter(o => !o.confirmed).length;

  const openEditModal = () => {
    setFormData({ ...eventConfig });
    setIsEditingConfig(true);
  };

  const handleSaveConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    const success = await onUpdateConfig(formData);
    setIsConfigSaving(false);
    if (success) {
      setIsEditingConfig(false);
    } else {
      alert("Erro ao salvar as configurações. Tente novamente.");
    }
  };

  // Shopping link generation
  const handleCopyLink = () => {
    const link = `${window.location.origin}/?mode=wizard`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteError(null);
  };

  const handleConfirmExclude = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    const success = await onDeleteOrder(deleteTarget.id);
    if (success) {
      setDeleteTarget(null);
    } else {
      setDeleteError("Ocorreu um erro ao excluir esse pedido. Tente novamente.");
    }
  };

  // Calculate Estimated Ingredients and Quantities for Shopping List (with 15% safety margin buffer)
  const calculateShoppingList = () => {
    // Basic defaults
    const countPao = totalConfirmed;
    const countHamburguer = totalConfirmed;
    const countQueijo = totalConfirmed; // base cheese included in all confirmed

    // Optionals
    let countOvo = 0;
    let countBacon = 0;
    let countCalabresa = 0;
    let countAlface = 0;
    let countTomate = 0;
    let countRucula = 0;
    let countMaionese = 0;
    let countKetchup = 0;

    // Drinks count
    let countSuco = 0;
    let countGuarana = 0;
    let countCoca = 0;
    let countItubaina = 0;

    confirmedAttendees.forEach(order => {
      if (order.ingredients.includes("ovo")) countOvo++;
      if (order.ingredients.includes("bacon")) countBacon++;
      if (order.ingredients.includes("calabresa")) countCalabresa++;
      if (order.ingredients.includes("alface")) countAlface++;
      if (order.ingredients.includes("tomate")) countTomate++;
      if (order.ingredients.includes("rucula")) countRucula++;
      if (order.ingredients.includes("maionese")) countMaionese++;
      if (order.ingredients.includes("ketchup")) countKetchup++;

      if (order.drink === "Suco") countSuco++;
      if (order.drink === "Guaraná") countGuarana++;
      if (order.drink === "Coca") countCoca++;
      if (order.drink === "Itubaína") countItubaina++;
    });

    const marginMultiplier = 1.15; // 15% safety factor for young people's appetite

    return [
      {
        name: "Pão de Brioche",
        emoji: "🍞",
        neededRaw: countPao,
        withMargin: Math.ceil(countPao * marginMultiplier),
        purchaseUnit: "Unidade(s)",
        buyingGuide: `Comprar pacotes de pão. Em média, 1 pacote vem com 4 ou 6 pães. Estimar ${Math.ceil((countPao * marginMultiplier) / 6)} pacote(s) de 6 unidades.`
      },
      {
        name: "Hambúrguer Gourmet (Carne)",
        emoji: "🍔",
        neededRaw: countHamburguer,
        withMargin: Math.ceil(countHamburguer * marginMultiplier),
        purchaseUnit: "Hambúrgueres",
        buyingGuide: `Caixas de hambúrguer ou blend moído fresco (~150g cada). Total de ${((countHamburguer * marginMultiplier * 150) / 1000).toFixed(1)}kg de carne moída.`
      },
      {
        name: "Queijo Mussarela fatiado",
        emoji: "🧀",
        neededRaw: countQueijo,
        withMargin: Math.ceil(countQueijo * marginMultiplier),
        purchaseUnit: "Fatias",
        buyingGuide: `Comprar fatiado. 1 pacote de 1kg tem cerca de 50 fatias. Comprar cerca de ${((countQueijo * marginMultiplier * 20) / 1000).toFixed(2)}kg.`
      },
      {
        name: "Ovo Branco/Vermelho",
        emoji: "🍳",
        neededRaw: countOvo,
        withMargin: Math.ceil(countOvo * marginMultiplier),
        purchaseUnit: "Unidades",
        buyingGuide: `Equivale a cerca de ${Math.ceil((countOvo * marginMultiplier) / 12)} cartela(s) de 12 ovos.`
      },
      {
        name: "Bacon em Fatias",
        emoji: "🥓",
        neededRaw: countBacon,
        withMargin: Math.ceil(countBacon * marginMultiplier),
        purchaseUnit: "Fatias (2 un/burger)",
        buyingGuide: `Estimar 2 fatias (~25g total). Precisa de cerca de ${((countBacon * marginMultiplier * 25) / 1000).toFixed(2)}kg de bacon em fatias.`
      },
      {
        name: "Calabresa Defumada",
        emoji: "🍕",
        neededRaw: countCalabresa,
        withMargin: Math.ceil(countCalabresa * marginMultiplier),
        purchaseUnit: "Porções (30g un)",
        buyingGuide: `Estimar 1 gomo ralado/fatiado para cada 5 burguers. Comprar cerca de ${((countCalabresa * marginMultiplier * 30) / 1000).toFixed(2)}kg.`
      },
      {
        name: "Alface Crespa",
        emoji: "🥬",
        neededRaw: countAlface,
        withMargin: Math.ceil(countAlface * marginMultiplier / 15),
        purchaseUnit: "Pé(s) de alface",
        buyingGuide: "1 pé de alface grande fatiado é suficiente para cobrir folhas de cerca de 15 a 18 hambúrgueres."
      },
      {
        name: "Tomate Vermelho",
        emoji: "🍅",
        neededRaw: countTomate,
        withMargin: Math.ceil(countTomate * marginMultiplier / 4),
        purchaseUnit: "Unidade(s) média(s)",
        buyingGuide: "1 tomate rende aproximadamente 8 fatias medianas (atende 4 lanches considerando 2 fatias em cada)."
      },
      {
        name: "Rúcula Fresca",
        emoji: "🌿",
        neededRaw: countRucula,
        withMargin: Math.ceil(countRucula * marginMultiplier / 12),
        purchaseUnit: "Maço(s)",
        buyingGuide: "1 maço generoso de rúcula fresca lavado atende cerca de 12 a 15 hambúrgueres bem servidos."
      },
      {
        name: "Maionese do Chefe",
        emoji: "💛",
        neededRaw: countMaionese,
        withMargin: Math.ceil(countMaionese * marginMultiplier),
        purchaseUnit: "Porções (15g un)",
        buyingGuide: `Estimar potes grandes. Um pote/sachê mercado de 500g rende cerca de 33 lanches. Comprar ${Math.ceil((countMaionese * marginMultiplier) * 15 / 500)} pote(s) de 500g.`
      },
      {
        name: "Ketchup Heinz",
        emoji: "❤️",
        neededRaw: countKetchup,
        withMargin: Math.ceil(countKetchup * marginMultiplier),
        purchaseUnit: "Porções (15g un)",
        buyingGuide: `Um tubo bico dosador tradicional de 400g rende cerca de 26 lanches. Comprar ${Math.ceil((countKetchup * marginMultiplier) * 15 / 400)} tubo(s) de 400g.`
      },
      {
        name: "Bebida: Suco",
        emoji: "🧃",
        neededRaw: countSuco,
        withMargin: Math.ceil(countSuco * marginMultiplier),
        purchaseUnit: "Suco(s)",
        buyingGuide: `Preferido por ${countSuco} jovens. Recomendamos suco de caixinha individual.`
      },
      {
        name: "Bebida: Guaraná",
        emoji: "🥤",
        neededRaw: countGuarana,
        withMargin: Math.ceil(countGuarana * marginMultiplier),
        purchaseUnit: "Guaraná(s)",
        buyingGuide: `Preferido por ${countGuarana} jovens. Comprar latas ou garrafas de guaraná.`
      },
      {
        name: "Bebida: Coca-Cola",
        emoji: "🥤",
        neededRaw: countCoca,
        withMargin: Math.ceil(countCoca * marginMultiplier),
        purchaseUnit: "Coca(s)",
        buyingGuide: `Preferido por ${countCoca} jovens. Comprar latas ou garrafas de Coca-Cola.`
      },
      {
        name: "Bebida: Itubaína",
        emoji: "🤎",
        neededRaw: countItubaina,
        withMargin: Math.ceil(countItubaina * marginMultiplier),
        purchaseUnit: "Itubaína(s)",
        buyingGuide: `Preferido por ${countItubaina} jovens. Clássica garrafinha ou lata de Itubaína.`
      }
    ];
  };

  // Calculate dynamic Cost Estimation
  const calculateTotalCost = () => {
    return confirmedAttendees.reduce((sum, order) => {
      const orderCost = currentIngredients.reduce((subSum, ing) => {
        if (order.ingredients.includes(ing.id)) {
          return subSum + ing.cost;
        }
        return subSum;
      }, 0);
      return sum + orderCost;
    }, 0);
  };

  const getAverageCostPerBurger = () => {
    if (totalConfirmed === 0) return 0;
    return calculateTotalCost() / totalConfirmed;
  };

  // Compile Match Score Odds & Predictions (Brazil x Morocco)
  const calculateScoreStats = () => {
    if (orders.length === 0) return { avgB: "0.0", avgM: "0.0", winBPercent: 0, winMPercent: 0, drawPercent: 0, favor: "Nenhum" };

    let sumB = 0;
    let sumM = 0;
    let winB = 0;
    let winM = 0;
    let draw = 0;

    orders.forEach(o => {
      sumB += o.scoreBrazil;
      sumM += o.scoreMorocco;
      if (o.scoreBrazil > o.scoreMorocco) winB++;
      else if (o.scoreBrazil < o.scoreMorocco) winM++;
      else draw++;
    });

    const totalVotes = orders.length;
    const winBPercent = Math.round((winB / totalVotes) * 100);
    const winMPercent = Math.round((winM / totalVotes) * 100);
    const drawPercent = Math.round((draw / totalVotes) * 100);

    let favor = "Brasil 🇧🇷";
    if (winM > winB) favor = "Marrocos 🇲🇦";
    else if (draw > winM && draw > winB) favor = "Empate 🤝";

    return {
      avgB: (sumB / totalVotes).toFixed(1),
      avgM: (sumM / totalVotes).toFixed(1),
      winBPercent,
      winMPercent,
      drawPercent,
      favor
    };
  };

  // Find the exact score most guessed
  const getMostGuessedScore = () => {
    if (orders.length === 0) return "Nenhum palpite";
    const scoreMap: { [key: string]: number } = {};
    orders.forEach(o => {
      const key = `${o.scoreBrazil} x ${o.scoreMorocco}`;
      scoreMap[key] = (scoreMap[key] || 0) + 1;
    });

    let bestKey = "";
    let maxVal = 0;
    Object.keys(scoreMap).forEach(key => {
      if (scoreMap[key] > maxVal) {
        maxVal = scoreMap[key];
        bestKey = key;
      }
    });

    const pct = Math.round((maxVal / orders.length) * 100);
    return `${bestKey} (${maxVal} voto(s) - ${pct}%)`;
  };

  const calculateTotalCalories = () => {
    return confirmedAttendees.reduce((sum, order) => {
      if (typeof order.appetite === "number") {
        return sum + order.appetite;
      }
      const burgerCalories = order.ingredients.reduce((subSum, id) => {
        return subSum + (INGREDIENT_CALORIES[id] || 0);
      }, 0);
      return sum + burgerCalories;
    }, 0);
  };

  const getAverageCalories = () => {
    if (totalConfirmed === 0) return 0;
    return calculateTotalCalories() / totalConfirmed;
  };

  // Recharts Helper Data Calculators
  const getIngredientChartData = () => {
    const counts: Record<string, number> = {};
    currentIngredients.forEach(ing => {
      counts[ing.id] = 0;
    });

    confirmedAttendees.forEach(order => {
      // base ingredients are always in all confirmed
      counts["pao"] = (counts["pao"] || 0) + 1;
      counts["hamburguer"] = (counts["hamburguer"] || 0) + 1;
      counts["queijo"] = (counts["queijo"] || 0) + 1;

      order.ingredients.forEach(ingId => {
        counts[ingId] = (counts[ingId] || 0) + 1;
      });
    });

    return currentIngredients
      .map(ing => ({
        id: ing.id,
        name: ing.name,
        displayName: `${ing.emoji} ${ing.name}`,
        quantidade: counts[ing.id] || 0,
      }))
      .filter(item => item.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade);
  };

  const getScoreFrequencyData = () => {
    const freq: Record<number, { gols: string; Brasil: number; Marrocos: number }> = {};
    for (let i = 0; i <= 6; i++) {
      freq[i] = { gols: `${i} Gols`, Brasil: 0, Marrocos: 0 };
    }
    orders.forEach(order => {
      const b = Math.min(6, Math.max(0, order.scoreBrazil));
      const m = Math.min(6, Math.max(0, order.scoreMorocco));
      freq[b].Brasil++;
      freq[m].Marrocos++;
    });
    return Object.values(freq);
  };

  const getBetsTimelineData = () => {
    return [...orders]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((order, idx) => ({
        index: idx + 1,
        "Chutante": order.name,
        "Gols Brasil": order.scoreBrazil,
        "Gols Marrocos": order.scoreMorocco,
      }));
  };

  const getOutcomeChartData = () => {
    let winB = 0;
    let winM = 0;
    let draw = 0;
    orders.forEach(o => {
      if (o.scoreBrazil > o.scoreMorocco) winB++;
      else if (o.scoreBrazil < o.scoreMorocco) winM++;
      else draw++;
    });
    return [
      { name: "Vitória Brasil 🇧🇷", value: winB, color: "#009b3a" },
      { name: "Empate 🤝", value: draw, color: "#ca8a04" },
      { name: "Zebra Marrocos 🇲🇦", value: winM, color: "#002776" },
    ].filter(item => item.value > 0);
  };

  const scoreStats = calculateScoreStats();
  const shoppingList = calculateShoppingList();

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#1d1d1f] font-sans p-4 sm:p-6 md:p-8">
      
      {/* Banner / Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="bg-brazil-green text-white p-3 rounded-2xl shadow-md">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 uppercase">Copa Manancial</h1>
              <span className="bg-emerald-100 text-[#009b3a] text-[10px] uppercase font-bold px-2.5 py-1 rounded-full">
                Ao Vivo
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Gestão de convocações, custos, placares do Bolão e lista de compras inteligente.
            </p>
          </div>
        </div>

        {/* Action Button Links bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Simulated user feedback trigger */}
          <button
            onClick={onSimulateReply}
            disabled={isSimulating}
            className="text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 font-bold shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Simulando..." : "Simular Resposta"}</span>
          </button>

          <button
            onClick={onRefresh}
            className="text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 p-2.5 rounded-xl transition shadow-sm"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4 text-brazil-green" />
          </button>

          {/* Quick Copy Link of Wizard for Sharing */}
          <button
            onClick={handleCopyLink}
            className="text-xs bg-brazil-green hover:bg-[#007b2e] text-white font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center space-x-1.5"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>{copied ? "Link Copiado! 🇧🇷" : "Copiar Link do Wizard"}</span>
          </button>

          {/* Edit Ingredients Button */}
          <button
            onClick={() => {
              setEditingIngredientsList(currentIngredients.map(ing => ({ ...ing })));
              setIsEditingIngredients(true);
            }}
            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit className="w-4 h-4 text-white" />
            <span>Editar Custos</span>
          </button>

          {/* Edit Event Config Button */}
          <button
            onClick={openEditModal}
            className="text-xs bg-[#002776] hover:bg-[#001c54] text-white font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white" />
            <span>Configurar Encontro</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
        {/* KPI: Total Registrations */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-gray-55/80 p-3 rounded-xl border border-gray-100 text-[#002776]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold block">Presenças Confirmadas</span>
            <span className="text-2xl font-bold text-[#002776] block mt-1">{totalConfirmed}</span>
            <span className="text-[10px] text-gray-500 font-medium">De {totalRegistrations} cadastros</span>
          </div>
        </div>

        {/* KPI: Presence Ratio */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-gray-55/80 p-3 rounded-xl border border-gray-100 text-[#009b3a]">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold block">Engajamento</span>
            <span className="text-2xl font-bold text-[#1d1d1f] block mt-1 font-mono">
              {totalRegistrations > 0 ? Math.round((totalConfirmed / totalRegistrations) * 100) : 0}%
            </span>
            <span className="text-[10px] text-gray-500 font-medium">Do total de inscritos</span>
          </div>
        </div>

        {/* KPI: Total Budget Cost */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-gray-55/80 p-3 rounded-xl border border-gray-100 text-[#009b3a]">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold block">Custo Estimado</span>
            <span className="text-2xl font-bold text-[#002776] block mt-1 font-mono">R$ {calculateTotalCost().toFixed(2)}</span>
            <span className="text-[10px] text-gray-550 font-medium">Méd: R$ {getAverageCostPerBurger().toFixed(2)}/lanche</span>
          </div>
        </div>

        {/* KPI: Match Odds */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-gray-55/80 p-3 rounded-xl border border-gray-100 text-[#002776]">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold block">Favorito no Bolão</span>
            <span className="text-2xl font-bold text-[#002776] block mt-1 shrink-0">{scoreStats.favor}</span>
            <span className="text-[10px] text-gray-500 font-medium">Méd: {scoreStats.avgB} x {scoreStats.avgM}</span>
          </div>
        </div>

        {/* KPI: Group Energy / Calories Monitor */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-gray-55/80 p-3 rounded-xl border border-gray-100 text-orange-500">
            <Layers className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold block">Apetite do Grupo</span>
            <span className="text-2xl font-bold text-orange-600 block mt-1 font-mono">
              {Math.round(getAverageCalories())} <span className="text-xs font-bold text-gray-400">kCal</span>
            </span>
            <span className="text-[10px] text-gray-500 font-bold">Total: {calculateTotalCalories().toLocaleString()} kCal</span>
          </div>
        </div>
      </div>

      {/* Analytics & Charts Room (Recharts) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 font-sans">
        
        {/* Ingredient Distribution BarChart */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="bg-emerald-50 p-2.5 rounded-xl text-brazil-green">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="text-left font-sans">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Distribuição de Ingredientes</h3>
                <p className="text-gray-500 text-xs">Comparativo de ingredientes encomendados pelos jovens.</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-slate-600 font-mono">
              {totalConfirmed} Atendidos
            </span>
          </div>

          {totalConfirmed === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-10 font-sans">
              <Layers className="w-10 h-10 opacity-30 mb-2 stroke-[1.5px]" />
              <p className="text-xs font-semibold text-gray-600">Nenhum hambúrguer confirmado ainda</p>
              <p className="text-[10px] text-gray-400 max-w-xs mt-0.5 leading-relaxed">As proporções aparecerão em gráfico de barras assim que confirmarem presença no wizard.</p>
            </div>
          ) : (
            <div className="flex-1 h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getIngredientChartData()}
                  margin={{ top: 10, right: 10, left: -22, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                  <XAxis 
                    dataKey="displayName" 
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#4b5563" }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 border border-gray-150 p-3 rounded-2xl shadow-xl text-left font-sans">
                            <p className="text-xs font-black text-gray-900">{data.displayName}</p>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1">Sugeridos: {data.quantidade} un ({Math.round(data.quantidade / totalConfirmed * 100)}% dos lanches)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="quantidade" fill="#009b3a" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    {getIngredientChartData().map((entry, index) => {
                      const isBase = entry.id === "pao" || entry.id === "hamburguer" || entry.id === "queijo";
                      return <Cell key={`cell-${index}`} fill={isBase ? "#002776" : "#009b3a"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Betting Pool Trend (Bolão) Multi-Tab Chart */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col min-h-[420px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="bg-yellow-50 p-2.5 rounded-xl text-[#002776]">
                <TrendingUp className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left font-sans">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Tendência do Bolão</h3>
                <p className="text-gray-500 text-xs">Visões consolidadas e estatísticas de palpites.</p>
              </div>
            </div>

            {/* Premium Flat Tab buttons */}
            <div className="flex bg-gray-55/80 p-1 rounded-xl border border-gray-150">
              <button
                onClick={() => setBolaoChartTab("freq")}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-extrabold transition flex items-center gap-0.5 cursor-pointer ${
                  bolaoChartTab === "freq" ? "bg-white text-[#002776] shadow-xs" : "text-gray-400 hover:text-gray-700"
                }`}
                title="Frequência de gols"
              >
                <BarChart2 className="w-3 h-3" />
                Gols
              </button>
              <button
                onClick={() => setBolaoChartTab("timeline")}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-extrabold transition flex items-center gap-0.5 cursor-pointer ${
                  bolaoChartTab === "timeline" ? "bg-white text-[#002776] shadow-xs" : "text-gray-400 hover:text-gray-700"
                }`}
                title="Histórico de apostas"
              >
                <Activity className="w-3 h-3" />
                Tendência
              </button>
              <button
                onClick={() => setBolaoChartTab("outcome")}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-extrabold transition flex items-center gap-0.5 cursor-pointer ${
                  bolaoChartTab === "outcome" ? "bg-white text-[#002776] shadow-xs" : "text-gray-400 hover:text-gray-700"
                }`}
                title="Favoritismo"
              >
                <PieIcon className="w-3 h-3" />
                Vencedor
              </button>
            </div>
          </div>

          {totalRegistrations === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-10 font-sans">
              <Trophy className="w-10 h-10 opacity-30 mb-2 stroke-[1.5px]" />
              <p className="text-xs font-semibold text-gray-600">Aguardando palpites do jogo</p>
              <p className="text-[10px] text-gray-400 max-w-xs mt-0.5 leading-relaxed">Os gráficos gerados pelo bolão aparecerão quando os jovens enviarem as primeiras apostas.</p>
            </div>
          ) : (
            <div className="flex-1 h-72 w-full mt-2 flex flex-col justify-between">
              
              {/* Tab 1: Goal Frequencies BarChart */}
              {bolaoChartTab === "freq" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getScoreFrequencyData()}
                    margin={{ top: 10, right: 10, left: -22, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                    <XAxis 
                      dataKey="gols" 
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/95 border border-gray-150 p-3 rounded-2xl shadow-xl text-xs font-sans text-left">
                              <p className="font-extrabold text-gray-900 mb-1">{label} previstos</p>
                              <p className="text-[#009b3a] font-bold">Brasil: {payload[0].value} voto(s)</p>
                              <p className="text-[#002776] font-bold">Marrocos: {payload[1].value} voto(s)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                    <Bar name="Brasil 🇧🇷" dataKey="Brasil" fill="#009b3a" radius={[4, 4, 0, 0]} />
                    <Bar name="Marrocos 🇲🇦" dataKey="Marrocos" fill="#002776" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Tab 2: Chronological Guess Trends Scatter-Line */}
              {bolaoChartTab === "timeline" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getBetsTimelineData()}
                    margin={{ top: 10, right: 15, left: -22, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                    <XAxis 
                      dataKey="index" 
                      tick={{ fontSize: 9, fill: "#9ca3af" }}
                      label={{ value: "Ordem sequencial dos palpites", position: "insideBottom", offset: -2, fontSize: 8, fontWeight: 700, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-150 p-3 rounded-2xl shadow-xl text-xs text-left font-sans">
                              <p className="font-extrabold text-gray-900 mb-1">{item.Chutante}</p>
                              <p className="text-[#009b3a] font-bold">Palpite Brasil: {item["Gols Brasil"]} gol(s)</p>
                              <p className="text-[#002776] font-bold">Palpite Marrocos: {item["Gols Marrocos"]} gol(s)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                    <Line 
                      name="Gols Brasil 🇧🇷" 
                      type="monotone" 
                      dataKey="Gols Brasil" 
                      stroke="#009b3a" 
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      name="Gols Marrocos 🇲🇦" 
                      type="monotone" 
                      dataKey="Gols Marrocos" 
                      stroke="#002776" 
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Tab 3: Expected Outcome Pie Donut Chart */}
              {bolaoChartTab === "outcome" && (
                <div className="flex h-full items-center justify-center gap-6 flex-col sm:flex-row font-sans">
                  <div className="w-48 h-48 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getOutcomeChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getOutcomeChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white border border-gray-150 p-3 rounded-2xl shadow-xl text-xs font-sans text-left">
                                  <p className="font-extrabold" style={{ color: data.color }}>{data.name}</p>
                                  <p className="font-bold text-gray-700 mt-1">{data.value} aposta(s) ({Math.round(data.value / totalRegistrations * 100)}%)</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-left flex flex-col gap-2 shrink">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Cenário Favorito</span>
                    {getOutcomeChartData().map((entry, idx) => {
                      const share = Math.round((entry.value / totalRegistrations) * 100);
                      return (
                        <div key={idx} className="flex items-center space-x-2.5 bg-gray-50/50 border border-gray-150 rounded-xl p-2 px-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <div className="flex flex-col text-xs leading-tight">
                            <span className="font-bold text-gray-900">{entry.name}</span>
                            <span className="text-[10px] text-gray-500 font-semibold">{entry.value} jovem(ns) — {share}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Purchase List & Match Predictions */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Shopping List Table (Col: 8/12) */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="bg-emerald-50 p-2.5 rounded-xl text-brazil-green">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lista de Compras Automática</h3>
                <p className="text-gray-500 text-xs">Cálculo de insumos com <span className="text-brazil-green font-bold">15% de margem de folga</span> contra imprevistos.</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] bg-gray-50 px-2.5 py-1 rounded-full border border-gray-150 font-semibold text-gray-600">
                Lanches Atendidos: {totalConfirmed} un
              </span>
            </div>
          </div>

          {totalConfirmed === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-gray-400">
              <Layers className="w-12 h-12 stroke-[1.5px] opacity-40 mb-3" />
              <p className="text-sm font-semibold text-gray-700">Nenhuma lista foi gerada ainda.</p>
              <p className="text-xs mt-1 max-w-xs text-gray-400">Quando os participantes confirmarem presença no wizard de lanche, as quantidades necessárias aparecerão automaticamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 text-[10px] text-gray-400 uppercase tracking-widest">
                    <th className="py-3 font-bold">Ingrediente</th>
                    <th className="py-3 font-bold text-center">Qtd Total</th>
                    <th className="py-3 font-bold text-center text-brazil-green pl-4">Comprar (+15%)</th>
                    <th className="py-3 font-bold pl-6">Guia de Compra Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {shoppingList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="py-3 font-bold text-gray-900 flex items-center space-x-2.5">
                        <span className="text-lg bg-gray-50 p-1.5 rounded-lg w-8 h-8 flex items-center justify-center border border-gray-100">{item.emoji}</span>
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3 text-center text-gray-400 font-medium font-mono">{item.neededRaw} {item.purchaseUnit.split(" ")[0]}</td>
                      <td className="py-3 text-center font-bold text-brazil-green font-mono pl-4">{item.withMargin} <span className="text-[10px] font-medium text-[#009b3a]">{item.purchaseUnit}</span></td>
                      <td className="py-3 pl-6 text-[11px] text-gray-500 italic max-w-xs leading-snug">{item.buyingGuide}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bolão Copa Panel (Col: 4/12) */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-4">
            <div className="bg-yellow-50 p-2.5 rounded-xl text-[#002776]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Palpites do Jogo</h3>
              <p className="text-gray-500 text-xs">Brasil vs Marrocos - Dia 13</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Odds graph custom visualization */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 text-center shadow-inner">
              <span className="text-[10px] text-gray-400 block uppercase tracking-widest font-bold mb-3">Distribuição de Palpites</span>
              
              <div className="flex gap-2 h-14 items-end justify-center px-4">
                {/* Yellow Bar (Brazil Winner) */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-[#002776] mb-1">{totalRegistrations > 0 ? scoreStats.winBPercent : 0}%</span>
                  <div 
                    style={{ height: `${totalRegistrations > 0 ? Math.max(8, scoreStats.winBPercent * 0.45) : 8}px` }} 
                    className="w-full bg-brazil-green rounded-t-lg shadow-sm"
                  />
                  <span className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase leading-none">Vitória BR</span>
                </div>

                {/* Gray Bar (Draw) */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-500 mb-1">{totalRegistrations > 0 ? scoreStats.drawPercent : 0}%</span>
                  <div 
                    style={{ height: `${totalRegistrations > 0 ? Math.max(8, scoreStats.drawPercent * 0.45) : 8}px` }} 
                    className="w-full bg-gray-300 rounded-t-lg shadow-sm"
                  />
                  <span className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase leading-none">Empate</span>
                </div>

                {/* Green Bar (Morocco Zebra) */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-emerald-600 mb-1">{totalRegistrations > 0 ? scoreStats.winMPercent : 0}%</span>
                  <div 
                    style={{ height: `${totalRegistrations > 0 ? Math.max(8, scoreStats.winMPercent * 0.45) : 8}px` }} 
                    className="w-full bg-[#002776] rounded-t-lg shadow-sm"
                  />
                  <span className="text-[9px] text-[#002776] font-bold mt-1.5 uppercase leading-none font-sans">Zebra MA</span>
                </div>
              </div>
            </div>

            {/* Quick stats details */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 divide-y divide-gray-100 text-xs text-gray-700">
              <div className="flex justify-between pb-2.5">
                <span className="text-gray-500 font-medium">Placar mais votado:</span>
                <span className="font-bold text-gray-950 font-sans">{getMostGuessedScore()}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500 font-medium">Média Gols Brasil:</span>
                <span className="font-bold text-gray-900 font-mono">{scoreStats.avgB} gol(s)</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500 font-medium">Média Gols Marrocos:</span>
                <span className="font-bold text-gray-900 font-mono">{scoreStats.avgM} gol(s)</span>
              </div>
            </div>

            <div className="score-prediction bg-[#002776] text-white p-4 rounded-2xl flex flex-col gap-2 mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-[9px] opacity-75 uppercase tracking-wider font-bold">Média da Galera</span>
                <span className="text-[8px] bg-white text-[#002776] px-2 py-0.5 rounded-full font-bold">FAVORITO</span>
              </div>
              <div className="text-center text-xl font-bold tracking-tight py-1 font-mono uppercase">
                BRA {Math.round(parseFloat(scoreStats.avgB || "0"))} x {Math.round(parseFloat(scoreStats.avgM || "0"))} MAR
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Response list table history */}
      <div className="max-w-7xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 mb-5 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-[#1d1d1f]">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Todos os Pedidos Enviados ({totalRegistrations})</h3>
              <p className="text-gray-500 text-xs text-left">Lista de jovens com preferência e custo total confirmado.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 px-4 py-2.5 rounded-xl transition font-black flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Zerar Dados</span>
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center text-gray-400">
            <Users className="w-12 h-12 stroke-[1.5px] opacity-40 mb-3" />
            <p className="text-sm font-semibold text-gray-700">Nenhuma resposta registrada ainda 🥶</p>
            <p className="text-xs mt-1 max-w-sm text-gray-400">Mande o link para os jovens preencherem ou use o botão "Simular Resposta" para testar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                  <th className="py-3">Jogador / Jovem</th>
                  <th className="py-3 text-center">Presença</th>
                  <th className="py-3 pl-4">Combinação do Hambúrguer</th>
                  <th className="py-3 text-center">Bebida</th>
                  <th className="py-3 text-center">Fome (kCal)</th>
                  <th className="py-3 text-center">Placar (Chute)</th>
                  <th className="py-3 text-center">Custo Individual</th>
                  <th className="py-3 text-right">Data/Hora</th>
                  <th className="py-3 text-center w-14">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {orders.map((order) => {
                  const orderCost = currentIngredients.reduce((sum, ing) => {
                    if (order.ingredients.includes(ing.id)) return sum + ing.cost;
                    return sum;
                  }, 0);

                  return (
                    <tr key={order.id} className="hover:bg-gray-55/40 transition duration-155">
                      <td className="py-3 font-semibold text-gray-900">{order.name}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold leading-none ${
                          order.confirmed 
                            ? "bg-emerald-50 text-[#009b3a] border border-emerald-150" 
                            : "bg-red-50 text-red-600 border border-red-150"
                        }`}>
                          {order.confirmed ? "Confirmado" : "Ausente"}
                        </span>
                      </td>
                      <td className="py-3 pl-4">
                        {order.confirmed ? (
                          <div className="flex flex-wrap gap-1 max-w-lg">
                            {currentIngredients.filter(i => order.ingredients.includes(i.id)).map((ing) => (
                              <span 
                                key={ing.id} 
                                className="bg-gray-50 border border-gray-150 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5 shadow-xs"
                                title={ing.name}
                              >
                                <span>{ing.emoji}</span>
                                <span>{ing.id}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">- Sem lanche -</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {order.confirmed && order.drink ? (
                          <span className="font-bold text-[#002776] bg-blue-50/70 text-[10px] px-2.5 py-1 rounded-full border border-blue-150 uppercase tracking-tight">
                            {order.drink === "Suco" ? "🧃 Suco" : order.drink === "Itubaína" ? "🤎 Itubaína" : `🥤 ${order.drink}`}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {order.confirmed ? (
                          <span className="font-semibold text-orange-700 bg-orange-50 text-[10px] px-2 py-0.5 rounded-full border border-orange-100 whitespace-nowrap">
                            🔥 {order.appetite || 810}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 text-center font-bold font-mono text-gray-900 pl-4 text-xs">
                        {order.scoreBrazil} x {order.scoreMorocco}
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-gray-900 text-xs">
                        {order.confirmed ? `R$ ${orderCost.toFixed(2)}` : "R$ 0.00"}
                      </td>
                      <td className="py-3 text-right text-gray-400 font-mono text-[10px]">
                        {new Date(order.timestamp).toLocaleString("pt-BR", { 
                          day: "2-digit", 
                          month: "2-digit", 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(order.id, order.name)}
                          className="bg-white border border-gray-150 hover:bg-rose-50 hover:border-rose-200 text-gray-400 hover:text-rose-600 p-2 rounded-xl transition duration-150 shadow-sm inline-flex items-center justify-center cursor-pointer"
                          title="Excluir este palpite"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Edit Configuration Modal */}
      {isEditingConfig && (
        <div className="fixed inset-0 bg-[#1d1d1f]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-150 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#002776] text-white p-6 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-brazil-yellow animate-spin-slow" />
                <div>
                  <h3 className="text-base font-bold">Configuração do Encontro</h3>
                  <p className="text-[11px] opacity-85">Atualize os dados mostrados no Wizard para os participantes.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditingConfig(false)}
                className="hover:bg-white/10 p-1.5 rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveConfigSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Dia do Encontro</label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green"
                    placeholder="Sábado, dia 13"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Horário de Início</label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green"
                    placeholder="19:30"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Local do Encontro (Endereço)</label>
                  <input
                    type="text"
                    required
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green"
                    placeholder="Cidade / Sede da Igreja"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Texto do Confronto / Tema Copa</label>
                  <input
                    type="text"
                    required
                    value={formData.matchText || ""}
                    onChange={(e) => setFormData({ ...formData, matchText: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green"
                    placeholder="Brasil vs Marrocos - Oitavas"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Chave Pix para Acerto</label>
                  <input
                    type="text"
                    required
                    value={formData.pixKey || ""}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green"
                    placeholder="Celular, e-mail ou aleatória"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Nome do Recebedor do Pix</label>
                  <input
                    type="text"
                    required
                    value={formData.pixReceiver || ""}
                    onChange={(e) => setFormData({ ...formData, pixReceiver: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green"
                    placeholder="Ex: Janaina Guedes"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">WhatsApp de Contato (Apenas números + DDI)</label>
                  <input
                    type="text"
                    required
                    value={formData.whatsContact || ""}
                    onChange={(e) => setFormData({ ...formData, whatsContact: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green"
                    placeholder="Ex: 5511999999999"
                  />
                  <span className="text-[9px] text-gray-400 mt-1 block">Escreva sem espaços ou parênteses, iniciando com 55 e o DDD.</span>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Mensagem de Envio de Comprovante</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.whatsMessage || ""}
                    onChange={(e) => setFormData({ ...formData, whatsMessage: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-brazil-green resize-none"
                    placeholder="Olá! Aqui está o comprovante do meu pedido na copa."
                  />
                  <span className="text-[9px] text-gray-450 mt-1 block font-mono">Variáveis suportadas: <b>{"{nome}"}</b> e <b>{"{valor}"}</b>.</span>
                </div>
              </div>

              {/* Action Buttons inside footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditingConfig(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2.5 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isConfigSaving}
                  className="bg-brazil-green hover:bg-[#007b2e] text-white text-xs px-5 py-2.5 rounded-xl font-bold transition flex items-center space-x-1"
                >
                  <span>{isConfigSaving ? "Gravando..." : "Salvar Configuração"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Ingredients Pricing Edit Modal */}
      {isEditingIngredients && (
        <div className="fixed inset-0 bg-[#001c54]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-amber-500 p-5 text-white flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold sm:text-base text-sm">Editar Custos de Ingredientes</h3>
                <p className="text-amber-50 text-[10px] mt-0.5">Ajuste o valor que pagamos em cada item para recalcular automaticamente os custos dos jovens.</p>
              </div>
            </div>

            {/* List */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {editingIngredientsList.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl bg-white p-1.5 rounded-xl border border-gray-150 w-10.5 h-10.5 flex items-center justify-center">{ing.emoji}</span>
                    <div className="text-left">
                      <span className="text-xs font-black text-gray-800 tracking-tight block">{ing.name}</span>
                      <span className="text-[9px] text-amber-600 font-extrabold uppercase bg-amber-50 px-1.5 py-0.5 border border-amber-100 rounded mt-0.5 inline-block">{ing.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={ing.cost}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        setEditingIngredientsList(prev =>
                          prev.map(item => item.id === ing.id ? { ...item, cost: isNaN(parsed) ? 0 : parsed } : item)
                        );
                      }}
                      className="w-24 bg-white border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-2.5 py-2 text-xs font-black text-gray-800 text-center shadow-inner"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditingIngredients(false)}
                className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isIngredientsSaving}
                onClick={async () => {
                  setIsIngredientsSaving(true);
                  const success = await onUpdateIngredients(editingIngredientsList);
                  setIsIngredientsSaving(false);
                  if (success) {
                    setIsEditingIngredients(false);
                  } else {
                    alert("Erro ao gravar os custos. Favor contatar o administrador.");
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <span>{isIngredientsSaving ? "Salvando..." : "Salvar Alterações"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Excluding Single Request Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#001c54]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="bg-rose-500 p-5 text-white flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl animate-pulse">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold sm:text-base text-sm">Excluir Registro de Jovem</h3>
                <p className="text-rose-100 text-[10px] mt-0.5">Esta ação é irreversível.</p>
              </div>
            </div>

            <div className="p-6 text-left">
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                Tem certeza que deseja apagar permanentemente o palpite e a escolha de lanche de <b className="text-gray-900 font-extrabold">"{deleteTarget.name}"</b>?
              </p>
              
              {deleteError && (
                <div className="mt-3.5 p-2 px-3 bg-red-50 border border-red-150 rounded-xl text-red-600 text-[10px] font-semibold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExclude}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Sim, Excluir Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Database Reset Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-[#001c54]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="bg-rose-600 p-5 text-white flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl animate-bounce">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold sm:text-base text-sm">Zerar Copa Manancial?</h3>
                <p className="text-rose-100 text-[10px] mt-0.5">Operação Crítica Liderança</p>
              </div>
            </div>

            <div className="p-6 text-left space-y-3">
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-bold">
                Atenção! Esta ação removerá PERMANENTEMENTE todos os lanches, palpites de bolão e confirmações de presença já cadastrados pelos jovens.
              </p>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Use esta ferramenta apenas para iniciar um novo evento ou limpar testes antes do evento real.
              </p>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onClearAll();
                  setShowConfirmClear(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Sim, APAGAR TODOS OS PEDIDOS!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
