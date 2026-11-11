import {
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
  FamilyMemory,
  EmergencyContact
} from '../types';
import { insertRow, deleteRow } from './supabase';

export const DEMO_TAG = '[DEMO]';

// 1. Five Family Members Definition
export const DEMO_FAMILY_MEMBERS: Array<Omit<FamilyMember, 'id'>> = [
  {
    name: 'Father',
    relation: 'Father',
    role: 'Parent',
    phone: '+91 98765 43210',
    email: 'father.demo@homebrain.test',
    age: 52,
    avatar: '👨‍💼',
    birthday: '1974-06-15',
    preferences: 'Vegetarian • Morning walk at 6:00 AM • Prefers tea over coffee'
  },
  {
    name: 'Mother',
    relation: 'Mother',
    role: 'Parent',
    phone: '+91 98765 43211',
    email: 'mother.demo@homebrain.test',
    age: 49,
    avatar: '👩‍🏫',
    birthday: '1977-09-22',
    preferences: 'Yoga enthusiast • Diabetic diet management • Enjoys classical music'
  },
  {
    name: 'Sarah',
    relation: 'Daughter',
    role: 'Admin',
    phone: '+91 98765 43212',
    email: 'sarah.demo@homebrain.test',
    age: 24,
    avatar: '👩‍💻',
    birthday: '2002-03-10',
    preferences: 'Software engineer • Household finance organizer • Enjoys hiking'
  },
  {
    name: 'Sneha',
    relation: 'Daughter',
    role: 'Member',
    phone: '+91 98765 43213',
    email: 'sneha.demo@homebrain.test',
    age: 19,
    avatar: '👩‍⚕️',
    birthday: '2007-11-05',
    preferences: 'Medical student • Lactose intolerant • Avid reader'
  },
  {
    name: 'Sham',
    relation: 'Son',
    role: 'Member',
    phone: '+91 98765 43214',
    email: 'sham.demo@homebrain.test',
    age: 15,
    avatar: '🏃‍♂️',
    birthday: '2011-08-18',
    preferences: 'High school student • Football team striker • Loves science experiments'
  }
];

export const isDemoItem = (item: { title?: string; name?: string; notes?: string; description?: string }): boolean => {
  return (
    (item.title && item.title.includes(DEMO_TAG)) ||
    (item.name && item.name.includes(DEMO_TAG)) ||
    (item.notes && item.notes.includes(DEMO_TAG)) ||
    (item.description && item.description.includes(DEMO_TAG)) ||
    false
  );
};

export interface DemoSeedStatus {
  isSeeded: boolean;
  memberCount: number;
  eventCount: number;
  medicineCount: number;
  expenseCount: number;
}

export const checkDemoSeedStatus = (
  members: FamilyMember[],
  events: FamilyEvent[],
  medicines: MedicineItem[]
): DemoSeedStatus => {
  const demoMembers = members.filter(m => m.name === 'Father' || m.name === 'Mother' || m.name === 'Sarah' || m.name === 'Sneha' || m.name === 'Sham');
  const demoEvents = events.filter(e => isDemoItem(e));
  const demoMeds = medicines.filter(m => isDemoItem(m));
  return {
    isSeeded: demoMembers.length >= 3 || demoEvents.length >= 3,
    memberCount: demoMembers.length,
    eventCount: demoEvents.length,
    medicineCount: demoMeds.length,
    expenseCount: 0
  };
};

