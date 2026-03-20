import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Sword, Rss, Radio, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import ActivityStream from './ActivityStream';

const TABS = [
  { id: 'newest', label: 'Newest Quests', icon: Sword },
  { id: 'news', label: 'News Feed', icon: Rss },
  { id: 'live', label: 'Live Feed', icon: Radio },
];

function NewestQuestsTab({ onSelectQuest }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Quest.filter({ status: 'pending' }, '-created_date', 10)
      .then(data => { setQuests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="space-y-2">
      {quests.length === 0 && <p className="text-center text-[var(--text-muted)] text-xs py-8 font-medium">No quests yet.</p>}
      {quests.map(q => (
        <button key={q.id} onClick={() => onSelectQuest?.(q)}
          className="w-full text-left p-3 rounded-xl border border-[var(--border-glow)]/30 bg-[var(--panel-bg)] hover:border-[var(--accent)]/40 transition-all group shadow-sm">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-full min-h-[2.5rem] rounded-full bg-gradient-to-b from-[var(--accent)] to-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--accent)] text-sm truncate group-hover:brightness-125 transition-colors">{q.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-lcars text-[var(--accent)] opacity-80 uppercase tracking-widest font-bold">{q.segment}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">· DC {q.difficulty_class}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate italic">by {q.quest_giver}</p>
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

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="space-y-3">
      {posts.length === 0 && <p className="text-center text-[var(--text-muted)] text-xs py-8 font-medium">No news yet.</p>}
      {posts.map(p => (
        <div key={p.id} className="p-3 rounded-xl border border-[var(--border-glow)]/30 bg-[var(--panel-bg)]/50 shadow-sm">
          <p className="text-[10px] font-lcars text-[var(--accent)] uppercase tracking-widest font-black mb-1">{p.author_name}</p>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed line-clamp-3 whitespace-pre-line font-medium">{p.content}</p>
          {p.image_url && (
            <img src={p.image_url} alt="" className="mt-2 w-full h-20 object-cover rounded-lg border border-[var(--border-glow)]/20" />
          )}
        </div>
      ))}
      <Link to={createPageUrl('NewsFeed')} className="block text-center text-xs font-lcars text-[var(--accent)] hover:brightness-125 uppercase tracking-widest pt-2 transition-colors font-bold">
        View Full News Feed →
      </Link>
    </div>
  );
}

export default function ActivityDrawer({ isOpen, onOpenChange, onQuestSelect, label }) {
  const [activeTab, setActiveTab] = useState('newest');

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onOpenChange(true)}
        className="relative h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-[var(--border-glow)]/50 bg-[var(--panel-bg)] text-[var(--accent)] font-bold text-sm transition-all"
      >
        <Activity className="w-4 h-4" />
        {label || 'Live Feed'}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse border-2 border-[var(--bg-primary)]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-x-0 bottom-0 bg-black z-40"
            style={{ top: '56px' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 bottom-0 w-full sm:max-w-sm z-50 flex flex-col border-l border-[var(--border-glow)]/50 shadow-2xl"
            style={{ top: '56px', background: 'var(--bg-primary)' }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-glow)]/20 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-black text-[var(--accent)] font-lcars tracking-widest text-lg uppercase">Sub-Space Feed</span>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              </div>
              <button onClick={() => onOpenChange(false)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex border-b border-[var(--border-glow)]/20 shrink-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-4 text-xs font-lcars font-black uppercase tracking-widest transition-all border-b-2",
                      activeTab === tab.id
                        ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5"
                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--accent)]"
                    )}>
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === 'newest' && (
                <NewestQuestsTab onSelectQuest={(q) => { onOpenChange(false); onQuestSelect?.(q); }} />
              )}
              {activeTab === 'news' && <NewsFeedTab />}
              {activeTab === 'live' && <ActivityStream />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
