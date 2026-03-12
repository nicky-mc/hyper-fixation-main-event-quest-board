import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Search, Users, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdventurersDirectory() {
  const [adventurers, setAdventurers] = useState([]);
  const [query, setQuery]             = useState('');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list('full_name', 200),
      base44.entities.AdventurerProfile.list('adventurer_name', 200),
    ]).then(([users, profiles]) => {
      // Build a map of profiles keyed by adventurer_name
      const profileMap = {};
      profiles.forEach(p => { profileMap[p.adventurer_name] = p; });

      // Merge: one entry per user, enriched with profile data if it exists
      const merged = users.map(u => {
        const name = u.full_name || u.email;
        const prof = profileMap[name] || {};
        return { id: u.id, name, email: u.email, avatar_url: prof.avatar_url, location: prof.location, favorite_segment: prof.favorite_segment };
      });

      setAdventurers(merged);
      setLoading(false);
    });
  }, []);

  const filtered = adventurers.filter(p =>
    !query || p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.location?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="w-6 h-6 text-purple-400" />
            <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400"
              style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>
              ADVENTURERS
            </h1>
          </div>
          <p className="text-slate-500 text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Find fellow questers and send friend requests
          </p>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or realm..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all duration-300"
            style={{
              background: 'rgba(8,6,24,0.7)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(168,85,247,0.2)', fontFamily: "'Exo 2', sans-serif",
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(168,85,247,0.2)'}
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-600">Scanning the realm...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-600">No adventurers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(p.adventurer_name)}`}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 group"
                  style={{
                    background: 'rgba(8,6,24,0.7)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(168,85,247,0.12)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)'}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-purple-600/30">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.adventurer_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-lg font-black text-white">
                        {p.adventurer_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                      {p.adventurer_name}
                    </p>
                    {p.location && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        <MapPin className="w-3 h-3" />{p.location}
                      </p>
                    )}
                    {p.favorite_segment && (
                      <p className="text-xs text-purple-500 flex items-center gap-1 mt-0.5 truncate" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        <Star className="w-3 h-3 shrink-0" />{p.favorite_segment}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}