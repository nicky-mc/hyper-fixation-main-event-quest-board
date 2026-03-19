import { useState, useEffect, useRef } from 'react';
import { Scroll, MessageCircle, Edit2, Save, X, ArrowLeft, Loader2, Camera, Shield, Crown, Zap, Trophy, Sword, UserPlus, UserMinus, UserCheck, Clock, MapPin, Star, Flame, Bookmark, CheckCircle2, Users, ShieldAlert, Ban, Eye, Lock, UserX, Radio, Send, Paperclip } from 'lucide-react';
import FeedPostItem from '@/components/FeedPostItem';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ImageViewerModal from '@/components/ImageViewerModal';
import CoverPositionEditor from '@/components/CoverPositionEditor';

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

function getCharacterClass(commentCount, isAdmin = false) {
  if (isAdmin) return { title: 'Guild Hostess ✦ Legendary', color: 'text-amber-300', icon: Crown };
  if (commentCount >= 50) return { title: 'Legendary Lore Master', color: 'text-amber-300', icon: Crown };
  if (commentCount >= 25) return { title: 'Veteran Quester', color: 'text-purple-300', icon: Trophy };
  if (commentCount >= 10) return { title: 'Seasoned Adventurer', color: 'text-cyan-300', icon: Shield };
  if (commentCount >= 3)  return { title: 'Journeyman Hero', color: 'text-green-300', icon: Sword };
  return { title: 'Novice Adventurer', color: 'text-slate-400', icon: Zap };
}

