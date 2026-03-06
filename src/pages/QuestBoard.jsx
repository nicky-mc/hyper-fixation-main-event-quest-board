import { useState, useEffect } from 'react';
import { Plus, Scroll, Crown, Swords, Loader2, Fish, Radio, Star, Settings, ArrowUpDown, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import QuestCard from '@/components/QuestCard';
import QuestSubmissionDrawer from '@/components/QuestSubmissionDrawer';
import NotificationBell from '@/components/NotificationBell';
import HostSettingsModal from '@/components/HostSettingsModal';
import QuestCategoryFilter, { CATEGORIES, filterQuestsByCategory } from '@/components/QuestCategoryFilter';
import QuestWorldMap from '@/components/QuestWorldMap';
import RKOButton from '@/components/RKOButton';

// Floating particle component for atmosphere
function Particle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
    />
  );
}

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  style: {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: Math.random() > 0.5 ? '2px' : '4px',
    height: Math.random() > 0.5 ? '2px' : '4px',
    background: ['#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#22c55e'][Math.floor(Math.random() * 5)],
  }
}));

export default function QuestBoard() {
  const [quests, setQuests] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rollingId, setRollingId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortByVotes, setSortByVotes] = useState(false);
  const [voteCounts, setVoteCounts] = useState({});
  const [user, setUser] = useState(null);

  const loadQuests = async () => {
    const data = await base44.entities.Quest.list('-created_date', 50);
    setQuests(data);
    setLoading(false);
  };

  const loadVoteCounts = async (questList) => {
    const allVotes = await base44.entities.QuestVote.list();
    const counts = {};
    allVotes.forEach(v => { counts[v.quest_id] = (counts[v.quest_id] || 0) + 1; });
    setVoteCounts(counts);
  };

  useEffect(() => {
    loadQuests();
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    if (quests.length > 0) loadVoteCounts(quests);
  }, [quests]);

  // Re-sort when vote counts change if sort is active
  const displayedQuests = sortByVotes
    ? [...quests].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
    : quests;

  const rollForInitiative = async () => {
    if (quests.length === 0 || isRolling) return;
    setIsRolling(true);
    setSelectedQuestId(null);

    const rollDuration = 2000;
    const flickerInterval = 120;
    let elapsed = 0;

    const timer = setInterval(() => {
      const ri = Math.floor(Math.random() * quests.length);
      setRollingId(quests[ri].id);
      elapsed += flickerInterval;
      if (elapsed >= rollDuration) {
        clearInterval(timer);
        const fi = Math.floor(Math.random() * quests.length);
        const selected = quests[fi];
        setRollingId(null);
        setSelectedQuestId(selected.id);
        setIsRolling(false);
        base44.entities.Quest.update(selected.id, { status: 'selected' });
      }
    }, flickerInterval);
  };

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}
    >
      {/* Atmospheric background layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Starfield */}
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* WWE Ring spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
        {/* Horror red tinge */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-red-900/10 blur-3xl" />
        {/* Trek LCARS blue */}
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-blue-900/10 blur-3xl" />
        {/* Shark water shimmer */}
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-900/8 blur-2xl" />
        {/* Floating particles */}
        {particles.map(p => <Particle key={p.id} style={p.style} />)}
      </div>

      {/* LCARS-style decorative side bars */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-60" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── TOP BAR ── */}
        <div className="flex justify-end gap-2 mb-4">
          <NotificationBell />
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 rounded-xl border-2 border-purple-700/40 bg-purple-900/30 text-purple-400 hover:border-purple-500 hover:text-purple-300 transition-all"
            title="Host notification settings"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>

      {/* ── HEADER ── */}
        <motion.header initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 sm:mb-14">

          {/* Top badge row */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 flex-wrap">
            <span className="text-cyan-500/70 text-[10px] tracking-[0.4em] font-mono uppercase border border-cyan-900/50 px-2 py-0.5 rounded">
              STARDATE 2026.02
            </span>
            <span className="text-red-500/70 text-[10px] tracking-[0.4em] font-mono uppercase border border-red-900/50 px-2 py-0.5 rounded">
              🦈 SHARK ALERT
            </span>
            <span className="text-amber-500/70 text-[10px] tracking-[0.4em] font-mono uppercase border border-amber-900/50 px-2 py-0.5 rounded">
              NAT 20 ZONE
            </span>
          </div>

          {/* Main title */}
          <div className="relative inline-block">
            <motion.h1
              animate={{ textShadow: ['0 0 20px rgba(251,191,36,0.3)', '0 0 50px rgba(251,191,36,0.6)', '0 0 20px rgba(251,191,36,0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-600 leading-tight"
              style={{ fontFamily: "'Caveat', 'Segoe Script', cursive" }}
            >
              The Hyper-fixation
            </motion.h1>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60" />
              <span className="text-red-500 text-lg font-black tracking-[0.3em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                ⚔️ MAIN EVENT ⚔️
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60" />
            </div>
            <p className="text-3xl font-bold text-purple-300/80 mt-1" style={{ fontFamily: "'Caveat', cursive" }}>
              Quest Board
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base mt-4 leading-relaxed">
            Hosted by <span className="text-purple-300 font-semibold">Nicky</span> (Captain / Bard-Sorcerer) &amp; <span className="text-pink-300 font-semibold">Charlotte</span> (Tactical Geek Princess / Barbarian-Druid).
            <br className="hidden sm:block" />
            Submit your Side Quests — they'll Roll for Initiative to pick what's next on air!
          </p>

          {/* Host stat bars */}
          <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
            {[
              { name: 'Nicky', role: 'ADHD · Gifted · Trans', color: 'from-purple-600 to-violet-400', stat: 'Hyper-focus: 110%' },
              { name: 'Charlotte', role: 'AuDHD · Tactical Analyst', color: 'from-pink-600 to-rose-400', stat: 'Shark Facts: ∞' },
            ].map(h => (
              <div key={h.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <div className={cn("w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-black text-white shrink-0", h.color)}>
                  {h.name[0]}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">{h.name}</div>
                  <div className="text-[10px] text-slate-500">{h.role} · <span className="text-amber-500">{h.stat}</span></div>
                </div>
              </div>
            ))}
          </div>
        </motion.header>

        {/* ── ACTION BAR ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">

          {/* Roll for Initiative */}
          <motion.button
            onClick={rollForInitiative}
            disabled={quests.length === 0 || isRolling}
            whileHover={{ scale: quests.length === 0 || isRolling ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative px-8 py-4 rounded-xl font-black text-xl text-white disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            style={{
              background: isRolling
                ? 'linear-gradient(135deg, #dc2626, #ea580c, #dc2626)'
                : 'linear-gradient(135deg, #b91c1c, #c2410c)',
              border: '2px solid rgba(239,68,68,0.6)',
              boxShadow: '0 0 30px rgba(239,68,68,0.3), 0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            {isRolling && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="absolute -inset-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 rounded-xl blur-md -z-10"
              />
            )}
            <span className="flex items-center gap-3" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.6rem' }}>
              {isRolling
                ? <><Loader2 className="w-6 h-6 animate-spin" /> Rolling Initiative...</>
                : <><Swords className="w-6 h-6" /> Roll for Initiative!</>
              }
            </span>
          </motion.button>

          <Button onClick={() => setIsDrawerOpen(true)}
            className="px-6 py-5 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 border-2 border-purple-600/50 hover:border-purple-500 text-purple-200 shadow-xl text-xl"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            <Plus className="w-5 h-5 mr-2" /> Post a Quest 🦈
          </Button>

          {user?.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSortByVotes(s => !s)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                sortByVotes
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                  : "bg-purple-900/30 border-purple-700/40 text-purple-400 hover:border-purple-500"
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortByVotes ? "Sorted by Votes" : "Sort by Votes"}
            </motion.button>
          )}
        </motion.div>

        {/* ── QUEST GRID ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Radio className="w-12 h-12 text-purple-500 animate-pulse" />
            <span className="text-purple-400/70 font-mono text-sm">SCANNING FOR QUESTS...</span>
          </div>
        ) : quests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-purple-950/30 border-2 border-purple-800/30 flex items-center justify-center mb-6">
              <Fish className="w-10 h-10 text-cyan-700/50" />
            </div>
            <h3 className="text-3xl text-purple-300/70 mb-2" style={{ fontFamily: "'Caveat', cursive" }}>
              The Board Awaits, Adventurer...
            </h3>
            <p className="text-slate-600 max-w-md text-sm">
              No quests posted yet. Even the sharks are waiting. Be the first!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayedQuests.map((quest, i) => (
              <QuestCard key={quest.id} quest={quest} index={i}
                isSelected={selectedQuestId === quest.id && !isRolling}
                isRolling={isRolling && rollingId === quest.id}
              />
            ))}
          </div>
        )}

        {/* ── SELECTED ANNOUNCEMENT ── */}
        <AnimatePresence>
          {selectedQuestId && !isRolling && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }} className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-amber-500/50"
                style={{ background: 'linear-gradient(135deg, rgba(120,53,15,0.3), rgba(13,8,32,0.8))' }}>
                <Crown className="w-6 h-6 text-amber-400" />
                <span className="text-xl text-amber-200 font-bold" style={{ fontFamily: "'Caveat', cursive" }}>
                  Quest locked in for the episode! Nicky & Charlotte are on the case. 🦈⚔️
                </span>
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SEGMENT LEGEND ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-16 border border-purple-900/40 rounded-xl p-5 bg-white/[0.02]">
          <h3 className="text-center text-purple-300/60 text-xs tracking-[0.4em] uppercase font-mono mb-4">
            — EPISODE SEGMENT MAP —
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px]">
            {[
              ['⚡ The Gimmick Check', 'Identity & Arcs'],
              ['🛠️ Patch Notes', 'Life Updates'],
              ['🔭 World Building', 'Trope Analysis'],
              ['🎲 Roll Initiative', 'Real Challenges'],
              ['🔥 Main Event', 'Apex Obsession'],
              ['🦈 Shark Week', "Charlotte's Domain"],
              ['💀 Jump Scares', 'Horror & Nat 1s'],
              ['🖖 Holodeck', 'Trek/Sci-Fi Chaos'],
              ['🔄 The Respec', 'Changed Minds'],
              ['✨ Loot Drop', 'Listener Mail'],
              ['📋 Char Sheets', 'Alignment Votes'],
              ['🚀 Captain\'s Log', 'Stardate Report'],
            ].map(([name, desc]) => (
              <div key={name} className="flex flex-col gap-0.5 px-2 py-1.5 rounded bg-white/[0.03] border border-white/5">
                <span className="text-purple-200/70 font-medium truncate">{name}</span>
                <span className="text-slate-600 truncate">{desc}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <span className="text-slate-700 text-xs font-mono tracking-widest">
            ⚔️ THE HYPER-FIXATION MAIN EVENT · CO-OP MODE ACTIVE · 🦈 SHARKS DETECTED 🦈
          </span>
        </div>
      </div>

      <QuestSubmissionDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onQuestSubmitted={loadQuests} />
      <HostSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// helper used in this file
function cn(...classes) { return classes.filter(Boolean).join(' '); }