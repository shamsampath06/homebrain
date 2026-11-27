import http from 'http';
import app, { PRIMARY_HOUSEHOLD_ID, PRIMARY_INVITE_CODE } from './api/index.js';

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

function req(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = { ...(options.headers || {}) };
    let bodyData = null;
    if (options.body) {
      bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }
    const request = http.request({
      host: '127.0.0.1',
      port,
      path,
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

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 EXHAUSTIVE MULTI-USER TRAINING & CROSS-MODULE VALIDATION SUITE');
  console.log('================================================================\n');

  const { server, port } = await startServer();
  console.log(`✓ Local test server running on port ${port}`);

  try {
    // 1. Authenticate Father, Son, and Sister
    console.log('\n--- PHASE 1: Multi-Account Authentication & Roster Sync ---');
    const fatherAuth = await req(port, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'harleysham6925@gmail.com', password: 'password123' }
    });
    const fatherToken = fatherAuth.data?.token;
    console.log('1A. Father Logged In:', fatherAuth.status, fatherAuth.data?.user?.name, `(${fatherAuth.data?.user?.role}, ${fatherAuth.data?.user?.relation})`);

    const sonAuth = await req(port, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'shamsampth06@gmail.com', password: 'password123' }
    });
    const sonToken = sonAuth.data?.token;
    console.log('1B. Son Logged In:', sonAuth.status, sonAuth.data?.user?.name, `(${sonAuth.data?.user?.role}, ${sonAuth.data?.user?.relation})`);

    const sisterAuth = await req(port, '/api/auth/google', {
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

    // Verify all 3 in Family Hub
    const hub = await req(port, '/api/family/hub', {
      headers: { Authorization: `Bearer ${fatherToken}` }
    });
    console.log('1D. Connected Members in Hub:', hub.data?.members?.map(m => `${m.name} [${m.relation}]`));
    if (hub.data?.members?.length < 3) throw new Error('Expected at least 3 members in Hub!');

    // 2. SMART GROCERY LIST TEST (Add, Purchase Toggle, Delete, Cross-Device Sync)
    console.log('\n--- PHASE 2: Smart Grocery List Comprehensive Workflow ---');
    const item1 = {
      id: 'groc-' + Date.now() + '-1',
      name: 'Organic Milk 2L',
      category: 'Dairy',
      quantity: '2 Liters',
      notes: 'Low fat for Father',
      isPurchased: false
    };
    const item2 = {
      id: 'groc-' + Date.now() + '-2',
      name: 'Whole Wheat Bread',
      category: 'Bakery',
      quantity: '1 Loaf',
      isPurchased: false
    };
    const item3 = {
      id: 'groc-' + Date.now() + '-3',
      name: 'Fresh Fuji Apples',
      category: 'Produce',
      quantity: '1 Kg',
      isPurchased: false
    };

    // Son adds 3 grocery items
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { table: 'groceries', item: item1 }
    });
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { table: 'groceries', item: item2 }
    });
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { table: 'groceries', item: item3 }
    });
    console.log('2A. Son added 3 items: Milk, Bread, Apples');

    // Father checks grocery list
    const fSync1 = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID }
    });
    const fHasMilk = fSync1.data?.groceries?.some(g => g.id === item1.id && !g.isPurchased);
    const fHasBread = fSync1.data?.groceries?.some(g => g.id === item2.id);
    const fHasApples = fSync1.data?.groceries?.some(g => g.id === item3.id);
    console.log('2B. Father sees Son items in real-time:', { Milk: fHasMilk, Bread: fHasBread, Apples: fHasApples });
    if (!fHasMilk || !fHasBread || !fHasApples) throw new Error('Father did not receive Son groceries!');

    // Father purchases Milk
    const purchasedMilk = {
      ...item1,
      isPurchased: true,
      purchasedBy: 'sham (Father)',
      purchasedAt: new Date().toISOString()
    };
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { table: 'groceries', item: purchasedMilk }
    });
    console.log('2C. Father marked Milk as PURCHASED');

    // Son syncs and verifies Milk is marked purchased
    const sSync1 = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID }
    });
    const sMilkPurchased = sSync1.data?.groceries?.find(g => g.id === item1.id)?.isPurchased;
    console.log('2D. Son sees Milk is purchased by Father:', sMilkPurchased);
    if (!sMilkPurchased) throw new Error('Son did not see Father purchase update!');

    // Son deletes Bread
    await req(port, '/api/family/item', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { table: 'groceries', id: item2.id }
    });
    console.log('2E. Son deleted Whole Wheat Bread from list');

    // Sister syncs and verifies Bread is gone, Milk is purchased, Apples are pending
    const sisSync1 = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID }
    });
    const sisBreadGone = !sisSync1.data?.groceries?.some(g => g.id === item2.id);
    const sisMilkState = sisSync1.data?.groceries?.find(g => g.id === item1.id)?.isPurchased;
    console.log('2F. Sister verifies Bread deleted & Milk purchased:', { breadDeleted: sisBreadGone, milkPurchased: sisMilkState });
    if (!sisBreadGone || !sisMilkState) throw new Error('Grocery deletion or purchase sync failed for Sister!');
    console.log('✓ PASS: Smart Grocery List workflow (Add, Toggle, Delete, Multi-Device Sync) verified 100%!');

    // 3. CALENDAR & EVENTS MODULE
    console.log('\n--- PHASE 3: Calendar & Family Events Workflow ---');
    const calEvent = {
      id: 'evt-' + Date.now(),
      title: 'Grandma 75th Birthday Celebration',
      date: '2026-12-25',
      time: '11:00 AM',
      category: 'Celebration',
      location: 'Grand Palace Hotel, Chennai',
      createdByName: 'sham (Father)',
      membersInvolved: ['sham', 'sha', 'sneha']
    };
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { table: 'events', item: calEvent }
    });
    const sonCalCheck = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID }
    });
    const sonSawCal = sonCalCheck.data?.events?.some(e => e.id === calEvent.id);
    console.log('3A. Father created Event, Son sees it:', sonSawCal);
    if (!sonSawCal) throw new Error('Calendar event sync failed!');
    console.log('✓ PASS: Calendar & Events Module verified 100%!');

    // 4. EXPENSES & BILLS MODULE
    console.log('\n--- PHASE 4: Expenses & Bills Workflow ---');
    const exp1 = {
      id: 'exp-' + Date.now(),
      title: 'Electricity & Utility Bills',
      amount: 2850,
      category: 'Utilities',
      date: '2026-11-27',
      paid_by: 'sha (Son)'
    };
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { table: 'expenses', item: exp1 }
    });
    const sisExpCheck = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID }
    });
    const sisSawExp = sisExpCheck.data?.expenses?.some(x => x.id === exp1.id);
    console.log('4A. Son recorded ₹2,850 expense, Sister sees it:', sisSawExp);
    if (!sisSawExp) throw new Error('Expense sync failed!');
    console.log('✓ PASS: Expenses & Bills Module verified 100%!');

    // 5. DOCUMENT VAULT MODULE
    console.log('\n--- PHASE 5: Document Vault Workflow ---');
    const docItem = {
      id: 'doc-' + Date.now(),
      title: 'Kumar_Family_Health_Policy_2026.pdf',
      category: 'Medical',
      description: 'Comprehensive family floater health insurance policy bond.',
      summaryContent: 'Policy covers Father, Son, and Sister up to ₹15,00,000.',
      uploadDate: '2026-11-27',
      createdByName: 'sham (Father)'
    };
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { table: 'documents', item: docItem }
    });
    const sonDocCheck = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID }
    });
    const sonSawDoc = sonDocCheck.data?.documents?.some(d => d.id === docItem.id);
    console.log('5A. Father uploaded Policy doc, Son sees it:', sonSawDoc);
    if (!sonSawDoc) throw new Error('Document vault sync failed!');
    console.log('✓ PASS: Document Vault Module verified 100%!');

    // 6. REMINDERS & MEDICINES MODULE
    console.log('\n--- PHASE 6: Reminders & Health/Medicines Workflow ---');
    const remItem = {
      id: 'rem-' + Date.now(),
      title: 'Renew Vehicle Insurance & Emission Certificate',
      date: '2026-12-05',
      priority: 'High',
      completed: false,
      assignedTo: 'Son'
    };
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
      body: { table: 'reminders', item: remItem }
    });

    const medItem = {
      id: 'med-' + Date.now(),
      name: 'Amlodipine 5mg',
      dosage: '1 Tablet',
      timing: 'Morning (08:00 AM)',
      frequency: 'Daily',
      personName: 'sham (Father)'
    };
    await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { table: 'medicines', item: medItem }
    });

    const fSyncFinal = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID }
    });
    const fSawRem = fSyncFinal.data?.reminders?.some(r => r.id === remItem.id);
    const fSawMed = fSyncFinal.data?.medicines?.some(m => m.id === medItem.id);
    console.log('6A. Sister reminder & Father medicine verified:', { reminder: fSawRem, medicine: fSawMed });
    if (!fSawRem || !fSawMed) throw new Error('Reminders or medicines sync failed!');
    console.log('✓ PASS: Reminders & Health/Medicines Modules verified 100%!');

    console.log('\n================================================================');
    console.log('🌟 100% SUCCESS: ALL MODULES TRAINED, TESTED, & VERIFIED!');
    console.log('================================================================\n');

  } finally {
    server.close();
  }
}

runTestSuite().catch(e => {
  console.error('\n❌ Test Suite Failed:', e);
  process.exit(1);
});
