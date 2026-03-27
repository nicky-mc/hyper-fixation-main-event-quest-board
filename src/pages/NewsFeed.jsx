import { Radio } from 'lucide-react';
import ActivityStream from './ActivityStream'; // Import the high-fidelity logic
import { motion } from 'framer-motion';

export default function NewsFeed() {
  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'transparent' }}>
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* PAGE HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Radio className="w-8 h-8 text-[var(--accent)] animate-pulse" />
            <h1 className="text-4xl font-black text-[var(--accent)] font-lcars tracking-tighter uppercase">
              Tavern Noticeboard
            </h1>
          </div>
          <p className="text-[var(--text-muted)] font-mono text-xs tracking-[0.3em] uppercase">
            — Sector-Wide Transmissions & Global Lore —
          </p>
          <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mt-4 opacity-30" />
        </motion.div>

        {/* THE CORE ENGINE */}
        <div className="bg-[var(--panel-bg)]/20 backdrop-blur-md rounded-3xl border border-[var(--border-glow)]/30 p-1 sm:p-6 shadow-2xl">
          <ActivityStream />
        </div>

      </div>
    </div>
  );
}
