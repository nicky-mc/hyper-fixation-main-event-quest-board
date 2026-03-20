import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sword, Scroll, Bookmark, CheckCircle2, Clock,  Star, Trash2, ChevronRight, MessageCircle, Crown, Shield, Zap, Trophy, Flame, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// --- CONFIGURATION & HELPERS ---

const segmentColors = {
  'The Main Quest': 'from-red-800 to-red-500',
  'The Hyper-fixation Main Event': 'from-orange-700 to-amber-500',
  'Heart of the Story': 'from-rose-700 to-pink-500',
  'Heel Turn': 'from-rose-800 to-red-600',
  'Shark Week Special': 'from-blue-800 to-indigo-600',
};

const fallbackColor = 'from-purple-800 to-indigo-600';

const statusConfig = {
  pending: { 
    label: 'Pending', 
    icon: Clock, 
    color: 'text-slate-400', 
    bg: 'bg-slate-800/40 border-slate-700/40' 
  },
  selected: { 
    label: 'On Air!', 
    icon: Star, 
    color: 'text-[var(--accent)]', 
    bg: 'bg-[var(--accent)]/10 border-[var(--accent)]/40' 
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle2, 
    color: 'text-green-400', 
    bg: 'bg-green-900/20 border-green-700/40' 
  },
};

/**
 * getCharacterClass: Logic for the "Lore progression" system
 * Restoration of the high-fidelity tiers
 */
function getCharacterClass(questCount, commentCount) {
  const total = questCount + commentCount;
  if (total >= 50) return { title: 'Legendary Lore Master', color: 'text-amber-300', icon: Crown };
  if (total >= 25) return { title: 'Veteran Quester', color: 'text-purple-300', icon: Trophy };
  if (total >= 10) return { title: 'Seasoned Adventurer', color: 'text-cyan-300', icon: Shield };
  if (total >= 3)  return { title: 'Journeyman Hero', color: 'text-green-300', icon: Sword };
  return { title: 'Novice Adventurer', color: 'text-slate-400', icon: Zap };
}

/**
 * calcXP: Quantitative engagement score
 */
function calcXP(quests, comments, saved) {
  return quests * 100 + comments * 25 + saved * 10;
}

/**
 * StatBlock: Genre-aware numerical identifiers
 * Writing fix: Value text increased to 3xl for impact
 */
function StatBlock({ icon: Icon, label, value, color = 'text-purple-300' }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.04 }}
      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg"
    >
      <Icon className={cn("w-4 h-4", color)} />
      <span className={cn("text-3xl font-black", color)}>{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest text-center leading-tight">
        {label}
      </span>
    </motion.div>
  );
}

/**
 * QuestMiniCard: Condensed row indicator for dashboard lists
 * Swapped hardcoded ambers for var(--accent) indicators
 */
