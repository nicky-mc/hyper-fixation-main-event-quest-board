import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Loader2, Fish, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import QuestDetailModal from '@/components/QuestDetailModal';

const segmentColors = {
  'The Main Quest': 'from-red-800 to-red-500',
  'The Hyper-fixation Main Event': 'from-orange-700 to-amber-500',
  'Heart of the Story': 'from-rose-700 to-pink-500',
  'Shark Week Special': 'from-blue-800 to-indigo-600',
  'Roll for Initiative': 'from-red-700 to-orange-500',
  'World Building': 'from-indigo-700 to-violet-500',
  'The Gimmick Check': 'from-amber-600 to-yellow-500',
};
const fallbackColor = 'from-purple-800 to-indigo-600';

export default function CompletedQuests() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadQuests();

    const unsub = base44.entities.Quest.subscribe(event => {
      if (event.type === 'update' && event.data?.status === 'completed') {
        setQuests(prev => {
          const exists = prev.find(q => q.id === event.id);
          if (exists) return prev.map(q => q.id === event.id ? event.data : q);
          return [event.data, ...prev];
        });
      }
      if (event.type === 'delete') setQuests(prev => prev.filter(q => q.id !== event.id));
    });
    return unsub;
  }, []);

  const loadQuests = async () => {
    const data = await base44.entities.Quest.filter({ status: 'completed' }, '-updated_date', 100);
    setQuests(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-green-500 to-purple-500 opacity-60" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-green-500 to-amber-500 opacity-60" />

      <div className="relative max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-700/40 bg-green-900/20 text-green-400 text-xs font-mono tracking-widest uppercase mb-4">
            <Trophy className="w-3.5 h-3.5" /> Hall of Legends
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-600"
            style={{ fontFamily: "'Caveat', cursive" }}>
            Completed Side Quests
          </h1>
          <p className="text-slate-400 mt-3 text-sm max-w-lg mx-auto">
            Quests that have been rolled and aired on the show. Click any card to discuss or leave your lore!
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <Fish className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-2xl" style={{ fontFamily: "'Caveat', cursive" }}>No completed quests yet…</p>
            <p className="text-sm mt-1">Once quests are rolled on the board, they'll appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {quests.map((quest, i) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedQuest(quest)}
                  className="cursor-pointer rounded-xl border border-purple-900/50 hover:border-green-600/60 bg-[#0d0d1a] overflow-hidden transition-all group"
                >
                  {quest.image_url && (
                    <div className="w-full h-28 overflow-hidden">
                      <img src={quest.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className={cn("px-4 py-1.5 bg-gradient-to-r text-[10px] font-bold text-white tracking-widest uppercase", segmentColors[quest.segment] || fallbackColor)}>
                    {quest.segment}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-black text-amber-300 leading-tight" style={{ fontFamily: "'Caveat', cursive" }}>
                        {quest.title}
                      </h3>
                      <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/30 border border-green-700/40 text-green-400 text-[9px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Aired
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{quest.description}</p>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-900/30">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center text-[10px] font-black text-purple-200">
                        {quest.quest_giver.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] text-purple-400/70 flex-1" style={{ fontFamily: "'Caveat', cursive" }}>{quest.quest_giver}</span>
                      <span className="text-[10px] text-slate-600">DC {quest.difficulty_class}</span>
                      <MessageCircle className="w-3 h-3 text-purple-700 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedQuest && (
          <QuestDetailModal
            quest={selectedQuest}
            onClose={() => setSelectedQuest(null)}
            currentUser={user}
            onDeleted={loadQuests}
          />
        )}
      </AnimatePresence>
    </div>
  );
}