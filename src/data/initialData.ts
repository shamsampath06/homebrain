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
  FamilyMemory,
  AIMessage
} from '../types';

export const initialUser: User = {
  id: 'usr_sarah',
  name: 'Sarah Sharma',
  email: 'sarah.sharma@family.homebrain',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  role: 'Parent',
  familyId: 'fam_sharma',
  familyName: 'The Sharma Family'
};

export const initialFamilyMembers: FamilyMember[] = [
  {
    id: 'mem_1',
    name: 'Sarah Sharma',
    relation: 'Mother / Self',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'Parent',
    phone: '+1 (555) 234-5678',
    email: 'sarah.sharma@family.homebrain',
    age: 38
  },
  {
    id: 'mem_2',
    name: 'Rahul Sharma',
    relation: 'Father',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Parent',
    phone: '+1 (555) 987-6543',
    email: 'rahul.sharma@family.homebrain',
    age: 40
  },
  {
    id: 'mem_3',
    name: 'Grandma Savitri',
    relation: 'Grandmother',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    role: 'Senior',
    phone: '+1 (555) 345-6789',
    email: 'grandma.savitri@family.homebrain',
    age: 72
  },
  {
    id: 'mem_4',
    name: 'Ananya Sharma',
    relation: 'Daughter / Sister',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'Child',
    phone: '+1 (555) 456-7890',
    email: 'ananya@family.homebrain',
    age: 15
  }
];

export const initialEvents: FamilyEvent[] = [
  {
    id: 'evt_1',
    title: "Rahul's Birthday Celebration",
    date: '2026-09-15',
    time: '19:00',
    category: 'Birthday',
    description: 'Family dinner and cake cutting at Olive Garden',
    membersInvolved: ['Sarah Sharma', 'Rahul Sharma', 'Grandma Savitri', 'Ananya Sharma'],
    reminder: true,
    recurring: 'Yearly'
  },
  {
    id: 'evt_2',
    title: 'Doctor Appointment - Grandma Routine Checkup',
    date: '2026-09-14',
    time: '16:00',
    category: 'Appointment',
    description: 'Dr. Mehta Clinic - Cardiology & BP Followup',
    membersInvolved: ['Grandma Savitri', 'Sarah Sharma'],
    reminder: true,
    recurring: 'None'
  },
  {
    id: 'evt_3',
    title: 'Ananya Math Final Exam',
    date: '2026-09-18',
    time: '09:00',
    category: 'School',
    description: 'Algebra & Trigonometric calculus final exam',
    membersInvolved: ['Ananya Sharma'],
    reminder: true,
    recurring: 'None'
  }
];

export const initialReminders: ReminderItem[] = [
  {
    id: 'rem_1',
    title: "Rahul's Birthday Today 🎂",
    category: 'Birthday',
    dateTime: 'Today, 7:00 PM',
    priority: 'High',
    completed: false,
    assignedMemberName: 'Rahul Sharma'
  },
  {
    id: 'rem_2',
    title: "Grandma's BP Medicine - 8:00 PM 💊",
    category: 'Medicine',
    dateTime: 'Today, 8:00 PM',
    priority: 'High',
    completed: false,
    assignedMemberName: 'Grandma Savitri'
  },
  {
    id: 'rem_3',
    title: 'Electricity Bill Due Tomorrow ⚡',
    category: 'Bill',
    dateTime: 'Tomorrow, 5:00 PM',
    priority: 'Medium',
    completed: false,
    assignedMemberName: 'Rahul Sharma'
  },
  {
    id: 'rem_4',
    title: 'Doctor Appointment - Tomorrow at 4:00 PM 🩺',
    category: 'Appointment',
    dateTime: 'Tomorrow, 4:00 PM',
    priority: 'High',
    completed: false,
    assignedMemberName: 'Grandma Savitri'
  },
  {
    id: 'rem_5',
    title: 'Buy Organic Milk & Eggs 🛒',
    category: 'Grocery',
    dateTime: 'Today, 6:00 PM',
    priority: 'Low',
    completed: false,
    assignedMemberName: 'Sarah Sharma'
  }
];

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc_1',
    title: 'Family Health Insurance Policy 2026.pdf',
    category: 'Insurance',
    uploadDate: '2026-08-10',
    fileType: 'PDF',
    fileSize: '3.4 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'Comprehensive Star Health Platinum coverage policy card for all 4 family members.',
    summaryContent: 'Star Health Platinum Plan #SH-992144. Covers hospitalization up to $500,000.',
    uploaderName: 'Sarah Sharma'
  },
  {
    id: 'doc_2',
    title: 'Rahul International Passport Copy.pdf',
    category: 'Identity',
    uploadDate: '2026-05-12',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'Rahul Sharma Passport Document. Stored in Top Master Bedroom Safe #2.',
    summaryContent: 'Passport No: Z8810294. Expires: 14 NOV 2032. Physical location: Master Bedroom Safe.',
    uploaderName: 'Rahul Sharma'
  },
  {
    id: 'doc_3',
    title: 'House Property Deed & Tax Receipt.pdf',
    category: 'Home',
    uploadDate: '2026-01-20',
    fileType: 'PDF',
    fileSize: '4.2 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'Property ownership documents and 2026 municipal property tax paid receipt.',
    summaryContent: 'Property Tax Paid $1,250. Parcel ID: 991-04A.',
    uploaderName: 'Rahul Sharma'
  }
];

