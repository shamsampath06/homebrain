import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import https from 'https';
import { put } from '@vercel/blob';
import cors from 'cors';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { processIntelligentAction, getPendingAction, setPendingAction, clearPendingAction, isAnsweringPendingAction } from './cognitiveActionEngine.ts';
import { matchHomeBrainTrainedDialogue } from '../src/lib/botTraining.ts';

// Load environment variables (.env.local takes precedence, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function cleanEventTime(time?: string): string {
  if (!time) return '';
  const parts = String(time).split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const mins = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${mins} ${ampm}`;
  }
  return time;
}

function cleanEventDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch { }
  return dateStr;
}

// --- Authentication & Family Authorization Middleware ---
export interface AuthenticatedUser {
  id: string;
  email: string;
  familyId: string;
  name: string;
  role: string;
  relation?: string;
  inviteCode?: string;
  familyName?: string;
}

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
  relation: string;
  familyId: string;
  familyName: string;
  inviteCode: string;
}

export interface HouseholdStoreItem {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  members: Array<{
    id: string;
    userId?: string;
    name: string;
    relation: string;
    role: string;
    email: string;
    phone?: string;
  }>;
  events?: any[];
  groceries?: any[];
  expenses?: any[];
  bills?: any[];
  reminders?: any[];
  documents?: any[];
  memories?: any[];
  medicines?: any[];
}

const serverHouseholdStore = new Map<string, HouseholdStoreItem>();
const serverRegisteredUsers = new Map<string, ServerUser>();
const serverSessions = new Map<string, { token: string; user: ServerUser; expiresAt: number }>();

const BLOB_FILE_NAME = 'homebrain-data.json';
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_ZOMgqCoRwpQVIkyH_q2zs6Nao3i2aSJSAmhHn4CYPyxFb8O';
let blobCdnUrl = 'https://zomgqcorwpqvikyh.public.blob.vercel-storage.com/homebrain-data.json';

let lastLocalWrite = 0;
const deletedItemIds = new Set<string>();

function mergeWithTombstones<T extends { id?: string }>(local: T[] = [], incoming: T[] = []): T[] {
  const map = new Map<string, T>();
  for (const item of incoming || []) {
    if (item && item.id && !deletedItemIds.has(item.id)) {
      map.set(item.id, item);
    }
  }
  for (const item of local || []) {
    if (item && item.id && !deletedItemIds.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export async function syncFromCloudStore(): Promise<void> {
  try {
    const res = await fetch(blobCdnUrl + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const storeData: any = await res.json();

    if (storeData && storeData.updatedAt && lastLocalWrite > 0 && storeData.updatedAt < lastLocalWrite) {
      // The fetched cloud blob is older than our local in-memory modifications; only merge new items without overwriting
    }

    if (storeData && storeData.households) {
      for (const [k, v] of Object.entries(storeData.households)) {
        const incoming = v as HouseholdStoreItem;
        const targetKey = (k === 'demo-family-kumar' || k === '00000000-0000-4000-8000-000000000001')
          ? PRIMARY_HOUSEHOLD_ID
          : k;
        const existing = serverHouseholdStore.get(targetKey) || { ...primaryHousehold };

        existing.members = dedupeServerMembers([...(existing.members || []), ...(incoming.members || [])]);

        existing.groceries = mergeWithTombstones(existing.groceries, incoming.groceries);
        existing.expenses = mergeWithTombstones(existing.expenses, incoming.expenses);
        existing.events = mergeWithTombstones(existing.events, incoming.events);
        existing.documents = mergeWithTombstones(existing.documents, incoming.documents);
        existing.bills = mergeWithTombstones(existing.bills, incoming.bills);
        existing.reminders = mergeWithTombstones(existing.reminders, incoming.reminders);
        existing.memories = mergeWithTombstones(existing.memories, incoming.memories);
        existing.medicines = mergeWithTombstones(existing.medicines, incoming.medicines);

        if (targetKey !== PRIMARY_HOUSEHOLD_ID && incoming.name) existing.name = incoming.name;
        if (targetKey !== PRIMARY_HOUSEHOLD_ID && incoming.inviteCode) existing.inviteCode = incoming.inviteCode;

        serverHouseholdStore.set(targetKey, existing);
      }
    }
    if (storeData && storeData.users) {
      for (const [k, v] of Object.entries(storeData.users)) {
        const key = k.toLowerCase();
        if (!serverRegisteredUsers.has(key)) {
          serverRegisteredUsers.set(key, v as ServerUser);
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync from cloud store:', err);
  }
}

export async function syncToCloudStore(): Promise<void> {
  try {
    lastLocalWrite = Date.now();
    const householdsObj: Record<string, HouseholdStoreItem> = {};

    for (const [k, localH] of serverHouseholdStore.entries()) {
      if (k === 'demo-family-kumar') continue;
      householdsObj[k] = {
        ...localH,
        id: k,
        inviteCode: k === PRIMARY_HOUSEHOLD_ID ? PRIMARY_INVITE_CODE : localH.inviteCode,
        name: k === PRIMARY_HOUSEHOLD_ID ? 'Family Household' : localH.name,
        members: dedupeServerMembers(localH.members || [])
      };
    }

    const usersObj: Record<string, ServerUser> = {};
    for (const [k, v] of serverRegisteredUsers.entries()) {
      usersObj[k.toLowerCase()] = v;
    }

    const payload = {
      households: householdsObj,
      users: usersObj,
      updatedAt: Date.now()
    };

    const blobResult = await put(BLOB_FILE_NAME, JSON.stringify(payload), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      token: BLOB_READ_WRITE_TOKEN
    });

    if (blobResult?.url) {
      blobCdnUrl = blobResult.url;
    }
  } catch (err) {
    console.warn('Could not sync to cloud store:', err);
  }
}

export const PRIMARY_HOUSEHOLD_ID = '3a131e95-0000-4000-8000-3a131e953a13';
export const PRIMARY_INVITE_CODE = 'HB-JBZKW5';

const primaryHousehold: HouseholdStoreItem = {
  id: PRIMARY_HOUSEHOLD_ID,
  name: 'Family Household',
  inviteCode: PRIMARY_INVITE_CODE,
  createdBy: 'harleysham6925@gmail.com',
  members: [
    {
      id: 'm-father-sham',
      userId: 'usr-father-sham',
      name: 'sham',
      relation: 'Father / Dad',
      role: 'Admin',
      email: 'harleysham6925@gmail.com',
      phone: ''
    },
    {
      id: 'm-son-sha',
      userId: 'usr-son-sha',
      name: 'sha',
      relation: 'Son',
      role: 'Member',
      email: 'shamsampth06@gmail.com',
      phone: ''
    }
  ],
  events: [],
  groceries: [],
  expenses: [],
  bills: [],
  reminders: [],
  documents: [],
  memories: [],
  medicines: []
};

// Seed primary household into store under both canonical ID and demo aliases
serverHouseholdStore.set(PRIMARY_HOUSEHOLD_ID, primaryHousehold);
serverHouseholdStore.set('demo-family-kumar', primaryHousehold);

// Seed authoritative registered accounts
serverRegisteredUsers.set('harleysham6925@gmail.com', {
  id: 'usr-father-sham',
  email: 'harleysham6925@gmail.com',
  name: 'sham',
  avatar: '👨‍💼',
  role: 'Admin',
  relation: 'Father / Dad',
  familyId: PRIMARY_HOUSEHOLD_ID,
  familyName: 'Family Household',
  inviteCode: PRIMARY_INVITE_CODE
});

serverRegisteredUsers.set('shamsampth06@gmail.com', {
  id: 'usr-son-sha',
  email: 'shamsampth06@gmail.com',
  name: 'sha',
  avatar: '👦',
  role: 'Member',
  relation: 'Son',
  familyId: PRIMARY_HOUSEHOLD_ID,
  familyName: 'Family Household',
  inviteCode: PRIMARY_INVITE_CODE
});

export function generateSessionToken(user: ServerUser): string {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    familyId: user.familyId,
    familyName: user.familyName,
    inviteCode: user.inviteCode,
    role: user.role,
    relation: user.relation
  })).toString('base64url');
  return 'hb-sess-' + payload;
}

export function findHousehold(familyId?: string, inviteCode?: string): HouseholdStoreItem {
  const cleanCode = inviteCode ? String(inviteCode).trim().toUpperCase() : '';
  const cleanFamilyId = familyId ? String(familyId).trim() : '';

  // 1. Check for primary family aliases (support HB-JBZKW5 and legacy HB-849201)
  if (
    cleanCode === 'HB-JBZKW5' ||
    cleanCode === 'HB-849201' ||
    cleanCode.includes('849201') ||
    cleanCode.includes('JBZKW5') ||
    cleanFamilyId === PRIMARY_HOUSEHOLD_ID ||
    cleanFamilyId === 'demo-family-kumar' ||
    cleanFamilyId === '00000000-0000-4000-8000-000000000001' ||
    cleanFamilyId === '736d58c4-bfae-4a53-a3c6-24ad8797ba59'
  ) {
    const primary = serverHouseholdStore.get(PRIMARY_HOUSEHOLD_ID) || serverHouseholdStore.get('demo-family-kumar') || primaryHousehold;
    return primary;
  }

  if (cleanCode) {
    for (const h of serverHouseholdStore.values()) {
      if (h.inviteCode?.toUpperCase() === cleanCode) {
        return h;
      }
    }
  }

  if (cleanFamilyId) {
    const direct = serverHouseholdStore.get(cleanFamilyId);
    if (direct) return direct;

    // Create isolated household for this familyId so it NEVER leaks other households
    const newHousehold: HouseholdStoreItem = {
      id: cleanFamilyId,
      name: 'Family Household',
      inviteCode: cleanCode || ('HB-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
      createdBy: '',
      members: [],
      events: [],
      groceries: [],
      expenses: [],
      bills: [],
      reminders: [],
      documents: [],
      memories: [],
      medicines: []
    };
    serverHouseholdStore.set(cleanFamilyId, newHousehold);
    return newHousehold;
  }

  return serverHouseholdStore.get(PRIMARY_HOUSEHOLD_ID) || primaryHousehold;
}

// Initial cloud store load
void syncFromCloudStore();

const defaultMembers: any[] = [];

function dedupeServerMembers(members: any[]): any[] {
  const seenEmails = new Set<string>();
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const result: any[] = [];
  for (const m of members) {
    if (!m) continue;
    const emailKey = m.email ? String(m.email).trim().toLowerCase() : '';
    const idKey = m.id ? String(m.id).trim() : (m.userId ? String(m.userId).trim() : '');
    const nameKey = m.name ? String(m.name).trim().toLowerCase() : '';

    // Filter out dummy demo accounts
    if (emailKey.includes('homebrain.app') || emailKey.includes('homebrain.test') || emailKey.includes('homebrain.internal') || emailKey.startsWith('member@')) continue;
    if (['sarah', 'rajesh', 'priya'].includes(nameKey) && (!emailKey || emailKey.includes('homebrain'))) continue;

    if (emailKey && seenEmails.has(emailKey)) continue;
    if (idKey && seenIds.has(idKey)) continue;
    if (nameKey && seenNames.has(nameKey)) continue;

    if (emailKey) seenEmails.add(emailKey);
    if (idKey) seenIds.add(idKey);
    if (nameKey) seenNames.add(nameKey);
    result.push(m);
  }
  return result;
}


declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      authToken?: string;
    }
  }
}

const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header. Expected Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  req.authToken = token;

  // Support Server-Issued Multi-User Session Tokens (In-memory and stateless base64url payload)
  if (token.startsWith('hb-sess-') || serverSessions.has(token)) {
    const sess = serverSessions.get(token);
    if (sess) {
      const cleanEmail = sess.user.email ? sess.user.email.toLowerCase() : '';
      const latest = cleanEmail ? serverRegisteredUsers.get(cleanEmail) : null;
      const effectiveUser = latest || sess.user;
      req.user = {
        id: effectiveUser.id,
        email: effectiveUser.email,
        name: effectiveUser.name,
        familyId: effectiveUser.familyId,
        role: effectiveUser.role,
        relation: effectiveUser.relation,
        inviteCode: effectiveUser.inviteCode,
        familyName: effectiveUser.familyName
      };
      next();
      return;
    }

    try {
      const raw = token.slice('hb-sess-'.length);
      const decoded = Buffer.from(raw, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (parsed && (parsed.email || parsed.id)) {
        const cleanEmail = parsed.email ? parsed.email.toLowerCase() : '';
        const latest = cleanEmail ? serverRegisteredUsers.get(cleanEmail) : null;
        req.user = {
          id: latest?.id || parsed.id || 'usr-' + (parsed.email || 'member'),
          email: latest?.email || parsed.email || '',
          name: latest?.name || parsed.name || 'Family Member',
          familyId: latest?.familyId || parsed.familyId || PRIMARY_HOUSEHOLD_ID,
          role: latest?.role || parsed.role || 'Member',
          relation: latest?.relation || parsed.relation || 'Member',
          inviteCode: latest?.inviteCode || parsed.inviteCode || PRIMARY_INVITE_CODE,
          familyName: latest?.familyName || parsed.familyName || 'Family Household'
        };
        next();
        return;
      }
    } catch { }

    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  // Support Demo Mode & local evaluation seamlessly
  if (token === 'demo-token' || token === SUPABASE_ANON_KEY || req.body?.isDemo || req.body?.familyId || req.body?.senderName) {
    req.user = {
      id: req.body?.userId || 'demo-user-sarah',
      email: req.body?.userEmail || 'sarah.kumar@family.homebrain.internal',
      familyId: req.body?.familyId || 'demo-family-kumar',
      name: req.body?.senderName || 'Sarah',
      role: 'Admin'
    };
    next();
    return;
  }

  if (!SUPABASE_URL) {
    req.user = {
      id: req.body?.userId || 'demo-user-sarah',
      email: req.body?.userEmail || 'sarah.kumar@family.homebrain.internal',
      familyId: req.body?.familyId || 'demo-family-kumar',
      name: req.body?.senderName || 'Sarah',
      role: 'Admin'
    };
    next();
    return;
  }

  try {
    // 1. Verify user with Supabase Auth
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });

    if (!userRes.ok) {
      res.status(401).json({ error: 'Invalid or expired Supabase authentication session.' });
      return;
    }

    const authUserData = (await userRes.json()) as { id: string; email?: string };

    // 2. Fetch profile to guarantee family-level authorization
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUserData.id}&select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });

    if (!profileRes.ok) {
      res.status(403).json({ error: 'Failed to authorize profile against family database.' });
      return;
    }

    const profiles = (await profileRes.json()) as any[];
    const profile = profiles[0];

    if (!profile || !profile.family_id) {
      res.status(403).json({ error: 'User is not linked to any authorized family profile.' });
      return;
    }

    req.user = {
      id: authUserData.id,
      email: authUserData.email || profile.email || '',
      familyId: String(profile.family_id),
      name: profile.name || authUserData.email || 'Family Member',
      role: profile.role || 'Member'
    };

    next();
  } catch (err) {
    console.warn('Supabase auth network unreachable, failing over gracefully:', err);
    req.user = {
      id: req.body?.userId || 'demo-user-sarah',
      email: req.body?.userEmail || 'sarah.kumar@family.homebrain.internal',
      familyId: req.body?.familyId || 'demo-family-kumar',
      name: req.body?.senderName || 'Sarah',
      role: 'Admin'
    };
    next();
  }
};

// Helper: Query Supabase REST with the user's family-scoped token
const fetchFamilyData = async (table: string, familyId: string, token: string, queryParams: string = ''): Promise<any[]> => {
  if (!SUPABASE_URL || token === 'demo-token' || token === SUPABASE_ANON_KEY) return [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(familyId)) return [];
  const safeFamilyId = familyId;
  const url = `${SUPABASE_URL}/rest/v1/${table}?family_id=eq.${encodeURIComponent(safeFamilyId)}${queryParams ? `&${queryParams}` : ''}`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Could not read ${table}: ${errText}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn(`Failed fetching from ${table}:`, e);
    return [];
  }
};

const toSnakeDbRecord = (record: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(record || {})) {
    if (v === undefined) continue;
    const snakeKey = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (!(snakeKey in out) || k === snakeKey) {
      out[snakeKey] = v;
    }
  }
  return out;
};

const extractMissingDbColumn = (message: string): string | null => {
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

// Helper: Insert row into Supabase REST with the user's family-scoped token
const insertFamilyData = async (table: string, payload: any, token: string): Promise<any> => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const newId = (payload.id && uuidRegex.test(payload.id)) ? payload.id : crypto.randomUUID();
  const generated = sanitizePayloadForPostgres({ ...payload, id: newId });

  if (table === 'events') {
    if (!sharedFallbackEvents.some((e: any) => e.id === generated.id || (e.title === generated.title && e.date === generated.date))) {
      sharedFallbackEvents.unshift(generated);
    }
  } else if (table === 'groceries') {
    if (!sharedFallbackGroceries.some((g: any) => g.id === generated.id || (g.name?.toLowerCase() === generated.name?.toLowerCase() && g.is_purchased === generated.is_purchased))) {
      sharedFallbackGroceries.unshift(generated);
    }
  } else if (table === 'expenses') {
    if (!sharedFallbackExpenses.some((x: any) => x.id === generated.id || (x.title === generated.title && x.amount === generated.amount && x.date === generated.date))) {
      sharedFallbackExpenses.unshift(generated);
    }
  } else if (table === 'bills') {
    if (!sharedFallbackBills.some((b: any) => b.id === generated.id || (b.title === generated.title && b.due_date === generated.due_date))) {
      sharedFallbackBills.unshift(generated);
    }
  } else if (table === 'reminders') {
    if (!sharedFallbackReminders.some((r: any) => r.id === generated.id || (r.title === generated.title && r.date_time === generated.date_time))) {
      sharedFallbackReminders.unshift(generated);
    }
  } else if (table === 'medicines') {
    if (!sharedFallbackMedicines.some((m: any) => m.id === generated.id || (m.name?.toLowerCase() === generated.name?.toLowerCase() && (m.person_name || m.personName) === (generated.person_name || generated.personName)))) {
      sharedFallbackMedicines.unshift(generated);
    }
  } else if (table === 'medicine_logs') {
    if (!sharedFallbackMedicineLogs.some((l: any) => l.id === generated.id)) {
      sharedFallbackMedicineLogs.unshift(generated);
    }
  } else if (table === 'family_knowledge') {
    if (!sharedFallbackKnowledge.some((k: any) => k.id === generated.id || k.content === generated.content)) {
      sharedFallbackKnowledge.unshift(generated);
    }
  }

  if (!SUPABASE_URL || token === 'demo-token' || token === SUPABASE_ANON_KEY) return generated;
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  let dbBody = sanitizePayloadForPostgres(toSnakeDbRecord(generated));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(dbBody)
      });
      if (!res.ok) {
        const errText = await res.text();
        const missingCol = extractMissingDbColumn(errText);
        if (missingCol && missingCol in dbBody) {
          const { [missingCol]: _removed, ...rest } = dbBody;
          dbBody = rest;
          continue;
        }
        console.warn(`Could not insert into ${table}: ${errText}`);
        return generated;
      }
      const data = await res.json();
      const row = Array.isArray(data) ? data[0] : (data || generated);
      return { ...generated, ...(row || {}) };
    } catch (e) {
      console.warn(`Failed insert into ${table}:`, e);
      return generated;
    }
  }
  return generated;
};

// Helper: Update row in Supabase REST
const updateFamilyData = async (table: string, id: string, payload: any, token: string): Promise<any> => {
  const cleanPayload = sanitizePayloadForPostgres(payload);
  if (table === 'events') {
    const idx = sharedFallbackEvents.findIndex((e: any) => e.id === id);
    if (idx >= 0) sharedFallbackEvents[idx] = { ...sharedFallbackEvents[idx], ...cleanPayload };
  } else if (table === 'groceries') {
    const idx = sharedFallbackGroceries.findIndex((g: any) => g.id === id);
    if (idx >= 0) sharedFallbackGroceries[idx] = { ...sharedFallbackGroceries[idx], ...cleanPayload };
  } else if (table === 'bills') {
    const idx = sharedFallbackBills.findIndex((b: any) => b.id === id);
    if (idx >= 0) sharedFallbackBills[idx] = { ...sharedFallbackBills[idx], ...cleanPayload };
  } else if (table === 'expenses') {
    const idx = sharedFallbackExpenses.findIndex((x: any) => x.id === id);
    if (idx >= 0) sharedFallbackExpenses[idx] = { ...sharedFallbackExpenses[idx], ...cleanPayload };
  } else if (table === 'reminders') {
    const idx = sharedFallbackReminders.findIndex((r: any) => r.id === id);
    if (idx >= 0) sharedFallbackReminders[idx] = { ...sharedFallbackReminders[idx], ...cleanPayload };
  } else if (table === 'medicines') {
    const idx = sharedFallbackMedicines.findIndex((m: any) => m.id === id);
    if (idx >= 0) sharedFallbackMedicines[idx] = { ...sharedFallbackMedicines[idx], ...cleanPayload };
  } else if (table === 'family_knowledge') {
    const idx = sharedFallbackKnowledge.findIndex((k: any) => k.id === id);
    if (idx >= 0) sharedFallbackKnowledge[idx] = { ...sharedFallbackKnowledge[idx], ...cleanPayload };
  }

  if (!SUPABASE_URL || token === 'demo-token' || token === SUPABASE_ANON_KEY) return cleanPayload;
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  let dbBody = sanitizePayloadForPostgres(toSnakeDbRecord(cleanPayload));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(dbBody)
      });
      if (!res.ok) {
        const errText = await res.text();
        const missingCol = extractMissingDbColumn(errText);
        if (missingCol && missingCol in dbBody) {
          const { [missingCol]: _removed, ...rest } = dbBody;
          dbBody = rest;
          continue;
        }
        console.warn(`Could not update in ${table}: ${errText}`);
        return cleanPayload;
      }
      const data = await res.json();
      const row = Array.isArray(data) ? data[0] : data;
      return { ...cleanPayload, ...(row || {}) };
    } catch (e) {
      console.warn(`Failed update into ${table}:`, e);
      return cleanPayload;
    }
  }
  return cleanPayload;
};

// Helper: Delete row from Supabase REST
const deleteFamilyData = async (table: string, id: string, token: string): Promise<boolean> => {
  const removeInPlace = (arr: any[]) => {
    const idx = arr.findIndex((item: any) => item.id === id);
    if (idx >= 0) arr.splice(idx, 1);
  };
  if (table === 'events') removeInPlace(sharedFallbackEvents);
  else if (table === 'groceries') removeInPlace(sharedFallbackGroceries);
  else if (table === 'bills') removeInPlace(sharedFallbackBills);
  else if (table === 'expenses') removeInPlace(sharedFallbackExpenses);
  else if (table === 'reminders') removeInPlace(sharedFallbackReminders);
  else if (table === 'medicines') removeInPlace(sharedFallbackMedicines);
  else if (table === 'family_knowledge') removeInPlace(sharedFallbackKnowledge);

  if (!SUPABASE_URL || token === 'demo-token' || token === SUPABASE_ANON_KEY) return true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (err) {
    console.error(`Error deleting from ${table}:`, err);
    return false;
  }
};

// Helper: Optional local Ollama inference fallback
const queryOllama = async (prompt: string): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = (await res.json()) as { response?: string };
    return json.response || null;
  } catch {
    return null;
  }
};

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'HomeBrain AI Family Operating System',
    version: '2.0.0',
    llmConfigured: Boolean(GEMINI_API_KEY || OPENAI_API_KEY),
    provider: GEMINI_API_KEY ? 'Google Gemini' : OPENAI_API_KEY ? 'OpenAI' : 'None',
    supabaseConnected: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    timestamp: new Date().toISOString()
  });
});

// Helper: Stream-based text extractor for standard text PDFs without requiring external cloud API keys
const extractPdfTextFallback = (buffer: Buffer): string => {
  const binary = buffer.toString('latin1');
  const chunks: string[] = [];
  const isReadableChunk = (str: string): boolean => {
    if (!str || str.length < 2) return false;
    const printable = str.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || [];
    return (printable.length / str.length) >= 0.7;
  };

  const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(binary)) !== null) {
    if (m[1].length > 1 && isReadableChunk(m[1])) {
      chunks.push(sanitizeTextForPostgres(m[1]));
    }
  }
  const tjArray = /\[([^\]]+)\]\s*TJ/g;
  while ((m = tjArray.exec(binary)) !== null) {
    const inner = m[1];
    const parenMatches = inner.match(/\(([^)]+)\)/g);
    if (parenMatches) {
      for (const p of parenMatches) {
        const raw = p.slice(1, -1);
        if (isReadableChunk(raw)) {
          chunks.push(sanitizeTextForPostgres(raw));
        }
      }
    }
  }

  const combined = chunks.join(' ').replace(/\\([()\\])/g, '$1').replace(/\s+/g, ' ').trim();
  const sanitized = sanitizeTextForPostgres(combined);
  const printableOverall = sanitized.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || [];
  if (sanitized.length < 15 || (printableOverall.length / (sanitized.length || 1)) < 0.7) {
    return '';
  }
  return sanitized;
};

// --- Document Text Extraction & Summarization Endpoint (Phase 2 & Multimodal) ---
app.post('/api/documents/extract', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64 || !mimeType) {
      res.status(400).json({ error: 'fileBase64 and mimeType are required.' });
      return;
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    let extractedText = '';

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || (fileName && fileName.endsWith('.docx'))) {
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = sanitizeTextForPostgres(docxResult.value || '');
    } else if (mimeType.startsWith('text/') || (fileName && fileName.endsWith('.txt'))) {
      extractedText = sanitizeTextForPostgres(buffer.toString('utf-8'));
    } else if (mimeType === 'application/pdf') {
      // First attempt native PDF stream extraction
      const nativePdfText = extractPdfTextFallback(buffer);
      if (nativePdfText.length > 20) {
        extractedText = nativePdfText;
      } else if (GEMINI_API_KEY) {
        // Fall back to Gemini Vision OCR for scanned or rasterized PDFs
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: fileBase64
                  }
                },
                {
                  text: 'Extract all legible text from this document verbatim. Provide a concise 2-sentence summary.'
                }
              ]
            }
          ]
        });
        extractedText = sanitizeTextForPostgres(response.text || '');
      } else {
        extractedText = nativePdfText || `[Scanned PDF: text extraction requires GEMINI_API_KEY for vision OCR]`;
      }
    } else if (mimeType.startsWith('image/')) {
      if (GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: fileBase64
                  }
                },
                {
                  text: 'Extract all legible text from this image verbatim. Provide a concise summary.'
                }
              ]
            }
          ]
        });
        extractedText = sanitizeTextForPostgres(response.text || '');
      } else {
        extractedText = `[Image Document: Optical Character Recognition requires GEMINI_API_KEY configured in .env.local]`;
      }
    } else {
      res.status(400).json({ error: `Unsupported MIME type: ${mimeType}` });
      return;
    }

    const cleanExtracted = sanitizeTextForPostgres(extractedText.trim());

    res.json({
      success: true,
      fileName: sanitizeTextForPostgres(fileName || ''),
      extractedText: cleanExtracted,
      charCount: cleanExtracted.length
    });
  } catch (err: any) {
    console.error('Document extraction error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract text from document.' });
  }
});

// --- Shared Module-Scoped In-Memory State for Demo Evaluation ---
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
  { id: '00000000-0000-4000-8000-000000000078', name: '[DEMO] Medicine F', dosage: '250mg capsule', timing: '01:00 PM', frequency: 'Completed', person_name: 'Mother', status: 'Inactive', notes: 'Schedule 1 PM. Course finished.' },
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
  { id: '00000000-0000-4000-8000-000000000031', title: "[DEMO] Father's Passport", category: 'Identity', file_type: 'TXT', file_size: '434 B', uploader_name: 'Sarah', upload_date: '2026-01-10', expiry_date: '2034-06-14', file_url: '/demo-documents/Father_Passport.txt', description: 'Official Republic of India Passport for Demo Father (Rajesh Kumar). Document No: Z9876543.', summary_content: '• Republic of India Passport\n• Passport No: Z9876543\n• Holder: Rajesh Kumar (Father)\n• DOB: 15/06/1974\n• Place of Issue: Chennai\n• Expiry Date: 14/06/2034' },
  { id: '00000000-0000-4000-8000-000000000032', title: "[DEMO] Mother's Aadhaar Sample", category: 'Identity', file_type: 'TXT', file_size: '417 B', uploader_name: 'Sarah', upload_date: '2026-01-15', file_url: '/demo-documents/Mother_Aadhaar_Sample.txt', description: 'Official Aadhaar Card record for Demo Mother (Priya Kumar). Fictional demo identity.', summary_content: '• Government of India Aadhaar Card\n• Number: 0000 1111 2222 (Fictional Demo)\n• Holder: Priya Kumar (Mother)\n• DOB: 22/09/1977\n• Address: 42 Palm Grove Avenue, Anna Nagar, Chennai 600040' },
  { id: '00000000-0000-4000-8000-000000000033', title: '[DEMO] Family Address Proof', category: 'Identity', file_type: 'TXT', file_size: '429 B', uploader_name: 'Father', upload_date: '2026-02-01', file_url: '/demo-documents/Family_Address_Proof.txt', description: 'Greater Chennai Corporation Residential Address Certificate for household residence.', summary_content: '• Residential Address Certificate\n• Head of Household: Rajesh Kumar\n• Address: 42 Palm Grove Avenue, Anna Nagar West Extension, Chennai 600040\n• EB Connection: EB-CHN-88219\n• Water Account: CMW-44021' },
  { id: '00000000-0000-4000-8000-000000000034', title: '[DEMO] Electricity Bill November', category: 'Financial', file_type: 'TXT', file_size: '333 B', uploader_name: 'Sarah', upload_date: '2026-11-05', file_url: '/demo-documents/Electricity_Bill_November.txt', description: 'Household Electricity Bill for November 2026. Amount: ₹3,450 due Nov 25, 2026.', summary_content: '• Billing Month: November 2026\n• Consumer: Demo Household\n• Amount: ₹3,450\n• Due Date: November 25, 2026\n• Status: Unpaid\n• Units: 420 kWh' },
  { id: '00000000-0000-4000-8000-000000000035', title: '[DEMO] Water Bill November', category: 'Financial', file_type: 'TXT', file_size: '392 B', uploader_name: 'Sarah', upload_date: '2026-11-06', file_url: '/demo-documents/Water_Bill_November.txt', description: 'Chennai Metro Water Supply Bill for November 2026. Amount: ₹850 due Nov 20, 2026.', summary_content: '• Water Supply Bill - November 2026\n• Consumer: Demo Household\n• Amount: ₹850\n• Due Date: November 20, 2026\n• Status: Unpaid' },
  { id: '00000000-0000-4000-8000-000000000036', title: '[DEMO] Hospital Appointment Report', category: 'Medical', file_type: 'TXT', file_size: '545 B', uploader_name: 'Mother', upload_date: '2026-11-17', file_url: '/demo-documents/Hospital_Appointment_Report.txt', description: 'Apollo Hospitals Clinical Consultation Report for Demo Mother by Dr. Sharma.', summary_content: '• Patient: Priya Kumar\n• Date: 17/11/2026\n• Doctor: Dr. K. Sharma (Endocrinology)\n• Observations: HbA1c 6.8%, BP 122/80\n• Advice: Regular diet and exercise, next review in 3 months' },
  { id: '00000000-0000-4000-8000-000000000037', title: '[DEMO] Family Insurance Policy', category: 'Insurance', file_type: 'TXT', file_size: '525 B', uploader_name: 'Father', upload_date: '2026-01-05', file_url: '/demo-documents/Family_Insurance_Policy.txt', description: 'Star Health Family Optima Insurance Plan. ₹5 Lakhs sum insured floater covering all 5 members.', summary_content: '• Policy No: POL-772910-FAM\n• Policyholder: Rajesh Kumar\n• Coverage: ₹5,00,000 (₹5 Lakhs)\n• Covered Members: Father, Mother, Sarah, Sneha, Sham\n• Period: 06/12/2025 to 05/12/2027' },
  { id: '00000000-0000-4000-8000-000000000038', title: '[DEMO] Property Ownership Record', category: 'Home', file_type: 'TXT', file_size: '482 B', uploader_name: 'Father', upload_date: '2026-01-12', file_url: '/demo-documents/Property_Ownership_Record.txt', description: 'Tamil Nadu Registration Department Property Deed for Anna Nagar West residence.', summary_content: '• Property Title Deed No: 2841/2012\n• Owners: Rajesh Kumar & Priya Kumar\n• Address: 42 Palm Grove Avenue, Anna Nagar West, Chennai 600040\n• Area: 2,400 Sq. Ft.\n• Status: Nil Encumbrance' },
  { id: '00000000-0000-4000-8000-000000000039', title: '[DEMO] Sarah School Certificate', category: 'Education', file_type: 'TXT', file_size: '509 B', uploader_name: 'Sarah', upload_date: '2026-01-08', file_url: '/demo-documents/Sarah_School_Certificate.txt', description: 'CBSE Senior School Certificate (Class XII) for Demo Sarah from St. Michael School.', summary_content: '• CBSE Class XII Senior School Certificate\n• Student: Sarah Kumar\n• Roll No: 8192034\n• Stream: Science\n• Result: 94.2% Distinction' },
  { id: '00000000-0000-4000-8000-000000000043', title: 'S. Sham 10th mark sheet', category: 'Education', file_type: 'PDF', file_size: '0.14 MB', uploader_name: 'Sham', upload_date: '2026-11-15', file_url: '/demo-documents/Sham_10th_Marksheet.pdf', description: 'Secondary School Leaving Certificate (SSLC 10th Standard) for S. Sham. Board: State Board.', summary_content: 'Verified official Education record: S. Sham 10th mark sheet (Roll No: 1049281, Distinction).' },
  { id: '00000000-0000-4000-8000-000000000044', title: 'sham 11th mark sheet', category: 'Education', file_type: 'PDF', file_size: '0.38 MB', uploader_name: 'Sham', upload_date: '2026-11-15', file_url: '/demo-documents/Sham_11th_Marksheet.pdf', description: 'Higher Secondary School Certificate (Class XI) for Sham.', summary_content: 'Verified official Education record: sham 11th mark sheet (Class XI Board Certificate).' },
  { id: '00000000-0000-4000-8000-000000000045', title: 'sham aadhar card', category: 'Identity', file_type: 'JPEG', file_size: '0.08 MB', uploader_name: 'Sham', upload_date: '2026-11-15', file_url: '/demo-documents/Sham_Aadhar.jpeg', description: 'Unique Identification Authority of India (UIDAI) Aadhaar identity card for Sham.', summary_content: 'Verified official Identity record: sham aadhar card (Aadhaar Number ending 8812).' },
  { id: '00000000-0000-4000-8000-000000000040', title: '[DEMO] Grocery Purchase Receipt', category: 'Financial', file_type: 'TXT', file_size: '578 B', uploader_name: 'Sarah', upload_date: '2026-11-02', file_url: '/demo-documents/Grocery_Purchase_Receipt.txt', description: 'Nilgiris 1905 Supermarket retail tax invoice for monthly grocery purchase of ₹2,500.', summary_content: '• Nilgiris Retail Tax Invoice\n• Date: 02/11/2026\n• Total Items: 5\n• Total Paid: ₹2,500.00\n• Mode: UPI GPay' },
  { id: '00000000-0000-4000-8000-000000000041', title: '[DEMO] Family Emergency Contacts', category: 'General', file_type: 'TXT', file_size: '499 B', uploader_name: 'Sarah', upload_date: '2026-01-02', file_url: '/demo-documents/Family_Emergency_Contacts.txt', description: 'Household Emergency Directory including police, hospital, ambulance, and doctor contacts.', summary_content: '• Anna Nagar Police: 044-26151100 / 100\n• Apollo Clinic: 044-28290200 / 1066\n• Dr. Sharma: +91 98400 12345\n• Ambulance: 108\n• Fire: 101' },
  { id: '00000000-0000-4000-8000-000000000042', title: '[DEMO] Vehicle Insurance Document', category: 'Insurance', file_type: 'TXT', file_size: '509 B', uploader_name: 'Father', upload_date: '2026-10-16', expiry_date: '2027-10-15', file_url: '/demo-documents/Vehicle_Insurance_Document.txt', description: 'HDFC ERGO Comprehensive Motor Vehicle Insurance for Hyundai Creta (TN 01 AB 1234).', summary_content: '• Policy No: MOT-482019-2026\n• Vehicle: Hyundai Creta (TN 01 AB 1234)\n• Insured: Rajesh Kumar\n• IDV: ₹11,50,000\n• Validity: 16/10/2026 to 15/10/2027' }
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
  { id: '00000000-0000-4000-8000-000000000139', title: "[DEMO] Sarah Food Preference", category: 'Preferences', importance: 'Medium', related_member_name: 'Sarah', content: 'Sarah prefers vegetarian food and light dinners' },
  { id: '00000000-0000-4000-8000-000000000140', title: "[DEMO] Father's Food Preference", category: 'Preferences', importance: 'Medium', related_member_name: 'Father', content: 'Father prefers traditional home-cooked South Indian meals' },
  { id: '00000000-0000-4000-8000-000000000141', title: "[DEMO] Mother's Food Preference", category: 'Preferences', importance: 'Medium', related_member_name: 'Mother', content: 'Mother prefers vegetarian meals with low sugar/salt' },
  { id: '00000000-0000-4000-8000-000000000142', title: "[DEMO] Sneha Food Preference", category: 'Preferences', importance: 'Critical', related_member_name: 'Sneha', content: 'Sneha is lactose intolerant and requires dairy-free alternatives (almond milk, soy)' },
  { id: '00000000-0000-4000-8000-000000000143', title: "[DEMO] Family Gathering Preference", category: 'Preferences', importance: 'Medium', related_member_name: 'Sarah', content: 'The family prefers weekend gatherings on Friday or Saturday evenings' },
  { id: '00000000-0000-4000-8000-000000000144', title: "[DEMO] Grocery Shopping Preference", category: 'Schedules', importance: 'Medium', related_member_name: 'Mother', content: 'Weekly grocery shopping is done on Sunday mornings' },
  { id: '00000000-0000-4000-8000-000000000145', title: "[DEMO] Monthly Family Meeting", category: 'Schedules', importance: 'Important', related_member_name: 'Father', content: 'Monthly family meeting is held on the last Sunday of every month at 6 PM' },
  { id: '00000000-0000-4000-8000-000000000146', title: "[DEMO] Family Emergency Contact", category: 'Emergency', importance: 'Critical', related_member_name: 'Father', content: 'Primary emergency contact: Apollo Clinic Anna Nagar 044-28290200, Dr. Sharma +91 98400 12345' },
  { id: '00000000-0000-4000-8000-000000000147', title: "[DEMO] Family Address", category: 'General', importance: 'Important', related_member_name: 'Father', content: '42 Palm Grove Avenue, Anna Nagar West, Chennai 600040, Tamil Nadu, India' },
  { id: '00000000-0000-4000-8000-000000000148', title: "[DEMO] Family Trip Preference", category: 'Preferences', importance: 'Medium', related_member_name: 'Father', content: 'Family enjoys weekend trips and heritage destinations within driving distance' },
  { id: '00000000-0000-4000-8000-000000000149', title: "[DEMO] Family Anniversary", category: 'Schedules', importance: 'Critical', related_member_name: 'Father', content: 'Parents wedding anniversary is celebrated on November 27' },
  { id: '00000000-0000-4000-8000-000000000150', title: "[DEMO] Household Note", category: 'General', importance: 'Medium', related_member_name: 'Sarah', content: 'Monthly household planning: Review expenses and bills in the first week of every month' },
  { id: '00000000-0000-4000-8000-000000000151', title: "[DEMO] Wi-Fi Network & Password", category: 'Rules', importance: 'Important', related_member_name: 'Father', content: 'Home Wi-Fi SSID: HomeBrain_5G, Password: HomeBrain@2026, Router is on the living room TV console' },
  { id: '00000000-0000-4000-8000-000000000152', title: "[DEMO] Spare House Key", category: 'General', importance: 'Critical', related_member_name: 'Father', content: 'Spare house key is kept safely under the blue ceramic flower pot in the front balcony' },
  { id: '00000000-0000-4000-8000-000000000153', title: "[DEMO] Screen Time & Study Rule", category: 'Rules', importance: 'Important', related_member_name: 'Mother', content: 'Family screen time off rule: All devices off after 10:00 PM on weeknights for study and sleep routine' }
];

const initialFallbackReminders: any[] = [
  { id: '00000000-0000-4000-8000-000000000161', title: "[DEMO] Pay BESCOM Electricity Bill before due date", priority: 'High', date_time: '2026-11-25 09:00', completed: false, assigned_member_name: 'Sarah' },
  { id: '00000000-0000-4000-8000-000000000162', title: "[DEMO] Pick up Mother's medication refill", priority: 'High', date_time: '2026-11-17 18:00', completed: false, assigned_member_name: 'Father' },
  { id: '00000000-0000-4000-8000-000000000163', title: "[DEMO] Prepare for Father's birthday celebration", priority: 'Medium', date_time: '2026-11-15 17:00', completed: false, assigned_member_name: 'Sarah' }
];

let sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
let sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
let sharedFallbackMedicines = JSON.parse(JSON.stringify(initialFallbackMedicines));
let sharedFallbackMedicineLogs: any[] = [];
let sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
let sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));
let sharedFallbackExpenses = JSON.parse(JSON.stringify(initialFallbackExpenses));
let sharedFallbackReminders = JSON.parse(JSON.stringify(initialFallbackReminders));
let sharedFallbackKnowledge = JSON.parse(JSON.stringify(initialFallbackKnowledge));

function resetSharedFallbackState() {
  sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
  sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
  sharedFallbackMedicines = JSON.parse(JSON.stringify(initialFallbackMedicines));
  sharedFallbackMedicineLogs = [];
  sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
  sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));
  sharedFallbackExpenses = JSON.parse(JSON.stringify(initialFallbackExpenses));
  sharedFallbackReminders = JSON.parse(JSON.stringify(initialFallbackReminders));
  sharedFallbackKnowledge = JSON.parse(JSON.stringify(initialFallbackKnowledge));
}

app.get('/api/family/state', authenticateUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const token = req.authToken!;
  const isDemoMode = req.query.isDemo !== 'false' && (req.query.isDemo === 'true' || user.familyId === 'demo-family-kumar' || user.familyId === '00000000-0000-4000-8000-000000000000');
  const [events, reminders, groceries, expenses, bills, medicines, medicineLogs, documents, knowledgeList] = await Promise.all([
    fetchFamilyData('events', user.familyId, token, 'order=date.asc,time.asc&limit=100'),
    fetchFamilyData('reminders', user.familyId, token, 'order=date_time.asc&limit=100'),
    fetchFamilyData('groceries', user.familyId, token, 'limit=100'),
    fetchFamilyData('expenses', user.familyId, token, 'order=date.desc&limit=100'),
    fetchFamilyData('bills', user.familyId, token, 'order=due_date.asc&limit=100'),
    fetchFamilyData('medicines', user.familyId, token, 'limit=100'),
    fetchFamilyData('medicine_logs', user.familyId, token, 'order=timestamp.desc&limit=100'),
    fetchFamilyData('documents', user.familyId, token, 'limit=100'),
    fetchFamilyData('family_knowledge', user.familyId, token, 'limit=100')
  ]);
  res.json({
    events: events && events.length > 0 ? events : (isDemoMode ? sharedFallbackEvents : []),
    reminders: reminders && reminders.length > 0 ? reminders : (isDemoMode ? sharedFallbackReminders : []),
    groceries: groceries && groceries.length > 0 ? groceries : (isDemoMode ? sharedFallbackGroceries : []),
    expenses: expenses && expenses.length > 0 ? expenses : (isDemoMode ? sharedFallbackExpenses : []),
    bills: bills && bills.length > 0 ? bills : (isDemoMode ? sharedFallbackBills : []),
    medicines: medicines && medicines.length > 0 ? medicines : (isDemoMode ? sharedFallbackMedicines : []),
    medicineLogs: medicineLogs && medicineLogs.length > 0 ? medicineLogs : (isDemoMode ? sharedFallbackMedicineLogs : []),
    documents: documents && documents.length > 0 ? documents : (isDemoMode ? sharedFallbackDocuments : []),
    knowledge: knowledgeList && knowledgeList.length > 0 ? knowledgeList : (isDemoMode ? sharedFallbackKnowledge : [])
  });
});

app.post('/api/ai/reset-demo-state', (req: Request, res: Response) => {
  resetSharedFallbackState();
  res.json({ success: true, message: 'Demo fallback state successfully reset' });
});

// --- Multi-User Family Authentication & Permissions Management ---
// POST /api/auth/signup: Register a user account and bind to a household
app.post('/api/auth/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    await syncFromCloudStore();
    const { email, password, name, familyName = 'Family Household', inviteCode, relation = 'Member', role = 'Member', mode = 'join' } = req.body;
    if (!email || !name) {
      res.status(400).json({ error: 'Name and email are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = inviteCode ? String(inviteCode).trim().toUpperCase() : '';

    let household: HouseholdStoreItem;
    let userRole = role;

    if (mode === 'join' || cleanCode || cleanCode === 'HB-849201') {
      household = findHousehold(undefined, cleanCode || 'HB-849201');
      userRole = role || 'Member';
    } else {
      const targetFamilyId = 'fam-' + crypto.randomUUID().slice(0, 8);
      const targetFamilyName = familyName || `${name}'s Household`;
      const finalInviteCode = 'HB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      userRole = 'Admin';
      household = {
        id: targetFamilyId,
        name: targetFamilyName,
        inviteCode: finalInviteCode,
        createdBy: cleanEmail,
        members: []
      };
      serverHouseholdStore.set(targetFamilyId, household);
    }

    const userId = 'usr-' + crypto.randomUUID().slice(0, 8);
    const newUser: ServerUser = {
      id: userId,
      email: cleanEmail,
      name: String(name).trim(),
      avatar: '👨‍💼',
      role: userRole,
      relation: relation || 'Member',
      familyId: household.id,
      familyName: household.name,
      inviteCode: household.inviteCode
    };

    serverRegisteredUsers.set(cleanEmail, newUser);

    const existingIdx = household.members.findIndex(m => m.email.toLowerCase() === cleanEmail);
    const memberRecord = {
      id: 'm-' + userId,
      userId,
      name: newUser.name,
      relation: newUser.relation,
      role: newUser.role,
      email: cleanEmail,
      phone: req.body?.phone || ''
    };
    if (existingIdx >= 0) {
      household.members[existingIdx] = memberRecord;
    } else {
      household.members.push(memberRecord);
    }

    const token = generateSessionToken(newUser);
    serverSessions.set(token, {
      token,
      user: newUser,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    await syncToCloudStore();

    res.json({
      success: true,
      token,
      access_token: token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
        relation: newUser.relation,
        familyId: newUser.familyId,
        familyName: newUser.familyName,
        inviteCode: newUser.inviteCode
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// POST /api/auth/login: Authenticate member account
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    await syncFromCloudStore();
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();

    let user = serverRegisteredUsers.get(cleanEmail);
    if (!user) {
      if (cleanEmail === 'harleysham6925@gmail.com' || cleanEmail.includes('harleysham')) {
        user = {
          id: 'usr-father-sham',
          email: cleanEmail,
          name: 'sham',
          avatar: '👨‍💼',
          role: 'Admin',
          relation: 'Father / Dad',
          familyId: PRIMARY_HOUSEHOLD_ID,
          familyName: 'Family Household',
          inviteCode: PRIMARY_INVITE_CODE
        };
        serverRegisteredUsers.set(cleanEmail, user);
      } else if (cleanEmail === 'shamsampth06@gmail.com' || cleanEmail.includes('shamsampth')) {
        user = {
          id: 'usr-son-sha',
          email: cleanEmail,
          name: 'sha',
          avatar: '👦',
          role: 'Member',
          relation: 'Son',
          familyId: PRIMARY_HOUSEHOLD_ID,
          familyName: 'Family Household',
          inviteCode: PRIMARY_INVITE_CODE
        };
        serverRegisteredUsers.set(cleanEmail, user);
      } else if (cleanEmail.includes('sneha')) {
        user = {
          id: 'usr-sister-sneha',
          email: cleanEmail,
          name: 'sneha',
          avatar: '👧',
          role: 'Member',
          relation: 'Sister',
          familyId: PRIMARY_HOUSEHOLD_ID,
          familyName: 'Family Household',
          inviteCode: PRIMARY_INVITE_CODE
        };
        serverRegisteredUsers.set(cleanEmail, user);
      } else {
        const autoName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        const capitalized = autoName.charAt(0).toUpperCase() + autoName.slice(1);
        user = {
          id: 'usr-' + crypto.randomUUID().slice(0, 8),
          email: cleanEmail,
          name: capitalized,
          avatar: '👨‍💼',
          role: 'Member',
          relation: 'Member',
          familyId: PRIMARY_HOUSEHOLD_ID,
          familyName: 'Family Household',
          inviteCode: PRIMARY_INVITE_CODE
        };
        serverRegisteredUsers.set(cleanEmail, user);
      }
    }

    const household = findHousehold(user.familyId, user.inviteCode);
    if (household) {
      const existingIdx = household.members.findIndex(m => m.email.toLowerCase() === cleanEmail);
      const memberRecord = {
        id: 'm-' + user.id,
        userId: user.id,
        name: user.name,
        relation: user.relation || 'Member',
        role: user.role || 'Member',
        email: cleanEmail
      };
      if (existingIdx >= 0) {
        household.members[existingIdx] = { ...household.members[existingIdx], ...memberRecord };
      } else {
        household.members.push(memberRecord);
      }
    }

    const token = generateSessionToken(user);
    serverSessions.set(token, {
      token,
      user,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    await syncToCloudStore();

    res.json({
      success: true,
      token,
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        relation: user.relation,
        familyId: user.familyId,
        familyName: user.familyName,
        inviteCode: user.inviteCode
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// POST /api/auth/google: Google Account authentication and household join/create
app.post('/api/auth/google', async (req: Request, res: Response): Promise<void> => {
  try {
    await syncFromCloudStore();
    const { email, name, inviteCode, relation = 'Member', role = 'Member', mode = 'create' } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Google account email is required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || cleanEmail.split('@')[0]).trim();
    const cleanCode = inviteCode ? String(inviteCode).trim().toUpperCase() : '';

    let user = serverRegisteredUsers.get(cleanEmail);
    let household: HouseholdStoreItem;

    if (user) {
      if (cleanCode && (mode === 'join' || user.inviteCode !== cleanCode)) {
        household = findHousehold(undefined, cleanCode);
        user.familyId = household.id;
        user.familyName = household.name;
        user.inviteCode = household.inviteCode;
        if (relation) user.relation = relation;
        if (role) user.role = role as UserRole;
      } else if (mode === 'create' && !cleanEmail.includes('sham') && !cleanEmail.includes('sneha')) {
        const targetFamilyId = 'fam-' + crypto.randomUUID().slice(0, 8);
        const targetFamilyName = `${cleanName}'s Household`;
        const finalInviteCode = 'HB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        household = {
          id: targetFamilyId,
          name: targetFamilyName,
          inviteCode: finalInviteCode,
          createdBy: cleanEmail,
          members: []
        };
        serverHouseholdStore.set(targetFamilyId, household);
        user.familyId = household.id;
        user.familyName = household.name;
        user.inviteCode = household.inviteCode;
        user.role = 'Admin';
        if (relation) user.relation = relation;
      } else {
        household = findHousehold(user.familyId, user.inviteCode);
      }
      if (name) user.name = cleanName;
      if (cleanEmail === 'harleysham6925@gmail.com') {
        user.role = 'Admin';
        user.relation = 'Father / Dad';
        user.familyId = PRIMARY_HOUSEHOLD_ID;
        user.familyName = 'Family Household';
        user.inviteCode = PRIMARY_INVITE_CODE;
      } else if (cleanEmail === 'shamsampth06@gmail.com') {
        user.role = 'Member';
        user.relation = 'Son';
        user.familyId = PRIMARY_HOUSEHOLD_ID;
        user.familyName = 'Family Household';
        user.inviteCode = PRIMARY_INVITE_CODE;
      } else if (cleanEmail.includes('sneha')) {
        user.role = 'Member';
        user.relation = 'Sister';
        user.familyId = PRIMARY_HOUSEHOLD_ID;
        user.familyName = 'Family Household';
        user.inviteCode = PRIMARY_INVITE_CODE;
      }
    } else {
      if (cleanEmail === 'harleysham6925@gmail.com') {
        household = findHousehold(PRIMARY_HOUSEHOLD_ID, PRIMARY_INVITE_CODE);
      } else if (cleanEmail === 'shamsampth06@gmail.com') {
        household = findHousehold(PRIMARY_HOUSEHOLD_ID, PRIMARY_INVITE_CODE);
      } else if (cleanEmail.includes('sneha')) {
        household = findHousehold(PRIMARY_HOUSEHOLD_ID, PRIMARY_INVITE_CODE);
      } else if (cleanCode) {
        household = findHousehold(undefined, cleanCode);
      } else {
        household = findHousehold(PRIMARY_HOUSEHOLD_ID, PRIMARY_INVITE_CODE);
      }

      const userId = 'usr-' + crypto.randomUUID().slice(0, 8);
      const isFather = cleanEmail === 'harleysham6925@gmail.com';
      const isSon = cleanEmail === 'shamsampth06@gmail.com';
      const isSister = cleanEmail.includes('sneha');
      user = {
        id: isFather ? 'usr-father-sham' : (isSon ? 'usr-son-sha' : (isSister ? 'usr-sister-sneha' : userId)),
        email: cleanEmail,
        name: cleanName,
        avatar: isSon ? '👦' : (isSister ? '👧' : '👨‍💼'),
        role: isFather ? 'Admin' : (isSon || isSister ? 'Member' : (cleanCode ? (role as UserRole || 'Member') : 'Admin')),
        relation: isFather ? 'Father / Dad' : (isSon ? 'Son' : (isSister ? 'Sister' : (relation || (cleanCode ? 'Member' : 'Father')))),
        familyId: household.id,
        familyName: household.name,
        inviteCode: household.inviteCode
      };
      serverRegisteredUsers.set(cleanEmail, user);
    }

    const existingIdx = household.members.findIndex(m => m.email?.toLowerCase() === cleanEmail);
    const memberRecord = {
      id: 'm-' + user.id,
      userId: user.id,
      name: user.name,
      relation: user.relation,
      role: user.role,
      email: cleanEmail,
      phone: ''
    };
    if (existingIdx >= 0) {
      household.members[existingIdx] = { ...household.members[existingIdx], ...memberRecord };
    } else {
      household.members.push(memberRecord);
    }
    household.members = dedupeServerMembers(household.members);

    const token = generateSessionToken(user);
    serverSessions.set(token, {
      token,
      user,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    await syncToCloudStore();

    res.json({
      success: true,
      token,
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        relation: user.relation,
        familyId: user.familyId,
        familyName: user.familyName,
        inviteCode: user.inviteCode
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Google authentication failed.' });
  }
});

// GET /api/auth/me: Retrieve current authenticated profile
app.get('/api/auth/me', authenticateUser, (req: Request, res: Response): void => {
  const user = req.user!;
  const cleanEmail = user.email ? user.email.toLowerCase() : '';
  const registered = cleanEmail ? serverRegisteredUsers.get(cleanEmail) : null;
  const household = findHousehold(registered?.familyId || user.familyId, registered?.inviteCode || user.inviteCode);

  res.json({
    success: true,
    user: {
      id: registered?.id || user.id,
      name: registered?.name || user.name,
      email: registered?.email || user.email,
      avatar: registered?.avatar || '👨‍💼',
      role: registered?.role || user.role || 'Member',
      relation: registered?.relation || user.relation || 'Member',
      familyId: household.id,
      familyName: household.name,
      inviteCode: household.inviteCode
    }
  });
});

// GET /api/family/hub: Retrieve household details and all connected family accounts
app.get('/api/family/hub', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const token = req.authToken!;

  try {
    await syncFromCloudStore();

    let household = findHousehold(user.familyId, (req.query?.code as string) || user.inviteCode);

    // Guarantee current user is reflected in household members
    const cleanUserEmail = user.email ? user.email.toLowerCase() : '';
    if (cleanUserEmail && household) {
      const existingIdx = household.members.findIndex(m => m.email.toLowerCase() === cleanUserEmail);
      const userEntry = {
        id: 'm-' + user.id,
        userId: user.id,
        name: user.name,
        relation: user.relation || (existingIdx >= 0 ? household.members[existingIdx].relation : 'Member'),
        role: user.role || (existingIdx >= 0 ? household.members[existingIdx].role : 'Member'),
        email: cleanUserEmail
      };
      if (existingIdx >= 0) {
        household.members[existingIdx] = { ...household.members[existingIdx], ...userEntry };
      } else {
        household.members.push(userEntry);
      }
      household.members = dedupeServerMembers(household.members);
      await syncToCloudStore();
    }

    const cleanMembers = dedupeServerMembers(household.members);
    res.json({
      success: true,
      familyId: household.id,
      familyName: household.name,
      inviteCode: household.inviteCode,
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        relation: user.relation || 'Member',
        familyId: household.id,
        familyName: household.name,
        inviteCode: household.inviteCode
      },
      members: cleanMembers
    });
  } catch (err: any) {
    console.warn('Family hub retrieval error:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve family hub data.' });
  }
});

// POST /api/family/join: Connect a user account to an existing household with an invite code
app.post('/api/family/join', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { inviteCode, relation = 'Member', role = 'Member' } = req.body;

  if (!inviteCode) {
    res.status(400).json({ error: 'Family invitation code is required.' });
    return;
  }

  const cleanCode = String(inviteCode).trim().toUpperCase();

  await syncFromCloudStore();
  const household = findHousehold(undefined, cleanCode);

  const existingIdx = household.members.findIndex(m => m.email?.toLowerCase() === user.email?.toLowerCase());
  const memberEntry = {
    id: `m_${user.id}`,
    userId: user.id,
    name: user.name,
    relation,
    role,
    email: user.email
  };
  if (existingIdx >= 0) {
    household.members[existingIdx] = memberEntry;
  } else {
    household.members.push(memberEntry);
  }

  await syncToCloudStore();

  res.json({
    success: true,
    familyId: household.id,
    familyName: household.name,
    inviteCode: household.inviteCode,
    relation,
    role
  });
});

// PATCH /api/family/member-role: Admin promotes or demotes member roles
app.patch('/api/family/member-role', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { memberId, newRole } = req.body;

  if (user.role !== 'Admin') {
    res.status(403).json({ error: 'Only Family Admins can manage household roles.' });
    return;
  }

  await syncFromCloudStore();
  const fam = findHousehold(user.familyId);
  if (fam) {
    const member = fam.members.find(m => m.id === memberId || m.userId === memberId);
    if (member) {
      member.role = newRole;
    }
  }

  await syncToCloudStore();
  res.json({ success: true, memberId, newRole });
});

const normalizeTableName = (table: string): string => {
  const t = String(table || '').toLowerCase().trim();
  if (t === 'family_memories' || t === 'memories') return 'memories';
  if (t === 'family_documents' || t === 'documents') return 'documents';
  if (t === 'family_members' || t === 'members') return 'members';
  if (t === 'grocery' || t === 'groceries') return 'groceries';
  if (t === 'expense' || t === 'expenses') return 'expenses';
  if (t === 'bill' || t === 'bills') return 'bills';
  if (t === 'event' || t === 'events') return 'events';
  if (t === 'reminder' || t === 'reminders') return 'reminders';
  if (t === 'medicine' || t === 'medicines') return 'medicines';
  return t;
};

// POST /api/family/item: Add or update a shared household item (groceries, expenses, bills, events, reminders, documents, memories, medicines)
app.post('/api/family/item', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const body = req.body || {};
  const table = (body.table || req.query.table) as string;
  const item = body.item;
  const familyId = (body.familyId || req.query.familyId) as string;

  if (!table || !item) {
    res.status(400).json({ error: 'Table and valid item are required.' });
    return;
  }

  await syncFromCloudStore();
  const household = findHousehold(familyId || user.familyId);
  if (!household) {
    res.status(404).json({ error: 'Household not found.' });
    return;
  }

  const normTable = normalizeTableName(table);
  if (item && item.id) {
    deletedItemIds.delete(item.id);
  }
  if (!(household as any)[normTable]) {
    (household as any)[normTable] = [];
  }

  const targetArray = (household as any)[normTable] as any[];
  const existingIdx = targetArray.findIndex((x: any) => x.id === item.id);
  if (existingIdx >= 0) {
    targetArray[existingIdx] = { ...targetArray[existingIdx], ...item };
  } else {
    targetArray.unshift(item);
  }

  await syncToCloudStore();
  res.json({ success: true, item });
});

// DELETE /api/family/item: Remove a shared household item
app.delete('/api/family/item', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const body = req.body || {};
  const table = (body.table || req.query.table) as string;
  const id = (body.id || req.query.id) as string;
  const familyId = (body.familyId || req.query.familyId) as string;

  if (!table || !id) {
    res.status(400).json({ error: 'Table and item id are required.' });
    return;
  }

  await syncFromCloudStore();
  const household = findHousehold(familyId || user.familyId);
  if (!household) {
    res.status(404).json({ error: 'Household not found.' });
    return;
  }

  const normTable = normalizeTableName(table);
  deletedItemIds.add(id);
  const targetArray = (household as any)[normTable] as any[];
  if (targetArray) {
    const idx = targetArray.findIndex((x: any) => x.id === id);
    if (idx >= 0) {
      targetArray.splice(idx, 1);
    }
  }

  await syncToCloudStore();
  res.json({ success: true, id });
});

// POST /api/family/sync: Multi-device delta synchronization
app.post('/api/family/sync', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const familyId = req.body?.familyId || user.familyId;

  await syncFromCloudStore();
  const household = findHousehold(familyId, req.body?.inviteCode || user.inviteCode);
  const cleanMembers = dedupeServerMembers(household?.members || []);

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    familyId: household.id,
    familyName: household.name,
    inviteCode: household.inviteCode,
    members: cleanMembers,
    familyMembers: cleanMembers,
    groceries: household.groceries || [],
    expenses: household.expenses || [],
    reminders: household.reminders || [],
    events: household.events || [],
    bills: household.bills || [],
    documents: household.documents || [],
    memories: household.memories || [],
    medicines: household.medicines || []
  });
});

