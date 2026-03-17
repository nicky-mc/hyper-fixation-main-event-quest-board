import { motion, AnimatePresence } from 'framer-motion';
import { X, Crosshair, Rocket, MapPin } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function QuestWorldMap({ quests, onClose }) {
  const [activeNode, setActiveNode] = useState(null);
  const [mapTheme, setMapTheme] = useState('scifi'); // 'scifi' | 'fantasy'

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md overflow-hidden flex items-center justify-center">

      {/* Theme Toggle */}
      <button
        onClick={() => setMapTheme(prev => prev === 'scifi' ? 'fantasy' : 'scifi')}
        className="absolute top-6 left-6 z-50 px-4 py-2 bg-black/60 backdrop-blur-md text-amber-400 hover:text-white hover:bg-black/80 rounded-full border border-amber-500/50 transition-colors font-lcars tracking-widest text-xs uppercase shadow-lg"
      >
        Switch to {mapTheme === 'scifi' ? 'Fantasy' : 'Sci-Fi'} Realm
      </button>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-3 bg-red-900/40 text-red-400 hover:bg-red-900/80 rounded-full border border-red-500/50 transition-colors shadow-lg"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Draggable Canvas */}
      <motion.div
        drag
        dragConstraints={{ top: -1000, left: -1000, right: 1000, bottom: 1000 }}
        className="w-[3000px] h-[3000px] absolute cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: mapTheme === 'scifi' ? `url('/starmapposter3d.webp')` : `url('/fantasy-map.avif')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Central crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
          <Crosshair className={cn("w-32 h-32", mapTheme === 'scifi' ? "text-cyan-500" : "text-amber-700")} />
        </div>

        {/* Animated Player Icon */}
        <motion.div
          className="absolute z-40 pointer-events-none"
          initial={false}
          animate={{
            top: activeNode ? (20 + ((quests.findIndex(q => q.id === activeNode.id) * 37) % 60) + '%') : '50%',
            left: activeNode ? (20 + ((quests.findIndex(q => q.id === activeNode.id) * 43) % 60) + '%') : '50%',
          }}
          transition={{ type: 'spring', stiffness: 40, damping: 12, mass: 0.8 }}
        >
          {mapTheme === 'scifi'
            ? <Rocket className="w-8 h-8 -mt-10 -ml-4 transform rotate-45 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            : <MapPin className="w-10 h-10 -mt-10 -ml-5 text-red-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" />
          }
        </motion.div>

        {/* Quest Nodes */}
        {quests.map((quest, index) => {
          const topPos = 20 + ((index * 37) % 60) + '%';
          const leftPos = 20 + ((index * 43) % 60) + '%';
          const isSelected = activeNode?.id === quest.id;

          return (
            <motion.div
              key={quest.id}
              className="absolute flex flex-col items-center gap-2"
              style={{ top: topPos, left: leftPos }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Pulse ring when selected */}
              {isSelected && (
                <motion.div
                  className="absolute rounded-full pointer-events-none border-2"
                  style={{ width: '32px', height: '32px', top: '-4px', left: '-4px', borderColor: mapTheme === 'scifi' ? 'rgba(251,191,36,0.7)' : 'rgba(220,38,38,0.7)' }}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setActiveNode(quest)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all duration-300",
                  mapTheme === 'scifi'
                    ? (isSelected ? "bg-amber-400 border-white scale-125 shadow-[0_0_15px_rgba(251,191,36,0.8)]" : "bg-purple-600 border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)] hover:scale-110 hover:bg-amber-500")
                    : (isSelected ? "bg-red-600 border-yellow-400 scale-125 shadow-lg" : "bg-yellow-700 border-yellow-300 shadow-md hover:scale-110 hover:bg-red-500")
                )}
              />

              <span className={cn(
                "text-[10px] tracking-widest px-2 py-0.5 rounded border whitespace-nowrap",
                mapTheme === 'scifi'
                  ? "font-lcars text-cyan-200 bg-black/80 backdrop-blur-sm border-cyan-500/50"
                  : "font-serif text-amber-100 bg-stone-900/90 border-amber-700/50"
              )}>
                {quest.title.length > 15 ? quest.title.substring(0, 15) + '...' : quest.title}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* LCARS Data-Pad Sidebar */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-gradient-to-b from-[#0d0d1a] to-[#080510] border-l-2 border-amber-500/50 shadow-2xl z-[110] flex flex-col"
          >
            <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg, #CC0000, #FFBF00, #a855f7)' }} />

            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-[10px] font-lcars text-amber-500 tracking-widest uppercase mb-4">◈ Target Acquired</h3>
              <h2 className="text-2xl font-black text-white mb-2 leading-tight">{activeNode.title}</h2>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="font-lcars text-xs bg-purple-900/50 border border-purple-500/30 text-purple-200 px-2 py-1 rounded tracking-widest uppercase">
                  DC {activeNode.difficulty_class}
                </span>
                <span className="font-lcars text-xs text-slate-400 tracking-widest uppercase">By {activeNode.quest_giver}</span>
                {activeNode.segment && (
                  <span className="font-lcars text-[9px] bg-cyan-900/30 border border-cyan-700/30 text-cyan-400 px-2 py-1 rounded tracking-widest uppercase">
                    {activeNode.segment}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">{activeNode.description}</p>
              {activeNode.image_url && (
                <img src={activeNode.image_url} alt="Quest Visual"
                  className="w-full h-40 object-cover rounded-lg border border-white/10 mb-6" />
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/40 shrink-0">
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setActiveNode(null)}
                className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/50 rounded-xl font-bold font-lcars tracking-widest transition-colors uppercase text-sm"
              >
                ◀ Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}