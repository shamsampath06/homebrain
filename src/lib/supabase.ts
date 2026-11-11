import {
  BillItem,
  DocumentItem,
  EmergencyAlertLog,
  EmergencyContact,
  EmergencyNotification,
  EmergencySession,
  ExpenseItem,
  FamilyEvent,
  FamilyKnowledge,
  FamilyKnowledgeFile,
  FamilyMember,
  FamilyMemory,
  GroceryHistoryItem,
  GroceryItem,
  MedicineItem,
  MedicineLog,
  ReminderItem,
  User
} from '../types';

type JsonRecord = Record<string, unknown>;

const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const toSnake = (key: string) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const camelize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord).map(([key, child]) => [toCamel(key), camelize(child)])
  );
};

const snakify = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(snakify);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord).map(([key, child]) => [toSnake(key), snakify(child)])
  );
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

interface StoredSession {
  access_token?: string;
  refresh_token?: string;
  currentSession?: StoredSession;
}

const readStoredSession = (): StoredSession | null => {
  if (!supabaseUrl) return null;
  try {
    const host = new URL(supabaseUrl).hostname.split('.')[0];
    const stored = localStorage.getItem(`sb-${host}-auth-token`);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredSession;
    return parsed.currentSession || parsed;
  } catch {
    return null;
  }
};

export const getAccessToken = () => readStoredSession()?.access_token || supabaseAnonKey || '';
const getStoredSession = (): StoredSession | null => readStoredSession();

const headers = () => ({
  apikey: supabaseAnonKey || '',
  Authorization: 'Bearer ' + getAccessToken(),
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
});

const request = async <T>(
  path: string,
  init: RequestInit = {},
  _retried = false
): Promise<T> => {
  if (!isSupabaseConfigured || !supabaseUrl) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers || {}) }
  });

  if (response.status === 401 && !_retried) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, init, true);
    }
    clearStoredSession();
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${body || response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  const json = await response.json();
  return camelize(json) as T;
};

const familyFilter = (familyId: string) => `family_id=eq.${encodeURIComponent(familyId)}`;

export interface SupabaseFamilyData {
  user: User | null;
  familyMembers: FamilyMember[];
  events: FamilyEvent[];
  reminders: ReminderItem[];
  documents: DocumentItem[];
  groceries: GroceryItem[];
  groceryHistory: GroceryHistoryItem[];
  medicines: MedicineItem[];
  medicineLogs: MedicineLog[];
  expenses: ExpenseItem[];
  bills: BillItem[];
  knowledgeList: FamilyKnowledge[];
  knowledgeFiles: FamilyKnowledgeFile[];
  emergencyContacts: EmergencyContact[];
  emergencyLogs: EmergencyAlertLog[];
  emergencySessions: EmergencySession[];
  emergencyNotifications: EmergencyNotification[];
  memories: FamilyMemory[];
}

const emptyData = (): SupabaseFamilyData => ({
  user: null,
  familyMembers: [],
  events: [],
  reminders: [],
  documents: [],
  groceries: [],
  groceryHistory: [],
  medicines: [],
  medicineLogs: [],
  expenses: [],
  bills: [],
  knowledgeList: [],
  knowledgeFiles: [],
  emergencyContacts: [],
  emergencyLogs: [],
  emergencySessions: [],
  emergencyNotifications: [],
  memories: []
});

