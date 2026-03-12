import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, UserPlus, UserCheck, Clock, Loader2, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

function Avatar({ name, src }) {
  return (
    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-purple-600/40">
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 flex items-center justify-center text-xl font-black text-white">
          {(name || '?').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function UserCard({ profile, friendStatus, onAdd }) {
  const [status, setStatus] = useState(friendStatus);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await onAdd();
    setStatus('pending');
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all"
      style={{ background: 'rgba(15,8,35,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}>
      <Avatar name={profile.adventurer_name} src={profile.avatar_url} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-purple-100 text-sm truncate" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {profile.adventurer_name}
        </p>
        {profile.location && (
          <p className="text-[11px] text-slate-500 mt-0.5">{profile.location}</p>
        )}
        {profile.favorite_segment && (
          <p className="text-[11px] text-purple-500/70 mt-0.5 truncate">{profile.favorite_segment}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(profile.adventurer_name)}`}
          className="px-3 py-2 rounded-xl text-xs font-bold text-purple-300 transition-all min-h-[44px] flex items-center"
          style={{ background: 'rgba(88,28,220,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
          Profile
        </Link>
        {status === 'friends' ? (
          <span className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-purple-400 min-h-[44px]"
            style={{ background: 'rgba(88,28,220,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <UserCheck className="w-3.5 h-3.5" />
          </span>
        ) : status === 'pending' ? (
          <span className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 min-h-[44px]"
            style={{ background: 'rgba(88,28,220,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <Clock className="w-3.5 h-3.5" />
          </span>
        ) : profile._canAdd ? (
          <button onClick={handleAdd} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all min-h-[44px] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function Discover() {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadData(u);
    }).catch(() => setLoading(false));
  }, []);

  const loadData = async (u) => {
    setLoading(true);
    const myName = u ? (u.full_name || u.email) : null;
    const [allProfiles, sentFs, receivedFs] = await Promise.all([
      base44.entities.AdventurerProfile.list('adventurer_name', 500),
      u ? base44.entities.Friendship.filter({ requester_email: u.email }) : Promise.resolve([]),
      u ? base44.entities.Friendship.filter({ recipient_email: u.email }) : Promise.resolve([]),
    ]);

    // Exclude self
    const merged = allProfiles
      .filter(p => p.adventurer_name !== myName)
      .map(p => ({
        id: p.id,
        adventurer_name: p.adventurer_name,
        avatar_url: p.avatar_url,
        location: p.location,
        favorite_segment: p.favorite_segment,
        created_by: p.created_by,
        _canAdd: !!u,
      }));

    setProfiles(merged);
    setFriendships([...sentFs, ...receivedFs]);
    setLoading(false);
  };

  const getFriendStatus = (profile) => {
    const f = friendships.find(fs =>
      (fs.requester_email === user?.email && fs.recipient_name === profile.adventurer_name) ||
      (fs.recipient_email === user?.email && fs.requester_name === profile.adventurer_name)
    );
    if (!f) return 'none';
    return f.status === 'accepted' ? 'friends' : 'pending';
  };

  const sendRequest = async (profile) => {
    const myName = user.full_name || user.email;
    await base44.entities.Friendship.create({
      requester_email: user.email,
      requester_name: myName,
      recipient_name: profile.adventurer_name,
      recipient_email: profile.created_by || '',
      status: 'pending',
    });
  };

  const filtered = profiles.filter(p =>
    !query.trim() ||
    p.adventurer_name?.toLowerCase().includes(query.toLowerCase()) ||
    p.location?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-16 relative"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>

      {/* Ambient */}
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />
      <div className="fixed top-0 left-1/3 w-96 h-96 rounded-full pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="relative max-w-2xl mx-auto px-4 pt-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(88,28,220,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Compass className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400"
                style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.2rem, 4vw, 1.7rem)' }}>
                DISCOVER
              </h1>
              <p className="text-slate-500 text-xs" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                Find adventurers across the realm
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by adventurer name or location..."
            autoFocus
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none transition-all"
            style={{
              background: 'rgba(15,8,35,0.85)',
              border: '1px solid rgba(139,92,246,0.25)',
              fontFamily: "'Inter', system-ui",
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.55)'}
            onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.25)'}
          />
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-slate-600 mb-4 px-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            {filtered.length} adventurer{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No adventurers found.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((profile, i) => (
                <motion.div key={profile.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}>
                  <UserCard
                    profile={{ ...profile, _canAdd: !!user }}
                    friendStatus={user ? getFriendStatus(profile) : 'none'}
                    onAdd={() => sendRequest(profile)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}