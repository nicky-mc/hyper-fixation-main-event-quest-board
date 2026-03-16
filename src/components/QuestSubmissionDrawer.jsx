import { useState, useRef, useEffect } from 'react';
import { X, Scroll, Dice6, Send, Sparkles, Fish, ImagePlus, Loader2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({ title: '', description: '', segment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rolledDC, setRolledDC] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const fileInputRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (drawerRef.current) drawerRef.current.scrollTop = 0;
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    base44.auth.me().then(async u => {
      if (!u) return;
      setAuthUser(u);
      const profs = await base44.entities.AdventurerProfile.filter({ auth_id: u.id });
      if (profs[0]) setMyProfile(profs[0]);
    }).catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quest_giver || !formData.title || !formData.description || !formData.segment) return;

    setIsSubmitting(true);
    const dc = Math.floor(Math.random() * 20) + 1;
    setRolledDC(dc);
    await new Promise(r => setTimeout(r, 900));

    let image_url = undefined;
    if (imageFile) {
      setUploadingImage(true);
      const result = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = result.file_url;
      setUploadingImage(false);
    }

    const quest = await base44.entities.Quest.create({
      ...formData,
      quest_giver: myProfile?.adventurer_name || authUser?.full_name || authUser?.email || 'Anonymous Adventurer',
      difficulty_class: dc,
      status: 'pending',
      ...(image_url && { image_url }),
      ...(myProfile && { adventurer_id: myProfile.id }),
    });

    // Log to Activity Stream
    await base44.entities.Activity.create({
      type: 'quest_submitted',
      adventurer_id: myProfile?.id,
      quest_id: quest.id,
      quest_title: formData.title,
      content: formData.description,
      ...(image_url && { media_url: image_url, media_type: 'image' }),
    });

    // Send email alerts to all hosts with notifications enabled
    const hosts = await base44.entities.HostSettings.filter({ notifications_enabled: true });
    await Promise.all(hosts.map(host =>
      base44.integrations.Core.SendEmail({
        to: host.email,
        from_name: 'The Hyper-fixation Main Event',
        subject: `⚔️ New Quest Posted: "${formData.title}"`,
        body: `A new Side Quest has been posted to the board!\n\n📜 Quest: ${formData.title}\n🧙 Adventurer: ${formData.quest_giver}\n🎯 Segment: ${formData.segment}\n🎲 DC: ${dc}\n\n"${formData.description}"\n\nHead to the Quest Board to review it!\n\n— The Hyper-fixation Main Event 🦈⚔️`,
      })
    ));

    setFormData({ title: '', description: '', segment: '' });
    setImageFile(null);
    setImagePreview(null);
    setRolledDC(null);
    setIsSubmitting(false);
    onQuestSubmitted?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            ref={drawerRef}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-purple-700/50 shadow-2xl relative bg-gradient-to-b from-[#0d0d1a] via-[#0f0d22] to-[#080b18]"
          >
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none opacity-5 rounded-2xl"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.3) 2px, rgba(139,92,246,0.3) 4px)' }} />

              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-950/95 to-[#0d0d1a]/95 backdrop-blur-md border-b border-purple-800/40 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-500/30">
                      <Scroll className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-amber-300">
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

                {/* Image / GIF Upload */}
                <div className="space-y-2">
                  <Label className="text-purple-300 text-sm font-medium">Quest Image / GIF <span className="text-purple-600 text-xs">(optional)</span></Label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-purple-700/50 group">
                      <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover" />
                      <button type="button" onClick={removeImage}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-red-600/80 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-700/50 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 transition-colors cursor-pointer">
                      <ImagePlus className="w-6 h-6 text-purple-400 mb-2" />
                      <span className="text-sm text-purple-400">Upload an image or GIF</span>
                      <span className="text-[10px] text-slate-600 mt-1">PNG, JPG, GIF supported</span>
                    </button>
                  )}
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
                        <span className="text-3xl font-black text-amber-400">{rolledDC}</span>
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit"
                  disabled={isSubmitting || !formData.title || !formData.description || !formData.segment}
                  className="font-lcars w-full py-6 text-xl font-black uppercase tracking-widest bg-gradient-to-r from-red-700 via-red-600 to-orange-600 hover:from-red-600 hover:to-orange-500 border-2 border-red-500/50 text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
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