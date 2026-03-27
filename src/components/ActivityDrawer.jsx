import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Sword, Rss, Radio, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Path Check: Ensure these aliases match your vite.config / jsconfig
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import ActivityStream from './ActivityStream';

const TABS = [
  { id: 'newest', label: 'Newest Quests', icon: Sword },
  { id: 'news', label: 'News Feed', icon: Rss },
  { id: 'live', label: 'Live Feed', icon: Radio },
];

// --- Sub-Components (Extracted for readability) ---

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
    <span className="text-[10px] font-lcars text-[var(--accent)] animate-pulse uppercase tracking-widest">Accessing Data...</span>
  </div>
);

const EmptyState = ({ message }) => (
  <p className="text-center text-[var(--text-muted)] text-xs py-12 font-medium italic opacity-60">
    {message}
  </p>
);

function NewestQuestsTab({ onSelectQuest }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Quest.filter({ status: 'pending' }, '-created_date', 10)
      .then(data => { setQuests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (quests.length === 0) return <EmptyState message="No pending quests detected." />;

  return (
    <div className="space-y-2">
      {quests.map(q => (
        <button 
          key={q.id} 
          onClick={() => onSelectQuest?.(q)}
          className="w-full text-left p-3 rounded-xl border border-[var(--border-glow)]/30 bg-[var(--panel-bg)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/5 transition-all group shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-1 h-10 rounded-full bg-gradient-to-b from-[var(--accent)] to-transparent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--accent)] text-sm truncate group-hover:translate-x-1 transition-transform">{q.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-lcars text-[var(--accent)] opacity-80 uppercase tracking-widest font-bold">{q.segment}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">· DC {q.difficulty_class}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function NewsFeedTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.NewsPost.list('-created_date', 10)
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (posts.length === 0) return <EmptyState message="Sub-space frequencies are quiet." />;

  return (
    <div className="space-y-4">
      {posts.map(p => (
        <div key={p.id} className="p-3 rounded-xl border border-[var(--border-glow)]/20 bg-[var(--panel-bg)]/40">
          <p className="text-[10px] font-lcars text-[var(--accent)] uppercase tracking-widest font-black mb-2 opacity-70">
            // {p.author_name}
          </p>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-medium">
            {p.content}
          </p>
          {p.image_url && (
            <img src={p.image_url} alt="" className="mt-3 w-full h-24 object-cover rounded-lg border border-[var(--border-glow)]/20" />
          )}
        </div>
      ))}
      <Link 
        to={createPageUrl('NewsFeed')} 
        className="block text-center py-2 text-[10px] font-lcars text-[var(--accent)] hover:brightness-125 uppercase tracking-[0.2em] transition-all font-bold border-t border-[var(--border-glow)]/10"
      >
        Open Full Archive →
      </Link>
    </div>
  );
}

// --- Main Component ---

export default function ActivityDrawer({ isOpen, onOpenChange, onQuestSelect, label }) {
  const [activeTab, setActiveTab] = useState('newest');

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpenChange(true)}
        className="relative h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-[var(--border-glow)]/50 bg-[var(--panel-bg)] text-[var(--accent)] font-bold text-sm transition-all hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
      >
        <Activity className="w-4 h-4" />
        {label || 'Live Feed'}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse border-2 border-[var(--bg-primary)]" />
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
            style={{ top: '56px' }} 
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 bottom-0 w-full sm:max-w-sm z-50 flex flex-col border-l border-[var(--border-glow)]/30 shadow-2xl overflow-hidden"
            style={{ top: '56px', background: 'var(--bg-primary)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--border-glow)]/20 bg-[var(--panel-bg)]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                  <Activity className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="font-black text-[var(--accent)] font-lcars tracking-[0.15em] text-lg uppercase leading-none">Sub-Space Feed</h2>
                  <p className="text-[9px] text-[var(--accent)] opacity-50 uppercase font-bold mt-1 tracking-widest">Sector Status: Active</p>
                </div>
              </div>
              <button onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-[var(--accent)]/10 text-[var(--text-muted)] hover:text-[var(--accent)] transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <nav className="flex border-b border-[var(--border-glow)]/20 bg-[var(--bg-primary)]">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-4 text-[10px] font-lcars font-black uppercase tracking-widest transition-all relative",
                      isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--accent)]/70"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />
                    {tab.label}
                    {isActive && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gradient-to-b from-transparent to-[var(--accent)]/5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === 'newest' && (
                    <NewestQuestsTab onSelectQuest={(q) => { onOpenChange(false); onQuestSelect?.(q); }} />
                  )}
                  {activeTab === 'news' && <NewsFeedTab />}
                  {activeTab === 'live' && <ActivityStream />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
