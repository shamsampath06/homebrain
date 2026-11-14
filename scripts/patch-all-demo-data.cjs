const fs = require('fs');
const path = require('path');

const demoDataPath = path.join(__dirname, '..', 'src', 'lib', 'demoData.ts');
const serverIndexPath = path.join(__dirname, '..', 'server', 'index.ts');

console.log('Generating updated demoData.ts and server fallback state...');

const demoCode = `import {
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
  EmergencyAlertLog,
  EventCategory,
  DocumentCategory,
  GroceryCategory,
  ExpenseCategory
} from '../types';
import { insertRow, deleteRow } from './supabase';
import { EXAMPLE_PLACE_MEMORIES } from '../data/exampleMemories';

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
    preferences: 'Vegetarian • Traditional home-cooked meals • Morning walk at 6:00 AM'
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
    preferences: 'Software engineer • Household finance organizer • Vegetarian food'
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
    preferences: 'Medical student • Lactose intolerant • Dairy-free alternatives'
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

// Module 1: Calendar & Events (12 records)
export const RAW_DEMO_EVENTS: Array<Omit<FamilyEvent, 'id'>> = [
  {
    title: \`\${DEMO_TAG} Father's Birthday\`,
    date: '2026-11-15',
    time: '19:00',
    category: 'Birthday',
    description: "Father's 52nd birthday dinner celebration",
    membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
    reminder: true,
    recurring: 'Yearly'
  },
  {
    title: \`\${DEMO_TAG} Family Dinner\`,
    date: '2026-11-16',
    time: '20:00',
    category: 'General',
    description: 'Family dinner gathering at home',
    membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
    reminder: true,
    recurring: 'None'
  },
  {
    title: \`\${DEMO_TAG} Doctor Appointment\`,
    date: '2026-11-17',
    time: '10:00',
    category: 'Appointment',
    description: 'Routine health checkup consultation with Dr. Sharma',
    membersInvolved: ['Mother', 'Sarah'],
    reminder: true,
    recurring: 'None'
  },
  {
    title: \`\${DEMO_TAG} Grocery Shopping\`,
    date: '2026-11-18',
    time: '18:00',
    category: 'General',
    description: 'Weekly grocery shopping at supermarket',
    membersInvolved: ['Sarah'],
    reminder: true,
    recurring: 'Weekly'
  },
  {
    title: \`\${DEMO_TAG} Family Meeting\`,
    date: '2026-11-20',
    time: '18:00',
    category: 'General',
    description: 'Bi-weekly household planning discussion',
    membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
    reminder: true,
    recurring: 'None'
  },
  {
    title: \`\${DEMO_TAG} Sarah's Birthday\`,
    date: '2026-11-22',
    time: '19:00',
    category: 'Birthday',
    description: "Sarah's birthday party and family gathering",
    membersInvolved: ['Sarah', 'Father', 'Mother', 'Sneha', 'Sham'],
    reminder: true,
    recurring: 'Yearly'
  },
  {
    title: \`\${DEMO_TAG} Temple Visit\`,
    date: '2026-11-23',
    time: '08:00',
    category: 'Holiday',
    description: 'Special morning prayer and temple darshan',
    membersInvolved: ['Father', 'Mother', 'Sarah'],
    reminder: true,
    recurring: 'None'
  },
  {
    title: \`\${DEMO_TAG} Electricity Bill Reminder\`,
    date: '2026-11-25',
    time: '09:00',
    category: 'Bill',
    description: 'Reminder to pay BESCOM electricity bill ₹3,450',
    membersInvolved: ['Sarah'],
    reminder: true,
    recurring: 'Monthly'
  },
  {
    title: \`\${DEMO_TAG} Parents Anniversary\`,
    date: '2026-11-27',
    time: '19:00',
    category: 'Holiday',
    description: 'Parents 26th wedding anniversary dinner',
    membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
    reminder: true,
    recurring: 'Yearly'
  },
  {
    title: \`\${DEMO_TAG} Family Trip\`,
    date: '2026-11-28',
    time: '09:00',
    category: 'Holiday',
    description: 'Weekend family trip to Mahabalipuram',
    membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
    reminder: true,
    recurring: 'None'
  },
  {
    title: \`\${DEMO_TAG} Monthly Family Meeting\`,
    date: '2026-11-29',
    time: '18:00',
    category: 'General',
    description: 'Monthly family finance and schedule review',
    membersInvolved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
    reminder: true,
    recurring: 'Monthly'
  },
  {
    title: \`\${DEMO_TAG} Dentist Appointment\`,
    date: '2026-12-02',
    time: '11:00',
    category: 'Appointment',
    description: 'Dental checkup and cleaning at City Dental Care',
    membersInvolved: ['Sham', 'Mother'],
    reminder: true,
    recurring: 'None'
  }
];

// Module 2: Document Vault (12 records)
export const RAW_DEMO_DOCUMENTS: Array<Omit<DocumentItem, 'id'>> = [
  {
    title: \`\${DEMO_TAG} Father's Passport\`,
    category: 'Identity',
    fileType: 'TXT',
    fileSize: '434 B',
    fileUrl: '/demo-documents/Father_Passport.txt',
    storagePath: 'demo-documents/Father_Passport.txt',
    uploaderName: 'Sarah',
    uploadDate: '2026-01-10',
    description: 'Official Republic of India Passport for Demo Father (Rajesh Kumar). Document No: Z9876543.',
    summaryContent: '• Republic of India Passport\\n• Passport No: Z9876543\\n• Holder: Rajesh Kumar (Father)\\n• DOB: 15/06/1974\\n• Place of Issue: Chennai\\n• Expiry Date: 14/06/2034'
  },
  {
    title: \`\${DEMO_TAG} Mother's Aadhaar Sample\`,
    category: 'Identity',
    fileType: 'TXT',
    fileSize: '417 B',
    fileUrl: '/demo-documents/Mother_Aadhaar_Sample.txt',
    storagePath: 'demo-documents/Mother_Aadhaar_Sample.txt',
    uploaderName: 'Sarah',
    uploadDate: '2026-01-15',
    description: 'Official Aadhaar Card record for Demo Mother (Priya Kumar). Fictional demo identity.',
    summaryContent: '• Government of India Aadhaar Card\\n• Number: 0000 1111 2222 (Fictional Demo)\\n• Holder: Priya Kumar (Mother)\\n• DOB: 22/09/1977\\n• Address: 42 Palm Grove Avenue, Anna Nagar, Chennai 600040'
  },
  {
    title: \`\${DEMO_TAG} Family Address Proof\`,
    category: 'Identity',
    fileType: 'TXT',
    fileSize: '429 B',
    fileUrl: '/demo-documents/Family_Address_Proof.txt',
    storagePath: 'demo-documents/Family_Address_Proof.txt',
    uploaderName: 'Father',
    uploadDate: '2026-02-01',
    description: 'Greater Chennai Corporation Residential Address Certificate for household residence.',
    summaryContent: '• Residential Address Certificate\\n• Head of Household: Rajesh Kumar\\n• Address: 42 Palm Grove Avenue, Anna Nagar West Extension, Chennai 600040\\n• EB Connection: EB-CHN-88219\\n• Water Account: CMW-44021'
  },
  {
    title: \`\${DEMO_TAG} Electricity Bill November\`,
    category: 'Financial',
    fileType: 'TXT',
    fileSize: '333 B',
    fileUrl: '/demo-documents/Electricity_Bill_November.txt',
    storagePath: 'demo-documents/Electricity_Bill_November.txt',
    uploaderName: 'Sarah',
    uploadDate: '2026-11-05',
    description: 'Household Electricity Bill for November 2026. Amount: ₹3,450 due Nov 25, 2026.',
    summaryContent: '• Billing Month: November 2026\\n• Consumer: Demo Household\\n• Amount: ₹3,450\\n• Due Date: November 25, 2026\\n• Status: Unpaid\\n• Units: 420 kWh'
  },
  {
    title: \`\${DEMO_TAG} Water Bill November\`,
    category: 'Financial',
    fileType: 'TXT',
    fileSize: '392 B',
    fileUrl: '/demo-documents/Water_Bill_November.txt',
    storagePath: 'demo-documents/Water_Bill_November.txt',
    uploaderName: 'Sarah',
    uploadDate: '2026-11-06',
    description: 'Chennai Metro Water Supply Bill for November 2026. Amount: ₹850 due Nov 20, 2026.',
    summaryContent: '• Water Supply Bill - November 2026\\n• Consumer: Demo Household\\n• Amount: ₹850\\n• Due Date: November 20, 2026\\n• Status: Unpaid'
  },
  {
    title: \`\${DEMO_TAG} Hospital Appointment Report\`,
    category: 'Medical',
    fileType: 'TXT',
    fileSize: '545 B',
    fileUrl: '/demo-documents/Hospital_Appointment_Report.txt',
    storagePath: 'demo-documents/Hospital_Appointment_Report.txt',
    uploaderName: 'Mother',
    uploadDate: '2026-11-17',
    description: 'Apollo Hospitals Clinical Consultation Report for Demo Mother by Dr. Sharma.',
    summaryContent: '• Patient: Priya Kumar\\n• Date: 17/11/2026\\n• Doctor: Dr. K. Sharma (Endocrinology)\\n• Observations: HbA1c 6.8%, BP 122/80\\n• Advice: Regular diet and exercise, next review in 3 months'
  },
  {
    title: \`\${DEMO_TAG} Family Insurance Policy\`,
    category: 'Insurance',
    fileType: 'TXT',
    fileSize: '525 B',
    fileUrl: '/demo-documents/Family_Insurance_Policy.txt',
    storagePath: 'demo-documents/Family_Insurance_Policy.txt',
    uploaderName: 'Father',
    uploadDate: '2026-01-05',
    description: 'Star Health Family Optima Insurance Plan. ₹5 Lakhs sum insured floater covering all 5 members.',
    summaryContent: '• Policy No: POL-772910-FAM\\n• Policyholder: Rajesh Kumar\\n• Coverage: ₹5,00,000 (₹5 Lakhs)\\n• Covered Members: Father, Mother, Sarah, Sneha, Sham\\n• Period: 06/12/2025 to 05/12/2027'
  },
  {
    title: \`\${DEMO_TAG} Property Ownership Record\`,
    category: 'Home',
    fileType: 'TXT',
    fileSize: '482 B',
    fileUrl: '/demo-documents/Property_Ownership_Record.txt',
    storagePath: 'demo-documents/Property_Ownership_Record.txt',
    uploaderName: 'Father',
    uploadDate: '2026-01-12',
    description: 'Tamil Nadu Registration Department Property Deed for Anna Nagar West residence.',
    summaryContent: '• Property Title Deed No: 2841/2012\\n• Owners: Rajesh Kumar & Priya Kumar\\n• Address: 42 Palm Grove Avenue, Anna Nagar West, Chennai 600040\\n• Area: 2,400 Sq. Ft.\\n• Status: Nil Encumbrance'
  },
  {
    title: \`\${DEMO_TAG} Sarah School Certificate\`,
    category: 'Education',
    fileType: 'TXT',
    fileSize: '509 B',
    fileUrl: '/demo-documents/Sarah_School_Certificate.txt',
    storagePath: 'demo-documents/Sarah_School_Certificate.txt',
    uploaderName: 'Sarah',
    uploadDate: '2026-01-08',
    description: 'CBSE Senior School Certificate (Class XII) for Demo Sarah from St. Michael School.',
    summaryContent: '• CBSE Class XII Senior School Certificate\\n• Student: Sarah Kumar\\n• Roll No: 8192034\\n• Stream: Science\\n• Result: 94.2% Distinction'
  },
  {
    title: \`\${DEMO_TAG} Grocery Purchase Receipt\`,
    category: 'Financial',
    fileType: 'TXT',
    fileSize: '578 B',
    fileUrl: '/demo-documents/Grocery_Purchase_Receipt.txt',
    storagePath: 'demo-documents/Grocery_Purchase_Receipt.txt',
    uploaderName: 'Sarah',
    uploadDate: '2026-11-02',
    description: 'Nilgiris 1905 Supermarket retail tax invoice for monthly grocery purchase of ₹2,500.',
    summaryContent: '• Nilgiris Retail Tax Invoice\\n• Date: 02/11/2026\\n• Total Items: 5\\n• Total Paid: ₹2,500.00\\n• Mode: UPI GPay'
  },
  {
    title: \`\${DEMO_TAG} Family Emergency Contacts\`,
    category: 'General',
    fileType: 'TXT',
    fileSize: '499 B',
    fileUrl: '/demo-documents/Family_Emergency_Contacts.txt',
    storagePath: 'demo-documents/Family_Emergency_Contacts.txt',
    uploaderName: 'Sarah',
    uploadDate: '2026-01-02',
    description: 'Household Emergency Directory including police, hospital, ambulance, and doctor contacts.',
    summaryContent: '• Anna Nagar Police: 044-26151100 / 100\\n• Apollo Clinic: 044-28290200 / 1066\\n• Dr. Sharma: +91 98400 12345\\n• Ambulance: 108\\n• Fire: 101'
  },
  {
    title: \`\${DEMO_TAG} Vehicle Insurance Document\`,
    category: 'Insurance',
    fileType: 'TXT',
    fileSize: '509 B',
    fileUrl: '/demo-documents/Vehicle_Insurance_Document.txt',
    storagePath: 'demo-documents/Vehicle_Insurance_Document.txt',
    uploaderName: 'Father',
    uploadDate: '2026-10-16',
    description: 'HDFC ERGO Comprehensive Motor Vehicle Insurance for Hyundai Creta (TN 01 AB 1234).',
    summaryContent: '• Policy No: MOT-482019-2026\\n• Vehicle: Hyundai Creta (TN 01 AB 1234)\\n• Insured: Rajesh Kumar\\n• IDV: ₹11,50,000\\n• Validity: 16/10/2026 to 15/10/2027'
  }
];

// Module 3: Smart Grocery List (20 records)
export const RAW_DEMO_GROCERIES: Array<Omit<GroceryItem, 'id'>> = [
  { name: \`\${DEMO_TAG} Basmati Rice\`, quantity: '10 kg', category: 'Pantry', isPurchased: false, estimatedPrice: 950, notes: 'Needed - Premium grain stock' },
  { name: \`\${DEMO_TAG} Cow Milk\`, quantity: '2 litres', category: 'Dairy', isPurchased: false, estimatedPrice: 110, notes: 'Needed - Fresh daily milk' },
  { name: \`\${DEMO_TAG} Eggs\`, quantity: '30 pieces', category: 'Dairy', isPurchased: false, estimatedPrice: 195, notes: 'Needed - Farm fresh eggs' },
  { name: \`\${DEMO_TAG} Wheat Flour\`, quantity: '5 kg', category: 'Pantry', isPurchased: false, estimatedPrice: 240, notes: 'Needed - Chakki fresh atta' },
  { name: \`\${DEMO_TAG} Tomatoes\`, quantity: '2 kg', category: 'Produce', isPurchased: false, estimatedPrice: 80, notes: 'Needed - Country tomatoes' },
  { name: \`\${DEMO_TAG} Onions\`, quantity: '3 kg', category: 'Produce', isPurchased: false, estimatedPrice: 120, notes: 'Needed - Nasik onions' },
  { name: \`\${DEMO_TAG} Potatoes\`, quantity: '2 kg', category: 'Produce', isPurchased: true, purchasedBy: 'Mother', purchasedAt: '2026-11-13T10:00:00Z', estimatedPrice: 70, notes: 'Purchased' },
  { name: \`\${DEMO_TAG} Cooking Oil\`, quantity: '5 litres', category: 'Pantry', isPurchased: false, estimatedPrice: 750, notes: 'Needed - Sunflower cooking oil' },
  { name: \`\${DEMO_TAG} Sugar\`, quantity: '2 kg', category: 'Pantry', isPurchased: false, estimatedPrice: 90, notes: 'Needed - Refined sugar' },
  { name: \`\${DEMO_TAG} Toor Dal\`, quantity: '2 kg', category: 'Pantry', isPurchased: false, estimatedPrice: 280, notes: 'Needed - Unpolished toor dal' },
  { name: \`\${DEMO_TAG} Almonds\`, quantity: '500 g', category: 'Pantry', isPurchased: false, estimatedPrice: 450, notes: 'Needed - California almonds' },
  { name: \`\${DEMO_TAG} Bread\`, quantity: '2 packets', category: 'Bakery', isPurchased: true, purchasedBy: 'Sarah', purchasedAt: '2026-11-13T08:30:00Z', estimatedPrice: 90, notes: 'Purchased' },
  { name: \`\${DEMO_TAG} Apples\`, quantity: '2 kg', category: 'Produce', isPurchased: false, estimatedPrice: 320, notes: 'Needed - Shimla apples' },
  { name: \`\${DEMO_TAG} Bananas\`, quantity: '2 dozen', category: 'Produce', isPurchased: false, estimatedPrice: 120, notes: 'Needed - Robusta bananas' },
  { name: \`\${DEMO_TAG} Dishwashing Liquid\`, quantity: '2 bottles', category: 'Household', isPurchased: false, estimatedPrice: 180, notes: 'Needed - Lemon gel' },
  { name: \`\${DEMO_TAG} Detergent\`, quantity: '3 kg', category: 'Household', isPurchased: false, estimatedPrice: 360, notes: 'Needed - Washing machine powder' },
  { name: \`\${DEMO_TAG} Bath Soap\`, quantity: '6 bars', category: 'Household', isPurchased: false, estimatedPrice: 240, notes: 'Needed - Personal care' },
  { name: \`\${DEMO_TAG} Coffee Powder\`, quantity: '500 g', category: 'Beverages', isPurchased: false, estimatedPrice: 350, notes: 'Needed - Filter coffee blend' },
  { name: \`\${DEMO_TAG} Carrots\`, quantity: '1 kg', category: 'Produce', isPurchased: false, estimatedPrice: 60, notes: 'Needed - Fresh carrots' },
  { name: \`\${DEMO_TAG} Toothpaste\`, quantity: '2 tubes', category: 'Household', isPurchased: false, estimatedPrice: 180, notes: 'Needed - Complete care' }
];

// Module 4: Medicine Manager (10 records)
export const RAW_DEMO_MEDICINES: Array<Omit<MedicineItem, 'id'>> = [
  { name: \`\${DEMO_TAG} Medicine A\`, dosage: '5mg tablet', timing: '08:00 AM', frequency: 'Daily', personName: 'Father', startDate: '2026-01-01', notes: 'Active - Schedule 8 AM. Take after breakfast with water.' },
  { name: \`\${DEMO_TAG} Medicine B\`, dosage: '10mg tablet', timing: '09:00 PM', frequency: 'Daily', personName: 'Father', startDate: '2026-01-01', notes: 'Active - Schedule 9 PM. Take after dinner.' },
  { name: \`\${DEMO_TAG} Supplement A\`, dosage: '1 tablet', timing: '09:00 AM', frequency: 'Daily', personName: 'Mother', startDate: '2026-02-01', notes: 'Active - Schedule 9 AM. Vitamin D3 supplement.' },
  { name: \`\${DEMO_TAG} Supplement B\`, dosage: '1 tablet', timing: '08:00 PM', frequency: 'Daily', personName: 'Mother', startDate: '2026-02-01', notes: 'Active - Schedule 8 PM. Calcium supplement.' },
  { name: \`\${DEMO_TAG} Medicine C\`, dosage: '1 capsule', timing: '10:00 AM', frequency: 'Daily', personName: 'Sarah', startDate: '2026-03-01', notes: 'Active - Schedule 10 AM. Multivitamin.' },
  { name: \`\${DEMO_TAG} Medicine D\`, dosage: '1 capsule', timing: '07:00 PM', frequency: 'Daily', personName: 'Sarah', startDate: '2026-03-01', notes: 'Active - Schedule 7 PM. Omega-3 supplement.' },
  { name: \`\${DEMO_TAG} Medicine E\`, dosage: '1 tablet', timing: '01:00 PM', frequency: 'Daily', personName: 'Father', startDate: '2026-04-01', notes: 'Active - Schedule 1 PM. Digestive enzyme.' },
  { name: \`\${DEMO_TAG} Medicine F\`, dosage: '250mg capsule', timing: '01:00 PM', frequency: 'As Needed', personName: 'Mother', startDate: '2026-01-01', notes: 'Inactive - Schedule 1 PM. Course finished.' },
  { name: \`\${DEMO_TAG} Medicine G\`, dosage: '500mg tablet', timing: 'As needed', frequency: 'As Needed', personName: 'Sarah', startDate: '2026-01-01', notes: 'Inactive - As-needed sample record. Mild headache relief.' },
  { name: \`\${DEMO_TAG} Medicine H\`, dosage: '1 tablet', timing: '06:00 PM', frequency: 'Daily', personName: 'Father', startDate: '2026-04-01', notes: 'Active - Schedule 6 PM. Evening BP maintenance.' }
];

// Module 5: Expense & Bill Intelligence (14 Expenses + 6 Bills)
export const RAW_DEMO_EXPENSES: Array<Omit<ExpenseItem, 'id'>> = [
  { title: \`\${DEMO_TAG} Grocery Shopping\`, amount: 2500, category: 'Groceries', date: '2026-11-02', payer: 'Sarah', description: 'Monthly grocery purchase at Nilgiris' },
  { title: \`\${DEMO_TAG} Electricity Bill\`, amount: 3450, category: 'Utilities', date: '2026-11-05', payer: 'Sarah', description: 'Electricity bill utility payment' },
  { title: \`\${DEMO_TAG} Water Bill\`, amount: 850, category: 'Utilities', date: '2026-11-06', payer: 'Sarah', description: 'Metro water utility payment' },
  { title: \`\${DEMO_TAG} Internet Bill\`, amount: 999, category: 'Utilities', date: '2026-11-07', payer: 'Sarah', description: 'Airtel high-speed fiber internet' },
  { title: \`\${DEMO_TAG} Fuel Expense\`, amount: 2000, category: 'Maintenance', date: '2026-11-09', payer: 'Father', description: 'Petrol fuel for family car' },
  { title: \`\${DEMO_TAG} Medical Expense\`, amount: 1500, category: 'Healthcare', date: '2026-11-10', payer: 'Mother', description: 'Pharmacy medicines and clinic visit' },
  { title: \`\${DEMO_TAG} Vegetable Shopping\`, amount: 750, category: 'Groceries', date: '2026-11-11', payer: 'Mother', description: 'Fresh weekly vegetables' },
  { title: \`\${DEMO_TAG} School Fees\`, amount: 5000, category: 'Education', date: '2026-11-12', payer: 'Father', description: 'Term school fees for Sham' },
  { title: \`\${DEMO_TAG} Household Supplies\`, amount: 1200, category: 'Utilities', date: '2026-11-13', payer: 'Sarah', description: 'Cleaning supplies and toiletries' },
  { title: \`\${DEMO_TAG} Family Entertainment\`, amount: 1000, category: 'Dining', date: '2026-11-14', payer: 'Sarah', description: 'Weekend movie and entertainment' },
  { title: \`\${DEMO_TAG} Mobile Recharge\`, amount: 599, category: 'Utilities', date: '2026-11-14', payer: 'Sarah', description: 'Quarterly mobile recharge' },
  { title: \`\${DEMO_TAG} Restaurant Dinner`, amount: 1100, category: 'Dining', date: '2026-11-14', payer: 'Father', description: 'Family weekend dinner' },
  { title: \`\${DEMO_TAG} Transportation\`, amount: 650, category: 'Maintenance', date: '2026-11-15', payer: 'Sarah', description: 'Local cab and transport' },
  { title: \`\${DEMO_TAG} Clothing Purchase\`, amount: 2200, category: 'Shopping', date: '2026-11-16', payer: 'Sarah', description: 'Winter festival clothing shopping' }
];

export const RAW_DEMO_BILLS: Array<Omit<BillItem, 'id'>> = [
  { title: \`\${DEMO_TAG} Electricity Bill\`, amount: 3450, dueDate: '2026-11-25', category: 'Utilities', isPaid: false, recurring: 'Monthly' },
  { title: \`\${DEMO_TAG} Water Bill\`, amount: 850, dueDate: '2026-11-20', category: 'Utilities', isPaid: false, recurring: 'Monthly' },
  { title: \`\${DEMO_TAG} Internet Bill\`, amount: 999, dueDate: '2026-11-18', category: 'Utilities', isPaid: true, paidDate: '2026-11-18', paidBy: 'Sarah', recurring: 'Monthly' },
  { title: \`\${DEMO_TAG} Mobile Recharge Bill\`, amount: 599, dueDate: '2026-11-30', category: 'Utilities', isPaid: true, paidDate: '2026-11-14', paidBy: 'Sarah', recurring: 'Monthly' },
  { title: \`\${DEMO_TAG} Insurance Premium\`, amount: 4500, dueDate: '2026-12-05', category: 'Healthcare', isPaid: false, recurring: 'Monthly' },
  { title: \`\${DEMO_TAG} School Fee Bill\`, amount: 5000, dueDate: '2026-11-12', category: 'Education', isPaid: true, paidDate: '2026-11-12', paidBy: 'Father', recurring: 'Monthly' }
];

// Module 6: Family Knowledge (20 records)
export const RAW_DEMO_KNOWLEDGE: Array<Omit<FamilyKnowledge, 'id'>> = [
  { title: \`\${DEMO_TAG} Father Profile\`, category: 'General', importance: 'Important', relatedMemberName: 'Father', createdDate: '2026-11-14', content: 'Name: Demo Father (Rajesh Kumar), Age: 52, Profession: Executive, Health: Normal BP' },
  { title: \`\${DEMO_TAG} Mother Profile\`, category: 'General', importance: 'Important', relatedMemberName: 'Mother', createdDate: '2026-11-14', content: 'Name: Demo Mother (Priya Kumar), Age: 49, Profession: Teacher, Health: Diabetic diet management' },
  { title: \`\${DEMO_TAG} Sarah Profile\`, category: 'General', importance: 'Important', relatedMemberName: 'Sarah', createdDate: '2026-11-14', content: 'Name: Demo Sarah (Sarah Kumar), Age: 24, Profession: Software Engineer, Role: Admin' },
  { title: \`\${DEMO_TAG} Sneha Profile\`, category: 'General', importance: 'Important', relatedMemberName: 'Sneha', createdDate: '2026-11-14', content: 'Name: Demo Sneha (Sneha Kumar), Age: 19, Student: Medical College, Lactose Intolerant' },
  { title: \`\${DEMO_TAG} Father's Birthday\`, category: 'Schedules', importance: 'Critical', relatedMemberName: 'Father', createdDate: '2026-11-14', content: "Father's Birthday is on November 15" },
  { title: \`\${DEMO_TAG} Mother's Birthday\`, category: 'Schedules', importance: 'Critical', relatedMemberName: 'Mother', createdDate: '2026-11-14', content: "Mother's Birthday is on December 10" },
  { title: \`\${DEMO_TAG} Sarah's Birthday\`, category: 'Schedules', importance: 'Critical', relatedMemberName: 'Sarah', createdDate: '2026-11-14', content: "Sarah's Birthday is on November 22" },
  { title: \`\${DEMO_TAG} Sneha's Birthday\`, category: 'Schedules', importance: 'Critical', relatedMemberName: 'Sneha', createdDate: '2026-11-14', content: "Sneha's Birthday is on January 12" },
  { title: \`\${DEMO_TAG} Sarah Food Preference\`, category: 'Preferences', importance: 'Important', relatedMemberName: 'Sarah', createdDate: '2026-11-14', content: 'Sarah prefers vegetarian food and light dinners' },
  { title: \`\${DEMO_TAG} Father's Food Preference\`, category: 'Preferences', importance: 'Important', relatedMemberName: 'Father', createdDate: '2026-11-14', content: 'Father prefers traditional home-cooked South Indian meals' },
  { title: \`\${DEMO_TAG} Mother's Food Preference\`, category: 'Preferences', importance: 'Important', relatedMemberName: 'Mother', createdDate: '2026-11-14', content: 'Mother prefers vegetarian meals with low sugar/salt' },
  { title: \`\${DEMO_TAG} Sneha Food Preference\`, category: 'Preferences', importance: 'Critical', relatedMemberName: 'Sneha', createdDate: '2026-11-14', content: 'Sneha is lactose intolerant and requires dairy-free alternatives (almond milk, soy)' },
  { title: \`\${DEMO_TAG} Family Gathering Preference\`, category: 'Preferences', importance: 'Important', relatedMemberName: 'Sarah', createdDate: '2026-11-14', content: 'The family prefers weekend gatherings on Friday or Saturday evenings' },
  { title: \`\${DEMO_TAG} Grocery Shopping Preference\`, category: 'Schedules', importance: 'Important', relatedMemberName: 'Mother', createdDate: '2026-11-14', content: 'Weekly grocery shopping is done on Sunday mornings' },
  { title: \`\${DEMO_TAG} Monthly Family Meeting\`, category: 'Schedules', importance: 'Important', relatedMemberName: 'Father', createdDate: '2026-11-14', content: 'Monthly family meeting is held on the last Sunday of every month at 6 PM' },
  { title: \`\${DEMO_TAG} Family Emergency Contact\`, category: 'Emergency', importance: 'Critical', relatedMemberName: 'Father', createdDate: '2026-11-14', content: 'Primary emergency contact: Apollo Clinic Anna Nagar 044-28290200, Dr. Sharma +91 98400 12345' },
  { title: \`\${DEMO_TAG} Family Address\`, category: 'General', importance: 'Important', relatedMemberName: 'Father', createdDate: '2026-11-14', content: '42 Palm Grove Avenue, Anna Nagar West, Chennai 600040, Tamil Nadu, India' },
  { title: \`\${DEMO_TAG} Family Trip Preference\`, category: 'Preferences', importance: 'Important', relatedMemberName: 'Father', createdDate: '2026-11-14', content: 'Family enjoys weekend trips and heritage destinations within driving distance' },
  { title: \`\${DEMO_TAG} Family Anniversary\`, category: 'Schedules', importance: 'Critical', relatedMemberName: 'Father', createdDate: '2026-11-14', content: 'Parents wedding anniversary is celebrated on November 27' },
  { title: \`\${DEMO_TAG} Household Note\`, category: 'General', importance: 'Important', relatedMemberName: 'Sarah', createdDate: '2026-11-14', content: 'Monthly household planning: Review expenses and bills in the first week of every month' }
];

export const seedDemoFamilyData = async (familyId: string, currentUserEmail: string): Promise<{ success: boolean; seededCounts: Record<string, number> }> => {
  const counts: Record<string, number> = {
    members: 0,
    events: 0,
    medicines: 0,
    medicineLogs: 0,
    expenses: 0,
    bills: 0,
    groceries: 0,
    documents: 0,
    memories: 0,
    knowledge: 0,
    contacts: 0,
    reminders: 0
  };

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

  // 2. Seed Events (12)
  for (const ev of RAW_DEMO_EVENTS) {
    try {
      await insertRow('events', familyId, ev);
      counts.events += 1;
    } catch (e) {
      console.warn('Event seed skip:', ev.title, e);
    }
  }

  // 3. Seed Documents (12)
  for (const doc of RAW_DEMO_DOCUMENTS) {
    try {
      await insertRow('documents', familyId, doc);
      counts.documents += 1;
    } catch (e) {
      console.warn('Document seed skip:', doc.title, e);
    }
  }

  // 4. Seed Groceries (20)
  for (const g of RAW_DEMO_GROCERIES) {
    try {
      await insertRow('groceries', familyId, g);
      counts.groceries += 1;
    } catch (e) {
      console.warn('Grocery seed skip:', g.name, e);
    }
  }

  // 5. Seed Medicines (10)
  for (const m of RAW_DEMO_MEDICINES) {
    try {
      const savedMed = await insertRow<Omit<MedicineItem, 'id'>>('medicines', familyId, m) as MedicineItem;
      counts.medicines += 1;
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

  // 6. Seed Expenses (14)
  for (const ex of RAW_DEMO_EXPENSES) {
    try {
      await insertRow('expenses', familyId, ex);
      counts.expenses += 1;
    } catch (e) {
      console.warn('Expense seed skip:', ex.title, e);
    }
  }

  // 7. Seed Bills (6)
  for (const b of RAW_DEMO_BILLS) {
    try {
      await insertRow('bills', familyId, b);
      counts.bills += 1;
    } catch (e) {
      console.warn('Bill seed skip:', b.title, e);
    }
  }

  // 8. Seed Knowledge (20)
  for (const k of RAW_DEMO_KNOWLEDGE) {
    try {
      await insertRow('family_knowledge', familyId, k);
      counts.knowledge += 1;
    } catch (e) {
      console.warn('Knowledge seed skip:', k.title, e);
    }
  }

  // 9. Seed Memories
  const demoMemories: Array<Omit<FamilyMemory, 'id'>> = EXAMPLE_PLACE_MEMORIES.map(m => ({
    title: \`\${DEMO_TAG} \${m.title}\`,
    year: m.year,
    date: m.date,
    description: m.description,
    photoUrl: m.photoUrl,
    location: m.location,
    addedBy: m.addedBy,
    photoUrls: m.photoUrls,
    taggedMembers: m.taggedMembers,
    tags: m.tags,
    album: m.album
  }));
  for (const mem of demoMemories) {
    try {
      await insertRow('family_memories', familyId, mem);
      counts.memories += 1;
    } catch (e) {
      console.warn('Memory seed skip:', mem.title, e);
    }
  }

  // 10. Seed Emergency Contacts
  const demoContacts: Array<Omit<EmergencyContact, 'id'>> = [
    {
      name: \`\${DEMO_TAG} Dr. K. Sharma (Family Physician)\`,
      relation: 'Doctor',
      phone: '+91 98400 12345',
      email: 'dr.sharma.demo@apollohospitals.test',
      isPrimary: true
    },
    {
      name: \`\${DEMO_TAG} Uncle Vikram (Father's Brother)\`,
      relation: 'Uncle',
      phone: '+91 94440 98765',
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

  // 11. Seed Reminders
  const demoReminders: Array<Omit<ReminderItem, 'id'>> = [
    {
      title: \`\${DEMO_TAG} Pay BESCOM Electricity Bill before due date\`,
      category: 'Bill',
      dateTime: '2026-11-25 09:00',
      priority: 'High',
      completed: false,
      assignedMemberName: 'Sarah'
    },
    {
      title: \`\${DEMO_TAG} Pick up Mother's medication refill\`,
      category: 'Medicine',
      dateTime: '2026-11-17 18:00',
      priority: 'High',
      completed: false,
      assignedMemberName: 'Father'
    },
    {
      title: \`\${DEMO_TAG} Prepare for Father's birthday celebration\`,
      category: 'Birthday',
      dateTime: '2026-11-15 17:00',
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
        console.warn(\`Failed removing demo item from \${table}:\`, e);
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
  const familyMembers: FamilyMember[] = DEMO_FAMILY_MEMBERS.map((m, idx) => ({
    ...m,
    id: \`00000000-0000-4000-8000-\${String(idx + 1).padStart(12, '0')}\`
  }));

  const events: FamilyEvent[] = RAW_DEMO_EVENTS.map((e, idx) => ({
    ...e,
    id: \`00000000-0000-4000-8000-\${String(idx + 11).padStart(12, '0')}\`
  }));

  const documents: DocumentItem[] = RAW_DEMO_DOCUMENTS.map((d, idx) => ({
    ...d,
    id: \`00000000-0000-4000-8000-\${String(idx + 31).padStart(12, '0')}\`
  }));

  const groceries: GroceryItem[] = RAW_DEMO_GROCERIES.map((g, idx) => ({
    ...g,
    id: \`00000000-0000-4000-8000-\${String(idx + 51).padStart(12, '0')}\`
  }));

  const medicines: MedicineItem[] = RAW_DEMO_MEDICINES.map((m, idx) => ({
    ...m,
    id: \`00000000-0000-4000-8000-\${String(idx + 71).padStart(12, '0')}\`
  }));

  const expenses: ExpenseItem[] = RAW_DEMO_EXPENSES.map((ex, idx) => ({
    ...ex,
    id: \`00000000-0000-4000-8000-\${String(idx + 91).padStart(12, '0')}\`
  }));

  const bills: BillItem[] = RAW_DEMO_BILLS.map((b, idx) => ({
    ...b,
    id: \`00000000-0000-4000-8000-\${String(idx + 111).padStart(12, '0')}\`
  }));

  const knowledgeList: FamilyKnowledge[] = RAW_DEMO_KNOWLEDGE.map((k, idx) => ({
    ...k,
    id: \`00000000-0000-4000-8000-\${String(idx + 131).padStart(12, '0')}\`,
    createdDate: '2026-11-14'
  }));

  const reminders: ReminderItem[] = [
    {
      id: '00000000-0000-4000-8000-000000000161',
      title: \`\${DEMO_TAG} Pay BESCOM Electricity Bill before due date\`,
      category: 'Bill',
      dateTime: '2026-11-25 09:00',
      priority: 'High',
      completed: false,
      assignedMemberName: 'Sarah'
    },
    {
      id: '00000000-0000-4000-8000-000000000162',
      title: \`\${DEMO_TAG} Pick up Mother's medication refill\`,
      category: 'Medicine',
      dateTime: '2026-11-17 18:00',
      priority: 'High',
      completed: false,
      assignedMemberName: 'Father'
    },
    {
      id: '00000000-0000-4000-8000-000000000163',
      title: \`\${DEMO_TAG} Prepare for Father's birthday celebration\`,
      category: 'Birthday',
      dateTime: '2026-11-15 17:00',
      priority: 'Medium',
      completed: false,
      assignedMemberName: 'Sarah'
    }
  ];

  const medicineLogs: MedicineLog[] = [
    {
      id: '00000000-0000-4000-8000-000000000171',
      medicineId: '00000000-0000-4000-8000-000000000071',
      medicineName: 'Medicine A',
      personName: 'Father',
      status: 'Taken',
      timestamp: new Date().toISOString(),
      loggedBy: 'Father'
    },
    {
      id: '00000000-0000-4000-8000-000000000172',
      medicineId: '00000000-0000-4000-8000-000000000072',
      medicineName: 'Medicine B',
      personName: 'Father',
      status: 'Taken',
      timestamp: new Date().toISOString(),
      loggedBy: 'Father'
    }
  ];

  const groceryHistory: GroceryHistoryItem[] = [
    {
      id: '00000000-0000-4000-8000-000000000181',
      groceryId: '00000000-0000-4000-8000-000000000057',
      name: 'Potatoes (2 kg)',
      category: 'Produce',
      purchasedBy: 'Mother',
      purchasedAt: '2026-11-13T10:00:00Z'
    },
    {
      id: '00000000-0000-4000-8000-000000000182',
      groceryId: '00000000-0000-4000-8000-000000000062',
      name: 'Bread (2 packets)',
      category: 'Bakery',
      purchasedBy: 'Sarah',
      purchasedAt: '2026-11-13T08:30:00Z'
    }
  ];

  const memories: FamilyMemory[] = EXAMPLE_PLACE_MEMORIES.map(m => ({
    ...m,
    title: \`\${DEMO_TAG} \${m.title}\`
  }));

  const emergencyContacts: EmergencyContact[] = [
    {
      id: '00000000-0000-4000-8000-000000000191',
      name: \`\${DEMO_TAG} Dr. K. Sharma (Family Physician)\`,
      relation: 'Doctor',
      phone: '+91 98400 12345',
      email: 'dr.sharma.demo@apollohospitals.test',
      isPrimary: true
    },
    {
      id: '00000000-0000-4000-8000-000000000192',
      name: \`\${DEMO_TAG} Uncle Vikram (Father's Brother)\`,
      relation: 'Uncle',
      phone: '+91 94440 98765',
      email: 'vikram.demo@homebrain.test',
      isPrimary: false
    }
  ];

  const emergencyLogs: EmergencyAlertLog[] = [
    {
      id: '00000000-0000-4000-8000-000000000201',
      timestamp: new Date().toISOString(),
      userLocation: '42 Palm Grove Avenue, Anna Nagar West, Chennai 600040, Tamil Nadu, India',
      latitude: 13.0850,
      longitude: 80.2100,
      accuracyMeters: 10,
      userName: 'Sarah',
      status: 'Logged',
      recipients: [\`Dr. Sharma (+91 98400 12345)\`, \`Uncle Vikram (+91 94440 98765)\`]
    }
  ];

  return {
    currentUser: {
      id: '00000000-0000-4000-8000-000000000003',
      familyId: '00000000-0000-4000-8000-000000000000',
      familyName: 'Family Household',
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
`;

fs.writeFileSync(demoDataPath, demoCode, 'utf8');
console.log('src/lib/demoData.ts successfully updated with all 6 modules demo data!');

// Now update server/index.ts fallback arrays
let serverSrc = fs.readFileSync(serverIndexPath, 'utf8');

const updatedInitialFallbacks = `// --- Shared Module-Scoped In-Memory State for Demo Evaluation ---
const initialFallbackEvents = [
  { id: '00000000-0000-4000-8000-000000000011', title: "[DEMO] Father's Birthday", date: '2026-11-15', time: '19:00', category: 'Birthday', members_involved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'], description: "Father's 52nd birthday dinner celebration", reminder: true, recurring: 'Yearly' },
  { id: '00000000-0000-4000-8000-000000000012', title: "[DEMO] Family Dinner", date: '2026-11-16', time: '20:00', category: 'General', members_involved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'], description: 'Family dinner gathering at home', reminder: true, recurring: 'None' },
  { id: '00000000-0000-4000-8000-000000000013', title: "[DEMO] Doctor Appointment", date: '2026-11-17', time: '10:00', category: 'Appointment', members_involved: ['Mother', 'Sarah'], description: 'Routine health checkup consultation with Dr. Sharma', reminder: true, recurring: 'None' },
  { id: '00000000-0000-4000-8000-000000000014', title: "[DEMO] Grocery Shopping", date: '2026-11-18', time: '18:00', category: 'General', members_involved: ['Sarah'], description: 'Weekly grocery shopping at supermarket', reminder: true, recurring: 'Weekly' },
  { id: '00000000-0000-4000-8000-000000000015', title: "[DEMO] Family Meeting", date: '2026-11-20', time: '18:00', category: 'General', members_involved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'], description: 'Bi-weekly household planning discussion', reminder: true, recurring: 'None' },
  { id: '00000000-0000-4000-8000-000000000016', title: "[DEMO] Sarah's Birthday", date: '2026-11-22', time: '19:00', category: 'Birthday', members_involved: ['Sarah', 'Father', 'Mother', 'Sneha', 'Sham'], description: "Sarah's birthday party and family gathering", reminder: true, recurring: 'Yearly' },
  { id: '00000000-0000-4000-8000-000000000017', title: "[DEMO] Temple Visit", date: '2026-11-23', time: '08:00', category: 'Holiday', members_involved: ['Father', 'Mother', 'Sarah'], description: 'Special morning prayer and temple darshan', reminder: true, recurring: 'None' },
  { id: '00000000-0000-4000-8000-000000000018', title: "[DEMO] Electricity Bill Reminder", date: '2026-11-25', time: '09:00', category: 'Bill', members_involved: ['Sarah'], description: 'Reminder to pay BESCOM electricity bill ₹3,450', reminder: true, recurring: 'Monthly' },
  { id: '00000000-0000-4000-8000-000000000019', title: "[DEMO] Parents Anniversary", date: '2026-11-27', time: '19:00', category: 'Holiday', members_involved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'], description: 'Parents 26th wedding anniversary dinner', reminder: true, recurring: 'Yearly' },
  { id: '00000000-0000-4000-8000-000000000020', title: "[DEMO] Family Trip", date: '2026-11-28', time: '09:00', category: 'Holiday', members_involved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'], description: 'Weekend family trip to Mahabalipuram', reminder: true, recurring: 'None' },
  { id: '00000000-0000-4000-8000-000000000021', title: "[DEMO] Monthly Family Meeting", date: '2026-11-29', time: '18:00', category: 'General', members_involved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'], description: 'Monthly family finance and schedule review', reminder: true, recurring: 'Monthly' },
  { id: '00000000-0000-4000-8000-000000000022', title: "[DEMO] Dentist Appointment", date: '2026-12-02', time: '11:00', category: 'Appointment', members_involved: ['Sham', 'Mother'], description: 'Dental checkup and cleaning at City Dental Care', reminder: true, recurring: 'None' }
];

const initialFallbackGroceries = [
  { id: '00000000-0000-4000-8000-000000000051', name: '[DEMO] Basmati Rice', quantity: '10 kg', category: 'Pantry', is_purchased: false, estimated_price: 950 },
  { id: '00000000-0000-4000-8000-000000000052', name: '[DEMO] Cow Milk', quantity: '2 litres', category: 'Dairy', is_purchased: false, estimated_price: 110 },
  { id: '00000000-0000-4000-8000-000000000053', name: '[DEMO] Eggs', quantity: '30 pieces', category: 'Dairy', is_purchased: false, estimated_price: 195 },
  { id: '00000000-0000-4000-8000-000000000054', name: '[DEMO] Wheat Flour', quantity: '5 kg', category: 'Pantry', is_purchased: false, estimated_price: 240 },
  { id: '00000000-0000-4000-8000-000000000055', name: '[DEMO] Tomatoes', quantity: '2 kg', category: 'Produce', is_purchased: false, estimated_price: 80 },
  { id: '00000000-0000-4000-8000-000000000056', name: '[DEMO] Onions', quantity: '3 kg', category: 'Produce', is_purchased: false, estimated_price: 120 },
  { id: '00000000-0000-4000-8000-000000000057', name: '[DEMO] Potatoes', quantity: '2 kg', category: 'Produce', is_purchased: true, estimated_price: 70 },
  { id: '00000000-0000-4000-8000-000000000058', name: '[DEMO] Cooking Oil', quantity: '5 litres', category: 'Pantry', is_purchased: false, estimated_price: 750 },
  { id: '00000000-0000-4000-8000-000000000059', name: '[DEMO] Sugar', quantity: '2 kg', category: 'Pantry', is_purchased: false, estimated_price: 90 },
  { id: '00000000-0000-4000-8000-000000000060', name: '[DEMO] Toor Dal', quantity: '2 kg', category: 'Pantry', is_purchased: false, estimated_price: 280 },
  { id: '00000000-0000-4000-8000-000000000061', name: '[DEMO] Almonds', quantity: '500 g', category: 'Pantry', is_purchased: false, estimated_price: 450 },
  { id: '00000000-0000-4000-8000-000000000062', name: '[DEMO] Bread', quantity: '2 packets', category: 'Bakery', is_purchased: true, estimated_price: 90 },
  { id: '00000000-0000-4000-8000-000000000063', name: '[DEMO] Apples', quantity: '2 kg', category: 'Produce', is_purchased: false, estimated_price: 320 },
  { id: '00000000-0000-4000-8000-000000000064', name: '[DEMO] Bananas', quantity: '2 dozen', category: 'Produce', is_purchased: false, estimated_price: 120 },
  { id: '00000000-0000-4000-8000-000000000065', name: '[DEMO] Dishwashing Liquid', quantity: '2 bottles', category: 'Household', is_purchased: false, estimated_price: 180 },
  { id: '00000000-0000-4000-8000-000000000066', name: '[DEMO] Detergent', quantity: '3 kg', category: 'Household', is_purchased: false, estimated_price: 360 },
  { id: '00000000-0000-4000-8000-000000000067', name: '[DEMO] Bath Soap', quantity: '6 bars', category: 'Household', is_purchased: false, estimated_price: 240 },
  { id: '00000000-0000-4000-8000-000000000068', name: '[DEMO] Coffee Powder', quantity: '500 g', category: 'Beverages', is_purchased: false, estimated_price: 350 },
  { id: '00000000-0000-4000-8000-000000000069', name: '[DEMO] Carrots', quantity: '1 kg', category: 'Produce', is_purchased: false, estimated_price: 60 },
  { id: '00000000-0000-4000-8000-000000000070', name: '[DEMO] Toothpaste', quantity: '2 tubes', category: 'Household', is_purchased: false, estimated_price: 180 }
];

const initialFallbackMedicines = [
  { id: '00000000-0000-4000-8000-000000000071', name: '[DEMO] Medicine A', dosage: '5mg tablet', timing: '08:00 AM', frequency: 'Daily', person_name: 'Father', status: 'Active', notes: 'Schedule 8 AM. Take after breakfast with water.' },
  { id: '00000000-0000-4000-8000-000000000072', name: '[DEMO] Medicine B', dosage: '10mg tablet', timing: '09:00 PM', frequency: 'Daily', person_name: 'Father', status: 'Active', notes: 'Schedule 9 PM. Take after dinner.' },
  { id: '00000000-0000-4000-8000-000000000073', name: '[DEMO] Supplement A', dosage: '1 tablet', timing: '09:00 AM', frequency: 'Daily', person_name: 'Mother', status: 'Active', notes: 'Schedule 9 AM. Vitamin D3 supplement.' },
  { id: '00000000-0000-4000-8000-000000000074', name: '[DEMO] Supplement B', dosage: '1 tablet', timing: '08:00 PM', frequency: 'Daily', person_name: 'Mother', status: 'Active', notes: 'Schedule 8 PM. Calcium supplement.' },
  { id: '00000000-0000-4000-8000-000000000075', name: '[DEMO] Medicine C', dosage: '1 capsule', timing: '10:00 AM', frequency: 'Daily', person_name: 'Sarah', status: 'Active', notes: 'Schedule 10 AM. Multivitamin.' },
  { id: '00000000-0000-4000-8000-000000000076', name: '[DEMO] Medicine D', dosage: '1 capsule', timing: '07:00 PM', frequency: 'Daily', person_name: 'Sarah', status: 'Active', notes: 'Schedule 7 PM. Omega-3 supplement.' },
  { id: '00000000-0000-4000-8000-000000000077', name: '[DEMO] Medicine E', dosage: '1 tablet', timing: '01:00 PM', frequency: 'Daily', person_name: 'Father', status: 'Active', notes: 'Schedule 1 PM. Digestive enzyme.' },
  { id: '00000000-0000-4000-8000-000000000078', name: '[DEMO] Medicine F', dosage: '250mg capsule', timing: '01:00 PM', frequency: 'As Needed', person_name: 'Mother', status: 'Inactive', notes: 'Schedule 1 PM. Course finished.' },
  { id: '00000000-0000-4000-8000-000000000079', name: '[DEMO] Medicine G', dosage: '500mg tablet', timing: 'As needed', frequency: 'As Needed', person_name: 'Sarah', status: 'Inactive', notes: 'As-needed sample record. Mild headache relief.' },
  { id: '00000000-0000-4000-8000-000000000080', name: '[DEMO] Medicine H', dosage: '1 tablet', timing: '06:00 PM', frequency: 'Daily', person_name: 'Father', status: 'Active', notes: 'Schedule 6 PM. Evening BP maintenance.' }
];

const initialFallbackBills = [
  { id: '00000000-0000-4000-8000-000000000111', title: '[DEMO] Electricity Bill', amount: 3450, due_date: '2026-11-25', is_paid: false, category: 'Utilities' },
  { id: '00000000-0000-4000-8000-000000000112', title: '[DEMO] Water Bill', amount: 850, due_date: '2026-11-20', is_paid: false, category: 'Utilities' },
  { id: '00000000-0000-4000-8000-000000000113', title: '[DEMO] Internet Bill', amount: 999, due_date: '2026-11-18', is_paid: true, paid_date: '2026-11-18', paid_by: 'Sarah', category: 'Utilities' },
  { id: '00000000-0000-4000-8000-000000000114', title: '[DEMO] Mobile Recharge Bill', amount: 599, due_date: '2026-11-30', is_paid: true, paid_date: '2026-11-14', paid_by: 'Sarah', category: 'Utilities' },
  { id: '00000000-0000-4000-8000-000000000115', title: '[DEMO] Insurance Premium', amount: 4500, due_date: '2026-12-05', is_paid: false, category: 'Healthcare' },
  { id: '00000000-0000-4000-8000-000000000116', title: '[DEMO] School Fee Bill', amount: 5000, due_date: '2026-11-12', is_paid: true, paid_date: '2026-11-12', paid_by: 'Father', category: 'Education' }
];

const initialFallbackExpenses: any[] = [
  { id: '00000000-0000-4000-8000-000000000091', title: '[DEMO] Grocery Shopping', amount: 2500, category: 'Groceries', date: '2026-11-02', payer: 'Sarah', description: 'Monthly grocery purchase at Nilgiris' },
  { id: '00000000-0000-4000-8000-000000000092', title: '[DEMO] Electricity Bill', amount: 3450, category: 'Utilities', date: '2026-11-05', payer: 'Sarah', description: 'Electricity bill utility payment' },
  { id: '00000000-0000-4000-8000-000000000093', title: '[DEMO] Water Bill', amount: 850, category: 'Utilities', date: '2026-11-06', payer: 'Sarah', description: 'Metro water utility payment' },
  { id: '00000000-0000-4000-8000-000000000094', title: '[DEMO] Internet Bill', amount: 999, category: 'Utilities', date: '2026-11-07', payer: 'Sarah', description: 'Airtel high-speed fiber internet' },
  { id: '00000000-0000-4000-8000-000000000095', title: '[DEMO] Fuel Expense', amount: 2000, category: 'Maintenance', date: '2026-11-09', payer: 'Father', description: 'Petrol fuel for family car' },
  { id: '00000000-0000-4000-8000-000000000096', title: '[DEMO] Medical Expense', amount: 1500, category: 'Healthcare', date: '2026-11-10', payer: 'Mother', description: 'Pharmacy medicines and clinic visit' },
  { id: '00000000-0000-4000-8000-000000000097', title: '[DEMO] Vegetable Shopping', amount: 750, category: 'Groceries', date: '2026-11-11', payer: 'Mother', description: 'Fresh weekly vegetables' },
  { id: '00000000-0000-4000-8000-000000000098', title: '[DEMO] School Fees', amount: 5000, category: 'Education', date: '2026-11-12', payer: 'Father', description: 'Term school fees for Sham' },
  { id: '00000000-0000-4000-8000-000000000099', title: '[DEMO] Household Supplies', amount: 1200, category: 'Utilities', date: '2026-11-13', payer: 'Sarah', description: 'Cleaning supplies and toiletries' },
  { id: '00000000-0000-4000-8000-000000000100', title: '[DEMO] Family Entertainment', amount: 1000, category: 'Dining', date: '2026-11-14', payer: 'Sarah', description: 'Weekend movie and entertainment' },
  { id: '00000000-0000-4000-8000-000000000101', title: '[DEMO] Mobile Recharge', amount: 599, category: 'Utilities', date: '2026-11-14', payer: 'Sarah', description: 'Quarterly mobile recharge' },
  { id: '00000000-0000-4000-8000-000000000102', title: '[DEMO] Restaurant Dinner', amount: 1100, category: 'Dining', date: '2026-11-14', payer: 'Father', description: 'Family weekend dinner' },
  { id: '00000000-0000-4000-8000-000000000103', title: '[DEMO] Transportation', amount: 650, category: 'Maintenance', date: '2026-11-15', payer: 'Sarah', description: 'Local cab and transport' },
  { id: '00000000-0000-4000-8000-000000000104', title: '[DEMO] Clothing Purchase', amount: 2200, category: 'Shopping', date: '2026-11-16', payer: 'Sarah', description: 'Winter festival clothing shopping' }
];

const initialFallbackDocuments = [
  { id: '00000000-0000-4000-8000-000000000031', title: "[DEMO] Father's Passport", category: 'Identity', file_type: 'TXT', file_size: '434 B', uploader_name: 'Sarah', upload_date: '2026-01-10', expiry_date: '2034-06-14', file_url: '/demo-documents/Father_Passport.txt', description: 'Official Republic of India Passport for Demo Father (Rajesh Kumar). Document No: Z9876543.', summary_content: '• Republic of India Passport\\n• Passport No: Z9876543\\n• Holder: Rajesh Kumar (Father)\\n• DOB: 15/06/1974\\n• Place of Issue: Chennai\\n• Expiry Date: 14/06/2034' },
  { id: '00000000-0000-4000-8000-000000000032', title: "[DEMO] Mother's Aadhaar Sample", category: 'Identity', file_type: 'TXT', file_size: '417 B', uploader_name: 'Sarah', upload_date: '2026-01-15', file_url: '/demo-documents/Mother_Aadhaar_Sample.txt', description: 'Official Aadhaar Card record for Demo Mother (Priya Kumar). Fictional demo identity.', summary_content: '• Government of India Aadhaar Card\\n• Number: 0000 1111 2222 (Fictional Demo)\\n• Holder: Priya Kumar (Mother)\\n• DOB: 22/09/1977\\n• Address: 42 Palm Grove Avenue, Anna Nagar, Chennai 600040' },
  { id: '00000000-0000-4000-8000-000000000033', title: '[DEMO] Family Address Proof', category: 'Identity', file_type: 'TXT', file_size: '429 B', uploader_name: 'Father', upload_date: '2026-02-01', file_url: '/demo-documents/Family_Address_Proof.txt', description: 'Greater Chennai Corporation Residential Address Certificate for household residence.', summary_content: '• Residential Address Certificate\\n• Head of Household: Rajesh Kumar\\n• Address: 42 Palm Grove Avenue, Anna Nagar West Extension, Chennai 600040\\n• EB Connection: EB-CHN-88219\\n• Water Account: CMW-44021' },
  { id: '00000000-0000-4000-8000-000000000034', title: '[DEMO] Electricity Bill November', category: 'Financial', file_type: 'TXT', file_size: '333 B', uploader_name: 'Sarah', upload_date: '2026-11-05', file_url: '/demo-documents/Electricity_Bill_November.txt', description: 'Household Electricity Bill for November 2026. Amount: ₹3,450 due Nov 25, 2026.', summary_content: '• Billing Month: November 2026\\n• Consumer: Demo Household\\n• Amount: ₹3,450\\n• Due Date: November 25, 2026\\n• Status: Unpaid\\n• Units: 420 kWh' },
  { id: '00000000-0000-4000-8000-000000000035', title: '[DEMO] Water Bill November', category: 'Financial', file_type: 'TXT', file_size: '392 B', uploader_name: 'Sarah', upload_date: '2026-11-06', file_url: '/demo-documents/Water_Bill_November.txt', description: 'Chennai Metro Water Supply Bill for November 2026. Amount: ₹850 due Nov 20, 2026.', summary_content: '• Water Supply Bill - November 2026\\n• Consumer: Demo Household\\n• Amount: ₹850\\n• Due Date: November 20, 2026\\n• Status: Unpaid' },
  { id: '00000000-0000-4000-8000-000000000036', title: '[DEMO] Hospital Appointment Report', category: 'Medical', file_type: 'TXT', file_size: '545 B', uploader_name: 'Mother', upload_date: '2026-11-17', file_url: '/demo-documents/Hospital_Appointment_Report.txt', description: 'Apollo Hospitals Clinical Consultation Report for Demo Mother by Dr. Sharma.', summary_content: '• Patient: Priya Kumar\\n• Date: 17/11/2026\\n• Doctor: Dr. K. Sharma (Endocrinology)\\n• Observations: HbA1c 6.8%, BP 122/80\\n• Advice: Regular diet and exercise, next review in 3 months' },
  { id: '00000000-0000-4000-8000-000000000037', title: '[DEMO] Family Insurance Policy', category: 'Insurance', file_type: 'TXT', file_size: '525 B', uploader_name: 'Father', upload_date: '2026-01-05', file_url: '/demo-documents/Family_Insurance_Policy.txt', description: 'Star Health Family Optima Insurance Plan. ₹5 Lakhs sum insured floater covering all 5 members.', summary_content: '• Policy No: POL-772910-FAM\\n• Policyholder: Rajesh Kumar\\n• Coverage: ₹5,00,000 (₹5 Lakhs)\\n• Covered Members: Father, Mother, Sarah, Sneha, Sham\\n• Period: 06/12/2025 to 05/12/2027' },
  { id: '00000000-0000-4000-8000-000000000038', title: '[DEMO] Property Ownership Record', category: 'Home', file_type: 'TXT', file_size: '482 B', uploader_name: 'Father', upload_date: '2026-01-12', file_url: '/demo-documents/Property_Ownership_Record.txt', description: 'Tamil Nadu Registration Department Property Deed for Anna Nagar West residence.', summary_content: '• Property Title Deed No: 2841/2012\\n• Owners: Rajesh Kumar & Priya Kumar\\n• Address: 42 Palm Grove Avenue, Anna Nagar West, Chennai 600040\\n• Area: 2,400 Sq. Ft.\\n• Status: Nil Encumbrance' },
  { id: '00000000-0000-4000-8000-000000000039', title: '[DEMO] Sarah School Certificate', category: 'Education', file_type: 'TXT', file_size: '509 B', uploader_name: 'Sarah', upload_date: '2026-01-08', file_url: '/demo-documents/Sarah_School_Certificate.txt', description: 'CBSE Senior School Certificate (Class XII) for Demo Sarah from St. Michael School.', summary_content: '• CBSE Class XII Senior School Certificate\\n• Student: Sarah Kumar\\n• Roll No: 8192034\\n• Stream: Science\\n• Result: 94.2% Distinction' },
  { id: '00000000-0000-4000-8000-000000000040', title: '[DEMO] Grocery Purchase Receipt', category: 'Financial', file_type: 'TXT', file_size: '578 B', uploader_name: 'Sarah', upload_date: '2026-11-02', file_url: '/demo-documents/Grocery_Purchase_Receipt.txt', description: 'Nilgiris 1905 Supermarket retail tax invoice for monthly grocery purchase of ₹2,500.', summary_content: '• Nilgiris Retail Tax Invoice\\n• Date: 02/11/2026\\n• Total Items: 5\\n• Total Paid: ₹2,500.00\\n• Mode: UPI GPay' },
  { id: '00000000-0000-4000-8000-000000000041', title: '[DEMO] Family Emergency Contacts', category: 'General', file_type: 'TXT', file_size: '499 B', uploader_name: 'Sarah', upload_date: '2026-01-02', file_url: '/demo-documents/Family_Emergency_Contacts.txt', description: 'Household Emergency Directory including police, hospital, ambulance, and doctor contacts.', summary_content: '• Anna Nagar Police: 044-26151100 / 100\\n• Apollo Clinic: 044-28290200 / 1066\\n• Dr. Sharma: +91 98400 12345\\n• Ambulance: 108\\n• Fire: 101' },
  { id: '00000000-0000-4000-8000-000000000042', title: '[DEMO] Vehicle Insurance Document', category: 'Insurance', file_type: 'TXT', file_size: '509 B', uploader_name: 'Father', upload_date: '2026-10-16', expiry_date: '2027-10-15', file_url: '/demo-documents/Vehicle_Insurance_Document.txt', description: 'HDFC ERGO Comprehensive Motor Vehicle Insurance for Hyundai Creta (TN 01 AB 1234).', summary_content: '• Policy No: MOT-482019-2026\\n• Vehicle: Hyundai Creta (TN 01 AB 1234)\\n• Insured: Rajesh Kumar\\n• IDV: ₹11,50,000\\n• Validity: 16/10/2026 to 15/10/2027' }
];

const initialFallbackKnowledge: any[] = [
  { id: '00000000-0000-4000-8000-000000000131', title: "[DEMO] Father Profile", category: 'General', importance: 'Important', related_member_name: 'Father', content: 'Name: Demo Father (Rajesh Kumar), Age: 52, Profession: Executive, Health: Normal BP' },
  { id: '00000000-0000-4000-8000-000000000132', title: "[DEMO] Mother Profile", category: 'General', importance: 'Important', related_member_name: 'Mother', content: 'Name: Demo Mother (Priya Kumar), Age: 49, Profession: Teacher, Health: Diabetic diet management' },
  { id: '00000000-0000-4000-8000-000000000133', title: "[DEMO] Sarah Profile", category: 'General', importance: 'Important', related_member_name: 'Sarah', content: 'Name: Demo Sarah (Sarah Kumar), Age: 24, Profession: Software Engineer, Role: Admin' },
  { id: '00000000-0000-4000-8000-000000000134', title: "[DEMO] Sneha Profile", category: 'General', importance: 'Important', related_member_name: 'Sneha', content: 'Name: Demo Sneha (Sneha Kumar), Age: 19, Student: Medical College, Lactose Intolerant' },
  { id: '00000000-0000-4000-8000-000000000135', title: "[DEMO] Father's Birthday", category: 'Schedules', importance: 'Critical', related_member_name: 'Father', content: "Father's Birthday is on November 15" },
  { id: '00000000-0000-4000-8000-000000000136', title: "[DEMO] Mother's Birthday", category: 'Schedules', importance: 'Critical', related_member_name: 'Mother', content: "Mother's Birthday is on December 10" },
  { id: '00000000-0000-4000-8000-000000000137', title: "[DEMO] Sarah's Birthday", category: 'Schedules', importance: 'Critical', related_member_name: 'Sarah', content: "Sarah's Birthday is on November 22" },
  { id: '00000000-0000-4000-8000-000000000138', title: "[DEMO] Sneha's Birthday", category: 'Schedules', importance: 'Critical', related_member_name: 'Sneha', content: "Sneha's Birthday is on January 12" },
  { id: '00000000-0000-4000-8000-000000000139', title: "[DEMO] Sarah Food Preference", category: 'Preferences', importance: 'Important', related_member_name: 'Sarah', content: 'Sarah prefers vegetarian food and light dinners' },
  { id: '00000000-0000-4000-8000-000000000140', title: "[DEMO] Father's Food Preference", category: 'Preferences', importance: 'Important', related_member_name: 'Father', content: 'Father prefers traditional home-cooked South Indian meals' },
  { id: '00000000-0000-4000-8000-000000000141', title: "[DEMO] Mother's Food Preference", category: 'Preferences', importance: 'Important', related_member_name: 'Mother', content: 'Mother prefers vegetarian meals with low sugar/salt' },
  { id: '00000000-0000-4000-8000-000000000142', title: "[DEMO] Sneha Food Preference", category: 'Preferences', importance: 'Critical', related_member_name: 'Sneha', content: 'Sneha is lactose intolerant and requires dairy-free alternatives (almond milk, soy)' },
  { id: '00000000-0000-4000-8000-000000000143', title: "[DEMO] Family Gathering Preference", category: 'Preferences', importance: 'Important', related_member_name: 'Sarah', content: 'The family prefers weekend gatherings on Friday or Saturday evenings' },
  { id: '00000000-0000-4000-8000-000000000144', title: "[DEMO] Grocery Shopping Preference", category: 'Schedules', importance: 'Important', related_member_name: 'Mother', content: 'Weekly grocery shopping is done on Sunday mornings' },
  { id: '00000000-0000-4000-8000-000000000145', title: "[DEMO] Monthly Family Meeting", category: 'Schedules', importance: 'Important', related_member_name: 'Father', content: 'Monthly family meeting is held on the last Sunday of every month at 6 PM' },
  { id: '00000000-0000-4000-8000-000000000146', title: "[DEMO] Family Emergency Contact", category: 'Emergency', importance: 'Critical', related_member_name: 'Father', content: 'Primary emergency contact: Apollo Clinic Anna Nagar 044-28290200, Dr. Sharma +91 98400 12345' },
  { id: '00000000-0000-4000-8000-000000000147', title: "[DEMO] Family Address", category: 'General', importance: 'Important', related_member_name: 'Father', content: '42 Palm Grove Avenue, Anna Nagar West, Chennai 600040, Tamil Nadu, India' },
  { id: '00000000-0000-4000-8000-000000000148', title: "[DEMO] Family Trip Preference", category: 'Preferences', importance: 'Important', related_member_name: 'Father', content: 'Family enjoys weekend trips and heritage destinations within driving distance' },
  { id: '00000000-0000-4000-8000-000000000149', title: "[DEMO] Family Anniversary", category: 'Schedules', importance: 'Critical', related_member_name: 'Father', content: 'Parents wedding anniversary is celebrated on November 27' },
  { id: '00000000-0000-4000-8000-000000000150', title: "[DEMO] Household Note", category: 'General', importance: 'Important', related_member_name: 'Sarah', content: 'Monthly household planning: Review expenses and bills in the first week of every month' }
];

const initialFallbackReminders: any[] = [
  { id: '00000000-0000-4000-8000-000000000161', title: "[DEMO] Pay BESCOM Electricity Bill before due date", priority: 'High', date_time: '2026-11-25 09:00', completed: false, assigned_member_name: 'Sarah' },
  { id: '00000000-0000-4000-8000-000000000162', title: "[DEMO] Pick up Mother's medication refill", priority: 'High', date_time: '2026-11-17 18:00', completed: false, assigned_member_name: 'Father' },
  { id: '00000000-0000-4000-8000-000000000163', title: "[DEMO] Prepare for Father's birthday celebration", priority: 'Medium', date_time: '2026-11-15 17:00', completed: false, assigned_member_name: 'Sarah' }
];

let sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
let sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
let sharedFallbackMedicines = JSON.parse(JSON.stringify(initialFallbackMedicines));
let sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
let sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));
let sharedFallbackExpenses = JSON.parse(JSON.stringify(initialFallbackExpenses));
let sharedFallbackReminders = JSON.parse(JSON.stringify(initialFallbackReminders));
let sharedFallbackKnowledge = JSON.parse(JSON.stringify(initialFallbackKnowledge));

function resetSharedFallbackState() {
  sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
  sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
  sharedFallbackMedicines = JSON.parse(JSON.stringify(initialFallbackMedicines));
  sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
  sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));
  sharedFallbackExpenses = JSON.parse(JSON.stringify(initialFallbackExpenses));
  sharedFallbackReminders = JSON.parse(JSON.stringify(initialFallbackReminders));
  sharedFallbackKnowledge = JSON.parse(JSON.stringify(initialFallbackKnowledge));
}`;

const fallbackRegex = /\/\/ --- Shared Module-Scoped In-Memory State for Demo Evaluation ---[\s\S]*?function resetSharedFallbackState\(\) \{[\s\S]*?\}/;

if (fallbackRegex.test(serverSrc)) {
  serverSrc = serverSrc.replace(fallbackRegex, updatedInitialFallbacks);
  fs.writeFileSync(serverIndexPath, serverSrc, 'utf8');
  console.log('server/index.ts fallback state successfully updated with exact demo records!');
} else {
  console.error('Could not find fallback section in server/index.ts');
}
