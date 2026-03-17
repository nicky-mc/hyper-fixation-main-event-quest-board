import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FeedPostItem({ post, myProfile, onImageClick }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.ProfilePostComment.filter({ post_id: post.id }, '-created_date', 30)
      .then(setComments)
      .catch(() => {});
  }, [post.id]);

  const submitComment = async () => {
    if (!newComment.trim() || !myProfile) return;
    setSubmitting(true);
    const created = await base44.entities.ProfilePostComment.create({
      post_id: post.id,
      author_id: myProfile.id,
      author_name: myProfile.adventurer_name,
      author_avatar: myProfile.avatar_url || '',
      content: newComment.trim(),
    });
    setComments(prev => [...prev, created]);
    setNewComment('');
    setSubmitting(false);
    // Notify post author if different person
    if (post.author_id && post.author_id !== myProfile.id) {
      const authorProf = await base44.entities.AdventurerProfile.filter({ id: post.author_id });
      if (authorProf[0]?.auth_id) {
        await base44.entities.Notification.create({
          target_auth_id: authorProf[0].auth_id,
          actor_name: myProfile.adventurer_name,
          type: 'post_comment',
          content: 'replied to your transmission',
          is_read: false,
          link_url: `/AdventurerProfile?name=${encodeURIComponent(authorProf[0].adventurer_name)}`,
        });
      }
    }
  };

  return (
    <div className="p-4">
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden">
          {post.author_avatar
            ? <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
            : post.author_name?.charAt(0).toUpperCase()
          }
        </div>
        <span className="font-lcars text-[10px] text-amber-400 uppercase tracking-widest font-bold">{post.author_name}</span>
        <span className="text-[9px] text-slate-600 ml-auto">{formatTime(post.created_date)}</span>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm text-slate-200 leading-relaxed mb-2">{post.content}</p>
      )}

      {/* Media */}
      {post.media_url && (
        <img
          src={post.media_url}
          alt="transmission media"
          className="mt-2 rounded-xl border border-purple-800/50 max-w-full sm:max-w-md object-cover shadow-md cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onImageClick?.({ url: post.media_url, alt: 'transmission media' })}
        />
      )}

      {/* Comments */}
      <div className="mt-3 pt-3 border-t border-purple-900/30 space-y-2">
        {comments.map(c => (
          <div key={c.id} className="flex items-start gap-2 bg-purple-950/40 rounded-lg px-3 py-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center text-[8px] font-black text-white shrink-0 overflow-hidden mt-0.5">
              {c.author_avatar
                ? <img src={c.author_avatar} alt={c.author_name} className="w-full h-full object-cover" />
                : c.author_name?.charAt(0).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest mr-2">{c.author_name}</span>
              <span className="text-xs text-slate-300 leading-snug">{c.content}</span>
            </div>
          </div>
        ))}

        {/* Comment input */}
        {myProfile && (
          <div className="flex items-center gap-2 mt-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
              placeholder="Reply to transmission..."
              className="flex-1 bg-purple-950/30 border border-purple-800/40 rounded-lg px-3 py-1.5 text-xs text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-600"
            />
            <button onClick={submitComment} disabled={submitting || !newComment.trim()}
              className="p-1.5 rounded-lg bg-purple-900/50 border border-purple-700/40 text-purple-400 hover:text-amber-400 transition-colors disabled:opacity-40">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}