import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { MessageCircle, User, Rss, LogOut, LogIn, Menu, X, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Custom SVG icons
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

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadUnread(u.email);
    }).catch(() => {});
  }, []);

  const loadUnread = async (email) => {
    const msgs = await base44.entities.Message.filter({ recipient_email: email, read: false });
    setUnreadCount(msgs.length);
  };

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.recipient_email === user.email) {
        setUnreadCount(c => c + 1);
      }
    });
    return unsub;
  }, [user]);

  const navItems = [
    { label: 'Quest Board', page: 'QuestBoard', icon: SwordsIcon },
    { label: 'News Feed', page: 'NewsFeed', icon: Rss },
    { label: 'Hall of Fame', page: 'CompletedQuests', icon: Trophy },
    { label: 'Messages', page: 'Messages', icon: MessageCircle, badge: unreadCount },
    { label: 'My Adventurer', page: 'MyAdventurer', icon: User },
  ];

  const handleLogin = () => base44.auth.redirectToLogin(window.location.pathname);
  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #04030f 0%, #08051a 35%, #060b18 65%, #040809 100%)' }}>

      {/* ── NAVIGATION ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: 'rgba(6, 4, 18, 0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 0 rgba(168,85,247,0.08), 0 4px 24px rgba(0,0,0,0.5)',
        }}>

        {/* Top accent line — Command Red */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #dc2626 20%, #fbbf24 50%, #dc2626 80%, transparent 100%)' }} />

        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link to={createPageUrl('QuestBoard')} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7f1d1d, #4c1d95)', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 0 12px rgba(251,191,36,0.2)' }}>
              <span className="text-amber-400 font-black text-sm">⚔</span>
            </div>
            <span className="font-cinzel font-black text-lg tracking-wide"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HME
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, page, icon: Icon, badge }) => {
              const active = currentPageName === page;
              return (
                <Link key={page} to={createPageUrl(page)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200",
                    active
                      ? "text-amber-300"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                  style={active ? {
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.18)',
                    boxShadow: '0 0 12px rgba(251,191,36,0.1)',
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                      style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                  {active && <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'rgba(251,191,36,0.05)' }} />}
                </Link>
              );
            })}
          </div>

          {/* Right: user */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-slate-500 max-w-[120px] truncate font-medium">{user.full_name || user.email}</span>
                <button onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 transition-all"
                  style={{ background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <button onClick={handleLogin}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-amber-400 hover:text-amber-300 transition-all font-semibold"
                style={{ background: 'rgba(120,53,15,0.2)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
            )}
            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 text-slate-400 hover:text-slate-200 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,4,18,0.97)' }}>
              <div className="px-4 py-3 space-y-1">
                {navItems.map(({ label, page, icon: Icon, badge }) => (
                  <Link key={page} to={createPageUrl(page)}
                    onClick={() => setMobileOpen(false)}
                    className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all font-medium">
                    <Icon className="w-4 h-4" />
                    {label}
                    {badge > 0 && <span className="ml-auto bg-red-500 text-white text-[9px] font-black rounded-full px-1.5">{badge}</span>}
                  </Link>
                ))}
                <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {user ? (
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/20 rounded-xl transition-all">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  ) : (
                    <button onClick={handleLogin} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-900/20 rounded-xl transition-all">
                      <LogIn className="w-4 h-4" /> Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}