function StatPill({ label, value, color = 'text-purple-300', bg = 'bg-purple-900/30 border-purple-700/30' }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border font-lcars", bg)}>
      <span className={cn("text-xl font-black", color)}>{value}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function PrivacyGate({ privacyLevel, canSee, message }) {
  if (canSee) return null;
  const icons = { 'Private': Lock, 'Friends-Only': Users };
  const Icon = icons[privacyLevel] || Shield;
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-600 border border-white/10 bg-black/30 backdrop-blur-sm rounded-xl">
      <Icon className="w-10 h-10 opacity-20" />
      <p className="text-sm font-semibold text-slate-500">{message}</p>
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
  const [editPrivacy, setEditPrivacy] = useState('Public');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null); // current user's AdventurerProfile
  const [profileUserRole, setProfileUserRole] = useState(null);
  const [friendshipRecord, setFriendshipRecord] = useState(null);
  const [blockRecord, setBlockRecord] = useState(null); // BlockedUser record where I blocked them
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [friendTogglingLoading, setFriendTogglingLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [mutualCount, setMutualCount] = useState(0);
  const [activeTab, setActiveTab] = useState('quests');
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedActivities, setFeedActivities] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [postingFeed, setPostingFeed] = useState(false);
  const [feedAttachment, setFeedAttachment] = useState(null);
  const [feedPreview, setFeedPreview] = useState(null);
  const [isUploadingFeed, setIsUploadingFeed] = useState(false);
  const feedFileRef = useRef(null);
  const avatarRef = useRef(null);
  const coverRef = useRef(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [editingCoverPosition, setEditingCoverPosition] = useState(false);
  const [coverDisplay, setCoverDisplay] = useState({ position: { x: 50, y: 50 }, zoom: 100 });

  useEffect(() => {
    base44.auth.me().then(async u => {
      setCurrentUser(u);
      if (u) {
        const profs = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
        if (profs[0]) setMyProfile(profs[0]);
      }
    }).catch(() => {});
    if (!adventurerName) { setLoading(false); return; }
    loadAll();
  }, [adventurerName]);

  useEffect(() => {
    if (myProfile && profile) {
      loadFriendshipAndBlock();
      computeMutuals();
    }
  }, [myProfile?.id, profile?.id]);

  const loadAll = async () => {
    setLoading(true);
    const [profiles, allComments, submittedQuests] = await Promise.all([
      base44.entities.AdventurerProfile.filter({ adventurer_name: adventurerName }),
      base44.entities.QuestComment.filter({ adventurer_name: adventurerName }, '-created_date', 30),
      base44.entities.Quest.list('-created_date', 200),
    ]);
    const prof = profiles[0] || null;
    setProfile(prof);
    setEditBio(prof?.bio || '');
    setEditName(prof?.adventurer_name || adventurerName);
    setEditLocation(prof?.location || '');
    setEditFavSegment(prof?.favorite_segment || '');
    setEditPrivacy(prof?.privacy_level || 'Public');
    setCoverDisplay(prof?.cover_display ?? { position: { x: 50, y: 50 }, zoom: 100 });
    setComments(allComments);

    const mine = submittedQuests.filter(q => q.quest_giver === adventurerName || (prof && q.adventurer_id === prof.id));
    setMyQuests(mine);

    const map = {};
    submittedQuests.forEach(q => { map[q.id] = q; });
    setQuests(map);

    // Friend count using adventurer_id
    if (prof) {
      const [asRecipient, asRequester] = await Promise.all([
        base44.entities.Friendship.filter({ recipient_id: prof.id, status: 'accepted' }),
        base44.entities.Friendship.filter({ requester_id: prof.id, status: 'accepted' }),
      ]);
      setFriendCount(asRecipient.length + asRequester.length);
    }

    setProfileUserRole(prof?.role || 'user');
    if (prof) loadFeed(prof);
    setLoading(false);
  };

  const loadFriendshipAndBlock = async () => {
    if (!myProfile || !profile || myProfile.id === profile.id) return;
    const [sent, received, myBlocks, theirBlocks] = await Promise.all([
      base44.entities.Friendship.filter({ requester_id: myProfile.id, recipient_id: profile.id }),
      base44.entities.Friendship.filter({ requester_id: profile.id, recipient_id: myProfile.id }),
      base44.entities.BlockedUser.filter({ blocker_id: myProfile.id, blocked_id: profile.id }),
      base44.entities.BlockedUser.filter({ blocker_id: profile.id, blocked_id: myProfile.id }),
    ]);
    setFriendshipRecord(sent[0] || received[0] || null);
    setBlockRecord(myBlocks[0] || null);
    setIsBlockedByThem(theirBlocks.length > 0);
  };

  const computeMutuals = async () => {
    if (!myProfile || !profile || myProfile.id === profile.id) return;
    // Get my friends
    const [mySent, myReceived, theirSent, theirReceived] = await Promise.all([
      base44.entities.Friendship.filter({ requester_id: myProfile.id, status: 'accepted' }),
      base44.entities.Friendship.filter({ recipient_id: myProfile.id, status: 'accepted' }),
      base44.entities.Friendship.filter({ requester_id: profile.id, status: 'accepted' }),
      base44.entities.Friendship.filter({ recipient_id: profile.id, status: 'accepted' }),
    ]);
    const myFriendIds = new Set([
      ...mySent.map(f => f.recipient_id),
      ...myReceived.map(f => f.requester_id),
    ]);
    const theirFriendIds = new Set([
      ...theirSent.map(f => f.recipient_id),
      ...theirReceived.map(f => f.requester_id),
    ]);
    let mutual = 0;
    myFriendIds.forEach(id => { if (theirFriendIds.has(id)) mutual++; });
    setMutualCount(mutual);
  };

  const handleFriendAction = async () => {
    if (!myProfile) { base44.auth.redirectToLogin(window.location.pathname); return; }
    if (myProfile.id === profile?.id) return;
    setFriendTogglingLoading(true);

    if (!friendshipRecord) {
      const rec = await base44.entities.Friendship.create({
        requester_id: myProfile.id,
        requester_name: myProfile.adventurer_name,
        recipient_id: profile.id,
        recipient_name: profile.adventurer_name,
        status: 'pending',
      });
      setFriendshipRecord(rec);
    } else if (friendshipRecord.status === 'pending' && friendshipRecord.requester_id === myProfile.id) {
      await base44.entities.Friendship.delete(friendshipRecord.id);
      setFriendshipRecord(null);
    } else if (friendshipRecord.status === 'pending' && friendshipRecord.requester_id !== myProfile.id) {
      const updated = await base44.entities.Friendship.update(friendshipRecord.id, { status: 'accepted' });
      setFriendshipRecord(updated);
      setFriendCount(c => c + 1);
    } else if (friendshipRecord.status === 'accepted') {
      await base44.entities.Friendship.delete(friendshipRecord.id);
      setFriendshipRecord(null);
      setFriendCount(c => Math.max(0, c - 1));
    }
    setFriendTogglingLoading(false);
  };

  const handleBlockToggle = async () => {
    if (!myProfile || !profile) return;
    setBlockLoading(true);
    if (blockRecord) {
      await base44.entities.BlockedUser.delete(blockRecord.id);
      setBlockRecord(null);
    } else {
      // Also unfriend if friends
      if (friendshipRecord) {
        await base44.entities.Friendship.delete(friendshipRecord.id);
        setFriendshipRecord(null);
      }
      const rec = await base44.entities.BlockedUser.create({
        blocker_id: myProfile.id,
        blocked_id: profile.id,
      });
      setBlockRecord(rec);
    }
    setBlockLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const emailToSave = currentUser?.email || '';
    const roleToSave = currentUser?.role || 'user';
    const data = {
      adventurer_name: editName,
      bio: editBio,
      location: editLocation,
      favorite_segment: editFavSegment,
      privacy_level: editPrivacy,
      email: emailToSave,
      role: roleToSave,
    };
    if (profile) {
      await base44.entities.AdventurerProfile.update(profile.id, data);
    } else {
      await base44.entities.AdventurerProfile.create(data);
    }
    // If username changed, redirect to new URL so profile loads fresh with correct name
    if (editName !== adventurerName) {
      window.history.replaceState(null, '', `/AdventurerProfile?name=${encodeURIComponent(editName)}`);
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
    // reset position on new cover upload
  };

  const handleSaveCoverPosition = async (data) => {
    setCoverDisplay(data);
    setEditingCoverPosition(false);
    if (profile) await base44.entities.AdventurerProfile.update(profile.id, { cover_display: data });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const avatarUrl = profile?.avatar_url;
  const coverUrl = profile?.cover_url;
  const isProfileAdmin = profileUserRole === 'admin';
  const isCurrentUserAdmin = currentUser?.role === 'admin';
  const charClass = getCharacterClass(comments.length, isProfileAdmin);
  const CharIcon = charClass.icon;
  const isOwnProfile = myProfile?.id === profile?.id;
  const isFriend = friendshipRecord?.status === 'accepted';
  const privacyLevel = profile?.privacy_level || 'Public';

  // Privacy gate logic
  const canSeePrivate = isOwnProfile || isCurrentUserAdmin ||
    privacyLevel === 'Public' ||
    (privacyLevel === 'Friends-Only' && isFriend);

  const canMessage = !isOwnProfile && (isFriend || isCurrentUserAdmin) && !blockRecord && !isBlockedByThem;

  const privacyGateMessage = privacyLevel === 'Private'
    ? 'This adventurer keeps their details private.'
    : 'Add as friend to see more.';

  const handleAdminBan = async () => {
    if (!profile) return;
    if (!window.confirm(`Ban / suspend ${adventurerName}? This will mark their profile.`)) return;
    await base44.entities.AdventurerProfile.update(profile.id, { role: 'banned' });
    await loadAll();
  };

  const handleAdminPromote = async () => {
    if (!profile) return;
    if (!window.confirm(`Promote ${adventurerName} to Admin?`)) return;
    await base44.entities.AdventurerProfile.update(profile.id, { role: 'admin' });
    await loadAll();
  };

  const handleAdminDemote = async () => {
    if (!profile) return;
    if (!window.confirm(`Demote ${adventurerName} to regular User?`)) return;
    await base44.entities.AdventurerProfile.update(profile.id, { role: 'user' });
    await loadAll();
  };

  const loadFeed = async (prof) => {
    if (!prof) return;
    const [posts, activities] = await Promise.all([
      base44.entities.ProfilePost.filter({ profile_id: prof.id }, '-created_date', 50),
      base44.entities.Activity.filter({ adventurer_id: prof.id }, '-created_date', 50),
    ]);
    setFeedPosts(posts);
    setFeedActivities(activities);
  };

  const submitPost = async () => {
    if ((!newPost.trim() && !feedAttachment) || !myProfile || !profile) return;
    setPostingFeed(true);
    let media_url = undefined;
    if (feedAttachment) {
      setIsUploadingFeed(true);
      const result = await base44.integrations.Core.UploadFile({ file: feedAttachment });
      media_url = result.file_url;
      setIsUploadingFeed(false);
    }
    await base44.entities.ProfilePost.create({
      profile_id: profile.id,
      author_id: myProfile.id,
      author_name: myProfile.adventurer_name,
      content: newPost.trim(),
      ...(media_url && { media_url }),
    });
    // Notify wall owner if it's not their own post
    if (profile.auth_id && myProfile.id !== profile.id) {
      await base44.entities.Notification.create({
        target_auth_id: profile.auth_id,
        actor_name: myProfile.adventurer_name,
        type: 'wall_post',
        content: 'posted on your Comms Log',
        is_read: false,
        link_url: `/AdventurerProfile?name=${encodeURIComponent(profile.adventurer_name)}`,
      });
    }
    setNewPost('');
    setFeedAttachment(null);
    setFeedPreview(null);
    await loadFeed(profile);
    setPostingFeed(false);
  };

  const mergedFeed = [
    ...feedPosts.map(p => ({ ...p, _type: 'post' })),
    ...feedActivities.map(a => ({ ...a, _type: 'activity' })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const canPostOnFeed = myProfile && profile && (isOwnProfile || isFriend || isCurrentUserAdmin);

  const tabs = [
    { id: 'quests', label: 'Quests', icon: Sword, count: myQuests.length },
    { id: 'lore', label: 'Lore Drops', icon: MessageCircle, count: comments.length },
    { id: 'feed', label: 'Comms Log', icon: Radio },
    { id: 'about', label: 'About', icon: Star },
  ];

  // If I've blocked them or they've blocked me, show a minimal blocked view
  if (!loading && !isOwnProfile && (blockRecord || isBlockedByThem)) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>
        <div className="text-center max-w-sm mx-auto px-4">
          <UserX className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-500 mb-2">Profile Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6">
            {isBlockedByThem ? "You cannot view this profile." : "You have blocked this adventurer."}
          </p>
          {blockRecord && (
            <button onClick={handleBlockToggle} disabled={blockLoading}
              className="px-5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white text-sm font-bold transition-all">
              {blockLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
              Unblock
            </button>
          )}
          <div className="mt-4">
            <Link to={createPageUrl('QuestBoard')} className="text-xs text-purple-500 hover:text-purple-300">
              ← Back to Quest Board
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 30%, #080d1a 60%, #050a10 100%)' }}>

      <ImageViewerModal
        imageUrl={viewingImage?.url}
        alt={viewingImage?.alt}
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
      />

      <CoverPositionEditor
        key={editingCoverPosition ? 'open' : 'closed'}
        isOpen={editingCoverPosition}
        coverUrl={coverUrl}
        initialPosition={coverDisplay?.position || { x: 50, y: 50 }}
        initialZoom={coverDisplay?.zoom || 100}
        onSave={handleSaveCoverPosition}
        onCancel={() => setEditingCoverPosition(false)}
      />

      <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-red-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-amber-500 to-cyan-500 opacity-40 pointer-events-none z-40" />
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />

      {/* MAIN CONTENT AREA WITH LCARS ELBOW */}
      <div className="flex w-full items-start gap-[2px] px-4 pb-12 relative">
        
        {/* Left Vertical Spine: flush under the Top Nav */}
        <div className="hidden md:flex flex-col w-24 lg:w-32 bg-amber-500 rounded-l-[4rem] rounded-br-[2rem] shrink-0 sticky top-16 self-start h-[85vh] z-40 border-r-8 border-black"></div>

        {/* Right Column: Content wrapper */}
        <div className="flex-1 flex flex-col min-w-0 gap-1">
          
          {/* Top Horizontal Arm: locks at 64px, flush with spine */}
          <div className="hidden md:flex h-12 bg-amber-500 rounded-r-[4rem] rounded-tl-[2rem] items-center px-6 shrink-0 sticky top-16 z-40 shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            <span className="font-lcars text-black text-xl font-black tracking-widest">PERSONNEL RECORD</span>
          </div>

          {/* Profile Content: lower z so it scrolls under the arm */}
          <div className="flex-1 flex flex-col gap-4 relative z-20">

            <Link to={createPageUrl('QuestBoard')}
              className="font-lcars inline-flex items-center gap-1.5 text-purple-500 hover:text-purple-300 text-[10px] mb-2 transition-colors uppercase tracking-widest">
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
              className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md overflow-hidden mb-4">

              <div
                className="relative h-64 sm:h-80 lg:h-96 overflow-hidden cursor-pointer group"
                onClick={() => coverUrl && setViewingImage({ url: coverUrl, alt: 'cover' })}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="cover"
                    className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                    style={{
                      objectPosition: `${coverDisplay?.position?.x ?? 50}% ${coverDisplay?.position?.y ?? 50}%`,
                      transform: `scale(${(coverDisplay?.zoom ?? 100) / 100})`,
                      transformOrigin: `${coverDisplay?.position?.x ?? 50}% ${coverDisplay?.position?.y ?? 50}%`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full"
                    style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 40%, #1a1033 70%, #0a0a1a 100%)' }}>
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(168,85,247,0.3) 0px, rgba(168,85,247,0.3) 1px, transparent 1px, transparent 20px)', backgroundSize: '20px 20px' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-7xl opacity-20">⚔️</span>
                    </div>
                  </div>
                )}
                {isOwnProfile && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    {coverUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCoverPosition(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white text-xs font-semibold hover:bg-black/90 transition-all backdrop-blur-sm"
                      >
                        📍 Position
                      </button>
                    )}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 border border-white/20 text-white text-xs font-semibold hover:bg-black/90 transition-all backdrop-blur-sm cursor-pointer"
                      onClick={e => e.stopPropagation()}>
                      {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      {uploadingCover ? 'Uploading...' : 'Change Cover'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                    </label>
                  </div>
                )}
              </div>

              <div className="relative px-5 pb-5 bg-black/30">

                <div className="flex items-end justify-between -mt-16 sm:-mt-20 mb-4">
                  <div className="relative">
                    <div
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-[#0d0d1a] shadow-2xl shadow-black/60 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => avatarUrl && setViewingImage({ url: avatarUrl, alt: 'avatar' })}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900 flex items-center justify-center text-6xl sm:text-7xl font-black text-white">
                           {adventurerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isOwnProfile && (
                      <>
                        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        <button onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}
                          className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-purple-600 border-2 border-[#0d0d1a] flex items-center justify-center hover:bg-purple-500 transition-colors">
                          {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Camera className="w-5 h-5 text-white" />}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4 flex-wrap justify-end">
                    {isOwnProfile ? (
                      !editing ? (
                        <button onClick={() => setEditing(true)}
                          className="font-lcars flex items-center gap-1.5 px-5 py-2 rounded-full border border-amber-500/40 text-amber-400 hover:border-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-all uppercase tracking-widest">
                          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(false)}
                            className="px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-all">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={saveProfile} disabled={saving}
                           className="font-lcars flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 uppercase tracking-widest"
                           style={{ boxShadow: '0 0 16px rgba(251,191,36,0.3)' }}>
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                          </button>
                        </div>
                      )
                    ) : (
                      <>
                        <button onClick={handleFriendAction} disabled={friendTogglingLoading || !!blockRecord}
                          className={cn(
                            "font-lcars flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-black transition-all duration-300 uppercase tracking-widest",
                            !friendshipRecord
                              ? "bg-purple-700/70 border border-purple-500/40 text-white hover:bg-purple-600"
                              : friendshipRecord.status === 'pending' && friendshipRecord.requester_id === myProfile?.id
                              ? "bg-slate-800/60 border border-slate-600/50 text-slate-400 hover:border-red-600/50 hover:text-red-400"
                              : friendshipRecord.status === 'pending'
                              ? "bg-green-900/40 border border-green-600/50 text-green-300 hover:bg-green-800/60"
                              : "bg-purple-900/40 border border-purple-700/50 text-purple-300 hover:bg-red-900/30 hover:border-red-700/50 hover:text-red-300",
                            blockRecord && "opacity-40 cursor-not-allowed"
                          )}>
                          {friendTogglingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                            !friendshipRecord ? <><UserPlus className="w-3.5 h-3.5" /> Add Friend</> :
                            friendshipRecord.status === 'pending' && friendshipRecord.requester_id === myProfile?.id ? <><Clock className="w-3.5 h-3.5" /> Pending</> :
                            friendshipRecord.status === 'pending' ? <><UserCheck className="w-3.5 h-3.5" /> Accept</> :
                            <><UserMinus className="w-3.5 h-3.5" /> Unfriend</>
                          }
                        </button>
                        {canMessage && (
                          <Link to={createPageUrl('Messages') + '?chatWith=' + profile.id}
                            className="font-lcars flex items-center gap-1.5 px-5 py-2 rounded-full bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/60 text-xs font-bold transition-all uppercase tracking-widest"
                            style={{ boxShadow: '0 0 12px rgba(34,211,238,0.15)' }}>
                             <MessageCircle className="w-3.5 h-3.5" /> Message
                          </Link>
                        )}
                        {/* Block button */}
                        <button onClick={handleBlockToggle} disabled={blockLoading}
                          className={cn(
                            "font-lcars flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold transition-all border uppercase tracking-widest",
                            blockRecord
                              ? "bg-red-900/40 border-red-700/60 text-red-300 hover:bg-red-800/50"
                              : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-red-700/40 hover:text-red-400"
                          )}
                          title={blockRecord ? "Unblock user" : "Block user"}>
                          {blockLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{blockRecord ? 'Unblock' : 'Block'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Name + title */}
                {editing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40}
                    className="bg-transparent border-b-2 border-purple-500 text-amber-300 text-3xl font-black outline-none w-full mb-1" />
                ) : (
                  <h1 className="text-4xl font-black text-amber-300 leading-tight">
                    {profile?.adventurer_name || adventurerName}
                  </h1>
                )}

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <CharIcon className={cn("w-4 h-4", charClass.color)} />
                  <span className={cn("text-sm font-bold", charClass.color)}>{charClass.title}</span>
                  {/* Privacy badge */}
                  {!isOwnProfile && privacyLevel !== 'Public' && (
                    <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-500">
                      <Lock className="w-2.5 h-2.5" /> {privacyLevel}
                    </span>
                  )}
                  {mutualCount > 0 && !isOwnProfile && (
                    <span className="flex items-center gap-1 text-[10px] text-purple-500">
                      <Users className="w-3 h-3" /> {mutualCount} mutual
                    </span>
                  )}
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

                {/* Edit: fav segment + privacy */}
                {editing && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-purple-500 uppercase tracking-widest">Favourite Segment</label>
                      <select value={editFavSegment} onChange={e => setEditFavSegment(e.target.value)}
                        className="mt-1 w-full bg-purple-950/40 border border-purple-800/40 rounded-lg px-3 py-2 text-sm text-purple-100 focus:outline-none">
                        <option value="">— None selected —</option>
                        {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-purple-500 uppercase tracking-widest">Profile Privacy</label>
                      <select value={editPrivacy} onChange={e => setEditPrivacy(e.target.value)}
                        className="mt-1 w-full bg-purple-950/40 border border-purple-800/40 rounded-lg px-3 py-2 text-sm text-purple-100 focus:outline-none">
                        <option value="Public">🌐 Public</option>
                        <option value="Friends-Only">👥 Friends-Only</option>
                        <option value="Private">🔒 Private</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Admin Panel */}
                {isCurrentUserAdmin && !isOwnProfile && (
                  <div className="mt-4 p-3 rounded-xl border border-amber-500/30 bg-black/50 backdrop-blur-sm">
                    <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Admin Actions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleAdminPromote}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:bg-amber-900/30 transition-all border border-amber-700/40">
                        <Crown className="w-3 h-3" /> Make Admin
                      </button>
                      <button onClick={handleAdminDemote}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800/50 transition-all border border-slate-700/40">
                        <Shield className="w-3 h-3" /> Demote to User
                      </button>
                      <button onClick={handleAdminBan}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-900/20 transition-all border border-red-700/40">
                        <Ban className="w-3 h-3" /> Ban User
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-600 mt-2">
                      Role: <span className="text-slate-400 font-semibold">{profileUserRole}</span>
                      {profile?.email && <> · Email: <span className="text-slate-400">{profile.email}</span></>}
                    </p>
                  </div>
                )}

                {/* Stats bar — LCARS pill buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4 border-t border-white/10 pt-3">
                  <StatPill label="Quests" value={myQuests.length} color="text-red-400" bg="bg-red-900/20 border-red-700/30" />
                  <StatPill label="Comments" value={comments.length} color="text-cyan-400" bg="bg-cyan-900/20 border-cyan-700/30" />
                  <StatPill label="Friends" value={friendCount} color="text-amber-400" bg="bg-amber-900/20 border-amber-700/30" />
                  {mutualCount > 0 && !isOwnProfile && (
                    <StatPill label="Mutual" value={mutualCount} color="text-purple-400" bg="bg-purple-900/30 border-purple-700/30" />
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── TABS ── */}
            {/* LCARS Tab Bar */}
            <div className="flex gap-1 mb-4">
              {/* Left accent bar */}
              <div className="w-1.5 rounded-full bg-gradient-to-b from-amber-500 via-purple-500 to-cyan-500 shrink-0" />
              <div className="flex gap-1 flex-1 p-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "font-lcars flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest",
                        activeTab === tab.id
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "text-slate-500 hover:text-purple-300"
                      )}
                      style={activeTab === tab.id ? { boxShadow: '0 0 12px rgba(251,191,36,0.2)' } : {}}>
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold hidden sm:inline",
                          activeTab === tab.id ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-slate-600")}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── TAB CONTENT ── */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                {/* QUESTS TAB — always visible */}
                {activeTab === 'quests' && (
                  <div className="space-y-2">
                    {myQuests.length === 0 ? (
                      <div className="py-12 text-center text-slate-600 border border-white/10 bg-black/30 backdrop-blur-sm rounded-xl flex flex-col items-center gap-2">
                        <Sword className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No quests submitted yet.</p>
                      </div>
                    ) : myQuests.map(q => {
                      const cfg = statusConfig[q.status] || statusConfig.pending;
                      const StatusIcon = cfg.icon;
                      return (
                        <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm hover:border-white/20 transition-all">
                          <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-purple-100 truncate">{q.title}</p>
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

                {/* LORE DROPS — gated by privacy */}
                {activeTab === 'lore' && !canSeePrivate && (
                  <PrivacyGate privacyLevel={privacyLevel} canSee={false} message={privacyGateMessage} />
                )}
                {activeTab === 'lore' && canSeePrivate && (
                  <div className="space-y-2">
                    {comments.length === 0 ? (
                      <div className="py-12 text-center text-slate-600 border border-white/10 bg-black/30 backdrop-blur-sm rounded-xl flex flex-col items-center gap-2">
                        <MessageCircle className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No lore contributions yet.</p>
                      </div>
                    ) : comments.map(c => {
                      const quest = quests[c.quest_id];
                      return (
                        <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
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

                {/* COMMS LOG — gated by privacy */}
                {activeTab === 'feed' && !canSeePrivate && (
                  <PrivacyGate privacyLevel={privacyLevel} canSee={false} message={privacyGateMessage} />
                )}
                {activeTab === 'feed' && canSeePrivate && (
                  <div className="space-y-3">
                    {/* Post input — only for friends/owner/admin */}
                    {canPostOnFeed && (
                      <div className="rounded-xl border border-purple-800/40 bg-black/40 backdrop-blur-sm p-3 space-y-2">
                        {feedPreview && (
                          <div className="relative inline-block">
                            <img src={feedPreview} alt="preview" className="max-h-32 rounded-lg border border-purple-800/50 object-cover" />
                            <button onClick={() => { setFeedAttachment(null); setFeedPreview(null); }}
                              className="absolute top-1 right-1 p-0.5 bg-black/80 text-white rounded-full hover:bg-red-700 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <textarea
                            value={newPost}
                            onChange={e => setNewPost(e.target.value)}
                            placeholder="Post a transmission..."
                            rows={2}
                            className="flex-1 resize-none bg-transparent text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none"
                          />
                          <input ref={feedFileRef} type="file" accept="image/*" className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setFeedAttachment(f);
                              setFeedPreview(URL.createObjectURL(f));
                            }} />
                          <button onClick={() => feedFileRef.current?.click()}
                            className={cn("shrink-0 p-2 rounded-xl transition-all border", feedPreview ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-white/5 border-white/10 text-slate-500 hover:text-amber-400")}>
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button onClick={submitPost} disabled={postingFeed || isUploadingFeed || (!newPost.trim() && !feedAttachment)}
                            className="shrink-0 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all disabled:opacity-40">
                            {(postingFeed || isUploadingFeed) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mergedFeed.length === 0 ? (
                      <div className="py-12 text-center text-slate-600 border border-white/10 bg-black/30 backdrop-blur-sm rounded-xl flex flex-col items-center gap-2">
                        <Radio className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No transmissions yet.</p>
                      </div>
                    ) : mergedFeed.map(item => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-purple-900/40 bg-black/40 backdrop-blur-sm overflow-hidden">
                        {item._type === 'post' ? (
                          <FeedPostItem
                            post={item}
                            myProfile={myProfile}
                            onImageClick={setViewingImage}
                          />
                        ) : (
                          <div className="p-4">
                            <div className="flex items-start gap-2">
                              <div className="px-2 py-0.5 rounded bg-purple-900/50 border border-purple-700/40 text-[9px] font-lcars text-purple-400 uppercase tracking-widest shrink-0 mt-0.5">
                                {item.type === 'quest_submitted' ? '⚔️ Quest' : item.type === 'comment_added' ? '💬 Comment' : '⬆️ Vote'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-300 leading-relaxed">
                                  {item.type === 'quest_submitted' && item.quest_title
                                    ? <><span className="text-purple-300 font-bold">{profile?.adventurer_name}</span> submitted a new quest: <span className="text-amber-300 font-bold">{item.quest_title}</span></>
                                    : item.type === 'comment_added' && item.quest_title
                                    ? <><span className="text-purple-300 font-bold">{profile?.adventurer_name}</span> dropped lore on <span className="text-amber-300 font-bold">{item.quest_title}</span></>
                                    : item.content || item.type
                                  }
                                </p>
                                <span className="text-[9px] text-slate-600 mt-1 block">{formatTime(item.created_date)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* ABOUT — gated by privacy */}
                {activeTab === 'about' && !canSeePrivate && (
                  <PrivacyGate privacyLevel={privacyLevel} canSee={false} message={privacyGateMessage} />
                )}
                {activeTab === 'about' && canSeePrivate && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-md p-5 space-y-4">
                      <h3 className="font-lcars text-sm font-black text-amber-400 uppercase tracking-widest">◈ Personnel File</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest">Class / Rank</p>
                          <div className="flex items-center gap-1.5">
                            <CharIcon className={cn("w-4 h-4", charClass.color)} />
                            <span className={cn("font-bold", charClass.color)}>{charClass.title}</span>
                          </div>
                        </div>

                        {profile?.location && (
                          <div className="space-y-1">
                            <p className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest">Realm</p>
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <MapPin className="w-4 h-4 text-purple-500" />{profile.location}
                            </div>
                          </div>
                        )}

                        {profile?.favorite_segment && (
                          <div className="space-y-1">
                            <p className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest">Favourite Segment</p>
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Star className="w-4 h-4 text-amber-400" />{profile.favorite_segment}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest">Quest Level</p>
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-orange-400" />
                            {isProfileAdmin ? (
                              <span className="font-bold text-amber-300">MAX ✦ Guild Master</span>
                            ) : (
                              <span className="text-slate-300">Level {Math.max(1, Math.floor((myQuests.length * 100 + comments.length * 25) / 200) + 1)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {profile?.bio && (
                        <div className="pt-3 border-t border-purple-900/30">
                          <p className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest mb-1.5">Adventurer Lore</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-purple-900/30">
                        <p className="font-lcars text-[9px] text-purple-400 uppercase tracking-widest mb-3">Achievements</p>
                        <div className="flex flex-wrap gap-2">
                          {myQuests.length >= 1 && <span className="px-3 py-1 rounded-full bg-red-900/30 border border-red-700/40 text-red-300 text-xs font-bold">⚔️ First Quest</span>}
                          {myQuests.length >= 5 && <span className="px-3 py-1 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300 text-xs font-bold">🏆 5 Quests</span>}
                          {comments.length >= 1 && <span className="px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-bold">📜 First Lore Drop</span>}
                          {comments.length >= 10 && <span className="px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-700/40 text-cyan-300 text-xs font-bold">💬 Lore Weaver</span>}
                          {friendCount >= 5 && <span className="px-3 py-1 rounded-full bg-green-900/30 border border-green-700/40 text-green-300 text-xs font-bold">👥 Popular Hero</span>}
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
      </div>
    </div>
  );
}