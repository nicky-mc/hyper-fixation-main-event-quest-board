import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, MessageCircle, ArrowLeft, Smile, Paperclip, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import OnlineDot from '@/components/OnlineDot';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function Avatar({ name, avatarUrl, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={cn("rounded-full shrink-0 flex items-center justify-center font-black text-white overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900", sizes[size])}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        : (name || '?').charAt(0).toUpperCase()
      }
    </div>
  );
}

function SkeletonConvo() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-2.5 bg-white/5 rounded w-3/4" />
      </div>
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function Messages() {
  const [profile, setProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [partnerProfiles, setPartnerProfiles] = useState({});
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const initProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profs = await base44.entities.AdventurerProfile.list();
          const prof = profs.find(p => p.email === user.email);
          if (prof) {
            setProfile(prof);
            await loadData(prof);
            const [myBlocks, theirBlocks] = await Promise.all([
              base44.entities.BlockedUser.filter({ blocker_id: prof.id }),
              base44.entities.BlockedUser.filter({ blocked_id: prof.id }),
            ]);
            const ids = new Set([
              ...myBlocks.map(b => b.blocked_id),
              ...theirBlocks.map(b => b.blocker_id),
            ]);
            setBlockedIds(ids);
          }
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    };
    initProfile();
  }, []);

  const loadData = async (prof) => {
    const isAdmin = prof.role === 'admin';
    let msgs = await base44.entities.Message.list('-created_date', 500);

    msgs = await Promise.all(msgs.map(async (m) => {
      if (!m.sender_id && m.sender_email) {
        const senderProf = (await base44.entities.AdventurerProfile.filter({ email: m.sender_email }))[0];
        const recipProf = (await base44.entities.AdventurerProfile.filter({ email: m.recipient_email }))[0];
        if (senderProf && recipProf) {
          return base44.entities.Message.update(m.id, {
            sender_id: senderProf.id, sender_name: senderProf.adventurer_name,
            recipient_id: recipProf.id, recipient_name: recipProf.adventurer_name,
          }).then(() => ({ ...m, sender_id: senderProf.id, sender_name: senderProf.adventurer_name, recipient_id: recipProf.id, recipient_name: recipProf.adventurer_name }));
        }
      }
      return m;
    }));

    setMessages(msgs);

    const unread = msgs.filter(m => m.recipient_id === prof.id && !m.read);
    for (const m of unread) {
      await base44.entities.Message.update(m.id, { read: true });
    }

    const partnerMap = {};
    msgs.forEach(m => {
      const addPartner = (partId, name) => {
        if (partId && partId !== prof.id && !partnerMap[partId]) {
          partnerMap[partId] = { id: partId, full_name: name || partId };
        }
      };
      if (isAdmin) {
        addPartner(m.sender_id, m.sender_name);
        addPartner(m.recipient_id, m.recipient_name || m.recipient_id);
      } else {
        if (m.sender_id === prof.id) addPartner(m.recipient_id, m.recipient_name);
        if (m.recipient_id === prof.id) addPartner(m.sender_id, m.sender_name);
      }
    });

    const users = Object.values(partnerMap);
    setAllUsers(users);
    if (users.length > 0) {
      const allProfs = await base44.entities.AdventurerProfile.list('adventurer_name', 200);
      const profMap = {};
      allProfs.forEach(p => { profMap[p.id] = p; });
      setPartnerProfiles(profMap);
    }
  };

  useEffect(() => {
    if (!profile) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create') {
        const m = event.data;
        if (m.sender_id === profile.id || m.recipient_id === profile.id) {
          setMessages(prev => [m, ...prev]);
          if (m.recipient_id === profile.id) {
            base44.entities.Message.update(m.id, { read: true });
            setAllUsers(prev => {
              if (prev.find(u2 => u2.id === m.sender_id)) return prev;
              return [...prev, { id: m.sender_id, full_name: m.sender_name }];
            });
          }
        }
      }
    });
    return unsub;
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const selectUser = (u2) => {
    setSelectedUser(u2);
    setMobileView('chat');
    setMessages(prev => prev.map(m =>
      m.sender_id === u2.id && m.recipient_id === profile?.id && !m.read ? { ...m, read: true } : m
    ));
  };

  const isAdmin = profile?.role === 'admin';
  const conversation = selectedUser
    ? messages.filter(m => {
        const involves = (id) => m.sender_id === id || m.recipient_id === id;
        if (isAdmin && !involves(profile.id)) return involves(selectedUser.id);
        return (
          (m.sender_id === profile.id && m.recipient_id === selectedUser.id) ||
          (m.sender_id === selectedUser.id && m.recipient_id === profile.id)
        );
      }).slice().reverse()
    : [];

  const getUnread = (id) =>
    messages.filter(m => m.sender_id === id && m.recipient_id === profile?.id && !m.read).length;

  const getLastMsg = (id) =>
    messages.find(m =>
      (m.sender_id === profile?.id && m.recipient_id === id) ||
      (m.sender_id === id && m.recipient_id === profile?.id)
    );

  const sendMessage = async () => {
    if (!input.trim() || !selectedUser || sending || blockedIds.has(selectedUser.id)) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    await base44.entities.Message.create({
      sender_id: profile.id, sender_name: profile.adventurer_name,
      recipient_id: selectedUser.id, recipient_name: selectedUser.full_name,
      content, read: false,
    });
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const filteredUsers = allUsers.filter(u2 =>
    !blockedIds.has(u2.id) &&
    (u2.full_name || u2.id).toLowerCase().includes(search.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const la = getLastMsg(a.id);
    const lb = getLastMsg(b.id);
    if (!la && !lb) return 0;
    if (!la) return 1;
    if (!lb) return -1;
    return new Date(lb.created_date) - new Date(la.created_date);
  });

  if (!profile && !loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <MessageCircle className="w-10 h-10" />
      <p className="font-lcars text-sm">PLEASE LOG IN TO ACCESS COMMS</p>
    </div>
  );

  const ConversationList = (
    <div className="flex flex-col h-full">
      {/* LCARS Elbow Header */}
      <div className="shrink-0">
        {/* Amber top accent strip */}
        <div className="h-1.5 bg-amber-500 rounded-tr-[1rem]" />
        <div className="px-4 pt-3 pb-3 border-b border-white/10 bg-black/60">
          <h2 className="font-lcars text-base font-black text-amber-400 mb-3 tracking-widest">
            ◈ COMMS PANEL
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="SEARCH CREW..."
              className="w-full pl-8 pr-3 py-2 rounded-full font-lcars text-xs text-purple-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/60 bg-black/40 border border-white/10 backdrop-blur-md tracking-widest"
            />
          </div>
        </div>
        {/* Color stripe separator */}
        <div className="flex h-1">
          {['bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-blue-400'].map((c, i) => (
            <div key={i} className={cn("flex-1", c)} />
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>{[1,2,3].map(i => <SkeletonConvo key={i} />)}</>
        ) : sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-slate-600">
            <MessageCircle className="w-8 h-8 opacity-30" />
            <p className="font-lcars text-[10px] text-center px-4 uppercase tracking-widest">No transmissions yet</p>
          </div>
        ) : sortedUsers.map(u2 => {
          const unread = getUnread(u2.id);
          const last = getLastMsg(u2.id);
          const isActive = selectedUser?.id === u2.id;
          const partnerName = partnerProfiles[u2.id]?.adventurer_name || u2.full_name || u2.id;
          const avatarUrl = partnerProfiles[u2.id]?.avatar_url;
          return (
            <button key={u2.id} onClick={() => selectUser(u2)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-all text-left min-h-[64px] border-b border-white/5 border-l-4",
                isActive ? "bg-purple-900/40 border-l-amber-400" : "hover:bg-white/5 border-l-transparent"
              )}>
              {/* Avatar + online dot, wrapped in Link */}
              <Link
                to={`${createPageUrl('AdventurerProfile')}?name=${encodeURIComponent(partnerName)}`}
                onClick={e => e.stopPropagation()}
                className="relative shrink-0">
                <Avatar name={partnerName} avatarUrl={avatarUrl} size="md" />
                <OnlineDot lastActive={partnerProfiles[u2.id]?.last_active} className="absolute bottom-0 right-0" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <Link
                    to={`${createPageUrl('AdventurerProfile')}?name=${encodeURIComponent(partnerName)}`}
                    onClick={e => e.stopPropagation()}
                    className={cn("font-lcars text-xs font-semibold truncate hover:text-amber-400 transition-colors", unread > 0 ? "text-white" : "text-purple-200")}>
                    {partnerName}
                  </Link>
                  {last && <span className="font-lcars text-[9px] text-slate-500 shrink-0 uppercase tracking-widest">{formatTime(last.created_date)}</span>}
                </div>
                {last && (
                  <p className={cn("text-xs truncate mt-0.5", unread > 0 ? "text-purple-300 font-medium" : "text-slate-600")}>
                    {last.sender_id === profile?.id ? 'You: ' : ''}{last.content}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const ChatWindow = (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      {selectedUser ? (
        <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-b border-white/10 bg-black/60 backdrop-blur-md min-h-[64px]">
          {/* Amber left border accent */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500/40" />
          <button onClick={() => setMobileView('list')}
            className="md:hidden p-2 -ml-1 text-purple-400 hover:text-amber-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link
            to={`${createPageUrl('AdventurerProfile')}?name=${encodeURIComponent(partnerProfiles[selectedUser.id]?.adventurer_name || selectedUser.full_name || selectedUser.id)}`}
            className="shrink-0">
            <Avatar
              name={partnerProfiles[selectedUser.id]?.adventurer_name || selectedUser.full_name || selectedUser.id}
              avatarUrl={partnerProfiles[selectedUser.id]?.avatar_url}
              size="md"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={`${createPageUrl('AdventurerProfile')}?name=${encodeURIComponent(partnerProfiles[selectedUser.id]?.adventurer_name || selectedUser.full_name || selectedUser.id)}`}
              className="font-lcars text-xs font-bold text-amber-300 truncate block hover:text-amber-400 transition-colors tracking-widest">
              {partnerProfiles[selectedUser.id]?.adventurer_name || selectedUser.full_name || selectedUser.id}
            </Link>
            {isAdmin && !conversation.some(m => m.sender_id === profile.id || m.recipient_id === profile.id) ? (
              <p className="font-lcars text-[9px] text-amber-400 uppercase tracking-widest">👁 ADMIN MODERATION VIEW</p>
            ) : (
              <p className="font-lcars text-[9px] text-cyan-400 uppercase tracking-widest">◈ CHANNEL OPEN</p>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center px-4 py-3 shrink-0 border-b border-white/10 min-h-[64px]">
          <span className="font-lcars text-[10px] text-slate-600 uppercase tracking-widest">SELECT A CHANNEL</span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-black/40 border-2 border-amber-500/20 backdrop-blur-md">
              <MessageCircle className="w-8 h-8 opacity-40 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="font-lcars text-xs font-semibold text-slate-500 uppercase tracking-widest">NO CHANNEL SELECTED</p>
              <p className="text-xs text-slate-700 mt-1">Select a crew member to open comms</p>
            </div>
          </div>
        ) : conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <p className="font-lcars text-[10px] uppercase tracking-widest">CHANNEL CLEAR — INITIATE TRANSMISSION</p>
          </div>
        ) : (
          <>
            {conversation.map((m, i) => {
              const isMe = m.sender_id === profile.id;
              const prevMsg = conversation[i - 1];
              const showTimestamp = !prevMsg || (new Date(m.created_date) - new Date(prevMsg.created_date)) > 5 * 60 * 1000;
              return (
                <div key={m.id}>
                  {showTimestamp && (
                    <div className="flex justify-center my-3">
                      <span className="font-lcars text-[9px] text-slate-500 px-3 py-1 rounded-full bg-black/40 border border-white/10 uppercase tracking-widest">
                        {formatTime(m.created_date)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={cn("flex items-end gap-2 mb-1", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <Avatar
                        name={partnerProfiles[selectedUser.id]?.adventurer_name || selectedUser.full_name || selectedUser.id}
                        avatarUrl={partnerProfiles[selectedUser.id]?.avatar_url}
                        size="sm"
                      />
                    )}
                    <div className={cn(
                      "max-w-[72%] sm:max-w-[60%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl",
                      isMe
                        ? "text-black rounded-br-md bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300/30"
                        : "text-slate-200 rounded-bl-md bg-purple-950/70 border border-purple-500/20 backdrop-blur-sm"
                    )}
                    style={isMe ? { boxShadow: '0 0 20px rgba(251,191,36,0.25)' } : {}}>
                      {m.content}
                    </div>
                    {isMe && (
                      <Avatar
                        name={profile.adventurer_name || profile.id}
                        avatarUrl={profile.avatar_url}
                        size="sm"
                      />
                    )}
                  </motion.div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input Footer */}
      {selectedUser && (
        <div className="shrink-0 px-3 py-3 border-t border-white/10 bg-black/60 backdrop-blur-md">
          <div className="flex items-end gap-2">
            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors rounded-full shrink-0">
              <Smile className="w-5 h-5" />
            </button>
            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors rounded-full shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Transmit message..."
              rows={1}
              className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all bg-black/40 border border-white/10 backdrop-blur-md"
              style={{ maxHeight: '120px', lineHeight: '1.5' }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className={cn(
                "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all shrink-0 disabled:opacity-40",
                input.trim()
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300/30"
                  : "bg-white/5 border border-white/10"
              )}
              style={input.trim() ? { boxShadow: '0 0 16px rgba(251,191,36,0.35)' } : {}}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send className="w-4 h-4 text-black" />}
            </button>
          </div>
          <p className="font-lcars text-[9px] text-slate-600 text-center mt-1.5 uppercase tracking-widest">ENTER TO SEND · SHIFT+ENTER FOR NEW LINE</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className={cn(
          "w-full md:w-[300px] md:flex flex-col shrink-0 border-r border-white/10 bg-black/50 backdrop-blur-md relative",
          mobileView === 'list' ? 'flex' : 'hidden md:flex'
        )}>
          {ConversationList}
        </div>
        <div className={cn(
          "flex-1 flex-col min-w-0 relative",
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        )}>
          {ChatWindow}
        </div>
      </div>
    </div>
  );
}