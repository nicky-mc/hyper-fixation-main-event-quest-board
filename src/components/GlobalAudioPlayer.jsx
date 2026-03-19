import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlobalAudioPlayer({ currentTrack }) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // When track changes, load and auto-play
  useEffect(() => {
    if (!audioRef.current) return;
    if (!currentTrack) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    audioRef.current.src = currentTrack.audio_url;
    audioRef.current.load();
    setCurrentTime(0);
    setDuration(0);
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    setMuted(next);
    audioRef.current.muted = next;
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = duration ? currentTime / duration : 0;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      <div
        className="fixed bottom-0 left-0 w-full z-[200] border-t border-purple-500/40"
        style={{
          background: 'rgba(8, 5, 16, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 30px rgba(139, 92, 246, 0.15)',
        }}
      >
        {/* LCARS top accent strip */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #CC0000, #FFBF00, #a855f7, #CC0000, transparent)' }} />

        {/* Progress bar */}
        <div ref={progressRef} onClick={handleSeek} className="w-full h-1 bg-purple-900/50 cursor-pointer">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #CC0000, #FFBF00)',
              boxShadow: '0 0 8px rgba(251,191,36,0.5)',
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* LCARS pill */}
          <div className="hidden sm:flex items-center shrink-0">
            <div className="w-12 h-7 rounded-full bg-amber-500/80 flex items-center justify-center"
              style={{ boxShadow: '0 0 10px rgba(251,191,36,0.3)' }}>
              <Radio className="w-3.5 h-3.5 text-black" />
            </div>
          </div>

          {/* Play / Pause */}
          <motion.button
            onClick={togglePlay}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-red-500/60 text-white"
            style={{
              background: 'radial-gradient(ellipse, #7f1d1d 0%, #450a0a 70%)',
              boxShadow: isPlaying ? '0 0 16px rgba(239,68,68,0.6)' : '0 0 8px rgba(239,68,68,0.2)',
            }}
          >
            {isPlaying
              ? <Pause className="w-4 h-4 fill-white" />
              : <Play className="w-4 h-4 fill-white ml-0.5" />
            }
          </motion.button>

          {/* Waveform visualizer */}
          {isPlaying && (
            <div className="hidden sm:flex items-end gap-[3px] h-8 shrink-0 px-2">
              {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((base, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{
                    background: `linear-gradient(to top, #06b6d4, #f59e0b)`,
                    boxShadow: '0 0 4px rgba(251,191,36,0.4)',
                  }}
                  animate={{
                    height: [
                      `${base * 12}px`,
                      `${Math.min(base * (16 + Math.random() * 16), 32)}px`,
                      `${base * 8}px`,
                      `${Math.min(base * (14 + Math.random() * 14), 32)}px`,
                      `${base * 12}px`,
                    ],
                  }}
                  transition={{
                    duration: 0.6 + i * 0.1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.08,
                  }}
                />
              ))}
              <div className="ml-1.5 flex flex-col justify-center">
                <span className="font-lcars text-[8px] text-cyan-400 uppercase tracking-widest animate-pulse leading-tight">
                  DECODING
                </span>
                <span className="font-lcars text-[8px] text-amber-500 uppercase tracking-widest animate-pulse leading-tight">
                  SIGNAL...
                </span>
              </div>
            </div>
          )}

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="font-lcars text-xs text-amber-300 font-bold truncate tracking-widest uppercase">
              {currentTrack.season && currentTrack.episode_number
                ? `S${currentTrack.season}E${currentTrack.episode_number} · `
                : ''
              }{currentTrack.title}
            </p>
            <p className="font-lcars text-[9px] text-slate-500 tracking-widest uppercase">
              {formatTime(currentTime)}{duration ? ` / ${formatTime(duration)}` : ''}
              {isPlaying && <span className="ml-2 text-green-400 animate-pulse">◈ ON AIR</span>}
            </p>
          </div>

          {/* Volume (desktop) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button onClick={toggleMute} className="text-purple-400 hover:text-amber-400 transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume} onChange={handleVolumeChange}
              className="w-20 h-1 accent-amber-400 cursor-pointer" />
          </div>

          {/* Expand toggle */}
          <button onClick={() => setExpanded(e => !e)}
            className="shrink-0 text-purple-500 hover:text-amber-400 transition-colors p-1">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-purple-900/40 px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <div className="flex gap-1 shrink-0">
                  {['bg-red-600', 'bg-amber-400', 'bg-cyan-500', 'bg-purple-500'].map((c, i) => (
                    <div key={i} className={cn("w-2 h-10 rounded-full", c)} style={{ opacity: 0.7 }} />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest mb-1">Now Playing</p>
                  <p className="font-lcars text-sm text-amber-300 font-black tracking-wide">{currentTrack.title}</p>
                  {currentTrack.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{currentTrack.description}</p>
                  )}
                  <p className="font-lcars text-[9px] text-slate-600 mt-1 uppercase tracking-widest">
                    The Hyper-Fixation Main Event · Podcast
                  </p>
                </div>
                {/* Mobile volume */}
                <div className="sm:hidden flex items-center gap-2">
                  <button onClick={toggleMute} className="text-purple-400">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input type="range" min="0" max="1" step="0.05"
                    value={muted ? 0 : volume} onChange={handleVolumeChange}
                    className="w-16 h-1 accent-amber-400 cursor-pointer" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}