import React, { useEffect, useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { FamilyMemory } from '../../types';
import { createPrivateFileUrl, isSupabaseConfigured, uploadPrivateFile, buildStoragePath } from '../../lib/supabase';
import { PageHeader } from '../layout/PageHeader';
import {
  Clock,
  Plus,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Heart,
  Trash2,
  X,
  Eye,
  Search,
  Tag,
  Users,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

export const FamilyTimelineScreen: React.FC = () => {
  const { memories, navigateToSubScreen } = useHomeBrain();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      const entries = await Promise.all(
        memories.map(async memory => {
          const mainUrl = memory.photoUrl || (memory.photoUrls && memory.photoUrls[0]);
          if (!mainUrl || /^https?:\/\//i.test(mainUrl)) return [memory.id, mainUrl || ''] as const;
          try {
            return [memory.id, await createPrivateFileUrl('documents', mainUrl)] as const;
          } catch {
            return [memory.id, ''] as const;
          }
        })
      );
      if (active) setImageUrls(Object.fromEntries(entries));
    };
    void loadImages();
    return () => {
      active = false;
    };
  }, [memories]);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      memories.flatMap(m => m.tags || [])
    )
  );

  // Filter memories
  const filteredMemories = memories.filter(m => {
    const matchesSearch =
      !searchTerm.trim() ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.addedBy && m.addedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.taggedMembers && m.taggedMembers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesTag =
      selectedTag === 'all' || (m.tags && m.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  // Group filtered memories by year
  const years = Array.from(new Set(filteredMemories.map(m => m.year))).sort((a, b) => b - a);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Family Memories Timeline"
        subtitle="A visual chronological record of birthdays, vacations, milestones, and photo stories"
        actions={
          <button
            onClick={() => navigateToSubScreen('add-memory')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" /> Add Family Memory
          </button>
        }
      />

      {/* Search and Tags Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search memories by title, story, person, location, or tag..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 items-center">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All Tags
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Year Sections */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-700/80 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {memories.length === 0 ? 'No Family Memories Yet' : 'No Matching Memories'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            {memories.length === 0
              ? "Capture life's special moments, vacations, birthdays, and milestones to build your family storybook."
              : 'Try clearing your search filters to see all family milestones.'}
          </p>
          {memories.length === 0 ? (
            <button
              onClick={() => navigateToSubScreen('add-memory')}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Your First Memory
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTag('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {years.map(year => {
            const yearMemories = filteredMemories.filter(m => m.year === year);

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
                      className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-56 overflow-hidden">
                          {imageUrls[mem.id] ? (
                            <img
                              src={imageUrls[mem.id]}
                              alt={mem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-brand-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 text-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                              {mem.date}
                            </span>
                            <h3 className="font-bold text-lg leading-snug mt-1">{mem.title}</h3>
                          </div>

                          {/* Multi-photo badge */}
                          {mem.photoUrls && mem.photoUrls.length > 1 && (
                            <span className="absolute top-3 right-3 bg-slate-900/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> {mem.photoUrls.length} photos
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-2.5">
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {mem.description}
                          </p>

                          {/* Tagged Family Members */}
                          {mem.taggedMembers && mem.taggedMembers.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Users className="w-3 h-3 text-slate-400 shrink-0" />
                              {mem.taggedMembers.map((member, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md"
                                >
                                  {member}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Memory Tags */}
                          {mem.tags && mem.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {mem.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                        {mem.location && (
                          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-brand-500" /> {mem.location}
                          </span>
                        )}
                        <span>Added by {mem.addedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Lightbox Full-Screen Image Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Full preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white font-bold text-sm flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AddMemoryModal: React.FC = () => {
  const {
    addMemory,
    updateMemory,
    memories,
    selectedItemId,
    activeSubScreen,
    setActiveSubScreen,
    currentUser,
    familyMembers
  } = useHomeBrain();

  const existing = memories.find(memory => memory.id === selectedItemId);
  const editing = activeSubScreen === 'edit-memory' && Boolean(existing);

  const [title, setTitle] = useState(existing?.title || '');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(existing?.description || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [taggedMembers, setTaggedMembers] = useState<string[]>(existing?.taggedMembers || []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [suggestedAiStory, setSuggestedAiStory] = useState<{ title: string; story: string; tags: string[] } | null>(null);

  const handleToggleMember = (name: string) => {
    setTaggedMembers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags(prev => [...prev, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(prev => prev.filter(item => item !== t));
  };

  // AI-Assisted Memory Caption & Tag suggestion (Requires user approval)
  const handleGenerateAICaption = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const locStr = location ? ` in ${location}` : '';
      const membersStr = taggedMembers.length > 0 ? ` with ${taggedMembers.join(' & ')}` : '';
      setSuggestedAiStory({
        title: title || `Unforgettable Family Milestone${locStr}`,
        story: `A cherished family moment celebrated${locStr}${membersStr}. Joyful memories and shared laughter that will always be remembered as part of our household history.`,
        tags: Array.from(new Set([...tags, 'FamilyMoment', 'Milestone', location ? location.replace(/\s+/g, '') : 'Memories']))
      });
      setIsGeneratingAI(false);
    }, 600);
  };

  const handleApplyAISuggestion = () => {
    if (suggestedAiStory) {
      if (!title) setTitle(suggestedAiStory.title);
      setDescription(suggestedAiStory.story);
      setTags(suggestedAiStory.tags);
      setSuggestedAiStory(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (photoFiles.length === 0 && !existing?.photoUrl && (!existing?.photoUrls || existing.photoUrls.length === 0)) {
      setError('Choose at least one photo for this family memory.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadedPaths: string[] = existing?.photoUrls ? [...existing.photoUrls] : existing?.photoUrl ? [existing.photoUrl] : [];

      for (const file of photoFiles) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          continue;
        }
        const path = buildStoragePath(currentUser.familyId, 'timeline', file.name);
        await uploadPrivateFile('documents', path, file);
        uploadedPaths.push(path);
      }

      const mainPhoto = uploadedPaths[0] || existing?.photoUrl || '';

      const value: Partial<FamilyMemory> & { title: string; year: number; date: string; description: string; photoUrl: string; addedBy: string } = {
        title,
        year: new Date(date).getFullYear(),
        date,
        description,
        photoUrl: mainPhoto,
        photoUrls: uploadedPaths,
        location,
        addedBy: existing?.addedBy || currentUser.name,
        taggedMembers,
        tags
      };

      if (editing && existing) {
        await updateMemory(existing.id, value);
      } else {
        await addMemory(value as any);
      }

      setActiveSubScreen('none');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title={editing ? 'Edit Family Memory' : 'Add Family Memory'}
        subtitle="Chronicle vacations, celebrations, and milestones with photo stories"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Memory Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Ooty Tea Garden Vacation / 10th Birthday"
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
              placeholder="e.g. Ooty, Nilgiris"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>
        </div>

        {/* Photos Upload (Multi-photo support) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Photographs (Select one or multiple)
          </label>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={e => {
              if (e.target.files) setPhotoFiles(Array.from(e.target.files));
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs"
          />
          {photoFiles.length > 0 && (
            <p className="text-[11px] text-brand-600 font-semibold mt-1">
              ✓ {photoFiles.length} photo(s) selected for upload
            </p>
          )}
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>

        {/* Tag Family Members */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tag Family Members Involved
          </label>
          <div className="flex flex-wrap gap-1.5">
            {familyMembers.map(member => {
              const selected = taggedMembers.includes(member.name);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleToggleMember(member.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {member.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag (e.g. Vacation, Birthday)..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-semibold"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[11px] font-semibold flex items-center gap-1"
                >
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)}>
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Caption & Story Generator Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleGenerateAICaption}
            disabled={isGeneratingAI}
            className="w-full py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-purple-100 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            {isGeneratingAI ? 'Generating Story Suggestion...' : 'Suggest Story & Tags with AI'}
          </button>

          {suggestedAiStory && (
            <div className="mt-2 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 text-xs space-y-2">
              <p className="font-bold text-purple-900 dark:text-purple-200">
                ✨ AI Suggested Story (Requires Approval):
              </p>
              <p className="text-slate-700 dark:text-slate-300 italic">{suggestedAiStory.story}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyAISuggestion}
                  className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs"
                >
                  Approve & Apply
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestedAiStory(null)}
                  className="px-3 py-1 rounded-lg text-slate-500 hover:underline text-xs"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Story / Description
          </label>
          <textarea
            rows={3}
            required
            placeholder="Write a description or story about this milestone..."
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
            disabled={isUploading}
            className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-md disabled:opacity-50"
          >
            {isUploading ? 'Uploading Photos...' : editing ? 'Save Changes' : 'Save Memory'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export const MemoryDetailsModal: React.FC = () => {
  const { memories, selectedItemId, deleteMemory, setActiveSubScreen } = useHomeBrain();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const mem = memories.find(m => m.id === selectedItemId);

  useEffect(() => {
    let active = true;
    const loadUrls = async () => {
      if (!mem) return;
      const allPaths = mem.photoUrls && mem.photoUrls.length > 0 ? mem.photoUrls : mem.photoUrl ? [mem.photoUrl] : [];
      const signed = await Promise.all(
        allPaths.map(async p => {
          if (!p || /^https?:\/\//i.test(p)) return p;
          try {
            return await createPrivateFileUrl('documents', p);
          } catch {
            return '';
          }
        })
      );
      if (active) setImageUrls(signed.filter(Boolean));
    };
    void loadUrls();
    return () => {
      active = false;
    };
  }, [mem]);

  if (!mem) return null;

  const currentPhoto = imageUrls[activePhotoIdx] || '';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader
        title={mem.title}
        subtitle={`Family Memory • ${mem.date} (${mem.year})`}
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="relative h-80 bg-black flex items-center justify-center">
        {currentPhoto ? (
          <img src={currentPhoto} alt={mem.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-brand-400" />
          </div>
        )}

        <button
          onClick={() => setActiveSubScreen('none')}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Multi-photo pagination carousel controls */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhotoIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  activePhotoIdx === i ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-brand-600 font-bold">
          <span>
            {mem.date} ({mem.year})
          </span>
          {mem.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {mem.location}
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{mem.title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {mem.description}
        </p>

        {/* Tagged Members */}
        {mem.taggedMembers && mem.taggedMembers.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Tagged Family Members:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mem.taggedMembers.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {mem.tags && mem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mem.tags.map((t, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <button
          onClick={() => {
            if (window.confirm(`Delete memory "${mem.title}"?`)) {
              deleteMemory(mem.id);
              setActiveSubScreen('none');
            }
          }}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Delete Memory
        </button>
        <button
          onClick={() => setActiveSubScreen('edit-memory')}
          className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Edit Memory
        </button>
      </div>
      </div>
    </div>
  );
};
