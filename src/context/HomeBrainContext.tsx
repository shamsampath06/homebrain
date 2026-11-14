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
import {
  deleteRow,
  insertRow,
  isSupabaseConfigured,
  loadFamilyData,
  loadEmergencyData,
  listFamilyProfiles,
  signUpWithPassword,
  signInWithPassword,
  signOut,
  updatePassword,
  updateRow,
  deletePrivateFile,
  clearStoredSession,
  getAuthenticatedProfile,
  refreshSession,
  getAccessToken,
  handleOAuthCallback,
  ensureValidUUID
} from '../lib/supabase';
import { formatIndiaDateTime, formatINR } from '../lib/display';
import { SCREEN_META } from '../lib/navigation';
import { getDemoFamilySnapshot } from '../lib/demoData';
import { EXAMPLE_PLACE_MEMORIES } from '../data/exampleMemories';
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
  signUp: (email: string, password: string, name: string, familyName: string) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User>(emptyUser);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('homebrain_darkMode');
      return stored === 'true';
    } catch {
      return true;
    }
  });
  const [isDataLoading, setIsDataLoading] = useState(isSupabaseConfigured);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const authGeneration = useRef(0);

  const clearDataError = () => setDataError(null);
  const reportPersistenceError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'The data operation failed.';
    console.error(message, error);
    if (message.includes('22P02') || message.includes('invalid input syntax for type uuid')) {
      // Suppress local/demo UUID mismatch notices from user-facing red banner
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

  useEffect(() => {
    const hydrate = async () => {
      // Check for OAuth callback from Google Sign-In
      handleOAuthCallback();

      if (!isSupabaseConfigured) {
        setIsDataLoading(false);
        return;
      }
      try {
        const profile = await getAuthenticatedProfile();
        if (profile) {
          profile.familyId = ensureValidUUID(profile.familyId);
          profile.id = ensureValidUUID(profile.id);
          const data = await loadFamilyData(profile);
          setCurrentUser(profile);
          setIsAuthenticated(true);
          setFamilyMembers(data.familyMembers);
          setEvents(data.events);
          setReminders(data.reminders);
          setDocuments(data.documents);
          setGroceries(data.groceries);
          setGroceryHistory(data.groceryHistory);
          setMedicines(data.medicines);
          setMedicineLogs(data.medicineLogs);
          setExpenses(data.expenses);
          setBills(data.bills);
          setKnowledgeList(data.knowledgeList);
          setKnowledgeFiles(data.knowledgeFiles);
          setEmergencyContacts(data.emergencyContacts as EmergencyContact[]);
          setEmergencyLogs(data.emergencyLogs as EmergencyAlertLog[]);
          setEmergencySessions(data.emergencySessions);
          setEmergencyNotifications(data.emergencyNotifications);
          setMemories(data.memories && data.memories.length > 0 ? data.memories : EXAMPLE_PLACE_MEMORIES);
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
    const data = await loadFamilyData(profile);
    setCurrentUser(profile);
    setIsAuthenticated(true);
    setDataError(null);
    setFamilyMembers(data.familyMembers);
    setEvents(data.events);
    setReminders(data.reminders);
    setDocuments(data.documents);
    setGroceries(data.groceries);
    setGroceryHistory(data.groceryHistory);
    setMedicines(data.medicines);
    setMedicineLogs(data.medicineLogs);
    setExpenses(data.expenses);
    setBills(data.bills);
    setKnowledgeList(data.knowledgeList);
    setKnowledgeFiles(data.knowledgeFiles);
    setEmergencyContacts(data.emergencyContacts as EmergencyContact[]);
    setEmergencyLogs(data.emergencyLogs as EmergencyAlertLog[]);
    setEmergencySessions(data.emergencySessions);
    setEmergencyNotifications(data.emergencyNotifications);
    setMemories(data.memories && data.memories.length > 0 ? data.memories : EXAMPLE_PLACE_MEMORIES);
    setIsDataLoading(false);
  };

  const signUp = async (email: string, password: string, name: string, familyName: string) => {
    authGeneration.current += 1;
    const profile = await signUpWithPassword(email, password, name, familyName);
    profile.familyId = ensureValidUUID(profile.familyId);
    profile.id = ensureValidUUID(profile.id);
    const data = await loadFamilyData(profile);
    setCurrentUser(profile);
    setIsAuthenticated(true);
    setDataError(null);
    setFamilyMembers(data.familyMembers.length > 0 ? data.familyMembers : [
      {
        id: `member-${profile.id}`,
        name: profile.name,
        role: 'Admin',
        relation: 'Self',
        avatar: profile.avatar || '👨‍💼',
        phone: '',
        email: profile.email
      }
    ]);
    setEvents(data.events);
    setReminders(data.reminders);
    setDocuments(data.documents);
    setGroceries(data.groceries);
    setGroceryHistory(data.groceryHistory);
    setMedicines(data.medicines);
    setMedicineLogs(data.medicineLogs);
    setExpenses(data.expenses);
    setBills(data.bills);
    setKnowledgeList(data.knowledgeList);
    setKnowledgeFiles(data.knowledgeFiles);
    setEmergencyContacts(data.emergencyContacts);
    setEmergencyLogs(data.emergencyLogs);
    setEmergencySessions(data.emergencySessions);
    setEmergencyNotifications(data.emergencyNotifications);
    setMemories(data.memories && data.memories.length > 0 ? data.memories : EXAMPLE_PLACE_MEMORIES);
    setIsDataLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
    setCurrentUser(emptyUser);
  };

  const enterDemoMode = () => {
    const snapshot = getDemoFamilySnapshot();
    setCurrentUser(snapshot.currentUser);
    setIsAuthenticated(true);
    setFamilyMembers(snapshot.familyMembers);
    setEvents(snapshot.events);
    setReminders(snapshot.reminders);
    setDocuments(snapshot.documents); // strictly empty array
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
    if (!currentUser?.familyId) return;
    try {
      if (isSupabaseConfigured) {
        const data = await loadFamilyData(currentUser);
        if (data.events && data.events.length > 0) setEvents(data.events);
        if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
        if (data.groceries && data.groceries.length > 0) setGroceries(data.groceries);
        if (data.bills && data.bills.length > 0) setBills(data.bills);
        if (data.reminders && data.reminders.length > 0) setReminders(data.reminders);
        return;
      }
      // If Supabase is not configured or in demo mode, fetch backend state
      const token = getAccessToken() || 'demo-token';
      const res = await fetch('/api/family/state', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const state = await res.json();
        if (state.events && Array.isArray(state.events)) {
          setEvents(state.events.map((e: any) => ({
            id: e.id || crypto.randomUUID(),
            title: e.title || '',
            date: e.date || '',
            time: e.time || '10:00',
            category: e.category || 'General',
            description: e.description || '',
            membersInvolved: e.membersInvolved || e.members_involved || [currentUser.name || 'sham'],
            reminder: e.reminder !== undefined ? Boolean(e.reminder) : true,
            recurring: e.recurring || 'None'
          })));
        }
        if (state.expenses && Array.isArray(state.expenses)) {
          setExpenses(state.expenses.map((exp: any) => ({
            id: exp.id || crypto.randomUUID(),
            title: exp.title || 'Expense',
            amount: Number(exp.amount) || 0,
            category: exp.category || 'Other',
            date: exp.date || new Date().toISOString().split('T')[0],
            payer: exp.payer || currentUser.name || 'sham',
            description: exp.description || ''
          })));
        }
        if (state.groceries && Array.isArray(state.groceries)) {
          setGroceries(state.groceries.map((g: any) => ({
            id: g.id || crypto.randomUUID(),
            name: g.name,
            category: g.category || 'Other',
            quantity: g.quantity || '1 unit',
            notes: g.notes,
            isPurchased: Boolean(g.is_purchased ?? g.isPurchased),
            purchasedBy: g.purchased_by || g.purchasedBy,
            purchasedAt: g.purchased_at || g.purchasedAt
          })));
        }
        if (state.bills && Array.isArray(state.bills)) {
          setBills(state.bills.map((b: any) => ({
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
        if (state.reminders && Array.isArray(state.reminders)) {
          setReminders(state.reminders.map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            title: r.title,
            category: r.category || 'General',
            dateTime: r.date_time || r.dateTime || '',
            priority: r.priority || 'Medium',
            completed: Boolean(r.completed),
            assignedMemberName: r.assigned_member_name || r.assignedMemberName || currentUser.name
          })));
        }
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
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

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
  const [events, setEvents] = useState<FamilyEvent[]>([]);

  const addEvent = (event: Omit<FamilyEvent, 'id'>) => {
    const newEvt: FamilyEvent = { ...event, id: crypto.randomUUID() };
    setEvents(prev => [...prev, newEvt]);
    void persist(() => insertRow('events', currentUser.familyId, newEvt).then(() => undefined));
  };

  const updateEvent = (id: string, updated: Partial<FamilyEvent>) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updated } : e)));
    void persist(() => updateRow('events', currentUser.familyId, id, updated));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    void persist(() => deleteRow('events', currentUser.familyId, id));
  };

  // Reminders
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  const addReminder = (rem: Omit<ReminderItem, 'id'>) => {
    const newRem: ReminderItem = { ...rem, id: crypto.randomUUID() };
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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const addDocument = async (doc: Omit<DocumentItem, 'id' | 'uploadDate'>): Promise<void> => {
    const newDoc: DocumentItem = {
      ...doc,
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [newDoc, ...prev]);
    if (isSupabaseConfigured) {
      await persist(async () => {
        await insertRow('documents', currentUser.familyId, newDoc);
      });
    }
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
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
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
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
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
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);

  const addExpense = (exp: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = { ...exp, id: crypto.randomUUID() };
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
        setEmergencySessions(data.sessions);
        setEmergencyNotifications(data.notifications);
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
          recipients: emergencyContacts.map(c => ({
            id: c.id,
            name: c.name,
            email: (c.email && c.email.includes('@') && !c.email.endsWith('.internal')) ? c.email : 'harleysham6925@gmail.com',
            phone: c.phone
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedLog: EmergencyAlertLog = {
          ...initialLog,
          id: data.eventId || initialLog.id,
          status: (data.overallStatus === 'EMAIL_DELIVERED' || data.overallStatus === 'EMAIL_SENT' || data.overallStatus === 'SMS_SENT' || data.overallStatus === 'SMS_DELIVERED')
            ? 'Delivered'
            : (data.overallStatus === 'SOS_CREATED' ? 'Logged' : (data.overallStatus === 'EMAIL_FAILED' || data.overallStatus === 'SMS_FAILED' ? 'Failed' : 'Sent')),
          overallStatus: data.overallStatus || 'SOS_CREATED',
          smsResults: data.sms?.results || [],
          emailResults: data.email?.results || []
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
        emailResults: emergencyContacts.map(c => ({
          recipient: (c.email && c.email.includes('@') && !c.email.endsWith('.internal')) ? c.email : 'harleysham6925@gmail.com',
          recipientName: c.name,
          status: 'UNCONFIGURED',
          provider: 'none',
          error: 'Backend unreachable or RESEND_API_KEY not in .env.local',
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
          contacts: emergencyContacts
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

  // Memories (defaults to 6 Place Folders with 2-3 photos each)
  const [memories, setMemories] = useState<FamilyMemory[]>(EXAMPLE_PLACE_MEMORIES);

  const addMemory = async (mem: Omit<FamilyMemory, 'id'>): Promise<void> => {
    const newMem: FamilyMemory = { ...mem, id: crypto.randomUUID() };
    setMemories(prev => [newMem, ...prev]);
    if (isSupabaseConfigured) {
      await persist(async () => {
        await insertRow('family_memories', currentUser.familyId, newMem);
      });
    }
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
          senderName: currentUser?.name || 'sham',
          userId: currentUser?.id || 'demo-user-sham',
          isDemo: true
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

        // Synchronize React states immediately from live response
        if (data.allEvents && Array.isArray(data.allEvents)) {
          setEvents(data.allEvents.map((e: any) => ({
            id: e.id || crypto.randomUUID(),
            title: e.title || '',
            date: e.date || '',
            time: e.time || '10:00',
            category: e.category || 'General',
            description: e.description || '',
            membersInvolved: e.membersInvolved || e.members_involved || [currentUser.name || 'sham'],
            reminder: e.reminder !== undefined ? Boolean(e.reminder) : true,
            recurring: e.recurring || 'None'
          })));
        }

        if (data.allExpenses && Array.isArray(data.allExpenses)) {
          setExpenses(data.allExpenses.map((exp: any) => ({
            id: exp.id || crypto.randomUUID(),
            title: exp.title || 'Expense',
            amount: Number(exp.amount) || 0,
            category: exp.category || 'Other',
            date: exp.date || new Date().toISOString().split('T')[0],
            payer: exp.payer || currentUser.name || 'sham',
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

        // Direct state fallback if full arrays were omitted
        if (executedActions && executedActions.length > 0) {
          for (const act of executedActions) {
            if (act.type === 'add_expense' && !data.allExpenses) {
              const amountMatch = act.title.match(/₹\s*(\d+(?:[.,]\d+)?)/);
              const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
              const catMatch = act.title.match(/for\s+(.+)$/i);
              const expTitle = catMatch ? catMatch[1].trim() : act.title;
              if (amount > 0) {
                const newExp: ExpenseItem = {
                  id: crypto.randomUUID(),
                  title: expTitle,
                  amount,
                  category: (/food|grocer|snack|dining/i.test(expTitle) ? 'Dining' : /electric|power|bill|utility/i.test(expTitle) ? 'Utilities' : /fuel|petrol|diesel|car|bike/i.test(expTitle) ? 'Maintenance' : 'Shopping') as ExpenseCategory,
                  date: new Date().toISOString().split('T')[0],
                  payer: currentUser.name || 'sham'
                };
                setExpenses(prev => [newExp, ...prev]);
              }
            } else if (act.type === 'add_event' && !data.allEvents) {
              const dateMatch = act.detail.match(/(\d{4}-\d{2}-\d{2})/);
              const targetDate = dateMatch ? dateMatch[1] : '';
              if (targetDate) {
                setEvents(prev => {
                  const existingIdx = prev.findIndex(e => e.title.toLowerCase().includes(act.title.toLowerCase()) || act.title.toLowerCase().includes(e.title.toLowerCase()));
                  if (existingIdx >= 0 && act.detail.includes('Updated')) {
                    const copy = [...prev];
                    copy[existingIdx] = { ...copy[existingIdx], date: targetDate };
                    return copy;
                  }
                  const newEvt: FamilyEvent = {
                    id: crypto.randomUUID(),
                    title: act.title,
                    date: targetDate,
                    time: '10:00',
                    category: /birthday/i.test(act.title) ? 'Birthday' : 'General',
                    membersInvolved: [currentUser.name || 'sham'],
                    reminder: true,
                    recurring: /birthday/i.test(act.title) ? 'Yearly' : 'None'
                  };
                  return [...prev, newEvt];
                });
              }
            }
          }
          if (!data.allEvents && !data.allExpenses && !data.allGroceries && !data.allBills) {
            void refreshFamilyData();
          }
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
