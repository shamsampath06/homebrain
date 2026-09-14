import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { FamilyMemory } from '../../types';
import { Clock, Plus, MapPin, Calendar, Image as ImageIcon, Heart, Trash2, X, Eye } from 'lucide-react';

export const FamilyTimelineScreen: React.FC = () => {
  const { memories, navigateToSubScreen } = useHomeBrain();

  // Group memories by year
  const years = Array.from(new Set(memories.map(m => m.year))).sort((a, b) => b - a);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🕒 Family Memories Timeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A visual chronological record of birthdays, vacations, milestones, and photo stories
          </p>
        </div>

        <button
          onClick={() => navigateToSubScreen('add-memory')}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" /> Add Family Memory
        </button>
      </div>

      {/* Year Sections */}
      <div className="space-y-10">
        {years.map(year => {
          const yearMemories = memories.filter(m => m.year === year);

          return (
            <section key={year} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-4 py-1 rounded-2xl border border-brand-200 dark:border-brand-800">
                  {year}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {yearMemories.map(mem => (
                  <div
                    key={mem.id}
                    onClick={() => navigateToSubScreen('memory-details', mem.id)}
                    className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={mem.photoUrl}
                        alt={mem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                          {mem.date}
                        </span>
                        <h3 className="font-bold text-lg leading-snug mt-1">{mem.title}</h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {mem.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                        {mem.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-500" /> {mem.location}
                          </span>
                        )}
                        <span>Added by {mem.addedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export const AddMemoryModal: React.FC = () => {
  const { addMemory, setActiveSubScreen, currentUser } = useHomeBrain();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Sharma Residence');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const memoryYear = new Date(date).getFullYear() || 2026;

    addMemory({
      title,
      year: memoryYear,
      date,
      description,
      photoUrl,
      location,
      addedBy: currentUser.name
    });

    setActiveSubScreen('none');
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Family Memory</h2>
        <button onClick={() => setActiveSubScreen('none')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Memory Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Ooty Family Vacation / Birthday Party"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. Ooty Tea Estates"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Photo Image URL</label>
          <input
            type="text"
            required
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Story / Description</label>
          <textarea
            rows={3}
            required
            placeholder="Write a description of the memory..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSubScreen('none')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-md"
          >
            Save Memory
          </button>
        </div>
      </form>
    </div>
  );
};

export const MemoryDetailsModal: React.FC = () => {
  const { memories, selectedItemId, deleteMemory, setActiveSubScreen } = useHomeBrain();
  const mem = memories.find(m => m.id === selectedItemId);

  if (!mem) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
      <div className="relative h-72">
        <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
        <button
          onClick={() => setActiveSubScreen('none')}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-brand-600 font-bold">
          <span>{mem.date} ({mem.year})</span>
          {mem.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {mem.location}</span>}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{mem.title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{mem.description}</p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <button
          onClick={() => {
            deleteMemory(mem.id);
            setActiveSubScreen('none');
          }}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Delete Memory
        </button>
        <button
          onClick={() => setActiveSubScreen('none')}
          className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Done
        </button>
      </div>
    </div>
  );
};
