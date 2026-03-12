import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, MessageCircle, ArrowLeft, Smile, Paperclip, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function Avatar({ name, src, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={cn("rounded-full shrink-0 flex items-center justify-center font-black text-white overflow-hidden",
      "bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-900", sizes[size])}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function SkeletonConvo() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-purple-900/40 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-purple-900/40 rounded w-1/2" />
        <div className="h-2.5 bg-purple-900/30 rounded w-3/4" />
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
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadData(u);
    }).catch(() => setLoading(false));
  }, []);

  const loadData = async (u) => {
    const isAdmin = u.role === 'admin';
    const msgs = await base44.entities.Message.list('-created_date', 500);
    setMessages(msgs);

    // Mark my unread messages as read
    const unread = msgs.filter(m => m.recipient_email === u.email && !m.read);
    unread.forEach(m => base44.entities.Message.update(m.id, { read: true }));

    // Derive conversation partners from messages (works for all users, admins see everyone)
    const partnerMap = {};
    msgs.forEach(m => {
      // For normal users: only their own conversations
      // For admins: all threads — build both sides
      const addPartner = (email, name) => {
        if (email && email !== u.email && !partnerMap[email]) {
          partnerMap[email] = { id: email, email, full_name: name || email };
        }
      };
      if (isAdmin) {
        addPartner(m.sender_email, m.sender_name);
        addPartner(m.recipient_email, m.recipient_email);
      } else {
        if (m.sender_email === u.email) addPartner(m.recipient_email, m.recipient_email);
        if (m.recipient_email === u.email) addPartner(m.sender_email, m.sender_name);
      }
    });

    setAllUsers(Object.values(partnerMap));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create') {
        const m = event.data;
        if (m.sender_email === user.email || m.recipient_email === user.email) {
          setMessages(prev => [m, ...prev]);
          if (m.recipient_email === user.email) {
            base44.entities.Message.update(m.id, { read: true });
            // Add sender to allUsers if not already there
            setAllUsers(prev => {
              if (prev.find(u2 => u2.email === m.sender_email)) return prev;
              return [...prev, { id: m.sender_email, email: m.sender_email, full_name: m.sender_name }];
            });
          }
        }
      }
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const selectUser = (u2) => {
    setSelectedUser(u2);
    setMobileView('chat');
    // Mark messages from this user as read
    setMessages(prev => prev.map(m =>
      m.sender_email === u2.email && m.recipient_email === user?.email && !m.read
        ? { ...m, read: true }
        : m
    ));
  };

  const isAdmin = user?.role === 'admin';
  const conversation = selectedUser
    ? messages.filter(m => {
        const involves = (email) => m.sender_email === email || m.recipient_email === email;
        if (isAdmin && !involves(user.email)) {
          // Admin viewing a thread they're not part of — show full thread involving selectedUser
          return involves(selectedUser.email);
        }
        return (
          (m.sender_email === user.email && m.recipient_email === selectedUser.email) ||
          (m.sender_email === selectedUser.email && m.recipient_email === user.email)
        );
      }).slice().reverse()
    : [];

  const getUnread = (email) =>
    messages.filter(m => m.sender_email === email && m.recipient_email === user?.email && !m.read).length;

  const getLastMsg = (email) =>
    messages.find(m =>
      (m.sender_email === user?.email && m.recipient_email === email) ||
      (m.sender_email === email && m.recipient_email === user?.email)
    );

  const sendMessage = async () => {
    if (!input.trim() || !selectedUser || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    await base44.entities.Message.create({
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      recipient_email: selectedUser.email,
      content,
      read: false,
    });
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const filteredUsers = allUsers.filter(u2 =>
    (u2.full_name || u2.email).toLowerCase().includes(search.toLowerCase())
  );

  // Sort by last message time
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const la = getLastMsg(a.email);
    const lb = getLastMsg(b.email);
    if (!la && !lb) return 0;
    if (!la) return 1;
    if (!lb) return -1;
    return new Date(lb.created_date) - new Date(la.created_date);
  });

  if (!user && !loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <MessageCircle className="w-10 h-10" />
      <p className="text-sm">Please log in to use messages.</p>
    </div>
  );

  const ConversationList = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 shrink-0" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
        <h2 className="text-xl font-black text-amber-300 mb-3" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.1rem' }}>
          📬 Tavern Mail
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search adventurers..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
            style={{ background: 'rgba(88,28,220,0.08)', border: '1px solid rgba(139,92,246,0.2)', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>{[1,2,3].map(i => <SkeletonConvo key={i} />)}</>
        ) : sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-slate-600">
            <MessageCircle className="w-8 h-8 opacity-30" />
            <p className="text-xs text-center px-4">No adventurers to message yet.<br />Send a message from someone's profile!</p>
          </div>
        ) : sortedUsers.map(u2 => {
          const unread = getUnread(u2.email);
          const last = getLastMsg(u2.email);
          const isActive = selectedUser?.email === u2.email;
          return (
            <button key={u2.email} onClick={() => selectUser(u2)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-all text-left min-h-[64px]",
                isActive ? "bg-purple-800/25" : "hover:bg-purple-900/15"
              )}
              style={{ borderBottom: '1px solid rgba(88,28,220,0.08)' }}>
              <div className="relative shrink-0">
                <Avatar name={u2.full_name || u2.email} size="md" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("text-sm font-semibold truncate", unread > 0 ? "text-white" : "text-purple-200")}>
                    {u2.full_name || u2.email}
                  </span>
                  {last && <span className="text-[10px] text-slate-600 shrink-0">{formatTime(last.created_date)}</span>}
                </div>
                {last && (
                  <p className={cn("text-xs truncate mt-0.5", unread > 0 ? "text-purple-300 font-medium" : "text-slate-600")}>
                    {last.sender_email === user?.email ? 'You: ' : ''}{last.content}
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
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(8,6,24,0.6)', minHeight: 64 }}>
          <button onClick={() => setMobileView('list')}
            className="md:hidden p-2 -ml-1 text-purple-400 hover:text-purple-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar name={selectedUser.full_name || selectedUser.email} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-purple-100 truncate">{selectedUser.full_name || selectedUser.email}</p>
            <p className="text-[10px] text-green-400">Online</p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(139,92,246,0.15)', minHeight: 64 }}>
          <span className="text-sm text-slate-600">Select a conversation</span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(88,28,220,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <MessageCircle className="w-8 h-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">No conversation selected</p>
              <p className="text-xs text-slate-700 mt-1">Pick an adventurer from the list to start chatting</p>
            </div>
          </div>
        ) : conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <p className="text-xs">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <>
            {conversation.map((m, i) => {
              const isMe = m.sender_email === user.email;
              const prevMsg = conversation[i - 1];
              const showTimestamp = !prevMsg || (new Date(m.created_date) - new Date(prevMsg.created_date)) > 5 * 60 * 1000;
              return (
                <div key={m.id}>
                  {showTimestamp && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] text-slate-600 px-3 py-1 rounded-full"
                        style={{ background: 'rgba(88,28,220,0.1)' }}>
                        {formatTime(m.created_date)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={cn("flex items-end gap-2 mb-1", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && <Avatar name={selectedUser.full_name || selectedUser.email} size="sm" />}
                    <div className={cn(
                      "max-w-[72%] sm:max-w-[60%] px-4 py-2.5 text-sm leading-relaxed",
                      isMe
                        ? "text-white rounded-2xl rounded-br-md"
                        : "text-slate-200 rounded-2xl rounded-bl-md"
                    )}
                    style={isMe ? {
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
                    } : {
                      background: 'rgba(30,20,50,0.8)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                      {m.content}
                    </div>
                    {isMe && <Avatar name={user.full_name || user.email} size="sm" />}
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
        <div className="shrink-0 px-3 py-3"
          style={{ borderTop: '1px solid rgba(139,92,246,0.15)', background: 'rgba(8,6,24,0.7)' }}>
          <div className="flex items-end gap-2">
            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-purple-400 transition-colors rounded-xl shrink-0">
              <Smile className="w-5 h-5" />
            </button>
            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-purple-400 transition-colors rounded-xl shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              style={{
                background: 'rgba(88,28,220,0.1)',
                border: '1px solid rgba(139,92,246,0.25)',
                maxHeight: '120px',
                fontFamily: "'Inter', system-ui, sans-serif",
                lineHeight: '1.5',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl transition-all shrink-0 disabled:opacity-40"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(88,28,220,0.2)',
                boxShadow: input.trim() ? '0 2px 12px rgba(124,58,237,0.4)' : 'none',
              }}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-700 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0518 50%, #050a10 100%)' }}>

      {/* Desktop: dual-column layout */}
      <div className="flex-1 flex overflow-hidden md:pt-0">

        {/* Sidebar — always visible on desktop, only shown on mobile when mobileView==='list' */}
        <div className={cn(
          "w-full md:w-[300px] md:flex flex-col shrink-0",
          mobileView === 'list' ? 'flex' : 'hidden md:flex'
        )}
        style={{
          borderRight: '1px solid rgba(139,92,246,0.15)',
          background: 'rgba(8,6,24,0.5)',
        }}>
          {ConversationList}
        </div>

        {/* Chat Panel */}
        <div className={cn(
          "flex-1 flex-col min-w-0",
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        )}>
          {ChatWindow}
        </div>
      </div>
    </div>
  );
}