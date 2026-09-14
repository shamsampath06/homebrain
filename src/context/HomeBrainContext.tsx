import React, { createContext, useContext, useState, useEffect } from 'react';
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
  EmergencyContact,
  EmergencyAlertLog,
  FamilyMemory,
  AIMessage
} from '../types';
import {
  initialUser,
  initialFamilyMembers,
  initialEvents,
  initialReminders,
  initialDocuments,
  initialGroceries,
  initialGroceryHistory,
  initialMedicines,
  initialMedicineLogs,
  initialExpenses,
  initialBills,
  initialKnowledge,
  initialEmergencyContacts,
  initialMemories,
  initialAIMessages
} from '../data/initialData';

export type MainTab = 'dashboard' | 'ai' | 'timeline' | 'profile';
export type SubScreen =
  | 'none'
  | 'calendar'
  | 'add-event'
  | 'event-details'
  | 'documents'
  | 'upload-document'
  | 'document-details'
  | 'grocery'
  | 'add-grocery'
  | 'grocery-history'
  | 'medicine'
  | 'add-medicine'
  | 'medicine-details'
  | 'medicine-history'
  | 'expense'
  | 'add-expense'
  | 'expense-history'
  | 'bill-management'
  | 'knowledge'
  | 'add-knowledge'
  | 'knowledge-details'
  | 'emergency'
  | 'add-memory'
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

  // Theme & User
  currentUser: User;
  updateCurrentUser: (updated: Partial<User>) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Family Members
  familyMembers: FamilyMember[];
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  removeFamilyMember: (id: string) => void;

  // Events & Calendar
  events: FamilyEvent[];
  addEvent: (event: Omit<FamilyEvent, 'id'>) => void;
  updateEvent: (id: string, updated: Partial<FamilyEvent>) => void;
  deleteEvent: (id: string) => void;

  // Reminders
  reminders: ReminderItem[];
  addReminder: (reminder: Omit<ReminderItem, 'id'>) => void;
  toggleReminder: (id: string) => void;

  // Documents
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate'>) => void;
  deleteDocument: (id: string) => void;

  // Groceries
  groceries: GroceryItem[];
  groceryHistory: GroceryHistoryItem[];
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'isPurchased'>) => void;
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
  deleteExpense: (id: string) => void;
  addBill: (bill: Omit<BillItem, 'id' | 'isPaid'>) => void;
  markBillPaid: (id: string) => void;

  // Knowledge
  knowledgeList: FamilyKnowledge[];
  addKnowledge: (knw: Omit<FamilyKnowledge, 'id' | 'createdDate'>) => void;
  updateKnowledge: (id: string, updated: Partial<FamilyKnowledge>) => void;
  deleteKnowledge: (id: string) => void;

  // Emergency
  emergencyContacts: EmergencyContact[];
  emergencyLogs: EmergencyAlertLog[];
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  deleteEmergencyContact: (id: string) => void;
  triggerEmergencyAlert: (location: string) => Promise<EmergencyAlertLog>;

  // Family Timeline
  memories: FamilyMemory[];
  addMemory: (mem: Omit<FamilyMemory, 'id'>) => void;
  updateMemory: (id: string, updated: Partial<FamilyMemory>) => void;
  deleteMemory: (id: string) => void;

  // AI Assistant
  aiMessages: AIMessage[];
  isAITyping: boolean;
  sendAIMessage: (text: string, attachments?: { name: string; url: string; type: string }[]) => Promise<void>;
  clearAIConversation: () => void;
}

const HomeBrainContext = createContext<HomeBrainContextType | undefined>(undefined);

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(`homebrain_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(`homebrain_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
};

