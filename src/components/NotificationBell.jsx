import { useState, useEffect } from 'react';
import { Bell, X, Scroll, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const [quests, setQuests] = useState([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => {
    return localStorage.getItem('questboard_last_seen') || new Date(0).toISOString();
  });

  const loadNew = async () => {
    const data = await base44.entities.Quest.list('-created_date', 20);
    setQuests(data);
  };

  useEffect(() => {
    loadNew();
    // Real-time subscription
    const unsub = base44.entities.Quest.subscribe((event) => {
      if (event.type === 'create') {
        setQuests(prev => [event.data, ...prev]);
      }
    });
    return unsub;
  }, []);

  const newQuests = quests.filter(q => q.created_date > lastSeen);
  const unreadCount = newQuests.length;

  const markAllRead = () => {
    const now = new Date().toISOString();
    setLastSeen(now);
    localStorage.setItem('questboard_last_seen', now);
  };

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const handleClose = () => {
    setOpen(false);
    markAllRead();
  };

  const recentQuests = quests.slice(0, 8);

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative p-2.5 rounded-xl border-2 transition-all duration-300",
          unreadCount > 0
            ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
            : "bg-purple-900/30 border-purple-700/40 text-purple-400 hover:border-purple-500"
        )}
      >
        <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 border-2 border-[#0d0d1a] flex items-center justify-center"
          >
            <span className="text-[9px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={handleClose} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 z-50 rounded-xl border-2 border-purple-800/60 overflow-hidden shadow-2xl shadow-purple-900/40"
              style={{ background: 'linear-gradient(135deg, #0d0d1a, #0f0d22)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-purple-800/40 bg-purple-950/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-300" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem' }}>
                    New Quests
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-black text-white">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <button onClick={handleClose} className="text-purple-500 hover:text-purple-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quest list */}
              <div className="max-h-80 overflow-y-auto">
                {recentQuests.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-600 gap-2">
                    <Scroll className="w-8 h-8 opacity-40" />
                    <span className="text-xs">No quests yet...</span>
                  </div>
                ) : (
                  recentQuests.map(q => {
                    const isNew = q.created_date > lastSeen;
                    return (
                      <div key={q.id} className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b border-purple-900/30 transition-colors",
                        isNew ? "bg-amber-500/5" : "hover:bg-purple-900/20"
                      )}>
                        <div className={cn(
                          "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black border mt-0.5",
                          isNew
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                            : "bg-purple-900/50 border-purple-700/40 text-purple-300"
                        )}>
                          {q.quest_giver?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isNew && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                            <p className="text-sm font-semibold text-purple-100 truncate" style={{ fontFamily: "'Caveat', cursive" }}>
                              {q.title}
                            </p>
                          </div>
                          <p className="text-[10px] text-purple-500/80 truncate">{q.quest_giver} · {q.segment}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(q.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="w-full py-2.5 text-xs text-purple-500 hover:text-purple-300 hover:bg-purple-900/30 transition-colors font-medium border-t border-purple-900/40">
                  Mark all as read
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}