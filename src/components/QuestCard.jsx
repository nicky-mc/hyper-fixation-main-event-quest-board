import { MessageCircle, Trash2, Sword, Shield, Scroll, Star, Flame, Zap, Radio, Skull, Fish, Telescope, BookOpen, Dices, Trophy, Anchor, Ghost, Tv, RotateCcw, Users, Heart } from 'lucide-react';
// (segment config inlined below)
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import VoteButton from '@/components/VoteButton';
import SaveQuestButton from '@/components/SaveQuestButton';
import QuestDetailModal from '@/components/QuestDetailModal';

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

// Warp-speed streaks overlay
function WarpEffect() {
  return (
    <motion.div
      className="absolute inset-0 z-20 overflow-hidden rounded-xl pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.8, times: [0, 0.1, 0.7, 1] }}
    >
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400 to-white"
          style={{ originX: 0, originY: 0, rotate: `${(i / 18) * 360}deg`, width: `${40 + Math.random() * 80}%` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, delay: i * 0.015 }}
        />
      ))}
      <motion.div
        className="absolute inset-0 bg-cyan-400/20 rounded-xl"
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}

// WWE taunt flash
function TauntEffect() {
  return (
    <AnimatePresence>
      <motion.div className="absolute inset-0 z-20 pointer-events-none rounded-xl overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% -20%, rgba(255,200,0,0.35) 0%, transparent 70%)' }}
          animate={{ opacity: [0, 1, 0.6, 0], y: ['-100%', '0%', '10%', '100%'] }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
        {[-1, 1].map(dir => (
          <motion.div
            key={dir}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-amber-400/0 to-amber-400/20"
            style={{ left: dir === -1 ? 0 : undefined, right: dir === 1 ? 0 : undefined }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        ))}
        <motion.div
          className="absolute inset-0 rounded-xl border-4 border-amber-400"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.05, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default function QuestCard({ quest, isSelected, isRolling, index, currentUser, onDeleted, commentCount = 0 }) {
  const cfg = segmentConfig[quest.segment] || fallback;
  const SegmentIcon = cfg.icon;

  const [showWarp, setShowWarp] = useState(false);
  const [showTaunt, setShowTaunt] = useState(false);
  const [settled, setSettled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.email === quest.created_by);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this quest?')) return;
    await base44.entities.Quest.delete(quest.id);
    onDeleted?.();
  };

  useEffect(() => {
    if (isSelected) {
      setSettled(false);
      setShowWarp(true);
      setTimeout(() => {
        setShowWarp(false);
        setShowTaunt(true);
        setTimeout(() => {
          setShowTaunt(false);
          setSettled(true);
        }, 900);
      }, 800);
    } else {
      setSettled(false);
      setShowWarp(false);
      setShowTaunt(false);
    }
  }, [isSelected]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isSelected && settled ? 1.04 : 1,
          rotate: isSelected && settled ? [-1, 1, -0.5, 0] : 0,
        }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className={cn("relative group transition-all duration-500", isSelected && "z-10")}
      >
        {/* Gold glow when selected + settled */}
        {isSelected && settled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-xl blur-lg"
          />
        )}

        {/* Wrestling spotlight during taunt */}
        {isSelected && !settled && (
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 0.25, repeat: Infinity }}
            className="absolute -inset-3 rounded-2xl blur-xl"
            style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.5) 0%, transparent 70%)' }}
          />
        )}

        {/* Rolling flicker glow */}
        {isRolling && (
          <motion.div
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.08, 1] }}
            transition={{ duration: 0.35, repeat: Infinity }}
            className="absolute -inset-1 bg-gradient-to-r from-red-500/60 to-amber-500/60 rounded-xl blur-sm"
          />
        )}

        {/* Card */}
        <div
          onClick={() => setShowModal(true)}
          className={cn(
            "relative overflow-hidden rounded-xl border-2 transition-all duration-300 h-full cursor-pointer",
            "bg-gradient-to-br from-[#0d0d1a] via-[#12101e] to-[#0a0e18]",
            isSelected
              ? "border-amber-400 shadow-2xl shadow-amber-500/40"
              : "border-purple-900/50 hover:border-purple-600/70",
          )}
        >
          {/* Effects overlays */}
          {showWarp && <WarpEffect />}
          {showTaunt && <TauntEffect />}

          {/* Starfield texture */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
          />
          {/* Horror vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-purple-950/20 pointer-events-none" />

          {/* Segment Banner */}
          <div className={cn("relative px-4 py-2 bg-gradient-to-r", cfg.color)}>
            <div className="flex items-center gap-2">
              <SegmentIcon className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <span className="text-[10px] font-bold text-white tracking-widest uppercase truncate">{quest.segment}</span>
            </div>
            <p className="text-[9px] text-white/60 mt-0.5 truncate">{cfg.label}</p>
          </div>

          {/* Quest image/GIF if present */}
          {quest.image_url && (
            <div className="w-full h-32 overflow-hidden border-b border-purple-900/40">
              <img src={quest.image_url} alt="quest visual" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Body */}
          <div className="relative p-4 space-y-3">
            {/* Title */}
            <h3 className={cn(
              "text-xl font-bold leading-snug transition-colors",
              isSelected ? "text-amber-300" : "text-purple-100"
            )} style={{ fontFamily: "'Caveat', 'Segoe Script', cursive", fontSize: '1.35rem' }}>
              {quest.title}
            </h3>

            {/* Quest Giver + actions row */}
            <div className="flex items-center gap-2 pt-2 border-t border-purple-900/40" onClick={e => e.stopPropagation()}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center border text-xs font-black shrink-0",
                "bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-600/50 text-purple-200"
              )}>
                {quest.quest_giver.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-purple-200/80 truncate flex-1" style={{ fontFamily: "'Caveat', cursive" }}>
                {quest.quest_giver}
              </span>
              <VoteButton questId={quest.id} isSelected={isSelected} />
              {commentCount > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-900/40 border border-purple-800/40 shrink-0">
                  <MessageCircle className="w-3 h-3 text-purple-500" />
                  <span className="text-[10px] text-purple-400 font-bold">{commentCount}</span>
                </div>
              )}
              <div className={cn(
                "w-8 h-8 rounded-full flex flex-col items-center justify-center shrink-0",
                "bg-gradient-to-br from-[#1a1040] to-[#0d0820] border",
                isSelected ? "border-amber-400" : "border-purple-700/70"
              )}>
                <span className="text-[7px] text-purple-400/80 font-bold -mb-0.5">DC</span>
                <span className={cn("text-sm font-black leading-none", isSelected ? "text-amber-400" : "text-purple-300")}
                  style={{ fontFamily: 'Georgia, serif' }}>
                  {quest.difficulty_class}
                </span>
              </div>
              {canEdit && (
                <button onClick={handleDelete} title="Delete quest"
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Selected stamp */}
          {isSelected && settled && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: -12 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
              className="absolute top-16 right-4 pointer-events-none"
            >
              <div className="bg-amber-400 text-stone-900 px-3 py-1 rounded border-4 border-amber-600 font-black text-xs shadow-2xl uppercase tracking-wider">
                ⚔️ ON AIR!
              </div>
            </motion.div>
          )}

          {/* Click hint footer */}
          <div className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 text-[10px] text-purple-700 border-t border-purple-900/40 group-hover:text-purple-500 transition-colors">
            <MessageCircle className="w-3 h-3" />
            View details & discussion
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <QuestDetailModal
            quest={quest}
            currentUser={currentUser}
            onClose={() => setShowModal(false)}
            onDeleted={() => { setShowModal(false); onDeleted?.(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}