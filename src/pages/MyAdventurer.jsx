import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sword, Scroll, Bookmark, CheckCircle2, Clock, Star, Trash2, ChevronRight } from 'lucide-react';
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

function QuestMiniCard({ quest, onUnsave, saved }) {
  const cfg = statusConfig[quest.status] || statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 rounded-xl border border-purple-900/40 bg-[#0d0d1a] hover:border-purple-700/60 transition-all group">
      <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center", segmentColors[quest.segment] || fallbackColor)}>
        <Sword className="w-3.5 h-3.5 text-white/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-purple-100 truncate" style={{ fontFamily: "'Caveat', cursive", fontSize: '1rem' }}>{quest.title}</p>
        <p className="text-[10px] text-slate-500 truncate">{quest.segment}</p>
        <div className={cn("inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold", cfg.bg, cfg.color)}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </div>
      </div>
      {onUnsave && (
        <button onClick={() => onUnsave(quest.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-400 transition-all shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, label, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-amber-400" />
      <h2 className="text-xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>{label}</h2>
      {count !== undefined && (
        <span className="ml-1 text-xs bg-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

export default function MyAdventurer() {
  const [user, setUser] = useState(null);
  const [allQuests, setAllQuests] = useState([]);
  const [comments, setComments] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadAll(u);
    }).catch(() => setLoading(false));
  }, []);

  const loadAll = async (u) => {
    const name = u.full_name || u.email;
    const [quests, comms, saved] = await Promise.all([
      base44.entities.Quest.list('-created_date', 200),
      base44.entities.QuestComment.filter({ author_name: name }),
      base44.entities.SavedQuest.filter({ saver_email: u.email }),
    ]);
    setAllQuests(quests);
    setComments(comms);
    setSavedRecords(saved);
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <Sword className="w-10 h-10" />
      <p>Please log in to view your adventurer dashboard.</p>
    </div>
  );

  const name = user.full_name || user.email;

  // My submitted quests (by quest_giver name match)
  const myQuests = allQuests.filter(q => q.quest_giver === name || q.created_by === user.email);
  const activeQuest = myQuests.find(q => q.status === 'selected');
  const questHistory = myQuests.filter(q => q.status !== 'pending');

  // Quests I've commented on
  const commentedQuestIds = [...new Set(comments.map(c => c.quest_id))];
  const contributedQuests = allQuests.filter(q => commentedQuestIds.includes(q.id));

  // Saved quests
  const savedQuestIds = savedRecords.map(s => s.quest_id);
  const savedQuests = allQuests.filter(q => savedQuestIds.includes(q.id));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-5 rounded-2xl border border-purple-800/50 bg-gradient-to-r from-[#0d0d1a] to-[#100a1e]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 border-2 border-purple-500/50 flex items-center justify-center text-3xl font-black text-white shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-black text-amber-300 leading-tight" style={{ fontFamily: "'Caveat', cursive" }}>{name}</h1>
          <p className="text-xs text-purple-500 uppercase tracking-widest mt-0.5">Adventurer Dashboard</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-slate-500">
            <span>{myQuests.length} quests submitted</span>
            <span>·</span>
            <span>{comments.length} lore contributions</span>
            <span>·</span>
            <span>{savedQuests.length} saved</span>
          </div>
        </div>
        <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(name)}`}
          className="ml-auto flex items-center gap-1 text-xs text-purple-400 hover:text-purple-200 transition-colors shrink-0">
          View Profile <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>

      {/* Active Quest */}
      <section>
        <SectionHeader icon={Star} label="Active Quest" />
        {activeQuest ? (
          <div className="p-5 rounded-xl border-2 border-amber-500/50 bg-amber-900/10">
            <div className="flex items-start gap-3">
              <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center", segmentColors[activeQuest.segment] || fallbackColor)}>
                <Sword className="w-4 h-4 text-white/80" />
              </div>
              <div>
                <p className="text-lg font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>{activeQuest.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activeQuest.segment} · DC {activeQuest.difficulty_class}</p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{activeQuest.description}</p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5" /> ⚔️ ON AIR!
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl">
            No active quest right now — submit one to the board!
          </div>
        )}
      </section>

      {/* Quest History */}
      <section>
        <SectionHeader icon={Scroll} label="Quest History" count={questHistory.length} />
        {questHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl">
            No quest history yet. Your legend is still unwritten...
          </div>
        ) : (
          <div className="space-y-2">
            {questHistory.map(q => <QuestMiniCard key={q.id} quest={q} />)}
          </div>
        )}
      </section>

      {/* Contributed Quests */}
      <section>
        <SectionHeader icon={Scroll} label="Lore Contributions" count={contributedQuests.length} />
        {contributedQuests.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl">
            Join a quest discussion to appear here!
          </div>
        ) : (
          <div className="space-y-2">
            {contributedQuests.map(q => <QuestMiniCard key={q.id} quest={q} />)}
          </div>
        )}
      </section>

      {/* Saved Quests */}
      <section>
        <SectionHeader icon={Bookmark} label="Saved Quests" count={savedQuests.length} />
        {savedQuests.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl">
            Bookmark quests from the board to save them here.
          </div>
        ) : (
          <div className="space-y-2">
            {savedQuests.map(q => <QuestMiniCard key={q.id} quest={q} onUnsave={unsaveQuest} saved />)}
          </div>
        )}
      </section>
    </div>
  );
}