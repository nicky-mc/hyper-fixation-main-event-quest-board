import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

function SwordsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="15" y2="17" />
      <polyline points="9.5 6.5 6 3 3 6 6.5 9.5" />
      <line x1="5" y1="11" x2="7" y2="9" />
      <polyline points="14.5 6.5 18 3 21 6 17.5 9.5" />
      <line x1="19" y1="13" x2="21" y2="11" />
      <polyline points="9.5 17.5 21 6 21 21 6 21 17.5 9.5" />
    </svg>
  );
}

const FEATURES = [
  { icon: '⚔️', title: 'Quest Board', desc: 'Submit and vote on show topics & side quests' },
  { icon: '📜', title: 'Lore Archive', desc: 'Browse every episode and completed quest' },
  { icon: '🏆', title: 'Hall of Fame', desc: 'Track legendary quests that made the show' },
  { icon: '👥', title: 'Adventurer Network', desc: 'Connect with fellow adventurers' },
];

export default function Welcome() {
  // If already logged in, redirect straight to QuestBoard
  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (auth) window.location.href = '/QuestBoard';
    });
  }, []);

  const handleLogin = () => base44.auth.redirectToLogin('/QuestBoard');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(120,40,200,0.6) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #dc2626, #fbbf24, #dc2626, transparent)' }} />
      </div>

      <div className="relative w-full max-w-2xl mx-auto z-10">

        {/* Logo & Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-10">
          <div className="w-36 h-36 rounded-full overflow-hidden mb-5"
            style={{
              border: '2px solid rgba(251,191,36,0.5)',
              boxShadow: '0 0 40px rgba(251,191,36,0.3), 0 0 80px rgba(239,68,68,0.2)',
            }}>
            <img src="https://media.base44.com/images/public/699740722645ce51e91244be/097d3b10a_IMG-20260306-WA0005.jpg"
              alt="The Hyper-Fixation Main Event" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-center leading-tight mb-3"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #fbbf24, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            HME
          </h1>
          <p className="text-slate-400 text-center text-sm sm:text-base max-w-sm"
            style={{ fontFamily: "'Exo 2', sans-serif" }}>
            The Adventurer's Guild — where every episode is a quest
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(8, 6, 24, 0.72)',
            border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
          }}>
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #dc2626, #fbbf24, #dc2626, transparent)' }} />

          <div className="p-8 sm:p-10">
            <h2 className="text-2xl font-black text-amber-300 mb-2 text-center"
              style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', letterSpacing: '0.1em' }}>
              ENTER THE GUILD
            </h2>
            <p className="text-slate-500 text-center text-xs mb-8" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              Join the community or log in to access the Quest Board
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button onClick={handleLogin}
                className="flex-1 py-4 rounded-xl font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  background: 'radial-gradient(ellipse at 50% 0%, #ef4444 0%, #b91c1c 50%, #7f1d1d 100%)',
                  boxShadow: '0 0 0 1px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                  color: '#fff',
                  letterSpacing: '0.08em',
                }}>
                ⚔️ Member Login
              </button>
              <button onClick={handleLogin}
                className="flex-1 py-4 rounded-xl font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  boxShadow: '0 0 20px rgba(251,191,36,0.1)',
                  color: '#fbbf24',
                  letterSpacing: '0.08em',
                }}>
                📜 Join the Board
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3))' }} />
              <span className="text-[10px] text-slate-600 uppercase tracking-widest" style={{ fontFamily: "'Exo 2', sans-serif" }}>Features</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.3), transparent)' }} />
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="text-xs font-bold text-red-300 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif" }}>{f.title}</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-center text-[10px] text-slate-700"
          style={{ fontFamily: "'Exo 2', sans-serif" }}>
          By joining, you agree to be an honorary adventurer of the guild.
        </motion.p>
      </div>
    </div>
  );
}