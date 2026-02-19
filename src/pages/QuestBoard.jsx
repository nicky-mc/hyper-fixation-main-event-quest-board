import { useState, useEffect } from 'react';
import { Plus, Scroll, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import QuestCard from '@/components/QuestCard';
import QuestSubmissionDrawer from '@/components/QuestSubmissionDrawer';
import InitiativeButton from '@/components/InitiativeButton';

export default function QuestBoard() {
  const [quests, setQuests] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadQuests = async () => {
    const data = await base44.entities.Quest.list('-created_date', 4);
    setQuests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const rollForInitiative = async () => {
    if (quests.length === 0 || isRolling) return;

    setIsRolling(true);
    setSelectedQuestId(null);

    // Rolling animation for 2 seconds
    const rollDuration = 2000;
    const flickerInterval = 100;
    let elapsed = 0;

    const flickerTimer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * quests.length);
      setSelectedQuestId(quests[randomIndex].id);
      elapsed += flickerInterval;

      if (elapsed >= rollDuration) {
        clearInterval(flickerTimer);
        // Final selection
        const finalIndex = Math.floor(Math.random() * quests.length);
        const selectedQuest = quests[finalIndex];
        setSelectedQuestId(selectedQuest.id);
        setIsRolling(false);

        // Update quest status
        base44.entities.Quest.update(selectedQuest.id, { status: 'selected' });
      }
    }, flickerInterval);
  };

  const handleQuestSubmitted = () => {
    loadQuests();
  };

  return (
    <div 
      className="min-h-screen bg-stone-950 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at top, rgba(120, 53, 15, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(41, 37, 36, 0.8) 0%, transparent 50%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
      }}
    >
      {/* Ambient light effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-amber-500/70" />
            <span className="text-amber-500/80 text-sm tracking-[0.3em] uppercase font-medium">
              Adventurer's Tavern
            </span>
            <Sparkles className="w-6 h-6 text-amber-500/70" />
          </div>
          
          <h1 
            className="text-5xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 mb-4"
            style={{ 
              fontFamily: "'Caveat', 'Segoe Script', cursive",
              textShadow: '0 0 40px rgba(251, 191, 36, 0.3)'
            }}
          >
            The Quest Board
          </h1>
          
          <p className="text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
            Submit your Side Quests for the show! Our hosts will roll for initiative to select 
            which adventure to tackle next.
          </p>
        </motion.header>

        {/* Action Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <InitiativeButton 
            onClick={rollForInitiative}
            isRolling={isRolling}
            disabled={quests.length === 0}
          />
          
          <Button
            onClick={() => setIsDrawerOpen(true)}
            className="px-6 py-5 bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 border-2 border-amber-700/50 hover:border-amber-600 text-amber-200 shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem' }}>
              Post a Quest
            </span>
          </Button>
        </motion.div>

        {/* Quest Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Scroll className="w-12 h-12 text-amber-600 animate-pulse" />
              <span className="text-amber-500/70">Loading quests...</span>
            </div>
          </div>
        ) : quests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-stone-900/50 border-2 border-amber-800/30 flex items-center justify-center mb-6">
              <Scroll className="w-10 h-10 text-amber-700/50" />
            </div>
            <h3 
              className="text-2xl text-amber-300/70 mb-2"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              The Board Awaits...
            </h3>
            <p className="text-stone-500 max-w-md">
              No quests have been posted yet. Be the first adventurer to submit a Side Quest!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {quests.map((quest, index) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                index={index}
                isSelected={selectedQuestId === quest.id && !isRolling}
                isRolling={isRolling && selectedQuestId === quest.id}
              />
            ))}
          </div>
        )}

        {/* Selected Quest Announcement */}
        <AnimatePresence>
          {selectedQuestId && !isRolling && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-10 text-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-900/50 via-stone-800/50 to-amber-900/50 rounded-xl border border-amber-600/50">
                <Crown className="w-6 h-6 text-amber-400" />
                <span 
                  className="text-xl text-amber-200"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Quest Selected for the Episode!
                </span>
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 text-stone-600 text-sm">
            <span className="w-8 h-px bg-stone-700" />
            <span>May your rolls be ever in your favor</span>
            <span className="w-8 h-px bg-stone-700" />
          </div>
        </motion.footer>
      </div>

      {/* Quest Submission Drawer */}
      <QuestSubmissionDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onQuestSubmitted={handleQuestSubmitted}
      />
    </div>
  );
}