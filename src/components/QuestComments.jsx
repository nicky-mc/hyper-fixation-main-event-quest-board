import { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuestComments({ questId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await base44.entities.QuestComment.filter({ quest_id: questId }, 'created_date');
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    const unsub = base44.entities.QuestComment.subscribe((event) => {
      if (event.data?.quest_id !== questId) return;
      if (event.type === 'create') setComments(prev => [...prev, event.data]);
    });
    return unsub;
  }, [questId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    setSubmitting(true);
    await base44.entities.QuestComment.create({ quest_id: questId, author_name: authorName.trim(), content: content.trim() });
    setContent('');
    setSubmitting(false);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-4 border-t border-purple-900/40 pt-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
          Discussion {comments.length > 0 && <span className="text-purple-600">({comments.length})</span>}
        </span>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-slate-600 text-center py-2">No comments yet — be the first, Adventurer!</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {comments.map(c => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-700 to-indigo-800 border border-purple-600/40 flex items-center justify-center text-[10px] font-black text-purple-200 shrink-0 mt-0.5">
                  {c.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 bg-purple-950/40 border border-purple-900/30 rounded-lg px-3 py-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <Link to={createPageUrl('AdventurerProfile') + '?name=' + encodeURIComponent(c.author_name)}
                      className="text-xs font-bold text-purple-300 hover:text-purple-100 hover:underline transition-colors"
                      style={{ fontFamily: "'Caveat', cursive" }}>
                      {c.author_name}
                    </Link>
                    <span className="text-[9px] text-slate-600">{formatTime(c.created_date)}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{c.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Post form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={authorName}
          onChange={e => setAuthorName(e.target.value)}
          placeholder="Your adventurer name..."
          maxLength={40}
          className="w-full px-3 py-2 rounded-lg bg-[#0d0820]/70 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          required
        />
        <div className="flex gap-2">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add to the quest lore..."
            maxLength={300}
            className="flex-1 px-3 py-2 rounded-lg bg-[#0d0820]/70 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 text-xs focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={submitting || !authorName.trim() || !content.trim()}
            className={cn(
              "px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 shrink-0",
              "bg-gradient-to-r from-purple-700 to-indigo-700 border-purple-500/40 text-white",
              "hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
}