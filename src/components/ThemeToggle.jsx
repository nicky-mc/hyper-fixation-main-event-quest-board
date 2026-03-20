import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTheme, THEMES } from '@/lib/ThemeContext';
import { cn } from '@/lib/utils';

// Iconic SVG shapes for each theme
function ThemeIcon({ theme, size = 20 }) {
  if (theme === 'sci-fi') return (
    // Starfleet delta chevron
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L20 20 L12 16 L4 20 Z" />
    </svg>
  );
  if (theme === 'fantasy') return (
    // D20 face
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
      <polygon points="12,2 22,8 12,11" fill="currentColor" opacity="0.3" />
      <polygon points="12,22 2,16 12,11" fill="currentColor" opacity="0.3" />
    </svg>
  );
  if (theme === 'wrestling') return (
    // Championship belt plate
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="9" width="20" height="6" rx="1" />
      <rect x="7" y="6" width="10" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
  // high-contrast — eyeball
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

const THEME_META = {
  'sci-fi':        { label: 'Astrometrics', color: 'text-cyan-400',   bg: 'bg-cyan-950/60 border-cyan-700/60' },
  'fantasy':       { label: 'The Tavern',   color: 'text-amber-400',  bg: 'bg-amber-950/60 border-amber-700/60' },
  'wrestling':     { label: 'Squared Circle', color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-700/60' },
  'high-contrast': { label: 'Data Overlay', color: 'text-white',      bg: 'bg-black border-white' },
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const meta = THEME_META[theme];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={`Theme: ${meta.label}. Click to switch.`}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-lcars text-[10px] uppercase tracking-widest font-bold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400",
          meta.bg, meta.color
        )}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ThemeIcon theme={theme} size={16} />
        </motion.span>
        <span className="hidden sm:inline">{meta.label}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 z-50 w-52 rounded-xl border border-white/20 bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <p className="font-lcars text-[9px] text-slate-500 uppercase tracking-widest px-3 pt-2.5 pb-1">Switch Theme</p>
              {THEMES.map(t => {
                const m = THEME_META[t];
                const isActive = t === theme;
                return (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setOpen(false); }}
                    aria-pressed={isActive}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all focus:outline-none focus:ring-inset focus:ring-1 focus:ring-cyan-400",
                      isActive ? cn("font-bold", m.color, "bg-white/10") : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className={isActive ? m.color : ''}><ThemeIcon theme={t} size={14} /></span>
                    <div>
                      <p className="font-lcars text-xs uppercase tracking-widest">{m.label}</p>
                    </div>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}