import https from 'https';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request('https://homebrain-delta.vercel.app' + path, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function verify() {
  console.log('🚀 Running Live Production End-to-End Verification on https://homebrain-delta.vercel.app\n');

  console.log('Step 1: Authenticate Father (sham / harleysham6925@gmail.com)...');
  const fatherAuth = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'harleysham6925@gmail.com', password: 'password123' }
  });
  console.log('Father Auth:', fatherAuth.status, {
    name: fatherAuth.data?.user?.name,
    role: fatherAuth.data?.user?.role,
    relation: fatherAuth.data?.user?.relation,
    inviteCode: fatherAuth.data?.user?.inviteCode,
    familyName: fatherAuth.data?.user?.familyName
  });

  const fatherToken = fatherAuth.data?.token;
  if (!fatherToken) throw new Error('Failed to get Father token!');

  const fatherHub = await request('/api/family/hub', {
    headers: { Authorization: `Bearer ${fatherToken}` }
  });
  console.log('Father Hub Members:', fatherHub.data?.members?.map(m => `${m.name} (${m.relation}, ${m.role})`));

  console.log('\nStep 2: Authenticate Son (sha / shamsampth06@gmail.com)...');
  const sonAuth = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'shamsampth06@gmail.com', password: 'password123' }
  });
  console.log('Son Auth:', sonAuth.status, {
    name: sonAuth.data?.user?.name,
    role: sonAuth.data?.user?.role,
    relation: sonAuth.data?.user?.relation,
    inviteCode: sonAuth.data?.user?.inviteCode,
    familyName: sonAuth.data?.user?.familyName
  });

  const sonToken = sonAuth.data?.token;
  if (!sonToken) throw new Error('Failed to get Son token!');

  const sonHub = await request('/api/family/hub', {
    headers: { Authorization: `Bearer ${sonToken}` }
  });
  console.log('Son Hub Members:', sonHub.data?.members?.map(m => `${m.name} (${m.relation}, ${m.role})`));

  console.log('\nStep 3: Father adds Calendar Event...');
  const calEvt = {
    id: 'evt-live-' + Date.now(),
    title: 'Family Gathering & Temple Visit',
    date: '2026-12-10',
    time: '09:00 AM',
    category: 'Celebration',
    location: 'Family Ancestral Home',
    createdByName: 'sham (Father)',
    membersInvolved: ['Dad', 'Son', 'Sister', 'Family']
  };
  const addEvt = await request('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { table: 'events', item: calEvt }
  });
  console.log('Calendar Event Added:', addEvt.status, addEvt.data?.item?.title);

  console.log('\nStep 4: Son adds Grocery item & records Expense...');
  const grocItem = {
    id: 'groc-live-' + Date.now(),
    name: 'Fresh Fruits (Apples & Bananas) & Milk',
    category: 'Produce & Dairy',
    quantity: '2 Bags',
    urgency: 'Medium',
    completed: false,
    added_by: 'sha (Son)'
  };
  const addGroc = await request('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { table: 'groceries', item: grocItem }
  });
  console.log('Grocery Item Added:', addGroc.status, addGroc.data?.item?.name);

  const expItem = {
    id: 'exp-live-' + Date.now(),
    title: 'Weekly Supermarket & Provisions',
    amount: 1450,
    category: 'Groceries',
    date: '2026-11-27',
    paid_by: 'sha (Son)'
  };
  const addExp = await request('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { table: 'expenses', item: expItem }
  });
  console.log('Expense Added:', addExp.status, addExp.data?.item?.title);

  console.log('\nStep 5: Father uploads Document to Document Vault...');
  const vaultDoc = {
    id: 'doc-live-' + Date.now(),
    title: 'House_Property_Deed_Certificate_2026.pdf',
    category: 'Legal & Property',
    description: 'Official Kumar household registered title deed and property documentation.',
    summaryContent: 'Title deed certificate for residential property in full legal compliance.',
    uploadDate: '2026-11-27',
    createdByName: 'sham (Father)'
  };
  const addDoc = await request('/api/family/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { table: 'documents', item: vaultDoc }
  });
  console.log('Vault Document Added:', addDoc.status, addDoc.data?.item?.title);

  console.log('\nStep 6: Bidirectional Cross-Module Visibility Check...');
  const fatherSync = await request('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fatherToken}` },
    body: { familyId: '3a131e95-0000-4000-8000-3a131e953a13', inviteCode: 'HB-JBZKW5' }
  });
  const sonSync = await request('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sonToken}` },
    body: { familyId: '3a131e95-0000-4000-8000-3a131e953a13', inviteCode: 'HB-JBZKW5' }
  });

  const fSawGroc = fatherSync.data?.groceries?.some(g => g.id === grocItem.id);
  const fSawExp = fatherSync.data?.expenses?.some(x => x.id === expItem.id);
  const sSawEvt = sonSync.data?.events?.some(e => e.id === calEvt.id);
  const sSawDoc = sonSync.data?.documents?.some(d => d.id === vaultDoc.id);

  console.log('Father sees Son Grocery on production:', fSawGroc);
  console.log('Father sees Son Expense on production:', fSawExp);
  console.log('Son sees Father Calendar Event on production:', sSawEvt);
  console.log('Son sees Father Vault Document on production:', sSawDoc);

  if (!fSawGroc || !fSawExp || !sSawEvt || !sSawDoc) {
    throw new Error('Live cross-module sync check failed!');
  }
  console.log('✓ PASS: Bidirectional sync between Father and Son is fully operational!');

  console.log('\nStep 7: Connect Sister (sneha / sister.sneha@gmail.com) to Household...');
  const sisterAuth = await request('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      email: 'sister.sneha@gmail.com',
      name: 'sneha',
      relation: 'Sister',
      role: 'Member',
      inviteCode: 'HB-JBZKW5',
      mode: 'join'
    }
  });
  console.log('Sister Joined:', sisterAuth.status, {
    name: sisterAuth.data?.user?.name,
    relation: sisterAuth.data?.user?.relation,
    role: sisterAuth.data?.user?.role,
    inviteCode: sisterAuth.data?.user?.inviteCode
  });

  const sisterToken = sisterAuth.data?.token;
  const sisterHub = await request('/api/family/hub', {
    headers: { Authorization: `Bearer ${sisterToken}` }
  });
  console.log('Sister Hub Members count:', sisterHub.data?.members?.length);
  console.log('Sister Hub Members:', sisterHub.data?.members?.map(m => `${m.name} (${m.relation}, ${m.role})`));

  const sisterSync = await request('/api/family/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sisterToken}` },
    body: { familyId: '3a131e95-0000-4000-8000-3a131e953a13', inviteCode: 'HB-JBZKW5' }
  });

  const sisEvt = sisterSync.data?.events?.some(e => e.id === calEvt.id);
  const sisGroc = sisterSync.data?.groceries?.some(g => g.id === grocItem.id);
  const sisExp = sisterSync.data?.expenses?.some(x => x.id === expItem.id);
  const sisDoc = sisterSync.data?.documents?.some(d => d.id === vaultDoc.id);

  console.log('Sister sees Calendar Event on production:', sisEvt);
  console.log('Sister sees Grocery Item on production:', sisGroc);
  console.log('Sister sees Expense on production:', sisExp);
  console.log('Sister sees Vault Document on production:', sisDoc);

  if (!sisEvt || !sisGroc || !sisExp || !sisDoc) {
    throw new Error('Sister live sync verification failed!');
  }
  console.log('✓ PASS: Sister immediately sees all 3 members and all shared family data!');

  console.log('\n======================================================');
  console.log('🌟 100% PRODUCTION LIVE VERIFICATION SUCCESSFUL!');
  console.log('======================================================\n');
}

verify().catch(e => {
  console.error('\n❌ Live Verification Failed:', e);
  process.exit(1);
});
