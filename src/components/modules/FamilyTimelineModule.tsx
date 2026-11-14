import React, { useEffect, useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { FamilyMemory } from '../../types';
import { createPrivateFileUrl, isSupabaseConfigured, uploadPrivateFile, buildStoragePath } from '../../lib/supabase';
import { PageHeader } from '../layout/PageHeader';
import { EXAMPLE_PLACE_FOLDERS, EXAMPLE_PLACE_MEMORIES } from '../../data/exampleMemories';
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
  FileText,
  Folder,
  FolderPlus,
  Edit3,
  ArrowLeft,
  Download,
  Layers,
  Check
} from 'lucide-react';

const FALLBACK_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f46e5"/><stop offset="100%" stop-color="%237c3aed"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><circle cx="400" cy="270" r="45" fill="white" opacity="0.3"/><polygon points="260,420 370,300 450,380 520,320 620,420" fill="white" opacity="0.35"/><text x="400" y="470" fill="white" font-family="sans-serif" font-size="20" font-weight="bold" opacity="0.7" text-anchor="middle">Family Memory Album</text></svg>';

const POPULAR_ALBUMS = [
  ...EXAMPLE_PLACE_FOLDERS,
  'Family Vacations',
  'Birthdays & Celebrations',
  'Academic & Graduations',
  'Sports & Competitions',
  'Home & Daily Life'
];

