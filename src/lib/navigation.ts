import type { MainTab, SubScreen } from '../context/HomeBrainContext';

interface ScreenMeta {
  label: string;
  /** The screen the Back button falls back to when there is no in-app history. */
  parent: SubScreen;
  /** Which main tab this screen belongs to (for breadcrumbs and sidebar highlighting). */
  tab: MainTab;
}

export const TAB_LABELS: Record<MainTab, string> = {
  dashboard: 'Dashboard',
  ai: 'HomeBrain AI',
  timeline: 'Family Timeline',
  profile: 'Profile & Settings'
};

export const SCREEN_META: Record<Exclude<SubScreen, 'none'>, ScreenMeta> = {
  calendar: { label: 'Calendar & Events', parent: 'none', tab: 'dashboard' },
  'add-event': { label: 'New Event', parent: 'calendar', tab: 'dashboard' },
  'edit-event': { label: 'Edit Event', parent: 'calendar', tab: 'dashboard' },
  'event-details': { label: 'Event Details', parent: 'calendar', tab: 'dashboard' },
  documents: { label: 'Document Vault', parent: 'none', tab: 'dashboard' },
  'upload-document': { label: 'Upload Document', parent: 'documents', tab: 'dashboard' },
  'document-details': { label: 'Document Details', parent: 'documents', tab: 'dashboard' },
  grocery: { label: 'Smart Grocery List', parent: 'none', tab: 'dashboard' },
  'add-grocery': { label: 'Add Grocery Item', parent: 'grocery', tab: 'dashboard' },
  'edit-grocery': { label: 'Edit Grocery Item', parent: 'grocery', tab: 'dashboard' },
  'grocery-history': { label: 'Purchase History', parent: 'grocery', tab: 'dashboard' },
  reminders: { label: 'Reminders', parent: 'none', tab: 'dashboard' },
  'add-reminder': { label: 'New Reminder', parent: 'reminders', tab: 'dashboard' },
  'edit-reminder': { label: 'Edit Reminder', parent: 'reminders', tab: 'dashboard' },
  medicine: { label: 'Medication & Compliance', parent: 'none', tab: 'dashboard' },
  'add-medicine': { label: 'Add Medication', parent: 'medicine', tab: 'dashboard' },
  'edit-medicine': { label: 'Edit Medication', parent: 'medicine', tab: 'dashboard' },
  'medicine-details': { label: 'Medication Details', parent: 'medicine', tab: 'dashboard' },
  'medicine-history': { label: 'Dose History', parent: 'medicine', tab: 'dashboard' },
  expense: { label: 'Household Finances', parent: 'none', tab: 'dashboard' },
  'add-expense': { label: 'Add Expense', parent: 'expense', tab: 'dashboard' },
  'edit-expense': { label: 'Edit Expense', parent: 'expense', tab: 'dashboard' },
  'expense-history': { label: 'Expense History', parent: 'expense', tab: 'dashboard' },
  'bill-management': { label: 'Bills', parent: 'expense', tab: 'dashboard' },
  'edit-bill': { label: 'Edit Bill', parent: 'bill-management', tab: 'dashboard' },
  knowledge: { label: 'Family Knowledge', parent: 'none', tab: 'dashboard' },
  'add-knowledge': { label: 'Add Knowledge', parent: 'knowledge', tab: 'dashboard' },
  'edit-knowledge': { label: 'Edit Knowledge', parent: 'knowledge', tab: 'dashboard' },
  'knowledge-details': { label: 'Knowledge Details', parent: 'knowledge', tab: 'dashboard' },
  emergency: { label: 'Emergency SOS', parent: 'none', tab: 'dashboard' },
  'add-memory': { label: 'New Memory', parent: 'none', tab: 'timeline' },
  'edit-memory': { label: 'Edit Memory', parent: 'none', tab: 'timeline' },
  'memory-details': { label: 'Memory', parent: 'none', tab: 'timeline' },
  'user-profile': { label: 'My Profile', parent: 'none', tab: 'profile' },
  'family-members': { label: 'Family Members', parent: 'none', tab: 'profile' },
  'family-hub': { label: 'Family Hub', parent: 'none', tab: 'profile' },
  settings: { label: 'Settings', parent: 'none', tab: 'profile' },
  privacy: { label: 'Privacy & Security', parent: 'none', tab: 'profile' },
  auth: { label: 'Sign In / Account', parent: 'none', tab: 'profile' },
  login: { label: 'Sign In / Account', parent: 'none', tab: 'profile' }
};

const TABS: MainTab[] = ['dashboard', 'ai', 'timeline', 'profile'];

export const isSubScreen = (value: string): value is Exclude<SubScreen, 'none'> => value in SCREEN_META;

/** Builds the breadcrumb chain for the current screen, e.g. Dashboard › Document Vault › Upload Document. */
export const buildBreadcrumbs = (tab: MainTab, sub: SubScreen): Array<{ label: string; tab: MainTab; sub: SubScreen }> => {
  const chain: Array<{ label: string; tab: MainTab; sub: SubScreen }> = [];
  let cursor: SubScreen = sub;
  let guard = 0;
  while (cursor !== 'none' && guard < 6) {
    const meta = SCREEN_META[cursor];
    chain.unshift({ label: meta.label, tab: meta.tab, sub: cursor });
    cursor = meta.parent;
    guard += 1;
  }
  const rootTab = sub !== 'none' ? SCREEN_META[sub].tab : tab;
  chain.unshift({ label: TAB_LABELS[rootTab], tab: rootTab, sub: 'none' });
  return chain;
};

/** Hash format: #/<tab>[/<subscreen>[/<itemId>]]. Legacy "#documents" is still accepted. */
export const buildHash = (tab: MainTab, sub: SubScreen, itemId: string | null): string => {
  if (sub === 'none') return `#/${tab}`;
  return `#/${tab}/${sub}${itemId ? `/${encodeURIComponent(itemId)}` : ''}`;
};

export const parseHash = (hash: string): { tab: MainTab; sub: SubScreen; itemId: string | null } | null => {
  // OAuth callbacks put tokens in the hash; never treat those as routes.
  if (!hash || hash.includes('=')) return null;
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const [first, second, third] = parts;
  if (TABS.includes(first as MainTab)) {
    const tab = first as MainTab;
    if (second && isSubScreen(second)) return { tab, sub: second, itemId: third ? decodeURIComponent(third) : null };
    return { tab, sub: 'none', itemId: null };
  }
  if (isSubScreen(first)) return { tab: SCREEN_META[first].tab, sub: first, itemId: second ? decodeURIComponent(second) : null };
  return null;
};

