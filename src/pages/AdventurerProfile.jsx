import { useState, useEffect, useRef } from 'react';
import { Scroll, MessageCircle, Edit2, Save, X, ArrowLeft, Loader2, Camera, Shield, Crown, Zap, Trophy, Sword, UserPlus, UserMinus, MapPin, Star, Flame, Bookmark, CheckCircle2, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SEGMENTS = [
  'The Gimmick Check','Patch Notes','World Building','Roll for Initiative','The Tavern Entry',
  'The Main Quest','Heart of the Story','The Loot Drop','The Respec','Glitches in the Holodeck',
  'Critical Fails & Jump Scares','The Hyper-fixation Main Event','The Dark Match','Heel Turn',
  'The Co-Op Club','Character Sheets','Shark Week Special',"Captain's Log"
];

const statusConfig = {
  pending:   { label: 'Pending',   icon: Clock,        color: 'text-slate-400',  bg: 'bg-slate-800/40 border-slate-700/40' },
  selected:  { label: 'On Air!',   icon: Star,         color: 'text-amber-400',  bg: 'bg-amber-900/20 border-amber-600/40' },
  completed: { label: 'Done',      icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-900/20 border-green-700/40' },
};

function getCharacterClass(commentCount) {
  if (commentCount >= 50) return { title: 'Legendary Lore Master', color: 'text-amber-300', icon: Crown };
  if (commentCount >= 25) return { title: 'Veteran Quester', color: 'text-purple-300', icon: Trophy };
  if (commentCount >= 10) return { title: 'Seasoned Adventurer', color: 'text-cyan-300', icon: Shield };
  if (commentCount >= 3)  return { title: 'Journeyman Hero', color: 'text-green-300', icon: Sword };
  return { title: 'Novice Adventurer', color: 'text-slate-400', icon: Zap };
}

function StatPill({ label, value, color = 'text-purple-300' }) {
  return (
    <div className="flex flex-col items-center px-4 py-2">
      <span className={cn("text-2xl font-black", color)} style={{ fontFamily: "'Caveat', cursive" }}>{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function AdventurerProfile() {
  const params = new URLSearchParams(window.location.search);
  const adventurerName = decodeURIComponent(params.get('name') || '');

  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [quests, setQuests] = useState({});
  const [myQuests, setMyQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editFavSegment, setEditFavSegment] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [friendshipRecord, setFriendshipRecord] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendTogglingLoading, setFriendTogglingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quests');
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    if (!adventurerName) { setLoading(false); return; }
    loadAll();
  }, [adventurerName]);

  // Load friendship once currentUser is known
  useEffect(() => {
    if (currentUser && adventurerName) loadFriendship();
  }, [currentUser, adventurerName]);

  const loadAll = async () => {
    setLoading(true);
    const [profiles, allComments, submittedQuests] = await Promise.all([
      base44.entities.AdventurerProfile.filter({ adventurer_name: adventurerName }),
      base44.entities.QuestComment.filter({ author_name: adventurerName }, '-created_date', 30),
      base44.entities.Quest.list('-created_date', 200),
    ]);
    const prof = profiles[0] || null;
    setProfile(prof);
    setEditBio(prof?.bio || '');
    setEditName(prof?.adventurer_name || adventurerName);
    setEditLocation(prof?.location || '');
    setEditFavSegment(prof?.favorite_segment || '');
    setComments(allComments);

    const mine = submittedQuests.filter(q => q.quest_giver === adventurerName);
    setMyQuests(mine);

    const questIds = [...new Set(allComments.map(c => c.quest_id))];
    if (questIds.length > 0) {
      const map = {};
      submittedQuests.forEach(q => { map[q.id] = q; });
      setQuests(map);
    } else {
      const map = {};
      submittedQuests.forEach(q => { map[q.id] = q; });
      setQuests(map);
    }

    // follower / following counts
    const [followers, following] = await Promise.all([
      base44.entities.Friendship.filter({ following_name: adventurerName }),
      base44.entities.Friendship.filter({ follower_name: adventurerName }),
    ]);
    setFollowerCount(followers.length);
    setFollowingCount(following.length);

    setLoading(false);
  };

  const loadFriendship = async () => {
    if (!currentUser) return;
    const myName = currentUser.full_name || currentUser.email;
    const records = await base44.entities.Friendship.filter({ follower_email: currentUser.email, following_name: adventurerName });
    setFriendshipRecord(records[0] || null);
  };

  const toggleFollow = async () => {
    if (!currentUser) { base44.auth.redirectToLogin(window.location.pathname); return; }
    const myName = currentUser.full_name || currentUser.email;
    if (myName === adventurerName) return;
    setFriendTogglingLoading(true);
    if (friendshipRecord) {
      await base44.entities.Friendship.delete(friendshipRecord.id);
      setFriendshipRecord(null);
      setFollowerCount(c => c - 1);
    } else {
      const rec = await base44.entities.Friendship.create({
        follower_name: myName,
        follower_email: currentUser.email,
        following_name: adventurerName,
      });
      setFriendshipRecord(rec);
      setFollowerCount(c => c + 1);
    }
    setFriendTogglingLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const data = { adventurer_name: editName, bio: editBio, location: editLocation, favorite_segment: editFavSegment };
    if (profile) {
      await base44.entities.AdventurerProfile.update(profile.id, data);
    } else {
      await base44.entities.AdventurerProfile.create(data);
    }
    await loadAll();
    setEditing(false);
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (profile) await base44.entities.AdventurerProfile.update(profile.id, { avatar_url: file_url });
    else await base44.entities.AdventurerProfile.create({ adventurer_name: adventurerName, avatar_url: file_url });
    await loadAll(); setUploadingAvatar(false);
    if (avatarRef.current) avatarRef.current.value = '';
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (profile) await base44.entities.AdventurerProfile.update(profile.id, { cover_url: file_url });
    else await base44.entities.AdventurerProfile.create({ adventurer_name: adventurerName, cover_url: file_url });
    await loadAll(); setUploadingCover(false);
    if (coverRef.current) coverRef.current.value = '';
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const avatarUrl = profile?.avatar_url;
  const coverUrl = profile?.cover_url;
  const charClass = getCharacterClass(comments.length);
  const CharIcon = charClass.icon;
  const myName = currentUser ? (currentUser.full_name || currentUser.email) : null;
  const isOwnProfile = myName === adventurerName;

  const tabs = [
    { id: 'quests', label: 'Quests', icon: Sword, count: myQuests.length },
    { id: 'lore', label: 'Lore Drops', icon: MessageCircle, count: comments.length },
    { id: 'about', label: 'About', icon: Star },
  ];

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>

      <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />

      <div className="relative max-w-3xl mx-auto px-4 pt-6 pb-12">

        <Link to={createPageUrl('QuestBoard')}
          className="inline-flex items-center gap-1.5 text-purple-500 hover:text-purple-300 text-xs mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quest Board
        </Link>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : !adventurerName ? (
          <p className="text-center text-slate-500">No adventurer specified.</p>
        ) : (
          <>
            {/* ── COVER + AVATAR ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-purple-700/40 overflow-hidden mb-4">

              {/* Cover photo */}
              <div className="relative h-44 sm:h-56 group">
                {coverUrl ? (
                  <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full"
                    style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 40%, #1a1033 70%, #0a0a1a 100%)' }}>
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(168,85,247,0.3) 0px, rgba(168,85,247,0.3) 1px, transparent 1px, transparent 20px)', backgroundSize: '20px 20px' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-7xl opacity-20">⚔️</span>
                    </div>
                  </div>
                )}
                {/* Cover upload overlay */}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
                    <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    <button onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold hover:bg-black/90 transition-all">
                      {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      {uploadingCover ? 'Uploading...' : 'Change Cover'}
                    </button>
                  </div>
                )}
              </div>

              {/* Profile info below cover */}
              <div className="relative px-5 pb-5"
                style={{ background: 'linear-gradient(180deg, #0d0d1a, #0a0d1e)' }}>

                {/* Avatar — overlapping the cover */}
                <div className="flex items-end justify-between -mt-12 mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#0d0d1a] shadow-2xl shadow-black/60">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 flex items-center justify-center text-4xl font-black text-white">
                          {adventurerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isOwnProfile && (
                      <>
                        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        <button onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}
                          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-600 border-2 border-[#0d0d1a] flex items-center justify-center hover:bg-purple-500 transition-colors">
                          {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Camera className="w-3 h-3 text-white" />}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    {isOwnProfile ? (
                      !editing ? (
                        <button onClick={() => setEditing(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-700/50 text-purple-300 hover:border-purple-500 hover:text-purple-100 text-sm font-semibold transition-all">
                          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditing(false); }}
                            className="px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-all">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={saveProfile} disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 text-white text-sm font-semibold hover:bg-purple-600 transition-all disabled:opacity-50">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                          </button>
                        </div>
                      )
                    ) : (
                      <button onClick={toggleFollow} disabled={friendTogglingLoading}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                          friendshipRecord
                            ? "bg-purple-900/40 border border-purple-700/50 text-purple-300 hover:bg-red-900/30 hover:border-red-700/50 hover:text-red-300"
                            : "bg-purple-700 border border-purple-500/50 text-white hover:bg-purple-600"
                        )}>
                        {friendTogglingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                          friendshipRecord ? <><UserMinus className="w-3.5 h-3.5" /> Unfollow</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Name + title */}
                {editing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40}
                    className="bg-transparent border-b-2 border-purple-500 text-amber-300 text-3xl font-black outline-none w-full mb-1"
                    style={{ fontFamily: "'Caveat', cursive" }} />
                ) : (
                  <h1 className="text-4xl font-black text-amber-300 leading-tight"
                    style={{ fontFamily: "'Caveat', cursive" }}>{profile?.adventurer_name || adventurerName}</h1>
                )}

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <CharIcon className={cn("w-4 h-4", charClass.color)} />
                  <span className={cn("text-sm font-bold", charClass.color)}>{charClass.title}</span>
                  {(profile?.location || editing) && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {editing ? (
                        <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Your realm..."
                          className="bg-transparent border-b border-purple-700 text-slate-300 text-xs outline-none w-28" />
                      ) : profile?.location}
                    </span>
                  )}
                </div>

                {/* Bio */}
                <div className="mt-3">
                  {editing ? (
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={250} rows={2}
                      placeholder="Your adventurer lore..."
                      className="w-full bg-purple-950/30 border border-purple-800/40 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none resize-none" />
                  ) : (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {profile?.bio || (isOwnProfile && <span className="text-slate-600 italic cursor-pointer hover:text-slate-400" onClick={() => setEditing(true)}>+ Add a bio...</span>)}
                    </p>
                  )}
                </div>

                {/* Favourite segment edit */}
                {editing && (
                  <div className="mt-2">
                    <label className="text-[10px] text-purple-500 uppercase tracking-widest">Favourite Segment</label>
                    <select value={editFavSegment} onChange={e => setEditFavSegment(e.target.value)}
                      className="mt-1 w-full bg-purple-950/40 border border-purple-800/40 rounded-lg px-3 py-2 text-sm text-purple-100 focus:outline-none">
                      <option value="">— None selected —</option>
                      {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center mt-4 border-t border-purple-900/30 pt-3 divide-x divide-purple-900/30">
                  <StatPill label="Quests" value={myQuests.length} color="text-red-400" />
                  <StatPill label="Comments" value={comments.length} color="text-cyan-400" />
                  <StatPill label="Followers" value={followerCount} color="text-amber-400" />
                  <StatPill label="Following" value={followingCount} color="text-purple-400" />
                </div>
              </div>
            </motion.div>

            {/* ── TABS ── */}
            <div className="flex gap-1 p-1 rounded-xl bg-purple-950/40 border border-purple-900/40 mb-4">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                      activeTab === tab.id ? "bg-purple-700/60 text-purple-100 shadow" : "text-purple-500 hover:text-purple-300"
                    )}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold hidden sm:inline",
                        activeTab === tab.id ? "bg-purple-500/30 text-purple-200" : "bg-purple-900/50 text-purple-600")}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── TAB CONTENT ── */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                {/* QUESTS TAB */}
                {activeTab === 'quests' && (
                  <div className="space-y-2">
                    {myQuests.length === 0 ? (
                      <div className="py-12 text-center text-slate-600 border border-purple-900/30 rounded-xl flex flex-col items-center gap-2">
                        <Sword className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No quests submitted yet.</p>
                      </div>
                    ) : myQuests.map(q => {
                      const cfg = statusConfig[q.status] || statusConfig.pending;
                      const StatusIcon = cfg.icon;
                      return (
                        <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-4 rounded-xl border border-purple-900/30 bg-purple-950/20 hover:border-purple-700/50 transition-all">
                          <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-purple-100 truncate" style={{ fontFamily: "'Caveat', cursive", fontSize: '1rem' }}>{q.title}</p>
                            <p className="text-[9px] text-slate-600 truncate">{q.segment} · DC {q.difficulty_class}</p>
                          </div>
                          <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
                            <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* LORE DROPS TAB */}
                {activeTab === 'lore' && (
                  <div className="space-y-2">
                    {comments.length === 0 ? (
                      <div className="py-12 text-center text-slate-600 border border-purple-900/30 rounded-xl flex flex-col items-center gap-2">
                        <MessageCircle className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No lore contributions yet.</p>
                      </div>
                    ) : comments.map(c => {
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

                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-5 space-y-4">
                      <h3 className="text-lg font-black text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>Character Sheet</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] text-purple-500 uppercase tracking-widest">Class / Rank</p>
                          <div className="flex items-center gap-1.5">
                            <CharIcon className={cn("w-4 h-4", charClass.color)} />
                            <span className={cn("font-bold", charClass.color)}>{charClass.title}</span>
                          </div>
                        </div>

                        {profile?.location && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-purple-500 uppercase tracking-widest">Realm</p>
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <MapPin className="w-4 h-4 text-purple-500" />{profile.location}
                            </div>
                          </div>
                        )}

                        {profile?.favorite_segment && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-purple-500 uppercase tracking-widest">Favourite Segment</p>
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Star className="w-4 h-4 text-amber-400" />{profile.favorite_segment}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-[10px] text-purple-500 uppercase tracking-widest">Quest Level</p>
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Flame className="w-4 h-4 text-orange-400" />Level {Math.max(1, Math.floor((myQuests.length * 100 + comments.length * 25) / 200) + 1)}
                          </div>
                        </div>
                      </div>

                      {profile?.bio && (
                        <div className="pt-3 border-t border-purple-900/30">
                          <p className="text-[10px] text-purple-500 uppercase tracking-widest mb-1.5">Adventurer Lore</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
                        </div>
                      )}

                      {/* Milestone badges */}
                      <div className="pt-3 border-t border-purple-900/30">
                        <p className="text-[10px] text-purple-500 uppercase tracking-widest mb-3">Achievements</p>
                        <div className="flex flex-wrap gap-2">
                          {myQuests.length >= 1 && <span className="px-3 py-1 rounded-full bg-red-900/30 border border-red-700/40 text-red-300 text-xs font-bold">⚔️ First Quest</span>}
                          {myQuests.length >= 5 && <span className="px-3 py-1 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300 text-xs font-bold">🏆 5 Quests</span>}
                          {comments.length >= 1 && <span className="px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-bold">📜 First Lore Drop</span>}
                          {comments.length >= 10 && <span className="px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-700/40 text-cyan-300 text-xs font-bold">💬 Lore Weaver</span>}
                          {followerCount >= 5 && <span className="px-3 py-1 rounded-full bg-green-900/30 border border-green-700/40 text-green-300 text-xs font-bold">👥 Popular Hero</span>}
                          {myQuests.some(q => q.status === 'completed') && <span className="px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 text-xs font-bold">✅ Quest Completed</span>}
                          {myQuests.length === 0 && comments.length === 0 && (
                            <span className="text-xs text-slate-600 italic">Complete quests and drop lore to earn badges!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}