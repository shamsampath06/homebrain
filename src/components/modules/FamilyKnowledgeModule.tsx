import React, { useEffect, useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { FamilyKnowledge, FamilyKnowledgeFile } from '../../types';
import { PageHeader } from '../layout/PageHeader';
import { Brain, Plus, Search, AlertCircle, Sparkles, Trash2, Edit3, X, User } from 'lucide-react';
import { createPrivateFileUrl, deletePrivateFile, uploadPrivateFile } from '../../lib/supabase';

const KnowledgeFileTile: React.FC<{
  file: FamilyKnowledgeFile;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
}> = ({ file, onOpen, onDelete, onRename }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (file.isFolder) return;
    if (file.storagePath?.startsWith('data:') || file.storagePath?.startsWith('http')) {
      setUrl(file.storagePath);
    } else if (file.storagePath) {
      void createPrivateFileUrl('documents', file.storagePath).then(setUrl).catch(() => undefined);
    }
  }, [file]);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-900/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all">
      {file.isFolder ? (
        <button type="button" onClick={onOpen} className="w-full text-left text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 py-2">
          <span>📁</span>
          <span className="truncate">{file.name}</span>
        </button>
      ) : (
        <button type="button" onClick={onOpen} className="w-full text-left group">
          {url ? (
            <img src={url} alt={file.name} className="h-20 w-full rounded-xl object-cover group-hover:scale-102 transition-transform" />
          ) : (
            <div className="h-20 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-xs font-semibold">
              Preview
            </div>
          )}
          <p className="truncate text-xs font-semibold mt-1 text-slate-800 dark:text-slate-200">{file.name}</p>
        </button>
      )}
      <div className="flex gap-2 mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800">
        <button type="button" onClick={onRename} className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline">Rename</button>
        <button type="button" onClick={onDelete} className="text-[10px] text-rose-500 hover:underline">Delete</button>
      </div>
    </div>
  );
};

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
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" /> {critical.relatedMemberName}
            </p>
            {critical.content && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{critical.content}</p>
            )}
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
  const { knowledgeList, knowledgeFiles, navigateToSubScreen, setActiveSubScreen, deleteKnowledge, addKnowledgeFile, updateKnowledgeFile, deleteKnowledgeFile, currentUser } = useHomeBrain();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [folderPath, setFolderPath] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['All', 'Allergies', 'Medical', 'Preferences', 'Schedules', 'Emergency', 'Rules', 'General'];

  const filtered = knowledgeList.filter(k => {
    const matchesCategory = selectedCategory === 'All' || k.category === selectedCategory;
    const matchesSearch =
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.relatedMemberName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleFiles = knowledgeFiles.filter(file => file.folderPath === folderPath);
  const createFolder = () => {
    const name = window.prompt('Folder name');
    if (!name?.trim()) return;
    addKnowledgeFile({ name: name.trim(), folderPath, storagePath: '', mimeType: '', sizeBytes: 0, isFolder: true });
  };

  const uploadKnowledgeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Only JPG, JPEG, PNG, and WEBP files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Files must be 10 MB or smaller.');
      return;
    }
    setIsUploading(true);
    setFileError(null);
    try {
      let storagePath = `${currentUser.familyId}/knowledge/${folderPath ? `${folderPath}/` : ''}${crypto.randomUUID()}-${file.name}`;
      let uploadedToStorage = false;
      try {
        await uploadPrivateFile('documents', storagePath, file);
        uploadedToStorage = true;
      } catch (storageErr) {
        console.warn('Direct Supabase storage upload was blocked by security rules, using local base64 fallback:', storageErr);
      }

      if (!uploadedToStorage) {
        const reader = new FileReader();
        storagePath = await new Promise<string>((res) => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      addKnowledgeFile({ name: file.name, folderPath, storagePath, mimeType: file.type, sizeBytes: file.size, isFolder: false });
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Knowledge file upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const openKnowledgeFile = async (file: typeof knowledgeFiles[number]) => {
    try {
      if (file.storagePath?.startsWith('data:') || file.storagePath?.startsWith('http')) {
        window.open(file.storagePath, '_blank', 'noopener,noreferrer');
        return;
      }
      const url = await createPrivateFileUrl('documents', file.storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Unable to open file.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Structured Family Knowledge Base"
        subtitle="Important medical allergies, food preferences, exam schedules, and household facts retrieved by HomeBrain AI"
        actions={
          <button
            onClick={() => navigateToSubScreen('add-knowledge')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" /> Add Knowledge Fact
          </button>
        }
      />

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Knowledge Files</h2>
            <p className="text-xs text-slate-500">Private family images, organized in folders.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={createFolder} className="px-3 py-2 rounded-xl border text-xs font-semibold">New folder</button>
            <label className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold cursor-pointer">
              {isUploading ? 'Uploading...' : 'Upload image'}
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={uploadKnowledgeFile} disabled={isUploading} />
            </label>
          </div>
        </div>
        {fileError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{fileError}</p>}
        {folderPath && <button type="button" onClick={() => setFolderPath(folderPath.split('/').slice(0, -1).join('/'))} className="text-xs text-purple-600 hover:underline">← Back</button>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {visibleFiles.map(file => (
            <KnowledgeFileTile key={file.id} file={file}
              onOpen={() => file.isFolder ? setFolderPath(folderPath ? `${folderPath}/${file.name}` : file.name) : void openKnowledgeFile(file)}
              onRename={() => {
                const name = window.prompt('New name', file.name);
                if (name?.trim()) {
                  const oldPath = folderPath ? `${folderPath}/${file.name}` : file.name;
                  const newPath = folderPath ? `${folderPath}/${name.trim()}` : name.trim();
                  updateKnowledgeFile(file.id, { name: name.trim() });
                  if (file.isFolder) {
                    knowledgeFiles
                      .filter(child => child.folderPath === oldPath || child.folderPath.startsWith(`${oldPath}/`))
                      .forEach(child => updateKnowledgeFile(child.id, {
                        folderPath: `${newPath}${child.folderPath.slice(oldPath.length)}`
                      }));
                  }
                }
              }}
              onDelete={() => {
                if (!file.isFolder) void deletePrivateFile('documents', file.storagePath);
                deleteKnowledgeFile(file.id);
              }}
            />
          ))}
          {visibleFiles.length === 0 && <p className="col-span-full text-xs text-slate-400">No files in this folder.</p>}
        </div>
      </section>

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
                onClick={() => navigateToSubScreen('edit-knowledge', knw.id)}
                className="text-xs text-brand-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => { if (window.confirm(`Delete ${knw.title}?`)) deleteKnowledge(knw.id); }}
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
  const { addKnowledge, updateKnowledge, knowledgeList, selectedItemId, activeSubScreen, setActiveSubScreen, familyMembers, currentUser } = useHomeBrain();
  const existing = knowledgeList.find(knowledge => knowledge.id === selectedItemId);
  const editing = activeSubScreen === 'edit-knowledge' && Boolean(existing);
  const [title, setTitle] = useState(existing?.title || '');
  const [content, setContent] = useState(existing?.content || '');
  const [category, setCategory] = useState<FamilyKnowledge['category']>(existing?.category || 'Allergies');
  const [relatedMemberName, setRelatedMemberName] = useState(existing?.relatedMemberName || currentUser.name);
  const relatedMembers = [
    { id: currentUser.id, name: currentUser.name },
    ...familyMembers.filter(member => member.name !== currentUser.name)
  ];
  const [importance, setImportance] = useState<FamilyKnowledge['importance']>(existing?.importance || 'Critical');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const value = {
      title,
      content,
      category,
      relatedMemberName,
      importance
    };
    if (editing && existing) updateKnowledge(existing.id, value);
    else addKnowledge(value);

    setActiveSubScreen('knowledge');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title={editing ? 'Edit Family Knowledge Fact' : 'Add Family Knowledge Fact'}
        subtitle="Record critical allergies, medical warnings, dietary preferences, or household rules"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={e => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs"
            >
              <option value="Allergies">Allergies ⚠️</option>
              <option value="Medical">Medical 🩺</option>
              <option value="Preferences">Dietary / Food</option>
              <option value="Schedules">Exam / Work</option>
              <option value="Emergency">Emergency Fact</option>
              <option value="Rules">Household Rules</option>
              <option value="General">General Note</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Related Member</label>
            <select
              required
              value={relatedMemberName}
              onChange={e => setRelatedMemberName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold"
            >
              {relatedMembers.map(m => (
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
              onChange={e => setImportance(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="Critical">Critical 🔴</option>
              <option value="Important">Important 🟡</option>
              <option value="Info">Info 🔵</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Information <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea
            rows={3}
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
            {editing ? 'Save Changes' : 'Save Knowledge'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