function QuestMiniCard({ quest, onUnsave }) {
  const cfg = statusConfig[quest.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
    >
      <div 
        className={cn(
          "w-1.5 h-10 rounded-full bg-gradient-to-b shrink-0", 
          segmentColors[quest.segment] || fallbackColor
        )} 
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
          {quest.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-500 truncate">{quest.segment}</span>
          <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
            <StatusIcon className="w-2.5 h-2.5" /> {cfg.label}
          </span>
        </div>
      </div>
      {onUnsave && (
        <button 
          onClick={() => onUnsave(quest.id)} 
          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-400 transition-all shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

/**
 * EmptyState: Placeholder for incomplete legends
 */
function EmptyState({ icon: Icon, text }) {
  return (
    <div className="py-12 text-center text-slate-600 text-sm border border-[var(--border-glow)]/20 rounded-xl flex flex-col items-center gap-3">
      <Icon className="w-10 h-10 opacity-20" />
      <p className="max-w-[200px]">{text}</p>
    </div>
  );
}

export default function MyAdventurer() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allQuests, setAllQuests] = useState([]);
  const [comments, setComments] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
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
    try {
      const [quests, comms, saved, profiles, incoming] = await Promise.all([
        base44.entities.Quest.list('-created_date', 200),
        base44.entities.QuestComment.filter({ author_name: name }),
        base44.entities.SavedQuest.filter({ saver_email: u.email }),
        base44.entities.AdventurerProfile.filter({ adventurer_name: name }),
        base44.entities.Friendship.filter({ 
          recipient_email: u.email, 
          status: 'pending' 
        }),
      ]);
      setAllQuests(quests);
      setComments(comms);
      setSavedRecords(saved);
      setProfile(profiles[0] || null);
      setPendingRequests(incoming);
    } catch (err) {
      console.error("Transmission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (req) => {
    await base44.entities.Friendship.update(req.id, { status: 'accepted' });
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const declineRequest = async (req) => {
    await base44.entities.Friendship.delete(req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
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
      <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
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

  const isAdmin = user?.role === 'admin';
  const charClass = isAdmin
    ? { title: 'Guild Hostess ✦ Legendary', color: 'text-amber-300', icon: Crown }
    : getCharacterClass(myQuests.length, comments.length);
  
  const CharIcon = charClass.icon;
  const xp = isAdmin ? 99999 : calcXP(myQuests.length, comments.length, savedQuests.length);
  const level = isAdmin ? '∞' : Math.max(1, Math.floor(xp / 200) + 1);
  const xpInLevel = isAdmin ? 200 : xp % 200;
  const xpPct = isAdmin ? 100 : (xpInLevel / 200) * 100;

  const onAirCount = myQuests.filter(q => q.status === 'selected' || q.status === 'completed').length;

  const tabs = [
    { id: 'quests', label: 'My Quests', icon: Scroll, count: myQuests.length },
    { id: 'lore', label: 'Lore Drops', icon: MessageCircle, count: contributedQuests.length },
    { id: 'saved', label: 'Bookmarked', icon: Bookmark, count: savedQuests.length },
  ];

  return (
    <div className="min-h-screen relative bg-transparent">

      {/* Side accent bars: High-fidelity preservation */}
      <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-40 pointer-events-none z-40" />

      {/* Starfield bg: Restoration of original depth */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', 
          backgroundSize: '45px 45px' 
        }} 
      />

      <div className="relative max-w-3xl mx-auto px-4 py-8">

        {/* ── CHARACTER SHEET HEADER ── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md overflow-hidden mb-6 shadow-2xl"
        >
          {/* Dimensional Multi-Gradient Bar */}
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 via-amber-400 to-red-500" />

          <div className="relative p-6 bg-black/30">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Avatar circle with level badge */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-purple-500/60 overflow-hidden shadow-2xl shadow-purple-900/50">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 flex items-center justify-center text-4xl font-black text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <motion.div
                  animate={{ boxShadow: ['0 0 8px rgba(251,191,36,0.4)', '0 0 20px rgba(251,191,36,0.8)', '0 0 8px rgba(251,191,36,0.4)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 border-2 border-[#0d0d1a] flex items-center justify-center"
                >
                  <span className="text-xs font-black text-stone-900">{level}</span>
                </motion.div>
              </div>

              {/* Name, Class, and XP progression */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-4xl sm:text-5xl font-black text-amber-300 leading-tight tracking-tight">
                  {name}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <CharIcon className={cn("w-4 h-4", charClass.color)} />
                  <span className={cn("text-sm font-bold uppercase tracking-widest", charClass.color)}>
                    {charClass.title}
                  </span>
                </div>
                <p className="text-[10px] text-purple-600 font-mono uppercase tracking-[0.2em] mt-1">
                  Dimensional Level {level} · {isAdmin ? 'MAXIMUM LORE REACHED' : `${xp} Total XP`}
                </p>

                {/* XP Progress: Typography Refactor */}
                <div className="mt-4 max-w-xs mx-auto sm:mx-0">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 font-bold uppercase tracking-tighter">
                    <span>{isAdmin ? 'LEGENDARY STATUS' : `To Level ${level + 1}`}</span>
                    <span>{isAdmin ? '∞ / ∞' : `${xpInLevel} / 200 XP`}</span>
                  </div>
                  <div className="h-3 bg-purple-950/60 rounded-full border border-purple-800/30 overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                    />
                  </div>
                  <p className="text-[9px] text-purple-800 mt-1 font-mono">
                    Quest: +100 · Lore: +25 · Save: +10
                  </p>
                </div>
              </div>

              {/* Public Profile Shifter */}
              <Link 
                to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(name)}`}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-700/40 text-purple-400 hover:text-purple-200 hover:border-purple-500 text-xs font-semibold transition-all duration-300"
              >
                View Profile <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Dimensional Stat Block Grid */}
            <div className="grid grid-cols-4 gap-3 mt-6">
              <StatBlock icon={Sword} label="Submitted" value={myQuests.length} color="text-red-400" />
              <StatBlock icon={Flame} label="On Air" value={onAirCount} color="text-amber-400" />
              <StatBlock icon={MessageCircle} label="Comments" value={comments.length} color="text-cyan-400" />
              <StatBlock icon={Bookmark} label="Saved" value={savedQuests.length} color="text-purple-400" />
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-purple-700/40 to-transparent" />
        </motion.div>

        {/* ── ACTIVE QUEST BANNER ── */}
        <AnimatePresence>
          {activeQuest && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-5 p-4 rounded-xl border border-[var(--accent)]/30 bg-black/50 backdrop-blur-sm flex items-center gap-4 shadow-lg"
            >
              <Star className="w-6 h-6 text-[var(--accent)] shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[var(--accent)] uppercase tracking-widest font-black">
                  ⚔️ Sector Priority: On Air!
                </p>
                <p className="text-xl font-black text-amber-100 truncate">{activeQuest.title}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter truncate max-w-[120px]">
                  {activeQuest.segment}
                </p>
                <p className="text-sm text-[var(--accent)] font-black">DC {activeQuest.difficulty_class}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FRIEND REQUEST INBOX ── */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-6 rounded-xl border border-cyan-500/30 bg-black/50 backdrop-blur-sm overflow-hidden shadow-xl"
            >
              <div className="px-4 py-2.5 border-b border-cyan-800/40 flex items-center gap-2 bg-cyan-950/20">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">
                  Transmission Requests ({pendingRequests.length})
                </span>
              </div>
              <div className="divide-y divide-cyan-900/30">
                {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-white/[0.02] transition-colors">
                    <span className="text-sm text-purple-100 font-bold truncate">{req.requester_name}</span>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => acceptRequest(req)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-800/40 border border-green-500/50 text-green-300 hover:bg-green-700/60 text-[11px] font-black uppercase tracking-wider transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button 
                        onClick={() => declineRequest(req)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-600/40 text-slate-400 hover:text-red-400 hover:border-red-600/40 text-[11px] font-black uppercase tracking-wider transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DIMENSIONAL TAB NAVIGATION ── */}
        <div className="flex gap-1.5 p-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 mb-6 shadow-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300",
                  isActive
                    ? "bg-[var(--accent)] text-[var(--bg-primary)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
                    : "text-slate-500 hover:text-[var(--accent)] hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-black min-w-[1.5rem]",
                  isActive ? "bg-black/20 text-current" : "bg-white/5 text-slate-600"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ENGINE ── */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-3"
          >
            {activeTab === 'quests' && (
              <div className="space-y-3">
                {myQuests.length === 0 ? (
                  <EmptyState 
                    icon={Scroll} 
                    text="Your Quest Log is empty. The sector awaits your first submission, Adventurer." 
                  />
                ) : (
                  myQuests.map(q => <QuestMiniCard key={q.id} quest={q} />)
                )}
              </div>
            )}

            {activeTab === 'lore' && (
              <div className="space-y-3">
                {contributedQuests.length === 0 ? (
                  <EmptyState 
                    icon={MessageCircle} 
                    text="No Lore Marks detected. Engage with the community to build your legend." 
                  />
                ) : (
                  contributedQuests.map(q => <QuestMiniCard key={q.id} quest={q} />)
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="space-y-3">
                {savedQuests.length === 0 ? (
                  <EmptyState 
                    icon={Bookmark} 
                    text="No Bookmarks found. Save quests from the main board to reference them here." 
                  />
                ) : (
                  savedQuests.map(q => (
                    <QuestMiniCard 
                      key={q.id} 
                      quest={q} 
                      onUnsave={unsaveQuest} 
                    />
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation Metadata */}
        <div className="mt-12 py-6 text-center border-t border-white/5">
          <p className="text-[10px] text-slate-700 font-mono tracking-[0.4em] uppercase">
            Hyper-Fixation Main Event // Adventurer Profile Interface v4.0.1
          </p>
        </div>

      </div>{/* End max-w-3xl */}
    </div>
  );
}
