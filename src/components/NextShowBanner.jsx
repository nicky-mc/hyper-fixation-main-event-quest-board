import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO, differenceInDays, isFuture } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NextShowBanner() {
  const [next, setNext] = useState(null);

  useEffect(() => {
    load();
    const unsub = base44.entities.EpisodeCalendar.subscribe(() => load());
    return unsub;
  }, []);

  const load = async () => {
    const all = await base44.entities.EpisodeCalendar.list('recording_date', 50);
    const future = all.filter(ep =>
      ep.recording_date && ep.status !== 'aired' && isFuture(parseISO(ep.recording_date))
    ).sort((a, b) => a.recording_date.localeCompare(b.recording_date));
    setNext(future[0] || null);
  };

  if (!next) return null;

  const daysAway = differenceInDays(parseISO(next.recording_date), new Date());
  const daysLabel = daysAway === 0 ? 'TODAY!' : daysAway === 1 ? 'Tomorrow!' : `in ${daysAway} days`;
  const showDeadline = next.submission_deadline && isFuture(parseISO(next.submission_deadline));
  const deadlineDays = showDeadline ? differenceInDays(parseISO(next.submission_deadline), new Date()) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(8,6,24,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(251,191,36,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(251,191,36,0.06)',
      }}
    >
      {/* Gold top bar */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }} />

      <div className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <CalendarDays className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-amber-400/60 uppercase tracking-widest font-bold mb-0.5"
              style={{ fontFamily: "'Orbitron', sans-serif" }}>Next Recording</p>
            <p className="text-sm font-black text-white truncate" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {next.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-amber-300" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {format(parseISO(next.recording_date), 'MMM d, yyyy')}
            </p>
            <p className="text-[10px] font-black"
              style={{ color: daysAway <= 3 ? '#ef4444' : '#fbbf24', fontFamily: "'Exo 2', sans-serif" }}>
              🎙 {daysLabel}
            </p>
          </div>

          {showDeadline && (
            <div className="text-right">
              <p className="text-[9px] text-red-400/60 uppercase tracking-wider" style={{ fontFamily: "'Exo 2', sans-serif" }}>Quest Deadline</p>
              <p className="text-xs font-bold text-red-300 flex items-center gap-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                <Clock className="w-3 h-3" />
                {deadlineDays === 0 ? 'Today!' : deadlineDays === 1 ? 'Tomorrow!' : `${deadlineDays}d left`}
              </p>
            </div>
          )}

          {next.main_quest_topic && (
            <div className="hidden sm:block">
              <p className="text-[9px] text-purple-400/60 uppercase tracking-wider" style={{ fontFamily: "'Exo 2', sans-serif" }}>Main Quest</p>
              <p className="text-xs font-bold text-purple-300 max-w-[140px] truncate" style={{ fontFamily: "'Exo 2', sans-serif" }}>⚔️ {next.main_quest_topic}</p>
            </div>
          )}

          <Link to={createPageUrl('EpisodeCalendar')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 hover:opacity-80 shrink-0"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontFamily: "'Exo 2', sans-serif" }}>
            Calendar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}