export const initialGroceries: GroceryItem[] = [
  {
    id: 'groc_1',
    name: 'Organic Milk 2L',
    category: 'Dairy',
    quantity: '2 Bottles',
    notes: 'Low fat / 2% Milk for Grandma',
    isPurchased: true,
    purchasedBy: 'Sarah Sharma',
    purchasedAt: '11 Sep 2026 – 6:30 PM'
  },
  {
    id: 'groc_2',
    name: 'Whole Grain Bread',
    category: 'Bakery',
    quantity: '1 Pack',
    notes: 'Brown sandwich bread',
    isPurchased: false
  },
  {
    id: 'groc_3',
    name: 'Farm Fresh Eggs (12 pcs)',
    category: 'Dairy',
    quantity: '1 Carton',
    notes: 'Free range brown eggs',
    isPurchased: false
  },
  {
    id: 'groc_4',
    name: 'Fresh Tomatoes & Spinach',
    category: 'Produce',
    quantity: '1 kg',
    notes: 'Organic salad tomatoes',
    isPurchased: true,
    purchasedBy: 'Rahul Sharma',
    purchasedAt: '11 Sep 2026 – 5:45 PM'
  }
];

export const initialGroceryHistory: GroceryHistoryItem[] = [
  {
    id: 'ghist_1',
    name: 'Organic Milk 2L',
    category: 'Dairy',
    purchasedBy: 'Sarah Sharma',
    purchasedAt: '11 Sep 2026 – 6:30 PM'
  },
  {
    id: 'ghist_2',
    name: 'Fresh Tomatoes & Spinach',
    category: 'Produce',
    purchasedBy: 'Rahul Sharma',
    purchasedAt: '11 Sep 2026 – 5:45 PM'
  },
  {
    id: 'ghist_3',
    name: 'Basmati Rice 5kg',
    category: 'Pantry',
    purchasedBy: 'Rahul Sharma',
    purchasedAt: '05 Sep 2026 – 4:15 PM'
  }
];

export const initialMedicines: MedicineItem[] = [
  {
    id: 'med_1',
    name: 'Grandma BP Medicine (Amlodipine 5mg)',
    dosage: '1 Tablet (5mg)',
    timing: '8:00 PM',
    frequency: 'Daily',
    personName: 'Grandma Savitri',
    startDate: '2025-01-01',
    notes: 'Take after dinner with water. Mandatory daily dose.'
  },
  {
    id: 'med_2',
    name: 'Multivitamin & Vitamin D3',
    dosage: '1 Capsule',
    timing: '9:00 AM',
    frequency: 'Daily',
    personName: 'Rahul Sharma',
    startDate: '2026-03-01',
    notes: 'Take after breakfast.'
  },
  {
    id: 'med_3',
    name: 'Calcium Supplement 500mg',
    dosage: '1 Tablet',
    timing: '2:00 PM',
    frequency: 'Daily',
    personName: 'Grandma Savitri',
    startDate: '2025-06-15',
    notes: 'Post lunch supplement.'
  }
];

export const initialMedicineLogs: MedicineLog[] = [
  {
    id: 'mlog_1',
    medicineId: 'med_1',
    medicineName: 'Grandma BP Medicine (Amlodipine 5mg)',
    personName: 'Grandma Savitri',
    status: 'Taken',
    timestamp: '12 Sep 2026 – 8:05 PM',
    loggedBy: 'Sarah Sharma'
  },
  {
    id: 'mlog_2',
    medicineId: 'med_2',
    medicineName: 'Multivitamin & Vitamin D3',
    personName: 'Rahul Sharma',
    status: 'Taken',
    timestamp: '13 Sep 2026 – 9:15 AM',
    loggedBy: 'Rahul Sharma'
  }
];

export const initialExpenses: ExpenseItem[] = [
  {
    id: 'exp_1',
    title: 'Monthly Supermarket Grocery Shopping',
    amount: 8450,
    category: 'Groceries',
    date: '2026-09-08',
    payer: 'Rahul Sharma',
    description: 'Bulk monthly pantry restocking at Whole Foods'
  },
  {
    id: 'exp_2',
    title: 'Grandma Doctor Consultation & Pharmacy',
    amount: 3200,
    category: 'Healthcare',
    date: '2026-09-05',
    payer: 'Sarah Sharma',
    description: 'Cardiologist review & 3-month prescription refill'
  },
  {
    id: 'exp_3',
    title: 'High-Speed Home Fiber Internet Bill',
    amount: 2100,
    category: 'Utilities',
    date: '2026-09-01',
    payer: 'Rahul Sharma',
    description: '1 Gbps Airtel Black Unlimited Plan'
  },
  {
    id: 'exp_4',
    title: 'Ananya School Tuition & Books',
    amount: 5000,
    category: 'Education',
    date: '2026-09-02',
    payer: 'Sarah Sharma',
    description: 'Term 2 academic materials and lab fees'
  }
];

