import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTheme, THEMES } from '@/lib/ThemeContext';
import { cn } from '@/lib/utils';

// THE SVG DNA: These are the raw paths for the "Morphing" effect
const ICON_PATHS = {
  'sci-fi': "M12 2 L20 20 L12 16 L4 20 Z", // Delta
  'fantasy': "M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z", // D20
  'wrestling': "M2 9 V15 H5 L7 18 H17 L19 15 H22 V9 H19 L17 6 H7 L5 9 Z", // Championship Belt
  'high-contrast': "M1 12 S5 4 12 4 s11 8 11 8 s-4 8 -11 8 s-11 -8 -11 -8 z" // Data Eye
};

const THEME_META = {
  'sci-fi':        { label: 'Astrometrics',  iconScale: 1 },
  'fantasy':       { label: 'The Tavern',    iconScale: 1 },
  'wrestling':     { label: 'Squared Circle', iconScale: 0.9 },
  'high-contrast': { label: 'Data Overlay',  iconScale: 1 },
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-500",
          "bg-[var(--panel-bg)] border-[var(--border-glow)] text-[var(--accent)]",
          "font-lcars text-[10px] uppercase tracking-widest font-bold"
        )}
        style={{ boxShadow: '0 0 15px var(--border-glow)' }}
      >
        <div className="relative w-4 h-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <motion.path
              d={ICON_PATHS[theme]}
              initial={false}
              animate={{ d: ICON_PATHS[theme], rotate: theme === 'sci-fi' ? 0 : 360 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </svg>
        </div>
        <span className="hidden sm:inline">{meta.label}</span>
      </motion.button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-3 right-0 z-50 w-52 rounded-xl border-2 border-[var(--border-glow)] bg-[var(--bg-primary)] backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <p className="font-lcars text-[9px] text-[var(--accent)] opacity-50 uppercase tracking-widest px-2 py-1">Shift Dimension</p>
                {THEMES.map(t => {
                  const m = THEME_META[t];
                  const isActive = t === theme;
                  return (
                    <button
                      key={t}
                      onClick={() => { setTheme(t); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        isActive 
                          ? "bg-[var(--accent)] text-[var(--bg-primary)] font-bold" 
                          : "text-[var(--accent)] hover:bg-[var(--accent)]/10"
                      )}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d={ICON_PATHS[t]} />
                      </svg>
                      <span className="font-lcars text-xs uppercase tracking-widest">{m.label}</span>
                      {isActive && <motion.div layoutId="active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
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
