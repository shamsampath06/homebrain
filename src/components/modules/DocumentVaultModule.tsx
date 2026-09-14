import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { DocumentCategory, DocumentItem } from '../../types';
import { FileText, Upload, Search, Download, Trash2, ShieldCheck, Eye, Plus, X, FileCode } from 'lucide-react';

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

  const categories = ['All', 'Identity', 'Medical', 'Insurance', 'Financial', 'Home', 'Education', 'Legal'];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.summaryContent && doc.summaryContent.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveSubScreen('none')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-1 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            📄 Family Document Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Securely store, organize, and query passports, health insurance, deeds, and records
          </p>
        </div>
        <button
          onClick={() => navigateToSubScreen('upload-document')}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

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
                    onClick={() => deleteDocument(doc.id)}
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

  const handleFileSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      if (!title) setTitle(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addDocument({
      title: title.endsWith('.pdf') || title.endsWith('.png') ? title : `${title}.pdf`,
      category,
      fileType: 'PDF',
      fileSize: '2.5 MB',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      description: description || 'Family uploaded record.',
      summaryContent: `Indexed content for ${title}. Stored safely under ${category} category.`,
      uploaderName: currentUser.name
    });

    setActiveSubScreen('documents');
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Family Document</h2>
        <button onClick={() => setActiveSubScreen('documents')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-brand-400 transition-colors">
          <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {fileName ? `Selected File: ${fileName}` : 'Click to choose PDF or Image file'}
          </p>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSimulate}
            className="mt-2 text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Passport Copy, Star Health Insurance"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as DocumentCategory)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          >
            <option value="Identity">Identity (Passports, IDs)</option>
            <option value="Medical">Medical Records</option>
            <option value="Insurance">Insurance Policies</option>
            <option value="Financial">Financial Documents</option>
            <option value="Home">Home & Property Deeds</option>
            <option value="Education">Education & School Certificates</option>
            <option value="Legal">Legal Contracts</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Location Notes</label>
          <textarea
            rows={3}
            placeholder="e.g. Stored in Top Master Bedroom Safe #2..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSubScreen('documents')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md"
          >
            Upload to Vault
          </button>
        </div>
      </form>
    </div>
  );
};

export const DocumentDetailsModal: React.FC = () => {
  const { documents, selectedItemId, deleteDocument, setActiveSubScreen } = useHomeBrain();
  const doc = documents.find(d => d.id === selectedItemId);

  if (!doc) return null;

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
          {doc.category}
        </span>
        <button onClick={() => setActiveSubScreen('documents')} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{doc.title}</h2>
        <p className="text-xs text-slate-500">Uploaded by {doc.uploaderName} on {doc.uploadDate}</p>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-700 space-y-2">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Description & Location:</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">{doc.description}</p>
        </div>

        {doc.summaryContent && (
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-1">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> AI Grounding Summary:
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200">{doc.summaryContent}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => {
            deleteDocument(doc.id);
            setActiveSubScreen('documents');
          }}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Delete Document
        </button>
        <div className="flex items-center gap-2">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
        </div>
      </div>
    </div>
  );
};
