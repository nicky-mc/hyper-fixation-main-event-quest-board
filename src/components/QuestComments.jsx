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
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adventurerId, setAdventurerId] = useState(null);
  const [adventurerName, setAdventurerName] = useState('');
  const [profileMap, setProfileMap] = useState({}); // id → AdventurerProfile

  // Load current user's profile
  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        if (!u) return;
        const profiles = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
        if (profiles.length > 0) {
          setAdventurerId(profiles[0].id);
          setAdventurerName(profiles[0].adventurer_name || u.full_name || u.email);
        }
      } catch (_) {}
    };
    init();
  }, []);

  // Build a map of id→profile for all commenters
  const enrichProfiles = async (commentList) => {
    const ids = [...new Set(commentList.map(c => c.adventurer_id).filter(Boolean))];
    if (ids.length === 0) return;
    const all = await base44.entities.AdventurerProfile.list('adventurer_name', 200);
    const map = {};
    all.forEach(p => { map[p.id] = p; });
    setProfileMap(map);
  };

  const load = async () => {
    const data = await base44.entities.QuestComment.filter({ quest_id: questId }, 'created_date');
    setComments(data);
    setLoading(false);
    enrichProfiles(data);
  };

  useEffect(() => {
    setLoading(true);
    load();
    const unsub = base44.entities.QuestComment.subscribe((event) => {
      if (event.data?.quest_id !== questId) return;
      if (event.type === 'create') {
        setComments(prev => {
          const updated = [...prev, event.data];
          enrichProfiles(updated);
          return updated;
        });
      }
    });
    return unsub;
  }, [questId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adventurerId || !content.trim()) return;
    setSubmitting(true);
    await base44.entities.QuestComment.create({ quest_id: questId, adventurer_id: adventurerId, content: content.trim() });
    try {
      const quests = await base44.entities.Quest.filter({ id: questId });
      await base44.entities.Activity.create({
        type: 'comment_added',
        adventurer_id: adventurerId,
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

  // Resolve display name: new records use adventurer_id→profile, old records fall back to author_name
  const getDisplayName = (c) => {
    if (c.adventurer_id && profileMap[c.adventurer_id]) return profileMap[c.adventurer_id].adventurer_name;
    return c.author_name || 'Adventurer';
  };

  const getAvatarUrl = (c) => {
    if (c.adventurer_id && profileMap[c.adventurer_id]) return profileMap[c.adventurer_id].avatar_url;
    return null;
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
              const name = getDisplayName(c);
              const avatarUrl = getAvatarUrl(c);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-6 h-6 rounded-full object-cover" style={{ border: '1px solid rgba(168,85,247,0.4)' }} />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-700 to-indigo-800 border border-purple-600/40 flex items-center justify-center text-[10px] font-black text-purple-200">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 bg-purple-950/40 border border-purple-900/30 rounded-lg px-3 py-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <Link
                        to={createPageUrl('AdventurerProfile') + '?name=' + encodeURIComponent(name)}
                        className="text-xs font-bold text-purple-300 hover:text-purple-100 hover:underline transition-colors">
                        {name}
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
        {adventurerName && (
          <p className="text-[10px] text-purple-600">Posting as <span className="text-purple-400 font-bold">{adventurerName}</span></p>
        )}
        {!adventurerId && (
          <p className="text-[10px] text-slate-600">Login to join the discussion</p>
        )}
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
            disabled={submitting || !adventurerId || !content.trim()}
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