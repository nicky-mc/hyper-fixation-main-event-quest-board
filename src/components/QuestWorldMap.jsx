import { motion, AnimatePresence } from 'framer-motion';
import { X, Crosshair, Rocket, MapPin } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function QuestWorldMap({ quests, onClose }) {
  const [activeNode, setActiveNode] = useState(null);
  const [mapTheme, setMapTheme] = useState('scifi');
  const [zoom, setZoom] = useState(0.5);

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.2), 2));
  };

  return (
    <div className="fixed top-[64px] left-0 md:left-[260px] right-0 bottom-0 z-[40] bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center overflow-hidden">

      {/* The LCARS PADD Device */}
      <div className="relative w-full h-full max-w-7xl bg-black rounded-[2rem] border-4 border-amber-500 flex flex-col md:flex-row shadow-2xl overflow-hidden">

        {/* The LCARS Physical Bezel */}
        <div className="w-full md:w-32 bg-amber-500 flex md:flex-col items-center justify-between p-3 md:py-8 md:px-3 shrink-0 rounded-t-[1.5rem] md:rounded-l-[1.5rem] md:rounded-tr-none gap-4 z-50 relative">

          {/* Close Button */}
          <button onClick={onClose} className="w-full py-2 md:py-6 bg-red-600 hover:bg-red-500 text-black font-black font-lcars text-xs md:text-sm tracking-widest uppercase rounded-full md:rounded-[2rem] transition-colors border-2 border-red-800">
            EXIT
          </button>

          {/* Zoom Controls */}
          <div className="flex md:flex-col gap-2 w-full">
            <button onClick={() => handleZoom(0.2)} className="flex-1 py-2 bg-amber-600 hover:bg-white hover:text-black text-black font-bold rounded-lg border border-amber-700 transition-all">+</button>
            <button onClick={() => handleZoom(-0.2)} className="flex-1 py-2 bg-amber-600 hover:bg-white hover:text-black text-black font-bold rounded-lg border border-amber-700 transition-all">-</button>
          </div>

          {/* Filler Bar */}
          <div className="hidden md:block flex-1 w-1/2 bg-amber-600 rounded-full my-2 opacity-50" />

          {/* Theme Toggle Button */}
          <button
            onClick={() => setMapTheme(prev => prev === 'scifi' ? 'fantasy' : 'scifi')}
            className="w-full py-2 md:py-8 bg-purple-900 hover:bg-purple-800 text-purple-200 font-bold font-lcars text-[10px] md:text-xs tracking-widest uppercase rounded-full md:rounded-[2rem] transition-colors border-2 border-purple-950 flex flex-col items-center justify-center gap-1"
          >
            <span>{mapTheme === 'scifi' ? 'FANTASY' : 'SCI-FI'}</span>
            <span className="text-[8px] opacity-70">MODE</span>
          </button>
        </div>

        {/* The Screen */}
        <div
          onWheel={(e) => handleZoom(e.deltaY > 0 ? -0.1 : 0.1)}
          className="relative flex-1 overflow-hidden bg-[#080510]"
        >

          {/* Draggable Canvas */}
          <motion.div
            drag
            dragConstraints={{ top: -2500, left: -2500, right: 2500, bottom: 2500 }}
            animate={{ scale: zoom }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[3000px] h-[3000px] absolute cursor-grab active:cursor-grabbing origin-center"
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
                  animate={{ scale: zoom < 0.5 ? 1 / zoom * 0.5 : 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
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

          {/* Active Quest Data-Pad */}
          <AnimatePresence>
            {activeNode && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute right-0 bottom-0 w-full md:w-96 md:top-0 h-1/2 md:h-full bg-gradient-to-t md:bg-gradient-to-b from-[#0d0d1a] to-[#080510]/95 border-t-2 md:border-t-0 md:border-l-2 border-amber-500/50 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-[110] flex flex-col backdrop-blur-md"
              >
                <button
                  onClick={() => setActiveNode(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-black/50 rounded-full z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-4 md:p-6 flex-1 overflow-y-auto mt-6 md:mt-0">
                  <h3 className="text-[10px] font-lcars text-amber-500 tracking-widest uppercase mb-2">Target Acquired</h3>
                  <h2 className="text-xl md:text-2xl font-black text-white mb-2">{activeNode.title}</h2>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs bg-purple-900/50 border border-purple-500/30 text-purple-200 px-2 py-1 rounded">DC {activeNode.difficulty_class}</span>
                    <span className="text-xs text-slate-400 truncate">By {activeNode.quest_giver}</span>
                    {activeNode.segment && (
                      <span className="text-[9px] bg-cyan-900/30 border border-cyan-700/30 text-cyan-400 px-2 py-1 rounded font-lcars uppercase tracking-widest">
                        {activeNode.segment}
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-4 line-clamp-3 md:line-clamp-none">{activeNode.description}</p>
                  {activeNode.image_url && (
                    <img src={activeNode.image_url} alt="Quest Visual" className="w-full h-24 md:h-40 object-cover rounded-lg border border-white/10 mb-4" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div> {/* End Screen */}
      </div> {/* End PADD Device */}
    </div> /* End Backdrop */
  );
}