import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, ChevronUp, MessageCircle, Zap, Image, Video, Upload, X, Loader2, Send, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  quest_submitted: { icon: Scroll,       color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',  label: 'posted a quest' },
  quest_voted:     { icon: ChevronUp,    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',   label: 'upvoted' },
  comment_added:   { icon: MessageCircle,color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', label: 'commented on' },
};

function ActivityItem({ activity }) {
  const cfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.comment_added;
  const Icon = cfg.icon;
  const isVideo = activity.media_type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, y: -4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn("flex gap-2.5 p-3 rounded-xl border", cfg.bg)}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 border border-purple-600/40 flex items-center justify-center text-[11px] font-black text-purple-200 shrink-0">
        {(activity.user_name || '?').charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Action line */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Icon className={cn("w-3 h-3 shrink-0", cfg.color)} />
          <span className="text-xs font-bold text-purple-200" style={{ fontFamily: "'Caveat', cursive" }}>
            {activity.user_name}
          </span>
          <span className="text-[10px] text-slate-500">{cfg.label}</span>
          {activity.quest_title && (
            <span className="text-[10px] text-purple-400 font-semibold truncate max-w-[100px]">
              "{activity.quest_title}"
            </span>
          )}
        </div>

        {/* Comment content */}
        {activity.content && (
          <p className="text-[11px] text-slate-300 leading-relaxed break-words line-clamp-2">
            {activity.content}
          </p>
        )}

        {/* Media */}
        {activity.media_url && (
          <div className="mt-1.5 rounded-lg overflow-hidden border border-white/10 max-h-40">
            {isVideo ? (
              <video src={activity.media_url} controls className="w-full max-h-40 object-cover" />
            ) : (
              <img src={activity.media_url} alt="media" className="w-full max-h-40 object-cover" />
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[9px] text-slate-600 block">
          {activity.created_date ? formatDistanceToNow(new Date(activity.created_date), { addSuffix: true }) : 'just now'}
        </span>
      </div>
    </motion.div>
  );
}

function MediaUploadButton({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    onUploaded({ url: result.file_url, type: isVideo ? 'video' : 'image' });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="p-2 rounded-lg border border-purple-800/40 bg-purple-900/20 text-purple-500 hover:text-purple-300 hover:border-purple-600/60 transition-all disabled:opacity-50"
        title="Attach photo or video"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
      </button>
    </>
  );
}

export default function ActivityStream() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Post form
  const [postName, setPostName] = useState('');
  const [postContent, setPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); if (u?.full_name) setPostName(u.full_name); }).catch(() => {});
    loadActivities();

    const unsub = base44.entities.Activity.subscribe((event) => {
      if (event.type === 'create') {
        setActivities(prev => [event.data, ...prev].slice(0, 50));
      } else if (event.type === 'delete') {
        setActivities(prev => prev.filter(a => a.id !== event.id));
      }
    });
    return unsub;
  }, []);

  const loadActivities = async () => {
    const data = await base44.entities.Activity.list('-created_date', 50);
    setActivities(data);
    setLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postName.trim() || !postContent.trim()) return;
    setPosting(true);
    await base44.entities.Activity.create({
      type: 'comment_added',
      user_name: postName.trim(),
      user_email: user?.email || '',
      content: postContent.trim(),
      ...(mediaUrl && { media_url: mediaUrl, media_type: mediaType }),
    });
    setPostContent('');
    setMediaUrl(null);
    setMediaType(null);
    setPosting(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Activity className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Live Activity</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
      </div>

      {/* Post form */}
      <form onSubmit={handlePost} className="mb-3 space-y-2 p-3 rounded-xl border border-purple-900/40 bg-white/[0.02]">
        <input
          value={postName}
          onChange={e => setPostName(e.target.value)}
          placeholder="Your name..."
          maxLength={40}
          className="w-full px-3 py-1.5 rounded-lg bg-[#0d0820]/70 border border-purple-800/40 text-purple-100 placeholder:text-slate-600 text-xs focus:outline-none focus:border-purple-500"
        />
        <div className="flex gap-2 items-start">
          <textarea
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="Share something with the community..."
            maxLength={400}
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg bg-[#0d0820]/70 border border-purple-800/40 text-purple-100 placeholder:text-slate-600 text-xs focus:outline-none focus:border-purple-500 resize-none"
          />
          <div className="flex flex-col gap-1.5">
            <MediaUploadButton onUploaded={({ url, type }) => { setMediaUrl(url); setMediaType(type); }} />
            <button
              type="submit"
              disabled={posting || !postName.trim() || !postContent.trim()}
              className="p-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white border border-purple-500/40 transition-all disabled:opacity-40"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* Media preview */}
        {mediaUrl && (
          <div className="relative rounded-lg overflow-hidden border border-purple-700/30 max-h-28">
            {mediaType === 'video'
              ? <video src={mediaUrl} className="w-full max-h-28 object-cover" />
              : <img src={mediaUrl} alt="preview" className="w-full max-h-28 object-cover" />}
            <button
              type="button"
              onClick={() => { setMediaUrl(null); setMediaType(null); }}
              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </form>

      {/* Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-6">No activity yet — be the first!</p>
        ) : (
          <AnimatePresence initial={false}>
            {activities.map(a => <ActivityItem key={a.id} activity={a} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}