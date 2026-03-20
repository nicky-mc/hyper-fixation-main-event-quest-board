import { useState, useEffect, useRef } from 'react';
import { Plus, Scroll, Crown, Swords, Loader2, Fish, Radio, Star, Settings, ArrowUpDown, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import QuestCard from '@/components/QuestCard';
import QuestSubmissionDrawer from '@/components/QuestSubmissionDrawer';

import HostSettingsModal from '@/components/HostSettingsModal';
import QuestCategoryFilter, { CATEGORIES, filterQuestsByCategory } from '@/components/QuestCategoryFilter';
import QuestWorldMap from '@/components/QuestWorldMap';
import RKOButton from '@/components/RKOButton';
import ActivityDrawer from '@/components/ActivityDrawer';
import NextShowBanner from '@/components/NextShowBanner';

// Floating particle component for atmosphere
function Particle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ ...style, willChange: 'opacity, transform' }}
      animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
    />
  );
}

const particles = Array.from({ length: 8 }, (_, i) => ({
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
  const [commentCounts, setCommentCounts] = useState({});
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [mapOpen, setMapOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [targetQuest, setTargetQuest] = useState(null);
  const [allVotes, setAllVotes] = useState([]);
  const [currentAdventurerId, setCurrentAdventurerId] = useState(null);

  const isAdmin = user?.role === 'admin';

  const loadQuests = async () => {
    const data = await base44.entities.Quest.list('-created_date', 100);
    setQuests(data);
    setLoading(false);
  };

  const loadVoteCounts = async () => {
    const votes = await base44.entities.QuestVote.list();
    setAllVotes(votes);
    const counts = {};
    votes.forEach(v => { counts[v.quest_id] = (counts[v.quest_id] || 0) + 1; });
    setVoteCounts(counts);
  };

  const loadCommentCounts = async () => {
    const allComments = await base44.entities.QuestComment.list();
    const counts = {};
    allComments.forEach(c => { counts[c.quest_id] = (counts[c.quest_id] || 0) + 1; });
    setCommentCounts(counts);
  };

  useEffect(() => {
    const init = async () => {
      await loadQuests();
      // Stagger secondary calls to avoid rate limiting
      await loadVoteCounts();
      await loadCommentCounts();
      // Auth call after data to reduce burst
      base44.auth.me().then(async u => {
        setUser(u);
        if (u) {
          const profiles = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
          if (profiles[0]) setCurrentAdventurerId(profiles[0].id);
        }
      }).catch(() => {});
    };
    init();
  }, []);

  // Only show pending quests on the board
  const pendingQuests = quests.filter(q => q.status === 'pending');

  // Category counts for filter badges
  const categoryCounts = { total: pendingQuests.length };
  CATEGORIES.forEach(cat => {
    if (cat.id !== 'all') categoryCounts[cat.id] = filterQuestsByCategory(pendingQuests, cat.id).length;
  });

  // Filter then sort
  const filteredQuests = filterQuestsByCategory(pendingQuests, activeCategory);
  const displayedQuests = sortByVotes
    ? [...filteredQuests].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
    : filteredQuests;

  const rollForInitiative = async () => {
   if (!isAdmin) return;
   if (pendingQuests.length === 0 || isRolling) return;
   setIsRolling(true);
   setSelectedQuestId(null);

   const rollDuration = 2000;
   const flickerInterval = 120;
   let elapsed = 0;

   const timer = setInterval(() => {
     const ri = Math.floor(Math.random() * pendingQuests.length);
     setRollingId(pendingQuests[ri].id);
     elapsed += flickerInterval;
     if (elapsed >= rollDuration) {
       clearInterval(timer);
       const fi = Math.floor(Math.random() * pendingQuests.length);
       const selected = pendingQuests[fi];
       setRollingId(null);
       setSelectedQuestId(selected.id);
       setIsRolling(false);
       // Mark as completed (removes from board) and post to News Feed
       base44.entities.Quest.update(selected.id, { status: 'completed' });
       base44.entities.NewsPost.create({
         author_name: 'The Quest Board',
         author_email: 'questboard@hme.app',
         content: `⚔️ **CHOSEN SIDE QUEST** ⚔️\n\n"${selected.title}" has been selected for the next episode!\n\n📜 ${selected.description}\n\n🎯 Segment: ${selected.segment} · 🎲 DC: ${selected.difficulty_class}\n🧙 Submitted by: ${selected.quest_giver}\n\n🦈 Nicky & Charlotte are on the case!`,
       }).then(() => loadQuests()).catch(() => {});
     }
   }, flickerInterval);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden max-w-[100vw]"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)', backgroundAttachment: 'fixed' }}>
      {/* Optimized Background Layer */}
      <div className="absolute inset-0 h-full pointer-events-none overflow-hidden transform-gpu translate-z-0" style={{ backfaceVisibility: 'hidden' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] opacity-20 rounded-full transform-gpu"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-20 rounded-full transform-gpu"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {particles.map(p => <Particle key={p.id} style={p.style} />)}
      </div>

      {/* LCARS-style side bars */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-50" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">



      {/* ── HEADER ── */}
        <motion.header initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 sm:mb-14">

          {/* Top badge row */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 flex-wrap">
            <span className="text-cyan-500/70 text-[10px] tracking-[0.4em] font-mono uppercase border border-cyan-900/50 px-2 py-0.5 rounded">
              STARDATE {new Date().getFullYear()}.{(new Date().getMonth() + 1).toString().padStart(2, '0')}.{new Date().getDate().toString().padStart(2, '0')}
            </span>
            <span className="text-red-500/70 text-[10px] tracking-[0.4em] font-mono uppercase border border-red-900/50 px-2 py-0.5 rounded">
              🦈 SHARK ALERT
            </span>
            <span className="text-amber-500/70 text-[10px] tracking-[0.4em] font-mono uppercase border border-amber-900/50 px-2 py-0.5 rounded">
              NAT 20 ZONE
            </span>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="https://media.base44.com/images/public/699740722645ce51e91244be/097d3b10a_IMG-20260306-WA0005.jpg"
              alt="The Hyper-Fixation Main Event"
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover"
              style={{ border: '2px solid rgba(251,191,36,0.5)', boxShadow: '0 0 40px rgba(251,191,36,0.3), 0 0 80px rgba(239,68,68,0.15)' }} />
          </div>

          {/* Main title */}
          <div className="flex flex-col items-center justify-center mb-6">
            <h1
              className="font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-orange-600 leading-none m-0"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', letterSpacing: '0.02em', textShadow: '0 0 40px rgba(251,191,36,0.4)' }}
            >
              HYPER-FIXATION
            </h1>

            <div className="flex items-center justify-center gap-4 w-full max-w-lg mt-2">
              <div className="h-[3px] flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.8), transparent)' }} />
              <span className="font-black tracking-[0.2em] uppercase text-red-500 leading-none"
                style={{ textShadow: '0 0 15px rgba(239,68,68,0.6)', fontSize: 'clamp(1.2rem, 4vw, 2.5rem)' }}>
                MAIN EVENT
              </span>
              <div className="h-[3px] flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.8), transparent)' }} />
            </div>

            <p className="font-bold text-purple-400 mt-4 tracking-[0.4em] uppercase text-sm">
              — Official Podcast Quest Board —
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base mt-2 leading-relaxed">
            Hosted by <span className="text-purple-400 font-bold">Nicky</span> (Captain / Bard-Sorcerer) &amp; <span className="text-pink-400 font-bold">Charlotte</span> (Tactical Geek Princess / Barbarian-Druid).
            <br className="hidden sm:block mt-2" />
            We aren't experts, we are just two adventurers exploring the lore of life, pop culture, and deep dives, discussing new things we found out and want to share, always learning as we go. Submit your topics below, and we'll <span className="text-amber-400 font-semibold">Roll for Initiative</span> to pick our next discussion on the air!
          </p>

          {/* Host cards */}
          <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
            {[
              { name: 'Nicky', role: 'ADHD · Gifted · Trans', color: 'from-purple-600 to-violet-400', stat: 'Hyper-focus: 110%' },
              { name: 'Charlotte', role: 'AuDHD · Tactical Analyst', color: 'from-pink-600 to-rose-400', stat: 'Shark Facts: ∞' },
            ].map(h => (
              <div key={h.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-black text-white shrink-0", h.color)}>
                  {h.name[0]}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">{h.name}</div>
                  <div className="text-[10px] text-slate-500">{h.role} · <span className="text-amber-500">{h.stat}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin combat buttons — Roll for Initiative + RKO */}
          {isAdmin && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="flex items-center justify-center gap-4 mt-7 flex-wrap">

              {/* Artifact-style Initiative button */}
              <motion.button
                onClick={rollForInitiative}
                disabled={pendingQuests.length === 0 || isRolling}
                whileHover={{ scale: pendingQuests.length === 0 || isRolling ? 1 : 1.05, y: -2 }}
                whileTap={{ scale: 0.96, y: 0 }}
                className={cn(
                  "relative h-16 px-10 rounded-2xl font-black text-white disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden transition-all duration-300",
                  isRolling ? "artifact-btn-rolling" : "artifact-btn"
                )}
                style={{ border: `2px solid ${isRolling ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.4)'}` }}
              >
                {/* Ambient inner glow */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.3) 0%, transparent 60%)' }}
                  animate={isRolling ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.6 }}
                  transition={{ duration: 0.4, repeat: isRolling ? Infinity : 0 }}
                />

                {/* Warp speed streaks when rolling */}
                {isRolling && Array.from({ length: 10 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 h-px"
                    style={{
                      originX: 0, originY: 0,
                      rotate: `${i * 36}deg`,
                      width: `${30 + Math.random() * 60}%`,
                      background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.8), white)',
                    }}
                    animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.4, delay: i * 0.04, repeat: Infinity, repeatDelay: 0.2 }}
                  />
                ))}

                {/* Top highlight ridge */}
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

                <span className="relative flex items-center gap-3" style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                  {isRolling
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Rolling Initiative...</>
                    : <><Swords className="w-5 h-5" /> Roll for Initiative!</>
                  }
                </span>
              </motion.button>

              <RKOButton userIsAdmin={true} />
            </motion.div>
          )}
        </motion.header>

        {/* ── ACTION BAR ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10">

          {/* Post a Quest */}
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => user ? setIsDrawerOpen(true) : base44.auth.redirectToLogin(window.location.pathname)}
            className="font-lcars h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-purple-600/50 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 hover:border-purple-500 text-purple-200 font-bold text-sm"
            style={{ transition: 'all 0.5s ease-in-out' }}
          >
            <Plus className="w-4 h-4" />
            {user ? 'Post a Quest 🦈' : 'Login to Post 🦈'}
          </motion.button>

          {/* Sort by Votes — admin only */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setSortByVotes(s => !s)}
              className={cn(
                "font-lcars h-11 flex items-center gap-2 px-5 rounded-xl border-2 font-bold text-sm",
                sortByVotes ? "bg-amber-500/20 border-amber-500/60 text-amber-300" : "bg-purple-900/30 border-purple-700/40 text-purple-400 hover:border-purple-500"
              )}
              style={{ transition: 'all 0.5s ease-in-out' }}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortByVotes ? 'By Votes' : 'Sort by Votes'}
            </motion.button>
          )}

          {/* Host Settings — admin only */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setSettingsOpen(true)}
              className="font-lcars h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-slate-600/50 bg-slate-900/40 text-slate-300 hover:border-slate-400 hover:bg-slate-800/60 font-bold text-sm tracking-widest uppercase"
              style={{ transition: 'all 0.5s ease-in-out' }}
              title="Host notification settings"
            >
              <Settings className="w-4 h-4" /> Host Settings
            </motion.button>
          )}

          {/* Quest Map */}
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setMapOpen(true)}
            className="font-lcars h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-cyan-800/50 bg-cyan-950/30 text-cyan-400 hover:border-cyan-600/70 font-bold text-sm"
            style={{ transition: 'all 0.5s ease-in-out' }}
          >
            <Map className="w-4 h-4" /> Quest Map
          </motion.button>

          {/* Live Feed */}
          <ActivityDrawer isOpen={feedOpen} onOpenChange={setFeedOpen} onQuestSelect={(q) => {
            setTargetQuest(q);
            setMapOpen(true);
          }} />
        </motion.div>

        {/* ── NEXT SHOW BANNER ── */}
        <NextShowBanner />

        {/* ── CATEGORY FILTER ── */}
        {!loading && quests.length > 0 && (
          <QuestCategoryFilter active={activeCategory} onChange={setActiveCategory} counts={categoryCounts} />
        )}

        {/* ── QUEST GRID ── */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 min-w-0">

        {/* ── QUEST GRID (inner) ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Radio className="w-12 h-12 text-purple-500 animate-pulse" />
            <motion.span className="text-purple-400/70 font-mono text-sm tracking-widest" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {"SCANNING FOR QUESTS...".split("").map((char, index) => (
                <motion.span key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05, duration: 0.1 }}>
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </div>
        ) : quests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-purple-950/30 border-2 border-purple-800/30 flex items-center justify-center mb-6">
              <Fish className="w-10 h-10 text-cyan-700/50" />
            </div>
            <h3 className="text-3xl text-purple-300/70 mb-2">
              The Board Awaits, Adventurer...
            </h3>
            <p className="text-slate-600 max-w-md text-sm">
              No quests posted yet. Even the sharks are waiting. Be the first!
            </p>
          </motion.div>
        ) : displayedQuests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-3xl text-purple-300/50 mb-2">No quests in this zone yet...</p>
            <p className="text-slate-600 text-sm">Try a different category or post one!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayedQuests.map((quest, i) => (
              <QuestCard key={quest.id} quest={quest} index={i}
                isSelected={selectedQuestId === quest.id && !isRolling}
                isRolling={isRolling && rollingId === quest.id}
                currentUser={user}
                onDeleted={loadQuests}
                commentCount={commentCounts[quest.id] || 0}
                voteCount={voteCounts[quest.id] || 0}
                allVotes={allVotes}
                adventurerId={currentAdventurerId}
              />
            ))}
          </div>
        )}

          </div>{/* end flex-1 quest grid */}
        </div>{/* end quest grid */}

        {/* ── SELECTED ANNOUNCEMENT ── */}
        <AnimatePresence>
          {selectedQuestId && !isRolling && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }} className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-amber-500/50"
                style={{ background: 'linear-gradient(135deg, rgba(120,53,15,0.3), rgba(13,8,32,0.8))' }}>
                <Crown className="w-6 h-6 text-amber-400" />
                <span className="text-xl text-amber-200 font-bold">
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
      </div>{/* end max-w-7xl */}

      <QuestSubmissionDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onQuestSubmitted={loadQuests} />
      <HostSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AnimatePresence>
        {mapOpen && <QuestWorldMap quests={quests} onClose={() => { setMapOpen(false); setTargetQuest(null); }} targetQuest={targetQuest} />}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes) { return classes.filter(Boolean).join(' '); }