export const initialBills: BillItem[] = [
  {
    id: 'bill_1',
    title: 'Electricity Power Utility Bill',
    amount: 4850,
    dueDate: '2026-09-14',
    category: 'Utilities',
    isPaid: false,
    recurring: 'Monthly'
  },
  {
    id: 'bill_2',
    title: 'Piped Natural Gas Bill',
    amount: 1420,
    dueDate: '2026-09-20',
    category: 'Utilities',
    isPaid: false,
    recurring: 'Monthly'
  },
  {
    id: 'bill_3',
    title: 'Car Comprehensive Insurance Renewal',
    amount: 14500,
    dueDate: '2026-08-28',
    category: 'Insurance',
    isPaid: true,
    paidDate: '2026-08-25',
    paidBy: 'Rahul Sharma',
    recurring: 'Yearly'
  }
];

export const initialKnowledge: FamilyKnowledge[] = [
  {
    id: 'knw_1',
    title: 'Grandma Penicillin Allergy',
    content: 'Grandma Savitri is severely allergic to Penicillin and Amoxicillin antibiotics. Causes anaphylaxis skin rash.',
    category: 'Allergies',
    relatedMemberName: 'Grandma Savitri',
    importance: 'Critical',
    createdDate: '2025-04-10'
  },
  {
    id: 'knw_2',
    title: 'Dad Food Preferences',
    content: 'Dad (Rahul) prefers low spice / mild food with extra olive oil. Avoids lactose products after 8 PM.',
    category: 'Preferences',
    relatedMemberName: 'Rahul Sharma',
    importance: 'Important',
    createdDate: '2025-06-18'
  },
  {
    id: 'knw_3',
    title: 'Sister School Exam Schedule',
    content: 'Ananya has her Math calculus final exam on Monday Sept 18th. Prefers quiet study time between 6 PM - 9 PM.',
    category: 'Schedules',
    relatedMemberName: 'Ananya Sharma',
    importance: 'Important',
    createdDate: '2026-09-01'
  },
  {
    id: 'knw_4',
    title: 'Home Main Water & Electrical Shutoff',
    content: 'Main water valve is located under the kitchen sink left cabinet. Electrical breaker box is behind basement door.',
    category: 'Emergency',
    relatedMemberName: 'All Family',
    importance: 'Critical',
    createdDate: '2025-01-05'
  }
];

export const initialEmergencyContacts: EmergencyContact[] = [
  {
    id: 'emg_1',
    name: 'Dr. Rajesh Mehta (Family Physician)',
    relation: 'Doctor',
    phone: '+1 (555) 911-0012',
    isPrimary: true
  },
  {
    id: 'emg_2',
    name: 'Uncle Vikram Sharma',
    relation: 'Brother / Uncle',
    phone: '+1 (555) 911-0034',
    isPrimary: true
  },
  {
    id: 'emg_3',
    name: 'City Central Ambulance & Emergency',
    relation: 'Hospital Services',
    phone: '911',
    isPrimary: false
  }
];

export const initialMemories: FamilyMemory[] = [
  {
    id: 'mem_2026_1',
    title: "Rahul's 40th Birthday Surprise Party",
    year: 2026,
    date: '2026-09-10',
    description: 'Surprise weekend gathering with close friends and family at the garden patio.',
    photoUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80',
    location: 'Home Patio, California',
    addedBy: 'Sarah Sharma'
  },
  {
    id: 'mem_2026_2',
    title: 'Family Summer Weekend Picnic',
    year: 2026,
    date: '2026-07-22',
    description: 'Sunny afternoon enjoying homemade lemonade and frisbee at Lakeside Park.',
    photoUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
    location: 'Lakeside Park',
    addedBy: 'Rahul Sharma'
  },
  {
    id: 'mem_2025_1',
    title: 'Ooty Family Hillstation Trip ✈️',
    year: 2025,
    date: '2025-11-15',
    description: 'Unforgettable 5-day vacation visiting botanical gardens, tea estates, and riding the toy train!',
    photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    location: 'Ooty Tea Estates, India',
    addedBy: 'Sarah Sharma'
  },
  {
    id: 'mem_2025_2',
    title: 'Ananya 14th Birthday Celebration',
    year: 2025,
    date: '2025-05-18',
    description: 'Ananya celebrating with her favorite chocolate truffle cake and karaoke night.',
    photoUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&auto=format&fit=crop&q=80',
    location: 'Sharma Residence',
    addedBy: 'Grandma Savitri'
  }
];

export const initialAIMessages: AIMessage[] = [
  {
    id: 'msg_1',
    sender: 'assistant',
    text: "Hello Sarah! 👋 I'm HomeBrain AI, your family's intelligent digital brain. How can I help you manage household tasks, check schedules, or find documents today?",
    timestamp: '10:00 AM'
  }
];
