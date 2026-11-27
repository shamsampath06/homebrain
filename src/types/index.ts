export type UserRole = 'Admin' | 'Co-Admin' | 'Parent' | 'Member' | 'Senior' | 'Child';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  familyId: string;
  familyName: string;
  relation?: string;
  inviteCode?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  avatar: string;
  role: UserRole;
  phone: string;
  email: string;
  userId?: string;
  isRegistered?: boolean;
  age?: number;
  birthday?: string; // YYYY-MM-DD (requires migration 007)
  preferences?: string;
}

export type EventCategory = 'Birthday' | 'Appointment' | 'Holiday' | 'School' | 'Bill' | 'General' | 'Meeting' | 'Family';

export type EventPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface EventChangeHistory {
  action: 'created' | 'updated' | 'rescheduled' | 'cancelled';
  byName: string;
  byRole: string;
  timestamp: string;
  details?: string;
}

export interface FamilyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: EventCategory;
  priority?: EventPriority;
  location?: string;
  description?: string;
  membersInvolved: string[]; // Member names or IDs
  reminder: boolean;
  reminderMinutesBefore?: number;
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  isPersonal?: boolean;
  userId?: string;
  createdByName?: string;
  createdByRole?: string;
  createdAt?: string;
  lastModifiedByName?: string;
  lastModifiedByRole?: string;
  lastModifiedAt?: string;
  rsvps?: Record<string, 'pending' | 'accepted' | 'declined'>; // Map of memberName -> RSVP status
  history?: EventChangeHistory[];
  familyId?: string;
  status?: 'confirmed' | 'cancelled' | 'tentative';
}

export interface ReminderItem {
  id: string;
  title: string;
  category: 'Birthday' | 'Medicine' | 'Appointment' | 'Bill' | 'Grocery' | 'General';
  dateTime: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  assignedMemberName: string;
  isPersonal?: boolean;
  userId?: string;
  createdByName?: string;
}

export type DocumentCategory = 'Identity' | 'Medical' | 'Financial' | 'Home' | 'Education' | 'Legal' | 'Insurance' | 'General';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  uploadDate: string;
  fileType: string; // e.g. "PDF", "PNG", "JPEG"
  fileSize: string; // e.g. "2.4 MB"
  fileUrl: string;
  storagePath?: string;
  description: string;
  summaryContent?: string;
  uploaderName: string;
  expiryDate?: string; // YYYY-MM-DD
  isPersonal?: boolean;
  userId?: string;
  createdByName?: string;
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
  estimatedPrice?: number;
}

export interface GroceryHistoryItem {
  id: string;
  groceryId?: string;
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
  status?: string;
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
  isPersonal?: boolean;
  userId?: string;
  createdByName?: string;
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
  category: 'Allergies' | 'Dietary' | 'Medical' | 'Education' | 'Schedules' | 'Preferences' | 'Emergency' | 'Rules' | 'General';
  relatedMemberName: string;
  importance: 'Critical' | 'Important' | 'Medium' | 'Info';
  createdDate?: string;
}

export interface FamilyKnowledgeFile {
  id: string;
  name: string;
  folderPath: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  isFolder: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  email?: string; // requires migration 007
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export type EmergencySMSStatus = 'SOS_CREATED' | 'SMS_PENDING' | 'SMS_SENT' | 'SMS_DELIVERED' | 'SMS_FAILED' | 'ACCEPTED' | 'FAILED' | 'UNCONFIGURED';

export interface SMSDeliveryResult {
  recipient: string;
  recipientName: string;
  status: EmergencySMSStatus;
  provider: 'twilio' | 'fast2sms' | 'none';
  messageId?: string;
  error?: string;
  dispatchedAt: string;
}

export interface EmailDeliveryResult {
  recipient: string;
  recipientName: string;
  status: 'ACCEPTED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'UNCONFIGURED';
  provider: 'resend' | 'nodemailer' | 'none';
  messageId?: string;
  error?: string;
  dispatchedAt: string;
}

export interface EmergencyAlertLog {
  id: string;
  timestamp: string;
  userLocation: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  userName?: string;
  status: 'SOS_CREATED' | 'EMAIL_DELIVERED' | 'EMAIL_SENT' | 'EMAIL_FAILED' | 'SMS_PENDING' | 'SMS_SENT' | 'SMS_DELIVERED' | 'SMS_FAILED' | 'Logged' | 'Sent' | 'Delivered' | 'Cancelled' | 'Failed';
  recipients: string[];
  locationSource?: 'gps' | 'home' | 'custom' | string;
  idempotencyKey?: string;
  smsResults?: SMSDeliveryResult[];
  emailResults?: EmailDeliveryResult[];
  overallStatus?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedReason?: string;
}

export interface EmergencySession {
  id: string;
  familyId: string;
  initiatedBy: string;
  initiatorName: string;
  status: 'active' | 'ended';
  address: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  lastLocationAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface EmergencyNotification {
  id: string;
  familyId: string;
  sessionId: string;
  recipientUserId: string;
  initiatorName: string;
  address: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  lastLocationAt: string;
  status: 'active' | 'ended';
  readAt?: string;
  createdAt: string;
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
  photoUrls?: string[];
  documentUrls?: string[];
  taggedMembers?: string[];
  tags?: string[];
  album?: string;
}

export interface AIAgentAction {
  type: 'add_grocery' | 'add_event' | 'add_reminder' | 'add_expense' | 'log_medicine' | 'vault_search' | 'pay_bill' | 'add_bill' | 'save_document';
  title: string;
  detail: string;
  status: 'success' | 'pending' | 'failed';
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    base64?: string;
    mimeType?: string;
    previewUrl?: string;
  }[];
  groundingSources?: string[];
  actionsExecuted?: AIAgentAction[];
  confidenceScore?: number;
  latencyMs?: number;
  cognitiveMetrics?: {
    tokensUsed?: number;
    nodesEvaluated?: number;
    ragPipelines?: string[];
  };
}

export interface HealthVitalLog {
  id: string;
  personName: string;
  vitalType: 'Blood Pressure' | 'Blood Sugar' | 'Temperature' | 'Heart Rate' | 'Weight';
  value: string;
  status: 'Normal' | 'Elevated' | 'Low' | 'Requires Attention';
  timestamp: string;
  notes?: string;
}
