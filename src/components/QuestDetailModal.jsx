import { X, Trash2, MessageCircle, CheckCircle, Sword, Shield, Scroll, Star, Flame, Zap, Radio, Skull, Fish, Telescope, BookOpen, Dices, Trophy, Anchor, Ghost, Tv, RotateCcw, Users, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import QuestComments from '@/components/QuestComments';
import VoteButton from '@/components/VoteButton';
import SaveQuestButton from '@/components/SaveQuestButton';

const segmentConfig = {
  'The Gimmick Check':            { icon: Zap,        color: 'from-amber-600 to-yellow-500',    label: 'Identity & Character Arcs' },
  'Patch Notes':                  { icon: Radio,      color: 'from-cyan-700 to-teal-500',       label: 'Life Updates & Milestones' },
  'World Building':               { icon: Telescope,  color: 'from-indigo-700 to-violet-500',   label: 'Trope Analysis' },
  'Roll for Initiative':          { icon: Dices,      color: 'from-red-700 to-orange-500',      label: 'Real Life Challenges' },
  'The Tavern Entry':             { icon: Trophy,     color: 'from-amber-800 to-yellow-600',    label: 'Show Opener' },
  'The Main Quest':               { icon: Sword,      color: 'from-red-800 to-red-500',         label: 'Primary Topic' },
  'Heart of the Story':           { icon: Heart,      color: 'from-rose-700 to-pink-500',       label: 'Personal Connection' },
  'The Loot Drop':                { icon: Star,       color: 'from-emerald-700 to-teal-500',    label: 'Listener Mail & Sign-Off' },
  'The Respec':                   { icon: RotateCcw,  color: 'from-purple-700 to-violet-500',   label: 'Changed Our Minds' },
  'Glitches in the Holodeck':     { icon: Tv,         color: 'from-blue-700 to-cyan-500',       label: 'Star Trek / Sci-Fi Chaos' },
  'Critical Fails & Jump Scares': { icon: Skull,      color: 'from-stone-700 to-red-900',       label: 'Horror & Nat 1 Moments' },
  'The Hyper-fixation Main Event':{ icon: Flame,      color: 'from-orange-700 to-amber-500',    label: 'Apex Obsession Mode' },
  'The Dark Match':               { icon: Ghost,      color: 'from-slate-700 to-stone-500',     label: 'Underrated Picks' },
  'Heel Turn':                    { icon: Shield,     color: 'from-rose-800 to-red-600',        label: 'Controversial Takes' },
  'The Co-Op Club':               { icon: Users,      color: 'from-lime-700 to-green-500',      label: 'Community Activity' },
  'Character Sheets':             { icon: BookOpen,   color: 'from-fuchsia-700 to-purple-500',  label: 'Alignment Votes' },
  'Shark Week Special':           { icon: Fish,       color: 'from-blue-800 to-indigo-600',     label: '🦈 Watch Out!' },
  "Captain's Log":                { icon: Anchor,     color: 'from-sky-700 to-blue-600',        label: 'Stardate Report' },
};
const fallback = { icon: Scroll, color: 'from-stone-600 to-stone-500', label: 'Side Quest' };

export default function QuestDetailModal({ quest, currentUser, onClose, onDeleted }) {
  const cfg = segmentConfig[quest.segment] || fallback;
  const SegmentIcon = cfg.icon;
  const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.email === quest.created_by);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleDelete = async () => {
    if (!window.confirm('Delete this quest?')) return;
    await base44.entities.Quest.delete(quest.id);
    onDeleted?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 pb-12 px-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border-2 border-purple-700/60 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0d0d1a, #0f0d22)' }}
      >
        {/* Segment banner */}
        <div className={cn("px-5 py-3 bg-gradient-to-r flex items-center justify-between sticky top-0 z-10", cfg.color)}>
          <div className="flex items-center gap-2 min-w-0">
            <SegmentIcon className="w-4 h-4 text-white/90 shrink-0" />
            <span className="text-xs font-bold text-white tracking-widest uppercase truncate">{quest.segment}</span>
            <span className="text-[10px] text-white/60 ml-1 hidden sm:block truncate">{cfg.label}</span>
          </div>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white transition-colors shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        {quest.image_url && (
          <div className="w-full h-52 overflow-hidden">
            <img src={quest.image_url} alt="quest" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Title + DC */}
          <div className="flex items-start gap-4">
            <h2 className="flex-1 text-3xl font-black text-amber-300 leading-tight">
              {quest.title}
            </h2>
            <div className="w-14 h-14 rounded-full shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1040] to-[#0d0820] border-2 border-purple-700/70 shadow-lg">
              <span className="text-[9px] text-purple-400/80 font-bold -mb-0.5 tracking-widest">DC</span>
              <span className="text-xl font-black text-purple-300">
                {quest.difficulty_class}
              </span>
            </div>
          </div>

          {/* Status badge */}
          {quest.status === 'completed' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 w-fit">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Chosen for Episode ⚔️</span>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">{quest.description}</p>

          {/* Quest giver + actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-purple-900/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-600/50 flex items-center justify-center text-sm font-black text-purple-200 shrink-0">
              {quest.quest_giver.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-purple-600/70 block">Quest Giver</span>
              <span className="text-sm font-medium text-purple-200 truncate block">
                {quest.quest_giver}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VoteButton questId={quest.id} />
              <SaveQuestButton questId={quest.id} />
              {canEdit && (
                <button onClick={handleDelete}
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="border-t border-purple-900/40 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Discussion</span>
            </div>
            <QuestComments questId={quest.id} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}