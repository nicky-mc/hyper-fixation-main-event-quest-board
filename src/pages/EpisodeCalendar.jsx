import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, parseISO
} from 'date-fns';

const C = {
  orange: '#ff9900',
  mauve:  '#cc99cc',
  blue:   '#9999ff',
  red:    '#ff5555',
  cyan:   '#66ccff',
  yellow: '#ffcc00',
  black:  '#000000',
};

const SEGMENTS = [
  'The Gimmick Check','Patch Notes','World Building','Roll for Initiative',
  'The Tavern Entry','The Main Quest','Heart of the Story','The Loot Drop',
  'The Respec','Glitches in the Holodeck','Critical Fails & Jump Scares',
  'The Hyper-fixation Main Event','The Dark Match','Heel Turn','The Co-Op Club',
  'Character Sheets','Shark Week Special',"Captain's Log",
];

const STATUS = {
  upcoming:  { label: 'INCOMING', color: C.cyan   },
  recording: { label: 'ACTIVE',   color: C.orange  },
  aired:     { label: 'LOGGED',   color: C.mauve   },
};

const toStardate = (dateStr) => {
  if (!dateStr) return '';
  const d = parseISO(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d - start) / 86400000);
  return `${d.getFullYear()}.${day}`;
};

function LBtn({ onClick, color = C.orange, children, className = '', disabled = false, small = false }) {
  const [pulse, setPulse] = useState(false);
  const go = () => {
    if (disabled) return;
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    onClick?.();
  };
  return (
    <button onClick={go} disabled={disabled}
      className={`uppercase font-black tracking-widest transition-all duration-200 disabled:opacity-40 ${className}`}
      style={{
        background: pulse ? '#fff' : color,
        color: C.black,
        borderRadius: small ? '20px' : '30px',
        padding: small ? '4px 14px' : '8px 24px',
        fontSize: small ? '10px' : '12px',
        letterSpacing: '0.15em',
        border: 'none',
        boxShadow: pulse ? `0 0 20px ${color}` : 'none',
      }}>
      {children}
    </button>
  );
}

function LField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: C.mauve }}>{label}</div>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm focus:outline-none uppercase tracking-wide"
        style={{ background: '#1a1a2e', border: `1px solid ${C.blue}55`, borderLeft: `3px solid ${C.blue}`, color: C.cyan, colorScheme: 'dark', borderRadius: '2px' }}
        onFocus={e => e.target.style.borderColor = C.orange}
        onBlur={e => { e.target.style.borderLeft = `3px solid ${C.blue}`; e.target.style.borderColor = `${C.blue}55`; e.target.style.borderLeftColor = C.blue; }}
      />
    </div>
  );
}

