import { useState, useEffect, useRef } from 'react';
import { Scroll, MessageCircle, Edit2, Save, X, ArrowLeft, Loader2, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ADMIN_EMAILS = ['charlotte_cowles@yahoo.co.uk', 'nicky.mortoza-cowles@techeducators.co.uk'];

export default function AdventurerProfile() {
  const params = new URLSearchParams(window.location.search);
  const adventurerName = decodeURIComponent(params.get('name') || '');

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [quests, setQuests] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
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
      updatedProfile = await base44.entities.AdventurerProfile.create({ adventurer_name: adventurerName, avatar_url: file_url });
    }
    setProfile(updatedProfile);
    setUploadingAvatar(false);
  };

  const canEdit = currentUser && (
    currentUser.role === 'admin' ||
    ADMIN_EMAILS.includes(currentUser.email) ||
    (currentUser.full_name || currentUser.email) === adventurerName
  );

  const formatTime = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-60" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-60" />

      <div className="relative max-w-2xl mx-auto px-4 py-10">
        <Link to={createPageUrl('QuestBoard')}
          className="inline-flex items-center gap-2 text-purple-500 hover:text-purple-300 text-xs mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quest Board
        </Link>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : !adventurerName ? (
          <p className="text-center text-slate-500">No adventurer specified.</p>
        ) : (
          <>
            {/* Profile Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-purple-800/50 overflow-hidden mb-6">

              {/* Banner */}
              <div className="h-28 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 relative">
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d1a]/80" />
              </div>

              <div className="px-6 pb-6 -mt-12 relative" style={{ background: 'linear-gradient(135deg, #0d0d1a, #0f0d22)' }}>
                <div className="flex items-end justify-between gap-4 mb-4">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full border-4 border-[#0d0d1a] overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center shadow-2xl">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-white">{adventurerName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                        </button>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                      </>
                    )}
                  </div>

                  {/* Edit controls */}
                  {canEdit && !editing && (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-400 hover:text-purple-200 hover:border-purple-500 transition-colors text-xs">
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  )}
                  {editing && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)} className="p-2 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={saveProfile} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                      </button>
                    </div>
                  )}
                </div>

                {/* Name */}
                {editing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40}
                    className="bg-transparent border-b border-purple-500 text-amber-300 text-2xl font-black outline-none w-full mb-1"
                    style={{ fontFamily: "'Caveat', cursive" }} />
                ) : (
                  <h1 className="text-2xl font-black text-amber-300 mb-1" style={{ fontFamily: "'Caveat', cursive" }}>
                    {profile?.adventurer_name || adventurerName}
                  </h1>
                )}
                <p className="text-[10px] text-purple-500 uppercase tracking-widest mb-3">Adventurer</p>

                {/* Bio */}
                {editing ? (
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={200} rows={3}
                    placeholder="Describe your adventurer lore..."
                    className="w-full bg-[#0d0820]/70 border border-purple-800/50 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none transition-colors" />
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {profile?.bio || <span className="text-slate-600 italic">No bio yet{canEdit ? ' — click Edit Profile to add one!' : '…'}</span>}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-900/30">
                  <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs text-slate-500">{comments.length} comment{comments.length !== 1 ? 's' : ''} posted</span>
                </div>
              </div>
            </motion.div>

            {/* Comment history */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-4">
                <Scroll className="w-4 h-4 text-amber-500" />
                <h2 className="text-xl font-black text-amber-400" style={{ fontFamily: "'Caveat', cursive" }}>Quest Lore Contributions</h2>
              </div>
              {comments.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-sm border border-purple-900/30 rounded-xl">
                  No comments yet — venture forth and leave your mark!
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map(c => {
                    const quest = quests[c.quest_id];
                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-purple-900/40 bg-purple-950/20 overflow-hidden">
                        {quest && (
                          <div className="px-4 py-1.5 bg-purple-900/20 border-b border-purple-900/30 flex items-center justify-between">
                            <span className="text-[10px] text-purple-500 uppercase tracking-widest">{quest.segment}</span>
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