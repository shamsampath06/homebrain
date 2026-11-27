import { put } from '@vercel/blob';

const BLOB_FILE_NAME = 'homebrain-data.json';
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_ZOMgqCoRwpQVIkyH_q2zs6Nao3i2aSJSAmhHn4CYPyxFb8O';
const BLOB_URL = 'https://zomgqcorwpqvikyh.public.blob.vercel-storage.com/homebrain-data.json';
const PRIMARY_HOUSEHOLD_ID = '3a131e95-0000-4000-8000-3a131e953a13';
const PRIMARY_INVITE_CODE = 'HB-JBZKW5';

async function main() {
  console.log('Fetching existing cloud store data...');
  const res = await fetch(BLOB_URL + '?t=' + Date.now(), { cache: 'no-store' });
  const data = res.ok ? await res.json() : { households: {}, users: {}, deletedItemIds: [] };

  const targetHousehold = data.households?.[PRIMARY_HOUSEHOLD_ID] || {
    id: PRIMARY_HOUSEHOLD_ID,
    name: 'Family Household',
    inviteCode: PRIMARY_INVITE_CODE,
    createdBy: 'harleysham6925@gmail.com',
    members: []
  };

  // Collect all test/sample item IDs across all modules to tombstone them permanently
  const tombstones = new Set(data.deletedItemIds || []);
  const collectIds = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (item && item.id) tombstones.add(item.id);
      });
    }
  };

  collectIds(targetHousehold.events);
  collectIds(targetHousehold.groceries);
  collectIds(targetHousehold.expenses);
  collectIds(targetHousehold.bills);
  collectIds(targetHousehold.medicines);
  collectIds(targetHousehold.documents);
  collectIds(targetHousehold.reminders);
  collectIds(targetHousehold.memories);

  console.log(`Collected ${tombstones.size} tombstones to permanently prevent ghost resurrection.`);

  // Authoritative family members: sham (Father/Admin), sha (Son/Member), sneha (Sister/Member)
  targetHousehold.id = PRIMARY_HOUSEHOLD_ID;
  targetHousehold.name = 'Family Household';
  targetHousehold.inviteCode = PRIMARY_INVITE_CODE;
  targetHousehold.createdBy = 'harleysham6925@gmail.com';
  targetHousehold.members = [
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
    },
    {
      id: 'm-sister-sneha',
      userId: 'usr-sister-sneha',
      name: 'sneha',
      relation: 'Sister',
      role: 'Member',
      email: 'sister.sneha@gmail.com',
      phone: ''
    }
  ];

  // Completely clean slate across ALL 6 modules for the user's original account
  targetHousehold.events = [];
  targetHousehold.groceries = [];
  targetHousehold.expenses = [];
  targetHousehold.bills = [];
  targetHousehold.medicines = [];
  targetHousehold.documents = [];
  targetHousehold.reminders = [];
  targetHousehold.memories = [];

  data.households[PRIMARY_HOUSEHOLD_ID] = targetHousehold;
  if (data.households['demo-family-kumar']) {
    delete data.households['demo-family-kumar'];
  }

  // Authoritative registered accounts
  data.users = data.users || {};
  data.users['harleysham6925@gmail.com'] = {
    id: 'usr-father-sham',
    email: 'harleysham6925@gmail.com',
    name: 'sham',
    avatar: '👨‍💼',
    role: 'Admin',
    relation: 'Father / Dad',
    familyId: PRIMARY_HOUSEHOLD_ID,
    familyName: 'Family Household',
    inviteCode: PRIMARY_INVITE_CODE
  };
  data.users['shamsampth06@gmail.com'] = {
    id: 'usr-son-sha',
    email: 'shamsampth06@gmail.com',
    name: 'sha',
    avatar: '👦',
    role: 'Member',
    relation: 'Son',
    familyId: PRIMARY_HOUSEHOLD_ID,
    familyName: 'Family Household',
    inviteCode: PRIMARY_INVITE_CODE
  };
  data.users['sister.sneha@gmail.com'] = {
    id: 'usr-sister-sneha',
    email: 'sister.sneha@gmail.com',
    name: 'sneha',
    avatar: '👧',
    role: 'Member',
    relation: 'Sister',
    familyId: PRIMARY_HOUSEHOLD_ID,
    familyName: 'Family Household',
    inviteCode: PRIMARY_INVITE_CODE
  };

  // Remove any test user like stranger
  delete data.users['stranger@example.com'];
  delete data.users['stranger.other@example.com'];

  data.deletedItemIds = Array.from(tombstones);
  data.cleanVersion = 2026112801;
  data.updatedAt = Date.now() + 1000000;

  console.log('Uploading cleaned cloud blob to Vercel Blob...');
  const uploadRes = await put(BLOB_FILE_NAME, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: BLOB_READ_WRITE_TOKEN
  });

  console.log('Clean blob uploaded successfully at URL:', uploadRes.url);
}

main().catch(err => {
  console.error('Error cleaning data:', err);
  process.exit(1);
});
