import React from 'react';
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
  Info
} from 'lucide-react';
import { formatIndiaDateTime, formatINR } from '../../lib/display';

interface CleanChatMessageProps {
  text: string;
  isUser: boolean;
  onNavigate?: (screen: any, itemId?: string) => void;
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

export const CleanChatMessage: React.FC<CleanChatMessageProps> = ({ text, isUser, onNavigate }) => {
  if (isUser) {
    return <div className="text-sm font-medium leading-relaxed">{text}</div>;
  }

  // Parse lines to detect structured sections and clean cards
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length === 0) return;
    const items = [...currentListItems];
    currentListItems = [];

    // Check if these list items represent Events
    const isEventList = items.some(it => /\d{4}-\d{2}-\d{2}/.test(it) || /birthday|anniversary|exam|match|appointment|doctor|checkup/i.test(it));
    // Check if these list items represent Medicines
    const isMedicineList = items.some(it => /for |mg|tablet|capsule|frequency|inhaler/i.test(it) && !it.includes('₹'));
    // Check if these list items represent Bills
    const isBillList = items.some(it => /(?:₹|rs\.|inr)\s*\d+/i.test(it) && /due|bill|electric|water|maintenance|gas/i.test(it));
    // Check if these list items represent Groceries
    const isGroceryList = items.some(it => /category:|kg|litre|pack|buy|grocery/i.test(it));
    // Check if these list items represent Allergies / Health warnings
    const isAllergyList = items.some(it => /critical|allergy|allergic|blood group|asthma/i.test(it));
    // Check if these list items represent Document Vault Records
    const isDocumentList = items.some(it => /passport|insurance|vault|policy|certificate|license|document|file size|file type/i.test(it));

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
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-start gap-2.5"
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-0.5 leading-relaxed">
                  {renderInlineFormatting(clean)}
                </div>
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
            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-2 text-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{renderInlineFormatting(clean)}</span>
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
      renderedElements.push(
        <div key={`docs-${renderedElements.length}`} className="space-y-2 my-2.5">
          {items.map((rawItem, idx) => {
            const clean = rawItem.replace(/^[•\-\*]\s*/, '').replace(/\[DEMO\]\s*/g, '');
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-xs leading-relaxed space-y-1">
                      {renderInlineFormatting(clean)}
                    </div>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('documents')}
                      className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] shrink-0 transition-colors"
                    >
                      View in Vault →
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

    // Is it a header? (e.g. 📅 **Upcoming Family Events** or ### Header)
    const headerMatch = rawLine.match(/^(?:###|##|\*\*|📅|💊|🛒|💳|⚡|⚠️)\s*(.+?)(?:\*\*)?:?$/i);
    const isExplicitHeader = rawLine.startsWith('###') || rawLine.startsWith('##') || (rawLine.startsWith('**') && rawLine.endsWith('**') && rawLine.length < 80);
    const hasLeadingEmoji = /^(?:📅|💊|🛒|💳|⚡|⚠️|🧠|🎂|🩺|📊|✅|📁)/.test(rawLine);

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

  return <div className="space-y-2">{renderedElements}</div>;
};
