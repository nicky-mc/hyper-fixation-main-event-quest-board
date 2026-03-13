import { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuestComments({ questId }) {
  const [comments, setComments] = useState([]);
  const [profiles, setProfiles] = useState({}); // adventurer_id -> profile
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async u => {
      if (!u) return;
      const profs = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
      if (profs[0]) setMyProfile(profs[0]);
    }).catch(() => {});
  }, []);

  const loadComments = async () => {
    const data = await base44.entities.QuestComment.filter({ quest_id: questId }, 'created_date');
    setComments(data);
    setLoading(false);
    // Fetch all profiles for commenters
    const ids = [...new Set(data.map(c => c.adventurer_id).filter(Boolean))];
    if (ids.length === 0) return;
    const allProfiles = await base44.entities.AdventurerProfile.list('adventurer_name', 200);
    const map = {};
    allProfiles.forEach(p => { map[p.id] = p; });
    setProfiles(map);
  };

  useEffect(() => {
    setLoading(true);
    loadComments();
    const unsub = base44.entities.QuestComment.subscribe(async (event) => {
      if (event.data?.quest_id !== questId) return;
      if (event.type === 'create') {
        setComments(prev => [...prev, event.data]);
        // Fetch profile for new commenter if not already cached
        if (event.data.adventurer_id) {
          setProfiles(prev => {
            if (prev[event.data.adventurer_id]) return prev;
            base44.entities.AdventurerProfile.filter({ id: event.data.adventurer_id })
              .then(r => { if (r[0]) setProfiles(p => ({ ...p, [r[0].id]: r[0] })); });
            return prev;
          });
        }
      }
    });
    return unsub;
  }, [questId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myProfile || !content.trim()) return;
    setSubmitting(true);
    await base44.entities.QuestComment.create({
      quest_id: questId,
      adventurer_id: myProfile.id,
      content: content.trim(),
    });
    try {
      const quests = await base44.entities.Quest.filter({ id: questId });
      await base44.entities.Activity.create({
        type: 'comment_added',
        adventurer_id: myProfile.id,
        quest_id: questId,
        quest_title: quests[0]?.title || '',
        content: content.trim(),
      });
    } catch (_) {}
    setContent('');
    setSubmitting(false);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-4 border-t border-purple-900/40 pt-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
          Discussion {comments.length > 0 && <span className="text-purple-600">({comments.length})</span>}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-slate-600 text-center py-2">No comments yet — be the first, Adventurer!</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {comments.map(c => {
              const prof = profiles[c.adventurer_id];
              const displayName = prof?.adventurer_name || 'Adventurer';
              const avatarUrl = prof?.avatar_url;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-700 to-indigo-800 border border-purple-600/40 flex items-center justify-center text-[10px] font-black text-purple-200 shrink-0 mt-0.5 overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      : displayName.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0 bg-purple-950/40 border border-purple-900/30 rounded-lg px-3 py-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <Link
                        to={createPageUrl('AdventurerProfile') + '?name=' + encodeURIComponent(displayName)}
                        className="text-xs font-bold text-purple-300 hover:text-purple-100 hover:underline transition-colors">
                        {displayName}
                      </Link>
                      <span className="text-[9px] text-slate-600">{formatTime(c.created_date)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{c.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        {myProfile && (
          <p className="text-[10px] text-purple-600">Posting as <span className="text-purple-400 font-bold">{myProfile.adventurer_name}</span></p>
        )}
        {!myProfile && (
          <p className="text-[10px] text-slate-600">Login to join the discussion</p>
        )}
        <div className="flex gap-2">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add to the quest lore..."
            maxLength={300}
            disabled={!myProfile}
            className="flex-1 px-3 py-2 rounded-lg bg-[#0d0820]/70 border border-purple-800/50 text-purple-100 placeholder:text-slate-600 text-xs focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-40"
            required
          />
          <button
            type="submit"
            disabled={submitting || !myProfile || !content.trim()}
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