import { useState } from 'react';
import { Swords, Loader2, Star, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function InitiativeButton({ onRollComplete, disabled }) {
  const [isRolling, setIsRolling] = useState(false);
  const [dieFace, setDieFace] = useState(1);
  const [isCritical, setIsCritical] = useState(false);
  const [isFail, setIsFail] = useState(false); // NEW: Track Nat 1s

  const rollDice = () => {
    if (isRolling || disabled) return;

    setIsRolling(true);
    setIsCritical(false);
    setIsFail(false); // Reset fail state

    setTimeout(() => {
      const result = Math.floor(Math.random() * 20) + 1;
      
      setDieFace(result);
      setIsRolling(false);
      
      if (result === 20) setIsCritical(true);
      if (result === 1) setIsFail(true); // Trigger fail state

      if (onRollComplete) onRollComplete(result);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      
      {/* ── 3D DICE VIEWPORT ── */}
      {/* We wrap the container in a motion.div to animate the actual die when it lands */}
      <motion.div 
        className="die-container relative"
        animate={
          isFail ? { x: [-15, 15, -10, 10, -5, 5, 0] } : // Violent shake for Nat 1
          isCritical ? { y: [0, -10, 0] } : // Triumphant float for Nat 20
          {}
        }
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Glow Effects */}
        <AnimatePresence>
          {isCritical && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-yellow-400 rounded-full blur-[60px] opacity-40 z-0"
            />
          )}
          {isFail && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-700 rounded-full blur-[60px] opacity-60 z-0"
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
      </motion.div>

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
              ) : isFail ? (
                <Skull className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Swords className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
              )}
              <span className="font-lcars tracking-widest text-2xl uppercase text-white">
                {isCritical ? "CRITICAL HIT!" : isFail ? "CRITICAL FAILURE!" : "Roll for Initiative!"}
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
            className={cn(
              "font-lcars text-lg tracking-[0.3em] uppercase font-bold",
              isCritical ? "text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" : 
              isFail ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : 
              "text-[var(--accent)]"
            )}
          >
            Result: {dieFace}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
