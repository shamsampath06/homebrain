import React from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { Activity, Clock, ShoppingCart, Pill, FileText, Calendar } from 'lucide-react';

const formatActivityTime = (timestamp?: string): string => {
  if (!timestamp) return 'Recent';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    const isToday = new Date().toDateString() === d.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return timestamp;
  }
};

export const HouseholdActivityFeed: React.FC = () => {
  const { groceries, groceryHistory, medicineLogs, medicines, expenses, reminders, knowledgeList, documents, events } = useHomeBrain();

  // Combine activities into a unified chronological feed, prioritizing user-created (non-DEMO) records
  const activities: Array<{
    id: string;
    type: 'grocery' | 'medicine' | 'document' | 'event';
    title: string;
    subtitle: string;
    time: string;
    icon: React.FC<{ className?: string }>;
    colorBadge: string;
    isUserCreated?: boolean;
  }> = [];

  // Recent medicine doses
  (medicineLogs || []).slice(0, 3).forEach(log => {
    if (!log) return;
    activities.push({
      id: `medlog-${log.id}`,
      type: 'medicine',
      title: `${log.personName || 'Family'} logged ${log.medicineName || 'medicine'}`,
      subtitle: `Status: ${log.status || 'Taken'} • Logged by ${log.loggedBy || log.personName || 'Family'}`,
      time: formatActivityTime(log.timestamp),
      icon: Pill,
      colorBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      isUserCreated: true
    });
  });

  // User-added medicines
  (medicines || []).filter(m => m?.name && !String(m.name).startsWith('[DEMO]')).slice(0, 2).forEach(med => {
    activities.push({
      id: `med-${med.id}`,
      type: 'medicine',
      title: `Scheduled ${med.name} (${med.dosage || 'Regular'})`,
      subtitle: `For ${med.personName || 'Family'} at ${med.timing || 'Scheduled'} • ${med.frequency || 'Daily'}`,
      time: 'Just now',
      icon: Pill,
      colorBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      isUserCreated: true
    });
  });

  // User-added groceries
  (groceries || []).filter(g => g?.name && !String(g.name).startsWith('[DEMO]')).slice(0, 3).forEach(g => {
    activities.push({
      id: `groc-item-${g.id}`,
      type: 'grocery',
      title: g.isPurchased ? `Purchased ${g.name}` : `Added ${g.name} (${g.quantity || '1 unit'}) to Grocery List`,
      subtitle: `${g.category || 'Pantry'} • ${g.isPurchased ? `Bought by ${g.purchasedBy || 'Family'}` : 'Pending purchase'}`,
      time: g.purchasedAt ? formatActivityTime(g.purchasedAt) : 'Recent',
      icon: ShoppingCart,
      colorBadge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
      isUserCreated: true
    });
  });

  // User-added expenses
  (expenses || []).filter(x => x?.title && !String(x.title).startsWith('[DEMO]')).slice(0, 2).forEach(x => {
    activities.push({
      id: `exp-${x.id}`,
      type: 'document',
      title: `Logged ₹${(Number(x.amount) || 0).toLocaleString('en-IN')} for ${x.title}`,
      subtitle: `${x.category || 'Expense'} • Paid by ${x.payer || 'Family'}`,
      time: formatActivityTime(x.date),
      icon: FileText,
      colorBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      isUserCreated: true
    });
  });

  // User-added reminders & notes
  (reminders || []).filter(r => r?.title && !String(r.title).startsWith('[DEMO]')).slice(0, 2).forEach(r => {
    activities.push({
      id: `rem-${r.id}`,
      type: 'event',
      title: `Reminder: ${r.title}`,
      subtitle: `${r.priority || 'Normal'} Priority • Assigned to ${r.assignedMemberName || 'Family'}`,
      time: formatActivityTime(r.dateTime),
      icon: Calendar,
      colorBadge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
      isUserCreated: true
    });
  });

  (knowledgeList || []).filter(k => k?.title && !String(k.title).startsWith('[DEMO]')).slice(0, 2).forEach(k => {
    activities.push({
      id: `know-${k.id}`,
      type: 'document',
      title: `Saved Note: ${k.title}`,
      subtitle: `${k.category || 'General'} • ${k.content || ''}`,
      time: 'Recent',
      icon: FileText,
      colorBadge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
      isUserCreated: true
    });
  });

  // Recent grocery purchases
  (groceryHistory || []).slice(0, 3).forEach(g => {
    if (!g) return;
    activities.push({
      id: `groc-${g.id}`,
      type: 'grocery',
      title: `Purchased ${g.name || 'item'}`,
      subtitle: `${g.category || 'Pantry'} • Restocked by ${g.purchasedBy || 'Family'}`,
      time: formatActivityTime(g.purchasedAt),
      icon: ShoppingCart,
      colorBadge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
    });
  });

  // Recent documents
  (documents || []).slice(0, 2).forEach(d => {
    if (!d) return;
    activities.push({
      id: `doc-${d.id}`,
      type: 'document',
      title: `Indexed ${d.title || 'Document'}`,
      subtitle: `${d.category || 'General'} • Uploaded by ${d.uploaderName || 'Family'}`,
      time: formatActivityTime(d.uploadDate),
      icon: FileText,
      colorBadge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
    });
  });

  // Upcoming events
  (events || []).slice(0, 2).forEach(e => {
    if (!e) return;
    activities.push({
      id: `evt-${e.id}`,
      type: 'event',
      title: e.title || 'Event',
      subtitle: `${e.category || 'General'} • ${e.time || 'All day'}`,
      time: formatActivityTime(e.date),
      icon: Calendar,
      colorBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      isUserCreated: !String(e.title || '').startsWith('[DEMO]')
    });
  });

  activities.sort((a, b) => (b.isUserCreated ? 1 : 0) - (a.isUserCreated ? 1 : 0));

  return (
    <div className="spatial-card p-5 sm:p-6 bg-white dark:bg-[#0D1322] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Household Activity Feed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recent logs, medication adherence, and pantry updates</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700/60">
          Live Event Log
        </span>
      </div>

      <div className="space-y-2.5">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No recent household activities logged.</p>
        ) : (
          activities.slice(0, 5).map(act => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#141C2E] hover:bg-slate-100 dark:hover:bg-[#1A253E] transition-all border border-slate-200/60 dark:border-slate-800 hover:border-brand-500/40 dark:hover:border-cyan-400/40"
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${act.colorBadge}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {act.title}
                    </p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5 text-slate-400" /> {act.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 truncate mt-0.5">
                    {act.subtitle}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HouseholdActivityFeed;
