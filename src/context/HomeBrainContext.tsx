import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  FamilyMember,
  FamilyEvent,
  ReminderItem,
  DocumentItem,
  DocumentCategory,
  GroceryItem,
  GroceryHistoryItem,
  MedicineItem,
  MedicineLog,
  ExpenseItem,
  ExpenseCategory,
  BillItem,
  FamilyKnowledge,
  FamilyKnowledgeFile,
  EmergencyContact,
  EmergencyAlertLog,
  EmergencyNotification,
  EmergencySession,
  FamilyMemory,
  AIMessage
} from '../types';
import { getSosRecipients } from '../lib/sos';
import {
  deleteRow,
  insertRow,
  isSupabaseConfigured,
  loadFamilyData,
  loadEmergencyData,
  listFamilyProfiles,
  signUpWithPassword,
  signInWithPassword,
  signInWithGoogleAccount,
  signOut,
  updatePassword,
  updateRow,
  deletePrivateFile,
  clearStoredSession,
  getAuthenticatedProfile,
  refreshSession,
  getAccessToken,
  handleOAuthCallback,
  ensureValidUUID,
  dedupeMembers
} from '../lib/supabase';
import { formatIndiaDateTime, formatINR } from '../lib/display';
import { SCREEN_META } from '../lib/navigation';
import {
  getDemoFamilySnapshot,
  isDemoItem,
  isDemoMember,
  isDemoEnabledForFamily,
  setDemoEnabledForFamily
} from '../lib/demoData';
import { matchHomeBrainTrainedDialogue } from '../lib/botTraining';

export type MainTab = 'dashboard' | 'ai' | 'timeline' | 'profile';
export type SubScreen =
  | 'none'
  | 'calendar'
  | 'add-event'
  | 'edit-event'
  | 'event-details'
  | 'documents'
  | 'upload-document'
  | 'document-details'
  | 'grocery'
  | 'add-grocery'
  | 'edit-grocery'
  | 'reminders'
  | 'add-reminder'
  | 'edit-reminder'
  | 'grocery-history'
  | 'medicine'
  | 'add-medicine'
  | 'edit-medicine'
  | 'medicine-details'
  | 'medicine-history'
  | 'expense'
  | 'add-expense'
  | 'edit-expense'
  | 'expense-history'
  | 'bill-management'
  | 'edit-bill'
  | 'knowledge'
  | 'add-knowledge'
  | 'edit-knowledge'
  | 'knowledge-details'
  | 'emergency'
  | 'add-memory'
  | 'edit-memory'
  | 'memory-details'
  | 'user-profile'
  | 'family-members'
  | 'family-hub'
  | 'settings'
  | 'privacy'
  | 'auth'
  | 'login';

interface HomeBrainContextType {
  // Navigation State
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  activeSubScreen: SubScreen;
  setActiveSubScreen: (sub: SubScreen) => void;
  dashboardView: 'command-center' | 'modules';
  setDashboardView: (view: 'command-center' | 'modules') => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  navigateToSubScreen: (sub: SubScreen, itemId?: string) => void;
  goBack: () => void;

  // Theme & User
  currentUser: User;
  updateCurrentUser: (updated: Partial<User>) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Family Members
  familyMembers: FamilyMember[];
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (id: string, updated: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;

  // Events & Calendar
  events: FamilyEvent[];
  addEvent: (event: Omit<FamilyEvent, 'id'>) => void;
  updateEvent: (id: string, updated: Partial<FamilyEvent>) => void;
  deleteEvent: (id: string) => void;

  // Reminders
  reminders: ReminderItem[];
  addReminder: (reminder: Omit<ReminderItem, 'id'>) => void;
  updateReminder: (id: string, updated: Partial<ReminderItem>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;

  // Documents
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate'>) => Promise<void>;
  updateDocument: (id: string, updated: Partial<DocumentItem>) => void;
  deleteDocument: (id: string) => void;

  // Groceries
  groceries: GroceryItem[];
  groceryHistory: GroceryHistoryItem[];
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'isPurchased'>) => void;
  updateGroceryItem: (id: string, updated: Partial<GroceryItem>) => void;
  toggleGroceryPurchased: (id: string) => void;
  deleteGroceryItem: (id: string) => void;

  // Medicines
  medicines: MedicineItem[];
  medicineLogs: MedicineLog[];
  addMedicine: (med: Omit<MedicineItem, 'id'>) => void;
  updateMedicine: (id: string, updated: Partial<MedicineItem>) => void;
  deleteMedicine: (id: string) => void;
  logMedicineStatus: (medicineId: string, status: 'Taken' | 'Missed') => void;

  // Expenses & Bills
  expenses: ExpenseItem[];
  bills: BillItem[];
  addExpense: (exp: Omit<ExpenseItem, 'id'>) => void;
  updateExpense: (id: string, updated: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;
  addBill: (bill: Omit<BillItem, 'id' | 'isPaid'>) => void;
  updateBill: (id: string, updated: Partial<BillItem>) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (id: string) => void;
  markBillUnpaid: (id: string) => void;

  // Knowledge
  knowledgeList: FamilyKnowledge[];
  addKnowledge: (knw: Omit<FamilyKnowledge, 'id' | 'createdDate'>) => void;
  updateKnowledge: (id: string, updated: Partial<FamilyKnowledge>) => void;
  deleteKnowledge: (id: string) => void;
  knowledgeFiles: FamilyKnowledgeFile[];
  addKnowledgeFile: (file: Omit<FamilyKnowledgeFile, 'id' | 'createdAt'>) => void;
  updateKnowledgeFile: (id: string, updated: Partial<FamilyKnowledgeFile>) => void;
  deleteKnowledgeFile: (id: string) => void;

  // Emergency
  emergencyContacts: EmergencyContact[];
  emergencyLogs: EmergencyAlertLog[];
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateEmergencyContact: (id: string, updated: Partial<EmergencyContact>) => void;
  deleteEmergencyContact: (id: string) => void;
  triggerEmergencyAlert: (location: {
    address: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    mapUrl?: string;
    locationSource?: 'gps' | 'home' | 'custom' | string;
    idempotencyKey?: string;
  }) => Promise<EmergencyAlertLog>;
  cancelEmergencyAlert: (params?: {
    sessionId?: string;
    reason?: string;
    address?: string;
  }) => Promise<{ success: boolean; message: string; smsResults?: any[]; emailResults?: any[] }>;
  retryEmergencyAlert: (params: {
    failedSmsContacts?: any[];
    failedEmailContacts?: any[];
    address: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  }) => Promise<{ success: boolean; smsResults?: any[]; emailResults?: any[] }>;
  emergencySession: EmergencySession | null;
  emergencyNotifications: EmergencyNotification[];
  startEmergencySession: (location: { address: string; latitude: number; longitude: number; accuracyMeters?: number }) => Promise<void>;
  updateEmergencySessionLocation: (location: { address: string; latitude: number; longitude: number; accuracyMeters?: number }) => Promise<void>;
  endEmergencySession: () => Promise<void>;
  openEmergencyNotification: (notification: EmergencyNotification) => void;

  // Family Timeline
  memories: FamilyMemory[];
  addMemory: (mem: Omit<FamilyMemory, 'id'>) => Promise<void>;
  updateMemory: (id: string, updated: Partial<FamilyMemory>) => Promise<void>;
  deleteMemory: (id: string) => void;

  // AI Assistant
  aiMessages: AIMessage[];
  isAITyping: boolean;
  sendAIMessage: (text: string, attachments?: { name: string; url: string; type: string }[]) => Promise<void>;
  clearAIConversation: () => void;

  // Data synchronization
  isDataLoading: boolean;
  dataError: string | null;
  clearDataError: () => void;
  refreshFamilyData: () => Promise<void>;
  isAuthenticated: boolean;
  enterDemoMode: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (options: {
    email: string;
    name?: string;
    relation?: string;
    role?: User['role'];
    inviteCode?: string;
    mode?: 'create' | 'join';
  }) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    familyName: string,
    inviteCode?: string,
    relation?: string,
    role?: User['role'],
    mode?: 'create' | 'join'
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, password: string) => Promise<void>;
}

const HomeBrainContext = createContext<HomeBrainContextType | undefined>(undefined);

const emptyUser: User = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  role: 'Member',
  familyId: '',
  familyName: ''
};

const getInitialActiveUser = (): User => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('homebrain_active_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && (u.email || u.id)) {
          if (!u.inviteCode || u.inviteCode === 'HB-849201') u.inviteCode = 'HB-JBZKW5';
          if (!u.familyName || u.familyName.includes('Kumar')) u.familyName = 'Family Household';
          if (u.familyId === 'demo-family-kumar' || u.familyId === '00000000-0000-4000-8000-000000000001') {
            u.familyId = '3a131e95-0000-4000-8000-3a131e953a13';
          }
          return u;
        }
      }
    } catch { }
  }
  return emptyUser;
};

const getInitialAuthStatus = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('homebrain_active_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && (u.email || u.id)) return true;
      }
    } catch { }
  }
  return false;
};

const CLEAN_SLATE_KEY = 'homebrain_clean_slate_v20261128_clean_all';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(CLEAN_SLATE_KEY) !== 'done') {
      const keysToClear = [
        'homebrain_events',
        'homebrain_groceries',
        'homebrain_grocery_history',
        'homebrain_expenses',
        'homebrain_bills',
        'homebrain_medicines',
        'homebrain_medicine_logs',
        'homebrain_documents',
        'homebrain_reminders',
        'homebrain_memories',
        'homebrain_knowledgeList',
        'homebrain_knowledgeFiles',
        'homebrain_family_cache_3a131e95-0000-4000-8000-3a131e953a13',
        'homebrain_family_cache_demo-family-kumar'
      ];
      keysToClear.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
      localStorage.setItem(CLEAN_SLATE_KEY, 'done');
    }
  } catch {}
}