export const seedDemoFamilyData = async (familyId: string, currentUserEmail: string): Promise<{ success: boolean; seededCounts: Record<string, number> }> => {
  const counts: Record<string, number> = {
    members: 0,
    events: 0,
    medicines: 0,
    medicineLogs: 0,
    expenses: 0,
    bills: 0,
    groceries: 0,
    groceryHistory: 0,
    documents: 0,
    memories: 0,
    knowledge: 0,
    contacts: 0,
    reminders: 0
  };

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  // 1. Seed Members
  for (const m of DEMO_FAMILY_MEMBERS) {
    try {
      await insertRow<Omit<FamilyMember, 'id'>>('family_members', familyId, {
        ...m,
        email: m.email === 'sarah.demo@homebrain.test' && currentUserEmail ? currentUserEmail : m.email
      });
      counts.members += 1;
    } catch (e) {
      console.warn('Member seed skip:', m.name, e);
    }
  }

  // 2. Seed Calendar Events
  const demoEvents: Array<Omit<FamilyEvent, 'id'>> = [
    {
      title: `${DEMO_TAG} Father's Birthday Celebration`,
      date: `${currentYear}-06-15`,
      time: '19:00',
      category: 'Birthday',
      description: 'Family dinner at Royal Orchid Restaurant celebrating Dad 52nd birthday',
      membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
      reminder: true,
      recurring: 'Yearly'
    },
    {
      title: `${DEMO_TAG} Mother's Birthday & Puja`,
      date: `${currentYear}-09-22`,
      time: '09:00',
      category: 'Birthday',
      description: 'Special morning prayer followed by family lunch for Mom',
      membersInvolved: ['Mother', 'Father', 'Sarah', 'Sneha', 'Sham'],
      reminder: true,
      recurring: 'Yearly'
    },
    {
      title: `${DEMO_TAG} Sarah's Birthday`,
      date: `${currentYear}-03-10`,
      time: '18:30',
      category: 'Birthday',
      description: 'Sarah turning 25! Dinner with close friends and family',
      membersInvolved: ['Sarah', 'Father', 'Mother'],
      reminder: true,
      recurring: 'Yearly'
    },
    {
      title: `${DEMO_TAG} Sneha's Medical College Exams`,
      date: `${currentYear}-11-05`,
      time: '10:00',
      category: 'School',
      description: 'MBBS 2nd Year Pathology semester examination',
      membersInvolved: ['Sneha'],
      reminder: true,
      recurring: 'None'
    },
    {
      title: `${DEMO_TAG} Sham's Interschool Football Match`,
      date: today,
      time: '16:30',
      category: 'School',
      description: 'Quarter-finals against St. Joseph Academy at City Stadium',
      membersInvolved: ['Sham', 'Father'],
      reminder: true,
      recurring: 'None'
    },
    {
      title: `${DEMO_TAG} Mother's Diabetic Health Checkup`,
      date: `${currentYear}-11-20`,
      time: '11:00',
      category: 'Appointment',
      description: 'Quarterly HbA1c review with Dr. Sharma at Apollo Clinic',
      membersInvolved: ['Mother', 'Father'],
      reminder: true,
      recurring: 'Monthly'
    },
    {
      title: `${DEMO_TAG} Parents 26th Wedding Anniversary`,
      date: `${currentYear}-05-20`,
      time: '20:00',
      category: 'Holiday',
      description: 'Celebrating 26 wonderful years of marriage! Family weekend getaway',
      membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
      reminder: true,
      recurring: 'Yearly'
    }
  ];

  for (const ev of demoEvents) {
    try {
      await insertRow('events', familyId, ev);
      counts.events += 1;
    } catch (e) {
      console.warn('Event seed skip:', ev.title, e);
    }
  }

  // 3. Seed Medicines & Adherence Logs
  const demoMedicines: Array<Omit<MedicineItem, 'id'>> = [
    {
      name: `${DEMO_TAG} Metformin 500mg`,
      dosage: '500 mg tablet',
      timing: 'Morning & Night (After Meals)',
      frequency: 'Twice Daily',
      personName: 'Father',
      startDate: `${currentYear}-01-01`,
      notes: `${DEMO_TAG} Prescribed for blood sugar management by Dr. Mehta.`
    },
    {
      name: `${DEMO_TAG} Atorvastatin 10mg`,
      dosage: '10 mg tablet',
      timing: 'Night (10:00 PM)',
      frequency: 'Daily',
      personName: 'Father',
      startDate: `${currentYear}-01-01`,
      notes: `${DEMO_TAG} Cholesterol control. Take with warm water.`
    },
    {
      name: `${DEMO_TAG} Thyroxine 50mcg`,
      dosage: '50 mcg tablet',
      timing: 'Morning (Empty Stomach)',
      frequency: 'Daily',
      personName: 'Mother',
      startDate: `${currentYear}-02-15`,
      notes: `${DEMO_TAG} Thyroid support. Wait 30 mins before breakfast.`
    },
    {
      name: `${DEMO_TAG} Calcium + Vitamin D3`,
      dosage: '1 tablet',
      timing: 'Noon (After Lunch)',
      frequency: 'Daily',
      personName: 'Mother',
      startDate: `${currentYear}-03-01`,
      notes: `${DEMO_TAG} Bone health supplement.`
    }
  ];

  for (const m of demoMedicines) {
    try {
      const savedMed = await insertRow<Omit<MedicineItem, 'id'>>('medicines', familyId, m) as MedicineItem;
      counts.medicines += 1;

      // Seed an adherence log for today
      if (savedMed && savedMed.id) {
        await insertRow<Omit<MedicineLog, 'id'>>('medicine_logs', familyId, {
          medicineId: savedMed.id,
          medicineName: savedMed.name,
          personName: savedMed.personName,
          status: 'Taken',
          timestamp: new Date().toISOString(),
          loggedBy: 'Self'
        });
        counts.medicineLogs += 1;
      }
    } catch (e) {
      console.warn('Medicine seed skip:', m.name, e);
    }
  }

  // 4. Seed Expenses & Bills
  const demoExpenses: Array<Omit<ExpenseItem, 'id'>> = [
    {
      title: `${DEMO_TAG} Fresh Vegetables & Fruits at Farmer Market`,
      amount: 1450,
      category: 'Groceries',
      date: today,
      payer: 'Mother',
      description: 'Weekly fresh organic produce, apples, spinach, and tomatoes'
    },
    {
      title: `${DEMO_TAG} Airtel Fiber Broadband Monthly Plan`,
      amount: 1180,
      category: 'Utilities',
      date: today,
      payer: 'Sarah',
      description: '300 Mbps unlimited family broadband plan'
    },
    {
      title: `${DEMO_TAG} Sham Sports Football Shoes & Kit`,
      amount: 3200,
      category: 'Shopping',
      date: `${currentYear}-11-02`,
      payer: 'Father',
      description: 'Nivia football studs and shin guards for school tournament'
    },
    {
      title: `${DEMO_TAG} Sneha Medical Textbooks (Robbins Pathology)`,
      amount: 2850,
      category: 'Education',
      date: `${currentYear}-11-04`,
      payer: 'Father',
      description: 'Required medical reference book for 2nd year MBBS'
    },
    {
      title: `${DEMO_TAG} Family Sunday Brunch at Cafe Bistro`,
      amount: 2150,
      category: 'Dining',
      date: `${currentYear}-11-08`,
      payer: 'Sarah',
      description: 'Family weekend brunch celebrating Sham match victory'
    }
  ];

  for (const ex of demoExpenses) {
    try {
      await insertRow('expenses', familyId, ex);
      counts.expenses += 1;
    } catch (e) {
      console.warn('Expense seed skip:', ex.title, e);
    }
  }

  const demoBills: Array<Omit<BillItem, 'id'>> = [
    {
      title: `${DEMO_TAG} BESCOM Home Electricity Bill`,
      amount: 3450,
      dueDate: `${currentYear}-11-18`,
      category: 'Utilities',
      isPaid: false,
      recurring: 'Monthly'
    },
    {
      title: `${DEMO_TAG} BWSSB Water & Sanitation Utility`,
      amount: 680,
      dueDate: `${currentYear}-11-25`,
      category: 'Utilities',
      isPaid: false,
      recurring: 'Monthly'
    },
    {
      title: `${DEMO_TAG} Society Maintenance Fee (Flat 402)`,
      amount: 3200,
      dueDate: `${currentYear}-11-10`,
      category: 'Maintenance',
      isPaid: true,
      paidDate: `${currentYear}-11-05`,
      paidBy: 'Father',
      recurring: 'Monthly'
    },
    {
      title: `${DEMO_TAG} Piped Natural Gas (Adani Gas)`,
      amount: 890,
      dueDate: `${currentYear}-11-22`,
      category: 'Utilities',
      isPaid: false,
      recurring: 'Monthly'
    }
  ];

  for (const b of demoBills) {
    try {
      await insertRow('bills', familyId, b);
      counts.bills += 1;
    } catch (e) {
      console.warn('Bill seed skip:', b.title, e);
    }
  }

  // 5. Seed Smart Groceries & History
  const demoGroceries: Array<Omit<GroceryItem, 'id'>> = [
    {
      name: `${DEMO_TAG} Basmati Rice (Daawat Rozana)`,
      category: 'Pantry',
      quantity: '10 kg bag',
      notes: `${DEMO_TAG} Essential household stock`,
      isPurchased: false,
      estimatedPrice: 750
    },
    {
      name: `${DEMO_TAG} Fresh Cow Milk (Nandini Blue)`,
      category: 'Dairy',
      quantity: '2 Litres daily',
      notes: `${DEMO_TAG} Daily tea and cereal`,
      isPurchased: false,
      estimatedPrice: 96
    },
    {
      name: `${DEMO_TAG} Farm Fresh Eggs`,
      category: 'Meat',
      quantity: '1 Crate (30 eggs)',
      notes: `${DEMO_TAG} High protein for Sham and Sarah`,
      isPurchased: false,
      estimatedPrice: 210
    },
    {
      name: `${DEMO_TAG} Cold-Pressed Sunflower Oil`,
      category: 'Pantry',
      quantity: '2 Litres',
      notes: `${DEMO_TAG} Heart healthy cooking oil for Dad`,
      isPurchased: false,
      estimatedPrice: 340
    },
    {
      name: `${DEMO_TAG} Whole Wheat Bread (The Baker's Dozen)`,
      category: 'Bakery',
      quantity: '2 loaves',
      notes: `${DEMO_TAG} Breakfast sandwiches`,
      isPurchased: true,
      purchasedBy: 'Mother',
      purchasedAt: new Date().toISOString(),
      estimatedPrice: 110
    }
  ];

  for (const g of demoGroceries) {
    try {
      await insertRow('groceries', familyId, g);
      counts.groceries += 1;
    } catch (e) {
      console.warn('Grocery seed skip:', g.name, e);
    }
  }

  // 6. Seed Family Knowledge (Allergies & Critical rules)
  const demoKnowledge: Array<Omit<FamilyKnowledge, 'id'>> = [
    {
      title: `${DEMO_TAG} Sneha Lactose Intolerance & Dairy Allergy`,
      category: 'Allergies',
      importance: 'Critical',
      relatedMemberName: 'Sneha',
      content: 'Sneha has severe lactose intolerance. Substitute with almond milk or oat milk. In case of accidental ingestion, keep Lactaid enzyme tablets available in bathroom cabinet.',
      createdDate: today
    },
    {
      title: `${DEMO_TAG} Father Blood Group & Medical Baseline`,
      category: 'Emergency',
      importance: 'Critical',
      relatedMemberName: 'Father',
      content: 'Blood Group: B+ Positive. Allergic to Sulfa antibiotics (causes skin rash). Primary Physician: Dr. Mehta, Fortis Hospital.',
      createdDate: today
    },
    {
      title: `${DEMO_TAG} Home WiFi Network Credentials & Printer IP`,
      category: 'General',
      importance: 'Important',
      relatedMemberName: 'Sarah',
      content: 'Primary SSID: HomeBrain_5GHz. Guest SSID: HomeBrain_Guest. Printer HP LaserJet IP: 192.168.1.150.',
      createdDate: today
    },
    {
      title: `${DEMO_TAG} Mother Dietary Preferences for Diabetes`,
      category: 'Dietary',
      importance: 'Important',
      relatedMemberName: 'Mother',
      content: 'Low glycemic index meals only. Avoid refined white sugar and white flour. Breakfast by 8:30 AM, lunch at 1:00 PM, light dinner before 8:30 PM.',
      createdDate: today
    }
  ];

  for (const k of demoKnowledge) {
    try {
      await insertRow('family_knowledge', familyId, k);
      counts.knowledge += 1;
    } catch (e) {
      console.warn('Knowledge seed skip:', k.title, e);
    }
  }

  // 7. Seed Document Vault Records
  const demoDocs: Array<Omit<DocumentItem, 'id' | 'uploadDate'>> = [
    {
      title: `${DEMO_TAG} Star Health Comprehensive Family Insurance Policy`,
      category: 'Insurance',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      description: `${DEMO_TAG} Policy No: SH-2024-98421. Covers all 5 family members up to ₹15,00,000 cashless hospitalization. Cashless TPA card in safe.`,
      summaryContent: 'Star Health Family Optima Policy covering Father, Mother, Sarah, Sneha, Sham. Sum Insured ₹15 Lakhs. Room rent no capping. Cashless hospital network across India.',
      uploaderName: 'Sarah'
    },
    {
      title: `${DEMO_TAG} Apartment Flat 402 Sale Deed & Property Tax Receipt`,
      category: 'Home',
      fileType: 'PDF',
      fileSize: '4.8 MB',
      fileUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      description: `${DEMO_TAG} Registered with Sub-Registrar Office. Property Tax (BBMP Khata A) paid through 2026.`,
      summaryContent: 'Property deed registration for Flat 402, Green Valley Apartments, 1850 sq ft 3BHK. Khata certificate A attached.',
      uploaderName: 'Father'
    },
    {
      title: `${DEMO_TAG} Father Complete Health Panel & Blood Report 2026`,
      category: 'Medical',
      fileType: 'PDF',
      fileSize: '1.2 MB',
      fileUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      description: `${DEMO_TAG} Routine annual master health checkup at Manipal Hospital. HbA1c 6.4 (Controlled), Lipid profile normal.`,
      summaryContent: 'Annual health checkup report: Fasting blood sugar 112 mg/dL, HbA1c 6.4%, Total Cholesterol 185 mg/dL. Kidney and Liver function tests within normal limits.',
      uploaderName: 'Mother'
    },
    {
      title: `${DEMO_TAG} Sham 10th ICSE Board Marksheet & Certificate`,
      category: 'Education',
      fileType: 'PDF',
      fileSize: '890 KB',
      fileUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
      description: `${DEMO_TAG} Official ICSE Board examination marksheet. Passed with 94.2% distinction.`,
      summaryContent: 'ICSE Board Secondary School Examination Certificate for Sham. Total marks 94.2%, Grade A1 across Mathematics, Science, and English.',
      uploaderName: 'Father'
    }
  ];

  for (const doc of demoDocs) {
    try {
      await insertRow('documents', familyId, {
        ...doc,
        uploadDate: today
      });
      counts.documents += 1;
    } catch (e) {
      console.warn('Doc seed skip:', doc.title, e);
    }
  }

  // 8. Seed Family Memories
  const demoMemories: Array<Omit<FamilyMemory, 'id'>> = [
    {
      title: `${DEMO_TAG} Golden Temple & Himachal Family Vacation`,
      year: 2024,
      date: '2024-06-25',
      description: 'An unforgettable 8-day road trip from Amritsar to Manali. Breathtaking sunrise views over the Himalayas and peaceful evening at the Golden Temple.',
      photoUrl: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80',
      location: 'Amritsar & Manali, Himachal Pradesh',
      addedBy: 'Sarah',
      photoUrls: ['https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80'],
      taggedMembers: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
      tags: ['vacation', 'himachal', 'familytrip', 'memories']
    },
    {
      title: `${DEMO_TAG} Sarah University Graduation Day`,
      year: 2024,
      date: '2024-05-18',
      description: 'Proud moment as Sarah graduated with B.Tech in Computer Science with Honors! Mom and Dad could not stop smiling.',
      photoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
      location: 'National Institute of Technology Campus',
      addedBy: 'Father',
      photoUrls: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'],
      taggedMembers: ['Sarah', 'Father', 'Mother'],
      tags: ['graduation', 'achievement', 'college', 'pride']
    },
    {
      title: `${DEMO_TAG} Sham Scoring Winning Goal in Cup Final`,
      year: 2024,
      date: '2024-08-30',
      description: 'Sham scored in the 88th minute to lift the State Interschool Football Trophy! Entire family cheered from the stadium stand.',
      photoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      location: 'Kanteerava Stadium, Bangalore',
      addedBy: 'Father',
      photoUrls: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'],
      taggedMembers: ['Sham', 'Father', 'Sneha'],
      tags: ['football', 'sports', 'champion', 'trophy']
    }
  ];

  for (const mem of demoMemories) {
    try {
      await insertRow('family_memories', familyId, mem);
      counts.memories += 1;
    } catch (e) {
      console.warn('Memory seed skip:', mem.title, e);
    }
  }

  // 9. Seed Emergency Contacts
  const demoContacts: Array<Omit<EmergencyContact, 'id'>> = [
    {
      name: `${DEMO_TAG} Dr. Rajesh Mehta (Family Physician)`,
      relation: 'Doctor',
      phone: '+91 98450 11223',
      email: 'dr.mehta.demo@apollohospitals.test',
      isPrimary: true
    },
    {
      name: `${DEMO_TAG} Uncle Vikram (Father's Brother)`,
      relation: 'Uncle',
      phone: '+91 98450 99887',
      email: 'vikram.demo@homebrain.test',
      isPrimary: false
    }
  ];

  for (const c of demoContacts) {
    try {
      await insertRow('emergency_contacts', familyId, c);
      counts.contacts += 1;
    } catch (e) {
      console.warn('Contact seed skip:', c.name, e);
    }
  }

  // 10. Seed Reminders
  const demoReminders: Array<Omit<ReminderItem, 'id'>> = [
    {
      title: `${DEMO_TAG} Pay BESCOM Electricity Bill before due date`,
      category: 'Bill',
      dateTime: `${currentYear}-11-17T18:00:00Z`,
      priority: 'High',
      completed: false,
      assignedMemberName: 'Sarah'
    },
    {
      title: `${DEMO_TAG} Pick up Mother's Thyroxine refill from pharmacy`,
      category: 'Medicine',
      dateTime: `${currentYear}-11-15T17:00:00Z`,
      priority: 'High',
      completed: false,
      assignedMemberName: 'Father'
    },
    {
      title: `${DEMO_TAG} Reserve table for Father's birthday celebration`,
      category: 'Birthday',
      dateTime: `${currentYear}-06-12T12:00:00Z`,
      priority: 'Medium',
      completed: false,
      assignedMemberName: 'Sarah'
    }
  ];

  for (const r of demoReminders) {
    try {
      await insertRow('reminders', familyId, r);
      counts.reminders += 1;
    } catch (e) {
      console.warn('Reminder seed skip:', r.title, e);
    }
  }

  return { success: true, seededCounts: counts };
};

