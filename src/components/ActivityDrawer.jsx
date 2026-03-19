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

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-2">
      {quests.length === 0 && <p className="text-center text-slate-600 text-xs py-8">No quests yet.</p>}
      {quests.map(q => (
        <button key={q.id} onClick={() => onSelectQuest?.(q)}
          className="w-full text-left p-3 rounded-xl border border-purple-800/30 bg-purple-950/30 hover:border-amber-500/40 hover:bg-purple-900/30 transition-all group">
          <div className="flex items-start gap-2">
            <div className="w-1 h-full min-h-[2rem] rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-purple-100 text-sm truncate group-hover:text-amber-300 transition-colors">{q.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-lcars text-purple-500 uppercase tracking-widest">{q.segment}</span>
                <span className="text-[9px] text-slate-600">· DC {q.difficulty_class}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 truncate">by {q.quest_giver}</p>
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

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-3">
      {posts.length === 0 && <p className="text-center text-slate-600 text-xs py-8">No news yet.</p>}
      {posts.map(p => (
        <div key={p.id} className="p-3 rounded-xl border border-purple-800/30 bg-purple-950/20">
          <p className="text-[9px] font-lcars text-amber-500 uppercase tracking-widest mb-1">{p.author_name}</p>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 whitespace-pre-line">{p.content}</p>
          {p.image_url && (
            <img src={p.image_url} alt="" className="mt-2 w-full h-20 object-cover rounded-lg border border-white/10" />
          )}
        </div>
      ))}
      <Link to={createPageUrl('NewsFeed')} className="block text-center text-[10px] font-lcars text-purple-500 hover:text-amber-400 uppercase tracking-widest pt-2 transition-colors">
        View Full News Feed →
      </Link>
    </div>
  );
}

export default function ActivityDrawer({ isOpen, onOpenChange, onQuestSelect }) {
  const [activeTab, setActiveTab] = useState('newest');

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onOpenChange(true)}
        className="relative h-11 flex items-center gap-2 px-5 rounded-xl border-2 border-green-800/50 bg-green-950/30 text-green-400 hover:border-green-600/70 font-bold text-sm transition-all"
      >
        <Activity className="w-4 h-4" />
        Live Feed
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse border-2 border-[#050510]" />
      </motion.button>

      {/* Backdrop */}
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

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 bottom-0 w-full sm:max-w-sm z-50 flex flex-col border-l border-purple-800/50 shadow-2xl"
            style={{ top: '56px', background: 'linear-gradient(180deg, #080512 0%, #050a18 100%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="font-black text-amber-300 font-lcars tracking-widest text-sm uppercase">Sub-Space Feed</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <button onClick={() => onOpenChange(false)} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-purple-900/40 shrink-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-lcars font-black uppercase tracking-widest transition-all border-b-2",
                      activeTab === tab.id
                        ? "border-amber-500 text-amber-400"
                        : "border-transparent text-slate-600 hover:text-purple-400"
                    )}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3">
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