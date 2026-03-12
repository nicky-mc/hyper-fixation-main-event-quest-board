import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, CalendarDays,
  Clock, Sword, Trash2, Edit, Mic
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, parseISO
} from 'date-fns';

const SEGMENTS = [
  'The Gimmick Check','Patch Notes','World Building','Roll for Initiative',
  'The Tavern Entry','The Main Quest','Heart of the Story','The Loot Drop',
  'The Respec','Glitches in the Holodeck','Critical Fails & Jump Scares',
  'The Hyper-fixation Main Event','The Dark Match','Heel Turn','The Co-Op Club',
  'Character Sheets','Shark Week Special',"Captain's Log"
];

const STATUS = {
  upcoming:  { label: 'Upcoming',  color: 'text-cyan-400',  ring: 'rgba(6,182,212,0.35)'  },
  recording: { label: 'Recording', color: 'text-amber-400', ring: 'rgba(251,191,36,0.35)' },
  aired:     { label: 'Aired',     color: 'text-green-400', ring: 'rgba(34,197,94,0.35)'  },
};

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(239,68,68,0.2)',
  fontFamily: "'Exo 2', sans-serif",
  colorScheme: 'dark',
};

export default function EpisodeCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [episodes, setEpisodes]         = useState([]);
  const [user, setUser]                 = useState(null);
  const [selectedEp, setSelectedEp]     = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [editingEp, setEditingEp]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [form, setForm] = useState({
    title: '', recording_date: '', main_quest_topic: '', segment: '',
    description: '', submission_deadline: '', status: 'upcoming', image_url: ''
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadEpisodes();
    const unsub = base44.entities.EpisodeCalendar.subscribe(event => {
      if (event.type === 'create') setEpisodes(p => [...p, event.data].sort((a,b) => a.recording_date?.localeCompare(b.recording_date)));
      if (event.type === 'update') setEpisodes(p => p.map(e => e.id === event.id ? event.data : e));
      if (event.type === 'delete') setEpisodes(p => p.filter(e => e.id !== event.id));
    });
    return unsub;
  }, []);

  const loadEpisodes = async () => {
    const data = await base44.entities.EpisodeCalendar.list('recording_date', 200);
    setEpisodes(data);
    setLoading(false);
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 1 });
  const calDays    = eachDayOfInterval({ start: calStart, end: calEnd });

  const epsOnDay       = d => episodes.filter(ep => ep.recording_date        && isSameDay(parseISO(ep.recording_date), d));
  const deadlinesOnDay = d => episodes.filter(ep => ep.submission_deadline   && isSameDay(parseISO(ep.submission_deadline), d));

  const upcoming = episodes
    .filter(ep => ep.recording_date && ep.status !== 'aired')
    .sort((a, b) => a.recording_date.localeCompare(b.recording_date));

  const handleDayClick = day => {
    const eps = epsOnDay(day);
    if (eps.length > 0) { setSelectedEp(eps[0]); return; }
    if (!isAdmin) return;
    openForm(null, format(day, 'yyyy-MM-dd'));
  };

  const openForm = (ep, date = '') => {
    setEditingEp(ep);
    setForm(ep ? {
      title: ep.title||'', recording_date: ep.recording_date||'',
      main_quest_topic: ep.main_quest_topic||'', segment: ep.segment||'',
      description: ep.description||'', submission_deadline: ep.submission_deadline||'',
      status: ep.status||'upcoming', image_url: ep.image_url||''
    } : {
      title:'', recording_date: date, main_quest_topic:'', segment:'',
      description:'', submission_deadline:'', status:'upcoming', image_url:''
    });
    setSelectedEp(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.recording_date) return;
    setSaving(true);
    if (editingEp) {
      await base44.entities.EpisodeCalendar.update(editingEp.id, form);
    } else {
      await base44.entities.EpisodeCalendar.create(form);
      // Announce on news feed
      const deadlineStr = form.submission_deadline
        ? `\n⏰ Quest deadline: ${format(parseISO(form.submission_deadline), 'MMMM d, yyyy')}`
        : '';
      const topicStr = form.main_quest_topic ? `\n⚔️ Main Quest: ${form.main_quest_topic}` : '';
      await base44.entities.NewsPost.create({
        author_name: 'Episode Calendar',
        author_email: 'calendar@hme.app',
        content: `📅 NEW EPISODE SCHEDULED!\n\n🎙️ "${form.title}"\n📆 Recording: ${format(parseISO(form.recording_date), 'MMMM d, yyyy')}${deadlineStr}${topicStr}\n\n🦈 Get your quests in before the deadline!`,
      });
    }
    setSaving(false);
    setShowForm(false);
    setEditingEp(null);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this episode?')) return;
    await base44.entities.EpisodeCalendar.delete(id);
    setSelectedEp(null);
  };

  const F = ({ label, k, type = 'text', placeholder = '' }) => (
    <div>
      <label className="block text-xs font-bold text-slate-400 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif" }}>{label}</label>
      <input type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all duration-300"
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.55)'}
        onBlur={e => e.target.style.borderColor = 'rgba(239,68,68,0.2)'}
      />
    </div>
  );

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(120,40,200,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CalendarDays className="w-7 h-7 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
            <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500"
              style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.3rem, 4vw, 2.2rem)' }}>
              EPISODE CALENDAR
            </h1>
            <CalendarDays className="w-7 h-7 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
          </div>
          <p className="text-slate-500 text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Recording dates · Main Quest topics · Listener submission deadlines
          </p>
          {isAdmin && (
            <p className="text-amber-600/50 text-xs mt-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              ✦ Admin: click any empty date to schedule an episode
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ── CALENDAR GRID ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8,6,24,0.72)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(251,191,36,0.15)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}>

              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(251,191,36,0.1)' }}>
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-xl text-amber-400 hover:bg-amber-900/30 transition-all duration-300">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="font-black text-amber-300 tracking-widest text-base sm:text-lg"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {format(currentMonth, 'MMMM yyyy').toUpperCase()}
                </h2>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-xl text-amber-400 hover:bg-amber-900/30 transition-all duration-300">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} className="text-center py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest"
                    style={{ fontFamily: "'Exo 2', sans-serif" }}>{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {calDays.map((day, i) => {
                  const eps       = epsOnDay(day);
                  const deadlines = deadlinesOnDay(day);
                  const inMonth   = isSameMonth(day, currentMonth);
                  const today     = isToday(day);
                  const clickable = eps.length > 0 || isAdmin;

                  return (
                    <button key={i} onClick={() => handleDayClick(day)}
                      disabled={!clickable}
                      className="relative min-h-[70px] sm:min-h-[80px] p-1.5 text-left border-b border-r transition-all duration-300"
                      style={{
                        borderColor: 'rgba(255,255,255,0.04)',
                        background: today ? 'rgba(251,191,36,0.07)' : eps.length > 0 ? 'rgba(239,68,68,0.05)' : 'transparent',
                        cursor: clickable ? 'pointer' : 'default',
                      }}
                      onMouseEnter={e => { if (clickable) e.currentTarget.style.background = 'rgba(251,191,36,0.09)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = today ? 'rgba(251,191,36,0.07)' : eps.length > 0 ? 'rgba(239,68,68,0.05)' : 'transparent'; }}
                    >
                      <span className={[
                        'text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full mb-0.5 transition-all duration-300',
                        today ? 'bg-amber-400 text-black' : !inMonth ? 'text-slate-700' : eps.length > 0 ? 'text-red-300' : 'text-slate-400'
                      ].join(' ')}>
                        {format(day, 'd')}
                      </span>

                      {eps.map((ep, ei) => (
                        <div key={ei} className="truncate text-[8px] sm:text-[9px] px-1 py-0.5 rounded mb-0.5 font-bold leading-tight"
                          style={{ background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.28)', color: '#fca5a5', fontFamily: "'Exo 2', sans-serif" }}>
                          🎙 {ep.title}
                        </div>
                      ))}

                      {deadlines.length > 0 && (
                        <div className="truncate text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-bold leading-tight"
                          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)', color: '#fbbf24', fontFamily: "'Exo 2', sans-serif" }}>
                          ⏰ Deadline
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-slate-500">Today</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded" style={{ background: 'rgba(239,68,68,0.4)', border: '1px solid rgba(239,68,68,0.4)' }} /><span className="text-slate-500">Recording</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded" style={{ background: 'rgba(251,191,36,0.3)', border: '1px solid rgba(251,191,36,0.3)' }} /><span className="text-slate-500">Submission Deadline</span></div>
              </div>
            </div>
          </motion.div>

          {/* ── UPCOMING SIDEBAR ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-300/60 text-[10px] tracking-[0.3em] uppercase"
                style={{ fontFamily: "'Orbitron', sans-serif" }}>— UPCOMING —</h3>
              {isAdmin && (
                <button onClick={() => openForm(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontFamily: "'Exo 2', sans-serif" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Episode
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-600 text-sm">Loading...</div>
            ) : upcoming.length === 0 ? (
              <div className="rounded-xl p-6 text-center text-slate-600 text-sm"
                style={{ background: 'rgba(8,6,24,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                No upcoming episodes yet.
                {isAdmin && <p className="text-amber-600/50 text-xs mt-1">Click a calendar date to add one!</p>}
              </div>
            ) : (
              upcoming.map((ep, i) => (
                <motion.button key={ep.id} onClick={() => setSelectedEp(ep)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="text-left w-full rounded-xl p-4 transition-all duration-500"
                  style={{
                    background: 'rgba(8,6,24,0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(251,191,36,0.1)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(251,191,36,0.1)'}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-white truncate flex-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                      {ep.title}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS[ep.status]?.color || 'text-slate-400'}`}
                      style={{ background: 'rgba(255,255,255,0.07)' }}>
                      {STATUS[ep.status]?.label || ep.status}
                    </span>
                  </div>
                  {ep.recording_date && (
                    <p className="text-xs text-amber-400/70 flex items-center gap-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                      <CalendarDays className="w-3 h-3 shrink-0" />
                      {format(parseISO(ep.recording_date), 'MMM d, yyyy')}
                    </p>
                  )}
                  {ep.main_quest_topic && (
                    <p className="text-[10px] text-slate-500 mt-1 truncate" style={{ fontFamily: "'Exo 2', sans-serif" }}>⚔️ {ep.main_quest_topic}</p>
                  )}
                  {ep.submission_deadline && (
                    <p className="text-[10px] text-red-400/60 mt-0.5 flex items-center gap-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      Deadline: {format(parseISO(ep.submission_deadline), 'MMM d')}
                    </p>
                  )}
                </motion.button>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedEp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
            onClick={() => setSelectedEp(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8,6,24,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(251,191,36,0.3)',
                boxShadow: '0 0 0 1px rgba(251,191,36,0.08), 0 40px 80px rgba(0,0,0,0.85)',
              }}>
              <div className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }} />

              {/* Modal header */}
              <div className="px-6 pt-6 pb-4 border-b flex items-start justify-between gap-3" style={{ borderColor: 'rgba(251,191,36,0.1)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-amber-400/60 uppercase tracking-widest font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      Episode Details
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>{selectedEp.title}</h2>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isAdmin && (
                    <>
                      <button onClick={() => openForm(selectedEp)}
                        className="p-2 rounded-lg text-amber-400 hover:bg-amber-900/30 transition-all duration-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(selectedEp.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-all duration-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedEp(null)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-300 transition-all duration-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4">
                {selectedEp.image_url && (
                  <img src={selectedEp.image_url} alt="" className="w-full h-44 object-cover rounded-xl" />
                )}
                <div className="grid grid-cols-2 gap-3">
                  {selectedEp.recording_date && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <p className="text-[9px] text-red-400/60 uppercase tracking-wider mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>Recording Date</p>
                      <p className="text-sm font-bold text-red-300" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {format(parseISO(selectedEp.recording_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedEp.submission_deadline && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <p className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>Submission Deadline</p>
                      <p className="text-sm font-bold text-amber-300" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {format(parseISO(selectedEp.submission_deadline), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
                {selectedEp.main_quest_topic && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.09)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <p className="text-[9px] text-purple-400/60 uppercase tracking-wider mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>Main Quest Topic</p>
                    <p className="text-sm font-bold text-purple-200" style={{ fontFamily: "'Exo 2', sans-serif" }}>⚔️ {selectedEp.main_quest_topic}</p>
                  </div>
                )}
                {selectedEp.segment && (
                  <div className="flex items-center gap-2 text-sm text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    <Sword className="w-4 h-4 text-cyan-500 shrink-0" />
                    Segment: <span className="text-cyan-300 ml-1">{selectedEp.segment}</span>
                  </div>
                )}
                {selectedEp.description && (
                  <p className="text-sm text-slate-400 leading-relaxed" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {selectedEp.description}
                  </p>
                )}
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS[selectedEp.status]?.color || 'text-slate-400'}`}
                    style={{ background: 'rgba(255,255,255,0.07)', fontFamily: "'Exo 2', sans-serif" }}>
                    {STATUS[selectedEp.status]?.label || selectedEp.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ADMIN FORM MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
              style={{
                background: 'rgba(8,6,24,0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(239,68,68,0.3)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.85)',
              }}>
              <div className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />

              <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(239,68,68,0.1)' }}>
                <h2 className="font-black text-white text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {editingEp ? 'Edit Episode' : 'Schedule New Episode'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 text-slate-500 hover:text-white rounded-lg transition-all duration-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <F label="Episode Title *" k="title" placeholder="Ep. 42 — The Hyper-fixation Rises" />
                <F label="Recording Date *" k="recording_date" type="date" />
                <F label="Submission Deadline" k="submission_deadline" type="date" />
                <F label="Main Quest Topic" k="main_quest_topic" placeholder="e.g. Star Trek: Deep Space Nine" />
                <F label="Cover Image URL" k="image_url" placeholder="https://..." />

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif" }}>Segment</label>
                  <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all duration-300"
                    style={{ background: 'rgba(8,6,24,0.95)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: "'Exo 2', sans-serif", colorScheme: 'dark' }}>
                    <option value="">— Select Segment —</option>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif" }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all duration-300"
                    style={{ background: 'rgba(8,6,24,0.95)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: "'Exo 2', sans-serif", colorScheme: 'dark' }}>
                    <option value="upcoming">Upcoming</option>
                    <option value="recording">Recording</option>
                    <option value="aired">Aired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif" }}>Episode Notes</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Any extra notes..." rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none"
                    style={{ ...inputStyle }} />
                </div>

                <button onClick={handleSave} disabled={saving || !form.title || !form.recording_date}
                  className="w-full py-3 rounded-xl font-black text-white text-sm disabled:opacity-40 transition-all duration-500"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 0%, #7f1d1d 0%, #450a0a 50%, #1a0505 100%)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    fontFamily: "'Exo 2', sans-serif",
                    letterSpacing: '0.06em',
                  }}>
                  {saving ? '⏳ Saving...' : editingEp ? '✅ Update Episode' : '🗓 Schedule Episode'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}