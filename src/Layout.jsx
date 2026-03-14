import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { MessageCircle, User, Rss, LogOut, LogIn, Trophy, Menu, X, CalendarDays, UserPlus, Compass, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MessageToast from '@/components/MessageToast';
import NotificationCenter from '@/components/NotificationCenter';
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
  const { profile } = useAdventurerSync();
  const [user, setUser]             = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const location = useLocation();
  const lastUnreadFetch = useRef(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadUnread(u.email);
    }).catch(() => {});
  }, []);

  const loadUnread = async (profileId) => {
    const now = Date.now();
    if (now - lastUnreadFetch.current < 30000) return; // 30s cooldown
    lastUnreadFetch.current = now;
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

  // Ping last_active on every navigation
  useEffect(() => {
    if (!profile) return;
    base44.entities.AdventurerProfile.update(profile.id, { last_active: new Date().toISOString() }).catch(() => {});
  }, [location.pathname, profile?.id]);

  const handleLogin  = () => base44.auth.redirectToLogin(window.location.pathname);
  const handleLogout = () => base44.auth.logout('/');

  // Sidebar content shared between desktop & mobile
  const SidebarContent = ({ onNav }) => (
    <>
      {/* Divider */}
      <div className="mx-3 mb-3 mt-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)' }} />

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
                    style={{ letterSpacing: '0.05em' }}>
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
                  className="text-[9px] text-slate-600 text-center mb-1.5 px-2 truncate">
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
                    className="text-xs font-semibold overflow-hidden whitespace-nowrap">
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
                  className="text-xs font-semibold overflow-hidden whitespace-nowrap">
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
    <AdventurerContext.Provider value={profile}>
      <div className="min-h-screen flex relative transform-gpu" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', backgroundAttachment: 'fixed' }}>

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
        className="hidden md:flex fixed left-4 top-16 bottom-4 z-50 flex-col overflow-hidden rounded-b-2xl rounded-t-none"
        style={{
          backdropFilter: 'blur(24px) saturate(2)',
          WebkitBackdropFilter: 'blur(24px) saturate(2)',
          background: 'rgba(8, 6, 24, 0.65)',
          border: '1px solid rgba(204,0,0,0.2)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(204,0,0,0.08)',
        }}
      >
        {/* Command Red top accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, #CC0000, #FFBF00, #CC0000, transparent)' }} />
        {/* Command Red left glow edge */}
        <div className="absolute left-0 top-8 bottom-8 w-0.5 rounded-full"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(239,68,68,0.6), transparent)' }} />

        <SidebarContent onNav={() => {}} />
      </motion.aside>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 z-[70] flex flex-col overflow-hidden"
              style={{
                background: 'rgba(8, 6, 24, 0.97)',
                borderRight: '1px solid rgba(204,0,0,0.25)',
                boxShadow: '4px 0 40px rgba(0,0,0,0.8)',
              }}>
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #CC0000, #FFBF00, #CC0000, transparent)' }} />

              {/* Close button */}
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {/* Profile section at top */}
              {profile && (
                <Link to={`/AdventurerProfile?name=${encodeURIComponent(profile.adventurer_name)}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-5 pt-8 pb-5 border-b border-red-900/30 group">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-amber-500/40 group-hover:border-amber-400 transition-colors"
                    style={{ boxShadow: '0 0 16px rgba(251,191,36,0.2)' }}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt={profile.adventurer_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-2xl font-black text-white">
                          {(profile.adventurer_name || '?').charAt(0).toUpperCase()}
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-amber-300 text-base truncate">{profile.adventurer_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <p className="text-[10px] text-red-400/70 mt-0.5 flex items-center gap-1">
                      View Profile <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </Link>
              )}

              {/* Nav items */}
              <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
                {NAV_ITEMS.map(({ label, page, icon: Icon }) => {
                  const badge = page === 'Messages' ? unreadCount : 0;
                  return (
                    <Link key={page} to={createPageUrl(page)} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-900/20 transition-all group"
                      style={{ border: '1px solid transparent' }}>
                      <div className="relative shrink-0">
                        <Icon className="w-5 h-5 group-hover:[filter:drop-shadow(0_0_6px_rgba(239,68,68,0.9))]" />
                        {badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold">{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom: logout */}
              <div className="px-3 pb-6 border-t border-red-900/20 pt-3">
                {user ? (
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all group">
                    <LogOut className="w-5 h-5 group-hover:[filter:drop-shadow(0_0_5px_rgba(239,68,68,0.8))]" />
                    <span className="text-sm font-semibold">Logout</span>
                  </button>
                ) : (
                  <button onClick={handleLogin}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-amber-400/80 hover:text-amber-300 hover:bg-amber-900/20 transition-all">
                    <LogIn className="w-5 h-5" />
                    <span className="text-sm font-semibold">Login</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TOP BAR (All Screens) ── */}
      <header className="fixed top-0 w-full h-16 z-[100] px-4 bg-[#05050A] grid grid-cols-3 items-center">
        <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #CC0000, #FFBF00, #CC0000, transparent)', boxShadow: '0 2px 10px rgba(204,0,0,0.5)' }} />

        {/* Left: Hamburger */}
        <div className="flex justify-start">
          <button onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Logo */}
        <div className="flex justify-center">
          <Link to={createPageUrl('QuestBoard')} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden"
              style={{ border: '1px solid rgba(255,191,0,0.5)', boxShadow: '0 0 10px rgba(255,191,0,0.25)' }}>
              <img src="https://media.base44.com/images/public/699740722645ce51e91244be/097d3b10a_IMG-20260306-WA0005.jpg" alt="HME Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-base" style={{ background: 'linear-gradient(90deg, #CC0000, #FFBF00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HME</span>
          </Link>
        </div>

        {/* Right: Bell then Avatar */}
        <div className="flex justify-end items-center gap-4 pr-2">
          {profile && <NotificationCenter profile={profile} />}
          {profile && (
            <Link to={`/AdventurerProfile?name=${encodeURIComponent(profile.adventurer_name)}`}
              className="w-7 h-7 rounded-full overflow-hidden border border-amber-500/40 hover:border-amber-400 transition-colors"
              style={{ boxShadow: '0 0 8px rgba(251,191,36,0.15)' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.adventurer_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-xs font-black text-white">
                    {(profile.adventurer_name || '?').charAt(0).toUpperCase()}
                  </div>
              }
            </Link>
          )}
        </div>
      </header>

      {/* ── MOBILE FLOATING BOTTOM DOCK ── */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around px-3 py-2 rounded-2xl"
        style={{
          backdropFilter: 'blur(24px) saturate(2)',
          WebkitBackdropFilter: 'blur(24px) saturate(2)',
          background: 'rgba(8, 6, 24, 0.82)',
          border: '1px solid rgba(204,0,0,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(204,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
        {NAV_ITEMS.slice(0, 6).map(({ label, page, icon: Icon }) => {
          const active = currentPageName === page;
          const badge = page === 'Messages' ? unreadCount : 0;
          return (
            <Link key={page} to={createPageUrl(page)}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-300"
              style={active ? { color: '#FFBF00', filter: 'drop-shadow(0 0 6px rgba(255,191,0,0.7))' } : { color: 'rgba(148,163,184,0.7)' }}>
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[8px] font-semibold tracking-wide">{label.split(' ')[0]}</span>
              {active && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-amber-400" />}
            </Link>
          );
        })}
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 relative z-10 md:pl-24 pt-16 md:pt-16 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      <MessageToast currentPageName={currentPageName} />
      </div>
    </AdventurerContext.Provider>
  );
}