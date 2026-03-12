import { X, Sword, Shield, Scroll, Star, Flame, Zap, Radio, Skull, Fish, Telescope, BookOpen, Dices, Trophy, Anchor, Ghost, Tv, RotateCcw, Users, Heart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import VoteButton from '@/components/VoteButton';
import SaveQuestButton from '@/components/SaveQuestButton';
import QuestComments from '@/components/QuestComments';
import { base44 } from '@/api/base44Client';

const ADMIN_EMAILS = ['charlotte_cowles@yahoo.co.uk', 'nicky.mortoza-cowles@techeducators.co.uk'];

const segmentConfig = {
  'The Gimmick Check':            { icon: Zap,        color: 'from-amber-600 to-yellow-500' },
  'Patch Notes':                  { icon: Radio,      color: 'from-cyan-700 to-teal-500' },
  'World Building':               { icon: Telescope,  color: 'from-indigo-700 to-violet-500' },
  'Roll for Initiative':          { icon: Dices,      color: 'from-red-700 to-orange-500' },
  'The Tavern Entry':             { icon: Trophy,     color: 'from-amber-800 to-yellow-600' },
  'The Main Quest':               { icon: Sword,      color: 'from-red-800 to-red-500' },
  'Heart of the Story':           { icon: Heart,      color: 'from-rose-700 to-pink-500' },
  'The Loot Drop':                { icon: Star,       color: 'from-emerald-700 to-teal-500' },
  'The Respec':                   { icon: RotateCcw,  color: 'from-purple-700 to-violet-500' },
  'Glitches in the Holodeck':     { icon: Tv,         color: 'from-blue-700 to-cyan-500' },
  'Critical Fails & Jump Scares': { icon: Skull,      color: 'from-stone-700 to-red-900' },
  'The Hyper-fixation Main Event':{ icon: Flame,      color: 'from-orange-700 to-amber-500' },
  'The Dark Match':               { icon: Ghost,      color: 'from-slate-700 to-stone-500' },
  'Heel Turn':                    { icon: Shield,     color: 'from-rose-800 to-red-600' },
  'The Co-Op Club':               { icon: Users,      color: 'from-lime-700 to-green-500' },
  'Character Sheets':             { icon: BookOpen,   color: 'from-fuchsia-700 to-purple-500' },
  'Shark Week Special':           { icon: Fish,       color: 'from-blue-800 to-indigo-600' },
  "Captain's Log":                { icon: Anchor,     color: 'from-sky-700 to-blue-600' },
};
const fallback = { icon: Scroll, color: 'from-stone-600 to-stone-500' };

export default function QuestDetailModal({ quest, onClose, currentUser, onDeleted }) {
  const cfg = segmentConfig[quest.segment] || fallback;
  const SegmentIcon = cfg.icon;

  const canEdit = currentUser && (
    currentUser.role === 'admin' ||
    ADMIN_EMAILS.includes(currentUser.email) ||
    currentUser.email === quest.created_by
  );

  const handleDelete = async () => {
    if (!window.confirm('Delete this quest?')) return;
    await base44.entities.Quest.delete(quest.id);
    onDeleted?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border-2 border-purple-800/60 overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0d0d1a, #0f0d22)', maxHeight: '90vh' }}
      >
        {/* Segment header */}
        <div className={cn("px-5 py-3 bg-gradient-to-r shrink-0", cfg.color, "flex items-center justify-between")}>
          <div className="flex items-center gap-2">
            <SegmentIcon className="w-4 h-4 text-white/90" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">{quest.segment}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        {quest.image_url && (
          <div className="w-full h-48 overflow-hidden shrink-0">
            <img src={quest.image_url} alt="quest" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-3xl font-black text-amber-300 leading-tight" style={{ fontFamily: "'Caveat', cursive" }}>
              {quest.title}
            </h2>
            <div className="shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1040] to-[#0d0820] border-2 border-purple-700/70">
              <span className="text-[9px] text-purple-400/80 font-bold tracking-widest">DC</span>
              <span className="text-xl font-black text-purple-300" style={{ fontFamily: 'Georgia, serif' }}>{quest.difficulty_class}</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{quest.description}</p>

          {/* Quest giver */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-600/50 flex items-center justify-center text-xs font-black text-purple-200">
              {quest.quest_giver.charAt(0).toUpperCase()}
            </div>
            <span className="text-purple-400/70 text-xs">Quest Giver:</span>
            <span className="text-purple-200 font-semibold" style={{ fontFamily: "'Caveat', cursive" }}>{quest.quest_giver}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-purple-900/40">
            <VoteButton questId={quest.id} />
            <SaveQuestButton questId={quest.id} />
            {canEdit && (
              <button onClick={handleDelete}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-900/20 border border-red-900/30 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="pt-2 border-t border-purple-900/40">
            <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold mb-3">Discussion</p>
            <QuestComments questId={quest.id} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}