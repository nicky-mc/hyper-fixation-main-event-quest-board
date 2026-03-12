import { useState, useEffect } from 'react';
import { Scroll, MessageCircle, Edit2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdventurerProfile() {
  const params = new URLSearchParams(window.location.search);
  const adventurerName = decodeURIComponent(params.get('name') || '');

  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [quests, setQuests] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!adventurerName) { setLoading(false); return; }
    loadAll();
  }, [adventurerName]);

  const loadAll = async () => {
    setLoading(true);
    const [profiles, allComments] = await Promise.all([
      base44.entities.AdventurerProfile.filter({ adventurer_name: adventurerName }),
      base44.entities.QuestComment.filter({ author_name: adventurerName }, '-created_date', 20),
    ]);
    const prof = profiles[0] || null;
    setProfile(prof);
    setEditBio(prof?.bio || '');
    setEditName(prof?.adventurer_name || adventurerName);
    setComments(allComments);

    // Fetch quest titles for the comments
    const questIds = [...new Set(allComments.map(c => c.quest_id))];
    if (questIds.length > 0) {
      const allQuests = await base44.entities.Quest.list();
      const map = {};
      allQuests.forEach(q => { map[q.id] = q; });
      setQuests(map);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    if (profile) {
      await base44.entities.AdventurerProfile.update(profile.id, { adventurer_name: editName, bio: editBio });
    } else {
      await base44.entities.AdventurerProfile.create({ adventurer_name: editName, bio: editBio });
    }
    await loadAll();
    setEditing(false);
    setSaving(false);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-60" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-60" />

      <div className="relative max-w-2xl mx-auto px-4 py-10">
        {/* Back button */}
        <Link to={createPageUrl('QuestBoard')}
          className="inline-flex items-center gap-2 text-purple-500 hover:text-purple-300 text-xs mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Quest Board
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : !adventurerName ? (
          <p className="text-center text-slate-500">No adventurer specified.</p>
        ) : (
          <>
            {/* Profile Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-purple-800/50 overflow-hidden mb-6"
              style={{ background: 'linear-gradient(135deg, #0d0d1a, #0f0d22)' }}>

              <div className="px-6 py-5 border-b border-purple-900/40 bg-purple-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 border-2 border-purple-500/50 flex items-center justify-center text-xl font-black text-white">
                    {adventurerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {editing ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40}
                        className="bg-transparent border-b border-purple-500 text-amber-300 text-xl font-black outline-none"
                        style={{ fontFamily: "'Caveat', cursive" }} />
                    ) : (
                      <h1 className="text-2xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>
                        {profile?.adventurer_name || adventurerName}
                      </h1>
                    )}
                    <p className="text-[10px] text-purple-500 uppercase tracking-widest">Adventurer</p>
                  </div>
                </div>
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="p-2 rounded-lg border border-purple-700/40 text-purple-400 hover:text-purple-200 hover:border-purple-500 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="p-2 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={saveProfile} disabled={saving}
                      className="p-2 rounded-lg bg-purple-700 text-white hover:bg-purple-600 transition-colors disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="px-6 py-4">
                <p className="text-xs text-purple-400 uppercase tracking-widest mb-2 font-semibold">Bio</p>
                {editing ? (
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={200} rows={3}
                    placeholder="Describe your adventurer lore..."
                    className="w-full bg-[#0d0820]/70 border border-purple-800/50 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none transition-colors" />
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {profile?.bio || <span className="text-slate-600 italic">No bio yet — click ✏️ to add one!</span>}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs text-slate-500">{comments.length} comment{comments.length !== 1 ? 's' : ''} posted</span>
                </div>
              </div>
            </motion.div>

            {/* Comment history */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-4">
                <Scroll className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem' }}>
                  Quest Lore Contributions
                </h2>
              </div>

              {comments.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-sm">No comments yet — venture forth and leave your mark!</div>
              ) : (
                <div className="space-y-3">
                  {comments.map(c => {
                    const quest = quests[c.quest_id];
                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-purple-900/40 bg-purple-950/20 overflow-hidden">
                        {quest && (
                          <div className="px-4 py-1.5 bg-purple-900/20 border-b border-purple-900/30 flex items-center justify-between">
                            <span className="text-[10px] text-purple-500 uppercase tracking-widest">
                              {quest.segment}
                            </span>
                            <span className="text-[10px] text-amber-600 font-bold truncate max-w-[60%] text-right">
                              {quest.title}
                            </span>
                          </div>
                        )}
                        <div className="px-4 py-3">
                          <p className="text-sm text-slate-300 leading-relaxed">{c.content}</p>
                          <p className="text-[9px] text-slate-600 mt-1.5">{formatTime(c.created_date)}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}