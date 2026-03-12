import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sword, Scroll, Bookmark, CheckCircle2, Clock, Star, Trash2, ChevronRight, MessageCircle, Crown, Shield, Zap, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const segmentColors = {
  'The Main Quest': 'from-red-800 to-red-500',
  'The Hyper-fixation Main Event': 'from-orange-700 to-amber-500',
  'Heart of the Story': 'from-rose-700 to-pink-500',
  'Heel Turn': 'from-rose-800 to-red-600',
  'Shark Week Special': 'from-blue-800 to-indigo-600',
};
const fallbackColor = 'from-purple-800 to-indigo-600';

const statusConfig = {
  pending:   { label: 'Pending',   icon: Clock,        color: 'text-slate-400',  bg: 'bg-slate-800/40 border-slate-700/40' },
  selected:  { label: 'On Air!',   icon: Star,         color: 'text-amber-400',  bg: 'bg-amber-900/20 border-amber-600/40' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-900/20 border-green-700/40' },
};

function getCharacterClass(questCount, commentCount) {
  const total = questCount + commentCount;
  if (total >= 50) return { title: 'Legendary Lore Master', color: 'text-amber-300', icon: Crown };
  if (total >= 25) return { title: 'Veteran Quester', color: 'text-purple-300', icon: Trophy };
  if (total >= 10) return { title: 'Seasoned Adventurer', color: 'text-cyan-300', icon: Shield };
  if (total >= 3)  return { title: 'Journeyman Hero', color: 'text-green-300', icon: Sword };
  return { title: 'Novice Adventurer', color: 'text-slate-400', icon: Zap };
}

function calcXP(quests, comments, saved) {
  return quests * 100 + comments * 25 + saved * 10;
}

function StatBlock({ icon: Icon, label, value, color = 'text-purple-300' }) {
  return (
    <motion.div whileHover={{ scale: 1.04 }}
      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-purple-900/40 bg-purple-950/20">
      <Icon className={cn("w-4 h-4", color)} />
      <span className={cn("text-2xl font-black", color)} style={{ fontFamily: "'Caveat', cursive" }}>{value}</span>
      <span className="text-[9px] text-slate-500 uppercase tracking-widest text-center leading-tight">{label}</span>
    </motion.div>
  );
}

function QuestMiniCard({ quest, onUnsave }) {
  const cfg = statusConfig[quest.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-purple-900/30 bg-purple-950/20 hover:border-purple-700/50 transition-all group">
      <div className={cn("w-1.5 h-10 rounded-full bg-gradient-to-b shrink-0", segmentColors[quest.segment] || fallbackColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-purple-100 truncate" style={{ fontFamily: "'Caveat', cursive", fontSize: '0.95rem' }}>{quest.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-slate-600 truncate">{quest.segment}</span>
          <span className={cn("inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
            <StatusIcon className="w-2.5 h-2.5" /> {cfg.label}
          </span>
        </div>
      </div>
      {onUnsave && (
        <button onClick={() => onUnsave(quest.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all shrink-0">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="py-12 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl flex flex-col items-center gap-3">
      <Icon className="w-8 h-8 opacity-30" />
      {text}
    </div>
  );
}

export default function MyAdventurer() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allQuests, setAllQuests] = useState([]);
  const [comments, setComments] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quests');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadAll(u);
    }).catch(() => setLoading(false));
  }, []);

  const loadAll = async (u) => {
    const name = u.full_name || u.email;
    const [quests, comms, saved, profiles] = await Promise.all([
      base44.entities.Quest.list('-created_date', 200),
      base44.entities.QuestComment.filter({ author_name: name }),
      base44.entities.SavedQuest.filter({ saver_email: u.email }),
      base44.entities.AdventurerProfile.filter({ adventurer_name: name }),
    ]);
    setAllQuests(quests);
    setComments(comms);
    setSavedRecords(saved);
    setProfile(profiles[0] || null);
    setLoading(false);
  };

  const unsaveQuest = async (questId) => {
    const rec = savedRecords.find(s => s.quest_id === questId);
    if (rec) {
      await base44.entities.SavedQuest.delete(rec.id);
      setSavedRecords(prev => prev.filter(s => s.id !== rec.id));
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-20 h-20 rounded-full border-2 border-purple-800/40 bg-purple-950/30 flex items-center justify-center">
        <Sword className="w-8 h-8 text-purple-600" />
      </div>
      <p className="text-slate-500 text-sm">Please log in to view your adventurer dashboard.</p>
    </div>
  );

  const name = user.full_name || user.email;
  const myQuests = allQuests.filter(q => q.quest_giver === name || q.created_by === user.email);
  const activeQuest = myQuests.find(q => q.status === 'selected');
  const commentedQuestIds = [...new Set(comments.map(c => c.quest_id))];
  const contributedQuests = allQuests.filter(q => commentedQuestIds.includes(q.id));
  const savedQuestIds = savedRecords.map(s => s.quest_id);
  const savedQuests = allQuests.filter(q => savedQuestIds.includes(q.id));

  const charClass = getCharacterClass(myQuests.length, comments.length);
  const CharIcon = charClass.icon;
  const xp = calcXP(myQuests.length, comments.length, savedQuests.length);
  const level = Math.max(1, Math.floor(xp / 200) + 1);
  const xpInLevel = xp % 200;
  const xpPct = (xpInLevel / 200) * 100;

  const onAirCount = myQuests.filter(q => q.status === 'selected' || q.status === 'completed').length;

  const tabs = [
    { id: 'quests', label: 'My Quests', icon: Scroll, count: myQuests.length },
    { id: 'lore', label: 'Lore Drops', icon: MessageCircle, count: contributedQuests.length },
    { id: 'saved', label: 'Bookmarked', icon: Bookmark, count: savedQuests.length },
  ];

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>

      {/* Side accent bars */}
      <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-40 pointer-events-none z-40" />

      {/* Starfield bg */}
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />

      <div className="relative max-w-3xl mx-auto px-4 py-8">

        {/* ── CHARACTER SHEET HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border-2 border-purple-700/50 overflow-hidden mb-6">
          {/* Gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 via-amber-400 to-red-500" />

          <div className="relative p-6"
            style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #0f0820 50%, #0a0d1e 100%)' }}>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

              {/* Avatar circle with level badge */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 border-4 border-purple-500/60 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-purple-900/50">
                  {name.charAt(0).toUpperCase()}
                </div>
                <motion.div
                  animate={{ boxShadow: ['0 0 8px rgba(251,191,36,0.4)', '0 0 20px rgba(251,191,36,0.8)', '0 0 8px rgba(251,191,36,0.4)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 border-2 border-[#0d0d1a] flex items-center justify-center">
                  <span className="text-xs font-black text-stone-900">{level}</span>
                </motion.div>
              </div>

              {/* Name, class, XP */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-4xl sm:text-5xl font-black text-amber-300 leading-tight"
                  style={{ fontFamily: "'Caveat', cursive" }}>{name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <CharIcon className={cn("w-4 h-4", charClass.color)} />
                  <span className={cn("text-sm font-bold", charClass.color)}>{charClass.title}</span>
                </div>
                <p className="text-[10px] text-purple-600 font-mono uppercase tracking-widest mt-0.5">
                  Level {level} · {xp} Total XP
                </p>

                {/* XP progress bar */}
                <div className="mt-3 max-w-xs mx-auto sm:mx-0">
                  <div className="flex justify-between text-[9px] text-slate-600 mb-1">
                    <span>Progress to Level {level + 1}</span>
                    <span>{xpInLevel} / 200 XP</span>
                  </div>
                  <div className="h-2.5 bg-purple-950/60 rounded-full border border-purple-800/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-400 rounded-full"
                    />
                  </div>
                  <p className="text-[8px] text-purple-800 mt-0.5">100xp/quest · 25xp/comment · 10xp/save</p>
                </div>
              </div>

              {/* Profile link */}
              <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(name)}`}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-700/40 text-purple-400 hover:text-purple-200 hover:border-purple-500 text-xs font-semibold transition-all">
                View Profile <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Stat blocks */}
            <div className="grid grid-cols-4 gap-2 mt-5">
              <StatBlock icon={Sword}    label="Submitted"  value={myQuests.length}  color="text-red-400" />
              <StatBlock icon={Flame}    label="On Air"     value={onAirCount}        color="text-amber-400" />
              <StatBlock icon={MessageCircle} label="Comments" value={comments.length} color="text-cyan-400" />
              <StatBlock icon={Bookmark} label="Saved"      value={savedQuests.length} color="text-purple-400" />
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-purple-700/40 to-transparent" />
        </motion.div>

        {/* Active Quest Banner */}
        <AnimatePresence>
          {activeQuest && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 p-4 rounded-xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-900/20 to-orange-900/10 flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-amber-600 uppercase tracking-widest font-bold">⚔️ Active Quest — On Air!</p>
                <p className="text-lg font-black text-amber-300 truncate" style={{ fontFamily: "'Caveat', cursive" }}>{activeQuest.title}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-amber-700 truncate max-w-[100px]">{activeQuest.segment}</p>
                <p className="text-xs text-amber-500 font-bold">DC {activeQuest.difficulty_class}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-purple-950/40 border border-purple-900/40 mb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-purple-700/60 text-purple-100 shadow-lg"
                    : "text-purple-500 hover:text-purple-300"
                )}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  activeTab === tab.id ? "bg-purple-500/30 text-purple-200" : "bg-purple-900/50 text-purple-600")}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>

            {activeTab === 'quests' && (
              <div className="space-y-2">
                {myQuests.length === 0
                  ? <EmptyState icon={Scroll} text="No quests submitted yet. Your legend is still unwritten..." />
                  : myQuests.map(q => <QuestMiniCard key={q.id} quest={q} />)}
              </div>
            )}

            {activeTab === 'lore' && (
              <div className="space-y-2">
                {contributedQuests.length === 0
                  ? <EmptyState icon={MessageCircle} text="Join a quest discussion to leave your lore mark!" />
                  : contributedQuests.map(q => <QuestMiniCard key={q.id} quest={q} />)}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="space-y-2">
                {savedQuests.length === 0
                  ? <EmptyState icon={Bookmark} text="Bookmark quests from the board to save them here." />
                  : savedQuests.map(q => <QuestMiniCard key={q.id} quest={q} onUnsave={unsaveQuest} />)}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}