import { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { MessageCircle, User, Rss, LogOut, LogIn, Trophy, Menu, X, CalendarDays, UserPlus, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MessageToast from '@/components/MessageToast';
import { useAdventurerSync } from '@/components/useAdventurerSync';

// Global adventurer context
export const AdventurerContext = createContext(null);
export const useAdventurer = () => useContext(AdventurerContext);

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

const NAV_ITEMS = [
  { label: 'Quest Board',   page: 'QuestBoard',      icon: SwordsIcon },
  { label: 'News Feed',     page: 'NewsFeed',         icon: Rss },
  { label: 'Hall of Fame',  page: 'CompletedQuests',  icon: Trophy },
  { label: 'Messages',      page: 'Messages',         icon: MessageCircle },
  { label: 'My Adventurer', page: 'MyAdventurer',     icon: User },
  { label: 'Episode Calendar', page: 'EpisodeCalendar', icon: CalendarDays },
  { label: 'Friends', page: 'Friends', icon: UserPlus },
  { label: 'Discover', page: 'Discover', icon: Compass },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser]             = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded]     = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadUnread(u.email);
    }).catch(() => {});
  }, []);

  const loadUnread = async (profileId) => {
    const msgs = await base44.entities.Message.filter({ recipient_id: profileId, read: false });
    setUnreadCount(msgs.length);
  };

  useEffect(() => {
    if (!profile) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.recipient_id === profile.id) {
        setUnreadCount(c => c + 1);
      }
    });
    return unsub;
  }, [profile]);

  const handleLogin  = () => base44.auth.redirectToLogin(window.location.pathname);
  const handleLogout = () => base44.auth.logout('/');

  // Sidebar content shared between desktop & mobile
  const SidebarContent = ({ onNav }) => (
    <>
      {/* Logo */}
      <Link to={createPageUrl('QuestBoard')} onClick={onNav}
        className="flex items-center gap-3 px-3 py-4 mb-2 group shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 transition-all duration-500 group-hover:scale-110"
          style={{
            border: '1px solid rgba(251,191,36,0.5)',
            boxShadow: '0 0 16px rgba(251,191,36,0.25)',
          }}>
          <img src="https://media.base44.com/images/public/699740722645ce51e91244be/097d3b10a_IMG-20260306-WA0005.jpg" alt="HME Logo" className="w-full h-full object-cover" />
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -8, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -8, width: 0 }}
              className="font-black text-lg tracking-wide overflow-hidden whitespace-nowrap"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              HME
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Divider */}
      <div className="mx-3 mb-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)' }} />

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1 px-2">
        {NAV_ITEMS.map(({ label, page, icon: Icon }) => {
          const active = currentPageName === page;
          const badge = page === 'Messages' ? unreadCount : 0;
          return (
            <Link key={page} to={createPageUrl(page)} onClick={onNav}
              className={cn(
                "relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-500 group",
                active ? "text-red-400" : "text-slate-500 hover:text-red-400"
              )}
              style={active ? {
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                boxShadow: '0 0 16px rgba(239,68,68,0.15)',
              } : {
                border: '1px solid transparent',
              }}>
              <div className="relative shrink-0 transition-all duration-500"
                style={{ filter: active ? 'drop-shadow(0 0 6px rgba(239,68,68,0.8))' : '' }}>
                <Icon className="w-5 h-5 transition-all duration-500 group-hover:[filter:drop-shadow(0_0_6px_rgba(239,68,68,0.9))]" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                    style={{ boxShadow: '0 0 8px rgba(239,68,68,0.7)' }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    exit={{ opacity: 0, x: -8, width: 0 }}
                    className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                    style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.05em' }}>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user */}
      <div className="mt-auto px-2 pb-3 shrink-0">
        <div className="mx-1 mb-2 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />
        {user ? (
          <>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[9px] text-slate-600 text-center mb-1.5 px-2 truncate"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {user.full_name || user.email}
                </motion.p>
              )}
            </AnimatePresence>
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-slate-500 hover:text-red-400 transition-all duration-500 hover:bg-red-900/20 group"
              style={{ border: '1px solid transparent' }}>
              <LogOut className="w-4 h-4 shrink-0 group-hover:[filter:drop-shadow(0_0_5px_rgba(239,68,68,0.8))]" />
              <AnimatePresence>
                {expanded && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                    className="text-xs font-semibold overflow-hidden whitespace-nowrap" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </>
        ) : (
          <button onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-amber-500/70 hover:text-amber-400 transition-all duration-500 hover:bg-amber-900/20 group"
            style={{ border: '1px solid transparent' }}>
            <LogIn className="w-4 h-4 shrink-0 group-hover:[filter:drop-shadow(0_0_5px_rgba(251,191,36,0.8))]" />
            <AnimatePresence>
              {expanded && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                  className="text-xs font-semibold overflow-hidden whitespace-nowrap" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  Login
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </>
  );

  return (
    <AdventurerContext.Provider value={null}>
      <div className="min-h-screen flex relative"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Deep Space Nebula overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Nebula color clouds */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(120,40,200,0.6) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(0,180,220,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {/* Wood-grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 3px
            ), repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(255,255,255,0.015) 8px,
              rgba(255,255,255,0.015) 9px
            )`,
          }} />
        {/* Starfield dots */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      {/* ── DESKTOP FLOATING SIDEBAR ── */}
      <motion.aside
        onHoverStart={() => setExpanded(true)}
        onHoverEnd={() => setExpanded(false)}
        animate={{ width: expanded ? 200 : 68 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex fixed left-4 top-4 bottom-4 z-50 flex-col overflow-hidden rounded-2xl"
        style={{
          backdropFilter: 'blur(15px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(15px) saturate(1.8)',
          background: 'rgba(8, 6, 24, 0.72)',
          border: '1px solid rgba(239,68,68,0.18)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(239,68,68,0.08)',
        }}
      >
        {/* Command Red top accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, #dc2626, #fbbf24, #dc2626, transparent)' }} />
        {/* Command Red left glow edge */}
        <div className="absolute left-0 top-8 bottom-8 w-0.5 rounded-full"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(239,68,68,0.6), transparent)' }} />

        <SidebarContent onNav={() => {}} />
      </motion.aside>

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4"
        style={{
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          background: 'rgba(8, 6, 24, 0.85)',
          borderBottom: '1px solid rgba(239,68,68,0.18)',
        }}>
        <div className="h-0.5 absolute inset-x-0 top-0"
          style={{ background: 'linear-gradient(90deg, transparent, #dc2626, #fbbf24, #dc2626, transparent)' }} />
        <Link to={createPageUrl('QuestBoard')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden"
            style={{ border: '1px solid rgba(251,191,36,0.4)', boxShadow: '0 0 8px rgba(251,191,36,0.2)' }}>
            <img src="https://media.base44.com/images/public/699740722645ce51e91244be/097d3b10a_IMG-20260306-WA0005.jpg" alt="HME Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-base text-amber-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>HME</span>
        </Link>
        <button onClick={() => setMobileOpen(o => !o)} className="p-2 text-slate-400 hover:text-red-400 transition-all duration-500">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col rounded-r-2xl overflow-hidden"
              style={{
                backdropFilter: 'blur(15px)',
                background: 'rgba(8, 6, 24, 0.95)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
              <div className="h-0.5 absolute inset-x-0 top-0"
                style={{ background: 'linear-gradient(90deg, transparent, #dc2626, #fbbf24, #dc2626, transparent)' }} />
              <div className="pt-4">
                <SidebarContent onNav={() => setMobileOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 relative z-10 md:pl-24 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>

      <MessageToast currentPageName={currentPageName} />
      </div>
    </AdventurerContext.Provider>
  );
}