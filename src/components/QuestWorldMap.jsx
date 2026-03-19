import { motion, AnimatePresence } from 'framer-motion';
import { X, Crosshair, Rocket, MapPin, Send, ArrowBigUp, Loader2 } from 'lucide-react';
import ArtifactClaimButton from './ArtifactClaimButton';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

// Canvas is 3000x3000px. Nodes use the same % math as placement.
function getNodePercent(index) {
  const top = 20 + ((index * 37) % 60); // percent
  const left = 20 + ((index * 43) % 60); // percent
  return { top, left };
}

export default function QuestWorldMap({ quests, onClose, targetQuest }) {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState(null);
  const [mapTheme, setMapTheme] = useState('scifi');
  const [zoom, setZoom] = useState(0.35);
  const [canvasPos, setCanvasPos] = useState({ x: 0, y: 0 });
  const [targetingId, setTargetingId] = useState(null); // quest id being reticle'd
  const screenRef = useRef(null);

  // Comment state
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [commentVotes, setCommentVotes] = useState([]);

  const handleZoom = (amt) => setZoom(prev => Math.max(0.15, Math.min(prev + amt, 2)));

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

    // Pixel position of the node on the canvas
    const nodeX = (left / 100) * CANVAS;
    const nodeY = (top / 100) * CANVAS;

    // Get viewport size of the screen area
    const screen = screenRef.current;
    const vpW = screen ? screen.clientWidth : 600;
    const vpH = screen ? screen.clientHeight : 500;

    // To center the node in the viewport after scaling:
    // canvas is rendered at origin (center of screen by default via flex centering),
    // so we need to offset: center of viewport - node position * scale
    const offsetX = vpW / 2 - nodeX * targetZoom;
    const offsetY = vpH / 2 - nodeY * targetZoom;

    setZoom(targetZoom);
    setCanvasPos({ x: offsetX, y: offsetY });
    setActiveNode(targetQuest);

    // Show targeting reticle for 2 seconds
    setTargetingId(targetQuest.id);
    const timer = setTimeout(() => setTargetingId(null), 2000);
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

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">

      {/* PADD Frame */}
      <div className="relative w-[95%] max-w-5xl h-[80vh] bg-black rounded-[2.5rem] border-4 border-amber-500 flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">

        {/* LCARS Bezel */}
        <div className="w-full md:w-32 bg-amber-500 flex md:flex-col items-center justify-between p-4 shrink-0 z-50">
          <button onClick={onClose} className="w-full py-2 bg-red-600 hover:bg-red-400 text-black font-black font-lcars text-xs rounded-full border-2 border-red-800 uppercase transition-colors">
            EXIT
          </button>
          <div className="flex md:flex-col gap-2 my-4">
            <button onClick={() => handleZoom(0.1)} className="w-10 h-10 bg-amber-700 hover:bg-white text-white hover:text-black font-bold rounded-lg border border-amber-900 transition-colors text-lg">+</button>
            <button onClick={() => handleZoom(-0.1)} className="w-10 h-10 bg-amber-700 hover:bg-white text-white hover:text-black font-bold rounded-lg border border-amber-900 transition-colors text-lg">-</button>
            <button onClick={() => { setZoom(0.35); setCanvasPos({ x: 0, y: 0 }); }} className="w-10 h-10 bg-blue-900 hover:bg-blue-700 text-white rounded-lg border border-blue-950 text-[8px] uppercase transition-colors leading-tight">FULL</button>
          </div>
          <button
            onClick={() => setMapTheme(prev => prev === 'scifi' ? 'fantasy' : 'scifi')}
            className="w-full py-2 bg-purple-900 hover:bg-purple-800 text-purple-200 font-bold font-lcars text-[10px] rounded-full border-2 border-purple-950 uppercase transition-colors"
          >
            {mapTheme === 'scifi' ? 'FANTASY' : 'SCI-FI'}
          </button>
        </div>

        {/* Screen */}
        <div
          ref={screenRef}
          className="relative flex-1 overflow-hidden bg-[#080510] flex items-center justify-center"
          onWheel={(e) => { e.preventDefault(); handleZoom(e.deltaY > 0 ? -0.05 : 0.05); }}
        >
          {/* Sensor status */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-lcars text-cyan-500 tracking-[0.2em] uppercase">Sensors Online</span>
            </div>
          </div>

          {/* Targeting status indicator */}
          <AnimatePresence>
            {targetingId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/60 bg-black/80 backdrop-blur-md"
                style={{ boxShadow: '0 0 20px rgba(251,191,36,0.4)' }}
              >
                <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '1s' }} />
                <span className="font-lcars text-[10px] text-amber-400 uppercase tracking-widest">Target Acquired</span>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draggable Canvas */}
          <motion.div
            drag
            dragConstraints={{ top: -2500, left: -2500, right: 2500, bottom: 2500 }}
            dragElastic={0.05}
            animate={{ scale: zoom, x: canvasPos.x, y: canvasPos.y }}
            transition={{ type: 'spring', stiffness: 180, damping: 28 }}
            onDragStart={() => {
              // After drag starts, reset canvasPos so it doesn't fight the drag
              setCanvasPos({ x: 0, y: 0 });
            }}
            className="w-[3000px] h-[3000px] flex-shrink-0 cursor-grab active:cursor-grabbing origin-center"
            style={{
              backgroundImage: mapTheme === 'scifi' ? `url('/starmapposter3d.webp')` : `url('/fantasy-map.avif')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#0a0a20',
              border: '2px dashed rgba(168, 85, 247, 0.2)',
            }}
          >
            {/* Central crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
              <Crosshair className={cn("w-32 h-32", mapTheme === 'scifi' ? "text-cyan-500" : "text-amber-700")} />
            </div>

            {/* Animated Player Icon */}
            <motion.div
              className="absolute z-40 pointer-events-none"
              initial={false}
              animate={{
                top: activeNode ? (20 + ((quests.findIndex(q => q.id === activeNode.id) * 37) % 60) + '%') : '50%',
                left: activeNode ? (20 + ((quests.findIndex(q => q.id === activeNode.id) * 43) % 60) + '%') : '50%',
              }}
              transition={{ type: 'spring', stiffness: 40, damping: 12, mass: 0.8 }}
            >
              {mapTheme === 'scifi'
                ? <Rocket className="w-8 h-8 -mt-10 -ml-4 transform rotate-45 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                : <MapPin className="w-10 h-10 -mt-10 -ml-5 text-red-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" />
              }
            </motion.div>

            {/* Quest Nodes */}
            {quests.map((quest, index) => {
              const topPos = 20 + ((index * 37) % 60) + '%';
              const leftPos = 20 + ((index * 43) % 60) + '%';
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
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Targeting reticle — temporary overlay on warp-in */}
                  <AnimatePresence>
                    {isTargeting && (
                      <motion.div
                        className="absolute pointer-events-none z-50"
                        initial={{ scale: 3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ top: '-20px', left: '-20px' }}
                      >
                        <Crosshair
                          className={cn("w-16 h-16", mapTheme === 'scifi' ? "text-amber-400" : "text-red-500")}
                          style={{ filter: mapTheme === 'scifi' ? 'drop-shadow(0 0 8px rgba(251,191,36,0.9))' : 'drop-shadow(0 0 8px rgba(220,38,38,0.9))' }}
                        />
                        {/* Expanding ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2"
                          style={{ borderColor: mapTheme === 'scifi' ? 'rgba(251,191,36,0.8)' : 'rgba(220,38,38,0.8)' }}
                          animate={{ scale: [1, 2.5], opacity: [1, 0] }}
                          transition={{ duration: 0.8, repeat: 2 }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isSelected && !isTargeting && (
                    <motion.div
                      className="absolute rounded-full pointer-events-none border-2"
                      style={{ width: '32px', height: '32px', top: '-4px', left: '-4px', borderColor: mapTheme === 'scifi' ? 'rgba(251,191,36,0.7)' : 'rgba(220,38,38,0.7)' }}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => setActiveNode(quest)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all duration-300 overflow-hidden",
                      mapTheme === 'scifi'
                        ? (isSelected ? "border-white scale-125 shadow-[0_0_15px_rgba(251,191,36,0.8)]" : "border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)] hover:scale-110")
                        : (isSelected ? "border-yellow-400 scale-125 shadow-lg" : "border-yellow-300 shadow-md hover:scale-110")
                    )}
                  >
                    {nodeImg ? (
                      <img src={nodeImg} alt="" className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <div className={cn("w-full h-full", mapTheme === 'scifi' ? (isSelected ? "bg-amber-400" : "bg-purple-600") : (isSelected ? "bg-red-600" : "bg-yellow-700"))} />
                    )}
                  </button>
                  <span className={cn(
                    "text-[10px] tracking-widest px-2 py-0.5 rounded border whitespace-nowrap",
                    mapTheme === 'scifi'
                      ? "font-lcars text-cyan-200 bg-black/80 backdrop-blur-sm border-cyan-500/50"
                      : "font-serif text-amber-100 bg-stone-900/90 border-amber-700/50"
                  )}>
                    {quest.title.length > 15 ? quest.title.substring(0, 15) + '...' : quest.title}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Active Quest Data-Pad */}
          <AnimatePresence>
            {activeNode && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute right-0 bottom-0 w-full md:w-80 md:top-0 h-[65%] md:h-full bg-gradient-to-t md:bg-gradient-to-b from-[#0d0d1a] to-[#080510]/95 border-t-2 md:border-t-0 md:border-l-2 border-amber-500/50 z-[110] flex flex-col backdrop-blur-md"
              >
                <button
                  onClick={() => setActiveNode(null)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white p-2 bg-black/50 rounded-full z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Quest info */}
                <div className="p-4 shrink-0 border-b border-amber-500/20">
                  <h3 className="text-[10px] font-lcars text-amber-500 tracking-widest uppercase mb-1">Target Acquired</h3>
                  <h2 className={cn("text-base font-black text-white mb-1 leading-tight", mapTheme === 'fantasy' && "font-serif")}>{activeNode.title}</h2>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-purple-900/50 border border-purple-500/30 text-purple-200 px-2 py-0.5 rounded">DC {activeNode.difficulty_class}</span>
                    <span className="text-xs text-slate-400 truncate">By {activeNode.quest_giver}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-2">{activeNode.description}</p>
                  {activeNode.image_url && (
                    <img
                      key={activeNode.id}
                      src={activeNode.image_url}
                      alt="Quest Visual"
                      className="w-full h-20 object-cover rounded-lg border border-white/10"
                    />
                  )}
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <p className={cn("text-[9px] tracking-widest uppercase mb-2", mapTheme === 'scifi' ? "font-lcars text-cyan-400" : "font-serif text-amber-600")}>
                    ◈ Crew Transmissions ({comments.length})
                  </p>
                  {comments.length === 0 && (
                    <p className="text-[10px] text-slate-600 text-center py-4">No transmissions yet.</p>
                  )}
                  {comments.map(c => {
                    const voted = hasVoted(c.id);
                    const voteCount = getVoteCount(c.id);
                    const author = commentProfiles[c.adventurer_id];
                    return (
                      <div key={c.id} className={cn(
                        "rounded-lg p-2 border text-xs leading-snug",
                        mapTheme === 'scifi'
                          ? "bg-purple-950/40 border-cyan-800/30 text-purple-100"
                          : "bg-stone-900/60 border-amber-800/30 text-amber-100 font-serif"
                      )}>
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => author && navigateToProfile(author.adventurer_name)}
                          className="flex items-center gap-1.5 mb-1.5 group"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full overflow-hidden shrink-0 border flex items-center justify-center text-[8px] font-black text-white",
                            mapTheme === 'scifi' ? "border-cyan-700/50 bg-purple-800" : "border-amber-700/50 bg-stone-700"
                          )}>
                            {author?.avatar_url
                              ? <img src={author.avatar_url} alt={author.adventurer_name} className="w-full h-full object-cover" />
                              : (author?.adventurer_name || '?').charAt(0).toUpperCase()
                            }
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold group-hover:underline transition-all",
                            mapTheme === 'scifi' ? "text-cyan-400" : "text-amber-400"
                          )}>
                            {author?.adventurer_name || 'Adventurer'}
                          </span>
                        </button>

                        <p>{c.content}</p>

                        <div className="flex items-center justify-end mt-1.5">
                          <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={() => handleToggleVote(c)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all",
                              voted
                                ? (mapTheme === 'scifi' ? "bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]" : "bg-red-700/30 border-red-500/50 text-red-300 shadow-md")
                                : "bg-black/30 border-slate-700/40 text-slate-500 hover:border-slate-500 hover:text-slate-300"
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
                  <div className="shrink-0 p-3 border-t border-amber-500/20 flex gap-2">
                    <input
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                      placeholder="Transmit..."
                      className={cn(
                        "flex-1 bg-black/50 border rounded-lg px-3 py-2 text-xs focus:outline-none",
                        mapTheme === 'scifi'
                          ? "font-lcars border-purple-700/50 text-purple-100 placeholder:text-slate-600 focus:border-amber-500/60"
                          : "font-serif border-amber-800/40 text-amber-100 placeholder:text-stone-600 focus:border-amber-500/60"
                      )}
                    />
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={handleSendComment}
                      disabled={sendingComment || !commentInput.trim()}
                      className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all disabled:opacity-40"
                    >
                      {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="shrink-0 p-3 border-t border-amber-500/20">
                    <p className="text-[9px] text-slate-600 text-center font-lcars uppercase tracking-widest">Login to transmit</p>
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