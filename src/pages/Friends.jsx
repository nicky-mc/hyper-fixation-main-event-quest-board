import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, UserPlus, UserCheck, Clock, MessageCircle, Search, Users, CheckCircle2, X, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAdventurer } from '@/layout';

function Avatar({ name, src, size = 'lg', online }) {
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
  return (
    <div className="relative inline-block shrink-0">
      <div className={cn("rounded-full flex items-center justify-center font-black text-white overflow-hidden",
        "bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 border-2 border-purple-700/40", sizes[size])}>
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : (name || '?').charAt(0).toUpperCase()}
      </div>
      {online !== undefined && (
        <span className={cn("absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0518]",
          online ? "bg-green-400" : "bg-slate-600")} />
      )}
    </div>
  );
}

function FriendCard({ profile, mutual, onMessage, onRemove }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all group"
      style={{ background: 'rgba(15,8,35,0.7)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      <Avatar name={profile.adventurer_name || profile.name} src={profile.avatar_url} size="lg" online={Math.random() > 0.5} />
      <div className="text-center min-w-0 w-full">
        <p className="font-bold text-purple-100 truncate text-sm">{profile.adventurer_name || profile.name}</p>
        {mutual > 0 && <p className="text-[10px] text-slate-500 mt-0.5">{mutual} mutual friend{mutual !== 1 ? 's' : ''}</p>}
      </div>
      <div className="flex gap-2 w-full">
        <button onClick={onMessage}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-purple-200 transition-all hover:text-white min-h-[44px]"
          style={{ background: 'rgba(88,28,220,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <MessageCircle className="w-3.5 h-3.5" /> Message
        </button>
        <button onClick={onRemove}
          className="p-2 rounded-xl text-slate-600 hover:text-red-400 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ background: 'rgba(88,28,220,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <UserX className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function RequestCard({ req, onAccept, onDecline }) {
  const [loading, setLoading] = useState(false);
  const handle = async (fn) => { setLoading(true); await fn(); setLoading(false); };
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{ background: 'rgba(15,8,35,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}>
      <Avatar name={req.requester_name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-purple-100 text-sm truncate">{req.requester_name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Wants to be your friend</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => handle(onAccept)} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-green-300 transition-all min-h-[44px] disabled:opacity-50"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Confirm</span>
        </button>
        <button onClick={() => handle(onDecline)} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 transition-all min-h-[44px] disabled:opacity-50"
          style={{ background: 'rgba(88,28,220,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </motion.div>
  );
}

function SearchCard({ profile, friendStatus, onAdd }) {
  const [status, setStatus] = useState(friendStatus); // 'none' | 'pending' | 'friends'
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await onAdd();
    setStatus('pending');
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-2xl transition-all"
      style={{ background: 'rgba(15,8,35,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}>
      <Avatar name={profile.full_name || profile.email} src={profile.avatar_url} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-purple-100 text-sm truncate">{profile.full_name || profile.email}</p>
        {profile.location && <p className="text-[10px] text-slate-500">{profile.location}</p>}
      </div>
      {status === 'friends' ? (
        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-400"
          style={{ background: 'rgba(88,28,220,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <UserCheck className="w-3.5 h-3.5" /> Friends
        </span>
      ) : status === 'pending' ? (
        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500"
          style={{ background: 'rgba(88,28,220,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <Clock className="w-3.5 h-3.5" /> Sent
        </span>
      ) : (
        <button onClick={handleAdd} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all min-h-[44px] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          Add
        </button>
      )}
    </motion.div>
  );
}

const TABS = [
  { id: 'friends', label: 'All Friends', icon: Users },
  { id: 'pending', label: 'Requests', icon: Clock },
  { id: 'search', label: 'Find People', icon: Search },
];

export default function Friends() {
  const profile = useAdventurer();
  const [tab, setTab] = useState('friends');
  const [loading, setLoading] = useState(true);

  const [friends, setFriends] = useState([]);          // accepted friendship records
  const [friendProfiles, setFriendProfiles] = useState([]); // merged with AdventurerProfile
  const [pending, setPending] = useState([]);           // incoming pending requests
  const [allProfiles, setAllProfiles] = useState([]);
  const [friendships, setFriendships] = useState([]);   // all my friendships (both directions)

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile) loadAll(profile);
  }, [profile]);

  const loadAll = async (prof) => {
    setLoading(true);

    const isAdmin = prof.role === 'admin';
    const [sentFs, receivedFs, profiles, allPending] = await Promise.all([
      base44.entities.Friendship.filter({ requester_id: prof.id }),
      base44.entities.Friendship.filter({ recipient_id: prof.id }),
      base44.entities.AdventurerProfile.list('-created_date', 200),
      isAdmin ? base44.entities.Friendship.filter({ status: 'pending' }) : Promise.resolve([]),
    ]);

    const all = [...sentFs, ...receivedFs];
    setFriendships(all);

    const accepted = all.filter(f => f.status === 'accepted');
    // Admins see ALL pending requests platform-wide for moderation
    const incomingPending = isAdmin ? allPending : receivedFs.filter(f => f.status === 'pending');

    setFriends(accepted);
    setPending(incomingPending);
    setAllProfiles(profiles);

    // Build friend profile cards
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.id] = p; });

    const friendCards = accepted.map(f => {
      const friendId = f.requester_id === prof.id ? f.recipient_id : f.requester_id;
      return { ...(profileMap[friendId] || { id: friendId, adventurer_name: f.recipient_name || f.requester_name }), _friendship: f };
    });
    setFriendProfiles(friendCards);

    setLoading(false);
  };

  const acceptRequest = async (req) => {
    await base44.entities.Friendship.update(req.id, { status: 'accepted' });
    await loadAll(profile);
  };

  const declineRequest = async (req) => {
    await base44.entities.Friendship.delete(req.id);
    setPending(prev => prev.filter(r => r.id !== req.id));
  };

  const removeFriend = async (friendship) => {
    await base44.entities.Friendship.delete(friendship._friendship.id);
    setFriendProfiles(prev => prev.filter(f => f._friendship.id !== friendship._friendship.id));
  };

  const sendRequest = async (targetProfile) => {
    await base44.entities.Friendship.create({
      requester_id: profile.id,
      requester_name: profile.adventurer_name,
      recipient_id: targetProfile.id,
      recipient_name: targetProfile.adventurer_name,
      status: 'pending',
    });
  };

  const getFriendStatus = (targetId) => {
    const f = friendships.find(fs =>
      (fs.requester_id === profile?.id && fs.recipient_id === targetId) ||
      (fs.recipient_id === profile?.id && fs.requester_id === targetId)
    );
    if (!f) return 'none';
    if (f.status === 'accepted') return 'friends';
    return 'pending';
  };

  const getMutualCount = (friendName) => {
    const myFriendNames = friendProfiles.map(f => f.adventurer_name);
    // Simple approximation — count shared connections
    return 0; // Would need deeper query; placeholder
  };

  const profileMap = {};
  allProfiles.forEach(p => { profileMap[p.adventurer_name] = p; });

  // Search results powered by AdventurerProfile (accessible to all authenticated users)
  const myName = user?.full_name || user?.email;
  const searchResults = allProfiles
    .filter(p => p.adventurer_name !== myName) // exclude self
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (p.adventurer_name || '').toLowerCase().includes(q) ||
             (p.location || '').toLowerCase().includes(q) ||
             (p.email || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aStatus = getFriendStatus(a.email);
      const bStatus = getFriendStatus(b.email);
      if (aStatus === 'none' && bStatus !== 'none') return -1;
      if (aStatus !== 'none' && bStatus === 'none') return 1;
      return 0;
    });

  const pendingCount = pending.length;

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <Users className="w-10 h-10" />
      <p className="text-sm">Please log in to view friends.</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>

      <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />

      <div className="relative max-w-4xl mx-auto px-4 pt-6">

        <h1 className="text-3xl font-black text-amber-300 mb-6" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.5rem' }}>
          ⚔️ Adventurer Network
        </h1>

        {/* Sticky Tab Bar */}
        <div className="sticky top-0 z-30 mb-6 pt-1 pb-3"
          style={{ background: 'linear-gradient(180deg, #050510 80%, transparent 100%)' }}>
          <div className="flex gap-1 p-1 rounded-2xl"
            style={{ background: 'rgba(15,8,35,0.85)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(20px)' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              const badge = t.id === 'pending' ? pendingCount : 0;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] relative",
                    isActive ? "text-white" : "text-purple-500 hover:text-purple-300"
                  )}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
                  } : {}}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {/* ── ALL FRIENDS ── */}
            {tab === 'friends' && (
              <div>
                {friendProfiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(88,28,220,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <Users className="w-8 h-8 opacity-40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-500">No friends yet</p>
                      <p className="text-xs text-slate-700 mt-1">Search for adventurers to add them!</p>
                    </div>
                    <button onClick={() => setTab('search')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                      <Search className="w-4 h-4" /> Find People
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friendProfiles.map((fp, i) => (
                      <FriendCard key={fp._friendship.id} profile={fp} mutual={getMutualCount(fp.adventurer_name)}
                        onMessage={() => window.location.href = createPageUrl('Messages')}
                        onRemove={() => removeFriend(fp)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PENDING REQUESTS ── */}
            {tab === 'pending' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                {pending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-600">
                    <CheckCircle2 className="w-10 h-10 opacity-20" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {pending.map(req => (
                      <RequestCard key={req.id} req={req}
                        onAccept={() => acceptRequest(req)}
                        onDecline={() => declineRequest(req)} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* ── SEARCH ── */}
            {tab === 'search' && (
              <div className="max-w-2xl mx-auto">
                <div className="relative mb-5">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                    style={{ background: 'rgba(15,8,35,0.8)', border: '1px solid rgba(139,92,246,0.25)', fontFamily: "'Inter', system-ui" }}
                  />
                </div>

                {searchResults.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm">
                    {searchQuery.trim() ? 'No adventurers found.' : 'Start typing to search adventurers!'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map(p => (
                      <SearchCard key={p.id}
                        profile={{ full_name: p.adventurer_name, email: p.email || '', avatar_url: p.avatar_url, location: p.location }}
                        friendStatus={getFriendStatus(p.email)}
                        onAdd={() => sendRequest({ full_name: p.adventurer_name, email: p.email || '' })} />
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}