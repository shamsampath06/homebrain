import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  FamilyMember,
  FamilyEvent,
  ReminderItem,
  DocumentItem,
  GroceryItem,
  GroceryHistoryItem,
  MedicineItem,
  MedicineLog,
  ExpenseItem,
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
  handleOAuthCallback
} from '../lib/supabase';
import { formatIndiaDateTime, formatINR } from '../lib/display';
import { SCREEN_META } from '../lib/navigation';
import { getDemoFamilySnapshot } from '../lib/demoData';

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
  | 'privacy';

interface HomeBrainContextType {
  // Navigation State
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  activeSubScreen: SubScreen;
  setActiveSubScreen: (sub: SubScreen) => void;
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
  triggerEmergencyAlert: (location: { address: string; latitude: number; longitude: number; accuracyMeters?: number; mapUrl: string }) => Promise<EmergencyAlertLog>;
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
      return localStorage.getItem('homebrain_darkMode') === 'true';
    } catch {
      return false;
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
          setMemories(data.memories);
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
    setMemories(data.memories);
    setIsDataLoading(false);
  };

  const signUp = async (email: string, password: string, name: string, familyName: string) => {
    authGeneration.current += 1;
    const profile = await signUpWithPassword(email, password, name, familyName);
    if (!profile) {
      throw new Error('Registration succeeded but email confirmation is required before signing in.');
    }
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
    setEmergencyContacts(data.emergencyContacts);
    setEmergencyLogs(data.emergencyLogs);
    setEmergencySessions(data.emergencySessions);
    setEmergencyNotifications(data.emergencyNotifications);
    setMemories(data.memories);
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
      const data = await loadFamilyData(currentUser);
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
      setMemories(data.memories);
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
    await insertRow('documents', currentUser.familyId, newDoc);
    setDocuments(prev => [newDoc, ...prev]);
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
    const session = await insertRow<EmergencySession>('emergency_sessions', currentUser.familyId, {
      id: crypto.randomUUID(),
      familyId: currentUser.familyId,
      initiatedBy: currentUser.id,
      initiatorName: currentUser.name,
      status: 'active',
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: location.accuracyMeters,
      lastLocationAt: now,
      createdAt: now
    });
    const profiles = await listFamilyProfiles(currentUser.familyId);
    const notifications = await Promise.all(profiles.map(profile => insertRow<EmergencyNotification>('emergency_notifications', currentUser.familyId, {
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
    setEmergencySessions(prev => [session, ...prev.filter(item => item.id !== session.id)]);
    setEmergencyNotifications(prev => [...notifications, ...prev.filter(item => item.sessionId !== session.id)]);
  };

  const updateEmergencySessionLocation = async (location: { address: string; latitude: number; longitude: number; accuracyMeters?: number }) => {
    if (!emergencySession || emergencySession.initiatedBy !== currentUser.id) {
      throw new Error('Only the person who started this SOS session can update it.');
    }
    const lastLocationAt = new Date().toISOString();
    const update = { address: location.address, latitude: location.latitude, longitude: location.longitude, accuracyMeters: location.accuracyMeters, lastLocationAt };
    await updateRow('emergency_sessions', currentUser.familyId, emergencySession.id, update);
    const ownNotifications = emergencyNotifications.filter(notification => notification.sessionId === emergencySession.id);
    await Promise.all(ownNotifications.map(notification => updateRow('emergency_notifications', currentUser.familyId, notification.id, update)));
    setEmergencySessions(prev => prev.map(session => session.id === emergencySession.id ? { ...session, ...update } : session));
    setEmergencyNotifications(prev => prev.map(notification => notification.sessionId === emergencySession.id ? { ...notification, ...update } : notification));
  };

  const endEmergencySession = async () => {
    if (!emergencySession || emergencySession.initiatedBy !== currentUser.id) {
      throw new Error('Only the person who started this SOS session can end it.');
    }
    const endedAt = new Date().toISOString();
    await updateRow('emergency_sessions', currentUser.familyId, emergencySession.id, { status: 'ended', endedAt });
    const ownNotifications = emergencyNotifications.filter(notification => notification.sessionId === emergencySession.id);
    await Promise.all(ownNotifications.map(notification => updateRow('emergency_notifications', currentUser.familyId, notification.id, { status: 'ended' })));
    setEmergencySessions(prev => prev.map(session => session.id === emergencySession.id ? { ...session, status: 'ended', endedAt } : session));
    setEmergencyNotifications(prev => prev.map(notification => notification.sessionId === emergencySession.id ? { ...notification, status: 'ended' } : notification));
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

  const triggerEmergencyAlert = async (location: { address: string; latitude: number; longitude: number; accuracyMeters?: number; mapUrl: string }): Promise<EmergencyAlertLog> => {
    const log: EmergencyAlertLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userLocation: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: location.accuracyMeters,
      userName: currentUser.name,
      status: 'Logged',
      recipients: emergencyContacts.map(c => `${c.name} (${c.phone})`)
    };
    setEmergencyLogs(prev => [log, ...prev]);
    await insertRow('emergency_logs', currentUser.familyId, {
      id: log.id,
      timestamp: log.timestamp,
      userLocation: log.userLocation,
      latitude: log.latitude,
      longitude: log.longitude,
      accuracyMeters: log.accuracyMeters,
      userId: currentUser.id,
      userName: currentUser.name,
      status: log.status,
      recipients: log.recipients
    }).then(() => undefined);
    return log;
  };

  // Memories
  const [memories, setMemories] = useState<FamilyMemory[]>([]);

  const addMemory = async (mem: Omit<FamilyMemory, 'id'>): Promise<void> => {
    const newMem: FamilyMemory = { ...mem, id: crypto.randomUUID() };
    await insertRow('family_memories', currentUser.familyId, newMem);
    setMemories(prev => [newMem, ...prev]);
  };

  const updateMemory = async (id: string, updated: Partial<FamilyMemory>): Promise<void> => {
    await updateRow('family_memories', currentUser.familyId, id, updated);
    setMemories(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
  };

  const deleteMemory = (id: string) => {
    const memory = memories.find(item => item.id === id);
    setMemories(prev => prev.filter(m => m.id !== id));
    void persist(() => deleteRow('family_memories', currentUser.familyId, id));
    if (memory?.photoUrl && !/^https?:\/\//i.test(memory.photoUrl)) {
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
      const token = getAccessToken();
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
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiReply: AIMessage = {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'No response generated.',
          timestamp: new Date().toISOString(),
          groundingSources: data.groundingSources || ['Family Database'],
          actionsExecuted: data.actionsExecuted,
          confidenceScore: data.confidenceScore,
          latencyMs: data.latencyMs,
          cognitiveMetrics: data.cognitiveMetrics
        };
        setAIMessages(prev => [...prev, aiReply]);
        setIsAITyping(false);

        // If autonomous actions were executed, trigger silent refresh
        if (data.actionsExecuted && data.actionsExecuted.length > 0) {
          void refreshFamilyData();
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

      if (queryLower.includes('happening today') || queryLower.includes("today's schedule") || queryLower.includes('events today')) {
        const todayEvts = events.filter(e => e.date === new Date().toISOString().split('T')[0]);
        const todayRems = reminders.filter(r => !r.completed);
        replyText = `Here is what is happening with your family today:\n\n` +
          `• **Important Reminders**: ${todayRems.map(r => r.title).join(', ') || 'No pending reminders for today.'}\n` +
          `• **Today's Events**: ${todayEvts.length ? todayEvts.map(e => `${e.title} at ${e.time}`).join(', ') : 'No scheduled events on calendar for today.'}`;
        sources.push('Calendar Events Table', 'Important Reminders Table');
      } else if (queryLower.includes('medicine') && (queryLower.includes('due') || queryLower.includes('today'))) {
        replyText = `Here are the medicines due today:\n\n` +
          medicines.map(m => `💊 **${m.personName}**: ${m.name} (${m.dosage}) at **${m.timing}** [Frequency: ${m.frequency}]`).join('\n') +
          `\n\n*Note: Use the Medicine Manager card on the Dashboard to record doses.*`;
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
      } else if (queryLower.includes('passport') || queryLower.includes('where is my passport')) {
        const passportDoc = documents.find(d => d.title.toLowerCase().includes('passport') || d.description.toLowerCase().includes('passport'));
        if (passportDoc) {
          replyText = `Found passport document: **${passportDoc.title}** uploaded by ${passportDoc.uploaderName}.\n\n📄 **Details**: ${passportDoc.description || 'No description was provided.'}\n\nThe database does not contain a physical storage location.`;
          sources.push('Document Vault Database');
        } else {
          replyText = `I searched your Document Vault, but no passport document has been uploaded yet.`;
        }
      } else if (queryLower.includes('allergic') || queryLower.includes('allergy') || queryLower.includes('grandma allergic')) {
        const allergyKnw = knowledgeList.find(k => k.category === 'Allergies');
        if (allergyKnw) {
          replyText = `⚠️ **CRITICAL HEALTH NOTICE**:\n\n**${allergyKnw.title}**: ${allergyKnw.content}`;
        } else {
          replyText = `No registered medical allergies found in Family Knowledge.`;
        }
        sources.push('Family Knowledge Base - Critical Health Record');
      } else if (attachments && attachments.length > 0) {
        replyText = `Attached file **"${attachments[0].name}"** received. Analyzing document contents...`;
        sources.push('Private Family Storage');
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
