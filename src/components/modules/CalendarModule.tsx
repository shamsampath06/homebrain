import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { FamilyEvent, EventCategory } from '../../types';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, User, X, Check } from 'lucide-react';

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
          {upcoming.map(evt => (
            <div
              key={evt.id}
              onClick={() => navigateToSubScreen('event-details', evt.id)}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{evt.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {evt.date} • {evt.time}
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {evt.category}
              </span>
            </div>
          ))}
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
  const { events, navigateToSubScreen, setActiveSubScreen } = useHomeBrain();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const categories = ['All', 'Birthday', 'Appointment', 'Holiday', 'School', 'Bill', 'General'];

  const filteredEvents = events.filter(
    e => selectedCategory === 'All' || e.category === selectedCategory
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveSubScreen('none')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-1 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            📅 Family Calendar & Schedules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View birthdays, medical appointments, school tests, and family gatherings
          </p>
        </div>
        <button
          onClick={() => navigateToSubScreen('add-event')}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" /> Add Family Event
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event Grid & Details */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-700/80 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Events Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            There are no family events scheduled in this category. Keep your family synced by adding birthdays, appointments, and milestones.
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
        {filteredEvents.map(evt => (
          <div
            key={evt.id}
            onClick={() => navigateToSubScreen('event-details', evt.id)}
            className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                  {evt.category}
                </span>
                <span className="text-xs text-slate-400">{evt.recurring !== 'None' ? `🔄 ${evt.recurring}` : ''}</span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{evt.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{evt.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> {evt.date} at {evt.time}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> {evt.membersInvolved.length} Involved
              </span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export const AddEventModal: React.FC = () => {
  const { addEvent, updateEvent, deleteEvent, events, selectedItemId, activeSubScreen, setActiveSubScreen, familyMembers, currentUser } = useHomeBrain();
  const existing = events.find(event => event.id === selectedItemId);
  const editing = activeSubScreen === 'edit-event' && Boolean(existing);
  const [title, setTitle] = useState(existing?.title || '');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(existing?.time || '18:00');
  const [category, setCategory] = useState<EventCategory>(existing?.category || 'Appointment');
  const [description, setDescription] = useState(existing?.description || '');
  const [recurring, setRecurring] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>(existing?.recurring || 'None');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      date,
      time,
      category,
      description,
      membersInvolved: [currentUser.name, ...familyMembers.filter(member => member.name !== currentUser.name).map(member => member.name)],
      reminder: true,
      recurring
    };
    if (editing && existing) updateEvent(existing.id, payload);
    else addEvent(payload);

    setActiveSubScreen('calendar');
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? 'Edit Family Event' : 'Add New Family Event'}</h2>
        <button onClick={() => setActiveSubScreen('calendar')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Name</label>
          <input
            type="text"
            required
            placeholder="e.g., Doctor Checkup / Birthday Party"
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
              <option value="School">School 📚</option>
              <option value="Holiday">Holiday ✈️</option>
              <option value="Bill">Bill Payment ⚡</option>
              <option value="General">General 📌</option>
            </select>
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="Add any extra instructions, location or details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this event?')) {
                if (editing && existing) {
                  deleteEvent(existing.id);
                }
                setActiveSubScreen('calendar');
              }
            }}
            className="text-xs text-rose-600 hover:underline"
          >
            {editing ? 'Delete Event' : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubScreen('calendar')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md"
          >
            {editing ? 'Save Changes' : 'Save Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const EventDetailsModal: React.FC = () => {
  const { events, selectedItemId, deleteEvent, setActiveSubScreen } = useHomeBrain();
  const evt = events.find(e => e.id === selectedItemId);

  if (!evt) return null;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          {evt.category}
        </span>
        <button onClick={() => setActiveSubScreen('calendar')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{evt.title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-500" /> Date: {evt.date} at {evt.time}
        </p>

        {evt.description && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
            {evt.description}
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Family Members Involved:</p>
          <div className="flex flex-wrap gap-1.5">
            {evt.membersInvolved.map(name => (
              <span key={name} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => {
            if (window.confirm('Delete this event?')) {
              deleteEvent(evt.id);
              setActiveSubScreen('calendar');
            }
          }}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Delete Event
        </button>
        <button
          onClick={() => setActiveSubScreen('edit-event')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Edit Event
        </button>
      </div>
    </div>
  );
};
