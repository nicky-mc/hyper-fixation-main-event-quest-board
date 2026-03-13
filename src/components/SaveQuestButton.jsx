import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function SaveQuestButton({ questId }) {
  const [adventurerId, setAdventurerId] = useState(null);
  const [savedRecord, setSavedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async u => {
      if (!u) return;
      const profiles = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
      const profile = profiles[0];
      if (!profile) return;
      setAdventurerId(profile.id);
      const recs = await base44.entities.SavedQuest.filter({ quest_id: questId, adventurer_id: profile.id });
      setSavedRecord(recs[0] || null);
    }).catch(() => {});
  }, [questId]);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!adventurerId || loading) return;
    setLoading(true);
    if (savedRecord) {
      await base44.entities.SavedQuest.delete(savedRecord.id);
      setSavedRecord(null);
    } else {
      const rec = await base44.entities.SavedQuest.create({ quest_id: questId, adventurer_id: adventurerId });
      setSavedRecord(rec);
    }
    setLoading(false);
  };

  if (!adventurerId) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={savedRecord ? 'Remove from saved' : 'Save quest'}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200",
        savedRecord
          ? "bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30"
          : "bg-purple-900/20 border-purple-700/40 text-purple-500 hover:bg-purple-800/40 hover:border-purple-500/60 hover:text-purple-300",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Bookmark className={cn("w-3.5 h-3.5", savedRecord && "fill-amber-400")} />
    </button>
  );
}