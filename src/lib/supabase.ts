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
  if (typeof window === 'undefined') return null;
  const hbToken = localStorage.getItem('homebrain_session_token');
  if (hbToken) {
    return { access_token: hbToken };
  }
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
export const hasAuthenticatedJwt = (): boolean => {
  const token = readStoredSession()?.access_token;
  return Boolean(token && token !== supabaseAnonKey && token !== 'demo-token');
};
const getStoredSession = (): StoredSession | null => readStoredSession();

const storeSession = (session: { access_token?: string; refresh_token?: string }) => {
  if (typeof window !== 'undefined') {
    if (session.access_token) {
      localStorage.setItem('homebrain_session_token', session.access_token);
    }
    if (supabaseUrl) {
      try {
        const host = new URL(supabaseUrl).hostname.split('.')[0];
        localStorage.setItem(`sb-${host}-auth-token`, JSON.stringify(session));
      } catch { }
    }
  }
};

export const clearStoredSession = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('homebrain_session_token');
    localStorage.removeItem('homebrain_active_user');
    if (supabaseUrl) {
      try {
        const host = new URL(supabaseUrl).hostname.split('.')[0];
        localStorage.removeItem(`sb-${host}-auth-token`);
      } catch { }
    }
  }
};

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

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401 && !_retried && !body.includes('42501') && !body.includes('row-level security')) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request<T>(path, init, true);
      }
    }
    throw new Error(`Supabase request failed (${response.status}): ${body || response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  const json = await response.json();
  return camelize(json) as T;
};

export const ensureValidUUID = (id?: string | null): string => {
  if (!id) {
    return '00000000-0000-4000-8000-000000000000'.replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
  }
  const str = String(id).trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str;
  }
  const match = str.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (match) {
    return match[1];
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch { }
  }
  return '11111111-2222-4333-8444-555555555555'.replace(/[0-9]/g, () => Math.floor(Math.random() * 16).toString(16));
};

const familyFilter = (familyId: string) => {
  const cleanId = ensureValidUUID(familyId);
  return `family_id=eq.${encodeURIComponent(cleanId)}`;
};

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

export const generateHouseholdInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HB-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const getAuthenticatedProfile = async (): Promise<User | null> => {
  const getLocalActiveUser = (): User | null => {
    const localUserStr = typeof window !== 'undefined' ? localStorage.getItem('homebrain_active_user') : null;
    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr) as User;
        if (!parsed.inviteCode) parsed.inviteCode = 'HB-849201';
        if (!parsed.relation) parsed.relation = 'Member';
        return parsed;
      } catch { }
    }
    return null;
  };

  const token = getAccessToken();
  if (token && token.startsWith('hb-sess-')) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const u: User = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatar: data.user.avatar || '👨‍💼',
            role: data.user.role || 'Member',
            relation: data.user.relation || 'Member',
            familyId: data.user.familyId || 'demo-family-kumar',
            familyName: data.user.familyName || 'Kumar Household',
            inviteCode: data.user.inviteCode || 'HB-849201'
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('homebrain_active_user', JSON.stringify(u));
          }
          return u;
        }
      }
    } catch { }
  }

  if (!isSupabaseConfigured || !supabaseUrl || !hasAuthenticatedJwt()) {
    return getLocalActiveUser();
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey || '', Authorization: 'Bearer ' + token }
    });
    if (response.status === 401 || response.status === 403 || !response.ok) {
      return getLocalActiveUser();
    }
    const authUser = (await response.json()) as { id: string; email?: string; user_metadata?: { name?: string; family_name?: string; invite_code?: string; relation?: string; role?: string } };
    let profiles: JsonRecord[] = [];
    try {
      profiles = await request<JsonRecord[]>(`profiles?id=eq.${authUser.id}&select=*`);
    } catch { }
    const profile = profiles[0];
    if (!profile) {
      const userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'HomeBrain User';
      const famName = authUser.user_metadata?.family_name || 'Family Household';
      const validId = ensureValidUUID(authUser.id);
      const inviteCode = authUser.user_metadata?.invite_code || generateHouseholdInviteCode();
      const relation = authUser.user_metadata?.relation || 'Admin';
      const generatedProfile: User = {
        id: validId,
        name: String(userName),
        email: String(authUser.email || ''),
        avatar: '👨‍💼',
        role: 'Admin',
        relation: String(relation),
        familyId: validId,
        familyName: String(famName),
        inviteCode: String(inviteCode)
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('homebrain_active_user', JSON.stringify(generatedProfile));
      }
      return generatedProfile;
    }

    const profileFamId = ensureValidUUID(String(profile.familyId || authUser.id));
    let inviteCode = String(authUser.user_metadata?.invite_code || '');
    if (!inviteCode) {
      try {
        const fams = await request<JsonRecord[]>(`families?id=eq.${profileFamId}&select=invite_code`);
        if (fams[0]?.inviteCode) {
          inviteCode = String(fams[0].inviteCode);
        }
      } catch { }
    }
    if (!inviteCode) inviteCode = 'HB-849201';

    const p: User = {
      id: ensureValidUUID(String(profile.id || '')),
      name: String(profile.name || authUser.email || 'HomeBrain User'),
      email: String(profile.email || authUser.email || ''),
      avatar: String(profile.avatarUrl || '👨‍💼'),
      role: (profile.role as User['role']) || 'Member',
      relation: String(profile.relation || authUser.user_metadata?.relation || 'Member'),
      familyId: profileFamId,
      familyName: String(profile.familyName || 'Family Household'),
      inviteCode
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('homebrain_active_user', JSON.stringify(p));
    }
    return p;
  } catch {
    return getLocalActiveUser();
  }
};

export const signInWithPassword = async (email: string, password: string): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Attempt direct Supabase sign-in if configured
  if (isSupabaseConfigured && supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: supabaseAnonKey || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      if (response.ok) {
        const session = (await response.json()) as { access_token: string; refresh_token?: string };
        storeSession(session);
        const profile = await getAuthenticatedProfile();
        if (profile) {
          if (typeof window !== 'undefined') localStorage.setItem('homebrain_active_user', JSON.stringify(profile));
          return profile;
        }
      } else {
        const body = await response.text();
        let parsed: any = null;
        try { parsed = JSON.parse(body); } catch { }
        if (
          body.includes('invalid_credentials') ||
          body.includes('Invalid login credentials') ||
          parsed?.error_code === 'invalid_credentials' ||
          parsed?.msg === 'Invalid login credentials'
        ) {
          throw new Error('Incorrect email or password. Please verify your password and try again.');
        }
      }
    } catch (sbErr: any) {
      if (sbErr.message && sbErr.message.includes('Incorrect email or password')) throw sbErr;
      console.warn('Supabase auth network unreachable, falling over to HomeBrain backend authentication:', sbErr);
    }
  }

  // 2. Fallback to HomeBrain Backend Auth (/api/auth/login)
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        storeSession({ access_token: data.token });
      }
      const userProfile: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar || '👨‍💼',
        role: data.user.role || 'Member',
        relation: data.user.relation || 'Member',
        familyId: data.user.familyId || 'demo-family-kumar',
        familyName: data.user.familyName || 'Kumar Household',
        inviteCode: data.user.inviteCode || 'HB-849201'
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('homebrain_active_user', JSON.stringify(userProfile));
      }
      return userProfile;
    } else {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Login failed. Please check your credentials.');
    }
  } catch (backendErr: any) {
    if (backendErr.message && backendErr.message.includes('password')) throw backendErr;
    // 3. Fallback to pre-seeded local family accounts
    const sampleAccounts = [
      { name: 'Sarah', relation: 'Daughter / Admin', email: 'sarah.kumar@homebrain.app', role: 'Admin' },
      { name: 'Rajesh', relation: 'Father', email: 'dad.rajesh@homebrain.app', role: 'Co-Admin' },
      { name: 'Priya', relation: 'Mother', email: 'mom.priya@homebrain.app', role: 'Co-Admin' },
      { name: 'Sneha', relation: 'Sister', email: 'sister.sneha@homebrain.app', role: 'Member' },
      { name: 'Sham', relation: 'Brother', email: 'brother.sham@homebrain.app', role: 'Member' }
    ];
    const match = sampleAccounts.find(s => s.email.toLowerCase() === cleanEmail);
    const localProfile: User = {
      id: match ? `demo-user-${match.name.toLowerCase()}` : ensureValidUUID(),
      name: match ? match.name : cleanEmail.split('@')[0],
      email: cleanEmail,
      avatar: '👨‍💼',
      role: (match?.role as User['role']) || 'Member',
      relation: match ? match.relation : 'Member',
      familyId: 'demo-family-kumar',
      familyName: 'Kumar Household',
      inviteCode: 'HB-849201'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('homebrain_active_user', JSON.stringify(localProfile));
    }
    return localProfile;
  }
};

export interface SignUpOptions {
  email: string;
  password: string;
  name: string;
  familyName?: string;
  inviteCode?: string;
  relation?: string;
  role?: User['role'];
  mode?: 'create' | 'join';
}

export const signUpWithPassword = async (
  emailOrOptions: string | SignUpOptions,
  passwordArg?: string,
  nameArg?: string,
  familyNameArg?: string,
  inviteCodeArg?: string,
  relationArg?: string
): Promise<User> => {
  if (!isSupabaseConfigured || !supabaseUrl) throw new Error('Supabase is not configured.');

  let email: string;
  let password: string;
  let name: string;
  let familyName: string;
  let inviteCode: string | undefined;
  let relation: string;
  let role: User['role'];
  let mode: 'create' | 'join';

  if (typeof emailOrOptions === 'object') {
    email = emailOrOptions.email;
    password = emailOrOptions.password;
    name = emailOrOptions.name;
    familyName = emailOrOptions.familyName || 'Family Household';
    inviteCode = emailOrOptions.inviteCode ? emailOrOptions.inviteCode.trim().toUpperCase() : undefined;
    relation = emailOrOptions.relation || 'Member';
    mode = emailOrOptions.mode || (inviteCode ? 'join' : 'create');
    role = emailOrOptions.role || (mode === 'join' ? 'Member' : 'Admin');
  } else {
    email = emailOrOptions;
    password = passwordArg || '';
    name = nameArg || '';
    familyName = familyNameArg || 'Family Household';
    inviteCode = inviteCodeArg ? inviteCodeArg.trim().toUpperCase() : undefined;
    relation = relationArg || 'Member';
    mode = inviteCode ? 'join' : 'create';
    role = mode === 'join' ? 'Member' : 'Admin';
  }

  let targetFamilyId: string | null = null;
  let targetFamilyName = familyName;
  let finalInviteCode = inviteCode;

  // If user is joining an existing family with an invite code:
  if (mode === 'join' && inviteCode) {
    try {
      const fams = await request<JsonRecord[]>(`families?invite_code=eq.${encodeURIComponent(inviteCode)}&select=*`);
      if (fams && fams.length > 0) {
        targetFamilyId = ensureValidUUID(String(fams[0].id));
        targetFamilyName = String(fams[0].name || familyName);
        finalInviteCode = String(fams[0].inviteCode || inviteCode);
        role = 'Member';
      } else {
        throw new Error(`Household invitation code "${inviteCode}" not found. Please verify the code from your family administrator.`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) throw err;
      // If table query failed due to RLS or unauthenticated status, look up or attach fallback
      const cachedFamStr = typeof window !== 'undefined' ? localStorage.getItem(`homebrain_family_invite_${inviteCode}`) : null;
      if (cachedFamStr) {
        try {
          const cached = JSON.parse(cachedFamStr);
          targetFamilyId = ensureValidUUID(cached.id);
          targetFamilyName = cached.name || familyName;
        } catch { }
      }
    }
  }

  // If creating a new family:
  if (!targetFamilyId) {
    if (!finalInviteCode) finalInviteCode = generateHouseholdInviteCode();
    role = 'Admin';
  }

  // 1. Attempt direct Supabase signup if configured
  if (isSupabaseConfigured && supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: supabaseAnonKey || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          data: {
            name,
            family_name: targetFamilyName,
            invite_code: finalInviteCode,
            relation,
            role
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const userId = ensureValidUUID(result?.user?.id || result?.id);
        const userFamilyId = targetFamilyId || userId;

        if (result?.access_token) {
          storeSession({ access_token: result.access_token, refresh_token: result.refresh_token });
          const authProfile = await getAuthenticatedProfile();
          if (authProfile) {
            authProfile.id = ensureValidUUID(authProfile.id);
            authProfile.familyId = targetFamilyId || ensureValidUUID(authProfile.familyId);
            authProfile.familyName = targetFamilyName;
            authProfile.relation = relation;
            authProfile.role = role;
            authProfile.inviteCode = finalInviteCode;
            if (typeof window !== 'undefined') {
              localStorage.setItem('homebrain_active_user', JSON.stringify(authProfile));
            }
            return authProfile;
          }
        }
      }
    } catch (sbErr) {
      console.warn('Supabase signup unreachable, failing over to HomeBrain backend authentication:', sbErr);
    }
  }

  // 2. Call HomeBrain Backend Authentication (/api/auth/signup)
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        familyName: targetFamilyName,
        inviteCode: finalInviteCode,
        relation,
        role,
        mode
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        storeSession({ access_token: data.token });
      }
      const userProfile: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar || '👨‍💼',
        role: data.user.role || (mode === 'join' ? 'Member' : 'Admin'),
        relation: data.user.relation || relation,
        familyId: data.user.familyId || targetFamilyId || 'demo-family-kumar',
        familyName: data.user.familyName || targetFamilyName,
        inviteCode: data.user.inviteCode || finalInviteCode
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('homebrain_active_user', JSON.stringify(userProfile));
      }
      return userProfile;
    } else {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Registration failed.');
    }
  } catch (apiErr: any) {
    if (apiErr.message && !apiErr.message.includes('fetch')) throw apiErr;
  }

  // 3. Fallback working profile for client offline / instant entry
  const userId = ensureValidUUID();
  const userFamilyId = targetFamilyId || (inviteCode ? 'demo-family-kumar' : userId);

  const profile: User = {
    id: userId,
    name: name || 'HomeBrain User',
    email: email,
    avatar: '👨‍💼',
    role: role,
    relation: relation,
    familyId: userFamilyId,
    familyName: targetFamilyName,
    inviteCode: finalInviteCode
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('homebrain_active_user', JSON.stringify(profile));
    if (finalInviteCode) {
      localStorage.setItem(`homebrain_family_invite_${finalInviteCode}`, JSON.stringify({
        id: userFamilyId,
        name: targetFamilyName,
        inviteCode: finalInviteCode
      }));
    }
  }

  // Attempt to sync to profiles and family_members table in Supabase
  try {
    await request('profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(snakify({
        id: userId,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatar,
        role: profile.role,
        relation: profile.relation,
        familyId: profile.familyId,
        familyName: profile.familyName
      }))
    });
  } catch { }

  try {
    await request('family_members', {
      method: 'POST',
      body: JSON.stringify(snakify({
        familyId: profile.familyId,
        name: profile.name,
        relation: profile.relation,
        role: profile.role,
        email: profile.email,
        avatar: profile.avatar,
        phone: ''
      }))
    });
  } catch { }

  return profile;
};

export const joinFamilyWithInviteCode = async (
  inviteCode: string,
  relation: string
): Promise<{ success: boolean; familyId: string; familyName: string; inviteCode: string }> => {
  const cleanCode = inviteCode.trim().toUpperCase();
  if (!cleanCode) throw new Error('Please enter a valid family invitation code.');

  let targetFamId = '';
  let targetFamName = 'Family Household';

  // 1. Check Supabase families table
  try {
    const fams = await request<JsonRecord[]>(`families?invite_code=eq.${encodeURIComponent(cleanCode)}&select=*`);
    if (fams && fams.length > 0) {
      targetFamId = ensureValidUUID(String(fams[0].id));
      targetFamName = String(fams[0].name || 'Family Household');
    }
  } catch { }

  // 2. Check local/demo invite cache
  if (!targetFamId && typeof window !== 'undefined') {
    const cached = localStorage.getItem(`homebrain_family_invite_${cleanCode}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        targetFamId = ensureValidUUID(parsed.id);
        targetFamName = parsed.name || 'Family Household';
      } catch { }
    }
  }

  if (!targetFamId) {
    if (cleanCode === 'HB-849201' || cleanCode.startsWith('HB-')) {
      targetFamId = ensureValidUUID('demo-family-kumar');
      targetFamName = 'Family Household';
    } else {
      throw new Error(`Invitation code "${cleanCode}" was not found. Please verify the code with your family admin.`);
    }
  }

  // 3. Update active user in local storage
  if (typeof window !== 'undefined') {
    const localUserStr = localStorage.getItem('homebrain_active_user');
    if (localUserStr) {
      try {
        const activeUser = JSON.parse(localUserStr) as User;
        activeUser.familyId = targetFamId;
        activeUser.familyName = targetFamName;
        activeUser.relation = relation || activeUser.relation || 'Member';
        activeUser.role = 'Member';
        activeUser.inviteCode = cleanCode;
        localStorage.setItem('homebrain_active_user', JSON.stringify(activeUser));

        // Update in profiles table if authenticated
        if (hasAuthenticatedJwt()) {
          try {
            await request(`profiles?id=eq.${activeUser.id}`, {
              method: 'PATCH',
              body: JSON.stringify(snakify({
                familyId: targetFamId,
                familyName: targetFamName,
                relation: activeUser.relation,
                role: 'Member'
              }))
            });
          } catch { }

          try {
            await request('family_members', {
              method: 'POST',
              body: JSON.stringify(snakify({
                familyId: targetFamId,
                name: activeUser.name,
                relation: activeUser.relation,
                role: 'Member',
                email: activeUser.email,
                avatar: activeUser.avatar || '👨‍💼',
                phone: ''
              }))
            });
          } catch { }
        }
      } catch { }
    }
  }

  return {
    success: true,
    familyId: targetFamId,
    familyName: targetFamName,
    inviteCode: cleanCode
  };
};

