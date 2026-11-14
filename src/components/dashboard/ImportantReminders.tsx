import React from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const formatReminderDateTime = (raw: string): string => {
  if (!raw) return 'Upcoming';
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const monthDay = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${monthDay} • ${timeStr}`;
    }
  } catch {
    // fallback
  }
  return raw.replace('T', ' ').slice(0, 16);
};

export const ImportantReminders: React.FC = () => {
  const { reminders, toggleReminder, navigateToSubScreen } = useHomeBrain();

  const activeReminders = reminders.slice(0, 5);

  return (
    <section className="spatial-card p-5 sm:p-6 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden">
      {/* Specular Ambient Glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none rounded-t-3xl" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-amber-500">⚡</span> Critical Family Queue & Reminders
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immediate reminders, clinical dosages, appointments, and bills requiring attention
          </p>
        </div>
        <button
          onClick={() => navigateToSubScreen('reminders')}
          className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
        >
          {reminders.filter(r => !r.completed).length} Pending
        </button>
      </div>

      <div className="space-y-2.5">
        {activeReminders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 font-mono">All set! No pending reminders today.</p>
        ) : (
          activeReminders.map(rem => {
            return (
              <div
                key={rem.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  rem.completed
                    ? 'bg-slate-50/50 dark:bg-[#101627]/40 border-slate-200/50 dark:border-white/5 opacity-50'
                    : 'bg-slate-50 dark:bg-[#141C2E] border-slate-200/80 dark:border-slate-800 hover:border-brand-500/40 dark:hover:border-cyan-400/40 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleReminder(rem.id)}
                    className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                    title={rem.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {rem.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-bold truncate ${
                        rem.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {rem.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-cyan-500 dark:text-cyan-400" /> {formatReminderDateTime(rem.dateTime)}
                      </span>
                      <span className="text-[11px] font-bold text-brand-600 dark:text-cyan-400">
                        • {rem.assignedMemberName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  {rem.priority === 'High' && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                      High Priority
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                    {rem.category}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ImportantReminders;
