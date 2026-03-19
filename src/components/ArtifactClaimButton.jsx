import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function ArtifactClaimButton({ quest, myProfile, onClaimed }) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [burst, setBurst] = useState(false);

  if (!quest || quest.status !== 'completed') return null;
  if (!quest.artifact_icon) return null;

  const icon = quest.artifact_icon;
  const inventory = myProfile?.inventory || [];
  const alreadyClaimed = inventory.some(item => item.quest_id === quest.id);

  const handleClaim = async () => {
    if (!myProfile || claiming || alreadyClaimed) return;
    setClaiming(true);

    const newItem = {
      icon,
      quest_title: quest.title,
      quest_id: quest.id,
      claimed_at: new Date().toISOString(),
    };

    const updatedInventory = [...inventory, newItem];
    await base44.entities.AdventurerProfile.update(myProfile.id, { inventory: updatedInventory });

    setClaiming(false);
    setClaimed(true);
    setBurst(true);
    setTimeout(() => setBurst(false), 1500);
    onClaimed?.(updatedInventory);
  };

  if (alreadyClaimed || claimed) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-700/40 bg-green-900/20 text-green-400 text-xs font-lcars uppercase tracking-widest">
        <Check className="w-3.5 h-3.5" />
        <span>{icon} Artifact Collected</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Burst particles */}
      <AnimatePresence>
        {burst && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-lg"
                initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.5,
                  x: Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: Math.sin((i / 8) * Math.PI * 2) * 60,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {icon}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClaim}
        disabled={claiming}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-lcars uppercase tracking-widest transition-all",
          "border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400"
        )}
        style={{ boxShadow: '0 0 12px rgba(251,191,36,0.2)' }}
      >
        {claiming ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        <span>{icon} Collect Artifact</span>
      </motion.button>
    </div>
  );
}