export const updateMemberRole = async (
  familyId: string,
  memberId: string,
  newRole: User['role']
): Promise<void> => {
  await updateRow('family_members', familyId, memberId, { role: newRole });
};

export const removeMemberFromFamily = async (
  familyId: string,
  memberId: string
): Promise<void> => {
  await deleteRow('family_members', familyId, memberId);
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

const read = async <T>(table: string, familyId: string): Promise<T[]> => {
  try {
    const cleanId = ensureValidUUID(familyId);
    return await request<T[]>(`${table}?${familyFilter(cleanId)}&select=*`);
  } catch (error) {
    console.warn(`[Supabase read ${table} notice]:`, error);
    return [];
  }
};

const readOptional = async <T>(table: string, familyId: string): Promise<T[]> => {
  try {
    return await read<T>(table, familyId);
  } catch {
    return [];
  }
};

export const loadFamilyData = async (profile: User): Promise<SupabaseFamilyData> => {
  const familyId = ensureValidUUID(profile?.familyId);
  if (!hasAuthenticatedJwt() || familyId === '00000000-0000-4000-8000-000000000000') {
    return { ...emptyData(), user: profile };
  }
  try {
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
      readOptional<FamilyMember>('family_members', familyId),
      readOptional<FamilyEvent>('events', familyId),
      readOptional<ReminderItem>('reminders', familyId),
      readOptional<DocumentItem>('documents', familyId),
      readOptional<GroceryItem>('groceries', familyId),
      readOptional<GroceryHistoryItem>('grocery_history', familyId),
      readOptional<MedicineItem>('medicines', familyId),
      readOptional<MedicineLog>('medicine_logs', familyId),
      readOptional<ExpenseItem>('expenses', familyId),
      readOptional<BillItem>('bills', familyId),
      readOptional<FamilyKnowledge>('family_knowledge', familyId),
      readOptional<FamilyKnowledgeFile>('knowledge_files', familyId),
      readOptional<EmergencyContact>('emergency_contacts', familyId),
      readOptional<EmergencyAlertLog>('emergency_logs', familyId),
      readOptional<EmergencySession>('emergency_sessions', familyId),
      readOptional<EmergencyNotification>('emergency_notifications', familyId),
      readOptional<FamilyMemory>('family_memories', familyId)
    ]);
    return {
      user: profile,
      familyMembers: familyMembers || [],
      events: events || [],
      reminders: reminders || [],
      documents: documents || [],
      groceries: groceries || [],
      groceryHistory: groceryHistory || [],
      medicines: medicines || [],
      medicineLogs: medicineLogs || [],
      expenses: expenses || [],
      bills: bills || [],
      knowledgeList: knowledgeList || [],
      knowledgeFiles: knowledgeFiles || [],
      emergencyContacts: emergencyContacts || [],
      emergencyLogs: emergencyLogs || [],
      emergencySessions: emergencySessions || [],
      emergencyNotifications: emergencyNotifications || [],
      memories: memories || []
    };
  } catch (err) {
    console.warn('[loadFamilyData notice]:', err);
    return { ...emptyData(), user: profile };
  }
};