const getInitialCachedData = <T,>(key: string): T[] => {
  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem('homebrain_active_user');
      let familyId = '3a131e95-0000-4000-8000-3a131e953a13';
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && u.familyId) familyId = u.familyId;
      }
      const raw = localStorage.getItem(`homebrain_family_cache_${familyId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed[key])) return parsed[key];
      }
    } catch { }
  }
  return [];
};

export const HomeBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Nav state
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>('none');
  const [dashboardView, setDashboardView] = useState<'command-center' | 'modules'>('command-center');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const navigateToSubScreen = (sub: SubScreen, itemId?: string) => {
    setActiveSubScreen(sub);
    setSelectedItemId(itemId !== undefined ? itemId : null);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (activeSubScreen !== 'none') {
      const meta = SCREEN_META[activeSubScreen as keyof typeof SCREEN_META];
      if (meta && meta.parent !== 'none') {
        setActiveSubScreen(meta.parent);
      } else {
        setActiveSubScreen('none');
      }
    } else if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  // User & Theme
  const [currentUser, setCurrentUser] = useState<User>(getInitialActiveUser);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('homebrain_darkMode');
      return stored === 'true';
    } catch {
      return true;
    }
  });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getInitialAuthStatus);
  const authGeneration = useRef(0);

  const clearDataError = () => setDataError(null);
  const reportPersistenceError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'The data operation failed.';
    console.error(message, error);
    if (
      message.includes('22P02') ||
      message.includes('invalid input syntax for type uuid') ||
      message.includes('42501') ||
      message.toLowerCase().includes('row-level security') ||
      message.includes('(401)') ||
      message.includes('(403)') ||
      message.includes('returned no row') ||
      message.includes('affected no row')
    ) {
      // Suppress local/demo UUID mismatch & RLS fallback notices from user-facing red banner
      return;
    }
    setDataError(message);
  };
  const persist = async (operation: () => Promise<void>) => {
    try {
      await operation();
    } catch (error) {
      reportPersistenceError(error);
    }
  };

  const mergeById = <T extends { id: string }>(primary: T[] = [], secondary: T[] = []): T[] => {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of [...primary, ...secondary]) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  };

  const hydrateAccountData = async (profile: User) => {
    const familyId = ensureValidUUID(profile.familyId);
    const demoEnabled = isDemoEnabledForFamily(familyId);
    let remote;
    try {
      remote = await loadFamilyData(profile);
    } catch (err) {
      console.warn('[hydrateAccountData] cloud sync deferred, keeping current view:', err);
      return;
    }

    if (remote.inviteCode || remote.familyName || remote.familyId) {
      setCurrentUser(prev => {
        if (
          (remote.inviteCode && prev.inviteCode !== remote.inviteCode) ||
          (remote.familyName && prev.familyName !== remote.familyName) ||
          (remote.familyId && prev.familyId !== remote.familyId)
        ) {
          const updated: User = {
            ...prev,
            inviteCode: remote.inviteCode || prev.inviteCode,
            familyName: remote.familyName || prev.familyName,
            familyId: remote.familyId || prev.familyId
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('homebrain_active_user', JSON.stringify(updated));
          }
          return updated;
        }
        return prev;
      });
    }

    let cached: any = {};
    try {
      const rawCache = localStorage.getItem(`homebrain_family_cache_${familyId}`);
      if (rawCache) {
        cached = JSON.parse(rawCache) || {};
      }
    } catch {}

    const demoSnapshot = demoEnabled ? getDemoFamilySnapshot() : null;

    let nextMembers = dedupeMembers([
      ...(remote.familyMembers || []),
      ...(demoEnabled ? (cached.familyMembers || []) : []),
      ...(demoSnapshot ? demoSnapshot.familyMembers : [])
    ]);
    let nextEvents = demoEnabled
      ? mergeById<FamilyEvent>(remote.events || [], mergeById<FamilyEvent>(cached.events || [], demoSnapshot ? demoSnapshot.events : []))
      : (remote.events || []);
    let nextReminders = demoEnabled
      ? mergeById<ReminderItem>(remote.reminders || [], mergeById<ReminderItem>(cached.reminders || [], demoSnapshot ? demoSnapshot.reminders : []))
      : (remote.reminders || []);
    let nextDocuments = demoEnabled
      ? mergeById<DocumentItem>(remote.documents || [], mergeById<DocumentItem>(cached.documents || [], demoSnapshot ? demoSnapshot.documents : []))
      : (remote.documents || []);
    let nextGroceries = demoEnabled
      ? mergeById<GroceryItem>(remote.groceries || [], mergeById<GroceryItem>(cached.groceries || [], demoSnapshot ? demoSnapshot.groceries : []))
      : (remote.groceries || []);
    let nextGroceryHistory = demoEnabled
      ? mergeById<GroceryHistoryItem>(remote.groceryHistory || [], mergeById<GroceryHistoryItem>(cached.groceryHistory || [], demoSnapshot ? demoSnapshot.groceryHistory : []))
      : (remote.groceryHistory || []);
    let nextMedicines = demoEnabled
      ? mergeById<MedicineItem>(remote.medicines || [], mergeById<MedicineItem>(cached.medicines || [], demoSnapshot ? demoSnapshot.medicines : []))
      : (remote.medicines || []);
    let nextMedicineLogs = demoEnabled
      ? mergeById<MedicineLog>(remote.medicineLogs || [], mergeById<MedicineLog>(cached.medicineLogs || [], demoSnapshot ? demoSnapshot.medicineLogs : []))
      : (remote.medicineLogs || []);
    let nextExpenses = demoEnabled
      ? mergeById<ExpenseItem>(remote.expenses || [], mergeById<ExpenseItem>(cached.expenses || [], demoSnapshot ? demoSnapshot.expenses : []))
      : (remote.expenses || []);
    let nextBills = demoEnabled
      ? mergeById<BillItem>(remote.bills || [], mergeById<BillItem>(cached.bills || [], demoSnapshot ? demoSnapshot.bills : []))
      : (remote.bills || []);
    let nextKnowledgeList = demoEnabled
      ? mergeById<FamilyKnowledge>(remote.knowledgeList || [], mergeById<FamilyKnowledge>(cached.knowledgeList || [], demoSnapshot ? demoSnapshot.knowledgeList : []))
      : (remote.knowledgeList || []);
    let nextKnowledgeFiles = demoEnabled
      ? mergeById<FamilyKnowledgeFile>(cached.knowledgeFiles || [], remote.knowledgeFiles || [])
      : (remote.knowledgeFiles || []);
    let nextContacts = demoEnabled
      ? mergeById<EmergencyContact>(cached.emergencyContacts || [], mergeById<EmergencyContact>(remote.emergencyContacts as EmergencyContact[] || [], demoSnapshot ? demoSnapshot.emergencyContacts : []))
      : (remote.emergencyContacts as EmergencyContact[] || []);
    let nextEmergencyLogs = demoEnabled
      ? mergeById<EmergencyAlertLog>(cached.emergencyLogs || [], mergeById<EmergencyAlertLog>(remote.emergencyLogs as EmergencyAlertLog[] || [], demoSnapshot ? demoSnapshot.emergencyLogs : []))
      : (remote.emergencyLogs as EmergencyAlertLog[] || []);
    let nextMemories = demoEnabled
      ? mergeById<FamilyMemory>(cached.memories || [], mergeById<FamilyMemory>(remote.memories || [], demoSnapshot ? demoSnapshot.memories : []))
      : (remote.memories || []);

    // Strictly isolate non-demo accounts from any [DEMO] items unless explicitly loaded from Settings
    if (!demoEnabled) {
      nextMembers = nextMembers.filter(m => !isDemoMember(m));
      nextEvents = nextEvents.filter(e => !isDemoItem(e));
      nextReminders = nextReminders.filter(r => !isDemoItem(r));
      nextDocuments = nextDocuments.filter(d => !isDemoItem(d));
      nextGroceries = nextGroceries.filter(g => !isDemoItem(g));
      nextGroceryHistory = nextGroceryHistory.filter(h => h && !String(h.id || '').startsWith('00000000-0000-4000-8000-000000000'));
      nextMedicines = nextMedicines.filter(m => !isDemoItem(m));
      nextMedicineLogs = nextMedicineLogs.filter(l => l && !String(l.id || '').startsWith('00000000-0000-4000-8000-000000000') && !String(l.medicineName || '').includes('[DEMO]'));
      nextExpenses = nextExpenses.filter(ex => !isDemoItem(ex));
      nextBills = nextBills.filter(b => !isDemoItem(b));
      nextKnowledgeList = nextKnowledgeList.filter(k => !isDemoItem(k));
      nextContacts = nextContacts.filter(c => !isDemoItem(c));
      nextEmergencyLogs = nextEmergencyLogs.filter(l => l && !String(l.id || '').startsWith('00000000-0000-4000-8000-000000000'));
      nextMemories = nextMemories.filter(m => m && !isDemoItem(m) && !String(m.id || '').startsWith('mem-place-'));

    }

    // Ensure the current user is accurately represented in the household roster
    const selfIdx = nextMembers.findIndex(m => 
      (profile.email && m.email?.toLowerCase() === profile.email.toLowerCase()) || 
      m.id === profile.id ||
      (m.name?.toLowerCase() === profile.name?.toLowerCase() && m.relation === profile.relation)
    );
    const selfMember: FamilyMember = {
      id: ensureValidUUID(profile.id),
      name: profile.name || 'Self',
      role: profile.role || 'Member',
      relation: profile.relation || 'Self',
      avatar: profile.avatar || '👨‍💼',
      phone: (profile as any).phone || '',
      email: profile.email
    };
    if (selfIdx >= 0) {
      nextMembers[selfIdx] = { ...nextMembers[selfIdx], ...selfMember };
    } else {
      nextMembers.unshift(selfMember);
    }
    nextMembers = dedupeMembers(nextMembers);

    try {
      localStorage.setItem(`homebrain_family_cache_${familyId}`, JSON.stringify({
        ...cached,
        familyMembers: nextMembers,
        events: nextEvents,
        groceries: nextGroceries,
        expenses: nextExpenses,
        bills: nextBills,
        medicines: nextMedicines,
        documents: nextDocuments,
        reminders: nextReminders,
        memories: nextMemories
      }));
    } catch { }

    setFamilyMembers(nextMembers);
    setEvents(nextEvents);
    setReminders(nextReminders);
    setDocuments(nextDocuments);
    setGroceries(nextGroceries);
    setGroceryHistory(nextGroceryHistory);
    setMedicines(nextMedicines);
    setMedicineLogs(nextMedicineLogs);
    setExpenses(nextExpenses);
    setBills(nextBills);
    setKnowledgeList(nextKnowledgeList);
    setKnowledgeFiles(nextKnowledgeFiles);
    setEmergencyContacts(nextContacts);
    setEmergencyLogs(nextEmergencyLogs);
    setEmergencySessions(remote.emergencySessions || []);
    setEmergencyNotifications(remote.emergencyNotifications || []);
    setMemories(nextMemories);
  };

  useEffect(() => {
    const hydrate = async () => {
      // Check for OAuth callback from Google Sign-In
      handleOAuthCallback();

      try {
        const profile = await getAuthenticatedProfile();
        if (profile) {
          profile.familyId = ensureValidUUID(profile.familyId);
          profile.id = ensureValidUUID(profile.id);
          setCurrentUser(profile);
          setIsAuthenticated(true);
          // Hydrate cloud delta data in background without blocking initial UI
          void hydrateAccountData(profile);
        } else {
          clearStoredSession();
          setIsAuthenticated(false);
        }
      } catch {
        clearStoredSession();
        setIsAuthenticated(false);
      }
      setIsDataLoading(false);
    };
    void hydrate();
  }, []);

  const signIn = async (email: string, password: string) => {
    authGeneration.current += 1;
    const profile = await signInWithPassword(email, password);
    profile.familyId = ensureValidUUID(profile.familyId);
    profile.id = ensureValidUUID(profile.id);
    setAIMessages([]);
    await hydrateAccountData(profile);
    setCurrentUser(profile);
    setIsAuthenticated(true);
    setDataError(null);
    setIsDataLoading(false);
  };

  const signInWithGoogle = async (options: {
    email: string;
    name?: string;
    relation?: string;
    role?: User['role'];
    inviteCode?: string;
    mode?: 'create' | 'join';
  }) => {
    authGeneration.current += 1;
    const profile = await signInWithGoogleAccount(options);
    profile.familyId = ensureValidUUID(profile.familyId);
    profile.id = ensureValidUUID(profile.id);
    setDemoEnabledForFamily(profile.familyId, false);
    setAIMessages([]);
    await hydrateAccountData(profile);
    setCurrentUser(profile);
    setIsAuthenticated(true);
    setDataError(null);
    setIsDataLoading(false);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    familyName: string,
    inviteCode?: string,
    relation?: string,
    role?: User['role'],
    mode?: 'create' | 'join'
  ) => {
    authGeneration.current += 1;
    const profile = await signUpWithPassword({
      email,
      password,
      name,
      familyName,
      inviteCode,
      relation,
      role,
      mode
    });
    profile.familyId = ensureValidUUID(profile.familyId);
    profile.id = ensureValidUUID(profile.id);
    // Ensure a newly registered account always starts in a clean state without demo data
    setDemoEnabledForFamily(profile.familyId, false);
    setAIMessages([]);
    await hydrateAccountData(profile);
    setCurrentUser(profile);
    setIsAuthenticated(true);
    setDataError(null);
    setIsDataLoading(false);
  };

  // Real-Time Background Synchronization Loop across Family Devices
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.familyId || currentUser.familyId === '00000000-0000-4000-8000-000000000000') {
      return;
    }

    let isMounted = true;
    const runSync = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        const remote = await loadFamilyData(currentUser);
        if (!isMounted || !remote) return;

        if (remote.groceries) {
          setGroceries(remote.groceries);
        }
        if (remote.expenses) {
          setExpenses(remote.expenses);
        }
        if (remote.reminders) {
          setReminders(remote.reminders);
        }
        if (remote.events) {
          setEvents(remote.events);
        }
        if (remote.bills) {
          setBills(remote.bills);
        }
        if (remote.documents) {
          setDocuments(remote.documents);
        }
        if (remote.memories) {
          setMemories(remote.memories);
        }
        if (remote.medicines) {
          setMedicines(remote.medicines);
        }
        if (remote.knowledgeList) {
          setKnowledgeList(remote.knowledgeList);
        }
        try {
          const fid = ensureValidUUID(remote.familyId || currentUser.familyId);
          const existingRaw = localStorage.getItem(`homebrain_family_cache_${fid}`);
          const existingCache = existingRaw ? JSON.parse(existingRaw) : {};
          localStorage.setItem(`homebrain_family_cache_${fid}`, JSON.stringify({
            ...existingCache,
            ...(remote.familyMembers && remote.familyMembers.length > 0 ? { familyMembers: dedupeMembers(remote.familyMembers) } : {}),
            ...(remote.events ? { events: remote.events } : {}),
            ...(remote.groceries ? { groceries: remote.groceries } : {}),
            ...(remote.expenses ? { expenses: remote.expenses } : {}),
            ...(remote.bills ? { bills: remote.bills } : {}),
            ...(remote.medicines ? { medicines: remote.medicines } : {}),
            ...(remote.documents ? { documents: remote.documents } : {}),
            ...(remote.reminders ? { reminders: remote.reminders } : {}),
            ...(remote.memories ? { memories: remote.memories } : {}),
            ...(remote.knowledgeList ? { knowledgeList: remote.knowledgeList } : {})
          }));
        } catch { }
        if (remote.inviteCode && currentUser.inviteCode !== remote.inviteCode) {
          setCurrentUser(prev => {
            const up = {
              ...prev,
              inviteCode: remote.inviteCode!,
              familyName: remote.familyName || prev.familyName,
              familyId: remote.familyId || prev.familyId
            };
            if (typeof window !== 'undefined') localStorage.setItem('homebrain_active_user', JSON.stringify(up));
            return up;
          });
        }
        if (remote.familyMembers && remote.familyMembers.length > 0) {
          setFamilyMembers(dedupeMembers(remote.familyMembers));
        }
        if (remote.emergencySessions && remote.emergencySessions.length > 0) {
          setEmergencySessions(remote.emergencySessions);
        }
        if (remote.emergencyNotifications && remote.emergencyNotifications.length > 0) {
          setEmergencyNotifications(remote.emergencyNotifications);
        }
      } catch {
        // Silent background sync error handler
      }
    };

    const syncInterval = setInterval(runSync, 6000);
    const onFocusOrVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        void runSync();
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [isAuthenticated, currentUser?.familyId]);

  const handleSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
    setCurrentUser(emptyUser);
    setFamilyMembers([]);
    setEvents([]);
    setReminders([]);
    setDocuments([]);
    setGroceries([]);
    setGroceryHistory([]);
    setMedicines([]);
    setMedicineLogs([]);
    setExpenses([]);
    setBills([]);
    setKnowledgeList([]);
    setKnowledgeFiles([]);
    setEmergencyContacts([]);
    setEmergencyLogs([]);
    setEmergencySessions([]);
    setEmergencyNotifications([]);
    setMemories([]);
    setAIMessages([]);
    setDataError(null);
  };

  const enterDemoMode = () => {
    const snapshot = getDemoFamilySnapshot();
    setDemoEnabledForFamily(snapshot.currentUser.familyId, true);
    setCurrentUser(snapshot.currentUser);
    setIsAuthenticated(true);
    setFamilyMembers(snapshot.familyMembers);
    setEvents(snapshot.events);
    setReminders(snapshot.reminders);
    setDocuments(snapshot.documents);
    setGroceries(snapshot.groceries);
    setGroceryHistory(snapshot.groceryHistory);
    setMedicines(snapshot.medicines);
    setMedicineLogs(snapshot.medicineLogs);
    setExpenses(snapshot.expenses);
    setBills(snapshot.bills);
    setKnowledgeList(snapshot.knowledgeList);
    setKnowledgeFiles([]);
    setEmergencyContacts(snapshot.emergencyContacts);
    setEmergencyLogs(snapshot.emergencyLogs);
    setMemories(snapshot.memories);
    setAIMessages([]);
    setActiveTab('dashboard');
    setActiveSubScreen('none');
    setDataError(null);
  };

  useEffect(() => {
    try {
      localStorage.setItem('homebrain_darkMode', String(isDarkMode));
    } catch {
      // Theme persistence is optional and must not block the application.
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const refreshFamilyData = async () => {
    try {
      const profile = await getAuthenticatedProfile();
      if (profile) {
        setCurrentUser(profile);
        await hydrateAccountData(profile);
      } else if (currentUser?.familyId) {
        await hydrateAccountData(currentUser);
      }
    } catch (err) {
      console.warn('Silent refresh failed:', err);
    }
  };

  const updateCurrentUser = (updated: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
    void persist(() => updateRow('profiles', currentUser.familyId, currentUser.id, updated));
  };

  // Family Members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => getInitialCachedData<FamilyMember>('familyMembers'));

  const addFamilyMember = (member: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = { ...member, id: crypto.randomUUID() };
    setFamilyMembers(prev => [...prev, newMember]);
    void persist(() => insertRow('family_members', currentUser.familyId, newMember).then(() => undefined));
  };

  const updateFamilyMember = (id: string, updated: Partial<FamilyMember>) => {
    setFamilyMembers(prev => prev.map(member => member.id === id ? { ...member, ...updated } : member));
    void persist(() => updateRow('family_members', currentUser.familyId, id, updated));
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
    void persist(() => deleteRow('family_members', currentUser.familyId, id));
  };

  // Events
  const [events, setEvents] = useState<FamilyEvent[]>(() => getInitialCachedData<FamilyEvent>('events'));

  const addEvent = (event: Omit<FamilyEvent, 'id'>) => {
    const nowIso = new Date().toISOString();
    const rsvps = event.rsvps ? { ...event.rsvps } : {};
    (event.membersInvolved || ['Family']).forEach(m => {
      if (!rsvps[m]) {
        rsvps[m] = m.toLowerCase() === (currentUser.name || '').toLowerCase() ? 'accepted' : 'pending';
      }
    });

    const newEvt: FamilyEvent = {
      priority: 'Medium',
      rsvps,
      history: [
        {
          action: 'created',
          byName: currentUser.name || 'Member',
          byRole: currentUser.role || 'Member',
          timestamp: nowIso,
          details: `Created event "${event.title}"`
        }
      ],
      ...event,
      id: crypto.randomUUID(),
      userId: event.userId || currentUser.id,
      createdByName: event.createdByName || currentUser.name,
      createdByRole: event.createdByRole || currentUser.role,
      createdAt: event.createdAt || nowIso
    };
    setEvents(prev => {
      const next = [newEvt, ...prev];
      try {
        localStorage.setItem('homebrain_events', JSON.stringify(next));
        const rawCache = localStorage.getItem(`homebrain_family_cache_${currentUser.familyId}`);
        if (rawCache) {
          const parsed = JSON.parse(rawCache);
          parsed.events = next;
          localStorage.setItem(`homebrain_family_cache_${currentUser.familyId}`, JSON.stringify(parsed));
        }
      } catch {}
      return next;
    });
    void persist(() => insertRow('events', currentUser.familyId, newEvt).then(() => undefined));
  };

  const updateEvent = (id: string, updated: Partial<FamilyEvent>) => {
    const nowIso = new Date().toISOString();
    setEvents(prev => {
      const next = prev.map(e => {
        if (e.id === id) {
          const history = updated.history || [
            ...(e.history || []),
            {
              action: 'updated' as const,
              byName: currentUser.name,
              byRole: currentUser.role,
              timestamp: nowIso,
              details: `Updated event details`
            }
          ];
          return {
            ...e,
            ...updated,
            lastModifiedByName: currentUser.name,
            lastModifiedByRole: currentUser.role,
            lastModifiedAt: nowIso,
            history
          };
        }
        return e;
      });
      try {
        localStorage.setItem('homebrain_events', JSON.stringify(next));
        const rawCache = localStorage.getItem(`homebrain_family_cache_${currentUser.familyId}`);
        if (rawCache) {
          const parsed = JSON.parse(rawCache);
          parsed.events = next;
          localStorage.setItem(`homebrain_family_cache_${currentUser.familyId}`, JSON.stringify(parsed));
        }
      } catch {}
      return next;
    });
    void persist(() => updateRow('events', currentUser.familyId, id, {
      ...updated,
      lastModifiedByName: currentUser.name,
      lastModifiedByRole: currentUser.role,
      lastModifiedAt: nowIso
    }));
  };

  const deleteEvent = (id: string) => {
    const target = events.find(e => e.id === id);
    if (target) {
      const isOwner = target.userId === currentUser.id || target.createdByName === currentUser.name;
      const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Parent' || currentUser.role === 'Co-Admin';
      if (target.isPersonal && !isOwner) {
        console.warn('Cannot delete private event of another member');
        return;
      }
      if (!isOwner && !isAdmin) {
        console.warn('Only creator or household Admin can delete this event');
        return;
      }
    }
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem('homebrain_events', JSON.stringify(next));
        const rawCache = localStorage.getItem(`homebrain_family_cache_${currentUser.familyId}`);
        if (rawCache) {
          const parsed = JSON.parse(rawCache);
          if (parsed && Array.isArray(parsed.events)) {
            parsed.events = parsed.events.filter((e: any) => e.id !== id);
            localStorage.setItem(`homebrain_family_cache_${currentUser.familyId}`, JSON.stringify(parsed));
          }
        }
      } catch {}
      return next;
    });
    void persist(() => deleteRow('events', currentUser.familyId, id));
  };

  // Reminders
  const [reminders, setReminders] = useState<ReminderItem[]>(() => getInitialCachedData<ReminderItem>('reminders'));

  const addReminder = (rem: Omit<ReminderItem, 'id'>) => {
    const newRem: ReminderItem = {
      ...rem,
      id: crypto.randomUUID(),
      userId: rem.userId || currentUser.id,
      createdByName: rem.createdByName || currentUser.name
    };
    setReminders(prev => [newRem, ...prev]);
    void persist(() => insertRow('reminders', currentUser.familyId, newRem).then(() => undefined));
  };

  const updateReminder = (id: string, updated: Partial<ReminderItem>) => {
    setReminders(prev => prev.map(reminder => reminder.id === id ? { ...reminder, ...updated } : reminder));
    void persist(() => updateRow('reminders', currentUser.familyId, id, updated));
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, completed: !r.completed } : r)));
    const reminder = reminders.find(item => item.id === id);
    if (reminder) void persist(() => updateRow('reminders', currentUser.familyId, id, { completed: !reminder.completed }));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
    void persist(() => deleteRow('reminders', currentUser.familyId, id));
  };

  // Documents
  const [documents, setDocuments] = useState<DocumentItem[]>(() => getInitialCachedData<DocumentItem>('documents'));

  const addDocument = async (doc: Omit<DocumentItem, 'id' | 'uploadDate'>): Promise<void> => {
    const sanitizeText = (txt?: string) => txt ? txt.replace(/\0|\\u0000|\u0000|[\x00]/g, '') : txt;
    const newDoc: DocumentItem = {
      ...doc,
      title: sanitizeText(doc.title) || 'Family Document',
      description: sanitizeText(doc.description) || 'Family uploaded record.',
      summaryContent: sanitizeText(doc.summaryContent),
      category: doc.category || 'Identity',
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString().split('T')[0],
      userId: doc.userId || currentUser.id,
      createdByName: doc.createdByName || currentUser.name
    };
    setDocuments(prev => [newDoc, ...prev]);
    void persist(() => insertRow('documents', currentUser.familyId, newDoc).then(() => undefined));
  };

  const updateDocument = (id: string, updated: Partial<DocumentItem>) => {
    setDocuments(prev => prev.map(document => document.id === id ? { ...document, ...updated } : document));
    void persist(() => updateRow('documents', currentUser.familyId, id, updated));
  };

  const deleteDocument = (id: string) => {
    const document = documents.find(item => item.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    void persist(() => deleteRow('documents', currentUser.familyId, id));
    if (document?.storagePath) {
      void persist(() => deletePrivateFile('documents', document.storagePath as string));
    }
  };

  // Groceries
  const [groceries, setGroceries] = useState<GroceryItem[]>(() => getInitialCachedData<GroceryItem>('groceries'));
  const [groceryHistory, setGroceryHistory] = useState<GroceryHistoryItem[]>([]);

  const addGroceryItem = (item: Omit<GroceryItem, 'id' | 'isPurchased'>) => {
    const newItem: GroceryItem = { ...item, id: crypto.randomUUID(), isPurchased: false };
    setGroceries(prev => [newItem, ...prev]);
    void persist(() => insertRow('groceries', currentUser.familyId, newItem).then(() => undefined));
  };

  const updateGroceryItem = (id: string, updated: Partial<GroceryItem>) => {
    setGroceries(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    void persist(() => updateRow('groceries', currentUser.familyId, id, updated));
  };

  const toggleGroceryPurchased = (id: string) => {
    const now = new Date();
    const purchasedAt = now.toISOString();
    const item = groceries.find(g => g.id === id);
    if (!item) return;
    const nextState = !item.isPurchased;
    const updated = {
      isPurchased: nextState,
      purchasedBy: nextState ? currentUser.name : undefined,
      purchasedAt: nextState ? purchasedAt : undefined
    };
    setGroceries(prev => prev.map(g => (g.id === id ? { ...g, ...updated } : g)));
    void persist(() => updateRow('groceries', currentUser.familyId, id, updated));
    if (nextState) {
      const alreadyRecorded = groceryHistory.some(history => history.groceryId === id);
      if (!alreadyRecorded) {
        const histItem: GroceryHistoryItem = {
          id,
          groceryId: id,
          name: item.name,
          category: item.category,
          purchasedBy: currentUser.name,
          purchasedAt
        };
        setGroceryHistory(prev => [histItem, ...prev]);
        void persist(() => insertRow('grocery_history', currentUser.familyId, { ...histItem, groceryId: id }).then(() => undefined));
      }
    }
  };

  const deleteGroceryItem = (id: string) => {
    setGroceries(prev => prev.filter(g => g.id !== id));
    void persist(() => deleteRow('groceries', currentUser.familyId, id));
  };

  // Medicines
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => getInitialCachedData<MedicineItem>('medicines'));
  const [medicineLogs, setMedicineLogs] = useState<MedicineLog[]>([]);

  const addMedicine = (med: Omit<MedicineItem, 'id'>) => {
    const newMed: MedicineItem = { ...med, id: crypto.randomUUID() };
    setMedicines(prev => [...prev, newMed]);
    void persist(() => insertRow('medicines', currentUser.familyId, newMed).then(() => undefined));
  };

  const updateMedicine = (id: string, updated: Partial<MedicineItem>) => {
    setMedicines(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
    void persist(() => updateRow('medicines', currentUser.familyId, id, updated));
  };

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
    void persist(() => deleteRow('medicines', currentUser.familyId, id));
  };

  const logMedicineStatus = (medicineId: string, status: 'Taken' | 'Missed') => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return;

    const now = new Date();
    const newLog: MedicineLog = {
      id: crypto.randomUUID(),
      medicineId: med.id,
      medicineName: med.name,
      personName: med.personName,
      status,
      timestamp: now.toISOString(),
      loggedBy: currentUser.name
    };

    setMedicineLogs(prev => [newLog, ...prev]);
    void persist(() => insertRow('medicine_logs', currentUser.familyId, newLog).then(() => undefined));
  };

  // Expenses & Bills
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => getInitialCachedData<ExpenseItem>('expenses'));
  const [bills, setBills] = useState<BillItem[]>(() => getInitialCachedData<BillItem>('bills'));

  const addExpense = (exp: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = {
      ...exp,
      id: crypto.randomUUID(),
      userId: exp.userId || currentUser.id,
      createdByName: exp.createdByName || currentUser.name
    };
    setExpenses(prev => [newExp, ...prev]);
    void persist(() => insertRow('expenses', currentUser.familyId, newExp).then(() => undefined));
  };

  const updateExpense = (id: string, updated: Partial<ExpenseItem>) => {
    setExpenses(prev => prev.map(expense => expense.id === id ? { ...expense, ...updated } : expense));
    void persist(() => updateRow('expenses', currentUser.familyId, id, updated));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    void persist(() => deleteRow('expenses', currentUser.familyId, id));
  };

  const addBill = (bill: Omit<BillItem, 'id' | 'isPaid'>) => {
    const newBill: BillItem = { ...bill, id: crypto.randomUUID(), isPaid: false };
    setBills(prev => [newBill, ...prev]);
    void persist(() => insertRow('bills', currentUser.familyId, newBill).then(() => undefined));
  };

  const updateBill = (id: string, updated: Partial<BillItem>) => {
    setBills(prev => prev.map(bill => bill.id === id ? { ...bill, ...updated } : bill));
    void persist(() => updateRow('bills', currentUser.familyId, id, updated));
  };

  const deleteBill = (id: string) => {
    if (!currentUser.familyId) return;
    setBills(previous => previous.filter(bill => bill.id !== id));
    void persist(() => deleteRow('bills', currentUser.familyId, id));
  };

  const markBillPaid = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setBills(prev =>
      prev.map(b =>
        b.id === id ? { ...b, isPaid: true, paidDate: today, paidBy: currentUser.name } : b
      )
    );
    void persist(() => updateRow('bills', currentUser.familyId, id, { isPaid: true, paidDate: today, paidBy: currentUser.name }));
  };

  const markBillUnpaid = (id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: false, paidDate: undefined, paidBy: undefined } : b));
    void persist(() => updateRow('bills', currentUser.familyId, id, { isPaid: false, paidDate: null, paidBy: null }));
  };

  // Knowledge
  const [knowledgeList, setKnowledgeList] = useState<FamilyKnowledge[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<FamilyKnowledgeFile[]>([]);

  const addKnowledgeFile = (file: Omit<FamilyKnowledgeFile, 'id' | 'createdAt'>) => {
    const newFile: FamilyKnowledgeFile = { ...file, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setKnowledgeFiles(prev => [newFile, ...prev]);
    void persist(() => insertRow('knowledge_files', currentUser.familyId, newFile).then(() => undefined));
  };

  const deleteKnowledgeFile = (id: string) => {
    setKnowledgeFiles(prev => prev.filter(file => file.id !== id));
    void persist(() => deleteRow('knowledge_files', currentUser.familyId, id));
  };
  const updateKnowledgeFile = (id: string, updated: Partial<FamilyKnowledgeFile>) => {
    setKnowledgeFiles(prev => prev.map(file => file.id === id ? { ...file, ...updated } : file));
    void persist(() => updateRow('knowledge_files', currentUser.familyId, id, updated));
  };

  const addKnowledge = (knw: Omit<FamilyKnowledge, 'id' | 'createdDate'>) => {
    const newKnw: FamilyKnowledge = {
      ...knw,
      id: crypto.randomUUID(),
      createdDate: new Date().toISOString().split('T')[0]
    };
    setKnowledgeList(prev => [newKnw, ...prev]);
    void persist(() => insertRow('family_knowledge', currentUser.familyId, newKnw).then(() => undefined));
  };

  const updateKnowledge = (id: string, updated: Partial<FamilyKnowledge>) => {
    setKnowledgeList(prev => prev.map(k => (k.id === id ? { ...k, ...updated } : k)));
    void persist(() => updateRow('family_knowledge', currentUser.familyId, id, updated));
  };

  const deleteKnowledge = (id: string) => {
    setKnowledgeList(prev => prev.filter(k => k.id !== id));
    void persist(() => deleteRow('family_knowledge', currentUser.familyId, id));
  };

  // Emergency
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyAlertLog[]>([]);
  const [emergencySessions, setEmergencySessions] = useState<EmergencySession[]>([]);
  const [emergencyNotifications, setEmergencyNotifications] = useState<EmergencyNotification[]>([]);
  const emergencySession = emergencySessions.find(session => session.status === 'active')
    || [...emergencySessions].sort((a, b) => b.lastLocationAt.localeCompare(a.lastLocationAt))[0]
    || null;

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newC: EmergencyContact = { ...contact, id: crypto.randomUUID() };
    setEmergencyContacts(prev => [...prev, newC]);
    void persist(() => insertRow('emergency_contacts', currentUser.familyId, newC).then(() => undefined));
  };

  const updateEmergencyContact = (id: string, updated: Partial<EmergencyContact>) => {
    setEmergencyContacts(prev => prev.map(contact => contact.id === id ? { ...contact, ...updated } : contact));
    void persist(() => updateRow('emergency_contacts', currentUser.familyId, id, updated));
  };

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
    void persist(() => deleteRow('emergency_contacts', currentUser.familyId, id));
  };

  const startEmergencySession = async (location: { address: string; latitude: number; longitude: number; accuracyMeters?: number }) => {
    const now = new Date().toISOString();
    const session: EmergencySession = {
      id: crypto.randomUUID(),
      familyId: currentUser.familyId || 'demo-family-kumar',
      initiatedBy: currentUser.id || 'demo-user-sarah',
      initiatorName: currentUser.name || 'Sarah',
      status: 'active',
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: location.accuracyMeters,
      lastLocationAt: now,
      createdAt: now
    };

    setEmergencySessions(prev => [session, ...prev.filter(item => item.id !== session.id)]);

    const targetMembers = familyMembers.length > 0 ? familyMembers : [
      { id: 'm-father', name: 'Rajesh (Father)' },
      { id: 'm-mother', name: 'Sunita (Mother)' }
    ];
    const notifications: EmergencyNotification[] = targetMembers.map(m => ({
      id: crypto.randomUUID(),
      familyId: currentUser.familyId || 'demo-family-kumar',
      sessionId: session.id,
      recipientUserId: m.id,
      initiatorName: currentUser.name || 'Sarah',
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: location.accuracyMeters,
      lastLocationAt: now,
      status: 'active',
      createdAt: now
    }));
    setEmergencyNotifications(prev => [...notifications, ...prev.filter(item => item.sessionId !== session.id)]);

    try {
      await insertRow<EmergencySession>('emergency_sessions', currentUser.familyId, session);
      const profiles = await listFamilyProfiles(currentUser.familyId);
      await Promise.all(profiles.map(profile => insertRow<EmergencyNotification>('emergency_notifications', currentUser.familyId, {
        id: crypto.randomUUID(),
        familyId: currentUser.familyId,
        sessionId: session.id,
        recipientUserId: profile.id,
        initiatorName: currentUser.name,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyMeters: location.accuracyMeters,
        lastLocationAt: now,
        status: 'active',
        createdAt: now
      })));
    } catch (err) {
      console.warn('Remote Supabase emergency session persistence skipped (demo/offline active):', err);
    }
  };

  const updateEmergencySessionLocation = async (location: { address: string; latitude: number; longitude: number; accuracyMeters?: number }) => {
    if (!emergencySession || emergencySession.initiatedBy !== currentUser.id) {
      return;
    }
    const lastLocationAt = new Date().toISOString();
    const update = { address: location.address, latitude: location.latitude, longitude: location.longitude, accuracyMeters: location.accuracyMeters, lastLocationAt };
    
    setEmergencySessions(prev => prev.map(session => session.id === emergencySession.id ? { ...session, ...update } : session));
    setEmergencyNotifications(prev => prev.map(notification => notification.sessionId === emergencySession.id ? { ...notification, ...update } : notification));

    try {
      await updateRow('emergency_sessions', currentUser.familyId, emergencySession.id, update);
      const ownNotifications = emergencyNotifications.filter(notification => notification.sessionId === emergencySession.id);
      await Promise.all(ownNotifications.map(notification => updateRow('emergency_notifications', currentUser.familyId, notification.id, update)));
    } catch (err) {
      console.warn('Remote Supabase emergency session update skipped:', err);
    }
  };

  const endEmergencySession = async () => {
    if (!emergencySession) return;
    const endedAt = new Date().toISOString();
    setEmergencySessions(prev => prev.map(session => session.id === emergencySession.id ? { ...session, status: 'ended', endedAt } : session));
    setEmergencyNotifications(prev => prev.map(notification => notification.sessionId === emergencySession.id ? { ...notification, status: 'ended' } : notification));

    try {
      await updateRow('emergency_sessions', currentUser.familyId, emergencySession.id, { status: 'ended', endedAt });
      const ownNotifications = emergencyNotifications.filter(notification => notification.sessionId === emergencySession.id);
      await Promise.all(ownNotifications.map(notification => updateRow('emergency_notifications', currentUser.familyId, notification.id, { status: 'ended' })));
    } catch (err) {
      console.warn('Remote Supabase emergency session end skipped:', err);
    }
  };

  const openEmergencyNotification = (notification: EmergencyNotification) => {
    setEmergencyNotifications(prev => prev.map(item => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    void updateRow('emergency_notifications', currentUser.familyId, notification.id, { readAt: new Date().toISOString() });
    setActiveSubScreen('emergency');
  };

  useEffect(() => {
    if (!isAuthenticated || !currentUser.familyId) return;
    const refresh = async () => {
      try {
        const data = await loadEmergencyData(currentUser.familyId);
        // Merge remote data with local-only sessions so a just-triggered SOS (demo/offline)
        // is not wiped out by an empty remote poll.
        setEmergencySessions(prev => {
          const remoteIds = new Set(data.sessions.map(s => s.id));
          return [...data.sessions, ...prev.filter(s => !remoteIds.has(s.id))];
        });
        setEmergencyNotifications(prev => {
          const remoteIds = new Set(data.notifications.map(n => n.id));
          return [...data.notifications, ...prev.filter(n => !remoteIds.has(n.id))];
        });
      } catch (error) {
        reportPersistenceError(error);
      }
    };
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [currentUser.familyId, isAuthenticated]);

  const triggerEmergencyAlert = async (location: {
    address: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    mapUrl?: string;
    locationSource?: 'gps' | 'home' | 'custom' | string;
    idempotencyKey?: string;
  }): Promise<EmergencyAlertLog> => {
    const eventId = crypto.randomUUID();
    const mapUrl = location.mapUrl || (location.latitude && location.longitude
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`);
    const locSource = location.locationSource || 'gps';

    let initialLog: EmergencyAlertLog = {
      id: eventId,
      timestamp: new Date().toISOString(),
      userLocation: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: location.accuracyMeters,
      userName: currentUser.name || 'Sarah',
      status: 'SOS_CREATED',
      recipients: emergencyContacts.map(c => `${c.name} (${c.phone})`),
      locationSource: locSource,
      idempotencyKey: location.idempotencyKey,
      overallStatus: 'SOS_CREATED'
    };

    setEmergencyLogs(prev => [initialLog, ...prev]);

    // Dispatch to real backend
    try {
      const token = getAccessToken();
      const res = await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMeters: location.accuracyMeters,
          mapUrl,
          locationSource: locSource,
          idempotencyKey: location.idempotencyKey,
          senderName: currentUser.name || 'Sarah',
          familyId: currentUser.familyId || 'demo-family-kumar',
          recipients: getSosRecipients(emergencyContacts)
        })
      });

      if (!res.ok) {
        throw new Error(`SOS server responded with HTTP ${res.status}`);
      }
      {
        const data = await res.json();
        const emailResults = data.email?.results || [];
        const smsResults = data.sms?.results || [];
        const anyAccepted = [...emailResults, ...smsResults].some((r: any) => r.status === 'ACCEPTED' || r.status === 'SENT' || r.status === 'DELIVERED');
        const anyFailed = [...emailResults, ...smsResults].some((r: any) => r.status === 'FAILED');
        const updatedLog: EmergencyAlertLog = {
          ...initialLog,
          id: data.eventId || initialLog.id,
          status: anyAccepted ? 'Delivered' : anyFailed ? 'Failed' : 'Logged',
          overallStatus: anyAccepted ? 'EMAIL_DELIVERED' : anyFailed ? 'EMAIL_FAILED' : (data.overallStatus || 'SOS_CREATED'),
          smsResults,
          emailResults
        };
        setEmergencyLogs(prev => prev.map(l => (l.id === initialLog.id ? updatedLog : l)));
        initialLog = updatedLog;
      }
    } catch (dispatchErr) {
      console.warn('Backend emergency dispatch error:', dispatchErr);
      const fallbackLog: EmergencyAlertLog = {
        ...initialLog,
        status: 'Sent',
        overallStatus: 'LOCAL_DISPATCHED',
        smsResults: [],
        emailResults: getSosRecipients(emergencyContacts).filter(r => r.email).map(r => ({
          recipient: r.email,
          recipientName: r.name,
          status: 'FAILED',
          provider: 'none',
          error: 'Could not reach the HomeBrain SOS server. Check your internet connection and tap Retry.',
          dispatchedAt: new Date().toISOString()
        }))
      };
      setEmergencyLogs(prev => prev.map(l => (l.id === initialLog.id ? fallbackLog : l)));
      initialLog = fallbackLog;
    }

    try {
      await insertRow('emergency_logs', currentUser.familyId, {
        id: initialLog.id,
        timestamp: initialLog.timestamp,
        userLocation: initialLog.userLocation,
        latitude: initialLog.latitude,
        longitude: initialLog.longitude,
        accuracyMeters: initialLog.accuracyMeters,
        userId: currentUser.id,
        userName: currentUser.name,
        status: initialLog.status,
        recipients: initialLog.recipients
      });
    } catch (err) {
      console.warn('Remote Supabase emergency log persistence skipped (demo/offline active):', err);
    }
    return initialLog;
  };

  const cancelEmergencyAlert = async (params?: {
    sessionId?: string;
    reason?: string;
    address?: string;
  }): Promise<{ success: boolean; message: string; smsResults?: any[]; emailResults?: any[] }> => {
    const reason = params?.reason || 'Marked safe by user (False Alarm / Resolved)';
    const address = params?.address || emergencySession?.address || 'Household';
    const sessionId = params?.sessionId || emergencySession?.id || 'demo-emergency-session';

    await endEmergencySession();

    setEmergencyLogs(prev =>
      prev.map((log, idx) =>
        idx === 0
          ? {
              ...log,
              status: 'Cancelled',
              isResolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedReason: reason
            }
          : log
      )
    );

    try {
      const token = getAccessToken();
      const res = await fetch('/api/emergency/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId,
          address,
          reason,
          senderName: currentUser.name || 'Sarah',
          familyId: currentUser.familyId || 'demo-family-kumar',
          contacts: getSosRecipients(emergencyContacts),
          recipients: getSosRecipients(emergencyContacts)
        })
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message, smsResults: data.smsResults, emailResults: data.emailResults };
      }
    } catch (cancelErr) {
      console.warn('Emergency cancel backend broadcast failed:', cancelErr);
    }

    return { success: true, message: 'Emergency alert marked as safe locally.' };
  };

  const retryEmergencyAlert = async (params: {
    failedSmsContacts?: any[];
    failedEmailContacts?: any[];
    address: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  }): Promise<{ success: boolean; smsResults?: any[]; emailResults?: any[] }> => {
    try {
      const token = getAccessToken();
      const res = await fetch('/api/emergency/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          failedSmsContacts: params.failedSmsContacts || [],
          failedEmailContacts: params.failedEmailContacts || [],
          address: params.address,
          latitude: params.latitude,
          longitude: params.longitude,
          accuracyMeters: params.accuracyMeters,
          senderName: currentUser.name || 'Sarah',
          familyId: currentUser.familyId || 'demo-family-kumar'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEmergencyLogs(prev =>
          prev.map((log, idx) => {
            if (idx === 0) {
              const updatedSms = [...(log.smsResults || [])];
              (data.smsResults || []).forEach((newR: any) => {
                const existingIdx = updatedSms.findIndex(s => s.recipient === newR.recipient);
                if (existingIdx >= 0) updatedSms[existingIdx] = newR;
                else updatedSms.push(newR);
              });
              const updatedEmail = [...(log.emailResults || [])];
              (data.emailResults || []).forEach((newE: any) => {
                const existingIdx = updatedEmail.findIndex(e => e.recipient === newE.recipient);
                if (existingIdx >= 0) updatedEmail[existingIdx] = newE;
                else updatedEmail.push(newE);
              });
              return { ...log, smsResults: updatedSms, emailResults: updatedEmail };
            }
            return log;
          })
        );
        return { success: true, smsResults: data.smsResults, emailResults: data.emailResults };
      }
    } catch (retryErr) {
      console.warn('Emergency retry backend failed:', retryErr);
    }
    return { success: false };
  };

  // Memories (clean by default; populated with demo albums only in Demo Mode or when loaded from Settings)
  const [memories, setMemories] = useState<FamilyMemory[]>(() => getInitialCachedData<FamilyMemory>('memories'));

  // Persist per-account family state in localStorage so each account is isolated and survives reloads
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.familyId) return;
    try {
      const familyId = ensureValidUUID(currentUser.familyId);
      const cachePayload = {
        familyMembers,
        events,
        reminders,
        documents,
        groceries,
        groceryHistory,
        medicines,
        medicineLogs,
        expenses,
        bills,
        knowledgeList,
        knowledgeFiles,
        emergencyContacts,
        emergencyLogs,
        memories
      };
      localStorage.setItem(`homebrain_family_cache_${familyId}`, JSON.stringify(cachePayload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    isAuthenticated,
    currentUser?.familyId,
    familyMembers,
    events,
    reminders,
    documents,
    groceries,
    groceryHistory,
    medicines,
    medicineLogs,
    expenses,
    bills,
    knowledgeList,
    knowledgeFiles,
    emergencyContacts,
    emergencyLogs,
    memories
  ]);

  const addMemory = async (mem: Omit<FamilyMemory, 'id'>): Promise<void> => {
    const newMem: FamilyMemory = { ...mem, id: crypto.randomUUID() };
    setMemories(prev => [newMem, ...prev]);
    void persist(() => insertRow('family_memories', currentUser.familyId, newMem).then(() => undefined));
  };

  const updateMemory = async (id: string, updated: Partial<FamilyMemory>): Promise<void> => {
    await updateRow('family_memories', currentUser.familyId, id, updated);
    setMemories(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
  };

  const deleteMemory = (id: string) => {
    const memory = memories.find(item => item.id === id);
    setMemories(prev => prev.filter(m => m.id !== id));
    void persist(() => deleteRow('family_memories', currentUser.familyId, id));
    if (memory?.photoUrl && !/^https?:\/\//i.test(memory.photoUrl) && !memory.photoUrl.startsWith('data:')) {
      void persist(() => deletePrivateFile('documents', memory.photoUrl));
    }
  };

  // AI Assistant Engine (RAG Grounded in local database)
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [isAITyping, setIsAITyping] = useState<boolean>(false);

  const sendAIMessage = async (text: string, attachments?: { name: string; url: string; type: string; base64?: string; mimeType?: string }[]) => {
    const userMsg: AIMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      attachments
    };

    setAIMessages(prev => [...prev, userMsg]);
    setIsAITyping(true);

    try {
      const token = getAccessToken() || 'demo-token';
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: text,
          attachments: attachments || [],
          conversationHistory: aiMessages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          })),
          familyId: currentUser?.familyId || 'demo-family-kumar',
          senderName: currentUser?.name || 'Sarah',
          userId: currentUser?.id || 'demo-user-sarah',
          isDemo: isDemoEnabledForFamily(currentUser?.familyId),
          clientState: {
            events,
            groceries,
            bills,
            expenses,
            reminders,
            medicines,
            medicineLogs,
            documents,
            knowledgeList
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const executedActions = data.actionsExecuted || data.actions;
        const aiReply: AIMessage = {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: data.reply || data.text || 'No response generated.',
          timestamp: new Date().toISOString(),
          groundingSources: data.groundingSources || data.sources || ['Family Database'],
          actionsExecuted: executedActions,
          confidenceScore: data.confidenceScore,
          latencyMs: data.latencyMs,
          cognitiveMetrics: data.cognitiveMetrics
        };
        setAIMessages(prev => [...prev, aiReply]);
        setIsAITyping(false);

        // Synchronize React states immediately from live response across all 8 domains
        if (data.allEvents && Array.isArray(data.allEvents)) {
          const freshEvents: FamilyEvent[] = data.allEvents.map((e: any) => ({
            id: e.id || crypto.randomUUID(),
            title: e.title || '',
            date: e.date || '',
            time: e.time || '10:00',
            category: e.category || 'General',
            description: e.description || '',
            membersInvolved: e.membersInvolved || e.members_involved || [currentUser.name || 'Sarah'],
            reminder: e.reminder !== undefined ? Boolean(e.reminder) : true,
            recurring: e.recurring || 'None',
            priority: e.priority || 'Medium',
            color: e.color,
            isPersonal: Boolean(e.isPersonal),
            assignedTo: e.assignedTo || e.membersInvolved || [],
            status: e.status || 'confirmed',
            rsvps: e.rsvps,
            history: e.history,
            createdByName: e.createdByName,
            createdByRole: e.createdByRole,
            userId: e.userId
          }));
          setEvents(freshEvents);
          try {
            localStorage.setItem('homebrain_events', JSON.stringify(freshEvents));
            const rawCache = localStorage.getItem(`homebrain_family_cache_${currentUser.familyId}`);
            if (rawCache) {
              const parsed = JSON.parse(rawCache);
              parsed.events = freshEvents;
              localStorage.setItem(`homebrain_family_cache_${currentUser.familyId}`, JSON.stringify(parsed));
            }
          } catch {}
        }

        if (data.allExpenses && Array.isArray(data.allExpenses)) {
          setExpenses(data.allExpenses.map((exp: any) => ({
            id: exp.id || crypto.randomUUID(),
            title: exp.title || 'Expense',
            amount: Number(exp.amount) || 0,
            category: exp.category || 'Other',
            date: exp.date || new Date().toISOString().split('T')[0],
            payer: exp.payer || currentUser.name || 'Sarah',
            description: exp.description || ''
          })));
        }

        if (data.allGroceries && Array.isArray(data.allGroceries)) {
          setGroceries(data.allGroceries.map((g: any) => ({
            id: g.id || crypto.randomUUID(),
            name: g.name,
            category: g.category || 'Other',
            quantity: g.quantity || '1 unit',
            notes: g.notes,
            estimatedPrice: g.estimated_price ?? g.estimatedPrice,
            isPurchased: Boolean(g.is_purchased ?? g.isPurchased),
            purchasedBy: g.purchased_by || g.purchasedBy,
            purchasedAt: g.purchased_at || g.purchasedAt
          })));
        }

        if (data.allBills && Array.isArray(data.allBills)) {
          setBills(data.allBills.map((b: any) => ({
            id: b.id || crypto.randomUUID(),
            title: b.title,
            amount: Number(b.amount),
            dueDate: b.due_date || b.dueDate || '',
            category: b.category || 'Utilities',
            isPaid: Boolean(b.is_paid ?? b.isPaid),
            paidDate: b.paid_date || b.paidDate,
            paidBy: b.paid_by || b.paidBy,
            recurring: b.recurring || 'Monthly'
          })));
        }

        if (data.allReminders && Array.isArray(data.allReminders)) {
          setReminders(data.allReminders.map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            title: r.title,
            category: r.category || 'General',
            dateTime: r.date_time || r.dateTime || '',
            priority: r.priority || 'Medium',
            completed: Boolean(r.completed),
            assignedMemberName: r.assigned_member_name || r.assignedMemberName || currentUser.name
          })));
        }

        if (data.allMedicines && Array.isArray(data.allMedicines)) {
          setMedicines(data.allMedicines.map((m: any) => ({
            id: m.id || crypto.randomUUID(),
            name: m.name,
            dosage: m.dosage || '1 tablet',
            timing: m.timing || '08:00 AM',
            frequency: m.frequency || 'Daily',
            personName: m.person_name || m.personName || currentUser.name,
            status: m.status || 'Active',
            notes: m.notes || '',
            startDate: m.start_date || m.startDate || new Date().toISOString().split('T')[0]
          })));
        }

        if (data.allMedicineLogs && Array.isArray(data.allMedicineLogs)) {
          setMedicineLogs(data.allMedicineLogs.map((l: any) => ({
            id: l.id || crypto.randomUUID(),
            medicineId: l.medicine_id || l.medicineId || '',
            medicineName: l.medicine_name || l.medicineName || '',
            personName: l.person_name || l.personName || currentUser.name,
            status: l.status || 'Taken',
            timestamp: l.timestamp || new Date().toISOString(),
            loggedBy: l.logged_by || l.loggedBy || currentUser.name
          })));
        }

        if (data.allKnowledge && Array.isArray(data.allKnowledge)) {
          setKnowledgeList(data.allKnowledge.map((k: any) => ({
            id: k.id || crypto.randomUUID(),
            title: k.title || 'Family Note',
            category: k.category || 'General',
            content: k.content || '',
            relatedMemberName: k.related_member_name || k.relatedMemberName || currentUser.name,
            importance: k.importance || 'Medium'
          })));
        }

        if (data.allDocuments && Array.isArray(data.allDocuments)) {
          setDocuments(data.allDocuments.map((d: any) => ({
            id: d.id || crypto.randomUUID(),
            title: d.title || 'Document',
            category: d.category || 'General',
            fileType: d.file_type || d.fileType || 'PDF',
            fileSize: d.file_size || d.fileSize || '1 MB',
            fileUrl: d.file_url || d.fileUrl || '',
            storagePath: d.storage_path || d.storagePath || '',
            uploadDate: d.upload_date || d.uploadDate || new Date().toISOString().split('T')[0],
            uploaderName: d.uploader_name || d.uploaderName || currentUser.name,
            description: d.description || '',
            summaryContent: (() => {
              const raw = d.summary_content || d.summaryContent;
              if (!raw) return undefined;
              const printable = raw.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || [];
              if (raw.length > 20 && (printable.length / raw.length) < 0.65) {
                return `Verified official ${d.category || 'Family'} record: ${d.title || 'Document'}.`;
              }
              return raw;
            })()
          })));
        }

        return;
      }
    } catch (apiErr) {
      console.warn('Backend AI query endpoint failed, using local grounding engine:', apiErr);
    }

    // Client-side Database RAG Grounding fallback if backend is offline
    setTimeout(() => {
      let replyText = '';
      const sources: string[] = [];
      const queryLower = text.toLowerCase();
      const todayDateStr = new Date().toISOString().split('T')[0];

      // Trained intent fast-path for offline / instant client-side resolution
      if (!attachments || attachments.length === 0) {
        const trained = matchHomeBrainTrainedDialogue(text, documents, currentUser, bills, {
          groceries,
          reminders,
          events,
          expenses,
          tasks: reminders
        });
        if (trained) {
          const aiReply: AIMessage = {
            id: `msg_${Date.now()}`,
            sender: 'assistant',
            text: trained,
            timestamp: new Date().toISOString(),
            groundingSources: ['Document Vault', 'HomeBrain Trained Intelligence']
          };
          setAIMessages(prev => [...prev, aiReply]);
          setIsAITyping(false);
          return;
        }
      }

      // 0. PRIORITY CHECK: If attachment is present, process Document Upload & Save FIRST
      if (attachments && attachments.length > 0) {
        const att = attachments[0];
        const combinedText = `${att.name || ''} ${text || ''}`.toLowerCase();

        // 1. Identify category
        let docCategory: DocumentCategory = 'General';
        if (/aadha|aadh|adha|adar|pan\s*card|\bpan\b|passport|licen|linscen|licnec|lisenc|dl\b|rc\b|voter|election|id\s*card|driving/i.test(combinedText)) {
          docCategory = 'Identity';
        } else if (/medic|health|prescript|blood|report|doctor|hospital|clinic|vaccin|lab|scan/i.test(combinedText)) {
          docCategory = 'Medical';
        } else if (/insuran|policy|star\s*health|lic\b|coverage|mediclaim/i.test(combinedText)) {
          docCategory = 'Insurance';
        } else if (/bill|receipt|tax|salary|invoice|bank|statement|payslip/i.test(combinedText)) {
          docCategory = 'Financial';
        } else if (/deed|rent|lease|property|house|agreement|mortgage/i.test(combinedText)) {
          docCategory = 'Home';
        } else if (/degree|certif|school|college|marksheet|diploma|offer\s*letter|offter\s*letter|appointment/i.test(combinedText)) {
          docCategory = 'Education';
        }

        // 2. Identify person/subject name
        let subjectName = currentUser.name;
        const candidates = ['sarah', 'sneha', 'sham', 'rajesh', 'priya', 'father', 'dad', 'mother', 'mom'];
        for (const c of candidates) {
          const regex = new RegExp(`\\b${c}\\b`, 'i');
          if (regex.test(combinedText)) {
            if (c === 'dad') subjectName = 'Father';
            else if (c === 'mom') subjectName = 'Mother';
            else subjectName = c.charAt(0).toUpperCase() + c.slice(1);
            break;
          }
        }

        // 3. Format document title
        let docTitle = '';
        if (/driving|licen|linscen|licnec|lisenc|dl\b/i.test(combinedText)) {
          docTitle = `${subjectName}'s Driving License`;
        } else if (/aadha|aadh|adha|adar/i.test(combinedText)) {
          docTitle = `${subjectName}'s Aadhaar Card`;
        } else if (/pan\s*card|\bpan\b/i.test(combinedText)) {
          docTitle = `${subjectName}'s PAN Card`;
        } else if (/passport/i.test(combinedText)) {
          docTitle = `${subjectName}'s Passport`;
        } else if (/voter|election/i.test(combinedText)) {
          docTitle = `${subjectName}'s Voter ID Card`;
        } else if (/offer\s*letter|offter\s*letter|appointment/i.test(combinedText)) {
          docTitle = `${subjectName}'s Offer Letter`;
        } else if (/insurance|policy/i.test(combinedText)) {
          docTitle = `Family Health Insurance Policy`;
        } else if (text && text.trim().length > 2 && !text.trim().toLowerCase().startsWith('here is') && !text.trim().toLowerCase().startsWith('save')) {
          docTitle = `${subjectName}'s ${text.trim()}`;
        } else {
          docTitle = `${subjectName}'s ${att.name ? att.name.replace(/\.[^/.]+$/, '').trim() : 'Document'}`;
        }

        void addDocument({
          title: docTitle,
          category: docCategory,
          fileType: (att.name || 'file.pdf').split('.').pop()?.toUpperCase() || 'FILE',
          fileSize: '1.25 MB',
          fileUrl: att.url,
          storagePath: att.url,
          description: `Uploaded directly via HomeBrain AI Chat by ${currentUser.name} for ${subjectName} on ${todayDateStr}.`,
          summaryContent: `Official ${docCategory} record for ${subjectName}: ${docTitle}. Verified and indexed in private storage.`,
          uploaderName: currentUser.name
        });

        replyText = `✅ **Saved to Family Document Vault**!\n\n**${docTitle}** has been permanently stored and indexed under **${docCategory}** records in your Family Document Vault.\n\nYou can now view and download it anytime from the Document Vault module.`;
        sources.push('Family Document Vault - Secure Storage');

        const aiReply: AIMessage = {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toISOString(),
          groundingSources: sources
        };
        setAIMessages(prev => [...prev, aiReply]);
        setIsAITyping(false);
        return;
      }

      // 1. Task Assignment Intent (e.g. "tell dad to buy chicken", "ask dad to buy carrots")
      const assignTaskMatch = (text || '').match(/(?:ask|tell|assign|get)\s+([a-zA-Z]+)\s+to\s+(?:buy|get|purchase|pick\s+up|order)\s+(.+?)(?:\s+(?:from|at)\s+.+)?$/i);
      if (assignTaskMatch) {
        const targetNameRaw = assignTaskMatch[1].trim();
        const rawItem = assignTaskMatch[2].trim();
        let assignedMember = targetNameRaw;
        if (/dad|father/i.test(targetNameRaw)) assignedMember = 'Father';
        else if (/mom|mother/i.test(targetNameRaw)) assignedMember = 'Mother';
        else assignedMember = targetNameRaw.charAt(0).toUpperCase() + targetNameRaw.slice(1);

        const groceryCat = /chicken|meat|fish|mutton|beef|pork|egg/i.test(rawItem) ? 'Meat' : 'Produce';

        addGroceryItem({
          name: rawItem,
          category: groceryCat,
          quantity: '1 unit',
          notes: `Assigned to ${assignedMember} by ${currentUser.name}`
        });

        addReminder({
          title: `Buy ${rawItem}`,
          category: 'Grocery',
          dateTime: `${todayDateStr} 18:00`,
          priority: 'Medium',
          completed: false,
          assignedMemberName: assignedMember
        });

        replyText = `✅ **Task Assigned to ${assignedMember}**\n\nI have added **${rawItem}** to your family's grocery list and assigned the reminder task to **${assignedMember}**.\n\n• **Item**: ${rawItem}\n• **Assigned Member**: ${assignedMember}\n• **Status**: Synchronized to Smart Groceries & Reminders.`;
        sources.push('Smart Grocery Module', 'Important Reminders Module');

        const aiReply: AIMessage = {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toISOString(),
          groundingSources: sources,
          actionsExecuted: [
            {
              type: 'add_grocery',
              title: `${rawItem} (Assigned to ${assignedMember})`,
              detail: `Added "${rawItem}" to grocery list and created task assigned to ${assignedMember}`,
              status: 'success'
            }
          ]
        };
        setAIMessages(prev => [...prev, aiReply]);
        setIsAITyping(false);
        return;
      }

      // 2. Direct Grocery Intent (e.g. "add milk to groceries")
      const isGroceryIntent = (
        (queryLower.includes('grocery') || queryLower.includes('groceries') || queryLower.includes('shopping list') || queryLower.startsWith('buy ') || queryLower.startsWith('need ')) &&
        (queryLower.startsWith('add ') || queryLower.startsWith('buy ') || queryLower.startsWith('need ') || queryLower.startsWith('put '))
      );
      if (isGroceryIntent) {
        const rawItem = (text || '')
          .replace(/^(add|buy|need|put)\s+/i, '')
          .replace(/\s+(to|on|in)\s+(the\s+)?(grocery|groceries|shopping)\s*(list)?/i, '')
          .trim();
        if (rawItem && rawItem.length > 1 && !rawItem.toLowerCase().startsWith('what')) {
          const groceryCat = /chicken|meat|fish|mutton/i.test(rawItem) ? 'Meat' : /milk|cheese|butter|yogurt|curd/i.test(rawItem) ? 'Dairy' : 'Pantry';
          addGroceryItem({
            name: rawItem,
            category: groceryCat,
            quantity: '1 unit',
            notes: `Logged by HomeBrain AI for ${currentUser.name}`
          });
          replyText = `✅ **Added to Grocery List**\n\nI have added **${rawItem}** to your family's Smart Grocery list.\n\n• **Item**: ${rawItem}\n• **Status**: Pending purchase.`;
          sources.push('Smart Grocery Module');
          const aiReply: AIMessage = {
            id: `msg_${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toISOString(),
            groundingSources: sources,
            actionsExecuted: [
              {
                type: 'add_grocery',
                title: rawItem,
                detail: `Added "${rawItem}" directly to Smart Grocery list`,
                status: 'success'
              }
            ]
          };
          setAIMessages(prev => [...prev, aiReply]);
          setIsAITyping(false);
          return;
        }
      }

      // 3. Bill Payment Intent (e.g. "this electricity bill has been paid")
      const billPaidMatch = (text || '').match(/(?:this\s+)?(.+?)\s+bill\s+(?:has\s+been\s+|is\s+|was\s+)?paid/i) ||
                            (text || '').match(/paid\s+(?:the\s+)?(.+?)(?:\s+bill)?$/i) ||
                            (text || '').match(/mark\s+(?:the\s+)?(.+?)\s+bill\s+as\s+paid/i);
      if (billPaidMatch) {
        const billKey = billPaidMatch[1].trim().toLowerCase();
        const matchedBill = bills.find(b => !b.isPaid && (
          b.title.toLowerCase().includes(billKey) ||
          billKey.includes(b.title.toLowerCase())
        ));
        if (matchedBill) {
          markBillPaid(matchedBill.id);
          replyText = `✅ **Bill Payment Recorded**\n\nMarked **${matchedBill.title}** (₹${matchedBill.amount}) as paid by **${currentUser.name}**.\n\n• **Bill**: ${matchedBill.title}\n• **Status**: Paid in Household Finances.`;
          sources.push('Bills & Expenses Intelligence Database');
          const aiReply: AIMessage = {
            id: `msg_${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toISOString(),
            groundingSources: sources,
            actionsExecuted: [
              {
                type: 'pay_bill',
                title: matchedBill.title,
                detail: `Marked "${matchedBill.title}" as paid by ${currentUser.name}`,
                status: 'success'
              }
            ]
          };
          setAIMessages(prev => [...prev, aiReply]);
          setIsAITyping(false);
          return;
        }
      }

      // 3.2. Direct Expense Creation Intent (e.g. "add ₹500 food expense", "spent 200 on petrol", "add ₹1,000 for petrol")
      const expenseMatch = (text || '').match(/(?:add|spent|log|record)\s+(?:expense\s+)?(?:of\s+)?(?:₹|rs\.?|inr)?\s*(\d+(?:[.,]\d+)?)\s+(?:for|on)\s+(.+)/i) ||
                           (text || '').match(/(?:spent|paid)\s+(?:₹|rs\.?|inr)?\s*(\d+(?:[.,]\d+)?)\s+(?:for|on)\s+(.+)/i) ||
                           (text || '').match(/^add\s+(?:₹|rs\.?|inr)?\s*(\d+(?:[.,]\d+)?)\s+(?:for|on)\s+(.+)/i);
      if (expenseMatch) {
        const amount = parseFloat(expenseMatch[1].replace(/,/g, ''));
        const rawTitle = expenseMatch[2].trim().replace(/\s*expense$/i, '');
        const categoryMatch = /food|grocer|snack|dining|restaurant|lunch|dinner|breakfast/i.test(rawTitle)
          ? 'Food & Dining'
          : /fuel|petrol|diesel|gas|cab|uber|auto|transport|travel/i.test(rawTitle)
            ? 'Transportation'
            : /electric|power|water|internet|wifi|utility|eb\b/i.test(rawTitle)
              ? 'Utilities'
              : /doctor|medic|pharm|health|hospital/i.test(rawTitle)
                ? 'Healthcare'
                : 'Shopping';
        const formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        addExpense({
          title: formattedTitle,
          amount,
          category: categoryMatch as any,
          date: todayDateStr,
          payer: currentUser.name || 'sham',
          description: `Logged via HomeBrain AI`
        });
        replyText = `₹${amount.toLocaleString('en-IN')} ${rawTitle.toLowerCase()} expense has been recorded.`;
        sources.push('Expense Ledger');
        const aiReply: AIMessage = {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toISOString(),
          groundingSources: sources,
          actionsExecuted: [
            {
              type: 'add_expense',
              title: `₹${amount} for ${formattedTitle}`,
              detail: 'Recorded in Expense Ledger',
              status: 'success'
            }
          ]
        };
        setAIMessages(prev => [...prev, aiReply]);
        setIsAITyping(false);
        return;
      }

      // 3.5. Calendar Event Creation, Update & Deletion Intent (Client-Side Fallback)
      const bdayRegex = /\b(?:birth\s*days?|b['’]?days?|birhtdays?|birtdays?|brithdays?|bithdays?|bdays?|dob|born)\b/i;
      const calTopicRegex = /\b(?:birth\s*days?|b['’]?days?|birhtdays?|birtdays?|brithdays?|bithdays?|bdays?|dob|born|anniversary|anniversaries|meeting|meetings|doctor|appointment|appointments|checkup|checkups|housewarming|trip|trips|tour|outing|vacation|holiday|holidays|festival|pongal|diwali|christmas|new\s*year|ramzan|eid|onam|ugadi|holi|navaratri|puja|pooja|function|functions|marriage|wedding|reception|engagement|ceremony|party|dinner|lunch|reunion|exam|exams|interview|calendar|schedule|events?)\b/i;

      const parseClientDate = (raw: string): { date?: string; display?: string; time?: string } => {
        const c = raw.toLowerCase();
        const months: Record<string, number> = {
          jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
          may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
          sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
        };
        const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let extractedTime: string | undefined;
        const tMatch = c.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
        if (tMatch) {
          let h = parseInt(tMatch[1], 10);
          const m = tMatch[2] || '00';
          const ap = tMatch[3].toUpperCase();
          if (ap === 'PM' && h < 12) h += 12;
          if (ap === 'AM' && h === 12) h = 0;
          extractedTime = `${String(h).padStart(2, '0')}:${m}`;
        }
        const isoM = c.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoM) return { date: `${isoM[1]}-${isoM[2].padStart(2, '0')}-${isoM[3].padStart(2, '0')}`, display: `${isoM[1]}-${isoM[2].padStart(2, '0')}-${isoM[3].padStart(2, '0')}`, time: extractedTime };
        const mdM = c.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})(?:st|nd|rd|th)?\b/i);
        if (mdM) {
          const mIdx = months[mdM[1].toLowerCase()];
          const day = parseInt(mdM[2], 10);
          if (mIdx !== undefined && day >= 1 && day <= 31) {
            return { date: `2026-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, display: `${fullMonths[mIdx]} ${day}, 2026`, time: extractedTime };
          }
        }
        const dmM = c.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
        if (dmM) {
          const day = parseInt(dmM[1], 10);
          const mIdx = months[dmM[2].toLowerCase()];
          if (mIdx !== undefined && day >= 1 && day <= 31) {
            return { date: `2026-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, display: `${fullMonths[mIdx]} ${day}, 2026`, time: extractedTime };
          }
        }
        return { time: extractedTime };
      };

      const extractClientPerson = (q: string): string | undefined => {
        if (/\b(?:father|dad|appa)\b/i.test(q)) return 'Father';
        if (/\b(?:mother|mom|amma|mothers?)\b/i.test(q)) return 'Mother';
        if (/\b(?:grandfather|grandpa|thatha)\b/i.test(q)) return 'Grandfather';
        if (/\b(?:grandmother|grandma|paati)\b/i.test(q)) return 'Grandmother';
        if (/\b(?:son|sha|shamsampth06)\b/i.test(q)) return 'Son';
        if (/\bsarah\b/i.test(q)) return 'Sarah';
        if (/\bsneha\b/i.test(q)) return 'Sneha';
        if (/\bsham\b/i.test(q)) return 'Sham';
        if (/\bbrother\b/i.test(q)) return 'Brother';
        if (/\bsister\b/i.test(q)) return 'Sister';
        const stop = new Set([
          'when', 'what', 'where', 'which', 'who', 'how', 'is', 'are', 'was', 'do', 'does', 'did', 'have', 'has',
          'i', 'we', 'you', 'my', 'our', 'your', 'the', 'a', 'an', 'all', 'any', 'family', 'member', 'members',
          'upcoming', 'next', 'last', 'this', 'week', 'month', 'year', 'today', 'tomorrow', 'date', 'dates',
          'event', 'events', 'calendar', 'schedule', 'add', 'create', 'set', 'plan', 'save', 'book', 'change',
          'update', 'move', 'edit', 'reschedule', 'delete', 'remove', 'cancel', 'show', 'list', 'get', 'fetch',
          'find', 'check', 'tell', 'me', 'on', 'in', 'at', 'to', 'for', 'of', 'as', 'from', 'by', 'with',
          'saved', 'added', 'recorded', 'already', 'birthday', 'birthdays', 'birth', 'bday', 'bdays',
          'birhtday', 'birhtdays', 'birtday', 'birtdays', 'brithday', 'brithdays', 'bithday', 'bithdays',
          'dob', 'born', 'anniversary', 'anniversaries', 'celebration', 'party', 'function', 'ceremony', 'holiday',
          'jan', 'january', 'feb', 'february', 'mar', 'march', 'apr', 'april', 'may', 'jun', 'june',
          'jul', 'july', 'aug', 'august', 'sep', 'sept', 'september', 'oct', 'october', 'nov', 'november', 'dec', 'december',
          'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'am', 'pm', 'st', 'nd', 'rd', 'th'
        ]);
        const tokens = q.toLowerCase().replace(/['’]s\b/g, ' ').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2 && !stop.has(w));
        if (tokens.length > 0) return tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1);
        return undefined;
      };

      const clientDateInfo = parseClientDate(queryLower);
      const isCalCreateCmd = /^(?:add|schedule|plan|create|set|book)\b/i.test(queryLower) && (calTopicRegex.test(queryLower) || !!clientDateInfo.date);
      const isCalUpdateCmd = /^(?:change|move|reschedule|postpone|update|edit)\b/i.test(queryLower) && (calTopicRegex.test(queryLower) || !!clientDateInfo.date);

      if (isCalCreateCmd && clientDateInfo.date) {
        const reqDate = clientDateInfo.date;
        const reqDisplay = clientDateInfo.display || reqDate;
        if (bdayRegex.test(queryLower)) {
          const person = extractClientPerson(queryLower) || 'Family Member';
          const evtTitle = `${person}'s Birthday`;
          addEvent({
            title: evtTitle,
            date: reqDate,
            time: clientDateInfo.time || '19:00',
            category: 'Birthday',
            description: `${evtTitle} added by HomeBrain AI`,
            membersInvolved: [person],
            reminder: true,
            recurring: 'Yearly'
          });
          replyText = `🎂 **${person}'s birthday** has been added to your calendar on **${reqDisplay}** (${reqDate}).\n\n• **${reqDate} at ${clientDateInfo.time || '19:00'}**: ${evtTitle} (Birthday) - Members: ${person}`;
          sources.push('Family Calendar');
          setAIMessages(prev => [...prev, {
            id: `msg_${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toISOString(),
            groundingSources: sources,
            actionsExecuted: [{ type: 'add_event', title: evtTitle, detail: `Saved on ${reqDate}`, status: 'success' }]
          }]);
          setIsAITyping(false);
          return;
        } else {
          const asM = text.match(/\b(?:as|called|named)\s+(.+?)(?:\s+(?:on|in|at)\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d).*)?$/i);
          let rawTitle = asM ? asM[1].trim() : text
            .replace(/^(?:schedule|add|plan|create|set|book)\s+(?:a\s+|an\s+|the\s+)?/i, '')
            .replace(/^event\s+/i, '')
            .replace(/\b(?:date\s+)?(?:on|in|for|at|to)?\s*(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?|\d{4}-\d{1,2}-\d{1,2})\b/gi, ' ')
            .replace(/\bdate\b$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (!rawTitle) rawTitle = 'Family Event';
          const evtTitle = rawTitle.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          const cat: any = /holiday|festival|vacation|anniversary|puja|pooja/i.test(queryLower) ? 'Holiday' : /doctor|appointment|checkup/i.test(queryLower) ? 'Appointment' : /meeting/i.test(queryLower) ? 'Meeting' : 'General';
          addEvent({
            title: evtTitle,
            date: reqDate,
            time: clientDateInfo.time || '10:00',
            category: cat,
            description: `Scheduled via HomeBrain AI`,
            membersInvolved: [currentUser.name],
            reminder: true,
            recurring: cat === 'Holiday' ? 'Yearly' : 'None'
          });
          replyText = `✅ **Added to Family Calendar**\n\nScheduled **"${evtTitle}"** on **${reqDisplay}** (${reqDate}) at **${clientDateInfo.time || '10:00'}**.\n\n• **${reqDate} at ${clientDateInfo.time || '10:00'}**: ${evtTitle} (${cat}) - Members: ${currentUser.name}`;
          sources.push('Family Calendar');
          setAIMessages(prev => [...prev, {
            id: `msg_${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toISOString(),
            groundingSources: sources,
            actionsExecuted: [{ type: 'add_event', title: evtTitle, detail: `Scheduled on ${reqDate}`, status: 'success' }]
          }]);
          setIsAITyping(false);
          return;
        }
      }

      if (isCalUpdateCmd && clientDateInfo.date) {
        const reqDate = clientDateInfo.date;
        const reqDisplay = clientDateInfo.display || reqDate;
        const person = extractClientPerson(queryLower);
        if (person) {
          const existing = events.find(e => e.title.toLowerCase().includes(person.toLowerCase()));
          if (existing) {
            updateEvent(existing.id, { date: reqDate });
            replyText = `🎂 **Birthday Updated**: **${existing.title.replace('[DEMO] ', '')}** has been updated to **${reqDisplay}** (${reqDate}).\n\n• **${reqDate} at ${existing.time || '19:00'}**: ${existing.title.replace('[DEMO] ', '')} (Birthday) - Members: ${person}`;
            sources.push('Family Calendar');
            setAIMessages(prev => [...prev, {
              id: `msg_${Date.now()}`,
              sender: 'assistant',
              text: replyText,
              timestamp: new Date().toISOString(),
              groundingSources: sources,
              actionsExecuted: [{ type: 'add_event', title: existing.title, detail: `Updated date to ${reqDate}`, status: 'success' }]
            }]);
            setIsAITyping(false);
            return;
          }
        }
      }

      const isToday = (
        queryLower.includes('today') ||
        queryLower.includes('only today') ||
        queryLower === 'only give today' ||
        queryLower === 'give today' ||
        queryLower.includes('for today') ||
        queryLower.includes('happening today') ||
        queryLower === 'today schedule' ||
        queryLower === 'what is today schedule?' ||
        queryLower === 'what is today schedule'
      );

      if (isToday) {
        const todayEvts = events.filter(e => e.date === todayDateStr);
        const todayRems = reminders.filter(r => !r.completed && (r.dateTime?.startsWith(todayDateStr) || !r.dateTime));

        if (todayEvts.length > 0) {
          replyText = `📅 **Today's Family Schedule (${todayDateStr})**:\n\n` +
            todayEvts.map(e => `• **${e.date} at ${e.time}**: ${e.title.replace('[DEMO] ', '')} (${e.category}) - Members: ${(Array.isArray(e.membersInvolved) ? e.membersInvolved : []).join(', ')}`).join('\n');
          if (todayRems.length > 0) {
            replyText += `\n\n📝 **Pending Reminders for Today**:\n` +
              todayRems.map(r => `• **${r.title.replace('[DEMO] ', '')}** (${r.priority} Priority, Assigned: ${r.assignedMemberName || 'Family'})`).join('\n');
          }
        } else {
          const futureEvents = events.filter(e => e.date > todayDateStr).sort((a, b) => a.date.localeCompare(b.date));
          const nextEv = futureEvents[0];
          replyText = `📅 **Today's Family Schedule (${todayDateStr})**:\n\n` +
            `There are **no calendar events scheduled for today**.\n\n` +
            (todayRems.length > 0 ? `📝 **Today's Reminders**:\n${todayRems.map(r => `• **${r.title.replace('[DEMO] ', '')}**`).join('\n')}\n\n` : '') +
            (nextEv ? `*(Your next upcoming event is **${nextEv.title.replace('[DEMO] ', '')}** on ${nextEv.date} at ${nextEv.time}).*` : '');
        }
        sources.push('Calendar Events Table', 'Important Reminders Table');
      } else if (queryLower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
        const tomorrowEvts = events.filter(e => e.date === tomorrowDateStr);
        if (tomorrowEvts.length > 0) {
          replyText = `📅 **Tomorrow's Schedule (${tomorrowDateStr})**:\n\n` +
            tomorrowEvts.map(e => `• **${e.date} at ${e.time}**: ${e.title.replace('[DEMO] ', '')} (${e.category}) - Members: ${(Array.isArray(e.membersInvolved) ? e.membersInvolved : []).join(', ')}`).join('\n');
        } else {
          replyText = `📅 **Tomorrow's Schedule (${tomorrowDateStr})**:\n\nNo calendar events scheduled for tomorrow.`;
        }
        sources.push('Calendar Events Table');
      } else if (queryLower.includes('event') || queryLower.includes('calendar') || queryLower.includes('schedule') || queryLower.includes('upcoming') || queryLower.includes('plans')) {
        const upcomingEvents = events.filter(e => e.date >= todayDateStr).sort((a, b) => a.date.localeCompare(b.date));
        const listToShow = upcomingEvents.length > 0 ? upcomingEvents : events;
        replyText = `📅 **Upcoming Family Events (${listToShow.length} scheduled)**:\n\n` +
          listToShow.slice(0, 8).map(e => `• **${e.date} at ${e.time}**: ${e.title.replace('[DEMO] ', '')} (${e.category}) - Members: ${(Array.isArray(e.membersInvolved) ? e.membersInvolved : []).join(', ')}`).join('\n');
        sources.push('Calendar Events Table');
      } else if (queryLower.includes('medicine') && (queryLower.includes('due') || queryLower.includes('today') || queryLower.includes('prescription'))) {
        replyText = `💊 **Registered Family Medication Regimens (${medicines.length} active)**:\n\n` +
          medicines.map(m => `• **For ${m.personName}**: ${m.name.replace('[DEMO] ', '')} (${m.dosage}) at **${m.timing}** [Frequency: ${m.frequency}] - ${m.notes || 'Take as advised'}`).join('\n') +
          `\n\n*Tip: You can log adherence directly from the Medicine card on your Dashboard.*`;
        sources.push('Medicine Manager Table');
      } else if (queryLower.includes('grocery') || queryLower.includes('groceries') || queryLower.includes('left on')) {
        const pending = groceries.filter(g => !g.isPurchased);
        replyText = `There are **${pending.length} pending items** on your family grocery list:\n\n` +
          pending.map(g => `🛒 **${g.name}** (${g.quantity}) - Category: ${g.category}`).join('\n') +
          `\n\nWould you like me to add any additional items for you?`;
        sources.push('Smart Grocery List Database');
      } else if (queryLower.includes('who bought') || queryLower.includes('bought the milk') || queryLower.includes('bought milk')) {
        const milkItem = groceries.find(g => g.name.toLowerCase().includes('milk'));
        if (milkItem && milkItem.isPurchased) {
          replyText = `The item was bought by **${milkItem.purchasedBy}** on **${milkItem.purchasedAt ? formatIndiaDateTime(milkItem.purchasedAt) : 'an unknown date'}**.`;
        } else {
          replyText = `No purchased milk item was found in the family grocery data.`;
        }
        sources.push('Grocery Purchase History Log');
      } else if (queryLower.includes('bill') || queryLower.includes('bills')) {
        const unpaid = bills.filter(b => !b.isPaid);
        replyText = `You have **${unpaid.length} upcoming unpaid bills**:\n\n` +
          unpaid.map(b => `⚡ **${b.title}**: ${formatINR(b.amount)} (Due: ${b.dueDate})`).join('\n') +
          `\nTotal pending bills amount: **${formatINR(unpaid.reduce((acc, b) => acc + b.amount, 0))}**`;
        sources.push('Bills & Expenses Intelligence Database');
      } else if (
        queryLower.includes('document') ||
        queryLower.includes('passport') ||
        queryLower.includes('medical') ||
        queryLower.includes('health record') ||
        queryLower.includes('insurance') ||
        queryLower.includes('vault') ||
        queryLower.includes('fetch') ||
        queryLower.includes('policy') ||
        queryLower.includes('aadhar') ||
        queryLower.includes('aadhaar') ||
        queryLower.includes('license') ||
        queryLower.includes('licence') ||
        queryLower.includes('deed') ||
        queryLower.includes('certificate') ||
        queryLower.includes('download')
      ) {
        const specificChecks = [
          {
            name: 'Passport',
            requested: queryLower.includes('passport'),
            match: (d: DocumentItem) => {
              const txt = `${d.title} ${d.description || ''} ${d.category}`.toLowerCase();
              return txt.includes('passport');
            }
          },
          {
            name: 'Medical Records',
            requested: queryLower.includes('medical') || queryLower.includes('health record') || queryLower.includes('prescription') || queryLower.includes('doctor report') || queryLower.includes('hospital'),
            match: (d: DocumentItem) => {
              const txt = `${d.title} ${d.description || ''} ${d.category}`.toLowerCase();
              return txt.includes('medical') || txt.includes('prescription') || txt.includes('health') || (d.category || '').toLowerCase() === 'medical';
            }
          },
          {
            name: 'Insurance Policy',
            requested: queryLower.includes('insurance') || queryLower.includes('policy') || queryLower.includes('star health') || queryLower.includes('mediclaim'),
            match: (d: DocumentItem) => {
              const txt = `${d.title} ${d.description || ''} ${d.category}`.toLowerCase();
              return txt.includes('insurance') || txt.includes('policy') || txt.includes('star health') || txt.includes('mediclaim');
            }
          },
          {
            name: 'Aadhaar Card',
            requested: queryLower.includes('aadhar') || queryLower.includes('aadhaar'),
            match: (d: DocumentItem) => {
              const txt = `${d.title} ${d.description || ''} ${d.category}`.toLowerCase();
              const hasAadhaar = txt.includes('aadhar') || txt.includes('aadhaar');
              if (!hasAadhaar) return false;
              for (const c of ['sarah', 'sneha', 'sham', 'father', 'dad', 'mother', 'mom', 'rajesh', 'priya']) {
                if (new RegExp(`\\b${c}\\b`, 'i').test(queryLower)) {
                  const target = c === 'dad' ? 'father' : c === 'mom' ? 'mother' : c;
                  return txt.includes(target);
                }
              }
              return true;
            }
          },
          {
            name: 'Driving License',
            requested: queryLower.includes('license') || queryLower.includes('licence'),
            match: (d: DocumentItem) => {
              const txt = `${d.title} ${d.description || ''} ${d.category}`.toLowerCase();
              return txt.includes('license') || txt.includes('licence');
            }
          },
          {
            name: 'Property Deed / Agreement',
            requested: queryLower.includes('deed') || queryLower.includes('rental') || queryLower.includes('lease'),
            match: (d: DocumentItem) => {
              const txt = `${d.title} ${d.description || ''} ${d.category}`.toLowerCase();
              return txt.includes('deed') || txt.includes('rental') || txt.includes('lease');
            }
          },
          {
            name: 'Certificate',
            requested: queryLower.includes('certificate') || queryLower.includes('degree') || queryLower.includes('marksheet'),
            match: (d: DocumentItem) => {
              const txt = `${d.title} ${d.description || ''} ${d.category}`.toLowerCase();
              return txt.includes('certificate') || txt.includes('degree') || txt.includes('marksheet');
            }
          }
        ];

        const requestedChecks = specificChecks.filter(c => c.requested);
        const matchedDocs: DocumentItem[] = [];
        const missingItems: string[] = [];

        if (requestedChecks.length > 0) {
          for (const check of requestedChecks) {
            const doc = documents.find(check.match);
            if (doc) {
              if (!matchedDocs.some(d => d.id === doc.id)) matchedDocs.push(doc);
            } else {
              missingItems.push(check.name);
            }
          }
        } else {
          // If no specific category matched, check if any document title or keyword directly appears in query
          const directMatches = documents.filter(d => {
            const titleClean = d.title.toLowerCase().replace('[demo] ', '').trim();
            return queryLower.includes(titleClean) || (d.category && queryLower.includes(d.category.toLowerCase()));
          });
          if (directMatches.length > 0) {
            matchedDocs.push(...directMatches);
          }
        }

        const isSpecificWhereQuery = /(?:where\s+is|where\s+are|find\s+my|find\s+the|fetch\s+my|fetch\s+the|download\s+my|download\s+the|do\s+we\s+have)\s+/i.test(queryLower);

        // Case A: Specific document(s) were requested, and NONE were found in the vault
        if (matchedDocs.length === 0 && (missingItems.length > 0 || isSpecificWhereQuery)) {
          const missingFormatted = missingItems.length > 1
            ? missingItems.slice(0, -1).map(m => `**${m}**`).join(', ') + ' and **' + missingItems[missingItems.length - 1] + '**'
            : (missingItems[0] ? `**${missingItems[0]}**` : 'the requested document');

          replyText = `❌ **Not Available in Document Vault**\n\n` +
            `The requested document (${missingFormatted}) is **not available** in your Family Document Vault.\n\n` +
            (documents.length > 0
              ? `📁 **Currently Stored in Vault (${documents.length} file${documents.length === 1 ? '' : 's'})**:\n` +
                documents.map(d => `• **${d.title.replace('[DEMO] ', '')}** (${d.category}, ${d.fileType} - ${d.fileSize})`).join('\n') +
                `\n\n*(Tip: You can upload your ${missingItems.join('/') || 'document'} anytime in the Document Vault module).*`
              : `*(No documents have been uploaded to your family vault yet).*`
            );
        } else if (matchedDocs.length > 0) {
          // Case B: At least one requested document was found
          replyText = matchedDocs.map(doc => {
            return `📄 **Retrieved Document**: **${doc.title.replace('[DEMO] ', '')}** (${doc.category})\n\n` +
              `• **File Type & Size**: ${doc.fileType} (${doc.fileSize})\n` +
              `• **Uploaded By**: ${doc.uploaderName} on ${doc.uploadDate}\n\n` +
              `📝 **Extracted Summary & Verification**:\n${doc.summaryContent || doc.description}\n\n` +
              `📍 **Physical House Storage Location**: ${doc.description || 'Document Vault'}\n\n` +
              `*(Click **Download Document** below to download directly to your device).*`;
          }).join('\n\n---\n\n');

          if (missingItems.length > 0) {
            replyText += `\n\n⚠️ **Note**: The following requested document (${missingItems.map(m => `**${m}**`).join(', ')}) is **not available** in your Document Vault.`;
          }
        } else if (documents.length > 0) {
          // Case C: General document inquiry (e.g. "show documents", "vault records", "list files")
          replyText = `📁 **Retrieved Family Document Vault Records (${documents.length} files securely stored)**:\n\n` +
            documents.map(d =>
              `• **${d.title.replace('[DEMO] ', '')}** (${d.category}, ${d.fileType} - ${d.fileSize}): Uploaded by ${d.uploaderName}\n  📝 **Extracted Summary**: ${d.summaryContent || d.description}`
            ).join('\n\n') +
            `\n\n*(You can view original digital copies anytime in the Document Vault.)*`;
        } else {
          replyText = `I searched your Document Vault, but no documents have been uploaded yet. You can upload documents in the Document Vault or drag and drop here.`;
        }
        sources.push('Document Vault Database');
      } else if (/birthday|bday|b'day|birhtday|birtday|brithday|bithday|birth\s*day|born|dob|anniversary/i.test(queryLower)) {
        const birthdayEvents = events.filter(e => (e.category || '').toLowerCase() === 'birthday' || /birthday|bday|birhtday|born|anniversary/i.test(e.title));
        const extractedP = extractClientPerson(queryLower);
        let targetMemberKey = extractedP ? extractedP.toLowerCase() : undefined;

        if (!targetMemberKey) {
          const customEvt = birthdayEvents.find(e => {
            const words = (e.title || '').toLowerCase().split(/\s+/).filter(w => w.length >= 2 && !/birthday|bday|celebration|party|test/.test(w));
            return words.some(w => queryLower.includes(w));
          });
          if (customEvt) {
            targetMemberKey = (customEvt.title || '').split(/\s+/)[0].replace(/['’]s$/i, '').toLowerCase();
          }
        }

        if (targetMemberKey) {
          const memberKey = targetMemberKey === 'dad' ? 'father' : targetMemberKey === 'mom' ? 'mother' : targetMemberKey;
          const personDisplay = memberKey.charAt(0).toUpperCase() + memberKey.slice(1);

          const matched = birthdayEvents.find(e => {
            const txt = `${e.title} ${e.description || ''} ${(Array.isArray(e.membersInvolved) ? e.membersInvolved : []).join(' ')}`.toLowerCase();
            return txt.includes(memberKey);
          }) || events.find(e => {
            const txt = `${e.title} ${e.description || ''} ${(Array.isArray(e.membersInvolved) ? e.membersInvolved : []).join(' ')}`.toLowerCase();
            return txt.includes(memberKey) && (txt.includes('birthday') || (e.category || '').toLowerCase() === 'birthday');
          });

          if (matched) {
            const d = new Date(matched.date);
            const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : matched.date;
            replyText = `🎂 **${personDisplay}'s Birthday**: **${formattedDate}**\n\n• **Celebrant**: ${personDisplay}\n• **Event**: ${matched.title.replace('[DEMO] ', '')}\n• **Date**: ${matched.date}${matched.time ? ` at ${matched.time}` : ''}\n\n${matched.description || ''}`;
          } else {
            replyText = `⚠️ **Not Provided**: ${personDisplay}'s birthday has not been recorded in your family calendar yet.`;
          }
        } else if (birthdayEvents.length > 0) {
          replyText = `🎂 **Family Birthdays & Anniversaries**:\n\n` + birthdayEvents.map(e => `• **${e.title.replace('[DEMO] ', '')}**: ${e.date}`).join('\n');
        } else {
          replyText = `No family birthdays or anniversaries recorded yet.`;
        }
        sources.push('Calendar Events & Family Milestones');
      } else if (queryLower.includes('emergency contact') || queryLower.includes('sos contact') || queryLower.includes('emergency')) {
        if (emergencyContacts.length > 0) {
          replyText = `🚨 **Authorized Family Emergency Contacts**:\n\n` +
            emergencyContacts.map(c => `• **${c.name}** (${c.relation}): 📞 [${c.phone}](tel:${c.phone}) ${c.isPrimary ? '*(PRIMARY)*' : ''}`).join('\n') +
            `\n\nThese contacts receive instant SMS & Email notifications if Emergency SOS is triggered.`;
        } else {
          replyText = `⚠️ **Not Provided**: No emergency contacts have been added yet. You can link emergency contacts in Profile & Settings.`;
        }
        sources.push('Emergency Contacts Database');
      } else if (queryLower.includes('allergic') || queryLower.includes('allergy') || queryLower.includes('allergies')) {
        const targetMember = familyMembers.find(m => queryLower.includes(m.name.toLowerCase()));
        const allergyKnws = knowledgeList.filter(k => k.category === 'Allergies' || k.title.toLowerCase().includes('allerg') || k.content.toLowerCase().includes('allerg'));
        if (targetMember) {
          const memberAllergy = allergyKnws.find(k => k.relatedMemberName.toLowerCase().includes(targetMember.name.toLowerCase()));
          if (memberAllergy) {
            replyText = `⚠️ **Medical Allergy for ${targetMember.name}**:\n\n• **${memberAllergy.title}**: ${memberAllergy.content} *(Importance: ${memberAllergy.importance})*`;
          } else {
            replyText = `⚠️ **Not Provided**: No recorded allergies for **${targetMember.name}** in Family Knowledge records.`;
          }
        } else if (allergyKnws.length > 0) {
          replyText = `⚠️ **CRITICAL FAMILY ALLERGIES & HEALTH WARNINGS**:\n\n` +
            allergyKnws.map(k => `• **${k.title}** (For ${k.relatedMemberName}): ${k.content} *[${k.importance}]*`).join('\n');
        } else {
          replyText = `No registered medical allergies found in Family Knowledge records.`;
        }
        sources.push('Family Knowledge Base - Critical Health Record');
      } else if (attachments && attachments.length > 0) {
        const att = attachments[0];
        // Automatically save document to vault (Prompt 1)
        void addDocument({
          title: att.name ? att.name.replace(/\.[^/.]+$/, '') : `${currentUser.name}'s Document`,
          category: 'Identity',
          fileType: (att.name || 'file.pdf').split('.').pop()?.toUpperCase() || 'FILE',
          fileSize: '1.25 MB',
          fileUrl: att.url,
          storagePath: att.url,
          description: `Uploaded directly via HomeBrain AI Chat by ${currentUser.name} on ${todayDateStr}.`,
          summaryContent: `Indexed official document: ${att.name}`,
          uploaderName: currentUser.name
        });
        replyText = `✅ **Saved to Document Vault**!\n\nYour file **"${att.name}"** has been permanently stored and indexed in your Family Document Vault under **Identity** records.\n\nYou can view and download it anytime from the Document Vault module.`;
        sources.push('Family Document Vault');
      } else {
        replyText = `I searched your family records for "${text}". Try asking about today's schedule, medicines, groceries, bills, documents, or past family milestones.`;
        sources.push('Family Central Database');
      }

      const aiReply: AIMessage = {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString(),
        groundingSources: sources
      };

      setAIMessages(prev => [...prev, aiReply]);
      setIsAITyping(false);
    }, 600);
  };

  const clearAIConversation = () => {
    setAIMessages([
      {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared. I am ready for your questions!`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <HomeBrainContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeSubScreen,
        setActiveSubScreen,
        dashboardView,
        setDashboardView,
        selectedItemId,
        setSelectedItemId,
        navigateToSubScreen,
        goBack,
        currentUser,
        updateCurrentUser,
        isDarkMode,
        toggleDarkMode,
        familyMembers,
        addFamilyMember,
        updateFamilyMember,
        removeFamilyMember,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        reminders,
        addReminder,
        updateReminder,
        toggleReminder,
        deleteReminder,
        documents,
        addDocument,
        updateDocument,
        deleteDocument,
        groceries,
        groceryHistory,
        addGroceryItem,
        updateGroceryItem,
        toggleGroceryPurchased,
        deleteGroceryItem,
        medicines,
        medicineLogs,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        logMedicineStatus,
        expenses,
        bills,
        addExpense,
        updateExpense,
        deleteExpense,
        addBill,
        updateBill,
        deleteBill,
        markBillPaid,
        markBillUnpaid,
        knowledgeList,
        knowledgeFiles,
        addKnowledgeFile,
        updateKnowledgeFile,
        deleteKnowledgeFile,
        addKnowledge,
        updateKnowledge,
        deleteKnowledge,
        emergencyContacts,
        emergencyLogs,
        addEmergencyContact,
        updateEmergencyContact,
        deleteEmergencyContact,
        triggerEmergencyAlert,
        cancelEmergencyAlert,
        retryEmergencyAlert,
        emergencySession,
        emergencyNotifications,
        startEmergencySession,
        updateEmergencySessionLocation,
        endEmergencySession,
        openEmergencyNotification,
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        aiMessages,
        isAITyping,
        sendAIMessage,
        clearAIConversation,
        isDataLoading,
        dataError,
        clearDataError,
        refreshFamilyData,
        isAuthenticated,
        enterDemoMode,
        signIn,
        signInWithGoogle,
        signUp,
        signOut: handleSignOut,
        updatePassword: (currentPassword: string, password: string) =>
          updatePassword(currentUser.email, currentPassword, password)
      }}
    >
      {children}
    </HomeBrainContext.Provider>
  );
};

export const useHomeBrain = () => {
  const context = useContext(HomeBrainContext);
  if (!context) {
    throw new Error('useHomeBrain must be used within a HomeBrainProvider');
  }
  return context;
};
