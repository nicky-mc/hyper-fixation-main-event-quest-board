import { Sword, Shield, Scroll, Star, Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const segmentIcons = {
  'The Gimmick Check': Zap,
  'Main Event': Sword,
  'The Dark Match': Shield,
  'Heel Turn': Flame,
  'Side Quest': Scroll,
  'The Pop': Star,
};

const segmentColors = {
  'The Gimmick Check': 'from-amber-600 to-yellow-500',
  'Main Event': 'from-red-700 to-orange-500',
  'The Dark Match': 'from-purple-700 to-indigo-500',
  'Heel Turn': 'from-rose-700 to-pink-500',
  'Side Quest': 'from-emerald-700 to-teal-500',
  'The Pop': 'from-cyan-600 to-blue-500',
};

export default function QuestCard({ quest, isSelected, isRolling, index }) {
  const SegmentIcon = segmentIcons[quest.segment] || Scroll;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isRolling ? [1, 1.05, 1] : 1,
      }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        scale: isRolling ? { duration: 0.3, repeat: Infinity } : {}
      }}
      className={cn(
        "relative group cursor-pointer transition-all duration-500",
        isSelected && "z-10"
      )}
    >
      {/* Glow effect for selected card */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-xl blur-md"
          style={{
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}
      
      {/* Rolling glow effect */}
      {isRolling && (
        <motion.div
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute -inset-1 bg-gradient-to-r from-amber-500/50 to-orange-500/50 rounded-xl blur-sm"
        />
      )}
      
      {/* Card container */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl transition-all duration-300",
          "bg-gradient-to-br from-amber-950/95 via-stone-900/95 to-amber-950/95",
          "border-2",
          isSelected 
            ? "border-amber-400 shadow-2xl shadow-amber-500/30" 
            : "border-amber-900/60 hover:border-amber-700/80",
          "backdrop-blur-sm"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Parchment texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/5 via-transparent to-stone-950/20 pointer-events-none" />
        
        {/* Segment Tag Banner */}
        <div className={cn(
          "relative px-4 py-2 bg-gradient-to-r",
          segmentColors[quest.segment],
          "border-b border-amber-900/30"
        )}>
          <div className="flex items-center gap-2">
            <SegmentIcon className="w-4 h-4 text-white/90" />
            <span className="text-xs font-semibold text-white/95 tracking-wide uppercase">
              {quest.segment}
            </span>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="relative p-5 space-y-4">
          {/* DC Badge */}
          <div className="absolute top-3 right-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex flex-col items-center justify-center",
              "bg-gradient-to-br from-stone-800 to-stone-900",
              "border-2 border-amber-600/70 shadow-lg shadow-amber-900/30",
              isSelected && "border-amber-400 shadow-amber-400/30"
            )}>
              <span className="text-[10px] text-amber-500/80 font-medium -mb-0.5">DC</span>
              <span className="text-lg font-bold text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>
                {quest.difficulty_class}
              </span>
            </div>
          </div>
          
          {/* Quest Title */}
          <h3 
            className={cn(
              "text-xl font-bold pr-14 leading-tight",
              isSelected ? "text-amber-300" : "text-amber-100/90",
              "transition-colors duration-300"
            )}
            style={{ 
              fontFamily: "'Caveat', 'Segoe Script', cursive",
              fontSize: '1.5rem',
              letterSpacing: '0.02em'
            }}
          >
            {quest.title}
          </h3>
          
          {/* Quest Description */}
          <p 
            className="text-sm text-stone-400 line-clamp-2 leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {quest.description}
          </p>
          
          {/* Quest Giver */}
          <div className="flex items-center gap-2 pt-2 border-t border-amber-900/30">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center border border-amber-600/50">
              <span className="text-xs font-bold text-amber-200">
                {quest.quest_giver.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-xs text-amber-600/70 block -mb-0.5">Quest Giver</span>
              <span 
                className="text-sm font-medium text-amber-200/90"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                {quest.quest_giver}
              </span>
            </div>
          </div>
        </div>
        
        {/* Selected badge */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-amber-500 text-stone-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-amber-500/50 border-2 border-amber-300">
              ⚔️ SELECTED!
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}