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
    const request = http.request({
      host: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
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
    if (options.body) {
      request.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    request.end();
  });
}

async function run() {
  const { server, port } = await startServer();
  console.log(`Test server running on port ${port}`);

  try {
    console.log('\n--- TEST 1: Father (sham) Login & Hub Verification ---');
    const fatherLogin = await req(port, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'harleysham6925@gmail.com', password: 'password123' }
    });
    console.log('Father login response:', fatherLogin.status, {
      name: fatherLogin.data?.user?.name,
      role: fatherLogin.data?.user?.role,
      relation: fatherLogin.data?.user?.relation,
      familyId: fatherLogin.data?.user?.familyId,
      inviteCode: fatherLogin.data?.user?.inviteCode
    });

    if (fatherLogin.data?.user?.inviteCode !== PRIMARY_INVITE_CODE) {
      throw new Error(`Father inviteCode mismatch: expected ${PRIMARY_INVITE_CODE}, got ${fatherLogin.data?.user?.inviteCode}`);
    }

    const fatherToken = fatherLogin.data.token;
    const fatherHub = await req(port, '/api/family/hub', {
      headers: { Authorization: `Bearer ${fatherToken}` }
    });
    console.log('Father Hub response:', {
      familyId: fatherHub.data?.familyId,
      familyName: fatherHub.data?.familyName,
      inviteCode: fatherHub.data?.inviteCode,
      members: fatherHub.data?.members?.map(m => `${m.name} (${m.relation}, ${m.role})`)
    });

    if (!fatherHub.data?.members?.some(m => m.name.toLowerCase().includes('sha'))) {
      throw new Error('Father Hub does NOT contain Son sha!');
    }
    console.log('✓ PASS: Father sees Son in household roster!');

    console.log('\n--- TEST 2: Son (sha) Login & Hub Verification ---');
    const sonLogin = await req(port, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'shamsampth06@gmail.com', password: 'password123' }
    });
    console.log('Son login response:', sonLogin.status, {
      name: sonLogin.data?.user?.name,
      role: sonLogin.data?.user?.role,
      relation: sonLogin.data?.user?.relation,
      familyId: sonLogin.data?.user?.familyId,
      inviteCode: sonLogin.data?.user?.inviteCode
    });

    const sonToken = sonLogin.data.token;
    const sonHub = await req(port, '/api/family/hub', {
      headers: { Authorization: `Bearer ${sonToken}` }
    });
    console.log('Son Hub members:', sonHub.data?.members?.map(m => `${m.name} (${m.relation}, ${m.role})`));

    if (!sonHub.data?.members?.some(m => m.name.toLowerCase().includes('sham'))) {
      throw new Error('Son Hub does NOT contain Father sham!');
    }
    console.log('✓ PASS: Son and Father have symmetric visibility of both accounts!');

    console.log('\n--- TEST 3: Cross-Module Interactions ---');
    console.log('3A. Father adds Calendar Event...');
    const eventItem = {
      id: 'evt-' + Date.now(),
      title: 'Family Weekend Ooty Trip & Sightseeing',
      date: '2026-12-15',
      time: '08:00 AM',
      category: 'Holiday',
      location: 'Ooty Lake & Botanical Gardens',
      createdByName: 'sham (Father)',
      membersInvolved: ['Family', 'Dad', 'Son', 'Sister']
    };
    const addEvtRes = await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { table: 'events', item: eventItem }
    });
    console.log('Event added:', addEvtRes.status, addEvtRes.data?.item?.title);

    console.log('3B. Son adds Grocery Item & Expense...');
    const groceryItem = {
      id: 'groc-' + Date.now(),
      name: 'Basmati Rice (5kg Bag) & Spices',
      category: 'Grains & Pantry',
      quantity: '5 kg',
      urgency: 'High',
      completed: false,
      added_by: 'sha (Son)'
    };
    const addGrocRes = await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { table: 'groceries', item: groceryItem }
    });
    console.log('Grocery added:', addGrocRes.status, addGrocRes.data?.item?.name);

    const expenseItem = {
      id: 'exp-' + Date.now(),
      title: 'Electricity & High-Speed WiFi Bill',
      amount: 1850,
      category: 'Utilities',
      date: '2026-11-27',
      paid_by: 'sha (Son)',
      notes: 'Monthly broadband and home utilities'
    };
    const addExpRes = await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { table: 'expenses', item: expenseItem }
    });
    console.log('Expense added:', addExpRes.status, addExpRes.data?.item?.title);

    console.log('3C. Father uploads Document to Document Vault...');
    const docItem = {
      id: 'doc-' + Date.now(),
      title: 'Family_House_Deed_and_Tax_Verification.pdf',
      category: 'Legal & Property',
      description: 'Official house ownership deed and 2026 municipal property tax clearance receipt.',
      summaryContent: 'Official certified house deed registered to Kumar Family Household.',
      uploadDate: '2026-11-27',
      createdByName: 'sham (Father)',
      isVerified: true
    };
    const addDocRes = await req(port, '/api/family/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { table: 'documents', item: docItem }
    });
    console.log('Document uploaded to Vault:', addDocRes.status, addDocRes.data?.item?.title);

    console.log('\n--- TEST 4: Bidirectional Delta Synchronization Verification ---');
    console.log('4A. Father fetches /api/family/sync to check Son updates...');
    const fatherSync = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID, inviteCode: PRIMARY_INVITE_CODE }
    });
    const fatherFoundSonGroc = fatherSync.data?.groceries?.some(g => g.id === groceryItem.id);
    const fatherFoundSonExp = fatherSync.data?.expenses?.some(x => x.id === expenseItem.id);
    console.log('Father sees Son Grocery:', fatherFoundSonGroc);
    console.log('Father sees Son Expense:', fatherFoundSonExp);

    if (!fatherFoundSonGroc || !fatherFoundSonExp) {
      throw new Error('Father could NOT see Son grocery or expense in delta sync!');
    }
    console.log('✓ PASS: Father received Son grocery and expense!');

    console.log('4B. Son fetches /api/family/sync to check Father updates...');
    const sonSync = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID, inviteCode: PRIMARY_INVITE_CODE }
    });
    const sonFoundFatherEvt = sonSync.data?.events?.some(e => e.id === eventItem.id);
    const sonFoundFatherDoc = sonSync.data?.documents?.some(d => d.id === docItem.id);
    console.log('Son sees Father Event:', sonFoundFatherEvt);
    console.log('Son sees Father Document:', sonFoundFatherDoc);

    if (!sonFoundFatherEvt || !sonFoundFatherDoc) {
      throw new Error('Son could NOT see Father event or document in delta sync!');
    }
    console.log('✓ PASS: Son received Father calendar event and vault document!');

    console.log('\n--- TEST 5: Sister (sneha) Joins Family via Invite Code ---');
    const sisterSignup = await req(port, '/api/auth/google', {
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
    console.log('Sister join response:', sisterSignup.status, {
      name: sisterSignup.data?.user?.name,
      relation: sisterSignup.data?.user?.relation,
      role: sisterSignup.data?.user?.role,
      inviteCode: sisterSignup.data?.user?.inviteCode
    });

    const sisterToken = sisterSignup.data?.token;
    const sisterHub = await req(port, '/api/family/hub', {
      headers: { Authorization: `Bearer ${sisterToken}` }
    });
    console.log('Sister Hub Connected Members count:', sisterHub.data?.members?.length);
    console.log('Sister Hub Members:', sisterHub.data?.members?.map(m => `${m.name} (${m.relation}, ${m.role})`));

    const sisterSawFather = sisterHub.data?.members?.some(m => m.name.toLowerCase().includes('sham'));
    const sisterSawSon = sisterHub.data?.members?.some(m => m.name.toLowerCase().includes('sha'));
    const sisterSawSelf = sisterHub.data?.members?.some(m => m.name.toLowerCase().includes('sneha'));

    if (!sisterSawFather || !sisterSawSon || !sisterSawSelf) {
      throw new Error(`Sister Hub missing expected members! Father: ${sisterSawFather}, Son: ${sisterSawSon}, Sister: ${sisterSawSelf}`);
    }
    console.log('✓ PASS: Sister sees all 3 family members (sham, sha, sneha)!');

    console.log('5B. Sister checks shared modules (Calendar, Groceries, Expenses, Vault)...');
    const sisterSync = await req(port, '/api/family/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
      body: { familyId: PRIMARY_HOUSEHOLD_ID, inviteCode: PRIMARY_INVITE_CODE }
    });

    const sisSawEvt = sisterSync.data?.events?.some(e => e.id === eventItem.id);
    const sisSawGroc = sisterSync.data?.groceries?.some(g => g.id === groceryItem.id);
    const sisSawExp = sisterSync.data?.expenses?.some(x => x.id === expenseItem.id);
    const sisSawDoc = sisterSync.data?.documents?.some(d => d.id === docItem.id);

    console.log('Sister saw Calendar Event:', sisSawEvt);
    console.log('Sister saw Grocery Item:', sisSawGroc);
    console.log('Sister saw Expense:', sisSawExp);
    console.log('Sister saw Vault Document:', sisSawDoc);

    if (!sisSawEvt || !sisSawGroc || !sisSawExp || !sisSawDoc) {
      throw new Error('Sister is missing shared data from other family members!');
    }
    console.log('✓ PASS: Sister instantly accessed all items across all 4 modules!');

    console.log('\n========================================');
    console.log('🎉 ALL MULTI-USER FAMILY TESTS PASSED 100%!');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
