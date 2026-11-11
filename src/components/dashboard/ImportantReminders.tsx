import React from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';

export const ImportantReminders: React.FC = () => {
  const { reminders, toggleReminder, navigateToSubScreen } = useHomeBrain();

  const activeReminders = reminders.slice(0, 5);

  return (
    <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-700/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>⚡</span> Important Today
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immediate reminders, medicines, appointments, and bills requiring attention
          </p>
        </div>
        <button onClick={() => navigateToSubScreen('reminders')} className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {reminders.filter(r => !r.completed).length} Pending
        </button>
      </div>

      <div className="space-y-2.5">
        {activeReminders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">All set! No pending reminders today.</p>
        ) : (
          activeReminders.map(rem => {
            const isMedicine = rem.category === 'Medicine';
            const isBill = rem.category === 'Bill';
            const isBirthday = rem.category === 'Birthday';

            return (
              <div
                key={rem.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  rem.completed
                    ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 opacity-60'
                    : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200/80 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleReminder(rem.id)}
                    className="text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {rem.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        rem.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {rem.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {rem.dateTime}
                      </span>
                      <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                        • {rem.assignedMemberName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rem.priority === 'High' && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      High Priority
                    </span>
                  )}
                  {isMedicine && (
                    <button
                      onClick={() => navigateToSubScreen('medicine')}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Medicine Manager →
                    </button>
                  )}
                  {isBill && (
                    <button
                      onClick={() => navigateToSubScreen('bill-management')}
                      className="text-xs font-semibold text-amber-600 hover:underline"
                    >
                      Pay Bill →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