function LSelect({ label, value, onChange, children }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: C.mauve }}>{label}</div>
      <select value={value} onChange={onChange}
        className="w-full px-3 py-2 text-sm focus:outline-none uppercase tracking-wide"
        style={{ background: '#1a1a2e', border: `1px solid ${C.blue}55`, borderLeft: `3px solid ${C.blue}`, color: C.cyan, colorScheme: 'dark', borderRadius: '2px' }}>
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
    description: '', submission_deadline: '', status: 'upcoming', image_url: '',
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadEpisodes();
    const unsub = base44.entities.EpisodeCalendar.subscribe(event => {
      if (event.type === 'create') setEpisodes(p => [...p, event.data].sort((a, b) => a.recording_date?.localeCompare(b.recording_date)));
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
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
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
      status: ep.status||'upcoming', image_url: ep.image_url||'',
    } : {
      title: '', recording_date: date, main_quest_topic: '', segment: '',
      description: '', submission_deadline: '', status: 'upcoming', image_url: '',
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
      const deadlineStr = form.submission_deadline ? `\n⏰ Quest deadline: ${format(parseISO(form.submission_deadline), 'MMMM d, yyyy')}` : '';
      const topicStr    = form.main_quest_topic ? `\n⚔️ Main Quest: ${form.main_quest_topic}` : '';
      await base44.entities.NewsPost.create({
        author_name: 'Episode Calendar', author_email: 'calendar@hme.app',
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

  // ── SHARED TAB CONTENT ────────────────────────────────────────────────────
  const renderContent = () => {
    if (activeTab === 'CALENDAR') return (
      <div>
        {/* Month nav */}
        <div className="flex items-center gap-3 mb-4">
          <LBtn small onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} color={C.mauve}>◀ PREV</LBtn>
          <div className="flex-1 text-center font-black uppercase tracking-widest" style={{ color: C.orange, fontSize: '14px', letterSpacing: '0.2em' }}>
            {format(currentMonth, 'MMMM yyyy')}
            <span style={{ color: C.blue, marginLeft: '12px', fontSize: '10px' }}>
              SD {format(currentMonth, 'yyyy')}.{format(currentMonth, 'MM')}
            </span>
          </div>
          <LBtn small onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} color={C.mauve}>NEXT ▶</LBtn>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1 gap-0.5">
          {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
            <div key={d} className="text-center py-1 font-black uppercase text-[9px] tracking-widest"
              style={{ background: C.mauve, color: C.black, borderRadius: '4px' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calDays.map((day, i) => {
            const eps       = epsOnDay(day);
            const deadlines = deadlinesOnDay(day);
            const inMonth   = isSameMonth(day, currentMonth);
            const today     = isToday(day);
            const clickable = eps.length > 0 || isAdmin;
            return (
              <button key={i} onClick={() => handleDayClick(day)} disabled={!clickable}
                className="relative min-h-[64px] sm:min-h-[80px] p-1 text-left transition-all"
                style={{ background: today ? '#1a1400' : eps.length > 0 ? '#0d001a' : '#0a0a0a', border: today ? `1px solid ${C.orange}` : eps.length > 0 ? `1px solid ${C.mauve}44` : '1px solid #1a1a1a', cursor: clickable ? 'pointer' : 'default', borderRadius: '2px' }}
                onMouseEnter={e => { if (clickable) e.currentTarget.style.background = '#1a1a00'; }}
                onMouseLeave={e => { e.currentTarget.style.background = today ? '#1a1400' : eps.length > 0 ? '#0d001a' : '#0a0a0a'; }}
              >
                <span className="font-black text-xs" style={{ color: today ? C.orange : !inMonth ? '#333' : eps.length > 0 ? C.mauve : '#666', background: today ? C.orange + '22' : 'transparent', borderRadius: '10px', padding: '1px 4px' }}>
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
    );

    if (activeTab === 'UPCOMING') return (
      <div className="space-y-2">
        <div className="uppercase font-black tracking-widest text-xs mb-4" style={{ color: C.blue, letterSpacing: '0.2em' }}>◈ ACTIVE MISSION LOGS</div>
        {loading ? (
          <div className="uppercase" style={{ color: C.mauve, fontSize: '11px', letterSpacing: '0.1em' }}>ACCESSING DATABASE...</div>
        ) : upcoming.length === 0 ? (
          <div className="uppercase text-center p-6" style={{ color: '#444', fontSize: '11px', letterSpacing: '0.1em', border: `1px solid #222` }}>
            NO UPCOMING MISSIONS LOGGED
          </div>
        ) : upcoming.map((ep, i) => (
          <motion.button key={ep.id} onClick={() => setSelectedEp(ep)}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="w-full text-left flex items-stretch transition-all hover:brightness-125"
            style={{ border: `1px solid ${STATUS[ep.status]?.color || C.blue}44`, borderRadius: '3px', overflow: 'hidden' }}
          >
            <div style={{ width: '6px', background: STATUS[ep.status]?.color || C.blue, flexShrink: 0 }} />
            <div className="flex-1 flex items-center justify-between px-4 py-3" style={{ background: '#0d0d0d' }}>
              <div className="flex-1 min-w-0">
                <div className="uppercase font-black text-sm tracking-wide truncate" style={{ color: STATUS[ep.status]?.color || C.blue }}>{ep.title}</div>
                {ep.recording_date && (
                  <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#666' }}>
                    STARDATE {toStardate(ep.recording_date)} · {format(parseISO(ep.recording_date), 'MMM d, yyyy')}
                  </div>
                )}
                {ep.main_quest_topic && (
                  <div className="text-[10px] uppercase tracking-wide mt-0.5 truncate" style={{ color: C.mauve }}>◈ {ep.main_quest_topic}</div>
                )}
              </div>
              {/* Right-aligned date + status block */}
              <div className="shrink-0 ml-3 flex flex-col items-end gap-1">
                {ep.recording_date && (
                  <div className="px-3 py-1.5 text-right" style={{ background: (STATUS[ep.status]?.color || C.blue) + '1a', borderRadius: '4px', borderRight: `3px solid ${STATUS[ep.status]?.color || C.blue}` }}>
                    <div className="font-black text-[11px] uppercase tracking-wide" style={{ color: STATUS[ep.status]?.color || C.blue }}>
                      {format(parseISO(ep.recording_date), 'MMM d')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: '#555' }}>
                      {format(parseISO(ep.recording_date), 'yyyy')}
                    </div>
                  </div>
                )}
                <div className="font-black text-[9px] px-3 py-1 uppercase tracking-widest"
                  style={{ background: (STATUS[ep.status]?.color || C.blue) + '22', color: STATUS[ep.status]?.color || C.blue, borderRadius: '20px' }}>
                  {STATUS[ep.status]?.label || ep.status}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    );

    if (activeTab === 'SCHEDULE' && isAdmin) return (
      <div>
        <div className="uppercase font-black tracking-widest text-xs mb-4" style={{ color: C.orange, letterSpacing: '0.2em' }}>◈ ALL MISSION LOGS</div>
        <LBtn onClick={() => openForm(null)} color={C.orange} className="mb-4">+ LOG NEW EPISODE</LBtn>
        <div className="space-y-2">
          {episodes.map(ep => (
            <div key={ep.id} className="flex items-stretch" style={{ border: `1px solid #222`, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '6px', background: STATUS[ep.status]?.color || C.blue, flexShrink: 0 }} />
              <div className="flex-1 flex items-center justify-between px-4 py-2" style={{ background: '#0d0d0d' }}>
                <div className="flex-1 min-w-0">
                  <div className="uppercase font-black text-xs tracking-wide truncate" style={{ color: C.cyan }}>{ep.title}</div>
                  {ep.recording_date && (
                    <div className="text-[9px] uppercase tracking-widest" style={{ color: '#555' }}>SD {toStardate(ep.recording_date)}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest font-black px-2 py-0.5"
                    style={{ background: (STATUS[ep.status]?.color || C.blue) + '22', color: STATUS[ep.status]?.color || C.blue, borderRadius: '20px' }}>
                    {STATUS[ep.status]?.label || ep.status}
                  </span>
                  <button onClick={() => openForm(ep)} className="p-1 hover:opacity-70" style={{ color: C.orange }}><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(ep.id)} className="p-1 hover:opacity-70" style={{ color: C.red }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    return null;
  };

  return (
    <div className="min-h-screen" style={{ background: C.black }}>

      {/* ══ MOBILE LAYOUT ══════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Title bar */}
        <div className="px-4 py-3" style={{ background: C.orange }}>
          <div className="font-black tracking-widest text-base uppercase" style={{ color: C.black }}>EPISODE CALENDAR</div>
          <div className="text-[9px] tracking-widest mt-0.5 uppercase" style={{ color: 'rgba(0,0,0,0.55)' }}>STARFLEET MEDIA DIVISION</div>
        </div>

        {/* Multi-color stripe separator */}
        <div className="flex h-1.5">
          {[C.mauve, C.blue, C.cyan, C.yellow, C.orange].map((col, i) => (
            <div key={i} className="flex-1" style={{ background: col }} />
          ))}
        </div>

        {/* Tab pills row */}
        <div className="flex gap-2 px-3 py-2.5 overflow-x-auto" style={{ background: '#111' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="shrink-0 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest transition-all"
              style={{
                background: activeTab === tab ? C.orange : 'rgba(255,153,0,0.12)',
                color: activeTab === tab ? C.black : C.orange,
                border: `1px solid ${activeTab === tab ? C.orange : C.orange + '33'}`,
              }}>
              {tab}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => openForm(null)}
              className="shrink-0 ml-auto px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest"
              style={{ background: 'rgba(153,153,255,0.15)', color: C.blue, border: `1px solid ${C.blue}44` }}>
              + LOG
            </button>
          )}
        </div>

        {/* Multi-color stripe separator */}
        <div className="flex h-1.5">
          {[C.orange, C.yellow, C.cyan, C.blue, C.mauve].map((col, i) => (
            <div key={i} className="flex-1" style={{ background: col }} />
          ))}
        </div>

        {/* Content */}
        <div className="p-4 uppercase">{renderContent()}</div>
      </div>

      {/* ══ DESKTOP LCARS LAYOUT ═══════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen">

        {/* LEFT BRACKET ── */}
        <div className="flex flex-col" style={{ width: '148px', minWidth: '148px' }}>

          {/* TOP ELBOW: orange block with bottom-right curve creating L-shape junction */}
          <div className="flex flex-col justify-end pb-3 items-center"
            style={{ background: C.orange, height: '160px', borderRadius: '0 0 3rem 0' }}>
            <div className="uppercase font-black text-[8px] tracking-widest text-center"
              style={{ color: C.black, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              STARFLEET HME
            </div>
          </div>

          {/* Black notch gap (signature LCARS detail) */}
          <div style={{ height: '10px', background: C.black }} />

          {/* NAV AREA on black bg */}
          <div className="flex flex-col px-2 py-3 gap-1.5" style={{ background: C.black }}>
            {/* Decorative colored row */}
            <div className="flex gap-0.5 mb-2">
              {[C.orange, C.mauve, C.blue, C.cyan].map((col, i) => (
                <div key={i} className="flex-1 rounded-full" style={{ background: col, height: '5px', opacity: 0.75 }} />
              ))}
            </div>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="w-full text-left uppercase font-black text-[10px] tracking-widest py-2 px-3 transition-all"
                style={{
                  background: activeTab === tab ? C.orange : 'rgba(255,153,0,0.1)',
                  color: activeTab === tab ? C.black : C.orange,
                  borderRadius: '20px',
                  border: `1px solid ${activeTab === tab ? C.orange : C.orange + '30'}`,
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Decorative color blocks */}
          <div className="flex flex-col gap-1 px-2 mt-4" style={{ background: C.black }}>
            {[C.orange, C.mauve, C.blue, C.cyan, C.yellow, C.mauve, C.orange].map((col, i) => (
              <div key={i} style={{ background: col, height: '15px', borderRadius: '10px', opacity: 0.55 + i * 0.05 }} />
            ))}
          </div>

          {isAdmin && (
            <div className="px-2 mt-3" style={{ background: C.black }}>
              <LBtn onClick={() => openForm(null)} color={C.blue} className="w-full text-center">+ LOG EP</LBtn>
            </div>
          )}

          <div className="flex-1" style={{ background: C.black }} />

          {/* Bottom decorative blocks */}
          <div className="flex flex-col gap-1 px-2 pb-2" style={{ background: C.black }}>
            {[C.blue, C.mauve, C.orange].map((col, i) => (
              <div key={i} style={{ background: col, height: '22px', borderRadius: '12px' }} />
            ))}
          </div>

          {/* Black notch gap */}
          <div style={{ height: '10px', background: C.black }} />

          {/* BOTTOM CAP: orange block with top-right curve */}
          <div style={{ background: C.orange, height: '70px', borderRadius: '0 3rem 0 0' }} />
        </div>

        {/* MAIN CONTENT AREA ── */}
        <div className="flex-1 flex flex-col" style={{ background: C.black }}>

          {/* TOP HEADER BAR — left-indented to create the LCARS notch effect */}
          <div style={{ paddingLeft: '18px' }}>
            <div className="flex items-center justify-between px-6"
              style={{ background: C.orange, height: '62px', borderRadius: '0 0 0 2rem' }}>
              <div>
                <div className="font-black tracking-widest uppercase" style={{ color: C.black, fontSize: '1.1rem' }}>EPISODE CALENDAR</div>
                <div className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.5)' }}>STARFLEET MEDIA DIVISION · MISSION LOG INTERFACE</div>
              </div>
              {isAdmin && (
                <span className="text-[9px] tracking-widest uppercase px-3 py-1 rounded-full font-black"
                  style={{ background: 'rgba(0,0,0,0.2)', color: C.black }}>◈ ADMIN ACCESS GRANTED</span>
              )}
            </div>
          </div>

          {/* Multi-color stripe */}
          <div className="flex h-1.5" style={{ marginLeft: '18px' }}>
            {[C.mauve, C.blue, C.cyan, C.yellow, C.mauve, C.blue].map((col, i) => (
              <div key={i} className="flex-1" style={{ background: col }} />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto uppercase">{renderContent()}</div>

          {/* Bottom stripe */}
          <div className="flex h-1.5" style={{ marginLeft: '18px' }}>
            {[C.blue, C.yellow, C.cyan, C.mauve, C.orange, C.mauve].map((col, i) => (
              <div key={i} className="flex-1" style={{ background: col }} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ DETAIL MODAL ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedEp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.88)' }}
            onClick={() => setSelectedEp(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden"
              style={{ background: C.black, border: `2px solid ${C.orange}`, borderRadius: '4px' }}>

              <div className="flex items-center justify-between px-4 py-3" style={{ background: C.orange }}>
                <div className="uppercase font-black text-xs tracking-widest" style={{ color: C.black, letterSpacing: '0.2em' }}>MISSION BRIEFING</div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button onClick={() => openForm(selectedEp)} className="p-1 hover:opacity-70" style={{ color: C.black }}><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(selectedEp.id)} className="p-1 hover:opacity-70" style={{ color: C.black }}><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                  <button onClick={() => setSelectedEp(null)} className="p-1 hover:opacity-70" style={{ color: C.black }}><X className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="p-5 space-y-4 uppercase">
                {selectedEp.image_url && <img src={selectedEp.image_url} alt="" className="w-full h-40 object-cover" style={{ borderRadius: '2px' }} />}
                <div>
                  <div className="font-black text-lg tracking-wide" style={{ color: C.cyan }}>{selectedEp.title}</div>
                  {selectedEp.recording_date && (
                    <div className="text-xs tracking-widest mt-1" style={{ color: C.mauve }}>
                      STARDATE {toStardate(selectedEp.recording_date)} · {format(parseISO(selectedEp.recording_date), 'MMMM d, yyyy').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedEp.recording_date && (
                    <div className="p-3" style={{ background: '#0d0d0d', borderLeft: `3px solid ${C.orange}` }}>
                      <div className="text-[9px] tracking-widest mb-1" style={{ color: C.orange }}>RECORDING</div>
                      <div className="text-sm font-black" style={{ color: C.orange }}>{format(parseISO(selectedEp.recording_date), 'MMM d, yyyy').toUpperCase()}</div>
                    </div>
                  )}
                  {selectedEp.submission_deadline && (
                    <div className="p-3" style={{ background: '#0d0d0d', borderLeft: `3px solid ${C.blue}` }}>
                      <div className="text-[9px] tracking-widest mb-1" style={{ color: C.blue }}>DEADLINE</div>
                      <div className="text-sm font-black" style={{ color: C.blue }}>{format(parseISO(selectedEp.submission_deadline), 'MMM d, yyyy').toUpperCase()}</div>
                    </div>
                  )}
                </div>
                {selectedEp.main_quest_topic && (
                  <div className="p-3" style={{ background: '#0d0d0d', borderLeft: `3px solid ${C.mauve}` }}>
                    <div className="text-[9px] tracking-widest mb-1" style={{ color: C.mauve }}>MAIN QUEST</div>
                    <div className="text-sm font-black" style={{ color: C.mauve }}>{selectedEp.main_quest_topic}</div>
                  </div>
                )}
                {selectedEp.segment && (
                  <div className="text-xs tracking-widest" style={{ color: C.cyan }}>◈ SEGMENT: {selectedEp.segment}</div>
                )}
                {selectedEp.description && (
                  <div className="text-sm leading-relaxed tracking-wide" style={{ color: '#888' }}>{selectedEp.description}</div>
                )}
                <span className="font-black text-[10px] px-4 py-1.5 tracking-widest"
                  style={{ background: (STATUS[selectedEp.status]?.color || C.blue) + '22', color: STATUS[selectedEp.status]?.color || C.blue, borderRadius: '20px' }}>
                  {STATUS[selectedEp.status]?.label || selectedEp.status}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ ADMIN FORM MODAL ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg overflow-y-auto max-h-[90vh]"
              style={{ background: C.black, border: `2px solid ${C.blue}`, borderRadius: '4px' }}>

              <div className="flex items-center justify-between px-4 py-3" style={{ background: C.blue }}>
                <div className="uppercase font-black text-xs tracking-widest" style={{ color: C.black, letterSpacing: '0.2em' }}>
                  {editingEp ? 'EDIT MISSION LOG' : 'LOG NEW MISSION'}
                </div>
                <button onClick={() => setShowForm(false)} style={{ color: C.black }}><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-4 uppercase">
                <LField label="Episode Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ep. 42 — The Hyper-fixation Rises" />
                <LField label="Recording Date *" value={form.recording_date} onChange={e => setForm(f => ({ ...f, recording_date: e.target.value }))} type="date" />
                <LField label="Submission Deadline" value={form.submission_deadline} onChange={e => setForm(f => ({ ...f, submission_deadline: e.target.value }))} type="date" />
                <LField label="Main Quest Topic" value={form.main_quest_topic} onChange={e => setForm(f => ({ ...f, main_quest_topic: e.target.value }))} placeholder="e.g. Star Trek: Deep Space Nine" />
                <LField label="Cover Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
                <LSelect label="Segment" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                  <option value="">— SELECT SEGMENT —</option>
                  {SEGMENTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </LSelect>
                <LSelect label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="upcoming">INCOMING</option>
                  <option value="recording">ACTIVE</option>
                  <option value="aired">LOGGED</option>
                </LSelect>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: C.mauve }}>Episode Notes</div>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Any extra notes..." rows={3}
                    className="w-full px-3 py-2 text-sm focus:outline-none resize-none uppercase tracking-wide"
                    style={{ background: '#1a1a2e', border: `1px solid ${C.blue}55`, borderLeft: `3px solid ${C.blue}`, color: C.cyan, borderRadius: '2px', colorScheme: 'dark' }}
                  />
                </div>
                <LBtn onClick={handleSave} disabled={saving || !form.title || !form.recording_date} color={C.orange} className="w-full text-center">
                  {saving ? 'TRANSMITTING...' : editingEp ? 'UPDATE LOG' : 'COMMIT TO DATABASE'}
                </LBtn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}