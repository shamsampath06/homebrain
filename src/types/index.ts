export type UserRole = 'Admin' | 'Parent' | 'Member' | 'Senior' | 'Child';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  familyId: string;
  familyName: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  avatar: string;
  role: UserRole;
  phone: string;
  email: string;
  age?: number;
}

export type EventCategory = 'Birthday' | 'Appointment' | 'Holiday' | 'School' | 'Bill' | 'General';

export interface FamilyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: EventCategory;
  description?: string;
  membersInvolved: string[]; // Member names or IDs
  reminder: boolean;
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
}

export interface ReminderItem {
  id: string;
  title: string;
  category: 'Birthday' | 'Medicine' | 'Appointment' | 'Bill' | 'Grocery' | 'General';
  dateTime: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  assignedMemberName: string;
}

export type DocumentCategory = 'Identity' | 'Medical' | 'Financial' | 'Home' | 'Education' | 'Legal' | 'Insurance';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  uploadDate: string;
  fileType: string; // e.g. "PDF", "PNG", "JPEG"
  fileSize: string; // e.g. "2.4 MB"
  fileUrl: string;
  description: string;
  summaryContent?: string;
  uploaderName: string;
}

export type GroceryCategory = 'Dairy' | 'Produce' | 'Bakery' | 'Meat' | 'Pantry' | 'Household' | 'Beverages';

export interface GroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  quantity: string;
  notes?: string;
  isPurchased: boolean;
  purchasedBy?: string;
  purchasedAt?: string;
}

export interface GroceryHistoryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  purchasedBy: string;
  purchasedAt: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  dosage: string;
  timing: string; // e.g., "8:00 PM", "Morning (8:00 AM)"
  frequency: 'Daily' | 'Twice Daily' | 'Weekly' | 'As Needed';
  personName: string; // Person taking medicine
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface MedicineLog {
  id: string;
  medicineId: string;
  medicineName: string;
  personName: string;
  status: 'Taken' | 'Missed';
  timestamp: string;
  loggedBy: string;
}

export type ExpenseCategory = 'Groceries' | 'Utilities' | 'Healthcare' | 'Education' | 'Shopping' | 'Dining' | 'Maintenance';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  payer: string;
  description?: string;
  receiptUrl?: string;
}

export interface BillItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  paidDate?: string;
  paidBy?: string;
  recurring: 'Monthly' | 'Quarterly' | 'Yearly' | 'One-Time';
}

export interface FamilyKnowledge {
  id: string;
  title: string;
  content: string;
  category: 'Allergies' | 'Dietary' | 'Education' | 'Schedules' | 'Preferences' | 'Emergency' | 'General';
  relatedMemberName: string;
  importance: 'Critical' | 'Important' | 'Info';
  createdDate: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface EmergencyAlertLog {
  id: string;
  timestamp: string;
  userLocation: string;
  status: 'Sent' | 'Delivered' | 'Cancelled';
  recipients: string[];
}

export interface FamilyMemory {
  id: string;
  title: string;
  year: number;
  date: string;
  description: string;
  photoUrl: string;
  location?: string;
  addedBy: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachments?: { name: string; url: string; type: string }[];
  groundingSources?: string[];
}
