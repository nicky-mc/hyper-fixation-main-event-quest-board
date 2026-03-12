import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Rss, Plus, Send, Loader2, Trash2, ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function NewsFeed() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadPosts();

    const unsub = base44.entities.NewsPost.subscribe((event) => {
      if (event.type === 'create') setPosts(p => [event.data, ...p]);
      if (event.type === 'delete') setPosts(p => p.filter(x => x.id !== event.id));
    });
    return unsub;
  }, []);

  const loadPosts = async () => {
    const data = await base44.entities.NewsPost.list('-created_date', 50);
    setPosts(data);
    setLoading(false);
  };

  const submitPost = async () => {
    if (!content.trim() || posting || !user) return;
    setPosting(true);
    await base44.entities.NewsPost.create({
      author_name: user.full_name || user.email,
      author_email: user.email,
      content: content.trim(),
      image_url: imageUrl.trim() || undefined,
    });
    setContent('');
    setImageUrl('');
    setShowForm(false);
    setPosting(false);
  };

  const deletePost = async (id) => {
    await base44.entities.NewsPost.delete(id);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Rss className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>
            Tavern Noticeboard
          </h1>
        </div>
        {user && (
          <button onClick={() => setShowForm(o => !o)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all",
              showForm
                ? "bg-purple-700/40 border-purple-500 text-purple-200"
                : "bg-purple-900/30 border-purple-700/40 text-purple-400 hover:border-purple-500 hover:text-purple-200"
            )}>
            <Plus className="w-4 h-4" /> Post
          </button>
        )}
      </div>

      {/* Post form */}
      <AnimatePresence>
        {showForm && user && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-2xl border border-purple-800/50 bg-[#0d0d1a] overflow-hidden">
            <div className="p-4 space-y-3">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share news, updates, or lore with the community..."
                rows={4}
                className="w-full bg-purple-950/30 border border-purple-800/40 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
              />
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Image URL (optional)"
                className="w-full bg-purple-950/30 border border-purple-800/40 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
              {imageUrl && (
                <img src={imageUrl} alt="preview" className="rounded-lg max-h-40 object-cover w-full" />
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300">Cancel</button>
                <button onClick={submitPost} disabled={posting || !content.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold disabled:opacity-40 transition-all">
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Rss className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map(post => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-purple-900/40 bg-[#0d0d1a] overflow-hidden">
                {/* Author row */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-purple-900/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-white text-xs font-black">
                      {post.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-200">{post.author_name}</p>
                      <p className="text-[10px] text-slate-600">{formatTime(post.created_date)}</p>
                    </div>
                  </div>
                  {user && (user.email === post.author_email || user.role === 'admin') && (
                    <button onClick={() => deletePost(post.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Content */}
                <div className="px-5 py-4">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="mt-3 rounded-xl max-h-64 object-cover w-full" />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}