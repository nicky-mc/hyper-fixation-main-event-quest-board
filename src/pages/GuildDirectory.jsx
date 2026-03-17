import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Users, Star, MapPin, Sword } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import OnlineDot from '@/components/OnlineDot';
import { cn } from '@/lib/utils';

export default function GuildDirectory() {
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AdventurerProfile.list('adventurer_name', 200)
      .then(data => { setProfiles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      p.adventurer_name?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen w-full relative"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>

      {/* LCARS side bars */}
      <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-40 pointer-events-none z-40" />

      <div className="flex w-full items-start gap-[2px] px-4 pb-12 relative">
        {/* Left spine */}
        <div className="hidden md:flex flex-col w-24 lg:w-32 bg-amber-500 rounded-l-[4rem] rounded-br-[2rem] shrink-0 sticky top-16 self-start h-[85vh] z-40 border-r-8 border-black" />

        <div className="flex-1 flex flex-col min-w-0 gap-1">
          {/* LCARS top arm */}
          <div className="hidden md:flex h-12 bg-amber-500 rounded-r-[4rem] rounded-tl-[2rem] items-center px-6 shrink-0 sticky top-16 z-40 shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            <span className="font-lcars text-black text-xl font-black tracking-widest">GUILD ROSTER — DIRECTORY</span>
          </div>

          <div className="flex-1 flex flex-col gap-4 relative z-20 pt-4">

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search the Guild Roster..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/50 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 font-lcars text-sm tracking-wide backdrop-blur-md transition-colors"
              />
            </div>

            {/* Count */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-800/50 to-transparent" />
              <span className="font-lcars text-[10px] text-purple-500 uppercase tracking-widest px-2">
                {loading ? 'Scanning...' : `${filteredProfiles.length} Adventurer${filteredProfiles.length !== 1 ? 's' : ''} Found`}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-800/50 to-transparent" />
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="py-20 text-center text-slate-600 flex flex-col items-center gap-3">
                <Users className="w-10 h-10 opacity-20" />
                <p className="font-lcars text-sm uppercase tracking-widest">No adventurers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProfiles.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="rounded-2xl border border-amber-400/15 bg-black/50 backdrop-blur-md overflow-hidden hover:border-amber-400/40 transition-all group hover-lift"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  >
                    {/* Card top accent */}
                    <div className="h-1 bg-gradient-to-r from-purple-600 via-amber-500 to-cyan-500 opacity-60" />

                    <div className="p-4 flex flex-col gap-3">
                      {/* Avatar + online */}
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/30 group-hover:border-amber-400/60 transition-colors"
                            style={{ boxShadow: '0 0 12px rgba(251,191,36,0.1)' }}>
                            {p.avatar_url
                              ? <img src={p.avatar_url} alt={p.adventurer_name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 flex items-center justify-center text-2xl font-black text-white">
                                  {(p.adventurer_name || '?').charAt(0).toUpperCase()}
                                </div>
                            }
                          </div>
                          <OnlineDot lastActive={p.last_active} className="absolute bottom-0 right-0" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-black text-amber-300 text-base truncate leading-tight">{p.adventurer_name}</p>
                          <span className={cn(
                            "inline-block text-[9px] font-lcars px-2 py-0.5 rounded-full uppercase tracking-widest mt-0.5",
                            p.role === 'admin'
                              ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                              : "bg-purple-900/40 border border-purple-700/30 text-purple-400"
                          )}>
                            {p.role === 'admin' ? '⚡ Admin' : '⚔️ Adventurer'}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="space-y-1 text-xs text-slate-500 min-h-[2rem]">
                        {p.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                            <span className="truncate">{p.location}</span>
                          </div>
                        )}
                        {p.favorite_segment && (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{p.favorite_segment}</span>
                          </div>
                        )}
                        {p.bio && !p.location && !p.favorite_segment && (
                          <p className="text-slate-600 italic line-clamp-2">{p.bio}</p>
                        )}
                      </div>

                      {/* View Profile button */}
                      <Link
                        to={createPageUrl('AdventurerProfile') + '?name=' + encodeURIComponent(p.adventurer_name)}
                        className="font-lcars w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-purple-700/40 bg-purple-900/20 text-purple-300 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300"
                      >
                        <Sword className="w-3 h-3" /> View Profile
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}