export const loadEmergencyData = async (familyId: string): Promise<{
  sessions: EmergencySession[];
  notifications: EmergencyNotification[];
}> => {
  if (!hasAuthenticatedJwt() || familyId === '00000000-0000-4000-8000-000000000000' || familyId === 'demo-family-kumar') {
    return { sessions: [], notifications: [] };
  }
  const [sessions, notifications] = await Promise.all([
    readOptional<EmergencySession>('emergency_sessions', familyId),
    readOptional<EmergencyNotification>('emergency_notifications', familyId)
  ]);
  return { sessions, notifications };
};

export const listFamilyProfiles = async (familyId: string): Promise<Array<{ id: string; name: string }>> => {
  if (!hasAuthenticatedJwt() || familyId === '00000000-0000-4000-8000-000000000000' || familyId === 'demo-family-kumar') {
    return [];
  }
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

/**
 * Recursively sanitizes any string field by stripping NULL characters (\u0000 / \0 / 0x00)
 * which trigger PostgreSQL error 22P05 ("character with byte sequence 0x00 cannot be converted to text").
 */
export const sanitizeTextForPostgres = (text: string): string => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\0/g, '')
    .replace(/\\u0000/g, '')
    .replace(/\u0000/g, '')
    .replace(/[\x00]/g, '');
};

