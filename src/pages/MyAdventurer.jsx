import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sword, Scroll, Bookmark, CheckCircle2, Clock, Star, Trash2, Camera, Edit2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const segmentColors = {
  'The Main Quest': 'from-red-800 to-red-500',
  'The Hyper-fixation Main Event': 'from-orange-700 to-amber-500',
  'Heart of the Story': 'from-rose-700 to-pink-500',
  'Shark Week Special': 'from-blue-800 to-indigo-600',
};
const fallbackColor = 'from-purple-800 to-indigo-600';

const statusConfig = {
  pending:   { label: 'Pending',   icon: Clock,        color: 'text-slate-400',  bg: 'bg-slate-800/40 border-slate-700/40' },
  selected:  { label: 'On Air!',   icon: Star,         color: 'text-amber-400',  bg: 'bg-amber-900/20 border-amber-600/40' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-900/20 border-green-700/40' },
};

function QuestMiniCard({ quest, onUnsave }) {
  const cfg = statusConfig[quest.status] || statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 rounded-xl border border-purple-900/40 bg-[#0d0d1a] hover:border-purple-700/60 transition-all group">
      <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center", segmentColors[quest.segment] || fallbackColor)}>
        <Sword className="w-3.5 h-3.5 text-white/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-purple-100 truncate" style={{ fontFamily: "'Caveat', cursive", fontSize: '1rem' }}>{quest.title}</p>
        <p className="text-[10px] text-slate-500 truncate">{quest.segment}</p>
        <div className={cn("inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold", cfg.bg, cfg.color)}>
          <Icon className="w-3 h-3" />{cfg.label}
        </div>
      </div>
      {onUnsave && (
        <button onClick={() => onUnsave(quest.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-400 transition-all shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

export default function MyAdventurer() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allQuests, setAllQuests] = useState([]);
  const [comments, setComments] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadAll(u);
    }).catch(() => setLoading(false));
  }, []);

  const loadAll = async (u) => {
    const name = u.full_name || u.email;
    const [quests, comms, saved, profiles] = await Promise.all([
      base44.entities.Quest.list('-created_date', 200),
      base44.entities.QuestComment.filter({ author_name: name }),
      base44.entities.SavedQuest.filter({ saver_email: u.email }),
      base44.entities.AdventurerProfile.filter({ adventurer_name: name }),
    ]);
    const prof = profiles[0] || null;
    setProfile(prof);
    setEditBio(prof?.bio || '');
    setEditName(prof?.adventurer_name || name);
    setAllQuests(quests);
    setComments(comms);
    setSavedRecords(saved);
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const data = { adventurer_name: editName, bio: editBio };
    if (profile) {
      await base44.entities.AdventurerProfile.update(profile.id, data);
      setProfile(p => ({ ...p, ...data }));
    } else {
      const created = await base44.entities.AdventurerProfile.create(data);
      setProfile(created);
    }
    setEditing(false);
    setSaving(false);
  };

  const uploadAvatar = async (file) => {
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const data = { avatar_url: file_url };
    let updatedProfile;
    if (profile) {
      await base44.entities.AdventurerProfile.update(profile.id, data);
      updatedProfile = { ...profile, ...data };
    } else {
      const name = user.full_name || user.email;
      updatedProfile = await base44.entities.AdventurerProfile.create({ adventurer_name: name, avatar_url: file_url });
    }
    setProfile(updatedProfile);
    setUploadingAvatar(false);
  };

  const unsaveQuest = async (questId) => {
    const rec = savedRecords.find(s => s.quest_id === questId);
    if (rec) {
      await base44.entities.SavedQuest.delete(rec.id);
      setSavedRecords(prev => prev.filter(s => s.id !== rec.id));
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <Sword className="w-10 h-10" />
      <p>Please log in to view your adventurer dashboard.</p>
    </div>
  );

  const name = user.full_name || user.email;
  const myQuests = allQuests.filter(q => q.quest_giver === name || q.created_by === user.email);
  const activeQuest = myQuests.find(q => q.status === 'selected');
  const questHistory = myQuests.filter(q => q.status !== 'pending');
  const commentedQuestIds = [...new Set(comments.map(c => c.quest_id))];
  const contributedQuests = allQuests.filter(q => commentedQuestIds.includes(q.id));
  const savedQuestIds = savedRecords.map(s => s.quest_id);
  const savedQuests = allQuests.filter(q => savedQuestIds.includes(q.id));

  return (
    <div className="min-h-screen relative"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Profile Hero */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-purple-800/50 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d0d1a, #100a1e)' }}>

          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-purple-900/60 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>

          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4 flex-wrap">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-full border-4 border-[#0d0d1a] overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </div>

              <div className="flex-1 min-w-0 mt-2">
                {editing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40}
                    className="bg-transparent border-b border-purple-500 text-amber-300 text-2xl font-black outline-none w-full"
                    style={{ fontFamily: "'Caveat', cursive" }} />
                ) : (
                  <h1 className="text-3xl font-black text-amber-300 leading-tight" style={{ fontFamily: "'Caveat', cursive" }}>
                    {profile?.adventurer_name || name}
                  </h1>
                )}
                <p className="text-xs text-purple-500 uppercase tracking-widest">Adventurer Dashboard</p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-400 hover:text-purple-200 hover:border-purple-500 transition-colors text-xs">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs transition-colors disabled:opacity-50">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                    </button>
                  </div>
                )}
                <Link to={createPageUrl('AdventurerProfile') + `?name=${encodeURIComponent(profile?.adventurer_name || name)}`}
                  className="text-xs text-purple-500 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-lg border border-purple-900/40 hover:border-purple-700/40">
                  Public Profile →
                </Link>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4">
              {editing ? (
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={200} rows={2}
                  placeholder="Write your adventurer lore..."
                  className="w-full bg-purple-950/30 border border-purple-800/50 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none" />
              ) : (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {profile?.bio || <span className="text-slate-600 italic">No bio yet — click Edit to add your lore!</span>}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-purple-900/30 flex-wrap text-[11px] text-slate-500">
              <span><span className="text-purple-300 font-bold">{myQuests.length}</span> quests submitted</span>
              <span>·</span>
              <span><span className="text-purple-300 font-bold">{comments.length}</span> lore contributions</span>
              <span>·</span>
              <span><span className="text-purple-300 font-bold">{savedQuests.length}</span> saved</span>
            </div>
          </div>
        </motion.div>

        {/* Active Quest */}
        {activeQuest && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400" />
              <h2 className="text-xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>Active Quest</h2>
            </div>
            <div className="p-5 rounded-xl border-2 border-amber-500/50 bg-amber-900/10">
              <p className="text-lg font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>{activeQuest.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{activeQuest.segment} · DC {activeQuest.difficulty_class}</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{activeQuest.description}</p>
            </div>
          </section>
        )}

        {/* Quest History */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Scroll className="w-4 h-4 text-amber-400" />
            <h2 className="text-xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>Quest History</h2>
            <span className="ml-1 text-xs bg-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">{questHistory.length}</span>
          </div>
          {questHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl">No quest history yet. Your legend is still unwritten…</div>
          ) : (
            <div className="space-y-2">{questHistory.map(q => <QuestMiniCard key={q.id} quest={q} />)}</div>
          )}
        </section>

        {/* Lore Contributions */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Scroll className="w-4 h-4 text-amber-400" />
            <h2 className="text-xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>Lore Contributions</h2>
            <span className="ml-1 text-xs bg-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">{contributedQuests.length}</span>
          </div>
          {contributedQuests.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl">Join a quest discussion to appear here!</div>
          ) : (
            <div className="space-y-2">{contributedQuests.map(q => <QuestMiniCard key={q.id} quest={q} />)}</div>
          )}
        </section>

        {/* Saved Quests */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <h2 className="text-xl font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>Saved Quests</h2>
            <span className="ml-1 text-xs bg-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">{savedQuests.length}</span>
          </div>
          {savedQuests.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm border border-purple-900/30 rounded-xl">Bookmark quests from the board to save them here.</div>
          ) : (
            <div className="space-y-2">{savedQuests.map(q => <QuestMiniCard key={q.id} quest={q} onUnsave={unsaveQuest} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}