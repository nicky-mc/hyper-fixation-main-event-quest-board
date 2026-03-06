import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

const RKO_TOPICS = [
  "🎲 Mandatory D&D tangent — no one escapes",
  "🦈 Charlotte derails into shark facts",
  "🖖 Nicky initiates unexpected Star Trek lore dump",
  "🎤 Impromptu wrestling promo — NO context given",
  "🔥 Hot take: everything is a superhero allegory",
  "💀 Horror tangent: that one scary movie again",
  "🐉 Sudden dragon discourse. Non-negotiable.",
  "🌊 The ocean is terrifying. Moment of silence.",
  "📺 Reality TV comparison to the current topic",
  "🧠 ADHD hyperfocus activates on a random side detail",
  "🎵 Charlotte hums something for 45 seconds",
  "⚔️ An argument about alignment charts breaks out",
  "🍕 The episode stops for snack thoughts",
  "🤖 'This is literally like [obscure sci-fi show]'",
  "🦸 Power scaling debate: who would win?",
];

export default function RKOButton({ userIsAdmin }) {
  const [triggered, setTriggered] = useState(false);
  const [topic, setTopic] = useState('');
  const [visible, setVisible] = useState(false);

  if (!userIsAdmin) return null;

  const trigger = () => {
    const t = RKO_TOPICS[Math.floor(Math.random() * RKO_TOPICS.length)];
    setTopic(t);
    setTriggered(true);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
        whileTap={{ scale: 0.9 }}
        onClick={trigger}
        className="relative flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-orange-600/60 font-black text-sm text-orange-300 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(154,52,18,0.4), rgba(120,53,15,0.2))',
          boxShadow: '0 0 20px rgba(234,88,12,0.2)',
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
        }}
      >
        <Zap className="w-4 h-4" />
        RKO Outta Nowhere!
      </motion.button>

      {/* Fullscreen flash overlay */}
      <AnimatePresence>
        {triggered && visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(234,88,12,0.15) 0%, transparent 70%)' }}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], rotate: [-10, 5, 0], opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="max-w-lg mx-4 p-6 rounded-2xl border-4 border-orange-500 text-center pointer-events-auto"
              style={{
                background: 'linear-gradient(135deg, #1a0a00, #2d1200)',
                boxShadow: '0 0 60px rgba(234,88,12,0.6), 0 0 120px rgba(234,88,12,0.2)',
              }}
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-5xl mb-3"
              >
                💥
              </motion.div>
              <p className="text-orange-400 text-[10px] tracking-[0.4em] uppercase font-mono mb-2">RKO FROM OUTTA NOWHERE</p>
              <p className="text-white font-black text-2xl leading-snug mb-4"
                style={{ fontFamily: "'Caveat', cursive" }}>
                {topic}
              </p>
              <p className="text-orange-700 text-xs font-mono">THE HOSTS HAVE GONE OFF SCRIPT · GOD HELP US ALL</p>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setVisible(false)}
                className="mt-4 px-4 py-1.5 rounded-lg border border-orange-800/60 text-xs text-orange-600 hover:text-orange-400 transition-colors pointer-events-auto"
              >
                dismiss
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}