import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, AlertTriangle } from 'lucide-react';

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
  const [topic, setTopic] = useState('');
  const [visible, setVisible] = useState(false);

  if (!userIsAdmin) return null;

  const trigger = () => {
    const t = RKO_TOPICS[Math.floor(Math.random() * RKO_TOPICS.length)];
    setTopic(t);
    setVisible(true);
    setTimeout(() => setVisible(false), 8000);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
        whileTap={{ scale: 0.9 }}
        onClick={trigger}
        className="relative h-14 flex items-center gap-2 px-5 rounded-xl border-2 border-orange-600/60 font-black text-orange-300 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(154,52,18,0.6), rgba(120,53,15,0.3))',
          boxShadow: '0 0 20px rgba(234,88,12,0.2), 0 8px 24px rgba(0,0,0,0.5)',
          fontFamily: "'Cinzel', serif",
          fontSize: '0.95rem',
          letterSpacing: '0.05em',
        }}
      >
        <Zap className="w-4 h-4" />
        RKO Outta Nowhere!
      </motion.button>

      {/* RED ALERT fullscreen override */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            {/* Red alert overlay — pulses */}
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.04, 0.12, 0.04] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.6) 0%, rgba(127,29,29,0.3) 40%, transparent 70%)' }}
            />

            {/* Scanline stripes */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(220,38,38,0.3) 0px, rgba(220,38,38,0.3) 1px, transparent 1px, transparent 4px)' }} />

            {/* Corner alert brackets */}
            {[['top-4 left-4', 'border-t-2 border-l-2'], ['top-4 right-4', 'border-t-2 border-r-2'], ['bottom-4 left-4', 'border-b-2 border-l-2'], ['bottom-4 right-4', 'border-b-2 border-r-2']].map(([pos, border]) => (
              <motion.div key={pos} className={`absolute w-12 h-12 ${pos} ${border} border-red-500 pointer-events-none`}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
            ))}

            {/* Main alert card */}
            <motion.div
              initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
              animate={{ scale: [0.6, 1.06, 1], rotate: [-8, 3, 0], opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 8 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220 }}
              className="relative max-w-lg mx-4 p-7 rounded-2xl text-center pointer-events-auto"
              style={{
                background: 'linear-gradient(145deg, #1c0505, #2d0a0a, #1a0303)',
                border: '2px solid rgba(239,68,68,0.7)',
                boxShadow: '0 0 0 4px rgba(239,68,68,0.15), 0 0 80px rgba(239,68,68,0.6), 0 0 160px rgba(220,38,38,0.2), inset 0 1px 0 rgba(255,100,100,0.1)',
              }}
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-6xl mb-3"
              >
                💥
              </motion.div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </motion.div>
                <p className="text-red-400 text-[10px] tracking-[0.5em] uppercase font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                  Red Alert — RKO Incoming
                </p>
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </motion.div>
              </div>

              <p className="text-white font-black text-2xl leading-snug mb-5 font-cinzel">{topic}</p>
              <p className="text-red-700/80 text-xs font-mono tracking-wider">THE HOSTS HAVE GONE OFF SCRIPT · ALL HANDS ON DECK</p>

              <button
                onClick={() => setVisible(false)}
                className="mt-5 flex items-center gap-1.5 mx-auto px-5 py-2 rounded-xl border border-red-800/60 text-sm text-red-400 hover:text-red-200 hover:border-red-600/80 transition-all"
              >
                <X className="w-4 h-4" /> Dismiss Alert
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}