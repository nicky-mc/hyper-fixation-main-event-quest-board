import { useState } from 'react';
import { X, Scroll, Dice6, Send, Sparkles, Fish } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const segments = [
  { value: 'The Gimmick Check',            emoji: '⚡', desc: 'Identity & Character Arcs' },
  { value: 'Patch Notes',                  emoji: '🛠️', desc: 'Life Updates & Milestones' },
  { value: 'World Building',               emoji: '🔭', desc: 'Trope Analysis' },
  { value: 'Roll for Initiative',           emoji: '🎲', desc: 'Real Life Challenges' },
  { value: 'The Tavern Entry',             emoji: '🍺', desc: 'Show Opener Vibes' },
  { value: 'The Main Quest',               emoji: '⚔️', desc: 'Primary Topic Deep Dive' },
  { value: 'Heart of the Story',           emoji: '💜', desc: 'Personal Connection' },
  { value: 'The Loot Drop',               emoji: '✨', desc: 'Listener Mail & Recommendations' },
  { value: 'The Respec',                   emoji: '🔄', desc: 'Changed Our Minds On This' },
  { value: 'Glitches in the Holodeck',    emoji: '🖖', desc: 'Star Trek / Sci-Fi Chaos' },
  { value: 'Critical Fails & Jump Scares',emoji: '💀', desc: 'Horror & Nat 1 Moments' },
  { value: 'The Hyper-fixation Main Event',emoji: '🔥', desc: 'Apex Obsession Mode' },
  { value: 'The Dark Match',              emoji: '👻', desc: 'Underrated & Overlooked Picks' },
  { value: 'Heel Turn',                   emoji: '😈', desc: 'Controversial Takes' },
  { value: 'The Co-Op Club',              emoji: '🤝', desc: 'Community Activity' },
  { value: 'Character Sheets',            emoji: '📋', desc: 'Alignment Votes & Polls' },
  { value: 'Shark Week Special',          emoji: '🦈', desc: 'Charlotte Goes Full Shark Mode' },
  { value: "Captain's Log",              emoji: '🚀', desc: 'Stardate Status Report' },
];

export default function QuestSubmissionDrawer({ isOpen, onClose, onQuestSubmitted }) {
  const [formData, setFormData] = useState({ quest_giver: '', title: '', description: '', segment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rolledDC, setRolledDC] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quest_giver || !formData.title || !formData.description || !formData.segment) return;

    setIsSubmitting(true);
    const dc = Math.floor(Math.random() * 20) + 1;
    setRolledDC(dc);
    await new Promise(r => setTimeout(r, 900));

    await base44.entities.Quest.create({ ...formData, difficulty_class: dc, status: 'pending' });

    setFormData({ quest_giver: '', title: '', description: '', segment: '' });
    setRolledDC(null);
    setIsSubmitting(false);
    onQuestSubmitted?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 overflow-y-auto"
          >
            <div className="h-full bg-gradient-to-b from-[#0d0d1a] via-[#0f0d22] to-[#080b18] border-l-2 border-purple-800/50">
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.3) 2px, rgba(139,92,246,0.3) 4px)' }} />

              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-950/95 to-[#0d0d1a]/95 backdrop-blur-md border-b border-purple-800/40 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-500/30">
                      <Scroll className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-amber-300" style={{ fontFamily: "'Caveat', cursive" }}>
                        Post a Quest
                      </h2>
                      <p className="text-xs text-purple-400/70">Submit to The Hyper-fixation Main Event</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}
                    className="text-purple-400 hover:bg-purple-900/50 hover:text-purple-300">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">
                <div className="space-y-2">
                  <Label className="text-purple-300 text-sm font-medium">Adventurer Name</Label>
                  <Input value={formData.quest_giver}
                    onChange={(e) => setFormData({ ...formData, quest_giver: e.target.value })}
                    placeholder="What's your handle, Adventurer?"
                    className="bg-[#0d0820]/70 border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:border-purple-500"
                    required />
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-300 text-sm font-medium">Quest Title</Label>
                  <Input value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Name your quest boldly..."
                    className="bg-[#0d0820]/70 border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:border-purple-500"
                    required />
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-300 text-sm font-medium">Your Side Quest</Label>
                  <Textarea value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What burning question shall Nicky & Charlotte tackle? Wrestling hot take? Shark fact? D&D alignment crisis?"
                    rows={4}
                    className="bg-[#0d0820]/70 border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:border-purple-500 resize-none"
                    required />
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-300 text-sm font-medium">Target Segment</Label>
                  <Select value={formData.segment} onValueChange={(v) => setFormData({ ...formData, segment: v })} required>
                    <SelectTrigger className="bg-[#0d0820]/70 border-purple-800/50 text-purple-100 focus:ring-purple-500/20">
                      <SelectValue placeholder="Choose your segment..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0d22] border-purple-800/50 max-h-80">
                      {segments.map((seg) => (
                        <SelectItem key={seg.value} value={seg.value}
                          className="text-purple-100 focus:bg-purple-900/50 focus:text-purple-200">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{seg.emoji}</span>
                            <div>
                              <div className="font-medium text-sm">{seg.value}</div>
                              <div className="text-xs text-purple-500/70">{seg.desc}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* DC Roll result */}
                <AnimatePresence>
                  {rolledDC !== null && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center py-3">
                      <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-900/50 to-[#0d0820]/80 rounded-xl border border-amber-500/50">
                        <Dice6 className="w-6 h-6 text-amber-400 animate-bounce" />
                        <span className="text-purple-300 text-sm">Your DC:</span>
                        <span className="text-3xl font-black text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>{rolledDC}</span>
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit"
                  disabled={isSubmitting || !formData.quest_giver || !formData.title || !formData.description || !formData.segment}
                  className="w-full py-6 text-xl font-black bg-gradient-to-r from-red-700 via-red-600 to-orange-600 hover:from-red-600 hover:to-orange-500 border-2 border-red-500/50 text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {isSubmitting
                    ? <span className="flex items-center gap-2"><Dice6 className="w-5 h-5 animate-spin" /> Rolling DC...</span>
                    : <span className="flex items-center gap-2"><Send className="w-5 h-5" /> Submit Quest! 🦈⚔️</span>
                  }
                </Button>

                <p className="text-center text-xs text-slate-600 px-2">
                  Your DC is rolled randomly on submission. NAT 20 = instant priority. NAT 1 = Nicky reads it in a funny voice.
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}