export const getAuthenticatedProfile = async (): Promise<User | null> => {
  if (!isSupabaseConfigured || !supabaseUrl) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey || '', Authorization: 'Bearer ' + getAccessToken() }
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Supabase auth lookup failed (${response.status})`);
  const authUser = (await response.json()) as { id: string; email?: string };
  const profiles = await request<JsonRecord[]>(`profiles?id=eq.${authUser.id}&select=*`);
  const profile = profiles[0];
  if (!profile) return null;
  return {
    id: String(profile.id),
    name: String(profile.name || authUser.email || 'HomeBrain User'),
    email: String(profile.email || authUser.email || ''),
    avatar: String(profile.avatarUrl || ''),
    role: (profile.role as User['role']) || 'Member',
    familyId: String(profile.familyId),
    familyName: String(profile.familyName || 'My Family')
  };
};

export const signInWithPassword = async (email: string, password: string): Promise<User> => {
    if (!isSupabaseConfigured || !supabaseUrl) throw new Error('Supabase is not configured.');
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: supabaseAnonKey || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Sign-in failed (${response.status}): ${body || response.statusText}`);
    }
    const session = (await response.json()) as { access_token: string; refresh_token?: string };
    storeSession(session);
    const profile = await getAuthenticatedProfile();
    if (!profile) throw new Error('Signed in, but no family profile is associated with this account.');
    return profile;
  };

export const signUpWithPassword = async (
  email: string,
  password: string,
  name: string,
  familyName: string
): Promise<User | null> => {
  if (!isSupabaseConfigured || !supabaseUrl) throw new Error('Supabase is not configured.');
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey || '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { name, family_name: familyName } })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Registration failed (${response.status}): ${body || response.statusText}`);
  }
  const result = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    user?: { id: string };
  };
  if (!result.access_token || !result.user) return null;
  storeSession({ access_token: result.access_token, refresh_token: result.refresh_token });
  return getAuthenticatedProfile();
};

const storeSession = (session: { access_token?: string; refresh_token?: string }) => {
  if (!supabaseUrl) return;
  const host = new URL(supabaseUrl).hostname.split('.')[0];
  localStorage.setItem(`sb-${host}-auth-token`, JSON.stringify(session));
};

export const signInWithGoogle = (): void => {
  if (!isSupabaseConfigured || !supabaseUrl) throw new Error('Supabase is not configured.');
  const redirectTo = window.location.origin;
  window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
};

export const handleOAuthCallback = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) return false;

  try {
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token) {
      storeSession({ access_token, refresh_token: refresh_token || undefined });
      // clean url hash without reload
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    }
  } catch (err) {
    console.warn('Failed parsing OAuth callback hash:', err);
  }
  return false;
};

export const clearStoredSession = (): void => {
  if (!supabaseUrl) return;
  const host = new URL(supabaseUrl).hostname.split('.')[0];
  localStorage.removeItem(`sb-${host}-auth-token`);
};

export const refreshSession = async (): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabaseUrl) return false;
  const session = getStoredSession();
  if (!session?.refresh_token) return false;
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey || '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  if (!response.ok) return false;
  const refreshed = await response.json() as { access_token: string; refresh_token?: string };
  storeSession(refreshed);
  return true;
};

export const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured || !supabaseUrl) return;
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: supabaseAnonKey || '', Authorization: 'Bearer ' + getAccessToken() }
    });
    clearStoredSession();
};

