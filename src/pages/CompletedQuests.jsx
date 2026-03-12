import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import QuestCard from '@/components/QuestCard';

export default function CompletedQuests() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadQuests();
  }, []);

  const loadQuests = async () => {
    const data = await base44.entities.Quest.filter({ status: 'completed' }, '-updated_date', 100);
    setQuests(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-yellow-400 to-orange-500 opacity-70" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 via-amber-400 to-yellow-500 opacity-70" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="text-5xl sm:text-6xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>
              Hall of Completed Quests
            </h1>
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Quests chosen by <span className="text-purple-300">Nicky</span> &amp; <span className="text-pink-300">Charlotte</span> for the show ⚔️🦈
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">{quests.length} quests completed</span>
          </div>
        </motion.header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg" style={{ fontFamily: "'Caveat', cursive" }}>No quests completed yet...</p>
            <p className="text-sm mt-1">Roll for Initiative on the Quest Board to choose one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {quests.map((quest, i) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                index={i}
                isSelected={false}
                isRolling={false}
                currentUser={user}
                onDeleted={loadQuests}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}