import React, { useState, useEffect } from "react";
import { Order, EventConfig, IngredientInfo, INGREDIENTS_LIST } from "./types";
import WizardForm from "./components/WizardForm";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<IngredientInfo[]>(INGREDIENTS_LIST);
  const [eventConfig, setEventConfig] = useState<EventConfig>({
    date: "Sábado, dia 13",
    time: "19:30",
    location: "Sede da Manancial - Salão de Eventos",
    matchText: "Brasil vs Marrocos",
    pixKey: "stcaioaug@gmail.com",
    pixReceiver: "Janaina",
    whatsContact: "5511999999999",
    whatsMessage: "Oi Janaina! Aqui está o comprovante do Pix para a Copa Manancial de {nome}. Valor: {valor}"
  });
  const [currentView, setCurrentView] = useState<"admin" | "wizard">("admin");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWizardDirect, setIsWizardDirect] = useState<boolean>(false);

  // Parse URL to detect if public wizard is accessed directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "wizard" || mode === "responder") {
      setCurrentView("wizard");
      setIsWizardDirect(true);
    } else {
      setCurrentView("admin");
      setIsWizardDirect(false);
    }
  }, []);

  // Fetch all registrations/orders from the node express backend
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to load orders from API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the configured event details
  const fetchEventConfig = async () => {
    try {
      const response = await fetch("/api/event-config");
      if (response.ok) {
        const data = await response.json();
        setEventConfig(data);
      }
    } catch (error) {
      console.error("Failed to load event config:", error);
    }
  };

  // Fetch customizable ingredients and their costs
  const fetchIngredients = async () => {
    try {
      const response = await fetch("/api/ingredients");
      if (response.ok) {
        const data = await response.json();
        setIngredients(data);
      }
    } catch (error) {
      console.error("Failed to load ingredients config:", error);
    }
  };

  // Setup automatic polling on the admin view to show results in real-time
  useEffect(() => {
    fetchOrders();
    fetchEventConfig();
    fetchIngredients();

    if (currentView === "admin") {
      const interval = setInterval(() => {
        fetchOrders();
        fetchIngredients(); // also poll ingredients for instant updates if edited
      }, 4000); // Polls database every 4 seconds for instant real-time sync with participant's phones
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Submit a customer order to database
  const handleSubmitOrder = async (orderData: Omit<Order, "id" | "timestamp">): Promise<boolean> => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        await fetchOrders(); // refresh lists
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error submitting order in react state:", error);
      return false;
    }
  };

  // Save the updated meeting configurations
  const handleUpdateConfig = async (newConfig: EventConfig): Promise<boolean> => {
    try {
      const response = await fetch("/api/event-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      if (response.ok) {
        const data = await response.json();
        setEventConfig(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating config:", error);
      return false;
    }
  };

  // Update ingredients list
  const handleUpdateIngredients = async (newIngredients: IngredientInfo[]): Promise<boolean> => {
    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIngredients),
      });
      if (response.ok) {
        const data = await response.json();
        setIngredients(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating ingredients config:", error);
      return false;
    }
  };

  // Submit Admin reset request 
  const handleClearAllOrders = async () => {
    try {
      const response = await fetch("/api/orders/clear", {
        method: "POST",
      });
      if (response.ok) {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error clearing database:", error);
    }
  };

  // Delete a single order (Admin manipulation)
  const handleDeleteOrder = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchOrders(); // refresh lists
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting order:", error);
      return false;
    }
  };

  // Simulate complex youth feedback with random elements and typical Brazilian names
  const handleSimulateReply = async () => {
    setIsSimulating(true);

    const brazilianNames = [
      "Ana Beatriz Costa", "Vitor Gabriel Almeida", "Camila Araújo", "Pedro Henrique Santos", 
      "Guilherme Silva", "Lívia Guedes Martins", "Mateus Fonseca", "Isabela Rodrigues", 
      "João Pedro Lima", "Letícia Barbosa", "Felipe Castanhari", "Amanda Nogueira", 
      "Rodrigo Faro", "Juliana Paes", "Bruno Gagliasso", "Gabriel Medina", "Larissa Manoela"
    ];

    const randomName = brazilianNames[Math.floor(Math.random() * brazilianNames.length)];
    const idSufix = Math.floor(Math.random() * 100);
    const finalName = `${randomName} (${idSufix})`;

    const confirmed = Math.random() > 0.15; // 85% attendance rate in youth groups

    // Select random list of ingredients
    const baseIngredients = ["pao", "hamburguer", "queijo"];
    const optionals = ["ovo", "bacon", "calabresa", "alface", "tomate", "rucula", "maionese", "ketchup"];
    const chosenOptionals = optionals.filter(() => Math.random() > 0.4);
    const finalIngredientsList = confirmed ? [...baseIngredients, ...chosenOptionals] : [];

    const drinksList = ["Suco", "Guaraná", "Coca", "Itubaína"];
    const chosenDrink = confirmed ? drinksList[Math.floor(Math.random() * drinksList.length)] : undefined;

    // Score predictions
    const scoreBrazil = Math.floor(Math.random() * 5); // 0 to 4 goals
    const scoreMorocco = Math.floor(Math.random() * 3); // 0 to 2 goals

    const calorieSum = finalIngredientsList.reduce((sum, id) => {
      const ingredientCalories: Record<string, number> = {
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
      return sum + (ingredientCalories[id] || 0);
    }, 0);

    await handleSubmitOrder({
      name: finalName,
      confirmed,
      ingredients: finalIngredientsList,
      drink: chosenDrink,
      scoreBrazil,
      scoreMorocco,
      appetite: confirmed ? calorieSum : undefined
    });

    setIsSimulating(false);
  };

  return (
    <>
      {isLoading ? (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center text-gray-500">
          <div className="w-12 h-12 border-4 border-brazil-green border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold uppercase tracking-wider text-brazil-green animate-pulse">Copa Manancial</p>
          <p className="text-xs text-gray-400 mt-1">Carregando dados das escalações...</p>
        </div>
      ) : currentView === "wizard" ? (
        <WizardForm 
          onSubmit={handleSubmitOrder} 
          onSwitchToAdmin={isWizardDirect ? undefined : () => setCurrentView("admin")}
          isSimulated={!isWizardDirect}
          eventConfig={eventConfig}
          ingredientsList={ingredients}
        />
      ) : (
        <div className="relative">
          <AdminDashboard
            orders={orders}
            onClearAll={handleClearAllOrders}
            onRefresh={fetchOrders}
            onSimulateReply={handleSimulateReply}
            isSimulating={isSimulating}
            onDeleteOrder={handleDeleteOrder}
            eventConfig={eventConfig}
            onUpdateConfig={handleUpdateConfig}
            ingredientsList={ingredients}
            onUpdateIngredients={handleUpdateIngredients}
          />
          {/* Subtle floating helper button for testing inside AI Studio iframe */}
          <div className="fixed bottom-4 right-4 z-50">
            <button 
              onClick={() => setCurrentView("wizard")}
              className="bg-brazil-green hover:bg-[#007b2e] text-white font-bold text-xs uppercase px-4 py-3 rounded-full shadow-lg transition flex items-center space-x-1.5"
            >
              <span>Abrir Wizard participante</span>
              <span className="text-sm">🍔</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