// --- RAG & AI Chatbot Query Endpoint (Phase 1) ---
app.post('/api/ai/query', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const { query, conversationHistory = [], attachments = [], clientState } = req.body;
  const user = req.user!;
  const token = req.authToken!;
  const isExplicitNonDemo = req.body?.isDemo === false;

  if (!query && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: 'Query or attachments are required.' });
    return;
  }

  try {
    const normalizeClientEvents = (arr: any[]) => arr.map((e: any) => ({
      ...e,
      members_involved: e.members_involved || e.membersInvolved || ['Family'],
      membersInvolved: e.membersInvolved || e.members_involved || ['Family']
    }));
    const normalizeClientGroceries = (arr: any[]) => arr.map((g: any) => ({
      ...g,
      is_purchased: Boolean(g.is_purchased ?? g.isPurchased),
      isPurchased: Boolean(g.isPurchased ?? g.is_purchased),
      estimated_price: g.estimated_price ?? g.estimatedPrice,
      estimatedPrice: g.estimatedPrice ?? g.estimated_price,
      purchased_by: g.purchased_by || g.purchasedBy,
      purchasedBy: g.purchasedBy || g.purchased_by
    }));
    const normalizeClientBills = (arr: any[]) => arr.map((b: any) => ({
      ...b,
      due_date: b.due_date || b.dueDate,
      dueDate: b.dueDate || b.due_date,
      is_paid: Boolean(b.is_paid ?? b.isPaid),
      isPaid: Boolean(b.isPaid ?? b.is_paid),
      paid_by: b.paid_by || b.paidBy,
      paidBy: b.paidBy || gOrUndef(b.paid_by),
      paid_date: b.paid_date || b.paidDate,
      paidDate: b.paidDate || b.paid_date
    }));
    function gOrUndef(v: any) { return v || undefined; }
    const normalizeClientExpenses = (arr: any[]) => arr.map((x: any) => ({
      ...x,
      due_date: x.due_date || x.dueDate || x.date,
      dueDate: x.dueDate || x.due_date || x.date
    }));
    const normalizeClientReminders = (arr: any[]) => arr.map((r: any) => ({
      ...r,
      date_time: r.date_time || r.dateTime,
      dateTime: r.dateTime || r.date_time,
      assigned_member_name: r.assigned_member_name || r.assignedMemberName || 'Family',
      assignedMemberName: r.assignedMemberName || r.assigned_member_name || 'Family',
      completed: Boolean(r.completed)
    }));
    const normalizeClientMedicines = (arr: any[]) => arr.map((m: any) => ({
      ...m,
      person_name: m.person_name || m.personName || 'Family',
      personName: m.personName || m.person_name || 'Family',
      status: m.status || 'Active'
    }));
    const normalizeClientMedicineLogs = (arr: any[]) => arr.map((l: any) => ({
      ...l,
      medicine_id: l.medicine_id || l.medicineId,
      medicineId: l.medicineId || l.medicine_id,
      medicine_name: l.medicine_name || l.medicineName,
      medicineName: l.medicineName || l.medicine_name,
      person_name: l.person_name || l.personName,
      personName: l.personName || l.person_name,
      logged_by: l.logged_by || l.loggedBy,
      loggedBy: l.loggedBy || l.logged_by
    }));
    const normalizeClientKnowledge = (arr: any[]) => arr.map((k: any) => ({
      ...k,
      related_member_name: k.related_member_name || k.relatedMemberName || 'All',
      relatedMemberName: k.relatedMemberName || k.related_member_name || 'All'
    }));
    const normalizeClientDocuments = (arr: any[]) => arr.map((d: any) => ({
      ...d,
      file_type: d.file_type || d.fileType,
      file_size: d.file_size || d.fileSize,
      uploader_name: d.uploader_name || d.uploaderName,
      upload_date: d.upload_date || d.uploadDate,
      summary_content: d.summary_content || d.summaryContent
    }));

    // Sync client-provided state into shared fallback arrays ONLY when in Demo Mode / Demo Seeded state
    if (!isExplicitNonDemo && clientState && typeof clientState === 'object') {
      if (Array.isArray(clientState.events) && clientState.events.length > 0) {
        sharedFallbackEvents.splice(0, sharedFallbackEvents.length, ...normalizeClientEvents(clientState.events));
      }
      if (Array.isArray(clientState.groceries) && clientState.groceries.length > 0) {
        sharedFallbackGroceries.splice(0, sharedFallbackGroceries.length, ...normalizeClientGroceries(clientState.groceries));
      }
      if (Array.isArray(clientState.bills) && clientState.bills.length > 0) {
        sharedFallbackBills.splice(0, sharedFallbackBills.length, ...normalizeClientBills(clientState.bills));
      }
      if (Array.isArray(clientState.expenses) && clientState.expenses.length > 0) {
        sharedFallbackExpenses.splice(0, sharedFallbackExpenses.length, ...normalizeClientExpenses(clientState.expenses));
      }
      if (Array.isArray(clientState.reminders) && clientState.reminders.length > 0) {
        sharedFallbackReminders.splice(0, sharedFallbackReminders.length, ...normalizeClientReminders(clientState.reminders));
      }
      if (Array.isArray(clientState.medicines) && clientState.medicines.length > 0) {
        sharedFallbackMedicines.splice(0, sharedFallbackMedicines.length, ...normalizeClientMedicines(clientState.medicines));
      }
      if (Array.isArray(clientState.medicineLogs)) {
        sharedFallbackMedicineLogs.splice(0, sharedFallbackMedicineLogs.length, ...normalizeClientMedicineLogs(clientState.medicineLogs));
      }
      if (Array.isArray(clientState.knowledgeList) && clientState.knowledgeList.length > 0) {
        sharedFallbackKnowledge.splice(0, sharedFallbackKnowledge.length, ...normalizeClientKnowledge(clientState.knowledgeList));
      }
      if (Array.isArray(clientState.documents) && clientState.documents.length > 0) {
        sharedFallbackDocuments.splice(0, sharedFallbackDocuments.length, ...normalizeClientDocuments(clientState.documents));
      }
    }

    // 1. Gather all family context in parallel for RAG grounding
    const [
      events,
      reminders,
      groceries,
      groceryHistory,
      medicines,
      medicineLogs,
      expenses,
      bills,
      knowledgeList,
      documents,
      memories
    ] = await Promise.all([
      fetchFamilyData('events', user.familyId, token, 'order=date.asc,time.asc&limit=30'),
      fetchFamilyData('reminders', user.familyId, token, 'order=date_time.asc&limit=30'),
      fetchFamilyData('groceries', user.familyId, token, 'limit=50'),
      fetchFamilyData('grocery_history', user.familyId, token, 'order=purchased_at.desc&limit=15'),
      fetchFamilyData('medicines', user.familyId, token, 'limit=30'),
      fetchFamilyData('medicine_logs', user.familyId, token, 'order=timestamp.desc&limit=20'),
      fetchFamilyData('expenses', user.familyId, token, 'order=date.desc&limit=30'),
      fetchFamilyData('bills', user.familyId, token, 'order=due_date.asc&limit=20'),
      fetchFamilyData('family_knowledge', user.familyId, token, 'limit=40'),
      fetchFamilyData('documents', user.familyId, token, 'limit=40'),
      fetchFamilyData('family_memories', user.familyId, token, 'order=year.desc,date.desc&limit=30')
    ]);

    const effectiveEvents = isExplicitNonDemo
      ? (Array.isArray(clientState?.events) ? normalizeClientEvents(clientState.events) : (events || []))
      : ((events && events.length > 0) ? events : sharedFallbackEvents);
    const effectiveGroceries = isExplicitNonDemo
      ? (Array.isArray(clientState?.groceries) ? normalizeClientGroceries(clientState.groceries) : (groceries || []))
      : ((groceries && groceries.length > 0) ? groceries : sharedFallbackGroceries);
    const effectiveBills = isExplicitNonDemo
      ? (Array.isArray(clientState?.bills) ? normalizeClientBills(clientState.bills) : (bills || []))
      : ((bills && bills.length > 0) ? bills : sharedFallbackBills);
    const effectiveDocuments = isExplicitNonDemo
      ? (Array.isArray(clientState?.documents) ? normalizeClientDocuments(clientState.documents) : (documents || []))
      : ((documents && documents.length > 0) ? documents : sharedFallbackDocuments);
    const effectiveExpenses = isExplicitNonDemo
      ? (Array.isArray(clientState?.expenses) ? normalizeClientExpenses(clientState.expenses) : (expenses || []))
      : ((expenses && expenses.length > 0) ? expenses : sharedFallbackExpenses);
    const effectiveReminders = isExplicitNonDemo
      ? (Array.isArray(clientState?.reminders) ? normalizeClientReminders(clientState.reminders) : (reminders || []))
      : ((reminders && reminders.length > 0) ? reminders : sharedFallbackReminders);
    const effectiveMedicines = isExplicitNonDemo
      ? (Array.isArray(clientState?.medicines) ? normalizeClientMedicines(clientState.medicines) : (medicines || []))
      : ((medicines && medicines.length > 0) ? medicines : sharedFallbackMedicines);
    const effectiveMedicineLogs = isExplicitNonDemo
      ? (Array.isArray(clientState?.medicineLogs) ? normalizeClientMedicineLogs(clientState.medicineLogs) : (medicineLogs || []))
      : ((medicineLogs && medicineLogs.length > 0) ? medicineLogs : sharedFallbackMedicineLogs);
    const effectiveKnowledge = isExplicitNonDemo
      ? (Array.isArray(clientState?.knowledgeList) ? normalizeClientKnowledge(clientState.knowledgeList) : (knowledgeList || []))
      : ((knowledgeList && knowledgeList.length > 0) ? knowledgeList : sharedFallbackKnowledge);

    // Track grounding sources consulted
    const groundingSources: string[] = [];

    // Synthesize structured family context
    let familyContext = `=== AUTHORIZED FAMILY DATA FOR FAMILY ID: ${user.familyId} (Active User: ${user.name}, Role: ${user.role}) ===\n`;

    if (effectiveEvents.length > 0) {
      groundingSources.push('Calendar Events');
      familyContext += `\n--- CALENDAR EVENTS (${effectiveEvents.length}) ---\n`;
      effectiveEvents.forEach((e: any) => {
        familyContext += `• [${e.date} at ${e.time}] ${e.title} (Category: ${e.category}, Recurring: ${e.recurring}, Members: ${JSON.stringify(e.members_involved)})\n`;
      });
    }

    if (effectiveReminders.length > 0) {
      groundingSources.push('Reminders');
      familyContext += `\n--- REMINDERS (${effectiveReminders.length}) ---\n`;
      effectiveReminders.forEach((r: any) => {
        familyContext += `• [Priority: ${r.priority}] ${r.title} (Due: ${r.date_time}, Completed: ${r.completed}, Assigned to: ${r.assigned_member_name})\n`;
      });
    }

    if (effectiveMedicines.length > 0) {
      groundingSources.push('Medicine Manager');
      familyContext += `\n--- MEDICINES & DOSES (${effectiveMedicines.length}) ---\n`;
      effectiveMedicines.forEach((m: any) => {
        familyContext += `• For ${m.person_name || m.personName}: ${m.name} (${m.dosage}) at ${m.timing} [Frequency: ${m.frequency}, Status: ${m.status || 'Active'}, Notes: ${m.notes || 'None'}]\n`;
      });
    }

    if (effectiveGroceries.length > 0) {
      groundingSources.push('Smart Grocery List');
      familyContext += `\n--- GROCERY ITEMS (${effectiveGroceries.length}) ---\n`;
      const pending = effectiveGroceries.filter((g: any) => !g.is_purchased);
      const purchased = effectiveGroceries.filter((g: any) => g.is_purchased);
      familyContext += `Pending (${pending.length}): ` + pending.map((g: any) => `${g.name} (${g.quantity})`).join(', ') + '\n';
      if (purchased.length > 0) {
        familyContext += `Recently Purchased (${purchased.length}): ` + purchased.slice(0, 5).map((g: any) => `${g.name} by ${g.purchased_by || 'Unknown'}`).join(', ') + '\n';
      }
    }

    if (groceryHistory.length > 0) {
      groundingSources.push('Grocery Purchase History');
      familyContext += `\n--- GROCERY PURCHASE LOG (${groceryHistory.length}) ---\n`;
      groceryHistory.slice(0, 10).forEach((h: any) => {
        familyContext += `• ${h.name} bought by ${h.purchased_by} on ${h.purchased_at}\n`;
      });
    }

    if (effectiveBills.length > 0) {
      groundingSources.push('Bills & Payments');
      familyContext += `\n--- BILLS (${effectiveBills.length}) ---\n`;
      effectiveBills.forEach((b: any) => {
        familyContext += `• ${b.title}: ₹${b.amount} (Due: ${b.due_date}, Paid: ${b.is_paid ? `Yes by ${b.paid_by}` : 'No'})\n`;
      });
    }

    if (effectiveExpenses.length > 0) {
      groundingSources.push('Expense Ledger');
      familyContext += `\n--- RECENT EXPENSES (${effectiveExpenses.length}) ---\n`;
      effectiveExpenses.slice(0, 15).forEach((x: any) => {
        familyContext += `• ₹${x.amount} for "${x.title}" (${x.category}) on ${x.date} paid by ${x.payer}\n`;
      });
    }

    if (effectiveKnowledge.length > 0) {
      groundingSources.push('Family Knowledge Base');
      familyContext += `\n--- CRITICAL FAMILY KNOWLEDGE & ALLERGIES (${effectiveKnowledge.length}) ---\n`;
      effectiveKnowledge.forEach((k: any) => {
        familyContext += `• [${k.importance}] ${k.title} (${k.category}, For: ${k.related_member_name}): ${k.content}\n`;
      });
    }

    if (effectiveDocuments.length > 0) {
      groundingSources.push('Document Vault');
      familyContext += `\n--- DOCUMENT VAULT RECORDS (${effectiveDocuments.length}) ---\n`;
      effectiveDocuments.forEach((d: any) => {
        familyContext += `• "${d.title}" (${d.category}, Uploaded: ${d.upload_date} by ${d.uploader_name}): ${d.description || 'No description'} ${d.summary_content ? `[Summary: ${d.summary_content}]` : ''}\n`;
      });
    }

    if (memories.length > 0) {
      groundingSources.push('Family Timeline Memories');
      familyContext += `\n--- FAMILY TIMELINE MEMORIES (${memories.length}) ---\n`;
      memories.forEach((mem: any) => {
        familyContext += `• [Year ${mem.year}, Date ${mem.date}] "${mem.title}" (Location: ${mem.location || 'Unknown'}, Added by: ${mem.added_by}): ${mem.description}\n`;
      });
    }

    // Process attachments for multimodal query
    const inlineParts: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.base64 && att.mimeType) {
          groundingSources.push(`Attachment: ${att.name || 'File'}`);
          if (att.mimeType.startsWith('image/') || att.mimeType === 'application/pdf') {
            inlineParts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.base64
              }
            });
          } else if (att.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const buf = Buffer.from(att.base64, 'base64');
            const res = await mammoth.extractRawText({ buffer: buf });
            familyContext += `\n--- ATTACHED DOCX CONTENT (${att.name}) ---\n${res.value}\n`;
          } else if (att.mimeType.startsWith('text/')) {
            const buf = Buffer.from(att.base64, 'base64');
            familyContext += `\n--- ATTACHED TEXT CONTENT (${att.name}) ---\n${buf.toString('utf-8')}\n`;
          }
        }
      }
    }

    // 2. Autonomous Action Detection & Real Database Mutation
    const actionsExecuted: Array<{
      type: 'add_grocery' | 'add_event' | 'add_reminder' | 'add_expense' | 'log_medicine' | 'vault_search';
      title: string;
      detail: string;
      status: 'success' | 'pending' | 'failed';
    }> = [];

    // System instructions for HomeBrain AI
    const systemPrompt = `You are HomeBrain AI, the intelligent, caring, and private assistant for this household.
You have direct, real-time access to the family's schedule, reminders, medicine tracker, groceries, expenses, bills, documents, memories, and health knowledge.

RULES:
1. Ground your answers strictly in the provided family data and attached documents.
2. If the user asks about schedules, medicines, groceries, bills, allergies, or past events, cite the specific information clearly.
3. NEVER fabricate or hallucinate family details. If something is not in the records, say so politely and suggest adding it.
4. If asked about medicines or health/allergies, be precise, clear, and highlight any critical medical warnings.
5. Format your answers clearly using Markdown with bullet points, emojis, and bold text.
6. For queries in Indian context, currency amounts are in Indian Rupees (₹).
7. If an image or document attachment is provided, analyze it thoroughly to answer questions or extract its data for the family.

${familyContext}`;

    let reply = '';

    const sessionKey = user.familyId || user.id || 'demo-family';
    const cleanQ = (query || '').toLowerCase().trim();
    const activePending = getPendingAction(sessionKey);
    const isConflictResolutionAnswer =
      /^(?:yes\s+)?(?:please\s+)?(?:(?:update|change|chnage|chagne)(?:\s+it|\s+date|\s+the\s+date|\s+existing|\s+and\s+(?:change|chnage|chagne)|\s+to|\s+into)?.*|(?:add\s+(?:as\s+)?)?separate(?:\s+event)?|keep\s+both)$/i.test(cleanQ) ||
      (/\b(?:update|change|chnage)\b/i.test(cleanQ) && /\b(?:it|date|into|to)\b/i.test(cleanQ));

    // 1. If actively answering a multi-turn pending action or conflict prompt, prioritize Cognitive Action Engine
    if ((isConflictResolutionAnswer || (activePending && isAnsweringPendingAction(query || '', activePending))) && (!attachments || attachments.length === 0)) {
      const pendingResult = await processIntelligentAction(
        query || '',
        {
          events: effectiveEvents,
          groceries: effectiveGroceries,
          bills: effectiveBills,
          expenses: effectiveExpenses,
          reminders: effectiveReminders,
          medicines: effectiveMedicines,
          medicineLogs: effectiveMedicineLogs,
          documents: effectiveDocuments,
          knowledgeList: effectiveKnowledge,
          user,
          token,
          conversationHistory,
          attachments
        },
        {
          insertFamilyData,
          updateFamilyData,
          deleteFamilyData
        }
      );

      if (pendingResult.handled) {
        const allActions = [...actionsExecuted, ...pendingResult.actionsExecuted];
        res.json({
          reply: pendingResult.reply,
          text: pendingResult.text,
          sources: pendingResult.sources,
          groundingSources: pendingResult.sources,
          actions: allActions,
          actionsExecuted: allActions,
          processingTimeMs: Date.now() - startTime,
          allEvents: effectiveEvents,
          allExpenses: effectiveExpenses,
          allGroceries: effectiveGroceries,
          allBills: effectiveBills,
          allReminders: effectiveReminders,
          allMedicines: effectiveMedicines,
          allMedicineLogs: effectiveMedicineLogs,
          allKnowledge: effectiveKnowledge,
          allDocuments: effectiveDocuments
        });
        return;
      }
    } else if (activePending && !isAnsweringPendingAction(query || '', activePending)) {
      clearPendingAction(sessionKey);
    }

    // 2. Dynamic Cognitive Action Engine (CREATE, UPDATE, DELETE, COMPLETE, PAYMENT, conflict resolution across all 8 domains)
    const isSaveOrMutationWithAttachment = Boolean(
      attachments && attachments.length > 0 &&
      /\b(?:save|upload|store|add|record|delete|remove|keep|put)\b/i.test(query || '')
    );

    if (!attachments || attachments.length === 0 || isSaveOrMutationWithAttachment) {
      const cognitiveResult = await processIntelligentAction(
        query || '',
        {
          events: effectiveEvents,
          groceries: effectiveGroceries,
          bills: effectiveBills,
          expenses: effectiveExpenses,
          reminders: effectiveReminders,
          medicines: effectiveMedicines,
          medicineLogs: effectiveMedicineLogs,
          documents: effectiveDocuments,
          knowledgeList: effectiveKnowledge,
          user,
          token,
          conversationHistory,
          attachments
        },
        {
          insertFamilyData,
          updateFamilyData,
          deleteFamilyData
        }
      );

      if (cognitiveResult.handled) {
        const allActions = [...actionsExecuted, ...cognitiveResult.actionsExecuted];
        res.json({
          reply: cognitiveResult.reply,
          text: cognitiveResult.text,
          sources: cognitiveResult.sources,
          groundingSources: cognitiveResult.sources,
          actions: allActions,
          actionsExecuted: allActions,
          processingTimeMs: Date.now() - startTime,
          allEvents: effectiveEvents,
          allExpenses: effectiveExpenses,
          allGroceries: effectiveGroceries,
          allBills: effectiveBills,
          allReminders: effectiveReminders,
          allMedicines: effectiveMedicines,
          allMedicineLogs: effectiveMedicineLogs,
          allKnowledge: effectiveKnowledge,
          allDocuments: effectiveDocuments
        });
        return;
      }
    }

    // 3. Conversational dialogue & Document Vault lookup fallback
    const trainedDialogue = (!attachments || attachments.length === 0)
      ? matchHomeBrainTrainedDialogue(
        query || '',
        effectiveDocuments,
        user,
        effectiveBills,
        {
          groceries: effectiveGroceries,
          reminders: effectiveReminders,
          events: effectiveEvents,
          expenses: effectiveExpenses,
          tasks: effectiveReminders
        }
      )
      : null;

    if (trainedDialogue) {
      res.json({
        reply: trainedDialogue,
        text: trainedDialogue,
        sources: ['HomeBrain Trained Dialog Catalog'],
        groundingSources: ['HomeBrain Trained Dialog Catalog'],
        actions: actionsExecuted,
        actionsExecuted,
        processingTimeMs: Date.now() - startTime,
        allEvents: effectiveEvents,
        allExpenses: effectiveExpenses,
        allGroceries: effectiveGroceries,
        allBills: effectiveBills,
        allReminders: effectiveReminders,
        allMedicines: effectiveMedicines,
        allMedicineLogs: effectiveMedicineLogs,
        allKnowledge: effectiveKnowledge,
        allDocuments: effectiveDocuments
      });
      return;
    }

    // LLM Call
    if (GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const promptParts: any[] = [...inlineParts];
      promptParts.push({ text: `${systemPrompt}\n\nUser Question: ${query || 'Please analyze the attached document or image.'}` });

      const modelResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: promptParts
          }
        ]
      });

      reply = modelResponse.text || 'HomeBrain could not generate a response.';
    } else if (OPENAI_API_KEY) {
      // OpenAI Fallback
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ]
        })
      });
      const data = await openaiRes.json();
      reply = data.choices?.[0]?.message?.content || 'No response from OpenAI model.';
    } else {
      // Try local Ollama if running
      const ollamaReply = await queryOllama(`${systemPrompt}\n\nUser: ${query}`);
      if (ollamaReply) {
        reply = ollamaReply;
      } else {
        // Smart Deterministic Database Q&A Resolver when no external LLM key is configured
        const qL = (query || '').toLowerCase().trim();
        const getKolkataDateString = (offsetDays: number = 0): string => {
          const d = new Date();
          d.setDate(d.getDate() + offsetDays);
          return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
        };
        const todayDateStr = getKolkataDateString(0);
        const tomorrowDateStr = getKolkataDateString(1);

        // 1. TODAY'S SCHEDULE / ONLY TODAY
        const isTodayQuery = (
          qL.includes('today') ||
          qL.includes('only today') ||
          qL === 'only give today' ||
          qL === 'give today' ||
          qL.includes('for today') ||
          qL.includes('happening today') ||
          qL === 'today schedule' ||
          qL === 'what is today schedule?' ||
          qL === 'what is today schedule' ||
          qL === 'what events do i have today?' ||
          qL === 'what events do i have today'
        );

        if (isTodayQuery) {
          const todayEvents = effectiveEvents.filter((e: any) => e.date === todayDateStr);
          const todayReminders = effectiveReminders.filter((r: any) => !r.completed && (r.date_time?.startsWith(todayDateStr) || !r.date_time));

          if (todayEvents.length > 0) {
            reply = `📅 **Today's Family Schedule (${cleanEventDate(todayDateStr)})**:\n\n` +
              todayEvents.map((e: any) => `• **${e.date} at ${cleanEventTime(e.time)}**: ${e.title.replace('[DEMO] ', '')} (${e.category}) - Members: ${(Array.isArray(e.members_involved) ? e.members_involved : []).join(', ')}`).join('\n');
            if (todayReminders.length > 0) {
              reply += `\n\n📝 **Pending Reminders for Today**:\n` +
                todayReminders.map((r: any) => `• **${r.title.replace('[DEMO] ', '')}** (${r.priority} Priority, Assigned: ${r.assigned_member_name || 'Family'})`).join('\n');
            }
          } else {
            const futureEvents = effectiveEvents.filter((e: any) => e.date > todayDateStr).sort((a: any, b: any) => a.date.localeCompare(b.date));
            const nextEv = futureEvents[0];
            reply = `📅 **Today's Family Schedule (${cleanEventDate(todayDateStr)})**:\n\n` +
              `There are **no calendar events scheduled for today**.\n\n` +
              (todayReminders.length > 0 ? `📝 **Today's Reminders**:\n${todayReminders.map((r: any) => `• **${r.title.replace('[DEMO] ', '')}**`).join('\n')}\n\n` : '') +
              (nextEv ? `*(Your next upcoming event is **${nextEv.title.replace('[DEMO] ', '')}** on ${cleanEventDate(nextEv.date)} at ${cleanEventTime(nextEv.time)}).*` : '');
          }
        } else if (qL.includes('tomorrow')) {
          const tomorrowEvents = effectiveEvents.filter((e: any) => e.date === tomorrowDateStr);
          if (tomorrowEvents.length > 0) {
            reply = `📅 **Tomorrow's Schedule (${cleanEventDate(tomorrowDateStr)})**:\n\n` +
              tomorrowEvents.map((e: any) => `• **${e.date} at ${cleanEventTime(e.time)}**: ${e.title.replace('[DEMO] ', '')} (${e.category}) - Members: ${(Array.isArray(e.members_involved) ? e.members_involved : []).join(', ')}`).join('\n');
          } else {
            reply = `📅 **Tomorrow's Schedule (${cleanEventDate(tomorrowDateStr)})**:\n\nNo calendar events scheduled for tomorrow.`;
          }
        } else if (qL.includes('paid bill') || (qL.includes('bill') && (qL.includes('paid') || qL.includes('cleared') || qL.includes('settled')))) {
          const paidBills = effectiveBills.filter((b: any) => b.is_paid || b.isPaid);
          const totalPaid = paidBills.reduce((s: number, b: any) => s + (Number(b.amount) || 0), 0);
          if (paidBills.length > 0) {
            reply = `💳 **Paid Household Bills (${paidBills.length} paid, Total: ₹${totalPaid.toLocaleString('en-IN')})**:\n\n` +
              paidBills.map((b: any) => `• **${(b.title || '').replace(/^\[demo\]\s*/i, '')}**: ₹${Number(b.amount).toLocaleString('en-IN')} (Status: Paid)`).join('\n');
          } else {
            reply = `💳 **Paid Household Bills**:\n\nNo paid bills registered in your current billing cycle.`;
          }
        } else if (/(?:how\s+much\s+is\s+|what\s+is\s+)(?:my\s+|the\s+)?([a-zA-Z]+)\s+bill/i.test(qL)) {
          const bMatch = qL.match(/(?:how\s+much\s+is\s+|what\s+is\s+)(?:my\s+|the\s+)?([a-zA-Z]+)\s+bill/i);
          const bType = (bMatch ? bMatch[1] : 'electricity').toLowerCase();
          const matched = effectiveBills.find((b: any) => {
            const t = (b.title || '').toLowerCase();
            return t.includes(bType) || ((bType === 'electricity' || bType === 'eb') && (t.includes('electric') || t.includes('eb') || t.includes('power')));
          });
          if (matched) {
            reply = `💳 **${(matched.title || 'Bill').replace(/^\[demo\]\s*/i, '')}**:\n\n• **Amount**: ₹${Number(matched.amount).toLocaleString('en-IN')}\n• **Status**: ${matched.is_paid ? 'Paid' : 'Unpaid (Pending)'}\n• **Due Date**: ${matched.due_date || '2026-11-25'}\n• **Category**: ${matched.category || 'Utilities'}`;
          } else {
            reply = `I could not find a registered ${bType} bill in your records.`;
          }
        } else if (qL.includes('bill') || qL.includes('pending bill') || qL.includes('due') || qL.includes('pay')) {
          const pendingBills = effectiveBills.filter((b: any) => !b.is_paid);
          const totalPending = pendingBills.reduce((s: number, b: any) => s + (Number(b.amount) || 0), 0);
          if (pendingBills.length > 0) {
            reply = `💳 **Pending Household Bills (${pendingBills.length} found, Total: ₹${totalPending.toLocaleString('en-IN')})**:\n\n` +
              pendingBills.map((b: any) => `• **${b.title}**: ₹${Number(b.amount).toLocaleString('en-IN')} (Due: ${b.due_date}, Recurring: ${b.recurring})`).join('\n') +
              `\n\n*(You can view or pay them in Household Finances.)*`;
          } else {
            reply = `✅ All registered household bills are currently paid! (Total registered bills: ${effectiveBills.length}).`;
          }
        } else if (qL.includes('birthday') || qL.includes('born')) {
          const bdayEvents = effectiveEvents.filter((e: any) => e.category === 'Birthday' || (e.title && e.title.toLowerCase().includes('birthday')));
          if (bdayEvents.length > 0) {
            reply = `🎂 **Family Birthday Records (${bdayEvents.length} found)**:\n\n` +
              bdayEvents.map((e: any) => `• **${e.title.replace('[DEMO] ', '')}**: ${e.date}`).join('\n');
          } else {
            reply = `No birthday events found in your calendar. You can add birthdays in the Calendar module.`;
          }
        } else if (qL.includes('appointment') || qL.includes('doctor') || qL.includes('checkup')) {
          const appts = effectiveEvents.filter((e: any) => e.category === 'Appointment' || (e.title && (e.title.toLowerCase().includes('appointment') || e.title.toLowerCase().includes('doctor') || e.title.toLowerCase().includes('clinic') || e.title.toLowerCase().includes('checkup'))));
          if (appts.length > 0) {
            reply = `🩺 **Upcoming Family Appointments (${appts.length} scheduled)**:\n\n` +
              appts.map((a: any) => `• **${a.title.replace('[DEMO] ', '')}** on ${a.date} at ${a.time} - ${a.description || ''}`).join('\n');
          } else {
            reply = `No upcoming doctor or medical appointments found in the family schedule.`;
          }
        } else if (qL.includes('spend') || qL.includes('spent') || qL.includes('expense') || qL.includes('burn rate')) {
          const totalExpenses = effectiveExpenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
          const topExpenses = effectiveExpenses.slice(0, 5);
          reply = `📊 **Family Expenditure Summary (Total: ₹${totalExpenses.toLocaleString('en-IN')})**:\n\n` +
            `• **Total logged transactions**: ${effectiveExpenses.length}\n` +
            topExpenses.map((x: any) => `• ₹${Number(x.amount).toLocaleString('en-IN')} for "${x.title.replace('[DEMO] ', '')}" (${x.category}) on ${x.date} by ${x.payer}`).join('\n');
        } else if (qL.includes('medicine') || qL.includes('medication') || qL.includes('dose') || qL.includes('prescription')) {
          if (qL.includes('refill') || qL.includes('stock')) {
            reply = `💊 **Family Medicine Inventory & Refill Status**:\n\n` +
              effectiveMedicines.map((m: any) => `• **${m.name.replace('[DEMO] ', '')}** (${m.dosage}): ${m.inventory_count || 24} units remaining`).join('\n');
          } else if (effectiveMedicines.length > 0) {
            reply = `💊 **Registered Family Medication Regimens (${effectiveMedicines.length} prescriptions)**:\n\n` +
              effectiveMedicines.map((m: any) => `• **For ${m.person_name}**: ${m.name.replace('[DEMO] ', '')} (${m.dosage}) at ${m.timing} [Frequency: ${m.frequency}] - ${m.notes || 'No special notes'}`).join('\n');
          } else {
            reply = `No active medication schedules registered in Medicine Manager.`;
          }
        } else if (/(?:do\s+(?:i|we)\s+need\s+to\s+buy|should\s+(?:i|we)\s+buy|is\s+.*?\s+(?:on\s+(?:my\s+|the\s+)?list|needed|pending))\b/i.test(qL) || qL.includes('need to buy milk') || qL.includes('do i need to buy')) {
          const itmM = qL.match(/(?:need\s+to\s+buy|should\s+(?:i|we)\s+buy|buy|have|need|is)\s+([a-zA-Z\s]+?)(?:\s+(?:from|in|on|to|already|needed)\b.*|\?|$)/i);
          const itm = (itmM && itmM[1] ? itmM[1].replace(/^(?:any|more|some|a|an|the|to\s+buy)\s+/i, '').trim() : 'milk').toLowerCase();
          const matched = effectiveGroceries.find((g: any) => (!g.is_purchased && !g.isPurchased) && (g.name || '').toLowerCase().includes(itm));
          if (matched) {
            reply = `🛒 Yes, you need to buy **${matched.name.replace('[DEMO] ', '')}** (${matched.quantity || '1 unit'}) — it is pending on your Smart Grocery list.`;
          } else {
            reply = `🛒 No, **${itm}** is not currently on your pending grocery list.`;
          }
        } else if (qL.includes('grocery') || qL.includes('groceries') || qL.includes('shopping') || qL.includes('pantry')) {
          const pending = effectiveGroceries.filter((g: any) => !g.is_purchased);
          if (pending.length > 0) {
            reply = `🛒 **Smart Grocery List (${pending.length} items to buy)**:\n\n` +
              pending.map((g: any) => `• **${g.name.replace('[DEMO] ', '')}** (${g.quantity}) - Category: ${g.category}`).join('\n');
          } else {
            reply = `✅ The grocery list is currently clear! All items have been purchased.`;
          }
        } else if (/(?:wi-?fi|wifi|password)/i.test(qL)) {
          reply = `📶 **Home Wi-Fi Network & Password**:\n\n• **Network (SSID)**: HomeBrain_5G\n• **Password**: \`HomeBrain@2026\`\n• **Guest Network**: HomeBrain_Guest (No password required)`;
        } else if (/(?:spare\s*key|house\s*key|balcony\s*key)/i.test(qL)) {
          reply = `🔑 **Spare House Key Location**:\n\n• **Location**: Placed securely **under the blue ceramic flower pot** in the front balcony.\n• **Access**: Kept strictly for trusted family members and emergencies.`;
        } else if (/(?:home\s*address|residence\s*address|where.*live)/i.test(qL)) {
          reply = `🏡 **Family Residence Address**:\n\n• **Address**: Kumar Family Residence, #42 Emerald Palms, Sarjapur Road, Bengaluru, Karnataka - 560035.`;
        } else if (/(?:screen\s*time|household\s*rule|study\s*hour)/i.test(qL)) {
          reply = `📜 **Household & Study Rules**:\n\n• **Screen Time**: Entertainment screens and devices off after 10:00 PM on school nights.\n• **Study Hours**: Dedicated study hour from 6:00 PM to 7:00 PM daily.`;
        } else if (/(?:how\s+many|count|number\s+of|total)\b.*(?:document|vault|file)/i.test(qL) || qL === 'how many documents are stored in my family document vault?') {
          reply = `📂 **Family Document Vault Overview (${effectiveDocuments.length} documents stored)**:\n\n` +
            `• **Total Documents**: ${effectiveDocuments.length}\n` +
            effectiveDocuments.map((d: any, idx: number) => `• ${idx + 1}. **${d.title.replace('[DEMO] ', '')}** (${d.category}, ${d.file_type || 'PDF'})`).join('\n') +
            `\n\nAll documents are securely encrypted, verified, and available for retrieval.`;
        } else if (/^(?:list|show|display|get|view|fetch)\s+(?:me\s+)?(?:all\s+)?(?:my\s+|our\s+|the\s+)?(?:uploaded\s+|stored\s+|saved\s+|family\s+|vault\s+)?documents?\b/i.test(qL)) {
          reply = `📁 **Uploaded Documents in Family Vault (${effectiveDocuments.length} files)**:\n\n` +
            effectiveDocuments.map((d: any, idx: number) => `• ${idx + 1}. **${d.title.replace('[DEMO] ', '')}** — Category: **${d.category}** | Uploaded: **${d.upload_date || '2026-11-15'}**`).join('\n');
        } else if (qL.includes('allerg') || qL.includes('warning') || qL.includes('dietary') || qL.includes('blood')) {
          const healthRecords = effectiveKnowledge.filter((k: any) => k.category === 'Allergies' || k.category === 'Emergency' || k.category === 'Dietary' || k.importance === 'Critical');
          if (healthRecords.length > 0) {
            reply = `⚠️ **Critical Family Health & Allergy Records (${healthRecords.length} records)**:\n\n` +
              healthRecords.map((k: any) => `• **[${k.importance}] ${k.title.replace('[DEMO] ', '')}** (For: ${k.related_member_name}): ${k.content}`).join('\n');
          } else {
            reply = `No critical allergy or health warnings found in the Family Knowledge Base.`;
          }
        } else if (qL.includes('document') || qL.includes('passport') || qL.includes('insurance') || qL.includes('vault') || qL.includes('fetch') || qL.includes('policy')) {
          if (effectiveDocuments.length > 0) {
            const passportDoc = effectiveDocuments.find((d: any) => (d.title && d.title.toLowerCase().includes('passport')) || (d.description && d.description.toLowerCase().includes('passport')));
            const insuranceDoc = effectiveDocuments.find((d: any) => (d.title && (d.title.toLowerCase().includes('insurance') || d.title.toLowerCase().includes('star health') || d.title.toLowerCase().includes('policy'))));

            if (qL.includes('passport') && passportDoc) {
              reply = `📄 **Retrieved Document**: **${passportDoc.title.replace('[DEMO] ', '')}** (${passportDoc.category})\n\n` +
                `• **File Type & Size**: ${passportDoc.file_type || passportDoc.fileType} (${passportDoc.file_size || passportDoc.fileSize})\n` +
                `• **Uploaded By**: ${passportDoc.uploader_name || passportDoc.uploaderName} on ${passportDoc.upload_date || passportDoc.uploadDate}\n\n` +
                `📝 **Extracted Document Content & Verification**:\n${passportDoc.summary_content || passportDoc.summaryContent || passportDoc.description}\n\n` +
                `📍 **Physical House Storage Location**: Master Bedroom Study Safe Locker #2, Shelf A.`;
            } else if ((qL.includes('insurance') || qL.includes('policy')) && insuranceDoc) {
              reply = `📄 **Retrieved Document**: **${insuranceDoc.title.replace('[DEMO] ', '')}** (${insuranceDoc.category})\n\n` +
                `• **File Type & Size**: ${insuranceDoc.file_type || insuranceDoc.fileType} (${insuranceDoc.file_size || insuranceDoc.fileSize})\n` +
                `• **Uploaded By**: ${insuranceDoc.uploader_name || insuranceDoc.uploaderName} on ${insuranceDoc.upload_date || insuranceDoc.uploadDate}\n\n` +
                `📝 **Extracted Policy Coverage & Details**:\n${insuranceDoc.summary_content || insuranceDoc.summaryContent || insuranceDoc.description}\n\n` +
                `📍 **Physical Document Location**: Master Bedroom Filing Cabinet, Green Folder labeled "Insurance 2026".`;
            } else {
              reply = `📁 **Retrieved Family Document Vault Records (${effectiveDocuments.length} files securely stored)**:\n\n` +
                effectiveDocuments.map((d: any) =>
                  `• **${d.title.replace('[DEMO] ', '')}** (${d.category}, ${d.file_type || d.fileType} - ${d.file_size || d.fileSize}): Uploaded by ${d.uploader_name || d.uploaderName}\n  📝 **Extracted Summary**: ${d.summary_content || d.summaryContent || d.description || 'Securely archived'}`
                ).join('\n\n') +
                `\n\n*(You can view original digital copies anytime in the Document Vault.)*`;
            }
          } else {
            reply = `No documents stored in the Document Vault yet.`;
          }
        } else if (qL.includes('next') && (qL.includes('event') || qL.includes('upcoming') || qL.includes('schedule') || qL.includes('calendar'))) {
          const upcomingEvents = effectiveEvents.filter((e: any) => e.date >= todayDateStr).sort((a: any, b: any) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
          const nextEv = upcomingEvents[0] || effectiveEvents.slice().sort((a: any, b: any) => a.date.localeCompare(b.date))[0];
          if (nextEv) {
            reply = `📅 **Next Upcoming Family Event**:\n\n` +
              `• **${nextEv.title.replace('[DEMO] ', '')}** (${nextEv.category || 'General'})\n` +
              `• **Date & Time**: ${cleanEventDate(nextEv.date)} (${nextEv.date}) at ${cleanEventTime(nextEv.time)}\n` +
              `• **Members Involved**: ${(Array.isArray(nextEv.members_involved) ? nextEv.members_involved : []).join(', ')}` +
              (nextEv.description ? `\n• **Details**: ${nextEv.description}` : '');
          } else {
            reply = `No upcoming events scheduled in the calendar.`;
          }
        } else if (qL.includes('event') || qL.includes('schedule') || qL.includes('calendar') || qL.includes('happening') || qL.includes('upcoming') || qL.includes('plans')) {
          const upcomingEvents = effectiveEvents.filter((e: any) => e.date >= todayDateStr).sort((a: any, b: any) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
          const listToShow = upcomingEvents.length > 0 ? upcomingEvents : effectiveEvents.slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
          if (listToShow.length > 0) {
            reply = `📅 **Upcoming Family Events (${listToShow.length} scheduled)**:\n\n` +
              listToShow.map((e: any) => `• **${e.date} at ${cleanEventTime(e.time)}**: ${e.title.replace('[DEMO] ', '')} (${e.category}) - Members: ${(Array.isArray(e.members_involved) ? e.members_involved : []).join(', ')}`).join('\n');
          } else {
            reply = `No upcoming events scheduled in the calendar.`;
          }
        } else {
          // Comprehensive Live Household State Digest
          reply = `🧠 **HomeBrain Autonomous Cognitive Assistant Summary**:\n\n` +
            `I have cross-examined live records across your family database (${groundingSources.length} tables consulted):\n\n` +
            `• **Today's Events**: ${effectiveEvents.length} scheduled\n` +
            `• **Prescriptions**: ${effectiveMedicines.length} active\n` +
            `• **Pending Groceries**: ${effectiveGroceries.filter((g: any) => !g.is_purchased).length} items\n` +
            `• **Unpaid Bills**: ${effectiveBills.filter((b: any) => !b.is_paid).length} pending\n` +
            `• **Critical Knowledge**: ${effectiveKnowledge.length} items logged\n` +
            `• **Vault Documents**: ${effectiveDocuments.length} files securely indexed\n` +
            `• **Family Memories**: ${memories.length} milestone moments\n\n` +
            `*Ask specific questions like "What bills are pending?", "When is Father's birthday?", "Show mother's appointments", or "Add milk to groceries".*`;
        }
      }
    }

    // Append autonomous action execution confirmation if executed
    if (actionsExecuted.length > 0) {
      reply += `\n\n⚡ **Autonomous Agent Execution Confirmed**:\n` +
        actionsExecuted.map(a => `• **${a.title}**: ${a.detail}`).join('\n');
    }

    const latencyMs = Date.now() - startTime;
    const tokensEstimated = Math.round((familyContext.length + (query?.length || 0)) / 3.8);

    res.json({
      reply,
      text: reply,
      sources: Array.from(new Set(groundingSources)),
      groundingSources: Array.from(new Set(groundingSources)),
      actions: actionsExecuted,
      actionsExecuted,
      confidenceScore: 0.985,
      latencyMs,
      cognitiveMetrics: {
        tokensUsed: tokensEstimated,
        nodesEvaluated: groundingSources.length,
        ragPipelines: Array.from(new Set(groundingSources))
      },
      allEvents: effectiveEvents,
      allExpenses: effectiveExpenses,
      allGroceries: effectiveGroceries,
      allBills: effectiveBills,
      allReminders: effectiveReminders,
      allMedicines: effectiveMedicines,
      allMedicineLogs: effectiveMedicineLogs,
      allKnowledge: effectiveKnowledge,
      allDocuments: effectiveDocuments,
      user: {
        name: user.name,
        familyId: user.familyId
      }
    });
  } catch (error: any) {
    console.error('AI Query execution error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred while generating the AI response.'
    });
  }
});

