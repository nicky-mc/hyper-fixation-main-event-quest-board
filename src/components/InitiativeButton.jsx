import { useState } from 'react';
import { Swords, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function InitiativeButton({ onClick, isRolling, disabled }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isRolling}
      whileHover={{ scale: disabled || isRolling ? 1 : 1.05 }}
      whileTap={{ scale: disabled || isRolling ? 1 : 0.95 }}
      className={cn(
        "relative group px-8 py-5 rounded-xl font-bold text-xl transition-all duration-300",
        "bg-gradient-to-br from-red-700 via-red-600 to-red-800",
        "border-2 border-red-500/70",
        "text-white shadow-2xl",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        isRolling && "animate-pulse"
      )}
      style={{
        boxShadow: isRolling 
          ? '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.3)' 
          : '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.2)',
      }}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-red-400/10 to-red-400/20 pointer-events-none" />
      
      {/* Animated border glow when rolling */}
      {isRolling && (
        <motion.div
          animate={{ 
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute -inset-1 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-red-500 blur-md -z-10"
        />
      )}
      
      <span className="relative flex items-center gap-3">
        {isRolling ? (
          <>
            <Loader2 className="w-7 h-7 animate-spin" />
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1.75rem' }}>
              Rolling...
            </span>
          </>
        ) : (
          <>
            <Swords className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1.75rem' }}>
              Roll for Initiative!
            </span>
          </>
        )}
      </span>
    </motion.button>
  );
}