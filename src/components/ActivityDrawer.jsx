import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X } from 'lucide-react';
import ActivityStream from './ActivityStream';

export default function ActivityDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-green-800/50 bg-green-950/30 text-green-400 hover:border-green-600/70 font-bold text-sm transition-all relative"
      >
        <Activity className="w-4 h-4" />
        Live Feed
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse border-2 border-[#050510]" />
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col border-l border-purple-800/50 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #080512 0%, #050a18 100%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="font-black text-purple-100" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem' }}>
                  Live Community Feed
                </span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stream */}
            <div className="flex-1 overflow-hidden p-4">
              <ActivityStream />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}