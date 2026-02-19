import { useState } from 'react';
import { X, Scroll, Dice6, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const segments = [
  { value: 'The Gimmick Check', label: 'The Gimmick Check', desc: 'Quick Hits & Hot Takes' },
  { value: 'Main Event', label: 'Main Event', desc: 'Deep Dive Topic' },
  { value: 'The Dark Match', label: 'The Dark Match', desc: 'Underrated Picks' },
  { value: 'Heel Turn', label: 'Heel Turn', desc: 'Controversial Takes' },
  { value: 'Side Quest', label: 'Side Quest', desc: 'Listener Questions' },
  { value: 'The Pop', label: 'The Pop', desc: 'Favorite Moments' },
];

export default function QuestSubmissionDrawer({ isOpen, onClose, onQuestSubmitted }) {
  const [formData, setFormData] = useState({
    quest_giver: '',
    title: '',
    description: '',
    segment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rolledDC, setRolledDC] = useState(null);

  const rollDC = () => {
    const dc = Math.floor(Math.random() * 20) + 1;
    setRolledDC(dc);
    return dc;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quest_giver || !formData.title || !formData.description || !formData.segment) {
      return;
    }

    setIsSubmitting(true);
    const dc = rollDC();

    // Small delay for the DC roll animation
    await new Promise(resolve => setTimeout(resolve, 800));

    await base44.entities.Quest.create({
      ...formData,
      difficulty_class: dc,
      status: 'pending',
    });

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 overflow-y-auto"
          >
            <div 
              className="h-full bg-gradient-to-b from-stone-900 via-amber-950/30 to-stone-900 border-l-2 border-amber-800/50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4a574' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-900/95 to-stone-900/95 backdrop-blur-md border-b border-amber-700/50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-600/20 border border-amber-600/30">
                      <Scroll className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 
                        className="text-xl font-bold text-amber-100"
                        style={{ fontFamily: "'Caveat', cursive", fontSize: '1.75rem' }}
                      >
                        Post a Quest
                      </h2>
                      <p className="text-xs text-amber-500/70">Submit your Side Quest for the show</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-amber-400 hover:bg-amber-900/50 hover:text-amber-300"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Adventurer Name */}
                <div className="space-y-2">
                  <Label className="text-amber-300 text-sm font-medium">
                    Adventurer Name
                  </Label>
                  <Input
                    value={formData.quest_giver}
                    onChange={(e) => setFormData({ ...formData, quest_giver: e.target.value })}
                    placeholder="What should we call you?"
                    className="bg-stone-800/50 border-amber-800/50 text-amber-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-amber-500/20"
                    required
                  />
                </div>

                {/* Quest Title */}
                <div className="space-y-2">
                  <Label className="text-amber-300 text-sm font-medium">
                    Quest Title
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Give your quest a catchy name..."
                    className="bg-stone-800/50 border-amber-800/50 text-amber-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-amber-500/20"
                    required
                  />
                </div>

                {/* Your Side Quest */}
                <div className="space-y-2">
                  <Label className="text-amber-300 text-sm font-medium">
                    Your Side Quest
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What question or topic do you want us to tackle?"
                    rows={4}
                    className="bg-stone-800/50 border-amber-800/50 text-amber-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-amber-500/20 resize-none"
                    required
                  />
                </div>

                {/* Segment Selection */}
                <div className="space-y-2">
                  <Label className="text-amber-300 text-sm font-medium">
                    Target Segment
                  </Label>
                  <Select
                    value={formData.segment}
                    onValueChange={(value) => setFormData({ ...formData, segment: value })}
                    required
                  >
                    <SelectTrigger className="bg-stone-800/50 border-amber-800/50 text-amber-100 focus:ring-amber-500/20">
                      <SelectValue placeholder="Which segment fits your quest?" />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-amber-800/50">
                      {segments.map((seg) => (
                        <SelectItem 
                          key={seg.value} 
                          value={seg.value}
                          className="text-amber-100 focus:bg-amber-900/50 focus:text-amber-200"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{seg.label}</span>
                            <span className="text-xs text-amber-500/70">{seg.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* DC Roll Display */}
                <AnimatePresence>
                  {rolledDC !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center py-4"
                    >
                      <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-900/50 to-stone-800/50 rounded-xl border border-amber-600/50">
                        <Dice6 className="w-6 h-6 text-amber-400 animate-bounce" />
                        <span className="text-amber-300">Your DC:</span>
                        <span 
                          className="text-3xl font-bold text-amber-400"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          {rolledDC}
                        </span>
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.quest_giver || !formData.title || !formData.description || !formData.segment}
                  className={cn(
                    "w-full py-6 text-lg font-bold transition-all duration-300",
                    "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600",
                    "border-2 border-amber-500/50 hover:border-amber-400",
                    "text-stone-900 shadow-lg shadow-amber-900/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  style={{ fontFamily: "'Caveat', cursive", fontSize: '1.5rem' }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Dice6 className="w-5 h-5 animate-spin" />
                      Rolling DC...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Submit Quest
                    </span>
                  )}
                </Button>

                {/* Info Text */}
                <p className="text-center text-xs text-stone-500 px-4">
                  Your quest will be assigned a random Difficulty Class (DC) when submitted. 
                  Higher DC means a tougher challenge for our hosts!
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}