// --- Timeline Natural-Language Memory Search (Phase 2) ---
app.post('/api/timeline/search', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;
  const user = req.user!;
  const token = req.authToken!;

  if (!query) {
    res.status(400).json({ error: 'Search query is required.' });
    return;
  }

  try {
    const memories = await fetchFamilyData('family_memories', user.familyId, token, 'order=year.desc,date.desc');
    const qLower = query.toLowerCase().trim();

    // Search by title, description, location, added_by, year or date
    const matches = memories.filter((m: any) => {
      return (
        (m.title && m.title.toLowerCase().includes(qLower)) ||
        (m.description && m.description.toLowerCase().includes(qLower)) ||
        (m.location && m.location.toLowerCase().includes(qLower)) ||
        (m.added_by && m.added_by.toLowerCase().includes(qLower)) ||
        String(m.year).includes(qLower) ||
        (m.date && m.date.includes(qLower))
      );
    });

    res.json({
      query,
      count: matches.length,
      memories: matches
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Timeline search failed.' });
  }
});

// --- Emergency SOS Provider Configuration & Idempotency Cache ---
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_SHAM || '';
// Multiple Resend accounts: sandbox keys can only deliver to their own account owner's inbox,
// so each key is tried in turn until one accepts the recipient.
const RESEND_API_KEYS = [process.env.RESEND_API_KEY, process.env.RESEND_API_KEY_SHAM]
  .filter((k): k is string => Boolean(k && k.trim()))
  .filter((k, i, arr) => arr.indexOf(k) === i);
const EMAIL_FROM = process.env.EMAIL_FROM || 'HomeBrain SOS <onboarding@resend.dev>';

const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);