export const removeDemoFamilyData = async (
  familyId: string,
  allData: {
    members: FamilyMember[];
    events: FamilyEvent[];
    medicines: MedicineItem[];
    expenses: ExpenseItem[];
    bills: BillItem[];
    groceries: GroceryItem[];
    documents: DocumentItem[];
    memories: FamilyMemory[];
    knowledge: FamilyKnowledge[];
    contacts: EmergencyContact[];
    reminders: ReminderItem[];
  }
): Promise<{ success: boolean; removedCount: number }> => {
  let removed = 0;

  const removeList = async (table: string, items: Array<{ id: string }>) => {
    for (const item of items) {
      try {
        await deleteRow(table, familyId, item.id);
        removed += 1;
      } catch (e) {
        console.warn(`Failed removing demo item from ${table}:`, e);
      }
    }
  };

  const demoMembers = allData.members.filter(m => m.name === 'Father' || m.name === 'Mother' || m.name === 'Sarah' || m.name === 'Sneha' || m.name === 'Sham');
  const demoEvents = allData.events.filter(isDemoItem);
  const demoMedicines = allData.medicines.filter(isDemoItem);
  const demoExpenses = allData.expenses.filter(isDemoItem);
  const demoBills = allData.bills.filter(isDemoItem);
  const demoGroceries = allData.groceries.filter(isDemoItem);
  const demoDocuments = allData.documents.filter(isDemoItem);
  const demoMemories = allData.memories.filter(isDemoItem);
  const demoKnowledge = allData.knowledge.filter(isDemoItem);
  const demoContacts = allData.contacts.filter(isDemoItem);
  const demoReminders = allData.reminders.filter(isDemoItem);

  await removeList('family_members', demoMembers);
  await removeList('events', demoEvents);
  await removeList('medicines', demoMedicines);
  await removeList('expenses', demoExpenses);
  await removeList('bills', demoBills);
  await removeList('groceries', demoGroceries);
  await removeList('documents', demoDocuments);
  await removeList('family_memories', demoMemories);
  await removeList('family_knowledge', demoKnowledge);
  await removeList('emergency_contacts', demoContacts);
  await removeList('reminders', demoReminders);

  return { success: true, removedCount: removed };
};
