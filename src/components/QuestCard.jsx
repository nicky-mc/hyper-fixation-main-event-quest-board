import { MessageCircle, Trash2, Sword, Shield, Scroll, Star, Flame, Zap, Radio, Skull, Fish, Telescope, BookOpen, Dices, Trophy, Anchor, Ghost, Tv, RotateCcw, Users, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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

function WarpEffect() {
  return (
    <motion.div
      className="absolute inset-0 z-20 overflow-hidden rounded-2xl pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.8, times: [0, 0.1, 0.7, 1] }}
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 h-px"
          style={{
            originX: 0, originY: 0,
            rotate: `${(i / 22) * 360}deg`,
            width: `${40 + Math.random() * 80}%`,
            background: `linear-gradient(to right, transparent, ${i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#06b6d4' : '#a855f7'}, white)`,
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, delay: i * 0.015 }}
        />
      ))}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.25) 0%, transparent 70%)' }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}

function TauntEffect() {
  return (
    <AnimatePresence>
      <motion.div className="absolute inset-0 z-20 pointer-events-none rounded-2xl overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% -20%, rgba(255,200,0,0.35) 0%, transparent 70%)' }}
          animate={{ opacity: [0, 1, 0.6, 0], y: ['-100%', '0%', '10%', '100%'] }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-amber-400"
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
  const [hovered, setHovered] = useState(false);

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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, scale: isSelected && settled ? 1.04 : 1 }}
        transition={{ duration: 0.45, delay: index * 0.07 }}
        className={cn("relative group transition-all duration-500", isSelected && "z-10")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Selected gold glow */}
        {isSelected && settled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-2 rounded-2xl blur-xl glow-gold pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.35) 0%, transparent 70%)' }}
          />
        )}

        {/* Hover magical glow */}
        {hovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute -inset-1 rounded-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(168,85,247,0.25) 0%, transparent 70%)', filter: 'blur(8px)' }}
          />
        )}

        {/* Rolling flicker */}
        {isRolling && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.06, 1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            className="absolute -inset-1 rounded-2xl blur-sm pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.5), rgba(251,191,36,0.5))' }}
          />
        )}

        {/* Card */}
        <div
          onClick={() => setShowModal(true)}
          className={cn(
            "relative overflow-hidden rounded-2xl h-full cursor-pointer",
            isSelected ? "border border-amber-400/60" : "border border-amber-400/20 hover:border-amber-400/50",
          )}
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
            transition: 'all 0.5s ease-in-out',
            boxShadow: isSelected
              ? '0 0 0 1px rgba(251,191,36,0.4), 0 20px 60px rgba(0,0,0,0.8), 0 0 50px rgba(251,191,36,0.2)'
              : hovered
              ? '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(168,85,247,0.2), 0 0 0 1px rgba(251,191,36,0.3)'
              : '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.15)',
          }}
        >
          {showWarp && <WarpEffect />}
          {showTaunt && <TauntEffect />}

          {/* Subtle noise overlay for depth */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />

          {/* Segment Banner */}
          <div className={cn("relative px-4 py-2.5 bg-gradient-to-r", cfg.color)}>
            <div className="flex items-center gap-2">
              <SegmentIcon className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <span className="text-[10px] font-bold text-white tracking-widest uppercase truncate font-cinzel">{quest.segment}</span>
            </div>
            <p className="text-[9px] text-white/60 mt-0.5 font-medium">{cfg.label}</p>
          </div>

          {/* Quest image */}
          {quest.image_url && (
            <div className="w-full h-32 overflow-hidden border-b border-white/5">
              <img src={quest.image_url} alt="quest visual" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Body */}
          <div className="relative p-4 space-y-3">
            <h3 className={cn(
              "leading-snug transition-colors font-cinzel font-bold",
              isSelected ? "text-amber-300" : "text-white/90 group-hover:text-purple-100"
            )} style={{ fontSize: '1.1rem' }}>
              {quest.title}
            </h3>

            {/* Quest giver row */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-white/5" onClick={e => e.stopPropagation()}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.8), rgba(30,27,75,0.9))', borderColor: 'rgba(168,85,247,0.35)' }}>
                <span className="text-purple-200">{quest.quest_giver.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-purple-300/80 truncate flex-1 font-cinzel">{quest.quest_giver}</span>

              <VoteButton questId={quest.id} isSelected={isSelected} />

              {commentCount > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
                  style={{ background: 'rgba(88,28,135,0.3)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <MessageCircle className="w-3 h-3 text-purple-500" />
                  <span className="text-[10px] text-purple-400 font-bold">{commentCount}</span>
                </div>
              )}

              {/* DC badge */}
              <div className="w-9 h-9 rounded-full flex flex-col items-center justify-center shrink-0"
                style={{
                  background: isSelected
                    ? 'radial-gradient(circle, rgba(120,53,15,0.9) 0%, rgba(10,5,25,0.95) 100%)'
                    : 'radial-gradient(circle, rgba(30,10,60,0.9) 0%, rgba(10,5,25,0.95) 100%)',
                  border: isSelected ? '1.5px solid rgba(251,191,36,0.6)' : '1.5px solid rgba(168,85,247,0.4)',
                  boxShadow: isSelected ? '0 0 12px rgba(251,191,36,0.3)' : '0 0 8px rgba(168,85,247,0.15)',
                }}>
                <span className="text-[7px] font-bold" style={{ color: isSelected ? '#fbbf24' : '#a78bfa' }}>DC</span>
                <span className="text-sm font-black leading-none font-cinzel" style={{ color: isSelected ? '#fbbf24' : '#c4b5fd' }}>
                  {quest.difficulty_class}
                </span>
              </div>

              {canEdit && (
                <button onClick={handleDelete} title="Delete quest"
                  className="p-1.5 text-slate-700 hover:text-red-400 transition-colors rounded shrink-0">
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
              className="absolute top-16 right-3 pointer-events-none"
            >
              <div className="px-3 py-1 rounded border-2 border-amber-500 font-black text-xs uppercase tracking-wider font-cinzel"
                style={{ background: 'rgba(251,191,36,0.9)', color: '#1a0a00', boxShadow: '0 0 20px rgba(251,191,36,0.6)' }}>
                ⚔️ ON AIR!
              </div>
            </motion.div>
          )}

          {/* Footer hint */}
          <div className="w-full flex items-center justify-center gap-1.5 px-5 py-2 text-[10px] border-t text-slate-600 group-hover:text-purple-500 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
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