export const updatePassword = async (email: string, currentPassword: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabaseUrl) throw new Error('Supabase is not configured.');
    await signInWithPassword(email, currentPassword);
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: supabaseAnonKey || '', Authorization: 'Bearer ' + getAccessToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Password update failed (${response.status}): ${body || response.statusText}`);
    }
};

const read = <T>(table: string, familyId: string) =>
  request<T[]>(`${table}?${familyFilter(familyId)}&select=*`);

const readOptional = async <T>(table: string, familyId: string): Promise<T[]> => {
  try {
    return await read<T>(table, familyId);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PGRST205') || message.includes('Could not find the table')) {
      return [];
    }
    throw error;
  }
};

export const loadFamilyData = async (profile: User): Promise<SupabaseFamilyData> => {
  const familyId = profile.familyId;
  const [
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
    emergencySessions,
    emergencyNotifications,
    memories
  ] = await Promise.all([
    read<FamilyMember>('family_members', familyId),
    read<FamilyEvent>('events', familyId),
    read<ReminderItem>('reminders', familyId),
    read<DocumentItem>('documents', familyId),
    read<GroceryItem>('groceries', familyId),
    read<GroceryHistoryItem>('grocery_history', familyId),
    read<MedicineItem>('medicines', familyId),
    read<MedicineLog>('medicine_logs', familyId),
    read<ExpenseItem>('expenses', familyId),
    read<BillItem>('bills', familyId),
    read<FamilyKnowledge>('family_knowledge', familyId),
    read<FamilyKnowledgeFile>('knowledge_files', familyId),
    read<EmergencyContact>('emergency_contacts', familyId),
    read<EmergencyAlertLog>('emergency_logs', familyId),
    readOptional<EmergencySession>('emergency_sessions', familyId),
    readOptional<EmergencyNotification>('emergency_notifications', familyId),
    read<FamilyMemory>('family_memories', familyId)
  ]);
  return {
    ...emptyData(),
    user: profile,
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
    emergencySessions,
    emergencyNotifications,
    memories
  };

};

export const loadEmergencyData = async (familyId: string): Promise<{
  sessions: EmergencySession[];
  notifications: EmergencyNotification[];
}> => {
  const [sessions, notifications] = await Promise.all([
    readOptional<EmergencySession>('emergency_sessions', familyId),
    readOptional<EmergencyNotification>('emergency_notifications', familyId)
  ]);
  return { sessions, notifications };
};

export const listFamilyProfiles = async (familyId: string): Promise<Array<{ id: string; name: string }>> => {
  const profiles = await request<Array<{ id: string; name: string }>>(
    `profiles?${familyFilter(familyId)}&select=id,name`
  );
  return profiles;
};

const withFamilyId = (familyId: string, value: JsonRecord) =>
  snakify({ ...value, familyId }) as JsonRecord;

/**
 * Extracts the column name from a PostgREST "unknown column" error so the write can be
 * retried without it. This keeps the app working when an optional migration (e.g. 007)
 * has not been applied to the live database yet.
 */
export const extractMissingColumn = (message: string): string | null => {
  const pgrst = message.match(/Could not find the '([^']+)' column/);
  if (pgrst) return pgrst[1];
  const pg = message.match(/column "?([a-z_0-9]+)"? (?:of relation "[^"]+" )?does not exist/i);
  if (pg) return pg[1].replace(/^[a-z_]+\./, '');
  return null;
};

const writeWithSchemaFallback = async <T>(
  path: string,
  method: 'POST' | 'PATCH',
  payload: JsonRecord
): Promise<T> => {
  let body = { ...payload };
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await request<T>(path, { method, body: JSON.stringify(body) });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const column = extractMissingColumn(message);
      if (!column || !(column in body)) throw error;
      console.warn(`[HomeBrain] Column "${column}" is missing in ${path.split('?')[0]}; saving without it. Apply migration 007 to enable it.`);
      const { [column]: _removed, ...rest } = body;
      body = rest;
    }
  }
  throw new Error(`Could not save to ${path.split('?')[0]}: too many missing columns.`);
};

export const insertRow = async <T extends object>(
  table: string,
  familyId: string,
  value: T
): Promise<T> => {
  const rows = await writeWithSchemaFallback<T[]>(table, 'POST', withFamilyId(familyId, value as JsonRecord));
  if (!rows[0]) {
    throw new Error(`Supabase insert returned no row for ${table}. The session may not have permission for this family.`);
  }
  return rows[0];
};

export const updateRow = async (
  table: string,
  familyId: string,
  id: string,
  value: object
): Promise<void> => {
  const rows = await writeWithSchemaFallback<JsonRecord[]>(
    `${table}?${familyFilter(familyId)}&id=eq.${encodeURIComponent(id)}`,
    'PATCH',
    snakify(value) as JsonRecord
  );
  if (!rows[0]) {
    throw new Error(`Supabase update affected no row in ${table}. Check the record ID and family access.`);
  }
};

export const deleteRow = async (table: string, familyId: string, id: string): Promise<void> => {
  const rows = await request<JsonRecord[]>(`${table}?${familyFilter(familyId)}&id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!rows[0]) {
    throw new Error(`Supabase delete affected no row in ${table}. Check the record ID and family access.`);
  }
};

