import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { FamilyKnowledge } from '../../types';
import { Brain, Plus, Search, AlertCircle, Sparkles, Trash2, Edit3, X, User } from 'lucide-react';

export const KnowledgeCard: React.FC = () => {
  const { knowledgeList, navigateToSubScreen } = useHomeBrain();
  const critical = knowledgeList.find(k => k.importance === 'Critical') || knowledgeList[0];

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Family Knowledge</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{knowledgeList.length} Facts & Preferences</p>
            </div>
          </div>
          <button
            onClick={() => navigateToSubScreen('knowledge')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View All →
          </button>
        </div>

        {critical ? (
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" /> {critical.category}
              </span>
              <span className="text-[10px] font-extrabold text-rose-600 uppercase">{critical.importance}</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">{critical.title}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{critical.content}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No knowledge entries recorded yet.</p>
        )}
      </div>

      <button
        onClick={() => navigateToSubScreen('add-knowledge')}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-600 dark:text-purple-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Knowledge Fact
      </button>
    </div>
  );
};

export const FamilyKnowledgeScreen: React.FC = () => {
  const { knowledgeList, navigateToSubScreen, setActiveSubScreen, deleteKnowledge } = useHomeBrain();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = knowledgeList.filter(
    k =>
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.relatedMemberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
            🧠 Structured Family Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Important medical allergies, food preferences, exam schedules, and household facts retrieved by HomeBrain AI
          </p>
        </div>

        <button
          onClick={() => navigateToSubScreen('add-knowledge')}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Knowledge Fact
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search family knowledge (e.g. Grandma allergy, Dad food preference)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm shadow-sm"
        />
      </div>

      {/* Knowledge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(knw => (
          <div
            key={knw.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {knw.category}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    knw.importance === 'Critical'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {knw.importance}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{knw.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-700/40 p-3 rounded-2xl leading-relaxed">
                {knw.content}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
              <span>Member: <strong>{knw.relatedMemberName}</strong></span>
              <button
                onClick={() => deleteKnowledge(knw.id)}
                className="text-xs text-rose-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AddKnowledgeModal: React.FC = () => {
  const { addKnowledge, setActiveSubScreen, familyMembers } = useHomeBrain();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<any>('Allergies');
  const [relatedMemberName, setRelatedMemberName] = useState(familyMembers[2]?.name || 'Grandma Savitri');
  const [importance, setImportance] = useState<any>('Critical');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addKnowledge({
      title,
      content,
      category,
      relatedMemberName,
      importance
    });

    setActiveSubScreen('knowledge');
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Family Knowledge Fact</h2>
        <button onClick={() => setActiveSubScreen('knowledge')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Knowledge Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Grandma Penicillin Allergy / Dad Food Preferences"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs"
            >
              <option value="Allergies">Allergies ⚠️</option>
              <option value="Preferences">Dietary / Food</option>
              <option value="Schedules">Exam / Work</option>
              <option value="Emergency">Emergency Fact</option>
              <option value="General">General Note</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Related Member</label>
            <select
              value={relatedMemberName}
              onChange={e => setRelatedMemberName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold"
            >
              {familyMembers.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Importance</label>
            <select
              value={importance}
              onChange={e => setImportance(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="Critical">Critical 🔴</option>
              <option value="Important">Important 🟡</option>
              <option value="Info">Info 🔵</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Information</label>
          <textarea
            rows={3}
            required
            placeholder="e.g. Grandma is severely allergic to Penicillin and Amoxicillin antibiotics."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSubScreen('knowledge')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-md"
          >
            Save Knowledge
          </button>
        </div>
      </form>
    </div>
  );
};
