import { useState, useEffect } from 'react';
import { Bell, X, UserPlus, ChevronUp, MessageCircle, CheckCheck, Radio, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';

// Module-level cache to avoid re-fetching on every navigation
const cache = { data: null, profileId: null, ts: 0 };
const CACHE_TTL_MS = 2 * 60 * 1000;

const TYPE_CONFIG = {
  wall_post:      { icon: Radio,          color: 'text-cyan-400',   bg: 'bg-cyan-900/40 border-cyan-700/50',   dot: 'bg-cyan-400' },
  post_comment:   { icon: MessageSquare,  color: 'text-purple-400', bg: 'bg-purple-900/40 border-purple-700/50', dot: 'bg-purple-400' },
  quest_vote:     { icon: ChevronUp,      color: 'text-amber-400',  bg: 'bg-amber-900/40 border-amber-700/50', dot: 'bg-amber-400' },
  friend_request: { icon: UserPlus,       color: 'text-cyan-400',   bg: 'bg-cyan-900/60 border-cyan-700/50',   dot: 'bg-cyan-400' },
  message:        { icon: MessageCircle,  color: 'text-purple-400', bg: 'bg-purple-900/60 border-purple-700/50', dot: 'bg-purple-400' },
};

export default function NotificationCenter({ profile }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  // Legacy: friend requests & unread messages still fetched separately for instant feel
  const [friendRequests, setFriendRequests] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [lastSeen, setLastSeen] = useState(
    () => localStorage.getItem('notif_last_seen') || new Date(0).toISOString()
  );

  useEffect(() => {
    if (!profile) return;
    const now = Date.now();
    const cacheValid = cache.profileId === profile.id && (now - cache.ts) < CACHE_TTL_MS;
    if (!cacheValid) loadAll();

    const unsubFriendship = base44.entities.Friendship.subscribe(e => {
      if (e.type === 'create' && e.data?.recipient_id === profile.id && e.data?.status === 'pending') {
        setFriendRequests(prev => [e.data, ...prev]);
      }
      if (e.type === 'update' || e.type === 'delete') {
        const removedId = e.data?.id || e.id;
        setFriendRequests(prev => prev.filter(r => r.id !== removedId));
      }
    });

    const unsubMsg = base44.entities.Message.subscribe(e => {
      if (e.type === 'create' && e.data?.recipient_id === profile.id && !e.data?.read) {
        setUnreadMessages(c => c + 1);
      }
    });

    const unsubNotif = base44.entities.Notification.subscribe(e => {
      if (e.type === 'create' && e.data?.target_auth_id === profile.auth_id && !e.data?.is_read) {
        setNotifications(prev => [e.data, ...prev]);
      }
    });

    return () => { unsubFriendship(); unsubMsg(); unsubNotif(); };
  }, [profile?.id]);

  const loadAll = async () => {
    const [myBlocks, theirBlocks] = await Promise.all([
      base44.entities.BlockedUser.filter({ blocker_id: profile.id }),
      base44.entities.BlockedUser.filter({ blocked_id: profile.id }),
    ]);
    const ids = new Set([
      ...myBlocks.map(b => b.blocked_id),
      ...theirBlocks.map(b => b.blocker_id),
    ]);
    setBlockedIds(ids);

    const [requests, msgs, notifs] = await Promise.all([
      base44.entities.Friendship.filter({ recipient_id: profile.id, status: 'pending' }),
      base44.entities.Message.filter({ recipient_id: profile.id, read: false }),
      base44.entities.Notification.filter({ target_auth_id: profile.auth_id, is_read: false }, '-created_date', 50),
    ]);

    const filteredRequests = requests.filter(r => !ids.has(r.requester_id));
    const filteredMsgCount = msgs.filter(m => !ids.has(m.sender_id)).length;

    setFriendRequests(filteredRequests);
    setUnreadMessages(filteredMsgCount);
    setNotifications(notifs);

    cache.data = { friendRequests: filteredRequests, unreadMessages: filteredMsgCount, notifications: notifs, blockedIds: ids };
    cache.profileId = profile.id;
    cache.ts = Date.now();
  };

  const totalCount = friendRequests.length + unreadMessages + notifications.length;

  const markNotifRead = async (notif) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    await base44.entities.Notification.update(notif.id, { is_read: true });
    setOpen(false);
    if (notif.link_url) navigate(notif.link_url);
  };

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setLastSeen(now);
    localStorage.setItem('notif_last_seen', now);
    setUnreadMessages(0);
    // Mark all Notification records as read
    await Promise.all(notifications.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications([]);
    setOpen(false);
  };

  if (!profile) return null;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative p-2.5 rounded-xl border-2 transition-all duration-300",
          totalCount > 0
            ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
            : "bg-purple-900/30 border-purple-700/40 text-purple-400 hover:border-purple-500"
        )}
      >
        <Bell className={cn("w-5 h-5", totalCount > 0 && "animate-pulse")} />
        {totalCount > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 border-2 border-[#0d0d1a] flex items-center justify-center"
            style={{ boxShadow: '0 0 8px rgba(239,68,68,0.7)' }}>
            <span className="text-[9px] font-black text-white">{totalCount > 9 ? '9+' : totalCount}</span>
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
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
                  <span className="font-lcars text-sm font-bold text-amber-300 tracking-widest uppercase">Comm-Badge</span>
                  {totalCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-black text-white">
                      {totalCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="text-purple-500 hover:text-purple-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List */}
              <div className="max-h-96 overflow-y-auto divide-y divide-purple-900/30">
                {totalCount === 0 ? (
                  <div className="flex flex-col items-center py-10 text-slate-600 gap-2">
                    <Bell className="w-8 h-8 opacity-20" />
                    <span className="font-lcars text-[10px] uppercase tracking-widest">All channels clear</span>
                  </div>
                ) : (
                  <>
                    {/* Notification entity items (wall posts, comments, votes) */}
                    {notifications.map(notif => {
                      const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.message;
                      const Icon = cfg.icon;
                      return (
                        <button key={notif.id} onClick={() => markNotifRead(notif)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-900/20 transition-colors text-left">
                          <div className={cn("w-8 h-8 rounded-full border flex items-center justify-center shrink-0", cfg.bg)}>
                            <Icon className={cn("w-4 h-4", cfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-purple-100 truncate">
                              {notif.actor_name && <span className="text-amber-300">{notif.actor_name} </span>}
                              {notif.content}
                            </p>
                            {notif.created_date && (
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                        </button>
                      );
                    })}

                    {/* Friend requests */}
                    {friendRequests.map(req => (
                      <Link key={req.id} to={createPageUrl('Friends')} onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-purple-900/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-cyan-900/60 border border-cyan-700/50 flex items-center justify-center shrink-0">
                          <UserPlus className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-purple-100 truncate">
                            <span className="text-cyan-300">{req.requester_name}</span> sent you a friend request
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {formatDistanceToNow(new Date(req.created_date), { addSuffix: true })}
                          </p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      </Link>
                    ))}

                    {/* Unread messages */}
                    {unreadMessages > 0 && (
                      <Link to={createPageUrl('Messages')} onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-purple-900/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-700/50 flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-purple-100">
                            {unreadMessages} unread message{unreadMessages !== 1 ? 's' : ''}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">Tap to open messages</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                      </Link>
                    )}
                  </>
                )}
              </div>

              {totalCount > 0 && (
                <button onClick={markAllRead}
                  className="w-full py-2.5 text-xs text-purple-500 hover:text-purple-300 hover:bg-purple-900/30 transition-colors font-medium border-t border-purple-900/40 flex items-center justify-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}