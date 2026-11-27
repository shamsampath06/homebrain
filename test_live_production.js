import https from 'https';

const BASE_URL = 'https://homebrain-delta.vercel.app';
const PRIMARY_HOUSEHOLD_ID = '3a131e95-0000-4000-8000-3a131e953a13';
const PRIMARY_INVITE_CODE = 'HB-JBZKW5';

function req(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { ...(options.headers || {}) };
    let bodyData = null;
    if (options.body) {
      bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }
    const request = https.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    request.on('error', reject);
    if (bodyData) {
      request.write(bodyData);
    }
    request.end();
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runLiveProductionTest() {
  console.log('================================================================');
  console.log('🌍 LIVE PRODUCTION VERIFICATION (https://homebrain-delta.vercel.app)');
  console.log('================================================================\n');

  // 1. Authenticate Father, Son, and Sister
  console.log('--- PHASE 1: Live Authentication & Roster Sync ---');
  const fatherAuth = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'harleysham6925@gmail.com', password: 'password123' }
  });
  const fatherToken = fatherAuth.data?.token;
  console.log('1A. Father Logged In:', fatherAuth.status, fatherAuth.data?.user?.name, `(${fatherAuth.data?.user?.role}, ${fatherAuth.data?.user?.relation})`);

  const sonAuth = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'shamsampth06@gmail.com', password: 'password123' }
  });
  const sonToken = sonAuth.data?.token;
  console.log('1B. Son Logged In:', sonAuth.status, sonAuth.data?.user?.name, `(${sonAuth.data?.user?.role}, ${sonAuth.data?.user?.relation})`);

  const sisterAuth = await req('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      email: 'sister.sneha@gmail.com',
      name: 'sneha',
      relation: 'Sister',
      role: 'Member',
      inviteCode: PRIMARY_INVITE_CODE,
      mode: 'join'
    }
  });
  const sisterToken = sisterAuth.data?.token;
  console.log('1C. Sister Joined:', sisterAuth.status, sisterAuth.data?.user?.name, `(${sisterAuth.data?.user?.role}, ${sisterAuth.data?.user?.relation})`);

  // Verify all in Family Hub
  const hub = await req('/api/family/hub', {
    headers: { Authorization: `Bearer ${fatherToken}` }
  });
  console.log('1D. Connected Members in Hub:', hub.data?.members?.map(m => `${m.name} [${m.relation}]`));
  if (!hub.data?.members || hub.data.members.length < 3) {
    throw new Error('Hub members count less than 3!');
  }
  console.log('✓ PASS: All 3 family accounts synchronized in live Family Hub!');

  // 2. SMART GROCERY LIST TEST
  console.log('\n--- PHASE 2: Smart Grocery List (Add, Purchase, Delete, Sync) ---');
  const now = Date.now();
  const liveGroc1 = {
    id: `groc-${now}-milk`,
    name: 'Aavin Green Milk 1L',
    category: 'Dairy',
    quantity: '2 Packets',
    notes: 'Morning tea',
    isPurchased: false
  };
  const liveGroc2 = {
    id: `groc-${now}-apples`,
    name: 'Shimla Fresh Apples',
    category: 'Produce',
    quantity: '1.5 Kg',
    notes: 'For snacks',
    isPurchased: false
  };

  // Son adds 2 grocery items
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { table: 'groceries', item: liveGroc1 }
  });
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { table: 'groceries', item: liveGroc2 }
  });
  console.log('2A. Son added 2 live grocery items: Milk & Apples');

  await sleep(1000);

  // Father checks grocery list
  const fSync = await req('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { familyId: PRIMARY_HOUSEHOLD_ID }
  });
  const fSawMilk = fSync.data?.groceries?.some(g => g.id === liveGroc1.id);
  const fSawApples = fSync.data?.groceries?.some(g => g.id === liveGroc2.id);
  console.log('2B. Father sees Son groceries live:', { milk: fSawMilk, apples: fSawApples });
  if (!fSawMilk || !fSawApples) throw new Error('Father did not see Son groceries on live production!');

  // Father marks Milk as purchased
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { table: 'groceries', item: { ...liveGroc1, isPurchased: true, purchasedBy: 'sham (Father)', purchasedAt: new Date().toISOString() } }
  });
  console.log('2C. Father marked Milk as PURCHASED');

  await sleep(1000);

  // Sister checks groceries
  const sisSync = await req('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
    body: { familyId: PRIMARY_HOUSEHOLD_ID }
  });
  const sisMilkPurchased = sisSync.data?.groceries?.find(g => g.id === liveGroc1.id)?.isPurchased;
  console.log('2D. Sister sees Milk marked as purchased by Father:', sisMilkPurchased);
  if (!sisMilkPurchased) throw new Error('Sister did not see Father purchase update on live production!');

  // Son deletes Apples
  await req('/api/family/item', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { table: 'groceries', id: liveGroc2.id }
  });
  console.log('2E. Son deleted Apples from grocery list');

  await sleep(1000);

  const finalGrocSync = await req('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { familyId: PRIMARY_HOUSEHOLD_ID }
  });
  const fApplesDeleted = !finalGrocSync.data?.groceries?.some(g => g.id === liveGroc2.id);
  console.log('2F. Father verifies Apples removed permanently:', fApplesDeleted);
  if (!fApplesDeleted) throw new Error('Grocery deletion failed on live production!');
  console.log('✓ PASS: Smart Grocery List workflow verified 100% on live production!');

  // 3. CALENDAR MODULE
  console.log('\n--- PHASE 3: Calendar & Family Events ---');
  const liveEvent = {
    id: `evt-${now}`,
    title: 'Family Weekend Dinner & Movie Night',
    date: '2026-11-29',
    time: '07:30 PM',
    category: 'Dinner',
    location: 'VR Mall, Chennai',
    createdByName: 'sham (Father)',
    membersInvolved: ['sham', 'sha', 'sneha']
  };
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { table: 'events', item: liveEvent }
  });
  await sleep(1000);
  const sonCalSync = await req('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { familyId: PRIMARY_HOUSEHOLD_ID }
  });
  const sonSawEvent = sonCalSync.data?.events?.some(e => e.id === liveEvent.id);
  console.log('3A. Son sees Father Calendar Event:', sonSawEvent);
  if (!sonSawEvent) throw new Error('Calendar event sync failed on live production!');
  console.log('✓ PASS: Calendar & Events Module verified 100% on live production!');

  // 4. EXPENSES MODULE
  console.log('\n--- PHASE 4: Shared Expenses & Finances ---');
  const liveExpense = {
    id: `exp-${now}`,
    title: 'Broadband Fiber Internet Bill',
    amount: 1199,
    category: 'Utilities',
    date: '2026-11-27',
    paid_by: 'sha (Son)'
  };
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { table: 'expenses', item: liveExpense }
  });
  await sleep(1000);
  const sisExpSync = await req('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
    body: { familyId: PRIMARY_HOUSEHOLD_ID }
  });
  const sisSawExpense = sisExpSync.data?.expenses?.some(x => x.id === liveExpense.id);
  console.log('4A. Sister sees Son Expense (₹1,199):', sisSawExpense);
  if (!sisSawExpense) throw new Error('Expense sync failed on live production!');
  console.log('✓ PASS: Expenses & Finances Module verified 100% on live production!');

  // 5. DOCUMENT VAULT MODULE
  console.log('\n--- PHASE 5: Document Vault ---');
  const liveDoc = {
    id: `doc-${now}`,
    title: 'Kumar_Household_Power_Connection.pdf',
    category: 'Property',
    description: 'TNEB Electricity Service Connection Card & Consumer Number',
    summaryContent: 'Consumer ID: 01-234-567-890 registered to Kumar Household.',
    uploadDate: '2026-11-27',
    createdByName: 'sham (Father)'
  };
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { table: 'documents', item: liveDoc }
  });
  await sleep(1000);
  const sonDocSync = await req('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { familyId: PRIMARY_HOUSEHOLD_ID }
  });
  const sonSawDoc = sonDocSync.data?.documents?.some(d => d.id === liveDoc.id);
  console.log('5A. Son sees Father Document in Vault:', sonSawDoc);
  if (!sonSawDoc) throw new Error('Document sync failed on live production!');
  console.log('✓ PASS: Document Vault Module verified 100% on live production!');

  // 6. REMINDERS & MEDICINES MODULE
  console.log('\n--- PHASE 6: Reminders & Health/Medicines ---');
  const liveRem = {
    id: `rem-${now}`,
    title: 'Water Purifier Service & Filter Replacement',
    date: '2026-12-02',
    priority: 'Normal',
    completed: false,
    assignedTo: 'Family'
  };
  const liveMed = {
    id: `med-${now}`,
    name: 'Multivitamin Complex',
    dosage: '1 Capsule',
    timing: 'After Lunch (02:00 PM)',
    frequency: 'Daily',
    personName: 'sha (Son)'
  };
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
    body: { table: 'reminders', item: liveRem }
  });
  await req('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { table: 'medicines', item: liveMed }
  });
  await sleep(1000);
  const fHealthSync = await req('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { familyId: PRIMARY_HOUSEHOLD_ID }
  });
  const fSawRem = fHealthSync.data?.reminders?.some(r => r.id === liveRem.id);
  const fSawMed = fHealthSync.data?.medicines?.some(m => m.id === liveMed.id);
  console.log('6A. Father sees Sister Reminder & Son Medicine:', { reminder: fSawRem, medicine: fSawMed });
  if (!fSawRem || !fSawMed) throw new Error('Reminders or medicines sync failed on live production!');
  console.log('✓ PASS: Reminders & Health/Medicines verified 100% on live production!');

  console.log('\n================================================================');
  console.log('🎉 LIVE PRODUCTION VERIFICATION COMPLETE: ALL MODULES 100% OPERATIONAL!');
  console.log('================================================================\n');
}

runLiveProductionTest().catch(e => {
  console.error('\n❌ Live Production Test Failed:', e);
  process.exit(1);
});
