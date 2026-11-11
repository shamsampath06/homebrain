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
  const { reminders, toggleReminder, deleteReminder, navigateToSubScreen, setActiveSubScreen } = useHomeBrain();
  const now = new Date();
  const sorted = [...reminders].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Family Reminders & Household Chores"
        subtitle="Shared reminders, medicine alerts, and scheduled duties assigned across family members"
        actions={
          <button
            onClick={() => navigateToSubScreen('add-reminder')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        }
      />
      {sorted.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No reminders recorded yet.</div> : (
        <div className="space-y-3">{sorted.map(reminder => {
          const overdue = !reminder.completed && new Date(reminder.dateTime) < now;
          return <div key={reminder.id} className="rounded-2xl border bg-white dark:bg-slate-800 p-4 flex items-center justify-between">
            <div>
              <p className={`font-semibold text-sm ${reminder.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{reminder.title}</p>
              <p className={`text-xs ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>{formatIndiaDateTime(reminder.dateTime)} · {reminder.assignedMemberName} · {reminder.priority}{overdue ? ' · Overdue' : ''}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => toggleReminder(reminder.id)} className="text-emerald-600 hover:underline">{reminder.completed ? 'Reopen' : 'Complete'}</button>
              <button onClick={() => navigateToSubScreen('edit-reminder', reminder.id)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => { if (window.confirm(`Delete ${reminder.title}?`)) deleteReminder(reminder.id); }} className="text-rose-600 hover:underline">Delete</button>
            </div>
          </div>;
        })}</div>
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
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !dateTime || !assignedMemberName) return;
    const value = { title: title.trim(), dateTime: new Date(`${dateTime}:00+05:30`).toISOString(), category, priority, assignedMemberName, completed: existing?.completed || false };
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
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setActiveSubScreen('reminders')} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
            <button className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md">{editing ? 'Save Changes' : 'Save Reminder'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
