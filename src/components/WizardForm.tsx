import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Clipboard, Users, ChevronLeft, ChevronRight, Trophy, Sparkles, Send, Calendar, Clock, MapPin } from "lucide-react";
import { INGREDIENTS_LIST, IngredientInfo, Order, EventConfig } from "../types";
import { AdaptiveSlider } from "./AdaptiveSlider";

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

const getSuggestedPaymentValue = (cost: number) => {
  if (cost <= 15) return 15;
  if (cost <= 18) return 18;
  return 20;
};

interface WizardFormProps {
  onSubmit: (orderData: Omit<Order, "id" | "timestamp">) => Promise<boolean>;
  onSwitchToAdmin?: () => void;
  isSimulated?: boolean;
  eventConfig?: EventConfig;
  ingredientsList?: IngredientInfo[];
}

export default function WizardForm({ onSubmit, onSwitchToAdmin, isSimulated = false, eventConfig, ingredientsList }: WizardFormProps) {
  const currentIngredients = ingredientsList || INGREDIENTS_LIST;

  const config = eventConfig || {
    date: "Sábado, dia 13",
    time: "19:30",
    location: "Sede da Manancial - Salão de Eventos",
    matchText: "Brasil vs Marrocos",
    pixKey: "stcaioaug@gmail.com",
    pixReceiver: "Janaina",
    whatsContact: "5511999999999",
    whatsMessage: "Oi Janaina! Aqui está o comprovante do Pix para a Copa Manancial de {nome}. Valor: {valor}"
  };

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(true);
  const [drink, setDrink] = useState<string>("Suco");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
    currentIngredients.filter(i => i.isDefault).map(i => i.id)
  );
  
  // Brazil vs Morocco prediction score
  const [scoreBrazil, setScoreBrazil] = useState<number>(2);
  const [scoreMorocco, setScoreMorocco] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  const [appetiteValue, setAppetiteValue] = useState<number>(810);

  // Sync appetite score with selected ingredients
  useEffect(() => {
    const totalCalories = selectedIngredients.reduce((total, id) => {
      return total + (INGREDIENT_CALORIES[id] || 0);
    }, 0);
    setAppetiteValue(totalCalories);
  }, [selectedIngredients]);

  // Default burger state contains core ingredients
  const handleToggleIngredient = (id: string) => {
    // defaults are mandatory based on user instructions ("o pão vai em todos, o hambúrguer vai em todos")
    const isMandatory = id === "pao" || id === "hamburguer";
    if (isMandatory) return;

    if (selectedIngredients.includes(id)) {
      setSelectedIngredients(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIngredients(prev => [...prev, id]);
    }
  };

  const calculateBurgerCost = () => {
    if (!confirmed) return 0;
    return currentIngredients.reduce((acc, curr) => {
      if (selectedIngredients.includes(curr.id)) {
        return acc + curr.cost;
      }
      return acc;
    }, 0);
  };

  const handleNext = () => {
    if (step === 1 && name.trim() === "") {
      alert("Por favor, digite o seu nome para continuar! ⚽");
      return;
    }
    // If the youth confirms they are NOT attending, we skip burger (2) and drink (3) steps
    if (step === 1 && !confirmed) {
      setStep(4); // Skip burger and drink and go directly to match prediction (4)
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    if (step === 4 && !confirmed) {
      setStep(1); // Return directly to step 1
      return;
    }
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    // Base ingredients always present for burger
    const finalIngredientsList = confirmed ? selectedIngredients : [];
    const finalDrink = confirmed ? drink : undefined;
    
    const result = await onSubmit({
      name: name.trim(),
      confirmed,
      ingredients: finalIngredientsList,
      drink: finalDrink,
      scoreBrazil,
      scoreMorocco,
      appetite: confirmed ? appetiteValue : undefined
    });

    setIsSubmitting(false);
    if (result) {
      setSubmittedOrder({
        name,
        confirmed,
        ingredients: finalIngredientsList,
        drink: finalDrink,
        scoreBrazil,
        scoreMorocco,
        cost: calculateBurgerCost(),
        appetite: confirmed ? appetiteValue : undefined
      });
      setStep(6); // Success celebration screen (Step 6)
    } else {
      alert("Ops, erro ao salvar seu pedido. Tente novamente ou fale com o líder! 🥶");
    }
  };

  // Dynamic visual burger layer stack list
  // Rendered top-down: Bun top, cheese, bacon, egg, calabresa, tomato, lettuce, burger patty, Bun bottom.
  const burgerLayers = [
    { id: "pao-top", name: "Pão de Brioche (Topo)", emoji: "🍞", color: "bg-amber-500", visible: selectedIngredients.includes("pao"), height: "h-8 sm:h-10 rounded-t-full shadow-md relative overflow-hidden flex items-center justify-center border-t-2 border-amber-400" },
    { id: "ketchup", name: "Ketchup", emoji: "❤️", color: "bg-red-600", visible: selectedIngredients.includes("ketchup"), height: "h-2 rounded-full mx-2 border-b border-red-700 animate-pulse" },
    { id: "maionese", name: "Maionese", emoji: "💛", color: "bg-yellow-105", visible: selectedIngredients.includes("maionese"), height: "h-2 rounded-full mx-3 border-b border-yellow-250 bg-amber-50" },
    { id: "rucula", name: "Rúcula", emoji: "🌿", color: "bg-emerald-600", visible: selectedIngredients.includes("rucula"), height: "h-3 rounded-md mx-2 border-b border-emerald-500 flex justify-center text-[10px]" },
    { id: "alface", name: "Alface", emoji: "🥬", color: "bg-green-500", visible: selectedIngredients.includes("alface"), height: "h-3 rounded-lg mx-1 shadow border-b border-green-400 flex items-center justify-center text-xs" },
    { id: "tomate", name: "Tomate", emoji: "🍅", color: "bg-red-500", visible: selectedIngredients.includes("tomate"), height: "h-4 rounded-xl mx-2 shadow border-b border-red-600 text-[10px] text-white flex items-center justify-center font-bold" },
    { id: "ovo", name: "Ovo", emoji: "🍳", color: "bg-yellow-50", visible: selectedIngredients.includes("ovo"), height: "h-4 rounded-xl mx-2 shadow-inner border-y border-yellow-200 flex items-center justify-center text-xs font-bold font-sans" },
    { id: "bacon", name: "Bacon", emoji: "🥓", color: "bg-red-800", visible: selectedIngredients.includes("bacon"), height: "h-3 rounded mx-3 shadow border-y border-red-900 flex justify-around text-[10px]" },
    { id: "calabresa", name: "Calabresa", emoji: "🍕", color: "bg-[#711c1c]", visible: selectedIngredients.includes("calabresa"), height: "h-3.5 rounded-lg mx-3 shadow border-b border-red-950 flex justify-center text-[8px]" },
    { id: "queijo", name: "Queijo Mussarela", emoji: "🧀", color: "bg-yellow-400 animate-pulse", visible: selectedIngredients.includes("queijo"), height: "h-3.5 rounded-lg mx-1 shadow border-b border-yellow-500 relative flex items-center justify-center text-xs font-bold" },
    { id: "hamburguer", name: "Hambúrguer Gourmet", emoji: "🍔", color: "bg-amber-900", visible: selectedIngredients.includes("hamburguer"), height: "h-7 sm:h-9 rounded-xl mx-2 shadow-lg border-y-2 border-amber-950 flex items-center justify-center text-xs text-amber-200 font-extrabold" },
    { id: "pao-bottom", name: "Pão (Base)", emoji: "🍞", color: "bg-amber-600", visible: selectedIngredients.includes("pao"), height: "h-6 sm:h-7 rounded-b-2xl shadow-md border-b-2 border-amber-700" }
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans overflow-x-hidden flex flex-col justify-between">
      
      {/* Top Header Tracker */}
      <header className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-brazil-green to-[#007b2e] text-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="bg-brazil-yellow text-brazil-blue p-1.5 rounded-lg shadow-lg">
            <Trophy className="w-5 h-5 font-extrabold" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white uppercase">Copa Manancial</h1>
            <p className="text-[10px] text-yellow-300 font-bold">Encontro de Jovens ⚽</p>
          </div>
        </div>
        
        {step <= 5 && (
          <div className="text-xs font-mono font-bold bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10 flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brazil-yellow animate-pulse mr-0.5"></span>
            <span>ETAPA {step} / 5</span>
          </div>
        )}
      </header>

      {/* Main Container Wizard */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 md:py-10 flex flex-col justify-center">
        
        {/* Step Indicator dots (Except feedback screen) */}
        {step <= 5 && (
          <div className="flex justify-center space-x-2.5 mb-6 md:mb-8">
            {[1, 2, 3, 4, 5].map((num) => {
              if ((num === 2 || num === 3) && !confirmed) return null; // hide burger & drink step if presence not confirmed
              return (
                <div
                  key={num}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    step === num 
                      ? "w-8 bg-brazil-green shadow-md shadow-brazil-green/30" 
                      : step > num 
                        ? "w-2.5 bg-brazil-green/50" 
                        : "w-2.5 bg-gray-300"
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Wizard Slide Animations */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6"
              >
                <div className="text-center">
                  <div className="inline-block bg-emerald-50 text-brazil-green border border-emerald-100 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3 text-center">
                    🚀 Convocação Oficial
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                    Escalação dos Jovens
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    Insira seu nome e confirme sua escalação para o nosso encontro épico da Copa no dia 13!
                  </p>
                </div>

                 {/* Event Schedule Info Box */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 divide-y divide-gray-200 text-xs text-gray-700">
                  <div className="flex items-center space-x-3 pb-2.5">
                    <Calendar className="w-4 h-4 text-brazil-blue shrink-0" />
                    <span className="font-medium">Encontro dia: {config.date} às {config.time}</span>
                  </div>
                  <div className="flex items-center space-x-3 py-2.5">
                    <Clock className="w-4 h-4 text-brazil-green shrink-0" />
                    <span className="font-medium">Atração: {config.matchText} na tela grande!</span>
                  </div>
                  <div className="flex items-center space-x-3 pt-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{config.location}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-widest pl-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você quer ser escalado? (Ex: Caio Silva)"
                    className="w-full bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 border border-gray-250 focus:border-brazil-green px-4 py-3.5 rounded-2xl outline-none transition text-sm sm:text-base font-medium"
                    maxLength={40}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-widest pl-1">
                    Confirmação de Presença
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setConfirmed(true)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition duration-300 relative ${
                        confirmed 
                          ? "bg-emerald-50 border-brazil-green ring-2 ring-brazil-green/10 text-gray-900" 
                          : "bg-white border-gray-150 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      }`}
                    >
                      {confirmed && (
                        <span className="absolute top-2 right-2 bg-brazil-green text-white p-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5 font-extrabold" />
                        </span>
                      )}
                      <span className="text-2xl mb-1.5">🇧🇷</span>
                      <span className="text-xs font-bold leading-normal">Sim! Tô Confirmado</span>
                      <span className="text-[9px] opacity-60 mt-0.5">E vou detonar no lanche</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmed(false)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition duration-300 relative ${
                        !confirmed 
                          ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/10 text-gray-900" 
                          : "bg-white border-gray-150 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      }`}
                    >
                      {!confirmed && (
                        <span className="absolute top-2 right-2 bg-rose-500 text-white p-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5 font-extrabold" />
                        </span>
                      )}
                      <span className="text-2xl mb-1.5">😢</span>
                      <span className="text-xs font-bold leading-normal">Não poderei ir</span>
                      <span className="text-[9px] opacity-60 mt-0.5">Fico pra próxima convocação</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && confirmed && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col gap-5"
              >
                <div className="text-center">
                  <div className="inline-block bg-emerald-50 text-brazil-green border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2">
                    🍔 MONTE SEU BURGER CAMPEÃO
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1d1d1f]">
                    Selecione os Ingredientes
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">
                    O pão, o hambúrguer gourmet e a mussarela já vêm inclusos! Escolha seus opcionais prediletos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Interactive Dynamic Burger Stack View */}
                  <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-3.5">
                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-150 flex flex-col items-center justify-center min-h-[190px] select-none relative overflow-hidden group">
                      <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Visualizador Burger
                      </div>
                      
                      {/* Visual Hamburger Layers Stack rendered reactively */}
                      <div className="w-full max-w-[140px] sm:max-w-[160px] flex flex-col justify-end space-y-[0.7px]">
                        {burgerLayers.map((layer) => (
                          <AnimatePresence key={layer.id} initial={false}>
                            {layer.visible && (
                              <motion.div
                                initial={{ opacity: 0, y: -25, scale: 1.15 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, y: 15 }}
                                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                                className={`${layer.color} ${layer.height} flex items-center justify-center`}
                              >
                                <span className="text-sm sm:text-base mr-1 drop-shadow-sm">{layer.emoji}</span>
                                <span className="hidden sm:inline text-[9px] font-bold text-black/60 capitalize leading-none tracking-tight">
                                  {layer.id === "pao-top" || layer.id === "pao-bottom" ? "Brioche" : layer.id === "hamburguer" ? "Blend 150g" : layer.id}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        ))}
                      </div>

                      <div className="mt-4 text-center">
                        <span className="text-[10px] font-bold text-white bg-brazil-blue border border-brazil-blue px-3 py-1.5 rounded-full shadow-sm">
                          Total Estimado: R$ {calculateBurgerCost().toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Integrated Calorie/Appetite tactile gauge */}
                    <AdaptiveSlider
                      value={appetiteValue}
                      min={300}
                      max={1500}
                      onChange={(val) => setAppetiteValue(val)}
                      titleText="Termômetro de Energia"
                    />
                  </div>

                  {/* List of Ingredients */}
                  <div className="md:col-span-12 lg:col-span-7 flex flex-col gap-2 max-h-[300px] lg:max-h-[430px] overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {currentIngredients.map((ing) => {
                      const isSelected = selectedIngredients.includes(ing.id);
                      const isMandatory = ing.id === "pao" || ing.id === "hamburguer" || ing.id === "queijo";

                      return (
                        <div
                          key={ing.id}
                          onClick={() => handleToggleIngredient(ing.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? "bg-emerald-500/5 border-brazil-green text-gray-950 font-semibold shadow-sm" 
                              : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200"
                          } ${isMandatory ? "opacity-90 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl bg-gray-50 p-1.5 rounded-lg w-9 h-9 flex items-center justify-center border border-gray-150">
                              {ing.emoji}
                            </span>
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                {ing.name}
                                {isMandatory && (
                                  <span className="text-[8px] bg-brazil-yellow text-brazil-blue px-1 py-0.2 rounded font-extrabold uppercase">
                                    Base
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-emerald-700 font-mono font-medium">
                                + R$ {ing.cost.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {!isMandatory ? (
                            <div className={`w-10 h-6 rounded-full transition-all duration-300 relative ${isSelected ? "bg-brazil-green" : "bg-gray-200"}`}>
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${isSelected ? "left-5" : "left-1"}`}></div>
                            </div>
                          ) : (
                            <span className="text-[9px] text-[#009b3a] font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded-md">Incluso</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>

              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6"
              >
                <div className="text-center">
                  <div className="inline-block bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2">
                    🥤 Escalando a Bebida
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    Qual sua Preferência?
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">
                    Selecione qual bebida você vai querer para acompanhar seu burger oficial!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { id: "Suco", name: "Suco Natural", emoji: "🧃", desc: "Opção saudável & refrescante" },
                    { id: "Guaraná", name: "Guaraná", emoji: "🥤", desc: "O autêntico sabor brasileiro" },
                    { id: "Coca", name: "Coca-Cola", emoji: "🥤", desc: "Clássico geladinho" },
                    { id: "Itubaina", name: "Itubaina", emoji: "🍺", desc: "Retrô irresistível" },
                  ].map((item) => {
                    const isSelected = drink === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDrink(item.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition duration-300 relative text-center shrink-0 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 border-brazil-green ring-2 ring-brazil-green/10 text-gray-900"
                            : "bg-white border-gray-150 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 bg-brazil-green text-white p-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5 font-extrabold" />
                          </span>
                        )}
                        <span className="text-3xl mb-1.5">{item.emoji}</span>
                        <span className="text-xs font-black leading-normal text-gray-900">{item.name}</span>
                        <span className="text-[9px] opacity-65 mt-0.5 leading-tight">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-gray-600 text-[11px] flex items-center space-x-3 mt-1.5">
                  <span className="text-sm">⭐</span>
                  <span>A bebida já está inclusa no lanche do encontro! Escolha sua favorita.</span>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6"
              >
                <div className="text-center">
                  <div className="inline-block bg-blue-50 text-[#002776] border border-blue-100 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2">
                    🏆 BOLÃO COPA MANANCIAL
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    Palpite do Jogo Centenário
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">
                    O nosso encontro será no dia 13, assistindo a <b className="text-[#002776] font-bold">Brasil contra Marrocos</b>. Quanto vai ser o jogo?
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-100 to-green-50 border border-emerald-250 rounded-2xl p-6 flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-inner">
                  
                  {/* Decorative Pitch Lines Background */}
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-300/30 top-1/2 -translate-y-1/2"></div>
                  <div className="absolute w-24 h-24 border border-emerald-300/30 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

                  <div className="flex items-center justify-between w-full max-w-sm z-10">
                    
                    {/* Brazil Selection */}
                    <div className="flex flex-col items-center gap-3 w-1/3">
                      <div className="text-4xl shadow-md p-1 bg-white rounded-full w-16 h-16 flex items-center justify-center border border-gray-150 animate-pulse">
                        🇧🇷
                      </div>
                      <span className="text-xs font-black tracking-wider uppercase text-gray-800">Brasil</span>
                      
                      {/* Score Controls */}
                      <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-sm rounded-full border border-gray-200 p-1">
                        <button
                          type="button"
                          onClick={() => setScoreBrazil(prev => Math.max(0, prev - 1))}
                          className="w-7 h-7 flex items-center justify-center text-sm font-black text-rose-550 hover:bg-rose-50 rounded-full transition"
                        >
                          -
                        </button>
                        <span className="text-lg font-black font-mono w-6 text-center text-gray-900">{scoreBrazil}</span>
                        <button
                          type="button"
                          onClick={() => setScoreBrazil(prev => prev + 1)}
                          className="w-7 h-7 flex items-center justify-center text-sm font-black text-emerald-700 hover:bg-emerald-50 rounded-full transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Versus badge */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] font-mono tracking-widest font-black text-gray-500 bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow-md">
                        VS
                      </span>
                    </div>

                    {/* Morocco Selection */}
                    <div className="flex flex-col items-center gap-3 w-1/3">
                      <div className="text-4xl shadow-md p-1 bg-white rounded-full w-16 h-16 flex items-center justify-center border border-gray-150">
                        🇲🇦
                      </div>
                      <span className="text-xs font-black tracking-wider uppercase text-gray-800">Marrocos</span>

                      {/* Score Controls */}
                      <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-sm rounded-full border border-gray-200 p-1">
                        <button
                          type="button"
                          onClick={() => setScoreMorocco(prev => Math.max(0, prev - 1))}
                          className="w-7 h-7 flex items-center justify-center text-sm font-black text-rose-550 hover:bg-rose-50 rounded-full transition"
                        >
                          -
                        </button>
                        <span className="text-lg font-black font-mono w-6 text-center text-gray-900">{scoreMorocco}</span>
                        <button
                          type="button"
                          onClick={() => setScoreMorocco(prev => prev + 1)}
                          className="w-7 h-7 flex items-center justify-center text-sm font-black text-emerald-700 hover:bg-emerald-50 rounded-full transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>

                  <div className="text-center z-10">
                    <span className="inline-flex px-3 py-1 bg-white/80 border border-emerald-200/50 rounded-xl text-emerald-800 text-[11px] font-bold shadow-sm leading-tight">
                      {scoreBrazil > scoreMorocco 
                        ? "🎉 Vitória do Brasil!" 
                        : scoreBrazil < scoreMorocco 
                          ? "🇲🇦 Zebra? Vitória do Marrocos!"
                          : "🤝 Jogo duro, final empatado!"
                      }
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-105 text-gray-600 text-[11px] flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-brazil-yellow fill-brazil-yellow shrink-0" />
                  <span>Seu palpite será computado e adicionado ao termômetro de sentimento da galera no Painel do Admin! Que comece a torcida!</span>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6"
              >
                <div className="text-center">
                  <div className="inline-block bg-emerald-50 text-brazil-green border border-emerald-100 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2">
                    📋 REVISÃO DA ESCALAÇÃO
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 text-center">
                    Confirme Suas Escolhas
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">
                    Verifique se está tudo certinho antes do apito final de envio!
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-5 sm:p-6 divide-y divide-gray-200/80 flex flex-col gap-4 text-xs sm:text-sm text-gray-800">
                  
                  {/* Name and attendance */}
                  <div className="pb-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Convocado</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900 block mt-0.5">{name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 ${
                      confirmed 
                        ? "bg-emerald-50 border border-emerald-150 text-emerald-800" 
                        : "bg-rose-50 border border-rose-150 text-rose-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${confirmed ? "bg-brazil-green" : "bg-rose-500"}`}></span>
                      {confirmed ? "Confirmado" : "Ausente"}
                    </span>
                  </div>

                  {/* Burger Ingredients Summary */}
                  {confirmed && (
                    <div className="py-3.5 text-left">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-2">
                        Seu Burger Gourmet
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentIngredients.filter(i => selectedIngredients.includes(i.id)).map((ing) => (
                          <span
                            key={ing.id}
                            className="bg-white border border-gray-200 px-2.5 py-1.5 rounded-xl text-xs text-gray-700 flex items-center space-x-1 shadow-sm"
                          >
                            <span>{ing.emoji}</span>
                            <span className="font-semibold">{ing.name}</span>
                          </span>
                        ))}
                      </div>
                      <div className="mt-2.5 flex justify-between items-center bg-orange-50/40 p-2.5 rounded-xl border border-orange-100">
                        <span className="text-[10px] font-bold uppercase text-orange-700">Fator de Fome Calculado:</span>
                        <span className="text-xs font-black font-mono text-orange-850">🔥 {appetiteValue} kCal</span>
                      </div>
                      <div className="mt-2.5 flex justify-between items-center bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold uppercase text-emerald-700">Estimativa do Hambúrguer:</span>
                        <span className="text-xs font-black font-mono text-[#009b3a]">R$ {calculateBurgerCost().toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Selected Drink Summary item */}
                  {confirmed && (
                    <div className="py-3.5 text-left flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Bebida Escalada</span>
                        <span className="text-xs sm:text-sm font-semibold text-[#002776] block mt-1 uppercase tracking-wider">{drink}</span>
                      </div>
                      <span className="text-2xl">🥤</span>
                    </div>
                  )}

                  {/* Match Prediction */}
                  <div className="pt-3.5 text-left flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block">Seu Chute</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 block mt-1">{config.matchText}</span>
                    </div>
                    <div className="flex items-center space-x-2.5 bg-white border border-gray-200/80 px-3.5 py-2 rounded-xl">
                      <span className="text-xs font-extrabold font-mono text-emerald-700">🇧🇷 {scoreBrazil}</span>
                      <span className="text-gray-300 text-xs font-mono">X</span>
                      <span className="text-xs font-extrabold font-mono text-emerald-700">{scoreMorocco} 🇲🇦</span>
                    </div>
                  </div>

                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFormSubmit}
                  className="w-full bg-[#009b3a] hover:bg-[#007b2e] text-white font-bold text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg active:scale-[0.98] transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Enviar Escalação Oficial</span>
                      <Send className="w-4 h-4 fill-white text-white stroke-[2.5px]" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === 6 && submittedOrder && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center gap-6 text-center"
              >
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-pulse relative">
                  <Check className="w-10 h-10 stroke-[3.5px]" />
                  <div className="absolute inset-0 border-2 border-emerald-400 rounded-full scale-125 opacity-20 animate-ping"></div>
                </div>

                <div>
                  <h2 className="text-3xl font-black tracking-tight text-brazil-green uppercase sm:text-4xl">
                    GOOOOOOL! ⚽🎉
                  </h2>
                  <h3 className="text-base font-bold text-brazil-blue uppercase tracking-wide mt-1">
                    Escalação Confirmada, {submittedOrder.name.split(" ")[0]}!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
                    Seu pedido foi salvo com total sucesso na planilha do capitão. Nos vemos no dia do encontro para assistir ao jogo na tela grande e devorar esse burger artesanal!
                  </p>
                </div>

                <div className="w-full bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-150 flex flex-col gap-3 font-medium text-gray-700 text-xs sm:text-sm">
                  {submittedOrder.confirmed ? (
                    <>
                      <div className="flex justify-between items-center pb-2 flex-wrap">
                        <span className="text-gray-500 text-xs">🍔 Seu Lanche Customizado:</span>
                        <span className="text-gray-905 font-bold font-mono text-xs">R$ {submittedOrder.cost.toFixed(2)}</span>
                      </div>
                      
                      {submittedOrder.drink && (
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 flex-wrap">
                          <span className="text-gray-500 text-xs">🥤 Sua Bebida:</span>
                          <span className="text-[#002776] font-extrabold uppercase text-[11px]">{submittedOrder.drink}</span>
                        </div>
                      )}

                      {submittedOrder.appetite && (
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 flex-wrap">
                          <span className="text-gray-500 text-xs">🔥 Combustível (Apetite):</span>
                          <span className="text-orange-600 font-extrabold font-mono text-[11px]">{submittedOrder.appetite} kCal</span>
                        </div>
                      )}

                      {/* Rounded Value Box as strictly requested by user */}
                      <div className="bg-brazil-yellow/15 p-4 rounded-xl border border-yellow-250 text-left my-1 flex flex-col gap-1.5 shadow-xs">
                        <div className="flex items-center space-x-1.5 text-[#002776] font-black text-xs uppercase tracking-tight">
                          <Sparkles className="w-4 h-4 fill-brazil-yellow stroke-[#00s2776]" />
                          <span>OBSERVAÇÃO COMPLEMENTAR</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-normal">
                          Para apoiar o ministério, facilitar o troco e arredondar as despesas do evento, a contribuição sugerida para este lanche é de:
                        </p>
                        <div className="text-lg font-mono font-black text-brazil-green">
                          R$ {getSuggestedPaymentValue(submittedOrder.cost).toFixed(2)}
                        </div>
                      </div>

                      {/* Pix details copy block */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-center flex flex-col gap-2 shadow-xs">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Chave Pix Oferecida</span>
                        <div className="font-mono text-gray-900 font-bold bg-gray-50 p-2.5 rounded-xl text-center select-all border border-gray-100 border-dashed text-xs break-all">
                          {config.pixKey}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">Recebedor(a): <b className="text-gray-800">{config.pixReceiver}</b></span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(config.pixKey);
                            alert("Chave Pix copiada com sucesso! 🇧🇷⚽");
                          }}
                          className="text-[10px] bg-gray-105 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg transition active:scale-95 cursor-pointer"
                        >
                          Copiar Código Pix (Chave)
                        </button>
                      </div>

                      {/* WhatsApp receipt submission */}
                      <div className="mt-1">
                        <a
                          href={`https://wa.me/${config.whatsContact.replace(/\D/g, "")}?text=${encodeURIComponent(
                            config.whatsMessage
                              .replace("{nome}", name)
                              .replace("{valor}", `R$ ${getSuggestedPaymentValue(submittedOrder.cost).toFixed(2)}`)
                          )}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <span>Mandar Comprovante para Janaina</span>
                          <span className="text-sm">💬</span>
                        </a>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                          Toque no botão acima para abrir o WhatsApp da {config.pixReceiver} direto com seu comprovante!
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-2.5 text-center text-rose-600 font-semibold flex flex-col gap-1 items-center">
                      <span>😢 Você marcou como ausente no encontro.</span>
                      <span className="text-[11px] text-gray-400 font-medium">Seu chute do Bolão foi guardado, mas sentiremos sua falta!</span>
                    </div>
                  )}

                  <div className="pt-2.5 flex justify-between border-t border-gray-100 mt-1">
                    <span className="text-gray-500 font-medium font-sans">🏅 Seu palpite do Bolão:</span>
                    <span className="font-extrabold font-sans text-gray-905">Brasil {submittedOrder.scoreBrazil} x {submittedOrder.scoreMorocco} Marrocos</span>
                  </div>
                </div>

                {isSimulated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setName("");
                      setConfirmed(true);
                      setDrink("Suco");
                      setSelectedIngredients(currentIngredients.filter(i => i.isDefault).map(i => i.id));
                      setScoreBrazil(2);
                      setScoreMorocco(1);
                      setStep(1);
                    }}
                    className="mt-2 text-xs text-brazil-green underline font-semibold hover:text-[#007b2e] transition"
                  >
                    Fazer outra simulação (Novo Cadastro)
                  </button>
                ) : (
                  <p className="text-[10px] text-gray-400 font-semibold">Você já pode fechar este navegador ou enviar o link para seus amigos!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Bottom Nav Buttons (Only for Wizard pages step 1 to 5) */}
        {step <= 5 && (
          <div className="mt-8 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition active:scale-[0.97]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-brazil-green hover:bg-[#007b2e] text-white px-5.5 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-1 transition active:scale-[0.97]"
              >
                <span>Avançar</span>
                <ChevronRight className="w-4 h-4 text-white stroke-[3px]" />
              </button>
            ) : (
              <div />
            )}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-4 border-t border-gray-150 text-center select-none bg-gray-50">
        <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
          Ministério de Jovens Manancial © 2026
        </p>
      </footer>
    </div>
  );
}