export const FamilyTimelineScreen: React.FC = () => {
  const { memories: rawMemories, familyMembers, navigateToSubScreen, deleteMemory } = useHomeBrain();
  const memories = rawMemories && rawMemories.length > 0 ? rawMemories : EXAMPLE_PLACE_MEMORIES;
  const [imageUrls, setImageUrls] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'folders' | 'timeline'>('folders');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Lightbox Modal state
  const [lightboxMemory, setLightboxMemory] = useState<FamilyMemory | null>(null);
  const [lightboxPhotoIdx, setLightboxPhotoIdx] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      const entries = await Promise.all(
        memories.map(async memory => {
          const rawUrls = memory.photoUrls && memory.photoUrls.length > 0
            ? memory.photoUrls
            : memory.photoUrl ? [memory.photoUrl] : [];

          const resolved = await Promise.all(
            rawUrls.map(async url => {
              if (!url) return '';
              if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
              try {
                const signed = await createPrivateFileUrl('documents', url);
                return signed || url;
              } catch {
                return url;
              }
            })
          );

          const valid = resolved.filter(Boolean);
          return [memory.id, valid.length > 0 ? valid : [FALLBACK_PHOTO]] as const;
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

  // Helper to determine album name for any memory
  const getAlbumName = (m: FamilyMemory) => m.album?.trim() || `${m.year} Memories`;

  // Filter memories
  const filteredMemories = memories.filter(m => {
    const matchesSearch =
      !searchTerm.trim() ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.addedBy && m.addedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.album && m.album.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.taggedMembers && m.taggedMembers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesTag =
      selectedTag === 'all' || (m.tags && m.tags.includes(selectedTag));

    const matchesMember =
      selectedMember === 'all' ||
      (m.taggedMembers && m.taggedMembers.some(t => t.toLowerCase().includes(selectedMember.toLowerCase()))) ||
      (m.addedBy && m.addedBy.toLowerCase().includes(selectedMember.toLowerCase()));

    return matchesSearch && matchesTag && matchesMember;
  });

  // Group memories into folders/albums
  const foldersMap = filteredMemories.reduce<Record<string, FamilyMemory[]>>((acc, mem) => {
    const album = getAlbumName(mem);
    if (!acc[album]) acc[album] = [];
    acc[album].push(mem);
    return acc;
  }, {});

  const folderNames = Object.keys(foldersMap).sort((a, b) => a.localeCompare(b));

  // Memories to display when inside a selected folder
  const currentFolderMemories = selectedFolder ? (foldersMap[selectedFolder] || []) : [];

  // Group filtered memories by year for chronological view
  const years = Array.from(new Set(filteredMemories.map(m => m.year))).sort((a, b) => b - a);

  // Render a Single Memory Card
  const renderMemoryCard = (mem: FamilyMemory) => {
    const photos = imageUrls[mem.id] || (mem.photoUrls && mem.photoUrls.length > 0 ? mem.photoUrls : [mem.photoUrl || FALLBACK_PHOTO]);
    const coverPhoto = photos[0] || FALLBACK_PHOTO;

    return (
      <div
        key={mem.id}
        className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl transition-all flex flex-col justify-between group"
      >
        <div>
          {/* Photo Header with Interactive Lightbox Trigger */}
          <div
            onClick={() => {
              setLightboxMemory(mem);
              setLightboxPhotoIdx(0);
            }}
            className="relative h-60 overflow-hidden cursor-pointer bg-slate-900"
          >
            <img
              src={coverPhoto}
              alt={mem.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_PHOTO;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent" />

            {/* Quick Action Buttons (Edit / Delete / Zoom) directly on Card */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {photos.length > 1 && (
                <span className="bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> {photos.length} photos
                </span>
              )}
              <button
                type="button"
                title="Edit Memory"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToSubScreen('edit-memory', mem.id);
                }}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:text-white shadow-md transition-all hover:scale-105"
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-600" />
              </button>
              <button
                type="button"
                title="Delete Memory"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete memory "${mem.title}"?`)) {
                    deleteMemory(mem.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-rose-50 text-rose-600 dark:bg-slate-900/80 dark:hover:bg-rose-950/80 shadow-md transition-all hover:scale-105"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              </button>
              <button
                type="button"
                title="View Fullscreen"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxMemory(mem);
                  setLightboxPhotoIdx(0);
                }}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:text-white shadow-md transition-all hover:scale-105"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
              </button>
            </div>

            {/* Bottom Title on Image */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                  {mem.date}
                </span>
                {mem.album && (
                  <span className="text-[10px] font-semibold bg-brand-500/80 backdrop-blur-md px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Folder className="w-2.5 h-2.5" /> {mem.album}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg leading-snug line-clamp-2">{mem.title}</h3>
            </div>
          </div>

          {/* Description & Tags */}
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

        {/* Card Footer with Location and Added By */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
          {mem.location ? (
            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 truncate max-w-[60%]">
              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" /> {mem.location}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToSubScreen('memory-details', mem.id)}
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              Details & Photos →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Family Memories & Photo Albums"
        subtitle="Organize photos into folders, chronicle family milestones, and relive cherished moments"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToSubScreen('add-memory')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-brand-600/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Add Memory / Photos
            </button>
          </div>
        }
      />

      {/* View Switcher & Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Folders vs Timeline Toggle */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setViewMode('folders');
                setSelectedFolder(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                viewMode === 'folders'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Folder className="w-4 h-4" /> Albums & Folders ({folderNames.length})
            </button>
            <button
              onClick={() => {
                setViewMode('timeline');
                setSelectedFolder(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" /> Chronological Timeline
            </button>
          </div>

          {/* Member Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <option value="all">All Family Members</option>
              {familyMembers.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search memories, folders, stories, or family..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Tag Pills Filter */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 items-center pt-1 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Tags
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
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
              ? "Capture life's special moments, vacations, birthdays, and milestones to build your family photo book."
              : 'Try clearing your search filters to see all family memories.'}
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
      ) : viewMode === 'folders' ? (
        // FOLDERS / ALBUMS VIEW
        <div>
          {selectedFolder ? (
            // INSIDE A SELECTED FOLDER
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to All Folders
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Folder className="w-5 h-5 text-amber-500" /> {selectedFolder}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {currentFolderMemories.length} {currentFolderMemories.length === 1 ? 'memory' : 'memories'} in this album folder
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigateToSubScreen('add-memory')}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Photo to this Folder
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentFolderMemories.map(mem => renderMemoryCard(mem))}
              </div>
            </div>
          ) : (
            // ALL FOLDERS GRID
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Folder className="w-5 h-5 text-amber-500" /> Family Photo Albums & Folders
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {folderNames.length} albums • {filteredMemories.length} total memories
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {folderNames.map(folderName => {
                  const memsInFolder = foldersMap[folderName] || [];
                  const firstMem = memsInFolder[0];
                  const photosInFolder = memsInFolder.flatMap(m => {
                    const loaded = imageUrls[m.id];
                    if (loaded && loaded.length > 0) return loaded;
                    return m.photoUrls && m.photoUrls.length > 0 ? m.photoUrls : [m.photoUrl || FALLBACK_PHOTO];
                  });
                  const coverImg = photosInFolder[0] || FALLBACK_PHOTO;

                  return (
                    <div
                      key={folderName}
                      onClick={() => setSelectedFolder(folderName)}
                      className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between"
                    >
                      {/* Folder Cover Image Collage */}
                      <div className="relative h-48 bg-slate-900 overflow-hidden">
                        <img
                          src={coverImg}
                          alt={folderName}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_PHOTO;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-amber-500/90 text-white shadow-md backdrop-blur-md">
                            <Folder className="w-4 h-4 fill-white" />
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                            <ImageIcon className="w-3 h-3" /> {photosInFolder.length} photos
                          </span>
                        </div>

                        {/* Bottom Title on Image */}
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                            {memsInFolder.length} {memsInFolder.length === 1 ? 'Story' : 'Stories'}
                          </span>
                          <h3 className="text-lg font-bold mt-1 leading-tight group-hover:text-amber-300 transition-colors">
                            {folderName}
                          </h3>
                        </div>
                      </div>

                      {/* Folder Body Info */}
                      <div className="p-4 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30">
                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[65%]">
                          Latest: {firstMem?.date || 'Recent'}
                        </span>
                        <span className="font-bold text-brand-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Open Folder →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        // CHRONOLOGICAL TIMELINE VIEW
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {yearMemories.map(mem => renderMemoryCard(mem))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Lightbox Full-Screen Interactive Photo Viewer */}
      {lightboxMemory && (
        <div
          onClick={() => setLightboxMemory(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Top Bar */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate pr-4">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-bold">
                  {lightboxMemory.date}
                </span>
                <h3 className="font-bold text-sm sm:text-base truncate">{lightboxMemory.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = lightboxMemory.id;
                    setLightboxMemory(null);
                    navigateToSubScreen('edit-memory', id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-brand-400" /> Edit Memory
                </button>
                <button
                  onClick={() => setLightboxMemory(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo Center Display */}
            {(() => {
              const memPhotos = imageUrls[lightboxMemory.id] || (lightboxMemory.photoUrls && lightboxMemory.photoUrls.length > 0 ? lightboxMemory.photoUrls : [lightboxMemory.photoUrl || FALLBACK_PHOTO]);
              const activeUrl = memPhotos[lightboxPhotoIdx] || memPhotos[0] || FALLBACK_PHOTO;

              return (
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[350px] max-h-[60vh] overflow-hidden select-none">
                  <img
                    src={activeUrl}
                    alt={lightboxMemory.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_PHOTO;
                    }}
                    className="max-h-[58vh] max-w-full object-contain"
                  />

                  {/* Previous / Next Navigation Arrows */}
                  {memPhotos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxPhotoIdx((prev) => (prev > 0 ? prev - 1 : memPhotos.length - 1));
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:scale-110"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxPhotoIdx((prev) => (prev < memPhotos.length - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all hover:scale-110"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Photo Counter Pill */}
                  {memPhotos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold">
                      {lightboxPhotoIdx + 1} of {memPhotos.length}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bottom Caption and Info */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-slate-300 text-xs space-y-2">
              <p className="line-clamp-3 leading-relaxed text-sm text-slate-200">
                {lightboxMemory.description}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                {lightboxMemory.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" /> {lightboxMemory.location}
                  </span>
                )}
                <span>Added by {lightboxMemory.addedBy}</span>
              </div>
            </div>
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
  const [album, setAlbum] = useState(existing?.album || 'Family Vacations');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    existing?.photoUrls && existing.photoUrls.length > 0
      ? existing.photoUrls
      : existing?.photoUrl ? [existing.photoUrl] : []
  );
  const [directPhotoUrl, setDirectPhotoUrl] = useState('');
  const [taggedMembers, setTaggedMembers] = useState<string[]>(existing?.taggedMembers || []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [suggestedAiStory, setSuggestedAiStory] = useState<{ title: string; story: string; tags: string[] } | null>(null);

  // Read selected files into Base64 Data URLs so they can be viewed immediately!
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setPhotoFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrls(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddDirectUrl = () => {
    if (directPhotoUrl.trim()) {
      setPreviewUrls(prev => [...prev, directPhotoUrl.trim()]);
      setDirectPhotoUrl('');
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

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

  // AI-Assisted Memory Story & Tag suggestion
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
    if (!title.trim()) {
      setError('Please provide a memory title.');
      return;
    }

    if (previewUrls.length === 0 && photoFiles.length === 0) {
      setError('Choose at least one photograph for this family memory.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Start with all existing valid URLs (http and base64 data URLs)
      let finalPhotoUrls: string[] = [...previewUrls];

      // If Supabase storage is configured, attempt upload for local files
      if (isSupabaseConfigured && photoFiles.length > 0) {
        for (const file of photoFiles) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            continue;
          }
          try {
            const path = buildStoragePath(currentUser.familyId, 'timeline', file.name);
            await uploadPrivateFile('documents', path, file);
            // If upload succeeded, replace or append path
            finalPhotoUrls.push(path);
          } catch (storageErr) {
            console.warn('Storage upload fallback to base64 preview URL:', storageErr);
            // Base64 already in finalPhotoUrls from FileReader!
          }
        }
      }

      // Ensure we have at least one valid photo URL
      if (finalPhotoUrls.length === 0) {
        finalPhotoUrls = [FALLBACK_PHOTO];
      }

      const mainPhoto = finalPhotoUrls[0];

      const value: Partial<FamilyMemory> & {
        title: string;
        year: number;
        date: string;
        description: string;
        photoUrl: string;
        addedBy: string;
      } = {
        title,
        year: new Date(date).getFullYear() || new Date().getFullYear(),
        date,
        description,
        photoUrl: mainPhoto,
        photoUrls: finalPhotoUrls,
        location,
        album: album.trim() || 'Family Vacations',
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save family memory.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader
        title={editing ? 'Edit Family Memory' : 'Add Family Memory & Photos'}
        subtitle="Chronicle vacations, celebrations, and milestones with photo albums"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Memory Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ooty Tea Garden Vacation / 10th Birthday"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Album / Folder Name with Quick Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-500" /> Album / Folder
              </span>
              <span className="text-[11px] text-slate-400">Organizes your photos into folders</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Family Vacations, Academic & Graduations..."
              value={album}
              onChange={e => setAlbum(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500"
            />
            {/* Quick Album Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_ALBUMS.map(popAlbum => (
                <button
                  key={popAlbum}
                  type="button"
                  onClick={() => setAlbum(popAlbum)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    album === popAlbum
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  📁 {popAlbum}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Amritsar, Nilgiris, Bangalore"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Photographs Selection with Live Immediate Previews */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Photographs (Upload from Device or Paste Image URL) *
            </label>

            {/* Live Thumbnails Preview Grid */}
            {previewUrls.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-brand-600" /> {previewUrls.length} Photo(s) Attached (Ready to view):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_PHOTO;
                        }}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-brand-600 text-white text-[9px] font-bold">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFilesSelected}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs"
              />
            </div>

            {/* Direct Image URL input as quick alternative */}
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="Or paste direct image URL (https://...)..."
                value={directPhotoUrl}
                onChange={e => setDirectPhotoUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs"
              />
              <button
                type="button"
                onClick={handleAddDirectUrl}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Add URL
              </button>
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
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
                        ? 'bg-brand-600 text-white font-bold'
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
                placeholder="Add tag (e.g. vacation, birthday)..."
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

          {/* AI Story & Caption Generator Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleGenerateAICaption}
              disabled={isGeneratingAI}
              className="w-full py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-purple-100 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              {isGeneratingAI ? 'Generating Story Suggestion...' : 'Suggest Story & Tags with AI'}
            </button>

            {suggestedAiStory && (
              <div className="mt-2 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 text-xs space-y-2">
                <p className="font-bold text-purple-900 dark:text-purple-200">
                  ✨ AI Suggested Story:
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

          {/* Story / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Story / Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Write a description or story about this milestone..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveSubScreen('none')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all hover:scale-105"
            >
              {isUploading ? 'Saving Photos...' : editing ? 'Save Changes' : 'Save Memory & Photos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MemoryDetailsModal: React.FC = () => {
  const { memories: rawMemories, selectedItemId, deleteMemory, setActiveSubScreen, navigateToSubScreen } = useHomeBrain();
  const memories = rawMemories && rawMemories.length > 0 ? rawMemories : EXAMPLE_PLACE_MEMORIES;
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const mem = memories.find(m => m.id === selectedItemId);

  useEffect(() => {
    let active = true;
    const loadUrls = async () => {
      if (!mem) return;
      const allPaths = mem.photoUrls && mem.photoUrls.length > 0
        ? mem.photoUrls
        : mem.photoUrl ? [mem.photoUrl] : [];

      const resolved = await Promise.all(
        allPaths.map(async p => {
          if (!p) return '';
          if (/^https?:\/\//i.test(p) || p.startsWith('data:')) return p;
          try {
            const signed = await createPrivateFileUrl('documents', p);
            return signed || p;
          } catch {
            return p;
          }
        })
      );
      const valid = resolved.filter(Boolean);
      if (active) setImageUrls(valid.length > 0 ? valid : [FALLBACK_PHOTO]);
    };
    void loadUrls();
    return () => {
      active = false;
    };
  }, [mem]);

  if (!mem) return null;

  const currentPhoto = imageUrls[activePhotoIdx] || imageUrls[0] || FALLBACK_PHOTO;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        title={mem.title}
        subtitle={`Family Memory • ${mem.date} (${mem.year})`}
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Carousel / Photo Viewer */}
        <div className="relative h-96 bg-black flex items-center justify-center">
          <img
            src={currentPhoto}
            alt={mem.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_PHOTO;
            }}
            className="w-full h-full object-contain"
          />

          <button
            onClick={() => setActiveSubScreen('none')}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left / Right Carousel Controls */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={() => setActivePhotoIdx(prev => (prev > 0 ? prev - 1 : imageUrls.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActivePhotoIdx(prev => (prev < imageUrls.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* Photo Pagination Dots */}
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
            </>
          )}
        </div>

        {/* Memory Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-brand-600 font-bold flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {mem.date} ({mem.year})
              {mem.album && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
                  <Folder className="w-3 h-3" /> {mem.album}
                </span>
              )}
            </span>
            {mem.location && (
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-brand-500" /> {mem.location}
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

        {/* Modal Bottom Actions (Simple to update / delete) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(`Delete memory "${mem.title}"?`)) {
                deleteMemory(mem.id);
                setActiveSubScreen('none');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Memory
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubScreen('none')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => navigateToSubScreen('edit-memory', mem.id)}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Memory & Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
