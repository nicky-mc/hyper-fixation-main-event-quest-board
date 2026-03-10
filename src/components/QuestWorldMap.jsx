import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import React, { useState } from 'react';

// Zone definitions with fantasy location names tied to segment topics
const ZONES = [
  {
    id: 'combat',
    label: 'The Battlegrounds',
    sublabel: 'Where Champions Clash',
    x: 22, y: 28,
    color: '#ef4444', icon: '⚔️',
    terrain: '🏔️',
    segments: ['Roll for Initiative', 'Heel Turn', 'The Dark Match'],
  },
  {
    id: 'lore',
    label: 'The Grand Archive',
    sublabel: 'Lore & Deep Dives',
    x: 64, y: 20,
    color: '#f59e0b', icon: '📖',
    terrain: '🏰',
    segments: ['World Building', 'Heart of the Story', 'The Main Quest', 'The Hyper-fixation Main Event', 'Character Sheets'],
  },
  {
    id: 'exploration',
    label: 'The Outer Rim',
    sublabel: 'Stardate Unknown',
    x: 78, y: 58,
    color: '#06b6d4', icon: '🚀',
    terrain: '🌌',
    segments: ["Captain's Log", 'Glitches in the Holodeck', 'Patch Notes', 'The Tavern Entry'],
  },
  {
    id: 'community',
    label: "The Adventurer's Tavern",
    sublabel: 'Community Hub',
    x: 40, y: 68,
    color: '#22c55e', icon: '🍺',
    terrain: '🌲',
    segments: ['The Loot Drop', 'The Co-Op Club', 'The Respec', 'The Gimmick Check'],
  },
  {
    id: 'chaos',
    label: 'The Haunted Dungeon',
    sublabel: 'Enter If You Dare',
    x: 16, y: 65,
    color: '#ea580c', icon: '💀',
    terrain: '🕸️',
    segments: ['Critical Fails & Jump Scares'],
  },
  {
    id: 'shark',
    label: "Charlotte's Ocean",
    sublabel: '🦈 Shark Territory',
    x: 55, y: 84,
    color: '#3b82f6', icon: '🦈',
    terrain: '🌊',
    segments: ['Shark Week Special'],
  },
];

