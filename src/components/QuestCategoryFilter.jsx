import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Swords, BookOpen, Compass, Laugh, Fish, Zap, Star, Grid3X3 } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all',         label: 'All Quests',    icon: Grid3X3,  color: 'text-purple-400',  active: 'bg-purple-800/50 border-purple-500/70 text-purple-200',
    segments: [] },
  { id: 'combat',      label: 'Combat',        icon: Swords,   color: 'text-red-400',     active: 'bg-red-900/40 border-red-500/70 text-red-200',
    segments: ['Roll for Initiative', 'Heel Turn', 'The Dark Match'] },
  { id: 'lore',        label: 'Lore & Story',  icon: BookOpen, color: 'text-amber-400',   active: 'bg-amber-900/30 border-amber-500/70 text-amber-200',
    segments: ['World Building', 'Heart of the Story', 'The Main Quest', 'The Hyper-fixation Main Event', 'Character Sheets'] },
  { id: 'exploration', label: 'Exploration',   icon: Compass,  color: 'text-cyan-400',    active: 'bg-cyan-900/30 border-cyan-500/70 text-cyan-200',
    segments: ["Captain's Log", 'Glitches in the Holodeck', 'Patch Notes', 'The Tavern Entry'] },
  { id: 'community',   label: 'Community',     icon: Star,     color: 'text-green-400',   active: 'bg-green-900/30 border-green-500/70 text-green-200',
    segments: ['The Loot Drop', 'The Co-Op Club', 'The Respec', 'The Gimmick Check'] },
  { id: 'chaos',       label: 'Chaos & Laughs',icon: Laugh,    color: 'text-orange-400',  active: 'bg-orange-900/30 border-orange-500/70 text-orange-200',
    segments: ['Critical Fails & Jump Scares'] },
  { id: 'shark',       label: 'Shark Week',    icon: Fish,     color: 'text-blue-400',    active: 'bg-blue-900/30 border-blue-500/70 text-blue-200',
    segments: ['Shark Week Special'] },
  { id: 'identity',    label: 'Identity',      icon: Zap,      color: 'text-fuchsia-400', active: 'bg-fuchsia-900/30 border-fuchsia-500/70 text-fuchsia-200',
    segments: ['The Gimmick Check'] },
];

export function filterQuestsByCategory(quests, categoryId) {
  if (categoryId === 'all') return quests;
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return quests;
  return quests.filter(q => cat.segments.includes(q.segment));
}

export default function QuestCategoryFilter({ active, onChange, counts }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const isActive = active === cat.id;
        const count = cat.id === 'all' ? counts.total : (counts[cat.id] ?? 0);
        return (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onChange(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200",
              isActive
                ? cat.active
                : `border-purple-900/40 bg-purple-950/30 ${cat.color} hover:border-purple-700/60`
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat.label}
            {count > 0 && (
              <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black",
                isActive ? "bg-white/20" : "bg-purple-900/60 text-purple-400")}>
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}