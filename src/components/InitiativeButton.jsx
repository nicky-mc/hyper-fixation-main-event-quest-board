import { useState } from 'react';
import { Swords, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function InitiativeButton({ onRollComplete, disabled }) {
  const [isRolling, setIsRolling] = useState(false);
  const [dieFace, setDieFace] = useState(1);
  const [isCritical, setIsCritical] = useState(false);

  const rollDice = () => {
    if (isRolling || disabled) return;

    setIsRolling(true);
    setIsCritical(false);
    
    // We REMOVE setDieFace(null) so the die remembers its last position
    // while the spin animation takes over.

    setTimeout(() => {
      const result = Math.floor(Math.random() * 20) + 1;
      
      setDieFace(result);
      setIsRolling(false);
      
      if (result === 20) setIsCritical(true);

      if (onRollComplete) onRollComplete(result);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      
      {/* ── 3D DICE VIEWPORT ── */}
      <div className="die-container relative">
        {/* Critical Hit Glow */}
        <AnimatePresence>
          {isCritical && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--accent)] rounded-full blur-[50px] opacity-30 z-0"
            />
          )}
        </AnimatePresence>

        <div 
          className={cn("die-3d z-10", isRolling && "rolling")}
          data-face={dieFace}
        >
          {/* True balanced D20 mapping where opposites sum to 21 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 11, 15, 14, 13, 17, 16, 20, 19, 18].map((num, i) => (
            <figure 
              key={i} 
              className="face-3d" 
              data-number={num} 
            />
          ))}
        </div>
      </div>

      {/* ── THE ACTION BUTTON ── */}
      <motion.button
        onClick={rollDice}
        disabled={isRolling || disabled}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98, y: 0 }}
        className={cn(
          "relative group px-12 py-5 rounded-2xl font-black text-xl transition-all duration-500 overflow-hidden",
          "bg-gradient-to-br from-[var(--command-red)] via-[var(--command-red-bright)] to-[var(--command-red)]",
          "border-2 border-[var(--accent)] shadow-2xl",
          "disabled:opacity-60 disabled:grayscale-[0.5] disabled:cursor-not-allowed"
        )}
        style={{
          boxShadow: isRolling 
            ? '0 0 40px var(--accent), 0 0 80px rgba(var(--accent-rgb), 0.3)' 
            : '0 15px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(var(--accent-rgb), 0.2)',
        }}
      >
        {/* Inner Glass Flare */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />

        {/* Animated Aura (During Roll) */}
        {isRolling && (
          <motion.div
            animate={{ 
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute -inset-2 bg-gradient-to-r from-[var(--accent)] via-white to-[var(--accent)] blur-xl -z-10"
          />
        )}
        
        <span className="relative flex items-center gap-4">
          {isRolling ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="font-lcars tracking-widest text-2xl uppercase text-white">
                Rolling Lore...
              </span>
            </>
          ) : (
            <>
              {isCritical ? (
                <Star className="w-8 h-8 text-white fill-white animate-bounce" />
              ) : (
                <Swords className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
              )}
              <span className="font-lcars tracking-widest text-2xl uppercase text-white">
                {isCritical ? "CRITICAL HIT!" : "Roll for Initiative!"}
              </span>
            </>
          )}
        </span>
      </motion.button>

      {/* ── RESULT ANNOUNCEMENT ── */}
      <AnimatePresence>
        {dieFace && !isRolling && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-lcars text-[var(--accent)] text-lg tracking-[0.3em] uppercase font-bold"
          >
            Result: {dieFace}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
