import React, { useMemo } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";

interface AdaptiveSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  titleText?: string;
  unitText?: string;
}

interface ColorSettings {
  text: string;
  gradient: string;
  thumbBorder: string;
}

const getColorSettings = (
  value: number,
  min: number,
  max: number,
): ColorSettings => {
  const percentage = (value - min) / (max - min);

  if (percentage < 0.4) {
    return {
      text: "#10B981", // Emerald
      gradient: "linear-gradient(to right, #10B981, #34D399)",
      thumbBorder: "#10B981",
    };
  } else if (percentage < 0.7) {
    return {
      text: "#FE7C09", // Orange
      gradient: "linear-gradient(to right, #FEB101, #FE7C09)",
      thumbBorder: "#FE7C09",
    };
  } else {
    return {
      text: "#EF4444", // Red/Fogo
      gradient: "linear-gradient(to right, #F87171, #EF4444)",
      thumbBorder: "#EF4444",
    };
  }
};

export const AdaptiveSlider: React.FC<AdaptiveSliderProps> = ({
  value,
  min = 300,
  max = 1500,
  step = 50,
  onChange,
  titleText = "Estimativa de Energia",
  unitText = "kCal",
}) => {
  const colorSettings = useMemo(
    () => getColorSettings(value, min, max),
    [value, min, max]
  );

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const dots = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="z-30 h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-slate-300 transition-colors"
          style={{ opacity: 0.6 }}
        />
      )),
    []
  );

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 border border-gray-150 p-4 sm:p-5 shadow-xs w-full select-none text-center">
      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">
        {titleText}
      </span>

      <div className="mb-4 flex items-baseline justify-center gap-1">
        <span 
          style={{ color: colorSettings.text }}
          className="text-2xl sm:text-3xl font-mono font-black tracking-tight transition-colors duration-300"
        >
          <NumberFlow value={value} />
        </span>
        <span className="text-xs font-extrabold text-gray-500 tracking-wide uppercase">
          {unitText}
        </span>
      </div>

      <div className="group relative flex h-10 w-full items-center overflow-hidden rounded-full bg-gray-250 transition-colors border border-gray-200">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6">
          {dots}
        </div>

        <motion.div
          className="pointer-events-none absolute top-0 left-0 h-full rounded-full"
          animate={{
            width: `calc((${percentage} / 100) * (100% - 40px) + 40px)`,
            background: colorSettings.gradient,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        />

        <input
          title="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="absolute inset-0 z-50 h-10 w-full cursor-pointer opacity-0"
        />

        <motion.div
          className="pointer-events-none absolute top-0 z-40 flex h-10 w-10 items-center justify-center rounded-full border-none"
          animate={{
            left: `calc((${percentage} / 100) * (100% - 40px))`,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        >
          <div className="h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-150">
            <span className="text-xs">🔥</span>
          </div>
        </motion.div>
      </div>

      {/* Helper Context Message */}
      <p className="text-[9px] text-gray-400 font-bold mt-2 leading-tight uppercase tracking-wider">
        {value < 600 ? "🥗 Leve & Saudável" : value < 1000 ? "🍔 Combo Monstro de Respeito" : "🦖 Fome de Dinossauro!"}
      </p>
    </div>
  );
};
