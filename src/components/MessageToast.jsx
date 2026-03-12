import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MessageToast({ currentPageName }) {
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create') {
        const m = event.data;
        // Only show toast if recipient is current user AND they're NOT on the Messages page
        if (m.recipient_email === user.email && currentPageName !== 'Messages') {
          const toast = { id: Date.now(), senderName: m.sender_name || m.sender_email, content: m.content };
          setToasts(prev => [...prev, toast]);
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }, 4000);
        }
      }
    });
    return unsub;
  }, [user, currentPageName]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl max-w-[300px]"
            style={{
              background: 'rgba(15, 10, 30, 0.95)',
              border: '1px solid rgba(139,92,246,0.35)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <Link to={createPageUrl('Messages')} onClick={() => dismiss(toast.id)} className="flex-1 min-w-0">
              <p className="text-xs font-bold text-purple-200 truncate">{toast.senderName}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{toast.content}</p>
            </Link>
            <button onClick={() => dismiss(toast.id)}
              className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}