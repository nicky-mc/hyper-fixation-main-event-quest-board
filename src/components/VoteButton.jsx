import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

// votesByQuestId: { [questId]: number } — passed from parent to avoid N+1 fetches
// allVotes: full vote array — passed from parent
export default function VoteButton({ questId, isSelected, voteCount: initialCount = 0, allVotes = [], adventurerId: propAdventurerId }) {
  const [localCount, setLocalCount] = useState(initialCount);
  const [localVoted, setLocalVoted] = useState(false);
  const [adventurerId, setAdventurerId] = useState(propAdventurerId || null);
  const [loading, setLoading] = useState(false);

  // Sync from props when parent data updates
  useEffect(() => { setLocalCount(initialCount); }, [initialCount]);
  useEffect(() => {
    if (propAdventurerId) {
      setAdventurerId(propAdventurerId);
      setLocalVoted(allVotes.some(v => v.quest_id === questId && v.adventurer_id === propAdventurerId));
    }
  }, [propAdventurerId, allVotes, questId]);

  useEffect(() => {
    // Only fetch adventurerId if not provided by parent
    if (propAdventurerId) return;
    base44.auth.me().then(async u => {
      if (!u) return;
      const profiles = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
      if (profiles[0]) {
        setAdventurerId(profiles[0].id);
        setLocalVoted(allVotes.some(v => v.quest_id === questId && v.adventurer_id === profiles[0].id));
      }
    }).catch(() => {});
  }, [questId]);

  const hasVoted = localVoted;
  const voteCount = localCount;

  const handleVote = async (e) => {
    e.stopPropagation();
    if (!adventurerId || loading) return;
    setLoading(true);
    if (hasVoted) {
      // Optimistic update
      setLocalVoted(false);
      setLocalCount(c => Math.max(0, c - 1));
      try {
        const myVotes = await base44.entities.QuestVote.filter({ quest_id: questId, adventurer_id: adventurerId });
        if (myVotes[0]) await base44.entities.QuestVote.delete(myVotes[0].id);
        const acts = await base44.entities.Activity.filter({ type: 'quest_voted', quest_id: questId, adventurer_id: adventurerId });
        await Promise.all(acts.map(a => base44.entities.Activity.delete(a.id)));
      } catch (_) {}
    } else {
      // Optimistic update
      setLocalVoted(true);
      setLocalCount(c => c + 1);
      try {
        await base44.entities.QuestVote.create({ quest_id: questId, adventurer_id: adventurerId });
        const quests = await base44.entities.Quest.filter({ id: questId });
        const quest = quests[0];
        await base44.entities.Activity.create({
          type: 'quest_voted',
          adventurer_id: adventurerId,
          quest_id: questId,
          quest_title: quest?.title || '',
        });
        // Notify the quest owner (if different adventurer)
        if (quest?.adventurer_id && quest.adventurer_id !== adventurerId) {
          const ownerProf = await base44.entities.AdventurerProfile.filter({ id: quest.adventurer_id });
          const voterProf = await base44.entities.AdventurerProfile.filter({ id: adventurerId });
          if (ownerProf[0]?.auth_id) {
            await base44.entities.Notification.create({
              target_auth_id: ownerProf[0].auth_id,
              actor_name: voterProf[0]?.adventurer_name || 'Someone',
              type: 'quest_vote',
              content: `upvoted your quest "${quest.title}"`,
              is_read: false,
              link_url: '/QuestBoard',
            });
          }
        }
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