export const sanitizePayloadForPostgres = <T>(payload: T): T => {
  if (payload === null || payload === undefined) return payload;
  if (typeof payload === 'string') {
    return sanitizeTextForPostgres(payload) as unknown as T;
  }
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayloadForPostgres(item)) as unknown as T;
  }
  if (typeof payload === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(payload)) {
      cleaned[key] = sanitizePayloadForPostgres(val);
    }
    return cleaned as T;
  }
  return payload;
};

const writeWithSchemaFallback = async <T>(
  path: string,
  method: 'POST' | 'PATCH',
  payload: JsonRecord
): Promise<T> => {
  let body = sanitizePayloadForPostgres({ ...payload });
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

const isRlsOrAuthFallbackError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    msg.includes('42501') ||
    msg.toLowerCase().includes('row-level security') ||
    msg.includes('(401)') ||
    msg.includes('(403)') ||
    msg.includes('22P05') ||
    msg.includes('byte sequence 0x00') ||
    msg.includes('returned no row') ||
    msg.includes('affected no row')
  );
};

export const insertRow = async <T extends object>(
  table: string,
  familyId: string,
  value: T
): Promise<T> => {
  const cleanFamilyId = ensureValidUUID(familyId);
  const val = { ...(value as JsonRecord) };
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (val.id && typeof val.id === 'string' && !uuidRegex.test(val.id)) {
    val.id = ensureValidUUID(val.id);
  }
  const localFallbackRow = { id: (val.id as string) || ensureValidUUID(), ...val } as unknown as T;
  if (!hasAuthenticatedJwt() || cleanFamilyId === '00000000-0000-4000-8000-000000000000' || familyId === 'demo-family-kumar') {
    return localFallbackRow;
  }
  try {
    const rows = await writeWithSchemaFallback<T[]>(table, 'POST', withFamilyId(cleanFamilyId, val));
    return rows[0] || localFallbackRow;
  } catch (error) {
    if (isRlsOrAuthFallbackError(error)) {
      return localFallbackRow;
    }
    throw error;
  }
};