export const HomeBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Nav state
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>('none');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const navigateToSubScreen = (sub: SubScreen, itemId?: string) => {
    setActiveSubScreen(sub);
    if (itemId !== undefined) {
      setSelectedItemId(itemId);
    }
  };

  // User & Theme
  const [currentUser, setCurrentUser] = useState<User>(() => loadFromStorage('user', initialUser));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => loadFromStorage('darkMode', false));

  useEffect(() => {
    saveToStorage('user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveToStorage('darkMode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const updateCurrentUser = (updated: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
  };

  // Family Members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() =>
    loadFromStorage('familyMembers', initialFamilyMembers)
  );
  useEffect(() => saveToStorage('familyMembers', familyMembers), [familyMembers]);

  const addFamilyMember = (member: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = { ...member, id: `mem_${Date.now()}` };
    setFamilyMembers(prev => [...prev, newMember]);
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  // Events
  const [events, setEvents] = useState<FamilyEvent[]>(() => loadFromStorage('events', initialEvents));
  useEffect(() => saveToStorage('events', events), [events]);

  const addEvent = (event: Omit<FamilyEvent, 'id'>) => {
    const newEvt: FamilyEvent = { ...event, id: `evt_${Date.now()}` };
    setEvents(prev => [...prev, newEvt]);
  };

  const updateEvent = (id: string, updated: Partial<FamilyEvent>) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Reminders
  const [reminders, setReminders] = useState<ReminderItem[]>(() => loadFromStorage('reminders', initialReminders));
  useEffect(() => saveToStorage('reminders', reminders), [reminders]);

  const addReminder = (rem: Omit<ReminderItem, 'id'>) => {
    const newRem: ReminderItem = { ...rem, id: `rem_${Date.now()}` };
    setReminders(prev => [newRem, ...prev]);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, completed: !r.completed } : r)));
  };

  // Documents
  const [documents, setDocuments] = useState<DocumentItem[]>(() => loadFromStorage('documents', initialDocuments));
  useEffect(() => saveToStorage('documents', documents), [documents]);

  const addDocument = (doc: Omit<DocumentItem, 'id' | 'uploadDate'>) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Groceries
  const [groceries, setGroceries] = useState<GroceryItem[]>(() => loadFromStorage('groceries', initialGroceries));
  const [groceryHistory, setGroceryHistory] = useState<GroceryHistoryItem[]>(() =>
    loadFromStorage('groceryHistory', initialGroceryHistory)
  );

  useEffect(() => saveToStorage('groceries', groceries), [groceries]);
  useEffect(() => saveToStorage('groceryHistory', groceryHistory), [groceryHistory]);

  const addGroceryItem = (item: Omit<GroceryItem, 'id' | 'isPurchased'>) => {
    const newItem: GroceryItem = { ...item, id: `groc_${Date.now()}`, isPurchased: false };
    setGroceries(prev => [newItem, ...prev]);
  };

  const toggleGroceryPurchased = (id: string) => {
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()} – ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setGroceries(prev =>
      prev.map(g => {
        if (g.id === id) {
          const nextState = !g.isPurchased;
          if (nextState) {
            // Log to history
            const histItem: GroceryHistoryItem = {
              id: `ghist_${Date.now()}`,
              name: g.name,
              category: g.category,
              purchasedBy: currentUser.name,
              purchasedAt: formattedDate
            };
            setGroceryHistory(h => [histItem, ...h]);
          }
          return {
            ...g,
            isPurchased: nextState,
            purchasedBy: nextState ? currentUser.name : undefined,
            purchasedAt: nextState ? formattedDate : undefined
          };
        }
        return g;
      })
    );
  };

  const deleteGroceryItem = (id: string) => {
    setGroceries(prev => prev.filter(g => g.id !== id));
  };

  // Medicines
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => loadFromStorage('medicines', initialMedicines));
  const [medicineLogs, setMedicineLogs] = useState<MedicineLog[]>(() =>
    loadFromStorage('medicineLogs', initialMedicineLogs)
  );

  useEffect(() => saveToStorage('medicines', medicines), [medicines]);
  useEffect(() => saveToStorage('medicineLogs', medicineLogs), [medicineLogs]);

  const addMedicine = (med: Omit<MedicineItem, 'id'>) => {
    const newMed: MedicineItem = { ...med, id: `med_${Date.now()}` };
    setMedicines(prev => [...prev, newMed]);
  };

  const updateMedicine = (id: string, updated: Partial<MedicineItem>) => {
    setMedicines(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
  };

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const logMedicineStatus = (medicineId: string, status: 'Taken' | 'Missed') => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return;

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()} – ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newLog: MedicineLog = {
      id: `mlog_${Date.now()}`,
      medicineId: med.id,
      medicineName: med.name,
      personName: med.personName,
      status,
      timestamp: formattedDate,
      loggedBy: currentUser.name
    };

    setMedicineLogs(prev => [newLog, ...prev]);
  };

  // Expenses & Bills
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => loadFromStorage('expenses', initialExpenses));
  const [bills, setBills] = useState<BillItem[]>(() => loadFromStorage('bills', initialBills));

  useEffect(() => saveToStorage('expenses', expenses), [expenses]);
  useEffect(() => saveToStorage('bills', bills), [bills]);

  const addExpense = (exp: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = { ...exp, id: `exp_${Date.now()}` };
    setExpenses(prev => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addBill = (bill: Omit<BillItem, 'id' | 'isPaid'>) => {
    const newBill: BillItem = { ...bill, id: `bill_${Date.now()}`, isPaid: false };
    setBills(prev => [newBill, ...prev]);
  };

  const markBillPaid = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setBills(prev =>
      prev.map(b =>
        b.id === id ? { ...b, isPaid: true, paidDate: today, paidBy: currentUser.name } : b
      )
    );
  };

  // Knowledge
  const [knowledgeList, setKnowledgeList] = useState<FamilyKnowledge[]>(() =>
    loadFromStorage('knowledgeList', initialKnowledge)
  );
  useEffect(() => saveToStorage('knowledgeList', knowledgeList), [knowledgeList]);

  const addKnowledge = (knw: Omit<FamilyKnowledge, 'id' | 'createdDate'>) => {
    const newKnw: FamilyKnowledge = {
      ...knw,
      id: `knw_${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setKnowledgeList(prev => [newKnw, ...prev]);
  };

  const updateKnowledge = (id: string, updated: Partial<FamilyKnowledge>) => {
    setKnowledgeList(prev => prev.map(k => (k.id === id ? { ...k, ...updated } : k)));
  };

  const deleteKnowledge = (id: string) => {
    setKnowledgeList(prev => prev.filter(k => k.id !== id));
  };

  // Emergency
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() =>
    loadFromStorage('emergencyContacts', initialEmergencyContacts)
  );
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyAlertLog[]>(() =>
    loadFromStorage('emergencyLogs', [])
  );

  useEffect(() => saveToStorage('emergencyContacts', emergencyContacts), [emergencyContacts]);
  useEffect(() => saveToStorage('emergencyLogs', emergencyLogs), [emergencyLogs]);

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newC: EmergencyContact = { ...contact, id: `emg_${Date.now()}` };
    setEmergencyContacts(prev => [...prev, newC]);
  };

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  };

  const triggerEmergencyAlert = async (location: string): Promise<EmergencyAlertLog> => {
    const log: EmergencyAlertLog = {
      id: `emg_log_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userLocation: location,
      status: 'Sent',
      recipients: emergencyContacts.map(c => `${c.name} (${c.phone})`)
    };
    setEmergencyLogs(prev => [log, ...prev]);
    return log;
  };

  // Memories
  const [memories, setMemories] = useState<FamilyMemory[]>(() => loadFromStorage('memories', initialMemories));
  useEffect(() => saveToStorage('memories', memories), [memories]);

  const addMemory = (mem: Omit<FamilyMemory, 'id'>) => {
    const newMem: FamilyMemory = { ...mem, id: `mem_${Date.now()}` };
    setMemories(prev => [newMem, ...prev]);
  };

  const updateMemory = (id: string, updated: Partial<FamilyMemory>) => {
    setMemories(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // AI Assistant Engine (RAG Grounded in local database)
  const [aiMessages, setAIMessages] = useState<AIMessage[]>(() =>
    loadFromStorage('aiMessages', initialAIMessages)
  );
  const [isAITyping, setIsAITyping] = useState<boolean>(false);

  useEffect(() => saveToStorage('aiMessages', aiMessages), [aiMessages]);

  const sendAIMessage = async (text: string, attachments?: { name: string; url: string; type: string }[]) => {
    const userMsg: AIMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments
    };

    setAIMessages(prev => [...prev, userMsg]);
    setIsAITyping(true);

    // Simulate AI grounded context query delay
    setTimeout(() => {
      let replyText = '';
      const sources: string[] = [];
      const queryLower = text.toLowerCase();

      // RAG Grounding Logic based on prompt examples
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

      } else if (queryLower.includes('grandma') && queryLower.includes('medicine')) {
        const gMed = medicines.filter(m => m.personName.toLowerCase().includes('grandma'));
        replyText = `Grandma Savitri has the following medicine schedule:\n\n` +
          gMed.map(m => `💊 **${m.name}**: ${m.dosage} due at **${m.timing}** (${m.notes})`).join('\n');
        sources.push('Medicine Schedule - Grandma Savitri');

      } else if (queryLower.includes('grocery') || queryLower.includes('groceries') || queryLower.includes('left on')) {
        const pending = groceries.filter(g => !g.isPurchased);
        replyText = `There are **${pending.length} pending items** on your family grocery list:\n\n` +
          pending.map(g => `🛒 **${g.name}** (${g.quantity}) - Category: ${g.category}`).join('\n') +
          `\n\nWould you like me to add any additional items for you?`;
        sources.push('Smart Grocery List Database');

      } else if (queryLower.includes('who bought') || queryLower.includes('bought the milk') || queryLower.includes('bought milk')) {
        const milkItem = groceries.find(g => g.name.toLowerCase().includes('milk'));
        if (milkItem && milkItem.isPurchased) {
          replyText = `Organic Milk was bought by **${milkItem.purchasedBy}** on **${milkItem.purchasedAt}**.`;
        } else {
          replyText = `Organic Milk has not been bought yet. It is currently pending on the grocery list!`;
        }
        sources.push('Grocery Purchase History Log');

      } else if (queryLower.includes('bill') || queryLower.includes('bills')) {
        const unpaid = bills.filter(b => !b.isPaid);
        replyText = `You have **${unpaid.length} upcoming unpaid bills**:\n\n` +
          unpaid.map(b => `⚡ **${b.title}**: $${b.amount} (Due: ${b.dueDate})`).join('\n') +
          `\nTotal pending bills amount: **$${unpaid.reduce((acc, b) => acc + b.amount, 0).toLocaleString()}**`;
        sources.push('Bills & Expenses Intelligence Database');

      } else if (queryLower.includes('passport') || queryLower.includes('where is my passport')) {
        const passportDoc = documents.find(d => d.title.toLowerCase().includes('passport') || d.description.toLowerCase().includes('passport'));
        if (passportDoc) {
          replyText = `Found passport document: **${passportDoc.title}** uploaded by ${passportDoc.uploaderName}.\n\n📄 **Details**: ${passportDoc.description}\n📌 **Physical Location**: Master Bedroom Safe #2.`;
          sources.push('Document Vault Database - doc_2');
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
        const att = attachments[0];
        replyText = `I analyzed your uploaded document/image **"${att.name}"**.\n\n` +
          `🔍 **AI Document Recognition**: The document is recognized as a household record. I matched it with authorized information in your **Document Vault**. It is now indexed under your family files.`;
        sources.push('OCR Document Vault Indexer');

      } else {
        replyText = `I checked your family records for "${text}". Everything is up to date! You currently have ${events.length} upcoming events, ${groceries.filter(g => !g.isPurchased).length} grocery items, and ${medicines.length} scheduled medicines. Is there anything specific you would like me to update or search?`;
        sources.push('HomeBrain Global Context Engine');
      }

      const aiReply: AIMessage = {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: sources
      };

      setAIMessages(prev => [...prev, aiReply]);
      setIsAITyping(false);
    }, 800);
  };

  const clearAIConversation = () => {
    setAIMessages([
      {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Conversation cleared. I am ready for your questions!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        currentUser,
        updateCurrentUser,
        isDarkMode,
        toggleDarkMode,
        familyMembers,
        addFamilyMember,
        removeFamilyMember,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        reminders,
        addReminder,
        toggleReminder,
        documents,
        addDocument,
        deleteDocument,
        groceries,
        groceryHistory,
        addGroceryItem,
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
        deleteExpense,
        addBill,
        markBillPaid,
        knowledgeList,
        addKnowledge,
        updateKnowledge,
        deleteKnowledge,
        emergencyContacts,
        emergencyLogs,
        addEmergencyContact,
        deleteEmergencyContact,
        triggerEmergencyAlert,
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        aiMessages,
        isAITyping,
        sendAIMessage,
        clearAIConversation
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
