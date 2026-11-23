import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  User,
  Users,
  Pill,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Tag,
  Sparkles,
  Info,
  Download,
  Eye,
  ExternalLink,
  ArrowDownToLine,
  Upload,
  Check,
  Volume2,
  Square,
  VolumeX
} from 'lucide-react';
import { formatIndiaDateTime, formatINR } from '../../lib/display';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { createPrivateFileUrl, isSupabaseConfigured } from '../../lib/supabase';
import { DocumentItem } from '../../types';

interface CleanChatMessageProps {
  text: string;
  isUser: boolean;
  onNavigate?: (screen: any, itemId?: string) => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
}

// Helper to format ISO date or time cleanly
function formatEventDateTime(dateStr?: string, timeStr?: string): { formattedDate: string; formattedTime: string } {
  if (!dateStr) return { formattedDate: '', formattedTime: '' };
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T${timeStr || '00:00:00'}`);
    if (!isNaN(d.getTime())) {
      const formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      let formattedTime = timeStr || '';
      if (timeStr && timeStr.includes(':')) {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const mins = parts[1] || '00';
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        formattedTime = `${h12}:${mins} ${ampm}`;
      }
      return { formattedDate, formattedTime };
    }
  } catch {
    // fallback
  }
  return { formattedDate: dateStr, formattedTime: timeStr || '' };
}

// Clean inline Markdown (bold, italic, tags)
function renderInlineFormatting(rawText: string): React.ReactNode[] {
  // Strip ugly internal demo tags if any
  const sanitized = rawText.replace(/\[DEMO\]\s*/g, '');

  // Split by bold (**text**)
  const parts = sanitized.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {boldContent}
        </strong>
      );
    }
    // Check for inline backtick code
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-mono text-[11px] font-semibold text-brand-700 dark:text-brand-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const CleanChatMessage: React.FC<CleanChatMessageProps> = ({
  text,
  isUser,
  onNavigate,
  isSpeaking: propIsSpeaking,
  onToggleSpeak
}) => {
  if (isUser) {
    return <div className="text-sm font-medium leading-relaxed">{text}</div>;
  }

  const {
    documents,
    groceries,
    toggleGroceryPurchased,
    medicines,
    medicineLogs,
    logMedicineStatus,
    reminders,
    toggleReminder,
    navigateToSubScreen
  } = useHomeBrain();
  const navigate = onNavigate || navigateToSubScreen;
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [loggedMedIds, setLoggedMedIds] = useState<Set<string>>(new Set());
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const isSpeaking = propIsSpeaking !== undefined ? propIsSpeaking : localIsSpeaking;

  const toggleSpeech = () => {
    if (onToggleSpeak) {
      onToggleSpeak();
      return;
    }
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setLocalIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setLocalIsSpeaking(false);
    utterance.onerror = () => setLocalIsSpeaking(false);
    setLocalIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 35,
        spread: 65,
        origin: { y: 0.75 },
        colors: ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b']
      });
    } catch {}
  };

  const isUnavailableNotice = text.includes('Not Available in Document Vault') || text.includes('is not available in your Family Document Vault');

  const handleDownloadDoc = async (doc: DocumentItem) => {
    setDownloadingDocId(doc.id);
    try {
      let downloadUrl = doc.fileUrl;
      if (doc.storagePath && isSupabaseConfigured) {
        try {
          downloadUrl = await createPrivateFileUrl('documents', doc.storagePath);
        } catch (storageErr) {
          console.warn('Storage URL generation error:', storageErr);
        }
      }

      if (downloadUrl) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${doc.title}.${(doc.fileType || 'png').toLowerCase()}`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // If document record exists without binary blob, generate verified record file
      const content = `HOMEBRAIN FAMILY DOCUMENT RECORD\n=================================\n` +
        `Title: ${doc.title}\n` +
        `Category: ${doc.category}\n` +
        `File Type: ${doc.fileType}\n` +
        `File Size: ${doc.fileSize}\n` +
        `Uploaded By: ${doc.uploaderName} on ${doc.uploadDate}\n\n` +
        `Extracted Information & Notes:\n${doc.summaryContent || doc.description || 'Verified Household Record'}\n`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const fallbackUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_record.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(fallbackUrl);
    } catch (err) {
      console.error('Download failed, navigating to document details:', err);
      if (navigate) navigate('document-details', doc.id);
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Parse lines to detect structured sections and clean cards
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length === 0) return;
    const items = [...currentListItems];
    currentListItems = [];

    // Check if these list items represent Bills
    const isBillList = items.some(it => /(?:₹|rs\.|inr)\s*\d+/i.test(it) && /due|bill|electric|water|maintenance|gas/i.test(it)) || text.includes('Pending Household Bills') || text.includes('Household Bills');
    // Check if these list items represent Events
    const isEventList = !isBillList && items.some(it => /\d{4}-\d{2}-\d{2}/.test(it) || /birthday|anniversary|exam|match|appointment|doctor|checkup/i.test(it));
    // Check if these list items represent Reminders / Tasks
    const isReminderList = !isEventList && !isBillList && (
      items.some(it => /remind|task|todo|priority|assigned/i.test(it)) ||
      text.includes('Reminders') ||
      text.includes('Household Tasks') ||
      text.includes('Pending Tasks')
    );
    const isAssistantSummary = text.includes('Autonomous Cognitive Assistant Summary') || text.includes('live records across') || text.includes('tables consulted');
    const isUnavailableNotice = text.includes('Not Available in Document Vault') || text.includes('is not available in your Family Document Vault');
    // Check if these list items represent Document Vault Records
    const isDocumentList = !isAssistantSummary && !isUnavailableNotice && (
      text.includes('has been found in your Document Vault') ||
      text.includes('Document Vault Records') ||
      text.includes('Retrieved Document') ||
      items.some(it =>
        /file size|file type|uploaded by|\b(?:png|jpg|jpeg|pdf|docx|txt)\b/i.test(it)
      )
    );
    // Check if these list items represent Medicines
    const isMedicineList = !isDocumentList && !text.includes('Document Vault') && items.some(it => /\b\d+\s*mg\b|\btablet|\bcapsule|\binhaler|\bdosage\b|\bprescribed for\b/i.test(it) && !it.includes('₹'));
    // Check if these list items represent Groceries
    const isGroceryList = !isAssistantSummary && !isDocumentList && items.some(it => /category:|kg|litre|pack|buy|grocery/i.test(it));
    // Check if these list items represent Allergies / Health warnings
    const isAllergyList = !isAssistantSummary && !isDocumentList && items.some(it => /critical allergy|allergic to|blood group|asthma|penicillin|anaphyla/i.test(it));

    if (isReminderList) {
      renderedElements.push(
        <div key={`reminders-${renderedElements.length}`} className="grid grid-cols-1 gap-2 my-2.5">
          {items.map((rawItem, idx) => {
            const clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            const matchedRem = reminders.find(r => {
              const rt = r.title.toLowerCase().replace(/\[demo\]\s*/g, '').trim();
              return clean.toLowerCase().includes(rt) || rt.includes(clean.toLowerCase());
            });

            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center justify-between gap-2.5 hover:border-brand-400 transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className={`text-xs space-y-0.5 leading-relaxed ${matchedRem?.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {renderInlineFormatting(clean)}
                  </div>
                </div>

                {matchedRem && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!matchedRem.completed) triggerCelebration();
                      toggleReminder(matchedRem.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 ${
                      matchedRem.completed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{matchedRem.completed ? 'Completed ✓' : 'Complete Task'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      );
      return;
    }

    if (isEventList) {
      renderedElements.push(
        <div key={`events-${renderedElements.length}`} className="grid grid-cols-1 gap-2 my-2.5">
          {items.map((rawItem, idx) => {
            const clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            // Parse: **2026-03-10 at 18:30:00**: Sarah's Birthday (Birthday) - Members: Sarah, Father, Mother
            const dateMatch = clean.match(/(?:(?:\*\*)?(\d{4}-\d{2}-\d{2})(?:(?:\s+at\s+([0-9:]+))?)(?:\*\*)?):?\s*(.+)/i);
            if (dateMatch) {
              const rawDate = dateMatch[1];
              const rawTime = dateMatch[2] || '';
              const rest = dateMatch[3];
              const { formattedDate, formattedTime } = formatEventDateTime(rawDate, rawTime);

              // Extract Category in parentheses if any
              const catMatch = rest.match(/^([^(]+?)(?:\s*\(([^)]+)\))?(?:\s*-\s*Members:\s*(.+))?$/i);
              const title = catMatch ? catMatch[1].trim() : rest;
              const category = catMatch && catMatch[2] ? catMatch[2].trim() : 'Event';
              const members = catMatch && catMatch[3] ? catMatch[3].split(',').map(m => m.trim()) : [];

              const matchedRem = reminders.find(r => {
                const rt = r.title.toLowerCase().replace(/\[demo\]\s*/g, '').trim();
                return title.toLowerCase().includes(rt) || rt.includes(title.toLowerCase());
              });

              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm hover:border-brand-400 dark:hover:border-brand-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5 overflow-hidden">
                    <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {title.replace(/\*\*/g, '')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {category}
                        </span>
                      </div>
                      {members.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>Attendees: {members.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formattedDate} {formattedTime ? `• ${formattedTime}` : ''}
                    </span>

                    {matchedRem && (
                      <button
                        type="button"
                        onClick={() => toggleReminder(matchedRem.id)}
                        className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all ${
                          matchedRem.completed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{matchedRem.completed ? 'Done ✓' : 'Complete'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // Fallback list item
            return (
              <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                {renderInlineFormatting(clean)}
              </div>
            );
          })}
        </div>
      );
      return;
    }

    if (isMedicineList) {
      renderedElements.push(
        <div key={`meds-${renderedElements.length}`} className="grid grid-cols-1 gap-2 my-2.5">
          {items.map((rawItem, idx) => {
            const clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            const matchedMed = medicines.find(m => {
              const mn = m.name.toLowerCase().replace('[demo] ', '').trim();
              return clean.toLowerCase().includes(mn);
            });
            const isLogged = matchedMed
              ? loggedMedIds.has(matchedMed.id) ||
                medicineLogs.some(
                  l => (l.medicineId === matchedMed.id || (l as any).medicine_id === matchedMed.id) &&
                       (l.status === 'Taken' || (l as any).status === 'taken')
                )
              : false;

            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-start justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-0.5 leading-relaxed">
                    {renderInlineFormatting(clean)}
                  </div>
                </div>

                {matchedMed && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerCelebration();
                      logMedicineStatus(matchedMed.id, 'Taken');
                      setLoggedMedIds(prev => new Set(prev).add(matchedMed.id));
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 transition-all ${
                      isLogged
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isLogged ? 'Taken ✓' : 'Mark Taken'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      );
      return;
    }

    if (isBillList) {
      renderedElements.push(
        <div key={`bills-${renderedElements.length}`} className="grid grid-cols-1 gap-2 my-2.5">
          {items.map((rawItem, idx) => {
            const clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-xs">{renderInlineFormatting(clean)}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
      return;
    }

    if (isGroceryList) {
      renderedElements.push(
        <div key={`groceries-${renderedElements.length}`} className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5">
          {items.map((rawItem, idx) => {
            const clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            const matchedG = groceries.find(g => clean.toLowerCase().includes(g.name.toLowerCase()));

            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className={`truncate ${matchedG?.isPurchased ? 'line-through text-slate-400' : ''}`}>
                    {renderInlineFormatting(clean)}
                  </span>
                </div>
                {matchedG && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!matchedG.isPurchased) triggerCelebration();
                      toggleGroceryPurchased(matchedG.id);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
                      matchedG.isPurchased
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {matchedG.isPurchased ? 'Bought ✓' : 'Bought?'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      );
      return;
    }

    if (isAllergyList) {
      renderedElements.push(
        <div key={`allergies-${renderedElements.length}`} className="space-y-2 my-2.5">
          {items.map((rawItem, idx) => {
            const clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 shadow-sm flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-100"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{renderInlineFormatting(clean)}</div>
              </div>
            );
          })}
        </div>
      );
      return;
    }

    if (isDocumentList) {
      // Find document referenced in the overall message text (e.g. from header "sham 11th mark sheet has been found...")
      const docFromMessageText = documents.find(d => {
        const dt = (d.title || '').toLowerCase();
        return dt.length >= 3 && text.toLowerCase().includes(dt);
      }) || documents.find(d => {
        const dt = (d.title || '').toLowerCase();
        if (/\b11th\b/i.test(text) && dt.includes('11th')) return true;
        if (/\b10th\b/i.test(text) && dt.includes('10th')) return true;
        if (/\b12th\b/i.test(text) && dt.includes('12th')) return true;
        if (/\baadhaar|aadhar\b/i.test(text) && dt.includes('aadhar')) return true;
        if (/\bpan\b/i.test(text) && dt.includes('pan')) return true;
        return false;
      });

      // If this is a single found document announced in header and items are separate metadata bullets (Category, File, Summary),
      // collapse them into 1 unified document item so we don't render 3 fragmented boxes.
      const isSingleFoundDoc = text.includes('has been found in your Document Vault');
      const isPropertyBulletList = isSingleFoundDoc && items.every(it => /^(?:[•\-*]\s*)?\*?\*?(?:Category|File|Summary|Uploaded|Size)\*?\*?:/i.test(it.trim()));
      const displayItems = isPropertyBulletList
        ? [items.map(it => it.replace(/^[•\-\*]\s*/, '').trim()).join('  •  ')]
        : items;

      renderedElements.push(
        <div key={`docs-${renderedElements.length}`} className="space-y-2.5 my-2.5">
          {displayItems.map((rawItem, idx) => {
            let clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            if (/summary:/i.test(clean)) {
              const rawSum = clean.replace(/^.*summary:\s*/i, '');
              const hasBinary = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(rawSum) || /[©ÿ®¬±µ¶¿À-ÿ]{2,}/.test(rawSum) || /%PDF/i.test(rawSum);
              const printable = rawSum.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || [];
              if (hasBinary || (rawSum.length > 15 && (printable.length / rawSum.length) < 0.70)) {
                clean = clean.replace(/(summary:\s*).*/i, '$1Verified official educational record. Securely indexed in Document Vault.');
              }
            }
            // Extract title before the parenthesis: e.g. "aadhar (Identity, PNG - 1.68 MB)..."
            const rawTitle = clean.split('(')[0].replace(/[*•-]/g, '').trim().toLowerCase();
            const matchedDoc = docFromMessageText || documents.find(d => {
              const dt = (d.title || '').toLowerCase();
              return dt === rawTitle || rawTitle.includes(dt) || dt.includes(rawTitle) || clean.toLowerCase().includes(dt);
            }) || documents.find(d => {
              const dt = (d.title || '').toLowerCase();
              if (/\b11th\b/i.test(clean) && dt.includes('11th')) return true;
              if (/\b10th\b/i.test(clean) && dt.includes('10th')) return true;
              if (/\b12th\b/i.test(clean) && dt.includes('12th')) return true;
              return false;
            }) || (documents.length === 1 ? documents[0] : undefined);

            const isDownloading = matchedDoc ? downloadingDocId === matchedDoc.id : false;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex flex-col gap-2.5 hover:border-brand-400 dark:hover:border-brand-500 transition-all"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-xs leading-relaxed space-y-1">
                      {renderInlineFormatting(clean)}
                    </div>
                  </div>
                </div>

                {/* Expiry Warning if present */}
                {matchedDoc?.expiryDate && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Expiry / Renewal Date: <strong className="font-bold">{matchedDoc.expiryDate}</strong></span>
                  </div>
                )}

                {/* Instant Download & View Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => matchedDoc && handleDownloadDoc(matchedDoc)}
                    disabled={!matchedDoc || isDownloading}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>{isDownloading ? 'Downloading...' : 'Download Document'}</span>
                  </button>

                  {matchedDoc && navigate && (
                    <button
                      type="button"
                      onClick={() => navigate('document-details', matchedDoc.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  )}

                  {navigate && (
                    <button
                      type="button"
                      onClick={() => navigate('documents')}
                      className="ml-auto text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                    >
                      Vault Records →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
      return;
    }

    // Standard styled list
    renderedElements.push(
      <div key={`list-${renderedElements.length}`} className="space-y-1.5 my-2">
        {items.map((it, idx) => {
          const clean = it.replace(/^[•\-\*]\s*/, '');
          return (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
              <div>{renderInlineFormatting(clean)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      flushList();
      continue;
    }

    // Is it a list bullet item?
    if (/^[•\-\*]\s+/.test(rawLine)) {
      currentListItems.push(rawLine);
      continue;
    }

    // Flush any pending list
    flushList();

    // Is it a single retrieved document banner?
    if (rawLine.includes('📄') && rawLine.includes('Retrieved Document')) {
      const docName = rawLine.replace(/📄|\*\*|Retrieved Document:?/gi, '').split('(')[0].trim().toLowerCase();
      const matchedDoc = documents.find(d => {
        const dt = (d.title || '').toLowerCase();
        return dt === docName || dt.includes(docName) || docName.includes(dt);
      });

      const isDownloading = matchedDoc ? downloadingDocId === matchedDoc.id : false;

      renderedElements.push(
        <div key={`retrieved-doc-banner-${renderedElements.length}`} className="p-3 my-2 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {rawLine.replace(/📄/g, '').trim()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {matchedDoc && (
              <button
                type="button"
                onClick={() => handleDownloadDoc(matchedDoc)}
                disabled={isDownloading}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
              >
                <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Downloading...' : 'Download Document'}</span>
              </button>
            )}
            {matchedDoc && navigate && (
              <button
                type="button"
                onClick={() => navigate('document-details', matchedDoc.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
            )}
          </div>
        </div>
      );
      continue;
    }

    // Is it a header? (e.g. 📅 **Upcoming Family Events** or ### Header)
    const headerMatch = rawLine.match(/^(?:###|##|\*\*|📅|💊|🛒|💳|⚡|⚠️|📄|❌)\s*(.+?)(?:\*\*)?:?$/i);
    const isExplicitHeader = rawLine.startsWith('###') || rawLine.startsWith('##') || (rawLine.startsWith('**') && rawLine.endsWith('**') && rawLine.length < 80);
    const hasLeadingEmoji = /^(?:📅|💊|🛒|💳|⚡|⚠️|🧠|🎂|🩺|📊|✅|📁|📄|❌)/.test(rawLine);

    if (isExplicitHeader || hasLeadingEmoji) {
      const emojiMatch = rawLine.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
      const emoji = emojiMatch ? emojiMatch[1] : null;
      const cleanTitle = rawLine.replace(/^[#\*\s]+/, '').replace(/[\*:]+$/, '').replace(/\[DEMO\]\s*/g, '');

      renderedElements.push(
        <div key={`header-${renderedElements.length}`} className="flex items-center gap-2 pt-2 pb-1 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
          {emoji && <span className="text-base">{emoji}</span>}
          <span>{cleanTitle.replace(emoji || '', '').trim()}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph text
    renderedElements.push(
      <p key={`p-${renderedElements.length}`} className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {renderInlineFormatting(rawLine)}
      </p>
    );
  }

  // Flush remaining
  flushList();

  return (
    <div className="space-y-2">
      {renderedElements}
      {isUnavailableNotice && navigate && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('upload-document')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Upload className="w-4 h-4" /> Upload Missing Document to Vault
          </button>
        </div>
      )}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={toggleSpeech}
          className={`flex items-center gap-1.5 text-[11px] font-bold py-1 px-3 rounded-xl transition-all shadow-sm ${
            isSpeaking
              ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 shadow-md animate-pulse active:scale-95'
              : 'text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={isSpeaking ? 'Stop speaking audio immediately' : 'Listen to response (Text-to-Speech)'}
        >
          {isSpeaking ? (
            <>
              <Square className="w-3 h-3 fill-current text-white" />
              <span>Stop Speaking</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