/** Makes a filename safe for a Supabase Storage object key (ASCII, no spaces or reserved characters). */
export const sanitizeFileName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'file';
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return ext ? `${base}.${ext}` : base;
};

export const buildStoragePath = (familyId: string, folder: string, fileName: string): string =>
  `${familyId}/${folder ? `${folder}/` : ''}${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

const describeStorageError = (status: number, body: string): string => {
  const lower = body.toLowerCase();
  if (lower.includes('row-level security') || status === 403) {
    return 'Upload was blocked by storage security rules. Make sure you are signed in to your family account.';
  }
  if (lower.includes('bucket not found')) return 'The private "documents" storage bucket does not exist. Apply the Supabase migrations.';
  if (lower.includes('payload too large') || status === 413) return 'The file is larger than the storage limit.';
  if (lower.includes('invalid key')) return 'The file name contains unsupported characters.';
  if (lower.includes('jwt') || status === 401) return 'Your session expired. Please sign in again.';
  return `Upload failed (${status})${body ? `: ${body.slice(0, 160)}` : ''}`;
};

const xhrUpload = (url: string, file: File, onProgress?: (percent: number) => void) =>
  new Promise<{ status: number; body: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('apikey', supabaseAnonKey || '');
    xhr.setRequestHeader('Authorization', 'Bearer ' + getAccessToken());
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = event => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText || '' });
    xhr.onerror = () => reject(new Error('Network error while uploading. Check your connection.'));
    xhr.send(file);
  });

export const uploadPrivateFile = async (
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> => {
  if (!isSupabaseConfigured || !supabaseUrl) {
    throw new Error('Supabase is not configured.');
  }
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
  let result = await xhrUpload(url, file, onProgress);
  if ((result.status === 400 || result.status === 401) && /jwt|expired|unauthor/i.test(result.body)) {
    if (await refreshSession()) result = await xhrUpload(url, file, onProgress);
  }
  if (result.status < 200 || result.status >= 300) {
    throw new Error(describeStorageError(result.status, result.body));
  }
  onProgress?.(100);
  return `${supabaseUrl}/storage/v1/object/authenticated/${bucket}/${path}`;
};

export const createPrivateFileUrl = async (bucket: string, path: string, expiresIn = 300): Promise<string> => {
  if (!isSupabaseConfigured || !supabaseUrl) {
    throw new Error('Supabase is not configured.');
  }
  const signUrl = `${supabaseUrl}/storage/v1/object/sign/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const sign = () => fetch(signUrl, {
    method: 'POST',
    headers: { ...headers(), Authorization: 'Bearer ' + getAccessToken() },
    body: JSON.stringify({ expiresIn })
  });
  let response = await sign();
  if ((response.status === 400 || response.status === 401) && await refreshSession()) {
    response = await sign();
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Private file retrieval failed (${response.status}): ${body || response.statusText}`);
  }
  const result = await response.json() as { signedURL?: string };
  if (!result.signedURL) throw new Error('Supabase did not return a signed document URL.');
  return result.signedURL.startsWith('http') ? result.signedURL : `${supabaseUrl}/storage/v1${result.signedURL}`;
};

export const deletePrivateFile = async (bucket: string, path: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabaseUrl) {
    throw new Error('Supabase is not configured.');
  }
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    headers: { ...headers(), Authorization: 'Bearer ' + getAccessToken() },
    body: JSON.stringify({ prefixes: [path] })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Private file deletion failed (${response.status}): ${body || response.statusText}`);
  }
};
