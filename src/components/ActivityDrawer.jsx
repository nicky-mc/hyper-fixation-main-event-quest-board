import { Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Internal Components
import ActivityStream from './ActivityStream';

/**
 * ActivityDrawer
 * A simplified side-drawer focused exclusively on the Live Activity Stream.
 */
export default function ActivityDrawer({ isOpen, onOpenChange, label }) {
  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpenChange(true)}
        className="relative h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-[var(--border-glow)]/50 bg-[var(--panel-bg)] text-[var(--accent)] font-bold text-sm transition-all hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
      >
        <Activity className="w-4 h-4" />
        {label || 'Live Feed'}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse border-2 border-[var(--bg-primary)]" />
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
            style={{ top: '56px' }}
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 bottom-0 w-full sm:max-w-sm z-50 flex flex-col border-l border-[var(--border-glow)]/30 shadow-2xl overflow-hidden"
            style={{ top: '56px', background: 'var(--bg-primary)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--border-glow)]/20 bg-[var(--panel-bg)]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                  <Activity className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="font-black text-[var(--accent)] font-lcars tracking-[0.15em] text-lg uppercase leading-none">
                    Sub-Space Feed
                  </h2>
                  <p className="text-[9px] text-[var(--accent)] opacity-50 uppercase font-bold mt-1 tracking-widest">
                    Live Activity Monitoring
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-[var(--accent)]/10 text-[var(--text-muted)] hover:text-[var(--accent)] transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gradient-to-b from-transparent to-[var(--accent)]/5">
              <ActivityStream />
            </div>

            {/* Optional Footer/Status */}
            <div className="px-5 py-3 border-t border-[var(--border-glow)]/10 bg-[var(--panel-bg)]/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-lcars text-[var(--accent)] opacity-40 uppercase tracking-tighter">
                  Encrypted Connection Established
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-1 h-1 bg-[var(--accent)]/30 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
