import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map zones with fantasy positions
const ZONES = [
  { id: 'combat',      label: 'The Battlegrounds', x: 20,  y: 25,  color: '#ef4444', icon: '⚔️',
    segments: ['Roll for Initiative', 'Heel Turn', 'The Dark Match'] },
  { id: 'lore',        label: 'The Library of Endless Lore', x: 65, y: 18,  color: '#f59e0b', icon: '📖',
    segments: ['World Building', 'Heart of the Story', 'The Main Quest', 'The Hyper-fixation Main Event', 'Character Sheets'] },
  { id: 'exploration', label: 'The Outer Rim', x: 75, y: 60,  color: '#06b6d4', icon: '🚀',
    segments: ["Captain's Log", 'Glitches in the Holodeck', 'Patch Notes', 'The Tavern Entry'] },
  { id: 'community',   label: 'The Tavern', x: 40,  y: 70,  color: '#22c55e', icon: '🍺',
    segments: ['The Loot Drop', 'The Co-Op Club', 'The Respec', 'The Gimmick Check'] },
  { id: 'chaos',       label: 'The Haunted Dungeon', x: 15, y: 65,  color: '#ea580c', icon: '💀',
    segments: ['Critical Fails & Jump Scares'] },
  { id: 'shark',       label: "Charlotte's Ocean", x: 55, y: 82,  color: '#3b82f6', icon: '🦈',
    segments: ['Shark Week Special'] },
];

function getZoneForQuest(quest) {
  return ZONES.find(z => z.segments.includes(quest.segment));
}

export default function QuestWorldMap({ quests, onClose }) {
  const questsByZone = {};
  quests.forEach(q => {
    const zone = getZoneForQuest(q);
    if (zone) {
      if (!questsByZone[zone.id]) questsByZone[zone.id] = [];
      questsByZone[zone.id].push(q);
    }
  });

  const [hoveredZone, setHoveredZone] = React.useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl border-2 border-purple-800/60 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 50%, #050a10 100%)', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/40">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>Quest World Map</h2>
            <span className="text-xs text-slate-500 ml-1">— {quests.length} active quests</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map canvas */}
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          {/* Parchment / terrain bg */}
          <div className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 30% 40%, rgba(120,53,15,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(6,78,84,0.12) 0%, transparent 50%), radial-gradient(ellipse at 20% 75%, rgba(88,28,135,0.12) 0%, transparent 50%)',
            }}>
            {/* Grid */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />

            {/* Zone nodes */}
            {ZONES.map(zone => {
              const count = questsByZone[zone.id]?.length || 0;
              const isHovered = hoveredZone === zone.id;
              return (
                <div
                  key={zone.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  {/* Pulse ring */}
                  {count > 0 && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ backgroundColor: zone.color, filter: 'blur(2px)' }}
                    />
                  )}

                  {/* Node */}
                  <motion.div
                    animate={{ scale: isHovered ? 1.3 : 1 }}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 shadow-lg"
                    style={{
                      backgroundColor: `${zone.color}22`,
                      borderColor: zone.color,
                      boxShadow: `0 0 ${isHovered ? 20 : 10}px ${zone.color}60`,
                    }}
                  >
                    {zone.icon}
                    {count > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-black"
                        style={{ backgroundColor: zone.color }}>
                        {count}
                      </div>
                    )}
                  </motion.div>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 rounded-lg border text-xs"
                        style={{ backgroundColor: '#0d0d1a', borderColor: zone.color + '60' }}
                      >
                        <p className="font-bold mb-1" style={{ color: zone.color }}>{zone.label}</p>
                        {count === 0 ? (
                          <p className="text-slate-600">No quests here yet</p>
                        ) : (
                          <ul className="space-y-0.5">
                            {questsByZone[zone.id].slice(0, 4).map(q => (
                              <li key={q.id} className="text-slate-400 truncate flex items-center gap-1">
                                <Swords className="w-2.5 h-2.5 shrink-0" style={{ color: zone.color }} />
                                {q.title}
                              </li>
                            ))}
                            {count > 4 && <li className="text-slate-600">+{count - 4} more...</li>}
                          </ul>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Map label */}
            <div className="absolute bottom-2 right-3 text-[9px] text-slate-700 font-mono tracking-widest uppercase">
              The Realm of HME · Cartography Dept.
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-purple-900/40 flex flex-wrap gap-3">
          {ZONES.map(z => (
            <div key={z.id} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span style={{ color: z.color }}>{z.icon}</span>
              <span>{z.label}</span>
              <span className="text-slate-700">({questsByZone[z.id]?.length || 0})</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Need React for useState
import React from 'react';