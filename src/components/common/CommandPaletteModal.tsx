import React, { useState, useEffect, useRef } from 'react';
import { useHomeBrain, MainTab, SubScreen } from '../../context/HomeBrainContext';
import {
  Search,
  FileText,
  Pill,
  ShoppingCart,
  Calendar,
  Sparkles,
  ShieldAlert,
  Users,
  Bot,
  ArrowRight,
  Clock,
  Command,
  X,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

interface PaletteItem {
  id: string;
  title: string;
  category: string;
  subtitle?: string;
  icon: React.FC<{ className?: string }>;
  action: () => void;
}

export const CommandPaletteModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    setActiveTab,
    setActiveSubScreen,
    navigateToSubScreen,
    documents,
    medicines,
    groceries,
    events,
    familyMembers,
    sendAIMessage
  } = useHomeBrain();

  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Build searchable items index
  const baseItems: PaletteItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      subtitle: 'Household control center & live stats',
      icon: Sparkles,
      action: () => {
        setActiveTab('dashboard');
        setActiveSubScreen('none');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-ai',
      title: 'Open HomeBrain AI Assistant',
      category: 'Navigation',
      subtitle: 'Ask questions grounded in family data',
      icon: Bot,
      action: () => {
        setActiveTab('ai');
        setActiveSubScreen('none');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-vault',
      title: 'Document Vault',
      category: 'Navigation',
      subtitle: `${documents.length} secure passports, insurance & deeds`,
      icon: FileText,
      action: () => {
        navigateToSubScreen('documents');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-upload-doc',
      title: 'Upload New Document to Vault',
      category: 'Quick Action',
      subtitle: 'Store official IDs, medical reports or bills',
      icon: FileText,
      action: () => {
        navigateToSubScreen('upload-document');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-emergency',
      title: 'Emergency SOS Mode',
      category: 'Safety',
      subtitle: 'Send instant GPS alert & notify family contacts',
      icon: ShieldAlert,
      action: () => {
        navigateToSubScreen('emergency');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-calendar',
      title: 'Family Calendar & Schedule',
      category: 'Navigation',
      subtitle: `${events.length} family milestones and appointments`,
      icon: Calendar,
      action: () => {
        navigateToSubScreen('calendar');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-meds',
      title: 'Medicine Manager & Prescriptions',
      category: 'Navigation',
      subtitle: `${medicines.length} active family prescriptions`,
      icon: Pill,
      action: () => {
        navigateToSubScreen('medicine');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-groceries',
      title: 'Smart Grocery & Pantry List',
      category: 'Navigation',
      subtitle: `${groceries.filter(g => !g.isPurchased).length} pending groceries`,
      icon: ShoppingCart,
      action: () => {
        navigateToSubScreen('grocery');
        setIsOpen(false);
      }
    }
  ];

  // Dynamic document records
  const docItems: PaletteItem[] = documents.map(d => ({
    id: `doc-${d.id}`,
    title: d.title,
    category: 'Document Vault',
    subtitle: `${d.category} • ${d.fileType} (${d.fileSize}) ${d.expiryDate ? `• Expires ${d.expiryDate}` : ''}`,
    icon: FileText,
    action: () => {
      navigateToSubScreen('document-details', d.id);
      setIsOpen(false);
    }
  }));

  // Dynamic family members
  const memberItems: PaletteItem[] = familyMembers.map(m => ({
    id: `mem-${m.id}`,
    title: `${m.name} (${m.relation})`,
    category: 'Family Member',
    subtitle: `${m.role} • ${m.phone} • ${m.preferences || 'No specific preferences'}`,
    icon: Users,
    action: () => {
      navigateToSubScreen('family-members');
      setIsOpen(false);
    }
  }));

  // All searchable items
  const allItems = [...baseItems, ...docItems, ...memberItems];

  const filteredItems = query.trim()
    ? allItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : baseItems;

  // Add custom AI query option if user types something
  const displayItems: PaletteItem[] = query.trim()
    ? [
        {
          id: 'ask-ai-direct',
          title: `Ask AI: "${query}"`,
          category: 'HomeBrain Intelligence',
          subtitle: 'Search across all family schedules, records & health knowledge',
          icon: Bot,
          action: () => {
            setActiveSubScreen('none');
            setActiveTab('ai');
            void sendAIMessage(query);
            setIsOpen(false);
          }
        },
        ...filteredItems
      ]
    : filteredItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % displayItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + displayItems.length) % displayItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayItems[selectedIndex]) {
        displayItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      {/* Spotlight Command Modal */}
      <div
        className="w-full max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden transform transition-all animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search family documents, members, medicines..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {displayItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found. Type to query HomeBrain AI assistant.
            </div>
          ) : (
            displayItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.01]'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-brand-100' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-0.5 text-white' : 'opacity-0'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono mr-1">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono mr-1">
                ↵
              </kbd>
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono mr-1">
                esc
              </kbd>
              Close
            </span>
          </div>
          <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
            <Command className="w-3 h-3" /> HomeBrain Spotlight
          </span>
        </div>
      </div>
    </div>
  );
};

