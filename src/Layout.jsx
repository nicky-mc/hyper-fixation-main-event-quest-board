import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Swords, MessageCircle, User, Rss, LogOut, LogIn, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    { label: 'Quest Board', page: 'QuestBoard', icon: Swords },
    { label: 'News Feed', page: 'NewsFeed', icon: Rss },
    { label: 'Messages', page: 'Messages', icon: MessageCircle, badge: unreadCount },
    { label: 'My Adventurer', page: 'MyAdventurer', icon: User },
  ];

  const handleLogin = () => base44.auth.redirectToLogin(window.location.pathname);
  const handleLogout = () => base44.auth.logout('/');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-purple-900/40 bg-[#050510]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl('QuestBoard')} className="flex items-center gap-2 shrink-0">
            <span className="text-amber-400 font-black text-xl" style={{ fontFamily: "'Caveat', cursive" }}>⚔️ HME</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, page, icon: Icon, badge, extra }) => {
              const active = currentPageName === page;
              return (
                <Link key={page} to={createPageUrl(page) + (extra || '')}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    active ? "bg-purple-800/40 text-purple-200" : "text-purple-400 hover:text-purple-200 hover:bg-purple-900/30"
                  )}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-purple-400 max-w-[120px] truncate">{user.full_name || user.email}</span>
                <button onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-900/20 border border-red-900/30 hover:border-red-700/50 transition-all">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <button onClick={handleLogin}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-900/20 border border-amber-800/40 transition-all">
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
            )}
            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 text-purple-400">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-purple-900/40 bg-[#050510]/95">
              <div className="px-4 py-3 space-y-1">
                {navItems.map(({ label, page, icon: Icon, badge, extra }) => (
                  <Link key={page} to={createPageUrl(page) + (extra || '')}
                    onClick={() => setMobileOpen(false)}
                    className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-purple-300 hover:bg-purple-900/30 transition-all">
                    <Icon className="w-4 h-4" />
                    {label}
                    {badge > 0 && <span className="ml-auto bg-amber-500 text-black text-[9px] font-black rounded-full px-1.5">{badge}</span>}
                  </Link>
                ))}
                <div className="pt-2 border-t border-purple-900/40">
                  {user ? (
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-all">
                      <LogOut className="w-4 h-4" /> Logout ({user.full_name || user.email})
                    </button>
                  ) : (
                    <button onClick={handleLogin} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-900/20 rounded-lg transition-all">
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