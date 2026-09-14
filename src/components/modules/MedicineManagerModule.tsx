import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { MedicineItem } from '../../types';
import { Pill, Plus, CheckCircle, Clock, AlertTriangle, ShieldCheck, History, X, User } from 'lucide-react';

export const MedicineCard: React.FC = () => {
  const { medicines, navigateToSubScreen } = useHomeBrain();
  const nextMed = medicines[0];

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Medicine Manager</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{medicines.length} Tracked Prescriptions</p>
            </div>
          </div>
          <button
            onClick={() => navigateToSubScreen('medicine')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View All →
          </button>
        </div>

        {nextMed ? (
          <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">Next Upcoming Dose</span>
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {nextMed.timing}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{nextMed.name}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Person: <span className="font-semibold">{nextMed.personName}</span> • Dose: {nextMed.dosage}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No medicines scheduled.</p>
        )}
      </div>

      <button
        onClick={() => navigateToSubScreen('add-medicine')}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Medicine Schedule
      </button>
    </div>
  );
};

export const MedicineManagerScreen: React.FC = () => {
  const { medicines, medicineLogs, logMedicineStatus, navigateToSubScreen, setActiveSubScreen } = useHomeBrain();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Safety Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Medicine Safety Rule</strong>: HomeBrain is a family tracking schedule tool, not a medical provider. Doses require explicit confirmation to log status.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveSubScreen('none')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            💊 Medicine Schedule Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track family member dosage schedules, set timing reminders, and view taken logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateToSubScreen('medicine-history')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-rose-500" /> Medicine History Log
          </button>
          <button
            onClick={() => navigateToSubScreen('add-medicine')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
      </div>

      {/* Medicine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicines.map(med => (
          <div
            key={med.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <User className="w-3 h-3" /> {med.personName}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" /> {med.timing}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{med.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Dosage: <strong>{med.dosage}</strong> • Frequency: {med.frequency}</p>
              {med.notes && <p className="text-xs text-slate-400 mt-2 bg-slate-50 dark:bg-slate-700/40 p-2 rounded-xl">{med.notes}</p>}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => logMedicineStatus(med.id, 'Taken')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark Dose Taken
              </button>
              <button
                onClick={() => logMedicineStatus(med.id, 'Missed')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Mark Missed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AddMedicineModal: React.FC = () => {
  const { addMedicine, setActiveSubScreen, familyMembers } = useHomeBrain();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet');
  const [timing, setTiming] = useState('8:00 PM');
  const [frequency, setFrequency] = useState<any>('Daily');
  const [personName, setPersonName] = useState(familyMembers[2]?.name || 'Grandma Savitri');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addMedicine({
      name,
      dosage,
      timing,
      frequency,
      personName,
      startDate: new Date().toISOString().split('T')[0],
      notes
    });

    setActiveSubScreen('medicine');
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Medicine Schedule</h2>
        <button onClick={() => setActiveSubScreen('medicine')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Person Taking Medicine</label>
          <select
            value={personName}
            onChange={e => setPersonName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-semibold"
          >
            {familyMembers.map(m => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.relation})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Medicine Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Amlodipine 5mg / BP Medicine"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dosage</label>
            <input
              type="text"
              required
              placeholder="e.g. 1 Tablet"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Timing</label>
            <input
              type="text"
              required
              placeholder="e.g. 8:00 PM"
              value={timing}
              onChange={e => setTiming(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            >
              <option value="Daily">Daily</option>
              <option value="Twice Daily">Twice Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="As Needed">As Needed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Instructions / Doctor Notes</label>
          <textarea
            rows={2}
            placeholder="e.g. Take after dinner with full glass of water"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSubScreen('medicine')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-md"
          >
            Save Schedule
          </button>
        </div>
      </form>
    </div>
  );
};

export const MedicineHistoryScreen: React.FC = () => {
  const { medicineLogs, setActiveSubScreen } = useHomeBrain();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => setActiveSubScreen('medicine')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1"
        >
          ← Back to Medicine Manager
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">📜 Medicine Activity Log</h1>
        <p className="text-xs text-slate-500">Explicit verification record of taken and missed doses</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700 space-y-3">
        {medicineLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No medicine logs recorded yet.</p>
        ) : (
          medicineLogs.map(log => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{log.medicineName}</p>
                <p className="text-slate-500 text-[11px]">Person: {log.personName} • Recorded by: {log.loggedBy}</p>
              </div>
              <div className="text-right">
                <span
                  className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                    log.status === 'Taken'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {log.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">{log.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
