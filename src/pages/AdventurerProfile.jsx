import { useState, useEffect, useRef } from 'react';
import { Scroll, MessageCircle, Edit2, Save, X, ArrowLeft, Loader2, Camera, Shield, Crown, Zap, Trophy, Sword } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function getCharacterClass(commentCount) {
  if (commentCount >= 50) return { title: 'Legendary Lore Master', color: 'text-amber-300', icon: Crown };
  if (commentCount >= 25) return { title: 'Veteran Quester', color: 'text-purple-300', icon: Trophy };
  if (commentCount >= 10) return { title: 'Seasoned Adventurer', color: 'text-cyan-300', icon: Shield };
  if (commentCount >= 3)  return { title: 'Journeyman Hero', color: 'text-green-300', icon: Sword };
  return { title: 'Novice Adventurer', color: 'text-slate-400', icon: Zap };
}

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (profile) {
      await base44.entities.AdventurerProfile.update(profile.id, { avatar_url: file_url });
    } else {
      await base44.entities.AdventurerProfile.create({ adventurer_name: adventurerName, avatar_url: file_url });
    }
    await loadAll();
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const avatarUrl = profile?.avatar_url;
  const charClass = getCharacterClass(comments.length);
  const CharIcon = charClass.icon;

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>

      {/* Side accent bars */}
      <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-40 pointer-events-none z-40" />

      {/* Starfield */}
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        <Link to={createPageUrl('QuestBoard')}
          className="inline-flex items-center gap-1.5 text-purple-500 hover:text-purple-300 text-xs mb-6 transition-colors">
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
            {/* ── Profile Card ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-purple-700/50 overflow-hidden mb-6">
              
              {/* Gradient accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 via-amber-400 to-red-500" />

              <div className="relative p-6"
                style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #0f0820 50%, #0a0d1e 100%)' }}>

                {/* Top row: avatar + info + edit controls */}
                <div className="flex items-start gap-4 mb-5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-2xl shadow-purple-900/50">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 flex items-center justify-center text-3xl font-black text-white">
                          {adventurerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {editing && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 border-2 border-[#0d0d1a] flex items-center justify-center hover:bg-purple-500 transition-colors disabled:opacity-50">
                        {uploadingAvatar
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          : <Camera className="w-3.5 h-3.5 text-white" />}
                      </button>
                    )}
                  </div>

                  {/* Name + class */}
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40}
                        className="bg-transparent border-b-2 border-purple-500 text-amber-300 text-2xl font-black outline-none w-full"
                        style={{ fontFamily: "'Caveat', cursive" }} />
                    ) : (
                      <h1 className="text-3xl font-black text-amber-300 leading-tight truncate"
                        style={{ fontFamily: "'Caveat', cursive" }}>
                        {profile?.adventurer_name || adventurerName}
                      </h1>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <CharIcon className={cn("w-3.5 h-3.5", charClass.color)} />
                      <span className={cn("text-xs font-bold", charClass.color)}>{charClass.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-600">
                      <MessageCircle className="w-3 h-3" />
                      <span>{comments.length} lore contribution{comments.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Edit controls */}
                  {!editing ? (
                    <button onClick={() => setEditing(true)}
                      className="p-2 rounded-lg border border-purple-700/40 text-purple-400 hover:text-purple-200 hover:border-purple-500 transition-colors shrink-0">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setEditing(false)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={saveProfile} disabled={saving}
                        className="p-2 rounded-lg bg-purple-700 text-white hover:bg-purple-600 transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bio panel */}
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-900/30">
                  <p className="text-[10px] text-purple-500 uppercase tracking-widest mb-2 font-semibold">⚔️ Adventurer Lore</p>
                  {editing ? (
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={200} rows={3}
                      placeholder="Describe your adventurer lore..."
                      className="w-full bg-transparent text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none resize-none" />
                  ) : (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {profile?.bio || <span className="text-slate-600 italic">No bio yet — click ✏️ to add one!</span>}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-purple-800/40 to-transparent" />
            </motion.div>

            {/* ── Comment History ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-3">
                <Scroll className="w-4 h-4 text-amber-500" />
                <h2 className="text-xl font-black text-amber-400" style={{ fontFamily: "'Caveat', cursive" }}>
                  Quest Lore Contributions
                </h2>
                <span className="text-xs bg-purple-800/40 text-purple-400 px-2 py-0.5 rounded-full">{comments.length}</span>
              </div>

              {comments.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-sm border border-purple-900/30 rounded-xl flex flex-col items-center gap-2">
                  <Scroll className="w-7 h-7 opacity-20" />
                  No comments yet — venture forth and leave your mark!
                </div>
              ) : (
                <div className="space-y-2">
                  {comments.map(c => {
                    const quest = quests[c.quest_id];
                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-purple-900/30 bg-purple-950/20 overflow-hidden">
                        {quest && (
                          <div className="px-4 py-1.5 bg-purple-900/20 border-b border-purple-900/30 flex items-center justify-between">
                            <span className="text-[9px] text-purple-600 uppercase tracking-widest">{quest.segment}</span>
                            <span className="text-[10px] text-amber-600 font-bold truncate max-w-[60%] text-right">{quest.title}</span>
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