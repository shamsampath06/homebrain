import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { ReminderItem } from '../../types';
import { formatIndiaDateTime } from '../../lib/display';
import { PageHeader } from '../layout/PageHeader';
import { Plus } from 'lucide-react';

const toLocalDateTimeInput = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};

export const RemindersScreen: React.FC = () => {
  const { reminders, toggleReminder, deleteReminder, navigateToSubScreen, setActiveSubScreen, currentUser } = useHomeBrain();
  const [spaceFilter, setSpaceFilter] = useState<'all' | 'shared' | 'personal'>('all');
  const now = new Date();

  const filteredReminders = reminders.filter(reminder => {
    const isMine = reminder.userId === currentUser.id || reminder.assignedMemberName === currentUser.name;
    if (spaceFilter === 'personal') {
      return reminder.isPersonal && (reminder.userId === currentUser.id || isMine);
    }
    if (spaceFilter === 'shared') {
      return !reminder.isPersonal;
    }
    // 'all': show all shared family reminders plus own personal reminders
    return !reminder.isPersonal || isMine;
  });

  const sorted = [...filteredReminders].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Family Tasks & Household Chores"
        subtitle="Manage shared family tasks and private personal to-do lists across devices"
        actions={
          <button
            onClick={() => navigateToSubScreen('add-reminder')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Task / Reminder
          </button>
        }
      />

      {/* Space Toggle: Family Shared vs Personal */}
      <div className="flex p-1 rounded-2xl bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setSpaceFilter('all')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
            spaceFilter === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setSpaceFilter('shared')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
            spaceFilter === 'shared'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          👨‍👩‍👧‍👦 Shared Family
        </button>
        <button
          onClick={() => setSpaceFilter('personal')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
            spaceFilter === 'personal'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          🔒 Private to Me
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
          No reminders recorded in this space yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(reminder => {
            const overdue = !reminder.completed && new Date(reminder.dateTime) < now;
            return (
              <div
                key={reminder.id}
                className="rounded-2xl border bg-white dark:bg-slate-800 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-semibold text-sm ${
                        reminder.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {reminder.title}
                    </p>
                    {reminder.isPersonal ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        🔒 Private
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        👨‍👩‍👧‍👦 Family
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${overdue ? 'text-rose-600' : 'text-slate-500'} mt-1`}>
                    {formatIndiaDateTime(reminder.dateTime)} · Assigned: {reminder.assignedMemberName} · Priority: {reminder.priority}
                    {overdue ? ' · Overdue' : ''}
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => toggleReminder(reminder.id)} className="text-emerald-600 hover:underline">
                    {reminder.completed ? 'Reopen' : 'Complete'}
                  </button>
                  <button onClick={() => navigateToSubScreen('edit-reminder', reminder.id)} className="text-brand-600 hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${reminder.title}?`)) deleteReminder(reminder.id);
                    }}
                    className="text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ReminderForm: React.FC = () => {
  const { reminders, addReminder, updateReminder, familyMembers, currentUser, selectedItemId, activeSubScreen, setActiveSubScreen } = useHomeBrain();
  const existing = reminders.find(reminder => reminder.id === selectedItemId);
  const editing = activeSubScreen === 'edit-reminder' && Boolean(existing);
  const assignees = [{ id: currentUser.id, name: currentUser.name }, ...familyMembers.filter(member => member.name !== currentUser.name)];
  const [title, setTitle] = useState(existing?.title || '');
  const [dateTime, setDateTime] = useState(existing?.dateTime ? toLocalDateTimeInput(existing.dateTime) : '');
  const [category, setCategory] = useState<ReminderItem['category']>(existing?.category || 'General');
  const [priority, setPriority] = useState<ReminderItem['priority']>(existing?.priority || 'Medium');
  const [assignedMemberName, setAssignedMemberName] = useState(existing?.assignedMemberName || currentUser.name);
  const [isPersonal, setIsPersonal] = useState(existing?.isPersonal || false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !dateTime || !assignedMemberName) return;
    const value = {
      title: title.trim(),
      dateTime: new Date(`${dateTime}:00+05:30`).toISOString(),
      category,
      priority,
      assignedMemberName,
      completed: existing?.completed || false,
      isPersonal,
      userId: currentUser.id,
      createdByName: currentUser.name
    };
    if (editing && existing) updateReminder(existing.id, value); else addReminder(value);
    setActiveSubScreen('reminders');
  };
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title={editing ? 'Edit Household Reminder' : 'Add Household Reminder'}
        subtitle="Assign tasks, alerts, or chores to family members with priority levels"
        showBack={true}
      />
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={submit} className="space-y-3">
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title" className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <select value={category} onChange={e => setCategory(e.target.value as ReminderItem['category'])} className="w-full rounded-xl border px-3 py-2 text-sm">
            {['Birthday', 'Medicine', 'Appointment', 'Bill', 'Grocery', 'General'].map(value => <option key={value}>{value}</option>)}
          </select>
          <select value={assignedMemberName} onChange={e => setAssignedMemberName(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
            {assignees.map(member => <option key={member.id} value={member.name}>{member.name}{member.id === currentUser.id ? ' (Me)' : ''}</option>)}
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value as ReminderItem['priority'])} className="w-full rounded-xl border px-3 py-2 text-sm">
            {['High', 'Medium', 'Low'].map(value => <option key={value}>{value}</option>)}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isPersonal}
              onChange={e => setIsPersonal(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>🔒 Keep Private (Personal task - only visible in my account)</span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setActiveSubScreen('reminders')} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-md">{editing ? 'Save Changes' : 'Create Reminder'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
