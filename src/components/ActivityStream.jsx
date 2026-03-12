import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, X, Trash2, Music, Video, Image } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function MediaPreview({ url, type }) {
  if (!url) return null;
  if (type === 'video') return (
    <video src={url} controls className="mt-2 rounded-lg w-full max-h-48 object-contain bg-black/40" />
  );
  if (type === 'audio') return (
    <audio src={url} controls className="mt-2 w-full rounded-lg" />
  );
  return <img src={url} alt="" className="mt-2 rounded-lg max-h-44 object-cover w-full" />;
}

function Avatar({ name, url, size = 7 }) {
  return url ? (
    <img src={url} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0 border border-purple-600/30`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 border border-purple-600/40 flex items-center justify-center text-[11px] font-black text-purple-200 shrink-0`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function PostItem({ post, user, onDelete, profiles }) {
  const profile = profiles?.[post.author_name];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-xl border border-purple-900/40 bg-[#0d0d1a] overflow-hidden"
    >
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-purple-900/30">
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(post.author_name || '')}`}>
            <Avatar name={post.author_name} url={profile?.avatar_url} />
          </Link>
          <div>
            <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(post.author_name || '')}`}>
              <p className="text-xs font-bold text-purple-200 hover:text-purple-100">{post.author_name}</p>
            </Link>
            <p className="text-[9px] text-slate-600">
              {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : 'just now'}
            </p>
          </div>
        </div>
        {user && (user.email === post.author_email || user.role === 'admin') && (
          <button onClick={() => onDelete(post.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        <MediaPreview url={post.image_url} type={post.media_type} />
      </div>
    </motion.div>
  );
}

export default function ActivityStream() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [user, setUser]         = useState(null);
  const [content, setContent]   = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting]   = useState(false);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadPosts();
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
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMediaUrl(file_url);
    setMediaType(type);
    setUploading(false);
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting || !user) return;
    setPosting(true);
    await base44.entities.NewsPost.create({
      author_name: user.full_name || user.email,
      author_email: user.email,
      content: content.trim(),
      image_url: mediaUrl || undefined,
      media_type: mediaUrl ? mediaType : undefined,
    });
    setContent('');
    setMediaUrl('');
    setPosting(false);
  };

  const deletePost = async (id) => {
    await base44.entities.NewsPost.delete(id);
  };

  return (
    <div className="flex flex-col h-full">
      {user ? (
        <form onSubmit={submitPost} className="mb-3 space-y-2 p-3 rounded-xl border border-purple-900/40 bg-white/[0.02] shrink-0">
          <p className="text-[10px] text-purple-600">Posting as <span className="text-purple-400 font-bold">{user.full_name || user.email}</span></p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share something with the crew..."
            maxLength={500} rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#0d0820]/70 border border-purple-800/40 text-purple-100 placeholder:text-slate-600 text-xs focus:outline-none focus:border-purple-500 resize-none"
          />

          {/* Media preview */}
          {mediaUrl && (
            <div className="relative rounded-lg overflow-hidden border border-purple-700/30">
              <MediaPreview url={mediaUrl} type={mediaType} />
              <button type="button" onClick={() => setMediaUrl('')}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600/80">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Upload buttons + send */}
          <div className="flex items-center gap-1.5">
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleUpload(e, 'video')} />
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => handleUpload(e, 'audio')} />
            {uploading ? (
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            ) : (
              <>
                <button type="button" onClick={() => imageRef.current?.click()} title="Upload image"
                  className="p-1.5 rounded-lg border border-purple-800/40 bg-purple-900/20 text-purple-500 hover:text-purple-300 transition-all">
                  <Image className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => videoRef.current?.click()} title="Upload video"
                  className="p-1.5 rounded-lg border border-purple-800/40 bg-purple-900/20 text-purple-500 hover:text-purple-300 transition-all">
                  <Video className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => audioRef.current?.click()} title="Upload audio"
                  className="p-1.5 rounded-lg border border-purple-800/40 bg-purple-900/20 text-purple-500 hover:text-purple-300 transition-all">
                  <Music className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button type="submit" disabled={posting || !content.trim()}
              className="ml-auto p-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white border border-purple-500/40 transition-all disabled:opacity-40">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-3 p-3 rounded-xl border border-purple-900/40 bg-white/[0.02] text-center text-xs text-slate-600">
          <button onClick={() => base44.auth.redirectToLogin(window.location.pathname)} className="text-purple-400 hover:text-purple-300 underline">Login</button> to post
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-purple-600 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-6">No posts yet — be the first!</p>
        ) : (
          <AnimatePresence initial={false}>
            {posts.map(p => <PostItem key={p.id} post={p} user={user} onDelete={deletePost} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}