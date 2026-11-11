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
  EmergencyContact,
  EmergencyAlertLog
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

  // 7. Emergency Logs Example (Document Vault uploads omitted as requested)
  try {
    await insertRow('emergency_logs', familyId, {
      userLocation: 'Indiranagar 100ft Road, Bangalore, Karnataka, India',
      latitude: 12.9716,
      longitude: 77.6412,
      accuracyMeters: 10,
      userName: 'Sarah',
      status: 'Logged',
      timestamp: new Date().toISOString(),
      recipients: [`${DEMO_TAG} Dr. Rajesh Mehta (+91 98450 11223)`, `${DEMO_TAG} Uncle Vikram (+91 98450 99887)`]
    });
  } catch (e) {
    console.warn('Emergency log seed skip:', e);
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

export const getDemoFamilySnapshot = () => {
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  const familyMembers: FamilyMember[] = DEMO_FAMILY_MEMBERS.map((m, idx) => ({
    ...m,
    id: `demo-member-${idx + 1}`
  }));

  const events: FamilyEvent[] = [
    {
      id: 'demo-evt-1',
      title: `${DEMO_TAG} Father's 52nd Birthday Celebration`,
      date: `${currentYear}-06-15`,
      time: '19:00',
      category: 'Birthday',
      description: 'Family dinner at Royal Orchid Restaurant celebrating Dad 52nd birthday',
      membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
      reminder: true,
      recurring: 'Yearly'
    },
    {
      id: 'demo-evt-2',
      title: `${DEMO_TAG} Mother's Birthday & Morning Puja`,
      date: `${currentYear}-09-22`,
      time: '09:00',
      category: 'Birthday',
      description: 'Special morning prayer followed by family lunch for Mom',
      membersInvolved: ['Mother', 'Father', 'Sarah', 'Sneha', 'Sham'],
      reminder: true,
      recurring: 'Yearly'
    },
    {
      id: 'demo-evt-3',
      title: `${DEMO_TAG} Sarah's 25th Birthday Dinner`,
      date: `${currentYear}-03-10`,
      time: '18:30',
      category: 'Birthday',
      description: 'Sarah turning 25! Dinner with close friends and family',
      membersInvolved: ['Sarah', 'Father', 'Mother'],
      reminder: true,
      recurring: 'Yearly'
    },
    {
      id: 'demo-evt-4',
      title: `${DEMO_TAG} Sneha's MBBS Pathology Semester Exam`,
      date: `${currentYear}-11-24`,
      time: '10:00',
      category: 'School',
      description: 'MBBS 2nd Year Pathology semester examination',
      membersInvolved: ['Sneha'],
      reminder: true,
      recurring: 'None'
    },
    {
      id: 'demo-evt-5',
      title: `${DEMO_TAG} Sham's Interschool Football Tournament Final`,
      date: today,
      time: '16:30',
      category: 'School',
      description: 'Quarter-finals against St. Joseph Academy at City Stadium',
      membersInvolved: ['Sham', 'Father'],
      reminder: true,
      recurring: 'None'
    },
    {
      id: 'demo-evt-6',
      title: `${DEMO_TAG} Mother's Diabetic Health Review with Dr. Sharma`,
      date: `${currentYear}-11-20`,
      time: '11:00',
      category: 'Appointment',
      description: 'Quarterly HbA1c review with Dr. Sharma at Apollo Clinic',
      membersInvolved: ['Mother', 'Father'],
      reminder: true,
      recurring: 'Monthly'
    },
    {
      id: 'demo-evt-7',
      title: `${DEMO_TAG} Parents' 26th Wedding Anniversary Getaway`,
      date: `${currentYear}-05-20`,
      time: '20:00',
      category: 'Holiday',
      description: 'Celebrating 26 wonderful years of marriage! Family weekend getaway',
      membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
      reminder: true,
      recurring: 'Yearly'
    },
    {
      id: 'demo-evt-8',
      title: `${DEMO_TAG} Annual Kent RO Water Purifier Servicing`,
      date: `${currentYear}-12-05`,
      time: '14:00',
      category: 'General',
      description: 'Filter replacement and membrane service by authorized technician',
      membersInvolved: ['Father'],
      reminder: true,
      recurring: 'None'
    }
  ];

  const reminders: ReminderItem[] = [
    {
      id: 'demo-rem-1',
      title: `${DEMO_TAG} Pay BESCOM Electricity Bill before due date`,
      category: 'Bill',
      dateTime: `${currentYear}-11-17T18:00:00+05:30`,
      priority: 'High',
      completed: false,
      assignedMemberName: 'Sarah'
    },
    {
      id: 'demo-rem-2',
      title: `${DEMO_TAG} Pick up Mother's Thyroxine refill from Apollo Pharmacy`,
      category: 'Medicine',
      dateTime: `${currentYear}-11-15T17:00:00+05:30`,
      priority: 'High',
      completed: false,
      assignedMemberName: 'Father'
    },
    {
      id: 'demo-rem-3',
      title: `${DEMO_TAG} Water balcony indoor plants and herb garden`,
      category: 'General',
      dateTime: `${currentYear}-11-12T07:30:00+05:30`,
      priority: 'Low',
      completed: false,
      assignedMemberName: 'Sham'
    },
    {
      id: 'demo-rem-4',
      title: `${DEMO_TAG} Restock fresh groceries and organic milk from supermarket`,
      category: 'Grocery',
      dateTime: `${currentYear}-11-13T10:00:00+05:30`,
      priority: 'Medium',
      completed: false,
      assignedMemberName: 'Mother'
    },
    {
      id: 'demo-rem-5',
      title: `${DEMO_TAG} Practice football passing drills before Friday match`,
      category: 'General',
      dateTime: `${currentYear}-11-14T16:00:00+05:30`,
      priority: 'Low',
      completed: false,
      assignedMemberName: 'Sham'
    },
    {
      id: 'demo-rem-6',
      title: `${DEMO_TAG} Schedule car routine oil change and wheel alignment`,
      category: 'General',
      dateTime: `${currentYear}-11-16T11:00:00+05:30`,
      priority: 'Medium',
      completed: false,
      assignedMemberName: 'Father'
    }
  ];

  const medicines: MedicineItem[] = [
    {
      id: 'demo-med-1',
      name: `${DEMO_TAG} Amlodipine 5mg`,
      dosage: '5 mg tablet',
      timing: 'Morning (08:00 AM)',
      frequency: 'Daily',
      personName: 'Father',
      startDate: `${currentYear}-01-01`,
      notes: `${DEMO_TAG} Blood pressure maintenance. Take after light breakfast.`
    },
    {
      id: 'demo-med-2',
      name: `${DEMO_TAG} Metformin 500mg`,
      dosage: '500 mg tablet',
      timing: 'Morning & Night (After Meals)',
      frequency: 'Twice Daily',
      personName: 'Father',
      startDate: `${currentYear}-01-01`,
      notes: `${DEMO_TAG} Prescribed for blood sugar management by Dr. Mehta.`
    },
    {
      id: 'demo-med-3',
      name: `${DEMO_TAG} Atorvastatin 10mg`,
      dosage: '10 mg tablet',
      timing: 'Night (10:00 PM)',
      frequency: 'Daily',
      personName: 'Father',
      startDate: `${currentYear}-01-01`,
      notes: `${DEMO_TAG} Cholesterol control. Take with warm water.`
    },
    {
      id: 'demo-med-4',
      name: `${DEMO_TAG} Thyroxine 50mcg`,
      dosage: '50 mcg tablet',
      timing: 'Morning (07:00 AM)',
      frequency: 'Daily',
      personName: 'Mother',
      startDate: `${currentYear}-02-15`,
      notes: `${DEMO_TAG} Thyroid support. Take on empty stomach with water.`
    },
    {
      id: 'demo-med-5',
      name: `${DEMO_TAG} Calcium + Vitamin D3`,
      dosage: '1 tablet',
      timing: 'Afternoon (01:30 PM)',
      frequency: 'Daily',
      personName: 'Mother',
      startDate: `${currentYear}-03-01`,
      notes: `${DEMO_TAG} Bone health supplement. Take after lunch.`
    },
    {
      id: 'demo-med-6',
      name: `${DEMO_TAG} Salbutamol Inhaler 100mcg`,
      dosage: '2 puffs',
      timing: 'As Needed',
      frequency: 'As Needed',
      personName: 'Sham',
      startDate: `${currentYear}-04-01`,
      notes: `${DEMO_TAG} Mild asthma relief before intense football training.`
    }
  ];

  const medicineLogs: MedicineLog[] = [
    {
      id: 'demo-log-1',
      medicineId: 'demo-med-1',
      medicineName: 'Amlodipine 5mg',
      personName: 'Father',
      status: 'Taken',
      timestamp: new Date().toISOString(),
      loggedBy: 'Father'
    },
    {
      id: 'demo-log-2',
      medicineId: 'demo-med-2',
      medicineName: 'Metformin 500mg',
      personName: 'Father',
      status: 'Taken',
      timestamp: new Date().toISOString(),
      loggedBy: 'Father'
    },
    {
      id: 'demo-log-3',
      medicineId: 'demo-med-4',
      medicineName: 'Thyroxine 50mcg',
      personName: 'Mother',
      status: 'Taken',
      timestamp: new Date().toISOString(),
      loggedBy: 'Mother'
    }
  ];

  const expenses: ExpenseItem[] = [
    {
      id: 'demo-exp-1',
      title: `${DEMO_TAG} Fresh Organic Produce & Fruits at Farmer Market`,
      amount: 1450,
      category: 'Groceries',
      date: today,
      payer: 'Mother',
      description: 'Weekly fresh organic produce, apples, spinach, and tomatoes'
    },
    {
      id: 'demo-exp-2',
      title: `${DEMO_TAG} Airtel Fiber Broadband 300 Mbps Monthly Plan`,
      amount: 1180,
      category: 'Utilities',
      date: today,
      payer: 'Sarah',
      description: '300 Mbps unlimited family broadband plan'
    },
    {
      id: 'demo-exp-3',
      title: `${DEMO_TAG} Sham Sports Nivia Football Studs & Kit`,
      amount: 3200,
      category: 'Shopping',
      date: `${currentYear}-11-02`,
      payer: 'Father',
      description: 'Nivia football studs and shin guards for school tournament'
    },
    {
      id: 'demo-exp-4',
      title: `${DEMO_TAG} Sneha Medical Reference Textbook (Robbins Pathology)`,
      amount: 2850,
      category: 'Education',
      date: `${currentYear}-11-04`,
      payer: 'Father',
      description: 'Required medical reference book for 2nd year MBBS'
    },
    {
      id: 'demo-exp-5',
      title: `${DEMO_TAG} Family Sunday Brunch at Cafe Bistro`,
      amount: 2150,
      category: 'Dining',
      date: `${currentYear}-11-08`,
      payer: 'Sarah',
      description: 'Family weekend brunch celebrating Sham match victory'
    },
    {
      id: 'demo-exp-6',
      title: `${DEMO_TAG} Monthly Fuel & Petrol for Family Car`,
      amount: 4500,
      category: 'Utilities',
      date: `${currentYear}-11-06`,
      payer: 'Father',
      description: 'Full tank petrol refill for Honda City at IndianOil'
    },
    {
      id: 'demo-exp-7',
      title: `${DEMO_TAG} Apollo Pharmacy Monthly Prescription Refill`,
      amount: 1620,
      category: 'Healthcare',
      date: `${currentYear}-11-01`,
      payer: 'Mother',
      description: 'Monthly refill of Amlodipine, Metformin, and Thyroxine'
    }
  ];

  const bills: BillItem[] = [
    {
      id: 'demo-bill-1',
      title: `${DEMO_TAG} BESCOM Home Electricity Bill`,
      amount: 3450,
      dueDate: `${currentYear}-11-18`,
      category: 'Utilities',
      isPaid: false,
      recurring: 'Monthly'
    },
    {
      id: 'demo-bill-2',
      title: `${DEMO_TAG} BWSSB Water & Sanitation Utility`,
      amount: 680,
      dueDate: `${currentYear}-11-25`,
      category: 'Utilities',
      isPaid: false,
      recurring: 'Monthly'
    },
    {
      id: 'demo-bill-3',
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
      id: 'demo-bill-4',
      title: `${DEMO_TAG} Piped Natural Gas (Adani Gas)`,
      amount: 890,
      dueDate: `${currentYear}-11-22`,
      category: 'Utilities',
      isPaid: false,
      recurring: 'Monthly'
    },
    {
      id: 'demo-bill-5',
      title: `${DEMO_TAG} Tata Play DTH Satellite TV Annual Plan`,
      amount: 2400,
      dueDate: `${currentYear}-12-01`,
      category: 'Utilities',
      isPaid: false,
      recurring: 'Yearly'
    }
  ];

  const groceries: GroceryItem[] = [
    {
      id: 'demo-groc-1',
      name: `${DEMO_TAG} Basmati Rice (Daawat Rozana)`,
      category: 'Pantry',
      quantity: '10 kg bag',
      notes: `${DEMO_TAG} Essential household stock`,
      isPurchased: false,
      estimatedPrice: 750
    },
    {
      id: 'demo-groc-2',
      name: `${DEMO_TAG} Fresh Cow Milk (Nandini Blue)`,
      category: 'Dairy',
      quantity: '2 Litres daily',
      notes: `${DEMO_TAG} Daily morning tea and cereal`,
      isPurchased: false,
      estimatedPrice: 96
    },
    {
      id: 'demo-groc-3',
      name: `${DEMO_TAG} Farm Fresh Eggs`,
      category: 'Meat',
      quantity: '1 Crate (30 eggs)',
      notes: `${DEMO_TAG} High protein for Sham and Sarah`,
      isPurchased: false,
      estimatedPrice: 210
    },
    {
      id: 'demo-groc-4',
      name: `${DEMO_TAG} Cold-Pressed Sunflower Oil`,
      category: 'Pantry',
      quantity: '2 Litres',
      notes: `${DEMO_TAG} Heart healthy cooking oil for Dad`,
      isPurchased: false,
      estimatedPrice: 340
    },
    {
      id: 'demo-groc-5',
      name: `${DEMO_TAG} Whole Wheat Bread (The Baker's Dozen)`,
      category: 'Bakery',
      quantity: '2 loaves',
      notes: `${DEMO_TAG} Breakfast sandwiches`,
      isPurchased: true,
      purchasedBy: 'Mother',
      purchasedAt: new Date().toISOString(),
      estimatedPrice: 110
    },
    {
      id: 'demo-groc-6',
      name: `${DEMO_TAG} Raw Pressery Almond Milk`,
      category: 'Dairy',
      quantity: '1 Litre',
      notes: `${DEMO_TAG} Lactose-free dairy substitute for Sneha`,
      isPurchased: false,
      estimatedPrice: 190
    },
    {
      id: 'demo-groc-7',
      name: `${DEMO_TAG} Organic India Tulsi Green Tea`,
      category: 'Beverages',
      quantity: '1 Box (25 bags)',
      notes: `${DEMO_TAG} Morning antioxidant tea for Dad`,
      isPurchased: false,
      estimatedPrice: 220
    },
    {
      id: 'demo-groc-8',
      name: `${DEMO_TAG} Dishwasher Detergent Pods & Scrubber`,
      category: 'Household',
      quantity: '1 Pack',
      notes: `${DEMO_TAG} Kitchen cleanup supply`,
      isPurchased: true,
      purchasedBy: 'Sarah',
      purchasedAt: new Date().toISOString(),
      estimatedPrice: 280
    }
  ];

  const groceryHistory: GroceryHistoryItem[] = [
    {
      id: 'demo-ghist-1',
      groceryId: 'demo-groc-5',
      name: 'Whole Wheat Bread (The Baker\'s Dozen)',
      category: 'Bakery',
      purchasedBy: 'Mother',
      purchasedAt: new Date().toISOString()
    },
    {
      id: 'demo-ghist-2',
      groceryId: 'demo-groc-8',
      name: 'Dishwasher Detergent Pods & Scrubber',
      category: 'Household',
      purchasedBy: 'Sarah',
      purchasedAt: new Date().toISOString()
    }
  ];

  const knowledgeList: FamilyKnowledge[] = [
    {
      id: 'demo-knw-1',
      title: `${DEMO_TAG} Sneha Lactose Intolerance & Dairy Sensitivity`,
      category: 'Allergies',
      importance: 'Critical',
      relatedMemberName: 'Sneha',
      content: 'Sneha has severe lactose intolerance. Substitute cow milk with almond milk or oat milk. Keep Lactaid enzyme tablets available in bathroom cabinet in case of accidental ingestion.',
      createdDate: today
    },
    {
      id: 'demo-knw-2',
      title: `${DEMO_TAG} Father Blood Group B+ & Sulfa Drug Allergy`,
      category: 'Emergency',
      importance: 'Critical',
      relatedMemberName: 'Father',
      content: 'Blood Group: B+ Positive. Allergic to Sulfa-based antibiotics (causes acute skin rash). Primary Physician: Dr. Rajesh Mehta at Fortis Hospital.',
      createdDate: today
    },
    {
      id: 'demo-knw-3',
      title: `${DEMO_TAG} Sham Exercise-Induced Mild Asthma Alert`,
      category: 'Allergies',
      importance: 'Important',
      relatedMemberName: 'Sham',
      content: 'Keep Salbutamol blue inhaler in football kit bag. Take 2 puffs 15 minutes before strenuous sports play or in cold winter mornings.',
      createdDate: today
    },
    {
      id: 'demo-knw-4',
      title: `${DEMO_TAG} Mother Diabetic Diet Constraints`,
      category: 'Dietary',
      importance: 'Important',
      relatedMemberName: 'Mother',
      content: 'Strict low glycemic index diet. Avoid white refined sugar and white flour. Light dinner before 8:30 PM.',
      createdDate: today
    },
    {
      id: 'demo-knw-5',
      title: `${DEMO_TAG} Home WiFi 5GHz Network Credentials & Printer IP`,
      category: 'General',
      importance: 'Important',
      relatedMemberName: 'Sarah',
      content: 'Primary SSID: HomeBrain_5GHz. Guest SSID: HomeBrain_Guest. Printer HP LaserJet IP: 192.168.1.150.',
      createdDate: today
    }
  ];

  const memories: FamilyMemory[] = [
    {
      id: 'demo-mem-1',
      title: `${DEMO_TAG} Golden Temple & Himachal Family Road Trip`,
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
      id: 'demo-mem-2',
      title: `${DEMO_TAG} Sarah University Graduation Day at NIT`,
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
      id: 'demo-mem-3',
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

  const emergencyContacts: EmergencyContact[] = [
    {
      id: 'demo-con-1',
      name: `Harley Sham (Primary Emergency Contact)`,
      relation: 'Emergency Lead',
      phone: '+91 98450 11223',
      email: 'harleysham6925@gmail.com',
      isPrimary: true
    },
    {
      id: 'demo-con-2',
      name: `Sham Sampath (Family Member)`,
      relation: 'Family',
      phone: '+91 98450 99887',
      email: 'shamsampth06@gmail.com',
      isPrimary: false
    }
  ];

  const emergencyLogs: EmergencyAlertLog[] = [
    {
      id: 'demo-elog-1',
      timestamp: new Date().toISOString(),
      userLocation: 'Kadambanallur, Chennai Metropolitan Area, Arakkonam, Ranipet, Tamil Nadu, 631151, India',
      latitude: 13.014084,
      longitude: 79.699829,
      accuracyMeters: 10,
      userName: 'Sarah',
      status: 'Logged',
      recipients: [`Harley Sham (+91 98450 11223)`, `Sham Sampath (+91 98450 99887)`]
    }
  ];

  const documents: DocumentItem[] = [
    {
      id: 'demo-doc-passport-1',
      title: `${DEMO_TAG} Father's Republic of India Passport`,
      category: 'Identity',
      fileType: 'PDF',
      fileSize: '1.85 MB',
      fileUrl: '#/documents/demo-doc-passport-1',
      storagePath: 'passports/father-passport-2026.pdf',
      description: 'Official Indian Passport for Father (Rajesh Kumar). Document No: Z4892107. Issued by RPO Bangalore. Valid: 14 Aug 2021 to 13 Aug 2031. Physical Location: Master Bedroom Study Safe Locker #2.',
      summaryContent: '• Document Type: Republic of India Passport\n• Passport No: Z4892107\n• Holder: Rajesh Kumar (Father)\n• DOB: 15 Jun 1978\n• Place of Issue: Bangalore\n• Expiry Date: 13 Aug 2031\n• Physical House Storage: Master Bedroom Safe Locker #2, Shelf A\n• Emergency Contact: Priya Kumar (Mother)',
      uploaderName: 'Sarah',
      uploadDate: '2026-01-10'
    },
    {
      id: 'demo-doc-insurance-2',
      title: `${DEMO_TAG} Family Health Insurance Policy 2026 (Star Health)`,
      category: 'Medical',
      fileType: 'PDF',
      fileSize: '3.2 MB',
      fileUrl: '#/documents/demo-doc-insurance-2',
      storagePath: 'insurance/star-health-floater-2026.pdf',
      description: 'Comprehensive Family Floater Health Insurance Policy covering 5 members (Father, Mother, Sarah, Sneha, Sham). Sum Insured: ₹25,00,000. Policy No: SH-99201-2026. TPA: MediAssist India.',
      summaryContent: '• Insurer: Star Health & Allied Insurance\n• Policy Number: SH-99201-2026\n• Sum Insured: ₹25,00,000 (Floater)\n• Beneficiaries: Rajesh Kumar, Priya Kumar, Sarah Kumar, Sneha Kumar, Sham Kumar\n• Renewal Date: 15 Dec 2026\n• Covered Hospitals: Apollo Hospitals, Manipal Hospitals, Fortis\n• TPA Helpline: 1800-425-2255 / 1800-102-4477\n• Physical Copy Location: Master Bedroom Filing Cabinet, Green Folder labeled "Insurance 2026"',
      uploaderName: 'Sarah',
      uploadDate: '2026-02-01'
    }
  ];

  return {
    currentUser: {
      id: 'demo-user-sarah',
      familyId: 'demo-family-kumar',
      familyName: 'Kumar Household',
      name: 'Sarah',
      role: 'Admin' as const,
      email: 'sarah.demo@homebrain.test',
      avatar: '👩‍💻'
    },
    familyMembers,
    events,
    reminders,
    medicines,
    medicineLogs,
    expenses,
    bills,
    groceries,
    groceryHistory,
    knowledgeList,
    knowledgeFiles: [],
    documents,
    memories,
    emergencyContacts,
    emergencyLogs
  };
};

