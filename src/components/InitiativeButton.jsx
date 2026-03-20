import { useState, useEffect } from 'react';
import { Swords, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function InitiativeButton({ onRollComplete }) {
  const [isRolling, setIsRolling] = useState(false);
  const [dieFace, setDieFace] = useState(1);
  const animationDuration = 3000;

  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    // Reset face to null during roll to avoid "snapping"
    setDieFace(null);

    setTimeout(() => {
      const result = Math.floor(Math.random() * 20) + 1;
      setDieFace(result);
      setIsRolling(false);
      if (onRollComplete) onRollComplete(result);
    }, animationDuration);
  };

  return (
    <div className="flex flex-col items-center gap-12">
      {/* 3D DICE AREA */}
      <div className="h-40 flex items-center justify-center">
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0, rotateZ: -45 }}
            animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
            className="die-container"
          >
            <div 
              className={cn("die-3d", isRolling && "rolling")}
              data-face={dieFace}
            >
              {[...Array(20)].map((_, i) => (
                <figure 
                  key={i} 
                  className={`face-3d face-${i + 1}`} 
                  data-number={i + 1} 
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* INITIATIVE BUTTON */}
      <motion.button
        onClick={rollDice}
        disabled={isRolling}
        whileHover={{ scale: isRolling ? 1 : 1.05 }}
        whileTap={{ scale: isRolling ? 1 : 0.95 }}
        className={cn(
          "relative group px-10 py-6 rounded-xl font-bold text-xl transition-all duration-300",
          "bg-gradient-to-br from-red-700 via-red-600 to-red-800",
          "border-2 border-red-500/70",
          "text-white shadow-2xl",
          "disabled:opacity-80 disabled:cursor-not-allowed"
        )}
        style={{
          boxShadow: isRolling 
            ? '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.3)' 
            : '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.2)',
        }}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-red-400/10 to-red-400/20 pointer-events-none" />
        
        {isRolling && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute -inset-1 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-red-500 blur-md -z-10"
          />
        )}
        
        <span className="relative flex items-center gap-3">
          {isRolling ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="font-serif italic text-2xl">Rolling for Lore...</span>
            </>
          ) : (
            <>
              <Swords className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              <span className="font-serif italic text-2xl">Roll for Initiative!</span>
            </>
          )}
        </span>
      </motion.button>
    </div>
  );
}
