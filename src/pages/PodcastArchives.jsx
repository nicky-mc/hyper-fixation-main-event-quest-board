import { useState, useEffect, useContext, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { AudioContext } from '@/layout';
import { Play, Upload, Loader2, Headphones, Mic, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PodcastArchives() {
  const { activeEpisode, setActiveEpisode } = useContext(AudioContext);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadEpisodes();
  }, []);

  const loadEpisodes = async () => {
    const data = await base44.entities.PodcastEpisode.list('-created_date', 100);
    setEpisodes(data);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!audioFile || !title) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
    await base44.entities.PodcastEpisode.create({
      title,
      description,
      audio_url: file_url,
      season: season ? Number(season) : undefined,
      episode_number: episodeNumber ? Number(episodeNumber) : undefined,
    });
    setTitle(''); setDescription(''); setSeason(''); setEpisodeNumber('');
    setAudioFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setUploading(false);
    loadEpisodes();
  };

  const isAdmin = user?.role === 'admin';

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
            <span className="font-lcars text-black text-xl font-black tracking-widest">THE ARCHIVES — EPISODE LOG</span>
          </div>

          <div className="flex-1 flex flex-col gap-6 relative z-20 pt-4">

            {/* ── ADMIN UPLOADER ── */}
            {isAdmin && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-500/30 bg-black/50 backdrop-blur-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-red-600 via-amber-400 to-purple-500" />
                <div className="px-5 py-4 border-b border-amber-800/30 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-amber-400" />
                  <span className="font-lcars text-base font-black text-amber-300 tracking-widest uppercase">Upload New Episode</span>
                </div>
                <form onSubmit={handleUpload} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="font-lcars text-[10px] text-purple-400 uppercase tracking-widest block mb-1">Episode Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. The Greenland Shark Anomaly"
                      className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-lcars text-[10px] text-purple-400 uppercase tracking-widest block mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Episode summary..."
                      className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 text-sm resize-none" />
                  </div>
                  <div>
                    <label className="font-lcars text-[10px] text-purple-400 uppercase tracking-widest block mb-1">Season</label>
                    <input type="number" value={season} onChange={e => setSeason(e.target.value)} placeholder="1"
                      className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 text-sm" />
                  </div>
                  <div>
                    <label className="font-lcars text-[10px] text-purple-400 uppercase tracking-widest block mb-1">Episode Number</label>
                    <input type="number" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} placeholder="42"
                      className="w-full px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-lcars text-[10px] text-purple-400 uppercase tracking-widest block mb-1">Audio File * (MP3 / WAV)</label>
                    <input ref={fileRef} type="file" accept="audio/mp3,audio/mpeg,audio/wav,audio/*" required
                      onChange={e => setAudioFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-purple-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500/20 file:text-amber-300 file:font-bold file:text-xs file:uppercase file:tracking-widest hover:file:bg-amber-500/30 file:cursor-pointer cursor-pointer" />
                    {audioFile && (
                      <p className="text-[10px] text-green-400 mt-1 font-lcars">◈ {audioFile.name}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" disabled={uploading || !audioFile || !title}
                      className="font-lcars flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-700 to-orange-600 text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 hover:from-red-600 hover:to-orange-500 transition-all"
                      style={{ boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
                      {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Transmit Episode</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── EPISODE LIST ── */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-800/50 to-transparent" />
                <span className="font-lcars text-[10px] text-purple-500 uppercase tracking-widest px-2">
                  {loading ? 'Scanning archives...' : `${episodes.length} Episode${episodes.length !== 1 ? 's' : ''} Logged`}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-800/50 to-transparent" />
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : episodes.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3 text-slate-600">
                  <Headphones className="w-10 h-10 opacity-20" />
                  <p className="font-lcars text-sm uppercase tracking-widest">No episodes in the archive yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {episodes.map((ep, i) => {
                    const isActive = activeEpisode?.id === ep.id;
                    return (
                      <motion.div key={ep.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn(
                          "rounded-2xl border overflow-hidden transition-all",
                          isActive
                            ? "border-amber-500/60 bg-amber-950/20"
                            : "border-purple-800/30 bg-black/40 hover:border-purple-600/50"
                        )}
                        style={isActive ? { boxShadow: '0 0 20px rgba(251,191,36,0.15)' } : {}}
                      >
                        {/* Top accent */}
                        <div className={cn("h-0.5", isActive
                          ? "bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"
                          : "bg-gradient-to-r from-purple-800/40 via-purple-600/40 to-purple-800/40"
                        )} />

                        <div className="flex items-center gap-4 px-5 py-4">
                          {/* Episode number block */}
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border font-lcars",
                            isActive
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                              : "bg-purple-900/30 border-purple-700/40 text-purple-400"
                          )}>
                            {ep.season && <span className="text-[8px] tracking-widest">S{ep.season}</span>}
                            <span className="text-lg font-black leading-none">
                              {ep.episode_number ?? '—'}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-black text-base truncate", isActive ? "text-amber-300" : "text-purple-100")}>
                              {ep.title}
                            </p>
                            {ep.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ep.description}</p>
                            )}
                            {isActive && (
                              <p className="font-lcars text-[9px] text-green-400 mt-1 uppercase tracking-widest animate-pulse">◈ Now Playing</p>
                            )}
                          </div>

                          {/* Play button */}
                          <button
                            onClick={() => setActiveEpisode(isActive ? null : ep)}
                            className={cn(
                              "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 transition-all",
                              isActive
                                ? "bg-amber-500/30 border-amber-500 text-amber-300 hover:bg-red-900/40 hover:border-red-500 hover:text-red-300"
                                : "bg-purple-900/40 border-purple-600/50 text-purple-300 hover:bg-red-900/30 hover:border-red-500/70 hover:text-red-300"
                            )}
                            style={isActive ? { boxShadow: '0 0 16px rgba(251,191,36,0.3)' } : {}}
                          >
                            {isActive
                              ? <Pause className="w-4 h-4 fill-current" />
                              : <Play className="w-4 h-4 fill-current ml-0.5" />
                            }
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}