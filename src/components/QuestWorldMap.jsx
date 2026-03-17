import { motion, AnimatePresence } from 'framer-motion';
import { X, Crosshair, Rocket } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function QuestWorldMap({ quests, onClose }) {
  const [activeNode, setActiveNode] = useState(null);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md overflow-hidden flex items-center justify-center">

      {/* Close Button */}
      <button onClick={onClose}
        className="absolute top-6 right-6 z-[120] p-3 bg-red-900/40 text-red-400 hover:bg-red-900/80 rounded-full border border-red-500/50 transition-colors">
        <X className="w-6 h-6" />
      </button>

      {/* Header label */}
      <div className="absolute top-6 left-6 z-[120] pointer-events-none">
        <p className="font-lcars text-[10px] tracking-[0.3em] uppercase text-cyan-400 mb-0.5">STARFLEET HME</p>
        <h2 className="font-lcars font-black text-amber-300 text-xl tracking-widest uppercase">Astrometrics Lab</h2>
        <p className="font-lcars text-[9px] text-purple-400 tracking-widest uppercase mt-0.5">{quests.length} Star Systems Charted · Drag to Explore</p>
      </div>

      {/* Draggable Map Canvas */}
      <motion.div
        drag
        dragConstraints={{ top: -1000, left: -1000, right: 1000, bottom: 1000 }}
        className="w-[3000px] h-[3000px] absolute cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.07) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
        }}
      >
        {/* Nebula blobs */}
        <div className="absolute pointer-events-none" style={{ top: '30%', left: '25%', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute pointer-events-none" style={{ top: '55%', left: '55%', width: '500px', height: '400px', background: 'radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute pointer-events-none" style={{ top: '40%', left: '45%', width: '400px', height: '300px', background: 'radial-gradient(ellipse, rgba(239,68,68,0.05) 0%, transparent 70%)', filter: 'blur(50px)' }} />

        {/* Central crosshair anchor */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Crosshair className="w-32 h-32 text-purple-500" />
        </div>

        {/* Player Ship */}
        <motion.div
          className="absolute z-40 pointer-events-none"
          initial={false}
          animate={{
            top: activeNode
              ? `calc(${20 + ((quests.findIndex(q => q.id === activeNode.id) * 37) % 60)}% - 40px)`
              : 'calc(50% - 40px)',
            left: activeNode
              ? `calc(${20 + ((quests.findIndex(q => q.id === activeNode.id) * 43) % 60)}% - 16px)`
              : 'calc(50% - 16px)',
          }}
          transition={{ type: 'spring', stiffness: 40, damping: 12, mass: 0.8 }}
          style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.9))' }}
        >
          <Rocket className="w-8 h-8 text-cyan-400 transform rotate-45" />
        </motion.div>

        {/* Quest Star Nodes */}
        {quests.map((quest, index) => {
          const topPos = `${20 + ((index * 37) % 60)}%`;
          const leftPos = `${20 + ((index * 43) % 60)}%`;
          const isSelected = activeNode?.id === quest.id;

          return (
            <motion.div
              key={quest.id}
              className="absolute flex flex-col items-center gap-1.5"
              style={{ top: topPos, left: leftPos }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.04, type: 'spring', stiffness: 200 }}
            >
              {/* Pulse ring for selected */}
              {isSelected && (
                <motion.div
                  className="absolute rounded-full border-2 border-amber-400/60 pointer-events-none"
                  style={{ width: '36px', height: '36px', top: '-6px', left: '-6px' }}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Star Node */}
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setActiveNode(quest)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all duration-300',
                  isSelected
                    ? 'bg-amber-400 border-white scale-125 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                    : 'bg-purple-600 border-purple-300 hover:scale-110 hover:bg-amber-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                )}
              />

              {/* Label */}
              <span className="text-[9px] font-lcars tracking-widest text-purple-200 bg-black/70 px-2 py-0.5 rounded border border-purple-900/50 whitespace-nowrap pointer-events-none">
                {quest.title.length > 18 ? quest.title.substring(0, 18) + '…' : quest.title}
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
            {/* LCARS top accent */}
            <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #CC0000, #FFBF00, #a855f7)' }} />

            <div className="p-5 flex-1 overflow-y-auto">
              <p className="font-lcars text-[9px] text-amber-500 tracking-[0.3em] uppercase mb-1">◈ Target Acquired</p>
              <h2 className="text-xl font-black text-white mb-1 leading-tight">{activeNode.title}</h2>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="font-lcars text-[10px] bg-purple-900/50 border border-purple-500/30 text-purple-200 px-2 py-1 rounded tracking-widest uppercase">
                  DC {activeNode.difficulty_class}
                </span>
                <span className="font-lcars text-[10px] text-slate-500 tracking-widest uppercase">By {activeNode.quest_giver}</span>
                {activeNode.segment && (
                  <span className="font-lcars text-[9px] bg-cyan-900/30 border border-cyan-700/30 text-cyan-400 px-2 py-1 rounded tracking-widest uppercase">
                    {activeNode.segment}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-5">{activeNode.description}</p>

              {activeNode.image_url && (
                <img src={activeNode.image_url} alt="Quest Visual"
                  className="w-full h-40 object-cover rounded-lg border border-white/10 mb-5" />
              )}

              {/* LCARS data blocks */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
                  <p className="font-lcars text-[8px] text-purple-400 uppercase tracking-widest mb-1">Segment</p>
                  <p className="font-lcars text-[10px] text-purple-200 uppercase font-bold truncate">{activeNode.segment || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                  <p className="font-lcars text-[8px] text-red-400 uppercase tracking-widest mb-1">Difficulty</p>
                  <p className="font-lcars text-[10px] text-red-200 uppercase font-bold">DC {activeNode.difficulty_class}</p>
                </div>
              </div>
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