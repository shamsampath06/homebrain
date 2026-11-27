import React, { useState, useMemo } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { FamilyEvent, EventCategory, EventPriority } from '../../types';
import { PageHeader } from '../layout/PageHeader';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  Trash2,
  Edit3,
  Users,
  CheckCircle2,
  XCircle,
  Info,
  MapPin,
  History
} from 'lucide-react';

// Color palette mapping per member identifier
export function getMemberColorClass(name: string): { bg: string; text: string; border: string } {
  const n = (name || '').toLowerCase();
  if (n.includes('father') || n.includes('dad') || n.includes('sham')) {
    return { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
  }
  if (n.includes('son') || n.includes('sha')) {
    return { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' };
  }
  if (n.includes('sister') || n.includes('sneha')) {
    return { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
  }
  if (n.includes('mother') || n.includes('mom') || n.includes('priya')) {
    return { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' };
  }
  return { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' };
}

export function getPriorityBadge(priority?: EventPriority) {
  switch (priority) {
    case 'Urgent':
      return { label: 'Urgent', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700', icon: '🚨' };
    case 'High':
      return { label: 'High', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700', icon: '⚡' };
    case 'Low':
      return { label: 'Low', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700', icon: '☕' };
    case 'Medium':
    default:
      return { label: 'Medium', badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-700', icon: '📌' };
  }
}

export const CalendarCard: React.FC = () => {
  const { events, navigateToSubScreen } = useHomeBrain();
  const upcoming = events.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Calendar & Events</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{events.length} Scheduled Events</p>
            </div>
          </div>
          <button
            onClick={() => navigateToSubScreen('calendar')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="space-y-2 mt-4">
          {upcoming.map(evt => {
            const pBadge = getPriorityBadge(evt.priority);
            return (
              <div
                key={evt.id}
                onClick={() => navigateToSubScreen('event-details', evt.id)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{evt.title}</p>
                    {evt.priority && evt.priority !== 'Medium' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                        {pBadge.icon} {evt.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {evt.date} • {evt.time}
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {evt.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => navigateToSubScreen('add-event')}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add New Event
      </button>
    </div>
  );
};

export const CalendarScreen: React.FC = () => {
  const { events, familyMembers, navigateToSubScreen, currentUser } = useHomeBrain();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMember, setSelectedMember] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [spaceFilter, setSpaceFilter] = useState<'all' | 'shared' | 'personal'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);
  const [showSmartScheduleModal, setShowSmartScheduleModal] = useState<boolean>(false);

  const categories = ['All', 'Birthday', 'Appointment', 'Holiday', 'School', 'Bill', 'General'];
  const priorities = ['All', 'Urgent', 'High', 'Medium', 'Low'];

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const matchesPriority = selectedPriority === 'All' || (e.priority || 'Medium') === selectedPriority;
      const matchesMember =
        selectedMember === 'All' ||
        (Array.isArray(e.membersInvolved) &&
          e.membersInvolved.some(m => m.toLowerCase().includes(selectedMember.toLowerCase()) || m === 'Family'));

      const matchesSpace =
        spaceFilter === 'all'
          ? true
          : spaceFilter === 'personal'
          ? e.isPersonal === true || e.userId === currentUser.id
          : !e.isPersonal;

      if (!matchesSpace || !matchesCategory || !matchesMember || !matchesPriority) return false;

      const todayStr = new Date().toISOString().split('T')[0];
      if (viewMode === 'day') {
        return e.date === todayStr;
      }
      if (viewMode === 'week') {
        const now = new Date();
        const eventDate = new Date(`${e.date}T00:00:00`);
        const diffDays = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= -1 && diffDays <= 7;
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [events, selectedCategory, selectedMember, selectedPriority, spaceFilter, viewMode, currentUser.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Family Calendar & Schedules"
        subtitle="Intelligent shared family scheduling with live synchronization and AI coordination"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowBriefingModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Clock className="w-4 h-4 text-indigo-500" /> Daily & Weekly Briefing
            </button>
            <button
              onClick={() => setShowSmartScheduleModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-500" /> Smart Free Time
            </button>
            <button
              onClick={() => navigateToSubScreen('add-event')}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        }
      />

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Day / Week / Month View Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          {(['month', 'week', 'day'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                viewMode === mode
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {mode} View
            </button>
          ))}
        </div>

        {/* Space Filter: All | Shared Family | Personal Schedule */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSpaceFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              spaceFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setSpaceFilter('shared')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              spaceFilter === 'shared'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            👨‍👩‍👧‍👦 Family
          </button>
          <button
            onClick={() => setSpaceFilter('personal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              spaceFilter === 'personal'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            🔒 Personal
          </button>
        </div>

        {/* Member and Priority Filter Dropdowns */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Members</option>
            {familyMembers.map(m => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            {priorities.map(p => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-700/80 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Events Scheduled</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            There are no calendar events matching your selected filter. Keep your family synced by adding birthdays, appointments, and milestones.
          </p>
          <button
            onClick={() => navigateToSubScreen('add-event')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map(evt => {
            const pBadge = getPriorityBadge(evt.priority);
            return (
              <div
                key={evt.id}
                onClick={() => navigateToSubScreen('event-details', evt.id)}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                        {evt.category}
                      </span>
                      {evt.priority && evt.priority !== 'Medium' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pBadge.badgeClass}`}>
                          {pBadge.icon} {pBadge.label}
                        </span>
                      )}
                      {evt.isPersonal ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          🔒 Private
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                          👨‍👩‍👧‍👦 Family
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{evt.recurring && evt.recurring !== 'None' ? `🔄 ${evt.recurring}` : ''}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{evt.title}</h3>
                  {evt.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{evt.description}</p>
                  )}

                  {/* Assigned Members Chips */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(evt.membersInvolved || ['Family']).map(name => {
                      const c = getMemberColorClass(name);
                      return (
                        <span
                          key={name}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${c.bg} ${c.text} ${c.border}`}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> {evt.date} • {evt.time}
                  </span>
                  {evt.createdByName && (
                    <span className="text-[11px] text-slate-400">
                      by {evt.createdByName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily & Weekly Briefing Modal */}
      {showBriefingModal && (
        <DailyWeeklyBriefingModal
          events={events}
          currentUser={currentUser}
          onClose={() => setShowBriefingModal(false)}
        />
      )}

      {/* Smart Availability Finder Modal */}
      {showSmartScheduleModal && (
        <SmartScheduleModal
          events={events}
          familyMembers={familyMembers}
          onSelectSlot={(date, time) => {
            setShowSmartScheduleModal(false);
            navigateToSubScreen('add-event');
          }}
          onClose={() => setShowSmartScheduleModal(false)}
        />
      )}
    </div>
  );
};

export const AddEventModal: React.FC = () => {
  const { addEvent, updateEvent, events, selectedItemId, activeSubScreen, setActiveSubScreen, familyMembers, currentUser } = useHomeBrain();
  const existing = events.find(event => event.id === selectedItemId);
  const editing = activeSubScreen === 'edit-event' && Boolean(existing);

  const [title, setTitle] = useState(existing?.title || '');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(existing?.time || '18:00');
  const [category, setCategory] = useState<EventCategory>(existing?.category || 'Appointment');
  const [priority, setPriority] = useState<EventPriority>(existing?.priority || 'Medium');
  const [description, setDescription] = useState(existing?.description || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [recurring, setRecurring] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>(existing?.recurring || 'None');
  const [isPersonal, setIsPersonal] = useState(existing?.isPersonal || false);

  // Multi-member selection
  const allMemberNames = familyMembers.map(m => m.name);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    existing?.membersInvolved && existing.membersInvolved.length > 0
      ? existing.membersInvolved
      : ['Family', currentUser.name]
  );

  const toggleMember = (mName: string) => {
    setSelectedMembers(prev =>
      prev.includes(mName) ? prev.filter(x => x !== mName) : [...prev, mName]
    );
  };

  // Schedule conflict detection
  const conflictEvent = useMemo(() => {
    return events.find(e => {
      if (editing && existing && e.id === existing.id) return false;
      if (e.date !== date || e.time !== time) return false;
      const mems = e.membersInvolved || ['Family'];
      return mems.some(m => selectedMembers.includes(m) || m === 'Family' || selectedMembers.includes('Family'));
    });
  }, [events, date, time, selectedMembers, editing, existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalMembers = isPersonal
      ? [currentUser.name]
      : selectedMembers.length > 0
      ? selectedMembers
      : [currentUser.name, 'Family'];

    const nowIso = new Date().toISOString();
    const rsvps: Record<string, 'pending' | 'accepted' | 'declined'> = existing?.rsvps || {};
    finalMembers.forEach(m => {
      if (!rsvps[m]) {
        rsvps[m] = m.toLowerCase() === currentUser.name.toLowerCase() ? 'accepted' : 'pending';
      }
    });

    const payload: Partial<FamilyEvent> = {
      title,
      date,
      time,
      category,
      priority,
      description,
      location,
      membersInvolved: finalMembers,
      reminder: true,
      recurring,
      isPersonal,
      userId: currentUser.id,
      createdByName: existing?.createdByName || currentUser.name,
      createdByRole: existing?.createdByRole || currentUser.role,
      createdAt: existing?.createdAt || nowIso,
      rsvps,
      lastModifiedByName: editing ? currentUser.name : undefined,
      lastModifiedByRole: editing ? currentUser.role : undefined,
      lastModifiedAt: editing ? nowIso : undefined,
      history: [
        ...(existing?.history || []),
        {
          action: editing ? 'updated' : 'created',
          byName: currentUser.name,
          byRole: currentUser.role,
          timestamp: nowIso,
          details: editing ? `Updated event details` : `Created event "${title}"`
        }
      ]
    };

    if (editing && existing) updateEvent(existing.id, payload);
    else addEvent(payload as any);

    setActiveSubScreen('calendar');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title={editing ? 'Edit Family Event' : 'Add New Family Event'}
        subtitle="Schedule family appointments, birthdays, and milestones with real-time multi-account synchronization"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Doctor Cardiology Checkup / Family Dinner"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Schedule Conflict Warning Banner */}
          {conflictEvent && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-200 block">
                  Schedule Conflict Detected!
                </span>
                <span className="text-amber-700 dark:text-amber-300">
                  An event <strong>"{conflictEvent.title}"</strong> is already scheduled on {date} at {time}. You can proceed, or pick an alternate time.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as EventCategory)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
              >
                <option value="Birthday">Birthday 🎂</option>
                <option value="Appointment">Appointment 🩺</option>
                <option value="School">School / Exam 📚</option>
                <option value="Holiday">Holiday ✈️</option>
                <option value="Bill">Bill Payment ⚡</option>
                <option value="General">General 📌</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as EventPriority)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-semibold"
              >
                <option value="Urgent">🚨 Urgent</option>
                <option value="High">⚡ High</option>
                <option value="Medium">📌 Medium</option>
                <option value="Low">☕ Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g., Apollo Hospital / Home"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recurrence</label>
              <select
                value={recurring}
                onChange={e => setRecurring(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
              >
                <option value="None">Does not repeat</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Assigned Members Selection */}
          {!isPersonal && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assign to Family Members
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleMember('Family')}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    selectedMembers.includes('Family')
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  👨‍👩‍👧‍👦 All Family
                </button>
                {allMemberNames.map(name => {
                  const isSelected = selectedMembers.includes(name);
                  const c = getMemberColorClass(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleMember(name)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        isSelected
                          ? `${c.bg} ${c.text} ${c.border} font-bold shadow-xs`
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Add instructions, items to bring, or notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>

          {/* Personal vs Shared Event Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPersonal}
                onChange={e => setIsPersonal(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Private Personal Event (Only Visible to Me)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  When checked, this event will never be shown to other family members or the shared AI assistant.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveSubScreen('calendar')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md"
            >
              {editing ? 'Save Changes' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EventDetailsModal: React.FC = () => {
  const { events, selectedItemId, deleteEvent, updateEvent, setActiveSubScreen, currentUser } = useHomeBrain();
  const evt = events.find(e => e.id === selectedItemId);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  if (!evt) return null;

  const pBadge = getPriorityBadge(evt.priority);
  const isOwner = evt.userId === currentUser.id || evt.createdByName === currentUser.name;
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Parent' || currentUser.role === 'Co-Admin';
  const canDelete = isOwner || (isAdmin && !evt.isPersonal);

  const handleRSVP = (status: 'accepted' | 'declined') => {
    const nowIso = new Date().toISOString();
    const updatedRsvps = { ...(evt.rsvps || {}), [currentUser.name]: status };
    const updatedHistory = [
      ...(evt.history || []),
      {
        action: 'rsvp_updated' as any,
        byName: currentUser.name,
        byRole: currentUser.role,
        timestamp: nowIso,
        details: `RSVP marked as ${status}`
      }
    ];

    updateEvent(evt.id, {
      rsvps: updatedRsvps,
      history: updatedHistory,
      lastModifiedByName: currentUser.name,
      lastModifiedByRole: currentUser.role,
      lastModifiedAt: nowIso
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title={evt.title}
        subtitle={`${evt.category} • ${evt.date} at ${evt.time}`}
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {evt.category}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pBadge.badgeClass}`}>
              {pBadge.icon} {pBadge.label}
            </span>
            {evt.isPersonal && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                🔒 Private
              </span>
            )}
          </div>
          <button onClick={() => setActiveSubScreen('calendar')} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{evt.title}</h2>
          <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <strong>Date & Time:</strong> {evt.date} at {evt.time}
            </p>
            {evt.location && (
              <p className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                <strong>Location:</strong> {evt.location}
              </p>
            )}
          </div>
        </div>

        {evt.description && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
            {evt.description}
          </div>
        )}

        {/* Assigned Members & RSVP Status */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" /> Family Invitations & RSVPs
            </p>
            {/* Action buttons for current user */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleRSVP('accepted')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3 h-3" /> Accept
              </button>
              <button
                onClick={() => handleRSVP('declined')}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
              >
                <X className="w-3 h-3" /> Decline
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(evt.membersInvolved || ['Family']).map(name => {
              const status = evt.rsvps?.[name] || 'pending';
              const c = getMemberColorClass(name);
              return (
                <div
                  key={name}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs ${c.bg} ${c.border}`}
                >
                  <span className={`font-semibold ${c.text}`}>{name}</span>
                  {status === 'accepted' ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Accepted
                    </span>
                  ) : status === 'declined' ? (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <XCircle className="w-3 h-3" /> Declined
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Change History & Audit Log */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-400" /> Event Activity & History
          </p>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              • <strong>Created By:</strong> {evt.createdByName || 'Family Member'} ({evt.createdByRole || 'Member'})
              {evt.createdAt ? ` on ${evt.createdAt.split('T')[0]}` : ''}
            </p>
            {evt.lastModifiedByName && (
              <p>
                • <strong>Last Modified By:</strong> {evt.lastModifiedByName} ({evt.lastModifiedByRole || 'Member'})
                {evt.lastModifiedAt ? ` on ${evt.lastModifiedAt.split('T')[0]}` : ''}
              </p>
            )}
          </div>

          {Array.isArray(evt.history) && evt.history.length > 0 && (
            <div className="mt-2 space-y-1 max-h-24 overflow-y-auto pr-1">
              {evt.history.map((h, idx) => (
                <div key={idx} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">[{h.action.toUpperCase()}]</span> {h.details} by {h.byName} ({h.byRole})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          {canDelete ? (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Event
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Only creator or Admin can delete
            </span>
          )}

          <button
            onClick={() => setActiveSubScreen('edit-event')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Event
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Calendar Event?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to permanently delete <strong>"{evt.title}"</strong> scheduled on {evt.date}? This action will synchronize across all family accounts.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="w-1/2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Keep Event
              </button>
              <button
                onClick={() => {
                  deleteEvent(evt.id);
                  setShowConfirmDelete(false);
                  setActiveSubScreen('calendar');
                }}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Daily and Weekly Briefing Modal
const DailyWeeklyBriefingModal: React.FC<{
  events: FamilyEvent[];
  currentUser: any;
  onClose: () => void;
}> = ({ events, currentUser, onClose }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === todayStr);

  const next7DaysEvents = events.filter(e => {
    const diff = (new Date(`${e.date}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              📋 Family Schedule Briefing
            </h3>
            <p className="text-xs text-slate-500">Real-time schedule overview across all members</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Today's Schedule */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Today's Schedule ({todayStr})
          </h4>
          {todayEvents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No events scheduled for today.</p>
          ) : (
            <div className="space-y-1.5">
              {todayEvents.map(e => (
                <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{e.title}</span>
                    <span className="text-[11px] text-slate-500 block">
                      {e.time} • {(e.membersInvolved || []).join(', ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {e.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next 7 Days */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Upcoming This Week ({next7DaysEvents.length} events)
          </h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {next7DaysEvents.map(e => (
              <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{e.title}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {e.date} at {e.time} • Assigned: {(e.membersInvolved || []).join(', ')}
                  </span>
                </div>
                {e.priority && e.priority !== 'Medium' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {e.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
        >
          Close Briefing
        </button>
      </div>
    </div>
  );
};

// Smart Schedule Availability Finder Modal
const SmartScheduleModal: React.FC<{
  events: FamilyEvent[];
  familyMembers: any[];
  onSelectSlot: (date: string, time: string) => void;
  onClose: () => void;
}> = ({ events, familyMembers, onSelectSlot, onClose }) => {
  const candidateTimes = ['10:00', '14:00', '16:30', '19:00', '20:30'];

  const freeSlots = useMemo(() => {
    const slots: Array<{ date: string; time: string; label: string }> = [];
    const now = new Date();
    for (let i = 1; i <= 4; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const evOnDate = events.filter(e => e.date === dStr);

      for (const t of candidateTimes) {
        const hasConflict = evOnDate.some(e => e.time === t);
        if (!hasConflict) {
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          slots.push({ date: dStr, time: t, label: `${dayName} at ${t}` });
          if (slots.length >= 6) break;
        }
      }
      if (slots.length >= 6) break;
    }
    return slots;
  }, [events]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Conflict-Free Open Slots
            </h3>
            <p className="text-xs text-slate-500">Smart analysis based on all family members' commitments</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {freeSlots.map((slot, idx) => (
            <div
              key={idx}
              onClick={() => onSelectSlot(slot.date, slot.time)}
              className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800 transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{slot.label}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ All members free • 0 conflicts
                </span>
              </div>
              <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Schedule →
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
