import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
}

const digitVariants = {
  initial: (dir: number) => ({
    y: dir > 0 ? 16 : -16,
    opacity: 0,
    scale: 0.6,
    z: 0,
    filter: 'blur(1px)',
  }),
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    z: 10,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -16 : 16,
    opacity: 0,
    scale: 0.6,
    z: 0,
    filter: 'blur(1px)',
  }),
};

export function Stepper({
  value,
  defaultValue = 0,
  min = 0,
  max = 99,
  onChange,
}: StepperProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const [direction, setDirection] = useState(0);

  const current = isControlled ? value! : internal;
  const digits = current.toString().split('');

  const [prevDigits, setPrevDigits] = useState<string[]>([]);
  const [prevTicks, setPrevTicks] = useState<number[]>([]);

  const len = digits.length;
  const lenDiff = len - prevDigits.length;

  const nextTicks = digits.map((digit, i) => {
    const prevI = i - lenDiff;
    const prevDigit = prevI >= 0 ? prevDigits[prevI] : undefined;
    const prevTick = prevI >= 0 ? prevTicks[prevI] : 0;

    return digit !== prevDigit ? (prevTick ?? 0) + 1 : (prevTick ?? 0);
  });

  if (prevDigits.join("") !== digits.join("")) {
    setPrevTicks(nextTicks);
    setPrevDigits(digits);
  }

  const step = (dir: number) => {
    const next = Math.min(max, Math.max(min, current + dir));
    if (next === current) return;
    setDirection(dir);
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className="flex w-full justify-center select-none">
      <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 backdrop-blur-sm p-1 shadow-sm sm:gap-3 dark:border-zinc-800 dark:bg-zinc-900/95">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          onClick={() => step(-1)}
          disabled={current <= min}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed sm:h-10 sm:w-10 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <Minus className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
        </motion.button>

        <div className="relative flex shrink-0 items-center justify-center gap-0.5 text-base font-bold text-gray-800 perspective-midrange transform-3d sm:h-7 sm:text-xl dark:text-white">
          {digits.map((digit, index) => (
            <div
              key={`${index}-${len}`}
              className="relative w-3.5 h-5 transform-3d sm:h-7 sm:w-4 flex items-center justify-center"
            >
              <AnimatePresence
                mode="popLayout"
                initial={false}
                custom={direction}
              >
                <motion.span
                  key={nextTicks[index]}
                  custom={direction}
                  variants={digitVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{
                    type: 'spring',
                    stiffness: 220,
                    damping: 17,
                    mass: 1.1,
                  }}
                  className="absolute inset-0 flex items-center justify-center tabular-nums"
                >
                  {digit}
                </motion.span>
              </AnimatePresence>
            </div>
          ))}
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          onClick={() => step(1)}
          disabled={current >= max}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed sm:h-10 sm:w-10 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
        </motion.button>
      </div>
    </div>
  );
}

export default Stepper;
