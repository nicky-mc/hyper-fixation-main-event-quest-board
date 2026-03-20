import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { useTheme, UI_TEXT } from '@/lib/ThemeContext';
import { Swords, Scroll, Trophy, Users, Loader2, Sparkles, Shield, Star } from 'lucide-react';

const FEATURES = [
  { icon: <Swords className="w-6 h-6" />, title: 'Quest Board', desc: 'Submit and vote on show topics & side quests' },
  { icon: <Scroll className="w-6 h-6" />, title: 'Lore Archive', desc: 'Browse every episode and completed quest' },
  { icon: <Trophy className="w-6 h-6" />, title: 'Hall of Fame', desc: 'Track legendary quests that made the show' },
  { icon: <Users className="w-6 h-6" />, title: 'Adventurer Network', desc: 'Connect with fellow adventurers' },
];

export default function Welcome() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { theme } = useTheme();

  const handleLogin = () => base44.auth.redirectToLogin('/QuestBoard');

  if (isAuthenticated && !isLoadingAuth) {
    return <Navigate to="/QuestBoard" replace />;
  }

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-[var(--bg-primary)] transition-colors duration-700">
      
      {/* GENRE-AWARE BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(80px)' }} 
        />
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
      </div>

      <div className="relative w-full max-w-3xl mx-auto z-10 flex flex-col items-center">

        {/* LOGO & HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col items-center mb-12 text-center"
        >
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-[0_0_50px_var(--border-glow)] mb-8">
            <img 
              src="https://media.base44.com/images/public/699740722645ce51e91244be/097d3b10a_IMG-20260306-WA0005.jpg"
              alt="HME Logo" 
              className="w-full h-full object-cover" 
            />
          </div>

          <h1 
            className="text-4xl sm:text-6xl font-black leading-none mb-8 tracking-tighter"
            style={{ color: 'var(--accent)', textShadow: '0 0 30px var(--border-glow)' }}
          >
            HYPER-FIXATION <br/>
            <span className="text-[var(--text-primary)] opacity-90 text-3xl sm:text-5xl uppercase">Main Event</span>
          </h1>

          {/* THE NEW NARRATIVE SECTION */}
          <div className="max-w-2xl space-y-6 px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[var(--accent)] mb-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-sm">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-xs font-black uppercase tracking-widest">Nicky: Captain / Bard-Sorcerer</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-sm">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Charlotte: Tactical Barbarian-Druid</span>
              </div>
            </div>

            <p className="text-sm sm:text-xl text-[var(--text-primary)] leading-relaxed font-medium">
              We aren't experts, we are just two adventurers exploring the <span className="text-[var(--accent)] underline decoration-dotted underline-offset-4">lore of life</span>, pop culture, and deep dives. 
            </p>
            
            <p className="text-xs sm:text-base text-[var(--text-muted)] italic font-semibold border-t border-[var(--border-glow)]/20 pt-4">
              Step inside, Adventurer. Submit your topics below, and we'll <span className="text-[var(--accent)] not-italic">Roll for Initiative</span> to pick our next discussion!
            </p>
          </div>
        </motion.div>

        {/* MAIN ACCESS CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full rounded-3xl overflow-hidden border-2 border-[var(--border-glow)] bg-[var(--panel-bg)] backdrop-blur-xl shadow-2xl mb-8"
        >
          <div className="h-2 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />

          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row gap-5 mb-12">
              {/* Ready Player One (Primary) */}
              <button 
                onClick={handleLogin}
                className="flex-1 min-h-[68px] rounded-2xl font-black text-lg transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-3 bg-[var(--accent)] text-[var(--bg-primary)] shadow-[0_10px_40px_rgba(var(--accent-rgb),0.3)]"
              >
                ⚔️ Ready Player One
              </button>
              
              {/* Insert Coin (Secondary) */}
              <button 
                onClick={handleLogin}
                className="flex-1 min-h-[68px] rounded-2xl font-black text-lg transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-3 border-2 border-[var(--accent)] text-[var(--accent)] bg-transparent hover:bg-[var(--accent)]/10"
              >
                📜 Insert Coin
              </button>
            </div>

            {/* Feature Grid: Upscaled & Theme-Aware */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-glow)]/20 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="text-[var(--accent)] shrink-0 bg-[var(--accent)]/10 p-2 rounded-lg">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">{f.title}</p>
                    <p className="text-xs text-[var(--text-muted)] leading-tight">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-[11px] font-black text-[var(--accent)] opacity-40 uppercase tracking-[0.4em] text-center">
          The Portal is Open // Co-Op Mode Active
        </p>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] pb-8" />
    </div>
  );
}
