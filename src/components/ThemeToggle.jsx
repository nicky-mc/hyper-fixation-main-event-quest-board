import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTheme, THEMES } from '@/lib/ThemeContext';
import { cn } from '@/lib/utils';

const ICON_PATHS = {
  'sci-fi': "M12 2 L20 20 L12 16 L4 20 Z", 
  'fantasy': "M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z", 
  'wrestling': "M2 9 V15 H5 L7 18 H17 L19 15 H22 V9 H19 L17 6 H7 L5 9 Z", 
  'high-contrast': "M1 12 S5 4 12 4 s11 8 11 8 s-4 8 -11 8 s-11 -8 -11 -8 z" 
};

const THEME_META = {
  'sci-fi':        { label: 'Astrometrics',   iconScale: 1 },
  'fantasy':       { label: 'The Tavern',     iconScale: 1 },
  'wrestling':     { label: 'Squared Circle', iconScale: 0.9 },
  'high-contrast': { label: 'Data Overlay',   iconScale: 1 },
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const meta = THEME_META[theme];

  return (
    <div className="relative">
      {/* MAIN TOGGLE BUTTON */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-300",
          "bg-[var(--panel-bg)] border-[var(--border-glow)] text-[var(--accent)]",
          // FIX: Upscaled text from 10px to text-xs (12px) with sm:text-sm (14px)
          "font-lcars text-xs sm:text-sm uppercase tracking-[0.15em] font-black"
        )}
        style={{ 
          boxShadow: '0 0 20px var(--border-glow)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="relative w-5 h-5"> {/* Increased from w-4 */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_5px_var(--accent)]">
            <motion.path
              d={ICON_PATHS[theme]}
              initial={false}
              animate={{ d: ICON_PATHS[theme], rotate: theme === 'sci-fi' ? 0 : 360 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
            />
          </svg>
        </div>
        <span className="hidden md:inline-block">{meta.label}</span>
      </motion.button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full mt-4 right-0 z-50 w-60 rounded-xl border-2 border-[var(--border-glow)] bg-[var(--bg-primary)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <div className="p-2.5 space-y-1.5">
                <p className="font-lcars text-[11px] text-[var(--accent)] opacity-70 uppercase tracking-[0.2em] px-3 py-2 font-black">
                  Shift Dimension
                </p>
                {THEMES.map(t => {
                  const m = THEME_META[t];
                  const isActive = t === theme;
                  return (
                    <button
                      key={t}
                      onClick={() => { setTheme(t); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all group",
                        isActive 
                          ? "bg-[var(--accent)] text-[var(--bg-primary)] font-black shadow-lg" 
                          : "text-[var(--accent)] hover:bg-[var(--accent)]/15"
                      )}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className={cn(
                        "w-5 h-5 transition-transform group-hover:rotate-12",
                        isActive ? "drop-shadow-none" : "drop-shadow-[0_0_3px_var(--accent)]"
                      )}>
                        <path d={ICON_PATHS[t]} />
                      </svg>
                      <span className="font-lcars text-sm uppercase tracking-widest">{m.label}</span>
                      {isActive && (
                        <motion.div 
                          layoutId="active-dot" 
                          className="ml-auto w-2 h-2 rounded-full bg-current animate-pulse" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
