import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function VoteButton({ questId, isSelected }) {
  const [votes, setVotes] = useState([]);
  const [adventurerId, setAdventurerId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Resolve the AdventurerProfile id for the current auth user
    base44.auth.me().then(async u => {
      if (!u) return;
      const profiles = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
      if (profiles[0]) setAdventurerId(profiles[0].id);
    }).catch(() => {});
    loadVotes();

    const unsub = base44.entities.QuestVote.subscribe((event) => {
      if (event.data?.quest_id !== questId) return;
      if (event.type === 'create') setVotes(v => [...v, event.data]);
      else if (event.type === 'delete') setVotes(v => v.filter(x => x.id !== event.id));
    });
    return unsub;
  }, [questId]);

  const loadVotes = async () => {
    const data = await base44.entities.QuestVote.filter({ quest_id: questId });
    setVotes(data);
  };

  const hasVoted = adventurerId && votes.some(v => v.adventurer_id === adventurerId);
  const voteCount = votes.length;

  const handleVote = async (e) => {
    e.stopPropagation();
    if (!adventurerId || loading) return;
    setLoading(true);
    if (hasVoted) {
      const myVote = votes.find(v => v.adventurer_id === adventurerId);
      if (myVote) await base44.entities.QuestVote.delete(myVote.id);
      try {
        const acts = await base44.entities.Activity.filter({ type: 'quest_voted', quest_id: questId, adventurer_id: adventurerId });
        await Promise.all(acts.map(a => base44.entities.Activity.delete(a.id)));
      } catch (_) {}
    } else {
      await base44.entities.QuestVote.create({ quest_id: questId, adventurer_id: adventurerId });
      try {
        const quests = await base44.entities.Quest.filter({ id: questId });
        await base44.entities.Activity.create({
          type: 'quest_voted',
          adventurer_id: adventurerId,
          quest_id: questId,
          quest_title: quests[0]?.title || '',
        });
      } catch (_) {}
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleVote}
      disabled={!adventurerId || loading}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg border transition-all duration-200 min-w-[48px]",
        hasVoted
          ? "bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30"
          : "bg-purple-900/20 border-purple-700/40 text-purple-400 hover:bg-purple-800/40 hover:border-purple-500/60",
        (!adventurerId || loading) && "opacity-50 cursor-not-allowed"
      )}
      title={hasVoted ? "Remove vote" : "Upvote this quest"}
    >
      <motion.div
        animate={hasVoted ? { y: [-3, 0] } : {}}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <ChevronUp className={cn("w-4 h-4", hasVoted && "fill-amber-400")} />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={voteCount}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-[11px] font-bold leading-none"
        >
          {voteCount}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}