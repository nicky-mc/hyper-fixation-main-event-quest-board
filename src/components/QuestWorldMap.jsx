import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { X, Crosshair, Rocket, MapPin, Send, ArrowBigUp, Loader2, Settings } from 'lucide-react';
import ArtifactClaimButton from './ArtifactClaimButton';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useTheme, UI_TEXT } from '@/lib/ThemeContext';

// Canvas is 3000x3000px. Spread nodes across 10-90% using large primes to avoid clustering.
function getNodePercent(index) {
  const top  = 10 + ((index * 149) % 80);
  const left = 10 + ((index * 227) % 80);
  return { top, left };
}

export default function QuestWorldMap({ quests, onClose, targetQuest }) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { theme: globalTheme } = useTheme();

  // Derive local map style from global theme; user can still override with the bezel toggle
  const [mapTheme, setMapTheme] = useState(() =>
    globalTheme === 'fantasy' ? 'fantasy' : 'scifi'
  );
  const highContrast = globalTheme === 'high-contrast';
  const [showSettings, setShowSettings] = useState(false);

  const [activeNode, setActiveNode] = useState(null);
  const [zoom, setZoom] = useState(0.25);
  const [targetingId, setTargetingId] = useState(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const screenRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Motion values for smooth programmatic panning (compatible with drag)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Comment state
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [commentVotes, setCommentVotes] = useState([]);

  // Transition helpers — respect prefers-reduced-motion
  const warpTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 120, damping: 24 };

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 180, damping: 28 };

  const playerTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 40, damping: 12, mass: 0.8 };

  const handleZoom = (amt) => setZoom(prev => Math.max(0.15, Math.min(prev + amt, 2)));

  const resetView = () => {
    setZoom(0.25);
    animate(x, 0, springTransition);
    animate(y, 0, springTransition);
  };

  // Task 4: Keyboard Navigation — arrow keys pan, Escape closes
  const handleKeyDown = useCallback((e) => {
    const PAN = 150;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); animate(x, x.get() + PAN, { duration: 0.15 }); }
    if (e.key === 'ArrowRight') { e.preventDefault(); animate(x, x.get() - PAN, { duration: 0.15 }); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); animate(y, y.get() + PAN, { duration: 0.15 }); }
    if (e.key === 'ArrowDown')  { e.preventDefault(); animate(y, y.get() - PAN, { duration: 0.15 }); }
    if (e.key === 'Escape') onClose();
  }, [x, y, onClose]);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Load current user profile once
  useEffect(() => {
    base44.auth.me().then(async u => {
      if (!u) return;
      const profs = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
      if (profs[0]) setMyProfile(profs[0]);
    }).catch(() => {});
  }, []);

  // Auto-pan when targetQuest changes
  useEffect(() => {
    if (!targetQuest) return;

    const index = quests.findIndex(q => q.id === targetQuest.id);
    if (index === -1) return;

    const { top, left } = getNodePercent(index);
    const CANVAS = 3000;
    const targetZoom = 0.7;

    const nodeX = (left / 100) * CANVAS;
    const nodeY = (top / 100) * CANVAS;

    const offsetX = -(nodeX - CANVAS / 2) * targetZoom;
    const offsetY = -(nodeY - CANVAS / 2) * targetZoom;

    setZoom(targetZoom);
    animate(x, offsetX, warpTransition);
    animate(y, offsetY, warpTransition);
    setActiveNode(targetQuest);

    // Task 3: ARIA live announcement
    setLiveAnnouncement(`Targeting Sector ${targetQuest.title}... quest by ${targetQuest.quest_giver}. Prepare for warp.`);

    setTargetingId(targetQuest.id);
    const timer = setTimeout(() => setTargetingId(null), 2500);
    return () => clearTimeout(timer);
  }, [targetQuest?.id]);

  // Load comments + votes when activeNode changes
  useEffect(() => {
    if (!activeNode) { setComments([]); setCommentVotes([]); setCommentProfiles({}); return; }

    base44.entities.QuestComment.filter({ quest_id: activeNode.id }, '-created_date', 50)
      .then(async (fetched) => {
        setComments(fetched);
        const ids = [...new Set(fetched.map(c => c.adventurer_id).filter(Boolean))];
        const profileMap = {};
        await Promise.all(ids.map(async id => {
          const profs = await base44.entities.AdventurerProfile.filter({ id }).catch(() => []);
          if (profs[0]) profileMap[id] = profs[0];
        }));
        setCommentProfiles(profileMap);
      }).catch(() => {});

    base44.entities.CommentVote.filter({ quest_id: activeNode.id }, '-created_date', 200)
      .then(setCommentVotes).catch(() => setCommentVotes([]));
  }, [activeNode?.id, myProfile?.id]);

  const handleSendComment = async () => {
    if (!commentInput.trim() || !myProfile || sendingComment) return;
    setSendingComment(true);
    const newComment = await base44.entities.QuestComment.create({
      quest_id: activeNode.id,
      adventurer_id: myProfile.id,
      content: commentInput.trim(),
    });
    setComments(prev => [newComment, ...prev]);
    setCommentProfiles(prev => ({ ...prev, [myProfile.id]: myProfile }));
    setCommentInput('');
    setSendingComment(false);
  };

  const handleToggleVote = async (comment) => {
    if (!myProfile) return;
    const existing = commentVotes.find(v => v.comment_id === comment.id && v.adventurer_id === myProfile.id);
    if (existing) {
      await base44.entities.CommentVote.delete(existing.id);
      setCommentVotes(prev => prev.filter(v => v.id !== existing.id));
    } else {
      const newVote = await base44.entities.CommentVote.create({
        comment_id: comment.id,
        quest_id: activeNode.id,
        adventurer_id: myProfile.id,
      });
      setCommentVotes(prev => [...prev, newVote]);
    }
  };

  const navigateToProfile = (adventurerName) => {
    onClose();
    navigate(`/AdventurerProfile?name=${encodeURIComponent(adventurerName)}`);
  };

  const getVoteCount = (commentId) => commentVotes.filter(v => v.comment_id === commentId).length;
  const hasVoted = (commentId) => myProfile && commentVotes.some(v => v.comment_id === commentId && v.adventurer_id === myProfile.id);

  const txt = UI_TEXT[globalTheme] || UI_TEXT['sci-fi'];
  const hc = globalTheme === 'high-contrast';
  const isWrestling = globalTheme === 'wrestling';

  // Theme-derived style helpers
  const screenBg = hc ? 'bg-black' : (isWrestling ? 'bg-[#121212]' : 'bg-[#080510]');
  const bezelBg = hc ? 'bg-yellow-400' : (isWrestling ? 'bg-rose-700' : 'bg-amber-500');
  const panelBg = hc ? 'bg-black border-yellow-400' : (isWrestling ? 'bg-[#1e293b] border-rose-500/50' : 'bg-gradient-to-t md:bg-gradient-to-b from-[#0d0d1a] to-[#080510]/95 border-amber-500/50');

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quest World Map — navigate sectors and locate your next adventure"
    >
      {/* Task 3: ARIA live region — hidden visually, read by screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {liveAnnouncement}
      </div>

      {/* PADD Frame */}
      <div className="relative w-[95%] max-w-5xl h-[80vh] bg-black rounded-[2.5rem] border-4 border-amber-500 flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">

        {/* LCARS Bezel */}
        <div className={cn("w-full md:w-32 flex md:flex-col items-center justify-between p-4 shrink-0 z-50", bezelBg)}>
          <button
            onClick={onClose}
            aria-label="Exit the Quest Map"
            className="w-full py-2 bg-red-600 hover:bg-red-400 text-black font-black font-lcars text-xs rounded-full border-2 border-red-800 uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            EXIT
          </button>

          <div className="flex md:flex-col gap-2 my-4">
            <button
              onClick={() => handleZoom(0.1)}
              aria-label="Zoom in"
              className="w-10 h-10 bg-amber-700 hover:bg-white text-white hover:text-black font-bold rounded-lg border border-amber-900 transition-colors text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >+</button>
            <button
              onClick={() => handleZoom(-0.1)}
              aria-label="Zoom out"
              className="w-10 h-10 bg-amber-700 hover:bg-white text-white hover:text-black font-bold rounded-lg border border-amber-900 transition-colors text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >-</button>
            <button
              onClick={resetView}
              aria-label="Reset map view"
              className="w-10 h-10 bg-blue-900 hover:bg-blue-700 text-white rounded-lg border border-blue-950 text-[8px] uppercase transition-colors leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >FULL</button>
          </div>

          <button
            onClick={() => setMapTheme(prev => prev === 'scifi' ? 'fantasy' : 'scifi')}
            aria-label={`Switch to ${mapTheme === 'scifi' ? 'fantasy' : 'sci-fi'} map theme`}
            className="w-full py-2 bg-purple-900 hover:bg-purple-800 text-purple-200 font-bold font-lcars text-[10px] rounded-full border-2 border-purple-950 uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {mapTheme === 'scifi' ? 'FANTASY' : 'SCI-FI'}
          </button>

          {/* Task 2: Settings gear for High Contrast toggle */}
          <div className="relative mt-2">
            <button
              onClick={() => setShowSettings(s => !s)}
              aria-label="Accessibility settings"
              aria-expanded={showSettings}
              className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <Settings className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 w-48 bg-black border border-amber-500/60 rounded-xl p-3 shadow-xl z-[200]"
                >
                  <p className="font-lcars text-[9px] text-amber-400 uppercase tracking-widest mb-2">Accessibility</p>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setHighContrast(h => !h)}
                      role="checkbox"
                      aria-checked={highContrast}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setHighContrast(h => !h)}
                      className={cn(
                        "w-8 h-4 rounded-full border-2 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-cyan-400",
                        highContrast ? "bg-yellow-400 border-yellow-300" : "bg-slate-700 border-slate-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all",
                        highContrast ? "left-4 bg-black" : "left-0.5 bg-slate-400"
                      )} />
                    </div>
                    <span className="text-[10px] text-slate-300 group-hover:text-white transition-colors">High Contrast</span>
                  </label>
                  <p className="text-[9px] text-slate-600 mt-1.5 leading-snug">Boosts text contrast to 7:1+ for low-vision adventurers.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Screen */}
        <div
          ref={screenRef}
          className={cn("relative flex-1 overflow-hidden flex items-center justify-center", screenBg)}
          onWheel={(e) => { e.preventDefault(); handleZoom(e.deltaY > 0 ? -0.05 : 0.05); }}
        >
          {/* Sensor status */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", shouldReduceMotion ? "bg-cyan-500" : "bg-cyan-500 animate-pulse")} />
              <span className={cn("text-[10px] font-lcars tracking-[0.2em] uppercase", hc ? "text-white" : "text-cyan-500")}>Sensors Online</span>
            </div>
          </div>

          {/* Keyboard nav hint */}
          <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
            <span className="text-[9px] font-lcars text-slate-600 uppercase tracking-widest">Arrow keys to pan · Enter to select</span>
          </div>

          {/* Targeting status indicator */}
          <AnimatePresence>
            {targetingId && (
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                className={cn(
                  "absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md",
                  hc ? "bg-black border-yellow-400" : "border-amber-500/60 bg-black/80"
                )}
                style={hc ? {} : { boxShadow: '0 0 20px rgba(251,191,36,0.4)' }}
              >
                <Crosshair className={cn("w-3.5 h-3.5", hc ? "text-yellow-300" : "text-amber-400", !shouldReduceMotion && "animate-spin")} style={{ animationDuration: '1s' }} />
                <span className={cn("font-lcars text-[10px] uppercase tracking-widest", hc ? "text-yellow-300" : "text-amber-400")}>Target Acquired</span>
                <div className={cn("w-1.5 h-1.5 rounded-full", hc ? "bg-yellow-300" : "bg-amber-400", !shouldReduceMotion && "animate-pulse")} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draggable Canvas — Task 4: keyboard accessible container */}
          <div
            ref={mapContainerRef}
            tabIndex={0}
            aria-label="Quest map canvas. Use arrow keys to pan, scroll to zoom."
            className="w-full h-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-inset"
          >
            <motion.div
              drag
              dragConstraints={{ top: -1500, left: -1500, right: 1500, bottom: 1500 }}
              dragElastic={0.05}
              style={{
                x, y, scale: zoom,
                backgroundImage: hc ? 'none' : (mapTheme === 'scifi' ? `url('/starmapposter3d.webp')` : `url('/fantasy-map.avif')`),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: hc ? '#000000' : '#0a0a20',
                border: hc ? '2px solid rgba(255,255,0,0.3)' : '2px dashed rgba(168, 85, 247, 0.2)',
              }}
              className="w-[3000px] h-[3000px] flex-shrink-0 cursor-grab active:cursor-grabbing origin-center relative"
            >
              {/* Central crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <Crosshair className={cn("w-32 h-32", hc ? "text-yellow-300" : (mapTheme === 'scifi' ? "text-cyan-500" : "text-amber-700"))} />
              </div>

              {/* Animated Player Icon */}
              <motion.div
                className="absolute z-40 pointer-events-none"
                initial={false}
                animate={{
                  top: activeNode ? (10 + ((quests.findIndex(q => q.id === activeNode.id) * 149) % 80) + '%') : '50%',
                  left: activeNode ? (10 + ((quests.findIndex(q => q.id === activeNode.id) * 227) % 80) + '%') : '50%',
                }}
                transition={playerTransition}
              >
                {mapTheme === 'scifi'
                  ? <Rocket className={cn("w-8 h-8 -mt-10 -ml-4 transform rotate-45", hc ? "text-yellow-300" : "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]")} />
                  : <MapPin className={cn("w-10 h-10 -mt-10 -ml-5", hc ? "text-yellow-300" : "text-red-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]")} />
                }
              </motion.div>

              {/* Quest Nodes */}
              {quests.map((quest, index) => {
                const topPos = 10 + ((index * 149) % 80) + '%';
                const leftPos = 10 + ((index * 227) % 80) + '%';
                const isSelected = activeNode?.id === quest.id;
                const isTargeting = targetingId === quest.id;
                const nodeImg = quest.image_url;

                return (
                  <motion.div
                    key={quest.id}
                    className="absolute flex flex-col items-center gap-2"
                    style={{ top: topPos, left: leftPos }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: zoom < 0.5 ? 1 / zoom * 0.5 : 1, opacity: 1 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { delay: index * 0.05 }}
                  >
                    {/* Targeting reticle */}
                    <AnimatePresence>
                      {isTargeting && (
                        <motion.div
                          className="absolute pointer-events-none z-50"
                          initial={shouldReduceMotion ? {} : { scale: 3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={shouldReduceMotion ? {} : { scale: 2, opacity: 0 }}
                          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
                          style={{ top: '-20px', left: '-20px' }}
                        >
                          <Crosshair
                            className={cn("w-16 h-16", hc ? "text-yellow-300" : (mapTheme === 'scifi' ? "text-amber-400" : "text-red-500"))}
                            style={hc ? {} : { filter: mapTheme === 'scifi' ? 'drop-shadow(0 0 8px rgba(251,191,36,0.9))' : 'drop-shadow(0 0 8px rgba(220,38,38,0.9))' }}
                          />
                          {/* Expanding ring — disabled when motion reduced */}
                          {!shouldReduceMotion && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2"
                              style={{ borderColor: hc ? 'rgba(255,255,0,0.9)' : (mapTheme === 'scifi' ? 'rgba(251,191,36,0.8)' : 'rgba(220,38,38,0.8)') }}
                              animate={{ scale: [1, 2.5], opacity: [1, 0] }}
                              transition={{ duration: 0.8, repeat: 2 }}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Selection pulse ring — disabled when motion reduced */}
                    {isSelected && !isTargeting && !shouldReduceMotion && (
                      <motion.div
                        className="absolute rounded-full pointer-events-none border-2"
                        style={{
                          width: '32px', height: '32px', top: '-4px', left: '-4px',
                          borderColor: hc ? 'rgba(255,255,0,0.9)' : (mapTheme === 'scifi' ? 'rgba(251,191,36,0.7)' : 'rgba(220,38,38,0.7)')
                        }}
                        animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}

                    {/* Static selection indicator for reduced motion */}
                    {isSelected && !isTargeting && shouldReduceMotion && (
                      <div
                        className="absolute rounded-full pointer-events-none border-2"
                        style={{
                          width: '32px', height: '32px', top: '-4px', left: '-4px',
                          borderColor: hc ? 'rgba(255,255,0,0.9)' : (mapTheme === 'scifi' ? 'rgba(251,191,36,0.7)' : 'rgba(220,38,38,0.7)')
                        }}
                      />
                    )}

                    {/* Task 3: aria-label on each node. Task 4: focus ring + Enter key */}
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => setActiveNode(quest)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setActiveNode(quest); } }}
                      aria-label={`Sector: ${quest.title} — quest by ${quest.quest_giver}, Difficulty Class ${quest.difficulty_class}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all duration-300 overflow-hidden",
                        "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-1 focus:ring-offset-black",
                        hc
                          ? (isSelected ? "border-yellow-300 scale-125 ring-2 ring-yellow-300" : "border-white hover:border-yellow-300 hover:scale-110")
                          : (mapTheme === 'scifi'
                            ? (isSelected ? "border-white scale-125 shadow-[0_0_15px_rgba(251,191,36,0.8)]" : "border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)] hover:scale-110")
                            : (isSelected ? "border-yellow-400 scale-125 shadow-lg" : "border-yellow-300 shadow-md hover:scale-110"))
                      )}
                    >
                      {nodeImg ? (
                        <img src={nodeImg} alt="" className="w-full h-full object-cover opacity-70" />
                      ) : (
                        <div className={cn(
                          "w-full h-full",
                          hc
                            ? (isSelected ? "bg-yellow-400" : "bg-white")
                            : (mapTheme === 'scifi' ? (isSelected ? "bg-amber-400" : "bg-purple-600") : (isSelected ? "bg-red-600" : "bg-yellow-700"))
                        )} />
                      )}
                    </button>

                    <span className={cn(
                      "text-[10px] tracking-widest px-2 py-0.5 rounded border whitespace-nowrap",
                      hc
                        ? "font-lcars text-white bg-black border-yellow-400 font-bold"
                        : (mapTheme === 'scifi'
                          ? "font-lcars text-cyan-200 bg-black/80 backdrop-blur-sm border-cyan-500/50"
                          : "font-serif text-amber-100 bg-stone-900/90 border-amber-700/50")
                    )}>
                      {quest.title.length > 15 ? quest.title.substring(0, 15) + '...' : quest.title}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Active Quest Data-Pad */}
          <AnimatePresence>
            {activeNode && (
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
                className={cn(
                  "absolute right-0 bottom-0 w-full md:w-80 md:top-0 h-[65%] md:h-full border-t-2 md:border-t-0 md:border-l-2 z-[110] flex flex-col backdrop-blur-md",
                  panelBg
                )}
                role="region"
                aria-label={`Quest details: ${activeNode.title}`}
              >
                <button
                  onClick={() => setActiveNode(null)}
                  aria-label="Close quest details"
                  className={cn(
                    "absolute top-3 right-3 p-2 rounded-full z-10 focus:outline-none focus:ring-2 focus:ring-cyan-400",
                    hc ? "text-white bg-black border border-white hover:bg-yellow-400 hover:text-black" : "text-slate-400 hover:text-white bg-black/50"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Quest info */}
                <div className={cn("p-4 shrink-0 border-b", hc ? "border-yellow-400/50" : "border-amber-500/20")}>
                  <h3 className={cn("text-[10px] font-lcars tracking-widest uppercase mb-1", hc ? "text-yellow-300" : "text-amber-500")}>Target Acquired</h3>
                  <h2 className={cn("text-base font-black mb-1 leading-tight", hc ? "text-white" : "text-white", mapTheme === 'fantasy' && !hc && "font-serif")}>{activeNode.title}</h2>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn("text-xs px-2 py-0.5 rounded border", hc ? "bg-black border-white text-white" : "bg-purple-900/50 border-purple-500/30 text-purple-200")}>DC {activeNode.difficulty_class}</span>
                    <span className={cn("text-xs truncate", hc ? "text-white" : "text-slate-400")}>By {activeNode.quest_giver}</span>
                  </div>
                  <p className={cn("text-xs leading-relaxed line-clamp-2 mb-2", hc ? "text-white" : "text-slate-300")}>{activeNode.description}</p>
                  {activeNode.image_url && (
                    <img
                      key={activeNode.id}
                      src={activeNode.image_url}
                      alt={`Visual for quest: ${activeNode.title}`}
                      className="w-full h-20 object-cover rounded-lg border border-white/10"
                    />
                  )}
                  {myProfile?.role === 'admin' && activeNode.status === 'completed' && (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        defaultValue={activeNode.artifact_icon || ''}
                        placeholder="🏆 Artifact emoji..."
                        onBlur={async (e) => {
                          const val = e.target.value.trim();
                          if (val !== (activeNode.artifact_icon || '')) {
                            await base44.entities.Quest.update(activeNode.id, { artifact_icon: val });
                            setActiveNode(prev => ({ ...prev, artifact_icon: val }));
                          }
                        }}
                        className={cn(
                          "flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none font-lcars focus:ring-2 focus:ring-cyan-400",
                          hc ? "bg-black border border-white text-white placeholder:text-slate-400" : "bg-black/40 border border-amber-700/40 text-amber-200 placeholder:text-slate-600"
                        )}
                      />
                      <span className={cn("text-[9px] font-lcars uppercase tracking-widest shrink-0", hc ? "text-white" : "text-slate-600")}>Set Icon</span>
                    </div>
                  )}
                  <ArtifactClaimButton
                    quest={activeNode}
                    myProfile={myProfile}
                    onClaimed={(inv) => setMyProfile(prev => prev ? { ...prev, inventory: inv } : prev)}
                  />
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <p className={cn("text-[9px] tracking-widest uppercase mb-2", hc ? "font-lcars text-white" : (mapTheme === 'scifi' ? "font-lcars text-cyan-400" : "font-serif text-amber-600"))}>
                    ◈ Crew Transmissions ({comments.length})
                  </p>
                  {comments.length === 0 && (
                    <p className={cn("text-[10px] text-center py-4", hc ? "text-white" : "text-slate-600")}>No transmissions yet.</p>
                  )}
                  {comments.map(c => {
                    const voted = hasVoted(c.id);
                    const voteCount = getVoteCount(c.id);
                    const author = commentProfiles[c.adventurer_id];
                    return (
                      <div key={c.id} className={cn(
                        "rounded-lg p-2 border text-xs leading-snug",
                        hc
                          ? "bg-black border-white text-white"
                          : (mapTheme === 'scifi'
                            ? "bg-purple-950/40 border-cyan-800/30 text-purple-100"
                            : "bg-stone-900/60 border-amber-800/30 text-amber-100 font-serif")
                      )}>
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => author && navigateToProfile(author.adventurer_name)}
                          aria-label={`View profile of ${author?.adventurer_name || 'this adventurer'}`}
                          className="flex items-center gap-1.5 mb-1.5 group focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full overflow-hidden shrink-0 border flex items-center justify-center text-[8px] font-black text-white",
                            hc ? "border-white bg-black" : (mapTheme === 'scifi' ? "border-cyan-700/50 bg-purple-800" : "border-amber-700/50 bg-stone-700")
                          )}>
                            {author?.avatar_url
                              ? <img src={author.avatar_url} alt={author.adventurer_name} className="w-full h-full object-cover" />
                              : (author?.adventurer_name || '?').charAt(0).toUpperCase()
                            }
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold group-hover:underline transition-all",
                            hc ? "text-yellow-300" : (mapTheme === 'scifi' ? "text-cyan-400" : "text-amber-400")
                          )}>
                            {author?.adventurer_name || 'Adventurer'}
                          </span>
                        </button>

                        <p>{c.content}</p>

                        <div className="flex items-center justify-end mt-1.5">
                          <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={() => handleToggleVote(c)}
                            aria-label={`${voted ? 'Remove vote from' : 'Upvote'} this transmission. Current votes: ${voteCount}`}
                            aria-pressed={voted}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400",
                              voted
                                ? (hc ? "bg-yellow-400 border-yellow-300 text-black" : (mapTheme === 'scifi' ? "bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]" : "bg-red-700/30 border-red-500/50 text-red-300 shadow-md"))
                                : (hc ? "bg-black border-white text-white hover:border-yellow-300 hover:text-yellow-300" : "bg-black/30 border-slate-700/40 text-slate-500 hover:border-slate-500 hover:text-slate-300")
                            )}
                          >
                            <ArrowBigUp className="w-3 h-3" />
                            {voteCount > 0 && <span>{voteCount}</span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Comment input */}
                {myProfile ? (
                  <div className={cn("shrink-0 p-3 border-t flex gap-2", hc ? "border-yellow-400/50" : "border-amber-500/20")}>
                    <input
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                      placeholder="Transmit..."
                      aria-label="Write a crew transmission"
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400",
                        hc
                          ? "bg-black border border-white text-white placeholder:text-slate-400"
                          : (mapTheme === 'scifi'
                            ? "font-lcars bg-black/50 border border-purple-700/50 text-purple-100 placeholder:text-slate-600 focus:border-amber-500/60"
                            : "font-serif bg-black/50 border border-amber-800/40 text-amber-100 placeholder:text-stone-600 focus:border-amber-500/60")
                      )}
                    />
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={handleSendComment}
                      disabled={sendingComment || !commentInput.trim()}
                      aria-label="Send transmission"
                      className={cn(
                        "p-2 rounded-lg border transition-all disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-400",
                        hc ? "bg-yellow-400 border-yellow-300 text-black hover:bg-yellow-300" : "bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
                      )}
                    >
                      {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className={cn("shrink-0 p-3 border-t", hc ? "border-yellow-400/50" : "border-amber-500/20")}>
                    <p className={cn("text-[9px] text-center font-lcars uppercase tracking-widest", hc ? "text-white" : "text-slate-600")}>Login to transmit</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}