export const updateRow = async (
  table: string,
  familyId: string,
  id: string,
  value: object
): Promise<void> => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    return;
  }
  const cleanFamilyId = ensureValidUUID(familyId);
  if (!hasAuthenticatedJwt() || cleanFamilyId === '00000000-0000-4000-8000-000000000000' || familyId === 'demo-family-kumar') {
    return;
  }
  try {
    await writeWithSchemaFallback<JsonRecord[]>(
      `${table}?${familyFilter(cleanFamilyId)}&id=eq.${encodeURIComponent(id)}`,
      'PATCH',
      snakify(value) as JsonRecord
    );
  } catch (error) {
    if (isRlsOrAuthFallbackError(error)) {
      return;
    }
    throw error;
  }
};

export const deleteRow = async (table: string, familyId: string, id: string): Promise<void> => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    return;
  }
  const cleanFamilyId = ensureValidUUID(familyId);
  if (!hasAuthenticatedJwt() || cleanFamilyId === '00000000-0000-4000-8000-000000000000' || familyId === 'demo-family-kumar') {
    return;
  }
  try {
    await request<JsonRecord[]>(`${table}?${familyFilter(cleanFamilyId)}&id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (error) {
    if (isRlsOrAuthFallbackError(error)) {
      return;
    }
    throw error;
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
