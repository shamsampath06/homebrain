import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { DocumentCategory, DocumentItem } from '../../types';
import { createPrivateFileUrl, isSupabaseConfigured, uploadPrivateFile, getAccessToken, buildStoragePath } from '../../lib/supabase';
import { PageHeader } from '../layout/PageHeader';
import { FileText, Upload, Search, Download, Trash2, ShieldCheck, Eye, Plus, X, FileCode, Bot, Sparkles, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

export const DocumentVaultCard: React.FC = () => {
  const { documents, navigateToSubScreen } = useHomeBrain();
  const recentDoc = documents[0];

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Document Vault</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{documents.length} Stored Documents</p>
            </div>
          </div>
          <button
            onClick={() => navigateToSubScreen('documents')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View All →
          </button>
        </div>

        {recentDoc ? (
          <div
            onClick={() => navigateToSubScreen('document-details', recentDoc.id)}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700 mt-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">
                {recentDoc.fileType}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{recentDoc.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Recently Added • {recentDoc.uploadDate}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No documents stored yet.</p>
        )}
      </div>

      <button
        onClick={() => navigateToSubScreen('upload-document')}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Upload className="w-4 h-4" /> Upload Document
      </button>
    </div>
  );
};

export const DocumentVaultScreen: React.FC = () => {
  const { documents, navigateToSubScreen, setActiveSubScreen, deleteDocument } = useHomeBrain();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);

  const categories = ['All', 'Identity', 'Medical', 'Insurance', 'Financial', 'Home', 'Education', 'Legal'];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.summaryContent && doc.summaryContent.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const confirmDelete = async () => {
    if (documentToDelete) {
      await deleteDocument(documentToDelete.id);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar with Breadcrumb Navigation */}
      <PageHeader
        title="Family Document Vault"
        subtitle="Securely store, organize, and query passports, health insurance, deeds, and records"
        actions={
          <button
            onClick={() => navigateToSubScreen('upload-document')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        }
      />

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Document?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">"{documentToDelete.title}"</span>? This will permanently remove the record and file from private storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & AI Natural Language Query Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder='Search documents or ask AI: "Where is my passport?"...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm shadow-sm focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Upload an important family document like a passport, insurance card, or property deed.
            </p>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                    {doc.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{doc.fileSize}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{doc.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{doc.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Uploaded {doc.uploadDate}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateToSubScreen('document-details', doc.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="View Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDocumentToDelete(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const UploadDocumentModal: React.FC = () => {
  const { addDocument, setActiveSubScreen, currentUser } = useHomeBrain();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Identity');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'txt'];
    if (!allowedExtensions.includes(ext)) {
      setError('Supported file formats: PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP.');
      return;
    }
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError('Documents must be 15 MB or smaller.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setFileName(file.name);
    if (!title) {
      // Auto-set title from file name without extension
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) {
      setError('Choose a document or image before uploading.');
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add the public Supabase variables to .env.local.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const path = buildStoragePath(currentUser.familyId, 'vault', selectedFile.name);
      const fileUrl = await uploadPrivateFile('documents', path, selectedFile, pct => {
        setUploadProgress(Math.min(90, Math.max(10, pct)));
      });

      // Attempt AI document text extraction & summary
      let summaryContent: string | undefined = undefined;
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((res, rej) => {
          reader.onload = () => {
            const result = reader.result as string;
            res(result.split(',')[1] || result);
          };
          reader.onerror = rej;
          reader.readAsDataURL(selectedFile);
        });
        const fileBase64 = await base64Promise;

        const token = getAccessToken();
        const extractRes = await fetch('/api/documents/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fileBase64,
            mimeType: selectedFile.type || 'application/octet-stream',
            fileName: selectedFile.name
          })
        });

        if (extractRes.ok) {
          const extractData = await extractRes.json();
          if (extractData.extractedText) {
            summaryContent = extractData.extractedText.slice(0, 1000);
          }
        }
      } catch (extractErr) {
        console.warn('Text extraction skipped:', extractErr);
      }

      setUploadProgress(95);

      await addDocument({
        title: title.trim(),
        category,
        fileType: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE',
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        fileUrl,
        storagePath: path,
        description: description || 'Family uploaded record.',
        summaryContent,
        uploaderName: currentUser.name
      });

      setUploadProgress(100);
      setActiveSubScreen('documents');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Document upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title="Upload Family Document"
        subtitle="Store official IDs, medical reports, deeds, or educational certificates in private encrypted storage"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-700/80">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-brand-400'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Document'}
                </p>
                <label className="inline-block mt-2 text-xs font-semibold text-brand-600 hover:underline cursor-pointer">
                  Change file
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Drag and drop your file here, or{' '}
                  <label className="text-brand-600 hover:underline cursor-pointer">
                    browse
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports PDF, DOCX, TXT, PNG, JPG, WEBP (up to 15 MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Encrypting and uploading to private storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Star Health Insurance Policy 2026, Flat 402 Deed"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500"
            >
              <option value="Identity">Identity (Passports, Aadhaar, Driver License)</option>
              <option value="Medical">Medical (Lab Reports, Prescriptions, Vaccination)</option>
              <option value="Insurance">Insurance (Health, Life, Vehicle Policies)</option>
              <option value="Financial">Financial (Tax Returns, Bank Statements)</option>
              <option value="Home">Home (Property Deeds, Rent Agreements, Khata)</option>
              <option value="Education">Education (Certificates, Marksheets, Degrees)</option>
              <option value="Legal">Legal (Wills, Contracts, Affidavits)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Physical Location & Search Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Kept in Bedroom Steel Almirah Locker #2. Policy renewal date is November 30."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveSubScreen('documents')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading to Vault...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Index to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DocumentDetailsModal: React.FC = () => {
  const { documents, selectedItemId, updateDocument, deleteDocument, setActiveSubScreen, setActiveTab, sendAIMessage } = useHomeBrain();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Identity');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const doc = documents.find(d => d.id === selectedItemId);

  React.useEffect(() => {
    if (!doc) return;
    const isImg = ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(doc.fileType.toUpperCase());
    if (isImg && doc.storagePath) {
      setIsLoadingPreview(true);
      void createPrivateFileUrl('documents', doc.storagePath)
        .then(url => setPreviewUrl(url))
        .catch(() => setPreviewUrl(doc.fileUrl || null))
        .finally(() => setIsLoadingPreview(false));
    } else if (isImg && doc.fileUrl) {
      setPreviewUrl(doc.fileUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [doc]);

  if (!doc) return null;
  const startEditing = () => {
    setTitle(doc.title);
    setCategory(doc.category);
    setDescription(doc.description);
    setEditing(true);
  };

  const handleAskAI = () => {
    setActiveSubScreen('none');
    setActiveTab('ai');
    void sendAIMessage(`Tell me details about our family document "${doc.title}" (${doc.category}). Notes: ${doc.description || 'None'}`);
  };

  const handleDownload = async () => {
    setIsOpening(true);
    setError(null);
    try {
      const url = doc.storagePath
        ? await createPrivateFileUrl('documents', doc.storagePath)
        : doc.fileUrl;
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || 'Download failed.');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader
        title={doc.title}
        subtitle={`${doc.category} Document • Uploaded ${doc.uploadDate} by ${doc.uploaderName}`}
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {doc.category}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {doc.fileType} • {doc.fileSize}
            </span>
          </div>
          <button onClick={() => setActiveSubScreen('documents')} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {editing ? (
            <form onSubmit={event => { event.preventDefault(); updateDocument(doc.id, { title, category, description }); setEditing(false); }} className="space-y-3">
              <input required value={title} onChange={event => setTitle(event.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
              <select value={category} onChange={event => setCategory(event.target.value as DocumentCategory)} className="w-full rounded-xl border px-3 py-2 text-sm">
                {['Identity', 'Medical', 'Insurance', 'Financial', 'Home', 'Education', 'Legal'].map(value => <option key={value}>{value}</option>)}
              </select>
              <textarea value={description} onChange={event => setDescription(event.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" rows={3} />
              <div className="flex gap-2"><button type="button" onClick={() => setEditing(false)} className="text-xs px-3 py-2">Cancel</button><button className="rounded-xl bg-brand-600 px-3 py-2 text-xs text-white">Save Metadata</button></div>
            </form>
          ) : (
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{doc.title}</h2>
          )}

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

          {/* Inline Image Preview */}
          {previewUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 max-h-80 flex items-center justify-center">
              <img
                src={previewUrl}
                alt={doc.title}
                className="max-h-72 object-contain rounded-xl shadow-sm"
              />
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-700 space-y-2">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Physical Location & Notes:</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{doc.description}</p>
          </div>

          {doc.summaryContent && (
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-1">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> AI Grounding & Extracted Content:
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-200 whitespace-pre-wrap">{doc.summaryContent}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={startEditing}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Edit Metadata
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete ${doc.title}?`)) {
                  deleteDocument(doc.id);
                  setActiveSubScreen('documents');
                }
              }}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Delete Document
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAskAI}
              className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" /> Ask HomeBrain AI
            </button>

            <button
              type="button"
              disabled={isOpening}
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>

            <button
              type="button"
              disabled={isOpening}
              onClick={async () => {
                setIsOpening(true);
                setError(null);
                try {
                  const url = doc.storagePath
                    ? await createPrivateFileUrl('documents', doc.storagePath)
                    : doc.fileUrl;
                  window.open(url, '_blank', 'noopener,noreferrer');
                } catch (openError) {
                  setError(openError instanceof Error ? openError.message : 'Unable to open document.');
                } finally {
                  setIsOpening(false);
                }
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" /> {isOpening ? 'Opening...' : 'View Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
