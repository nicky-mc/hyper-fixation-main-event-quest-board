import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {  Loader2, Send, X, Trash2, Music, Video, Image as ImageIcon, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

/**
 * MediaPreview: High-fidelity file rendering
 * Fix: Variable-aware borders to prevent "Ghost Borders" in light themes
 */
function MediaPreview({ url, type }) {
  if (!url) return null;
  if (type === 'video') return (
    <video 
      src={url} 
      controls 
      className="mt-2 rounded-lg w-full max-h-48 object-contain bg-black/40 border border-[var(--border-glow)]/20 shadow-md" 
    />
  );
  if (type === 'audio') return (
    <audio 
      src={url} 
      controls 
      className="mt-2 w-full rounded-lg bg-[var(--panel-bg)] border border-[var(--border-glow)]/30" 
    />
  );
  return (
    <img 
      src={url} 
      alt="" 
      className="mt-2 rounded-lg max-h-44 object-cover w-full border border-[var(--border-glow)]/20 shadow-md" 
    />
  );
}

/**
 * Avatar Component: Restoration of the glowing ring
 * Fix: Text color variable for non-image avatars
 */
function Avatar({ name, url, size = 7 }) {
  const sizeClass = `w-${size} h-${size}`;
  return url ? (
    <img 
      src={url} 
      alt={name} 
      className={cn(sizeClass, "rounded-full object-cover shrink-0")}
      style={{ 
        border: '2px solid var(--accent)', 
        boxShadow: '0 0 10px var(--border-glow)' 
      }} 
    />
  ) : (
    <div 
      className={cn(
        sizeClass, 
        "rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 border border-[var(--border-glow)]/40 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg"
      )}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * PostComments: Threaded transmissions logic
 * Fix: Changed bg-purple-950 (hard dark) to var-aware background
 */
function PostComments({ postId, myProfile, profiles }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.ActivityComment.filter({ activity_id: postId }, 'created_date').then(data => {
      setComments(data);
      setLoading(false);
    });
    const unsub = base44.entities.ActivityComment.subscribe(e => {
      if (e.data?.activity_id !== postId) return;
      if (e.type === 'create') setComments(prev => [...prev, e.data]);
    });
    return unsub;
  }, [postId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !myProfile) return;
    setSubmitting(true);
    await base44.entities.ActivityComment.create({
      activity_id: postId,
      adventurer_id: myProfile.id,
      content: text.trim(),
    });
    setText('');
    setSubmitting(false);
  };

  return (
    <div className="border-t border-[var(--border-glow)]/20 px-4 py-3 space-y-3">
      {loading ? (
        <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin mx-auto" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] text-center italic font-medium">No replies yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => {
            const prof = Object.values(profiles).find(p => p.id === c.adventurer_id);
            const name = prof?.adventurer_name || 'Adventurer';
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar name={name} url={prof?.avatar_url} size={5} />
                <div className="flex-1 bg-[var(--panel-bg)]/60 border border-[var(--border-glow)]/30 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <p className="text-xs font-bold text-[var(--accent)]">{name}</p>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {myProfile && (
        <form onSubmit={submit} className="flex gap-1.5 mt-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Reply..."
            maxLength={200}
            className="flex-1 px-2.5 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-glow)]/40 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs focus:outline-none focus:border-[var(--accent)]"
          />
          <button 
            type="submit" 
            disabled={submitting || !text.trim()}
            className="p-2 rounded-lg bg-[var(--accent)] hover:brightness-110 text-[var(--bg-primary)] transition-all disabled:opacity-40 shadow-md"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      )}
    </div>
  );
}
/**
 * PostItem: Individual feed entry
 * Fix: Replaced hardcoded text-slate/purple with theme variables
 */
function PostItem({ post, user, myProfile, onDelete, profiles }) {
  const [showComments, setShowComments] = useState(false);
  const profile = profiles?.[post.author_name];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-xl overflow-hidden hover-lift mb-4 shadow-sm"
      style={{ 
        background: 'var(--panel-bg)', 
        backdropFilter: 'blur(16px)', 
        border: '1px solid var(--border-glow)' 
      }}
    >
      {/* Post header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-glow)]/20">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(post.author_name || '')}`}>
            <Avatar name={post.author_name} url={profile?.avatar_url} />
          </Link>
          <div>
            <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(post.author_name || '')}`}>
              <p className="text-sm font-bold text-[var(--accent)] hover:brightness-125 transition-all">
                {post.author_name}
              </p>
            </Link>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight">
              {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : 'just now'}
            </p>
          </div>
        </div>
        {user && (user.email === post.author_email || user.role === 'admin') && (
          <button onClick={() => onDelete(post.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post body */}
      <div className="px-4 py-4">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-medium">
          {post.content}
        </p>
        <MediaPreview url={post.image_url} type={post.media_type} />
      </div>

      {/* Reply toggle */}
      <button
        onClick={() => setShowComments(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors border-t border-[var(--border-glow)]/20"
      >
        <MessageCircle className="w-4 h-4" />
        {showComments ? 'Hide Transmission' : 'View Replies'}
        {showComments ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PostComments postId={post.id} myProfile={myProfile} profiles={profiles} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ActivityStream() {
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [content, setContent]     = useState('');
  const [mediaUrl, setMediaUrl]   = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting]     = useState(false);
  const [profiles, setProfiles]   = useState({}); 
  
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      if (u) {
        const profs = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
        if (profs[0]) setMyProfile(profs[0]);
      }
    }).catch(() => {});

    loadPosts();

    base44.entities.AdventurerProfile.list('adventurer_name', 200).then(data => {
      const map = {};
      data.forEach(p => {
        map[p.adventurer_name] = p;
        map[p.id] = p;
      });
      setProfiles(map);
    });

    const unsub = base44.entities.NewsPost.subscribe(event => {
      if (event.type === 'create') setPosts(p => [event.data, ...p]);
      if (event.type === 'delete') setPosts(p => p.filter(x => x.id !== event.id));
    });
    return unsub;
  }, []);

  const loadPosts = async () => {
    const data = await base44.entities.NewsPost.list('-created_date', 60);
    setPosts(data);
    setLoading(false);
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMediaUrl(file_url);
      setMediaType(type);
    } finally {
      setUploading(false);
    }
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting || !user) return;
    setPosting(true);
    try {
      await base44.entities.NewsPost.create({
        author_name: user.full_name || user.email,
        author_email: user.email,
        content: content.trim(),
        image_url: mediaUrl || undefined,
        media_type: mediaUrl ? mediaType : undefined,
      });
      setContent('');
      setMediaUrl('');
    } finally {
      setPosting(false);
    }
  };

  const deletePost = async (id) => {
    await base44.entities.NewsPost.delete(id);
  };

  return (
    <div className="flex flex-col h-full">
      {user ? (
        <form onSubmit={submitPost} className="mb-4 space-y-3 p-4 rounded-xl border border-[var(--border-glow)]/40 bg-[var(--panel-bg)]/30 shrink-0 shadow-md">
          <p className="text-xs font-black text-[var(--accent)] uppercase tracking-widest">
            Broadcasting as: <span className="underline decoration-dotted">{user.full_name || user.email}</span>
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share lore with the sector..."
            maxLength={500} 
            rows={2}
            className="w-full px-3 py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-glow)]/40 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent)] resize-none transition-all font-medium"
          />
          {mediaUrl && (
            <div className="relative rounded-lg overflow-hidden border border-[var(--accent)]/30 shadow-2xl">
              <MediaPreview url={mediaUrl} type={mediaType} />
              <button 
                type="button" 
                onClick={() => setMediaUrl('')}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleUpload(e, 'video')} />
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => handleUpload(e, 'audio')} />
            
            {uploading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" /> UPLOADING...
              </div>
            ) : (
              <>
                <button type="button" onClick={() => imageRef.current?.click()} title="Upload image"
                  className="p-2.5 rounded-lg border border-[var(--border-glow)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all shadow-sm">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => videoRef.current?.click()} title="Upload video"
                  className="p-2.5 rounded-lg border border-[var(--border-glow)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all shadow-sm">
                  <Video className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => audioRef.current?.click()} title="Upload audio"
                  className="p-2.5 rounded-lg border border-[var(--border-glow)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all shadow-sm">
                  <Music className="w-5 h-5" />
                </button>
              </>
            )}
            
            <button 
              type="submit" 
              disabled={posting || !content.trim()}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--accent)] hover:brightness-110 text-[var(--bg-primary)] font-black text-xs uppercase tracking-widest transition-all disabled:opacity-40 shadow-lg"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Transmit</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4 p-5 rounded-xl border border-[var(--border-glow)]/40 bg-[var(--panel-bg)]/20 text-center text-xs text-[var(--text-muted)] font-medium shadow-inner">
          <button 
            onClick={() => base44.auth.redirectToLogin(window.location.pathname)} 
            className="text-[var(--accent)] font-bold hover:underline"
          >
            Login
          </button> to access dimensional transmissions.
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-xs text-[var(--text-muted)] py-12 italic font-medium">
            Sector quiet... be the first to transmit into the lore.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {posts.map(p => (
              <PostItem 
                key={p.id} 
                post={p} 
                user={user} 
                myProfile={myProfile} 
                onDelete={deletePost} 
                profiles={profiles} 
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