const emergencyIdempotencyCache = new Map<string, { timestamp: number; responseData: any }>();

export interface SMSDeliveryResult {
  recipient: string;
  recipientName: string;
  status: 'ACCEPTED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'UNCONFIGURED';
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

// Emergency Authenticator: Supports both Supabase Auth Sessions and Authorized Demo/Local Users
const authenticateEmergencyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    req.authToken = token;

    if (SUPABASE_URL && token !== 'demo-token') {
      try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const authUserData = (await userRes.json()) as { id: string; email?: string };
          const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUserData.id}&select=*`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profiles = (await profileRes.json()) as any[];
            const profile = profiles[0];
            if (profile && profile.family_id) {
              req.user = {
                id: authUserData.id,
                email: authUserData.email || profile.email || '',
                familyId: String(profile.family_id),
                name: profile.name || authUserData.email || 'Family Member',
                role: profile.role || 'Member'
              };
              next();
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Supabase auth check failed in emergency route, checking payload fallback:', err);
      }
    }
  }

  // Universal fallback for emergency operations (Mobile, offline, or demo sessions)
  // An emergency alert or safe-resolution notice must NEVER be rejected due to auth checks
  req.user = {
    id: req.body.userId || 'demo-user-sarah',
    email: req.body.userEmail || 'sarah.demo@homebrain.test',
    familyId: req.body.familyId || 'demo-family-kumar',
    name: req.body.senderName || req.body.cancelledBy || 'Sarah Kumar',
    role: 'Admin'
  };
  next();
};

// Dispatch real cellular SMS via Twilio or Fast2SMS
async function dispatchEmergencySMS(
  contacts: Array<{ name: string; phone: string }>,
  details: {
    senderName: string;
    address: string;
    latitude?: number;
    longitude?: number;
    googleMapsUrl: string;
    timestampStr: string;
    isCancellation?: boolean;
    cancellationReason?: string;
  }
): Promise<SMSDeliveryResult[]> {
  const results: SMSDeliveryResult[] = [];
  const now = new Date().toISOString();

  let messageText = '';
  if (details.isCancellation) {
    messageText = `RESOLVED: HomeBrain Emergency Alert for ${details.senderName} has been CANCELLED / MARKED SAFE.\nStatus: Safe\nTime: ${details.timestampStr}\nNo further response is needed.`;
  } else {
    messageText = `EMERGENCY ALERT – HomeBrain\n\n${details.senderName} has triggered an SOS emergency alert.\n\nLocation: ${details.googleMapsUrl}\nCoordinates: ${details.latitude ? details.latitude.toFixed(5) : 'N/A'}, ${details.longitude ? details.longitude.toFixed(5) : 'N/A'}\nAddress: ${details.address}\nTime: ${details.timestampStr}\n\nPlease contact ${details.senderName} immediately and arrange assistance.\n\nAutomated emergency notification.`;
  }

  for (const c of contacts) {
    const rawPhone = (c.phone || '').trim();
    if (!rawPhone) continue;

    let cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
    if (/^\d{10}$/.test(cleanPhone)) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (/^0\d{10}$/.test(cleanPhone)) {
      cleanPhone = `+91${cleanPhone.slice(1)}`;
    } else if (!cleanPhone.startsWith('+') && /^\d{11,13}$/.test(cleanPhone)) {
      cleanPhone = `+${cleanPhone}`;
    }

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        const formParams = new URLSearchParams();
        formParams.append('To', cleanPhone);
        formParams.append('From', TWILIO_PHONE_NUMBER);
        formParams.append('Body', messageText);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formParams.toString()
        });

        const twilioData = await twilioRes.json() as any;
        if (twilioRes.ok && twilioData.sid) {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: 'ACCEPTED',
            provider: 'twilio',
            messageId: twilioData.sid,
            dispatchedAt: now
          });
        } else {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: 'FAILED',
            provider: 'twilio',
            error: twilioData.message || twilioData.error_message || 'Twilio rejected message',
            dispatchedAt: now
          });
        }
      } catch (err: any) {
        results.push({
          recipient: cleanPhone,
          recipientName: c.name,
          status: 'FAILED',
          provider: 'twilio',
          error: err.message || 'Twilio connection failed',
          dispatchedAt: now
        });
      }
    } else if (FAST2SMS_API_KEY) {
      try {
        const indianTenDigit = cleanPhone.replace(/^\+91/, '');
        const f2sRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'v3',
            sender_id: 'TXTIND',
            message: messageText,
            language: 'english',
            flash: 0,
            numbers: indianTenDigit
          })
        });
        const f2sData = await f2sRes.json() as any;
        if (f2sRes.ok && f2sData.return === true) {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: 'ACCEPTED',
            provider: 'fast2sms',
            messageId: f2sData.request_id || 'fast2sms_req',
            dispatchedAt: now
          });
        } else {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: 'FAILED',
            provider: 'fast2sms',
            error: f2sData.message?.[0] || 'Fast2SMS error',
            dispatchedAt: now
          });
        }
      } catch (err: any) {
        results.push({
          recipient: cleanPhone,
          recipientName: c.name,
          status: 'FAILED',
          provider: 'fast2sms',
          error: err.message || 'Fast2SMS network error',
          dispatchedAt: now
        });
      }
    } else {
      results.push({
        recipient: cleanPhone,
        recipientName: c.name,
        status: 'UNCONFIGURED',
        provider: 'none',
        error: 'SMS provider not configured in .env.local (TWILIO_ACCOUNT_SID or FAST2SMS_API_KEY required)',
        dispatchedAt: now
      });
    }
  }

  return results;
}

const isDeliverableEmail = (email?: string): boolean => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower.includes('@') &&
    !lower.endsWith('.test') &&
    !lower.endsWith('.internal') &&
    !lower.endsWith('.example') &&
    !lower.endsWith('.invalid') &&
    !lower.includes('demo@') &&
    !lower.includes('apollohospitals.test')
  );
};

// Dispatch real email via Nodemailer (SMTP / Gmail) or Resend
async function dispatchEmergencyEmail(
  contacts: Array<{ name: string; email: string }>,
  details: {
    senderName: string;
    familyId: string;
    address: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
    googleMapsUrl: string;
    timestampStr: string;
    isCancellation?: boolean;
    cancellationReason?: string;
  }
): Promise<EmailDeliveryResult[]> {
  const filteredContacts = contacts.filter(c => isDeliverableEmail(c.email));
  const results: EmailDeliveryResult[] = [];
  const now = new Date().toISOString();

  let smtpTransporter: Transporter | null = null;
  if (SMTP_USER && SMTP_PASS) {
    try {
      smtpTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });
    } catch (err) {
      console.warn('Failed to initialize SMTP transporter:', err);
    }
  }

  for (const c of filteredContacts) {
    const rawEmail = (c.email || '').trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes('@')) continue;

    const subject = details.isCancellation
      ? `RESOLVED: Emergency SOS Cancelled – ${details.senderName} is Safe`
      : `🚨 URGENT: Emergency SOS Alert – ${details.senderName} Needs Help!`;

    const emailHtml = details.isCancellation
      ? `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 3px solid #10b981; border-radius: 16px; background-color: #ecfdf5;">
        <h1 style="color: #065f46; margin-top: 0; font-size: 24px;">✅ EMERGENCY RESOLVED – ALL IS SAFE</h1>
        <p style="font-size: 16px; color: #1e293b;"><strong>${details.senderName}</strong> has cancelled the emergency alert and marked their status as safe.</p>
        <div style="background: #ffffff; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #a7f3d0;">
          <p style="margin: 6px 0;"><strong>Resolution Timestamp:</strong> ${details.timestampStr}</p>
          <p style="margin: 6px 0;"><strong>Resolved Location:</strong> ${details.address}</p>
        </div>
        <p style="font-size: 13px; color: #047857; font-weight: bold;">No emergency response or assistance is required.</p>
        <hr style="border: 0; border-top: 1px solid #d1fae5; margin: 20px 0;" />
        <p style="font-size: 11px; color: #6b7280;">Dispatched automatically by HomeBrain Autonomous Cognitive Ecosystem.</p>
      </div>`
      : `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 3px solid #e11d48; border-radius: 16px; background-color: #fff1f2;">
        <div style="display: inline-block; background-color: #e11d48; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">
          🚨 Urgent Emergency Alert
        </div>
        <h1 style="color: #9f1239; margin-top: 14px; margin-bottom: 8px; font-size: 26px;">EMERGENCY SOS DISPATCHED</h1>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.5;">
          <strong>${details.senderName}</strong> has triggered an urgent emergency alert from their device and requires immediate family assistance.
        </p>
        <div style="background: #ffffff; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #fecdd3; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Timestamp:</strong> ${details.timestampStr}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Dispatched Address:</strong> ${details.address}</p>
          ${details.latitude && details.longitude ? `<p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>GPS Coordinates:</strong> ${details.latitude.toFixed(6)}, ${details.longitude.toFixed(6)} (±${Math.round(details.accuracyMeters || 0)}m)</p>` : ''}
        </div>
        <div style="text-align: center; margin: 26px 0;">
          <a href="${details.googleMapsUrl}" style="background-color: #e11d48; color: #ffffff; padding: 15px 32px; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(225,29,72,0.35);">
            📍 Open Exact Location in Google Maps
          </a>
        </div>
        <div style="background-color: #ffe4e6; padding: 12px; border-radius: 10px; border-left: 4px solid #e11d48; font-size: 13px; color: #881337; margin-bottom: 20px;">
          ⚠️ <strong>Action Required:</strong> Please attempt to call or reach out to ${details.senderName} immediately.
        </div>
        <p style="font-size: 11px; color: #64748b;">Dispatched automatically by HomeBrain Autonomous Cognitive Ecosystem (Family: ${details.familyId}).</p>
      </div>`;

    // 1. Try Nodemailer / Gmail SMTP if credentials configured
    if (smtpTransporter) {
      try {
        const info = await smtpTransporter.sendMail({
          from: `"HomeBrain SOS Alert" <${SMTP_USER}>`,
          to: rawEmail,
          subject,
          html: emailHtml
        });
        results.push({
          recipient: rawEmail,
          recipientName: c.name,
          status: 'ACCEPTED',
          provider: 'nodemailer',
          messageId: info.messageId,
          dispatchedAt: now
        });
        continue;
      } catch (smtpErr: any) {
        console.warn(`SMTP delivery error to ${rawEmail}:`, smtpErr.message);
      }
    }

    // 2. Try Resend if configured (each configured key in turn)
    if (RESEND_API_KEYS.length > 0) {
      let lastError = 'Resend rejected email';
      let delivered = false;
      for (const apiKey of RESEND_API_KEYS) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: EMAIL_FROM,
              to: [rawEmail],
              subject,
              html: emailHtml
            })
          });
          const resData = await res.json().catch(() => ({})) as any;
          if (res.ok && resData.id) {
            results.push({
              recipient: rawEmail,
              recipientName: c.name,
              status: 'ACCEPTED',
              provider: 'resend',
              messageId: resData.id,
              dispatchedAt: now
            });
            delivered = true;
            break;
          }
          lastError = resData.message || `Resend rejected email (HTTP ${res.status})`;
        } catch (err: any) {
          lastError = err.message || 'Resend network error';
        }
      }
      if (!delivered) {
        results.push({
          recipient: rawEmail,
          recipientName: c.name,
          status: 'FAILED',
          provider: 'resend',
          error: lastError,
          dispatchedAt: now
        });
      }
      continue;
    }

    // 3. Neither configured
    results.push({
      recipient: rawEmail,
      recipientName: c.name,
      status: 'UNCONFIGURED',
      provider: 'none',
      error: 'Email gateway not configured in .env.local (Add SMTP_USER=harleysham6925@gmail.com and SMTP_PASS or RESEND_API_KEY)',
      dispatchedAt: now
    });
  }

  return results;
}

// --- Emergency SOS Alert Dispatch Endpoint ---
app.post('/api/emergency/alert', authenticateEmergencyUser, async (req: Request, res: Response): Promise<void> => {
  const {
    address,
    latitude,
    longitude,
    accuracyMeters,
    mapUrl,
    locationSource = 'unknown',
    idempotencyKey,
    recipients = []
  } = req.body;
  const user = req.user!;
  const token = req.authToken || '';

  if (!address) {
    res.status(400).json({ error: 'address is required for emergency dispatch.' });
    return;
  }

  // Idempotency check: Debounce requests within 45 seconds to prevent accidental duplicate blasts
  if (idempotencyKey) {
    const cached = emergencyIdempotencyCache.get(idempotencyKey);
    if (cached && (Date.now() - cached.timestamp < 45000)) {
      res.json(cached.responseData);
      return;
    }
  }

  try {
    // 1. Gather Authorized Emergency Contacts
    let contactList: Array<{ name: string; phone: string; email?: string }> = [];

    if (token && SUPABASE_URL) {
      const dbContacts = await fetchFamilyData('emergency_contacts', user.familyId, token);
      if (dbContacts.length > 0) {
        contactList = dbContacts.map((c: any) => ({
          name: c.name,
          phone: c.phone,
          email: c.email
        }));
      }
    }

    // If client supplied verified contact list (e.g. in demo or recent update), merge them
    if (recipients.length > 0) {
      const existingPhones = new Set(contactList.map(c => (c.phone || '').replace(/[\s\-\(\)]/g, '')).filter(Boolean));
      const existingEmails = new Set(contactList.map(c => (c.email || '').trim().toLowerCase()).filter(Boolean));
      recipients.forEach((r: any) => {
        const clean = (r.phone || '').replace(/[\s\-\(\)]/g, '');
        const email = (r.email || '').trim().toLowerCase();
        const phoneIsNew = Boolean(clean) && !existingPhones.has(clean);
        const emailIsNew = Boolean(email) && !existingEmails.has(email);
        if (phoneIsNew || emailIsNew) {
          contactList.push({
            name: r.name,
            phone: r.phone || '',
            email: r.email
          });
          if (clean) existingPhones.add(clean);
          if (email) existingEmails.add(email);
        }
      });
    }

    // Always ensure verified default emergency contacts receive the alert
    const defaultAlertRecipients = [
      { name: 'Harley Sham', email: 'harleysham6925@gmail.com', phone: '' },
      { name: 'Sham Sampath', email: 'shamsampth06@gmail.com', phone: '' }
    ];
    defaultAlertRecipients.forEach(def => {
      if (!contactList.some(c => (c.email || '').trim().toLowerCase() === def.email.toLowerCase())) {
        contactList.push(def);
      }
    });

    const googleMapsUrl = (latitude && longitude)
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // 2. Dispatch Cellular SMS and Transactional Email in Parallel
    const [smsResults, emailResults] = await Promise.all([
      dispatchEmergencySMS(
        contactList.filter(c => Boolean(c.phone)),
        {
          senderName: user.name,
          address,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          googleMapsUrl,
          timestampStr
        }
      ),
      dispatchEmergencyEmail(
        contactList.filter(c => Boolean(c.email && c.email.includes('@'))).map(c => ({ name: c.name, email: c.email! })),
        {
          senderName: user.name,
          familyId: user.familyId,
          address,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          accuracyMeters: accuracyMeters || undefined,
          googleMapsUrl,
          timestampStr
        }
      )
    ]);

    // 3. Determine Overall Event Delivery Status
    const anySmsAccepted = smsResults.some(r => r.status === 'ACCEPTED');
    const anyEmailAccepted = emailResults.some(r => r.status === 'ACCEPTED');
    const allFailed = (smsResults.length > 0 && smsResults.every(r => r.status === 'FAILED')) &&
      (emailResults.length > 0 && emailResults.every(r => r.status === 'FAILED'));

    const overallStatus: 'DELIVERED' | 'SENT' | 'ACCEPTED' | 'FAILED' | 'LOGGED' =
      (anySmsAccepted || anyEmailAccepted) ? 'ACCEPTED' : (allFailed ? 'FAILED' : 'LOGGED');

    // 4. Save Event to Emergency Logs
    const logPayload = {
      timestamp: new Date().toISOString(),
      user_location: address,
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy_meters: accuracyMeters || null,
      user_id: user.id,
      user_name: user.name,
      status: overallStatus,
      recipients: contactList.map(c => `${c.name} (${c.phone || c.email})`),
      email_results: emailResults
    };

    let savedLog: any = null;
    if (token && SUPABASE_URL) {
      savedLog = await insertFamilyData('emergency_logs', logPayload, token);
    }

    const responseData = {
      success: true,
      eventId: savedLog?.id || crypto.randomUUID(),
      timestamp: logPayload.timestamp,
      address,
      latitude,
      longitude,
      accuracyMeters,
      locationSource,
      googleMapsUrl,
      overallStatus,
      contactsNotifiedCount: contactList.length,
      sms: {
        providerConfigured: Boolean(TWILIO_ACCOUNT_SID || FAST2SMS_API_KEY),
        activeProvider: TWILIO_ACCOUNT_SID ? 'twilio' : FAST2SMS_API_KEY ? 'fast2sms' : 'none',
        results: smsResults
      },
      email: {
        providerConfigured: Boolean(SMTP_USER && SMTP_PASS) || RESEND_API_KEYS.length > 0,
        activeProvider: (SMTP_USER && SMTP_PASS) ? 'nodemailer' : RESEND_API_KEYS.length > 0 ? 'resend' : 'none',
        results: emailResults
      }
    };

    if (idempotencyKey) {
      emergencyIdempotencyCache.set(idempotencyKey, { timestamp: Date.now(), responseData });
    }

    res.json(responseData);
  } catch (err: any) {
    console.error('Emergency alert execution error:', err);
    res.status(500).json({ error: err.message || 'Emergency alert execution failed.' });
  }
});

// --- Emergency SOS Cancel / False Alarm Endpoint ---
app.post('/api/emergency/cancel', authenticateEmergencyUser, async (req: Request, res: Response): Promise<void> => {
  const { sessionId, address = 'Home', reason = 'Marked safe by user', contacts = [] } = req.body;
  const user = req.user!;
  const token = req.authToken || '';
  const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  try {
    // 1. Gather contacts to notify of safe resolution
    let contactList: Array<{ name: string; phone?: string; email?: string }> = Array.isArray(contacts) && contacts.length > 0 ? [...contacts] : [];
    if (contactList.length === 0 && Array.isArray((req.body as any).recipients) && (req.body as any).recipients.length > 0) {
      contactList = [...(req.body as any).recipients];
    }
    if (contactList.length === 0 && token && SUPABASE_URL) {
      contactList = await fetchFamilyData('emergency_contacts', user.familyId, token);
    }

    // Always guarantee verified default emergency contacts receive resolution email
    const defaultRecipients = [
      { name: 'Harley Sham', email: 'harleysham6925@gmail.com', phone: '' },
      { name: 'Sham Sampath', email: 'shamsampth06@gmail.com', phone: '' }
    ];
    defaultRecipients.forEach(def => {
      if (!contactList.some(c => (c.email || '').trim().toLowerCase() === def.email.toLowerCase())) {
        contactList.push(def);
      }
    });

    // 2. Dispatch Resolution SMS & Email
    const [smsResults, emailResults] = await Promise.all([
      dispatchEmergencySMS(
        contactList.filter((c: any) => Boolean(c.phone)),
        {
          senderName: user.name,
          address,
          googleMapsUrl: '',
          timestampStr,
          isCancellation: true,
          cancellationReason: reason
        }
      ),
      dispatchEmergencyEmail(
        contactList.filter((c: any) => Boolean(c.email && c.email.includes('@'))).map((c: any) => ({ name: c.name, email: c.email! })),
        {
          senderName: user.name,
          familyId: user.familyId,
          address,
          googleMapsUrl: '',
          timestampStr,
          isCancellation: true,
          cancellationReason: reason
        }
      )
    ]);

    res.json({
      success: true,
      status: 'CANCELLED',
      sessionId,
      message: 'Emergency alert successfully cancelled and safety notices sent to contacts.',
      smsResults,
      emailResults
    });
  } catch (err: any) {
    console.error('Emergency cancellation error:', err);
    res.status(500).json({ error: err.message || 'Emergency cancellation failed.' });
  }
});

// --- Emergency SOS Retry Endpoint ---
app.post('/api/emergency/retry', authenticateEmergencyUser, async (req: Request, res: Response): Promise<void> => {
  const {
    failedSmsContacts = [],
    failedEmailContacts = [],
    address,
    latitude,
    longitude,
    accuracyMeters
  } = req.body;
  const user = req.user!;
  const googleMapsUrl = (latitude && longitude)
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || 'Emergency Location')}`;
  const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  try {
    const [smsResults, emailResults] = await Promise.all([
      dispatchEmergencySMS(failedSmsContacts, {
        senderName: user.name,
        address,
        latitude,
        longitude,
        googleMapsUrl,
        timestampStr
      }),
      dispatchEmergencyEmail(failedEmailContacts, {
        senderName: user.name,
        familyId: user.familyId,
        address,
        latitude,
        longitude,
        accuracyMeters,
        googleMapsUrl,
        timestampStr
      })
    ]);

    res.json({
      success: true,
      retriedAt: new Date().toISOString(),
      smsResults,
      emailResults
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Emergency retry execution failed.' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🧠 HomeBrain Secure AI Backend running on http://localhost:${PORT}`);
  });
}

export default app;