// Paths connecting zones [fromId, toId]
const PATHS = [
  ['combat', 'lore'],
  ['lore', 'exploration'],
  ['exploration', 'community'],
  ['community', 'chaos'],
  ['community', 'shark'],
  ['combat', 'chaos'],
  ['lore', 'community'],
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

  const [hoveredZone, setHoveredZone] = useState(null);
  const zoneMap = Object.fromEntries(ZONES.map(z => [z.id, z]));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden border-2 border-amber-800/50"
        style={{ maxHeight: '90vh' }}
      >
        {/* Parchment header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-amber-900/40"
          style={{ background: 'linear-gradient(135deg, #1a0f00, #2d1a00)' }}>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>
              The Realm of HME
            </h2>
            <span className="text-xs text-amber-700 ml-2 font-mono">— {quests.length} active quests —</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-amber-700 hover:text-amber-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map */}
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '58%' }}>
          {/* Parchment background */}
          <div className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, #2a1a05 0%, #1a1000 40%, #0d0800 100%)',
            }}
          >
            {/* Parchment texture overlay */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            />

            {/* SVG layer: terrain shapes + roads */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Water body at bottom */}
              <ellipse cx="55" cy="92" rx="30" ry="12" fill="rgba(30,58,138,0.25)" />
              <ellipse cx="55" cy="93" rx="28" ry="10" fill="rgba(30,64,175,0.15)" />

              {/* Mountain range top-left */}
              <polygon points="8,22 14,10 20,22" fill="rgba(120,83,19,0.2)" />
              <polygon points="15,24 22,12 29,24" fill="rgba(120,83,19,0.18)" />
              <polygon points="12,25 17,15 22,25" fill="rgba(92,60,14,0.15)" />

              {/* Forest area center */}
              <ellipse cx="40" cy="50" rx="12" ry="8" fill="rgba(22,101,52,0.12)" />

              {/* Roads connecting zones */}
              {PATHS.map(([fromId, toId]) => {
                const from = zoneMap[fromId];
                const to = zoneMap[toId];
                if (!from || !to) return null;
                return (
                  <line
                    key={`${fromId}-${toId}`}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke="rgba(180,130,50,0.3)"
                    strokeWidth="0.6"
                    strokeDasharray="1.5,1"
                  />
                );
              })}
            </svg>

            {/* Decorative text labels */}
            <div className="absolute" style={{ left: '5%', top: '8%' }}>
              <span className="text-[8px] text-amber-900/60 font-mono tracking-widest uppercase">Northern Wastes</span>
            </div>
            <div className="absolute" style={{ right: '5%', top: '5%' }}>
              <span className="text-[8px] text-amber-900/60 font-mono tracking-widest uppercase">Eastern Kingdoms</span>
            </div>
            <div className="absolute" style={{ left: '8%', bottom: '12%' }}>
              <span className="text-[8px] text-amber-900/60 font-mono tracking-widest uppercase">The Dark Moors</span>
            </div>
            <div className="absolute" style={{ right: '6%', bottom: '10%' }}>
              <span className="text-[8px] text-cyan-900/50 font-mono tracking-widest uppercase">The Deep Sea</span>
            </div>

            {/* Zone nodes */}
            {ZONES.map(zone => {
              const count = questsByZone[zone.id]?.length || 0;
              const isHovered = hoveredZone === zone.id;

              return (
                <div
                  key={zone.id}
                  className="absolute cursor-pointer"
                  style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)' }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  {/* Glow pulse for zones with quests */}
                  {count > 0 && (
                    <motion.div
                      className="absolute rounded-full pointer-events-none"
                      style={{ inset: '-6px', backgroundColor: zone.color, opacity: 0.15, filter: 'blur(6px)' }}
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                  )}

                  {/* Location marker */}
                  <motion.div
                    animate={{ scale: isHovered ? 1.25 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="relative flex flex-col items-center gap-0.5"
                  >
                    {/* Icon pin */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base border-2 shadow-xl"
                      style={{
                        backgroundColor: `${zone.color}18`,
                        borderColor: zone.color,
                        boxShadow: `0 0 ${isHovered ? 18 : 8}px ${zone.color}50`,
                      }}
                    >
                      {zone.icon}
                    </div>

                    {/* Quest count badge */}
                    {count > 0 && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-black"
                        style={{ backgroundColor: zone.color }}
                      >
                        {count}
                      </div>
                    )}

                    {/* Location name label */}
                    <div className="text-center pointer-events-none mt-0.5">
                      <span
                        className="text-[10px] font-bold leading-tight block whitespace-nowrap px-1 py-0.5 rounded"
                        style={{
                          color: zone.color,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          textShadow: `0 0 8px ${zone.color}80`,
                          fontFamily: "'Caveat', cursive",
                          fontSize: '11px',
                        }}
                      >
                        {zone.label}
                      </span>
                    </div>
                  </motion.div>

                  {/* Hover tooltip with quests */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-3 rounded-xl border text-xs shadow-2xl"
                        style={{ backgroundColor: '#100800', borderColor: zone.color + '70', boxShadow: `0 4px 24px ${zone.color}30` }}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <span>{zone.icon}</span>
                          <p className="font-black text-sm" style={{ color: zone.color, fontFamily: "'Caveat', cursive" }}>
                            {zone.label}
                          </p>
                        </div>
                        <p className="text-amber-800/80 text-[9px] italic mb-2">{zone.sublabel}</p>
                        {count === 0 ? (
                          <p className="text-stone-600 italic">No quests in this region yet…</p>
                        ) : (
                          <ul className="space-y-1">
                            {questsByZone[zone.id].slice(0, 5).map(q => (
                              <li key={q.id} className="text-stone-300 truncate flex items-center gap-1.5">
                                <span className="shrink-0 text-[8px]" style={{ color: zone.color }}>▶</span>
                                <span className="truncate">{q.title}</span>
                              </li>
                            ))}
                            {count > 5 && (
                              <li className="text-stone-600 italic text-[9px]">+{count - 5} more quests…</li>
                            )}
                          </ul>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Map cartography credit */}
            <div className="absolute bottom-2 right-3 text-[8px] font-mono tracking-widest uppercase"
              style={{ color: 'rgba(180,120,30,0.3)' }}>
              Cartography Dept. · The Realm of HME
            </div>

            {/* Compass rose */}
            <div className="absolute top-3 right-4 text-2xl opacity-20 select-none">🧭</div>
          </div>
        </div>

        {/* Legend footer */}
        <div className="px-5 py-3 border-t border-amber-900/40 flex flex-wrap gap-x-4 gap-y-1.5"
          style={{ background: 'linear-gradient(135deg, #1a0f00, #2d1a00)' }}>
          {ZONES.map(z => (
            <div key={z.id} className="flex items-center gap-1.5 text-[10px]">
              <span>{z.icon}</span>
              <span style={{ color: z.color }}>{z.label}</span>
              {questsByZone[z.id]?.length > 0 && (
                <span className="text-amber-800">({questsByZone[z.id].length})</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}