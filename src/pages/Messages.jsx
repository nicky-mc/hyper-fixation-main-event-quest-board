import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, MessageCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) loadData(u);
    }).catch(() => setLoading(false));
  }, []);

  const loadData = async (u) => {
    const msgs = await base44.entities.Message.list('-created_date', 200);
    setMessages(msgs);
    // Mark received as read
    const unread = msgs.filter(m => m.recipient_email === u.email && !m.read);
    unread.forEach(m => base44.entities.Message.update(m.id, { read: true }));

    // Try to get all users (admin only), fall back to deriving from messages
    let others = [];
    try {
      const users = await base44.entities.User.list();
      others = users.filter(x => x.email !== u.email);
    } catch {
      const partnerMap = {};
      msgs.forEach(m => {
        if (m.sender_email !== u.email) {
          partnerMap[m.sender_email] = partnerMap[m.sender_email] || { id: m.sender_email, email: m.sender_email, full_name: m.sender_name };
        }
        if (m.recipient_email !== u.email) {
          partnerMap[m.recipient_email] = partnerMap[m.recipient_email] || { id: m.recipient_email, email: m.recipient_email, full_name: m.recipient_email };
        }
      });
      others = Object.values(partnerMap);
    }
    setAllUsers(others);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create') {
        const m = event.data;
        if (m.sender_email === user.email || m.recipient_email === user.email) {
          setMessages(prev => [m, ...prev]);
          if (m.recipient_email === user.email && m.sender_email === selectedUser?.email) {
            base44.entities.Message.update(m.id, { read: true });
          }
        }
      }
    });
    return unsub;
  }, [user, selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  const conversation = selectedUser
    ? messages.filter(m =>
        (m.sender_email === user.email && m.recipient_email === selectedUser.email) ||
        (m.sender_email === selectedUser.email && m.recipient_email === user.email)
      ).slice().reverse()
    : [];

  const getUnread = (otherEmail) =>
    messages.filter(m => m.sender_email === otherEmail && m.recipient_email === user?.email && !m.read).length;

  const getLastMsg = (otherEmail) =>
    messages.find(m =>
      (m.sender_email === user?.email && m.recipient_email === otherEmail) ||
      (m.sender_email === otherEmail && m.recipient_email === user?.email)
    );

  const sendMessage = async () => {
    if (!input.trim() || !selectedUser || sending) return;
    setSending(true);
    await base44.entities.Message.create({
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      recipient_email: selectedUser.email,
      content: input.trim(),
      read: false,
    });
    setInput('');
    setSending(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <MessageCircle className="w-10 h-10" />
      <p>Please log in to use messages.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-3.5rem)] flex flex-col">
      <h1 className="text-3xl font-black text-amber-300 mb-4" style={{ fontFamily: "'Caveat', cursive" }}>
        📬 Tavern Mail
      </h1>

      <div className="flex-1 flex border border-purple-900/40 rounded-xl overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-purple-900/40 bg-purple-950/20 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-purple-900/40">
            <p className="text-xs text-purple-500 uppercase tracking-widest font-semibold">Adventurers</p>
          </div>
          {allUsers.length === 0 && (
            <p className="text-xs text-slate-600 p-4">No other adventurers yet.</p>
          )}
          {allUsers.map(u2 => {
            const unread = getUnread(u2.email);
            const last = getLastMsg(u2.email);
            return (
              <button key={u2.id} onClick={() => setSelectedUser(u2)}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 px-3 py-3 border-b border-purple-900/20 transition-all hover:bg-purple-900/20",
                  selectedUser?.email === u2.email && "bg-purple-800/30"
                )}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {(u2.full_name || u2.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-200 truncate">{u2.full_name || u2.email}</span>
                    {unread > 0 && (
                      <span className="bg-amber-500 text-black text-[9px] font-black rounded-full px-1.5 ml-1 shrink-0">{unread}</span>
                    )}
                  </div>
                  {last && <p className="text-[10px] text-slate-600 truncate">{last.content}</p>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
              <User className="w-10 h-10" />
              <p className="text-sm">Select an adventurer to start chatting</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-purple-900/40 bg-purple-950/10 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-white text-xs font-black">
                  {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-purple-200 text-sm">{selectedUser.full_name || selectedUser.email}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence initial={false}>
                  {conversation.map(m => {
                    const isMe = m.sender_email === user.email;
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                          isMe ? "bg-purple-700/60 text-purple-100" : "bg-[#0d0d1a] border border-purple-900/40 text-slate-300"
                        )}>
                          <p>{m.content}</p>
                          <p className="text-[9px] mt-1 opacity-50 text-right">
                            {new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-purple-900/40 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Send a message..."
                  className="flex-1 bg-[#0d0820]/70 border border-purple-800/50 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-40 transition-all flex items-center gap-1.5">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}