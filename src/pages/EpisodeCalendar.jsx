import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, Edit
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, parseISO
} from 'date-fns';

// ── LCARS PALETTE ──────────────────────────────────────────
const C = {
  orange:  '#ff9900',
  mauve:   '#cc99cc',
  blue:    '#9999ff',
  red:     '#ff5555',
  cyan:    '#66ccff',
  yellow:  '#ffcc00',
  black:   '#000000',
  panel:   '#111111',
};

const SEGMENTS = [
  'The Gimmick Check','Patch Notes','World Building','Roll for Initiative',
  'The Tavern Entry','The Main Quest','Heart of the Story','The Loot Drop',
  'The Respec','Glitches in the Holodeck','Critical Fails & Jump Scares',
  'The Hyper-fixation Main Event','The Dark Match','Heel Turn','The Co-Op Club',
  'Character Sheets','Shark Week Special',"Captain's Log"
];

const STATUS = {
  upcoming:  { label: 'INCOMING',  color: C.cyan   },
  recording: { label: 'ACTIVE',    color: C.orange  },
  aired:     { label: 'LOGGED',    color: C.mauve   },
};

// Convert date to Stardate (year.dayOfYear format)
const toStardate = (dateStr) => {
  if (!dateStr) return '';
  const d = parseISO(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return `${d.getFullYear()}.${day}`;
};

// LCARS Button with pulse effect
function LCARSButton({ onClick, color = C.orange, children, className = '', disabled = false, small = false }) {
  const [pulse, setPulse] = useState(false);
  const handleClick = () => {
    if (disabled) return;
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    onClick?.();
  };
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden uppercase font-black tracking-widest transition-all duration-200 disabled:opacity-40 ${className}`}
      style={{
        background: pulse ? '#ffffff' : color,
        color: C.black,
        borderRadius: small ? '20px' : '30px',
        padding: small ? '4px 14px' : '8px 24px',
        fontSize: small ? '10px' : '12px',
        letterSpacing: '0.15em',
        fontFamily: 'Arial, sans-serif',
        border: 'none',
        boxShadow: pulse ? `0 0 20px ${color}` : 'none',
        transition: 'background 0.1s, box-shadow 0.2s',
      }}
    >
      {children}
    </button>
  );
}

// LCARS Input
function LCARSInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: C.mauve, fontFamily: 'Arial, sans-serif' }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm focus:outline-none"
        style={{
          background: '#1a1a2e',
          border: `1px solid ${C.blue}55`,
          borderLeft: `3px solid ${C.blue}`,
          color: C.cyan,
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '0.05em',
          colorScheme: 'dark',
          borderRadius: '2px',
        }}
        onFocus={e => e.target.style.borderColor = C.orange}
        onBlur={e => { e.target.style.borderLeft = `3px solid ${C.blue}`; e.target.style.borderColor = `${C.blue}55`; e.target.style.borderLeftColor = C.blue; }}
      />
    </div>
  );
}

// LCARS Select
function LCARSSelect({ label, value, onChange, children }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: C.mauve, fontFamily: 'Arial, sans-serif' }}>{label}</div>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 text-sm focus:outline-none"
        style={{
          background: '#1a1a2e',
          border: `1px solid ${C.blue}55`,
          borderLeft: `3px solid ${C.blue}`,
          color: C.cyan,
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '0.05em',
          colorScheme: 'dark',
          borderRadius: '2px',
        }}
      >
        {children}
      </select>
    </div>
  );
}

export default function EpisodeCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [episodes, setEpisodes]         = useState([]);
  const [user, setUser]                 = useState(null);
  const [selectedEp, setSelectedEp]     = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [editingEp, setEditingEp]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [activeTab, setActiveTab]       = useState('CALENDAR');
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 1 });
  const calDays    = eachDayOfInterval({ start: calStart, end: calEnd });

  const epsOnDay       = d => episodes.filter(ep => ep.recording_date      && isSameDay(parseISO(ep.recording_date), d));
  const deadlinesOnDay = d => episodes.filter(ep => ep.submission_deadline && isSameDay(parseISO(ep.submission_deadline), d));

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

  const TABS = ['CALENDAR', 'UPCOMING', ...(isAdmin ? ['SCHEDULE'] : [])];

  return (
    <div className="min-h-screen" style={{ background: C.black, fontFamily: 'Arial, sans-serif' }}>

      {/* ── MOBILE HORIZONTAL STRIP ── */}
      <div className="md:hidden">
        {/* Mobile LCARS header */}
        <div style={{ background: C.orange, height: '12px', width: '100%' }} />
        <div className="flex items-center gap-0 overflow-x-auto px-2 py-2" style={{ background: '#111' }}>
          {TABS.map(tab => (
            <LCARSButton key={tab} small onClick={() => setActiveTab(tab)}
              color={activeTab === tab ? C.orange : C.mauve}
              className="mr-2 shrink-0">
              {tab}
            </LCARSButton>
          ))}
          {isAdmin && activeTab !== 'SCHEDULE' && (
            <LCARSButton small onClick={() => openForm(null)} color={C.blue} className="ml-auto shrink-0">
              + LOG
            </LCARSButton>
          )}
        </div>
        <div style={{ background: C.orange, height: '4px', width: '100%' }} />
      </div>

      {/* ── DESKTOP LCARS LAYOUT ── */}
      <div className="flex min-h-screen">

        {/* ── LEFT SIDEBAR (desktop only) ── */}
        <div className="hidden md:flex flex-col" style={{ width: '160px', minWidth: '160px', background: C.black }}>

          {/* ELBOW — top L-shape */}
          <div className="relative" style={{ height: '200px' }}>
            {/* Vertical orange bar */}
            <div className="absolute left-0 top-0 bottom-0" style={{ width: '60px', background: C.orange, borderBottomLeftRadius: '0', borderBottomRightRadius: '40px' }} />
            {/* Horizontal orange bar */}
            <div className="absolute left-0 right-0 top-0" style={{ height: '60px', background: C.orange, borderTopRightRadius: '0', borderBottomRightRadius: '40px', marginLeft: '0', marginRight: '0' }} />
            {/* Inner black cutout to create L shape */}
            <div className="absolute" style={{ left: '60px', top: '60px', right: 0, bottom: 0, background: C.black }} />
            {/* Station label inside elbow */}
            <div className="absolute flex flex-col justify-end pb-2 pl-2" style={{ left: 0, top: 0, width: '60px', height: '200px' }}>
              <div style={{ color: C.black, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', writingMode: 'vertical-rl', transform: 'rotate(180deg)', textTransform: 'uppercase' }}>
                HME
              </div>
            </div>
          </div>

          {/* Nav pills */}
          <div className="flex flex-col gap-2 px-2 mt-4">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="w-full text-left uppercase font-black text-xs tracking-widest py-2 px-3 transition-all"
                style={{
                  background: activeTab === tab ? C.orange : C.mauve,
                  color: C.black,
                  borderRadius: '20px',
                  letterSpacing: '0.15em',
                  border: 'none',
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Decorative color blocks */}
          <div className="flex flex-col gap-1 px-2 mt-6">
            {[C.orange, C.mauve, C.blue, C.cyan, C.yellow, C.mauve, C.orange].map((col, i) => (
              <div key={i} style={{ background: col, height: '18px', borderRadius: '10px', opacity: 0.6 + i * 0.05 }} />
            ))}
          </div>

          {/* Add episode button */}
          {isAdmin && (
            <div className="px-2 mt-4">
              <LCARSButton onClick={() => openForm(null)} color={C.blue} className="w-full">
                + LOG EP
              </LCARSButton>
            </div>
          )}

          {/* Bottom decorative block */}
          <div className="mt-auto px-2 pb-4 flex flex-col gap-1">
            {[C.blue, C.mauve, C.orange].map((col, i) => (
              <div key={i} style={{ background: col, height: '24px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">

          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-1">
              <div style={{ background: C.orange, height: '3px', width: '40px', borderRadius: '2px' }} />
              <h1 className="uppercase font-black" style={{ color: C.orange, fontSize: 'clamp(1rem, 3vw, 1.6rem)', letterSpacing: '0.15em', fontFamily: 'Arial, sans-serif' }}>
                EPISODE CALENDAR
              </h1>
              <div style={{ background: C.orange, height: '3px', flex: 1, borderRadius: '2px' }} />
            </div>
            <div style={{ color: C.mauve, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              STARFLEET MEDIA DIVISION — MISSION LOG INTERFACE
            </div>
            {isAdmin && (
              <div style={{ color: C.blue, fontSize: '9px', letterSpacing: '0.1em', marginTop: '2px' }}>
                ◈ ADMIN ACCESS GRANTED — SELECT DATE TO LOG MISSION
              </div>
            )}
          </div>

          {/* ── CALENDAR TAB ── */}
          {activeTab === 'CALENDAR' && (
            <div>
              {/* Month nav */}
              <div className="flex items-center gap-3 mb-4">
                <LCARSButton small onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} color={C.mauve}>
                  ◀ PREV
                </LCARSButton>
                <div className="flex-1 text-center font-black uppercase tracking-widest" style={{ color: C.orange, fontSize: '14px', letterSpacing: '0.2em' }}>
                  {format(currentMonth, 'MMMM yyyy')}
                  <span style={{ color: C.blue, marginLeft: '12px', fontSize: '10px' }}>
                    SD {format(currentMonth, 'yyyy')}.{format(currentMonth, 'MM')}
                  </span>
                </div>
                <LCARSButton small onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} color={C.mauve}>
                  NEXT ▶
                </LCARSButton>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1 gap-0.5">
                {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
                  <div key={d} className="text-center py-1 font-black uppercase text-[9px] tracking-widest"
                    style={{ background: C.mauve, color: C.black, borderRadius: '4px' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map((day, i) => {
                  const eps       = epsOnDay(day);
                  const deadlines = deadlinesOnDay(day);
                  const inMonth   = isSameMonth(day, currentMonth);
                  const today     = isToday(day);
                  const clickable = eps.length > 0 || isAdmin;

                  return (
                    <button key={i} onClick={() => handleDayClick(day)}
                      disabled={!clickable}
                      className="relative min-h-[64px] sm:min-h-[80px] p-1 text-left transition-all"
                      style={{
                        background: today ? '#1a1400' : eps.length > 0 ? '#0d001a' : '#0a0a0a',
                        border: today ? `1px solid ${C.orange}` : eps.length > 0 ? `1px solid ${C.mauve}44` : '1px solid #1a1a1a',
                        cursor: clickable ? 'pointer' : 'default',
                        borderRadius: '2px',
                      }}
                      onMouseEnter={e => { if (clickable) e.currentTarget.style.background = '#1a1a00'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = today ? '#1a1400' : eps.length > 0 ? '#0d001a' : '#0a0a0a'; }}
                    >
                      <span className="font-black text-xs"
                        style={{
                          color: today ? C.orange : !inMonth ? '#333' : eps.length > 0 ? C.mauve : '#666',
                          background: today ? C.orange + '22' : 'transparent',
                          borderRadius: '10px',
                          padding: '1px 4px',
                        }}>
                        {format(day, 'd')}
                      </span>

                      {eps.map((ep, ei) => (
                        <div key={ei} className="truncate text-[7px] sm:text-[8px] px-1 py-0.5 mt-0.5 font-black uppercase tracking-wide"
                          style={{ background: C.mauve + '33', borderLeft: `2px solid ${C.mauve}`, color: C.mauve }}>
                          ▶ {ep.title}
                        </div>
                      ))}

                      {deadlines.length > 0 && (
                        <div className="truncate text-[7px] sm:text-[8px] px-1 py-0.5 mt-0.5 font-black uppercase tracking-wide"
                          style={{ background: C.orange + '22', borderLeft: `2px solid ${C.orange}`, color: C.orange }}>
                          ⏰ DEADLINE
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-[9px] uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: C.orange }} /><span style={{ color: C.orange }}>Today</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: C.mauve }} /><span style={{ color: C.mauve }}>Recording</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: C.blue }} /><span style={{ color: C.blue }}>Deadline</span></div>
              </div>
            </div>
          )}

          {/* ── UPCOMING TAB ── */}
          {activeTab === 'UPCOMING' && (
            <div className="space-y-2">
              <div className="uppercase font-black tracking-widest text-xs mb-4" style={{ color: C.blue, letterSpacing: '0.2em' }}>
                ◈ ACTIVE MISSION LOGS
              </div>
              {loading ? (
                <div style={{ color: C.mauve, fontSize: '11px', letterSpacing: '0.1em' }}>ACCESSING DATABASE...</div>
              ) : upcoming.length === 0 ? (
                <div style={{ color: '#444', fontSize: '11px', letterSpacing: '0.1em', border: `1px solid #222`, padding: '24px', textAlign: 'center' }}>
                  NO UPCOMING MISSIONS LOGGED
                </div>
              ) : (
                upcoming.map((ep, i) => (
                  <motion.button key={ep.id} onClick={() => setSelectedEp(ep)}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="w-full text-left flex items-stretch transition-all hover:brightness-125"
                    style={{ border: `1px solid ${STATUS[ep.status]?.color || C.blue}44`, borderRadius: '3px', overflow: 'hidden' }}
                  >
                    {/* Color bar */}
                    <div style={{ width: '6px', background: STATUS[ep.status]?.color || C.blue, flexShrink: 0 }} />
                    <div className="flex-1 flex items-center justify-between px-4 py-3" style={{ background: '#0d0d0d' }}>
                      <div>
                        <div className="uppercase font-black text-sm tracking-wide" style={{ color: STATUS[ep.status]?.color || C.blue, letterSpacing: '0.1em' }}>
                          {ep.title}
                        </div>
                        {ep.recording_date && (
                          <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#666' }}>
                            STARDATE {toStardate(ep.recording_date)} · {format(parseISO(ep.recording_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        {ep.main_quest_topic && (
                          <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: C.mauve }}>
                            ◈ {ep.main_quest_topic}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 ml-3">
                        <div className="font-black text-[9px] px-3 py-1 uppercase tracking-widest"
                          style={{ background: (STATUS[ep.status]?.color || C.blue) + '22', color: STATUS[ep.status]?.color || C.blue, borderRadius: '20px' }}>
                          {STATUS[ep.status]?.label || ep.status}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          )}

          {/* ── SCHEDULE TAB (admin) ── */}
          {activeTab === 'SCHEDULE' && isAdmin && (
            <div>
              <div className="uppercase font-black tracking-widest text-xs mb-4" style={{ color: C.orange, letterSpacing: '0.2em' }}>
                ◈ ALL MISSION LOGS
              </div>
              <LCARSButton onClick={() => openForm(null)} color={C.orange} className="mb-4">
                + LOG NEW EPISODE
              </LCARSButton>
              <div className="space-y-2">
                {episodes.map((ep, i) => (
                  <div key={ep.id} className="flex items-stretch" style={{ border: `1px solid #222`, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '6px', background: STATUS[ep.status]?.color || C.blue, flexShrink: 0 }} />
                    <div className="flex-1 flex items-center justify-between px-4 py-2" style={{ background: '#0d0d0d' }}>
                      <div>
                        <div className="uppercase font-black text-xs tracking-wide" style={{ color: C.cyan }}>
                          {ep.title}
                        </div>
                        {ep.recording_date && (
                          <div className="text-[9px] uppercase tracking-widest" style={{ color: '#555' }}>
                            SD {toStardate(ep.recording_date)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-widest font-black px-2 py-0.5"
                          style={{ background: (STATUS[ep.status]?.color || C.blue) + '22', color: STATUS[ep.status]?.color || C.blue, borderRadius: '20px' }}>
                          {STATUS[ep.status]?.label || ep.status}
                        </span>
                        <button onClick={() => openForm(ep)} className="p-1 transition-all hover:opacity-70" style={{ color: C.orange }}>
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(ep.id)} className="p-1 transition-all hover:opacity-70" style={{ color: C.red }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedEp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setSelectedEp(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden"
              style={{ background: C.black, border: `2px solid ${C.orange}`, borderRadius: '4px' }}>

              {/* Modal header bar */}
              <div className="flex items-center justify-between px-4 py-3" style={{ background: C.orange }}>
                <div className="uppercase font-black text-xs tracking-widest" style={{ color: C.black, letterSpacing: '0.2em' }}>
                  MISSION BRIEFING
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button onClick={() => openForm(selectedEp)} className="p-1 hover:opacity-70" style={{ color: C.black }}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(selectedEp.id)} className="p-1 hover:opacity-70" style={{ color: C.black }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedEp(null)} className="p-1 hover:opacity-70" style={{ color: C.black }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {selectedEp.image_url && (
                  <img src={selectedEp.image_url} alt="" className="w-full h-40 object-cover" style={{ borderRadius: '2px' }} />
                )}

                <div>
                  <div className="uppercase font-black text-lg tracking-wide" style={{ color: C.cyan, letterSpacing: '0.1em' }}>
                    {selectedEp.title}
                  </div>
                  {selectedEp.recording_date && (
                    <div className="text-xs uppercase tracking-widest mt-1" style={{ color: C.mauve }}>
                      STARDATE {toStardate(selectedEp.recording_date)} · {format(parseISO(selectedEp.recording_date), 'MMMM d, yyyy')}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedEp.recording_date && (
                    <div className="p-3" style={{ background: '#0d0d0d', borderLeft: `3px solid ${C.orange}` }}>
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.orange }}>Recording</div>
                      <div className="text-sm font-black uppercase" style={{ color: C.orange }}>
                        {format(parseISO(selectedEp.recording_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                  {selectedEp.submission_deadline && (
                    <div className="p-3" style={{ background: '#0d0d0d', borderLeft: `3px solid ${C.blue}` }}>
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.blue }}>Deadline</div>
                      <div className="text-sm font-black uppercase" style={{ color: C.blue }}>
                        {format(parseISO(selectedEp.submission_deadline), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                </div>

                {selectedEp.main_quest_topic && (
                  <div className="p-3" style={{ background: '#0d0d0d', borderLeft: `3px solid ${C.mauve}` }}>
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.mauve }}>Main Quest</div>
                    <div className="text-sm font-black uppercase" style={{ color: C.mauve }}>{selectedEp.main_quest_topic}</div>
                  </div>
                )}

                {selectedEp.segment && (
                  <div className="text-xs uppercase tracking-widest" style={{ color: C.cyan }}>
                    ◈ SEGMENT: {selectedEp.segment}
                  </div>
                )}

                {selectedEp.description && (
                  <div className="text-sm leading-relaxed" style={{ color: '#888', fontStyle: 'italic' }}>
                    {selectedEp.description}
                  </div>
                )}

                <div>
                  <span className="font-black text-[10px] px-4 py-1.5 uppercase tracking-widest"
                    style={{ background: (STATUS[selectedEp.status]?.color || C.blue) + '22', color: STATUS[selectedEp.status]?.color || C.blue, borderRadius: '20px' }}>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg overflow-y-auto max-h-[90vh]"
              style={{ background: C.black, border: `2px solid ${C.blue}`, borderRadius: '4px' }}>

              <div className="flex items-center justify-between px-4 py-3" style={{ background: C.blue }}>
                <div className="uppercase font-black text-xs tracking-widest" style={{ color: C.black, letterSpacing: '0.2em' }}>
                  {editingEp ? 'EDIT MISSION LOG' : 'LOG NEW MISSION'}
                </div>
                <button onClick={() => setShowForm(false)} style={{ color: C.black }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <LCARSInput label="Episode Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ep. 42 — The Hyper-fixation Rises" />
                <LCARSInput label="Recording Date *" value={form.recording_date} onChange={e => setForm(f => ({ ...f, recording_date: e.target.value }))} type="date" />
                <LCARSInput label="Submission Deadline" value={form.submission_deadline} onChange={e => setForm(f => ({ ...f, submission_deadline: e.target.value }))} type="date" />
                <LCARSInput label="Main Quest Topic" value={form.main_quest_topic} onChange={e => setForm(f => ({ ...f, main_quest_topic: e.target.value }))} placeholder="e.g. Star Trek: Deep Space Nine" />
                <LCARSInput label="Cover Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />

                <LCARSSelect label="Segment" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                  <option value="">— SELECT SEGMENT —</option>
                  {SEGMENTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </LCARSSelect>

                <LCARSSelect label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="upcoming">INCOMING</option>
                  <option value="recording">ACTIVE</option>
                  <option value="aired">LOGGED</option>
                </LCARSSelect>

                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: C.mauve }}>Episode Notes</div>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Any extra notes..." rows={3}
                    className="w-full px-3 py-2 text-sm focus:outline-none resize-none"
                    style={{ background: '#1a1a2e', border: `1px solid ${C.blue}55`, borderLeft: `3px solid ${C.blue}`, color: C.cyan, fontFamily: 'Arial, sans-serif', borderRadius: '2px', colorScheme: 'dark' }}
                  />
                </div>

                <LCARSButton onClick={handleSave} disabled={saving || !form.title || !form.recording_date} color={C.orange} className="w-full">
                  {saving ? 'TRANSMITTING...' : editingEp ? 'UPDATE LOG' : 'COMMIT TO DATABASE'}
                </LCARSButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}