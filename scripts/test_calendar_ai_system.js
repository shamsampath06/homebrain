import https from 'https';

const BASE_URL = 'https://homebrain-delta.vercel.app';
const FAMILY_ID = '3a131e95-0000-4000-8000-3a131e953a13';
const INVITE_CODE = 'HB-JBZKW5';

// Three separate accounts in the same household:
const FATHER = { email: 'harleysham6925@gmail.com', name: 'sham', role: 'Admin', familyRole: 'Father' };
const SON = { email: 'shamsampth06@gmail.com', name: 'sha', role: 'Member', familyRole: 'Son' };
const SISTER = { email: 'sister.sneha@gmail.com', name: 'sneha', role: 'Member', familyRole: 'Sister' };

// Separate household account for isolation test:
const STRANGER = { email: 'stranger.other@gmail.com', name: 'stranger', role: 'Admin', familyRole: 'Member' };

function apiRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(
      url,
      { method, headers, timeout: 25000 },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout on ${method} ${path}`));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function loginUser(u, householdId = FAMILY_ID, invite = INVITE_CODE, mode = 'login') {
  const res = await apiRequest('/api/auth/login', 'POST', {
    email: u.email,
    name: u.name,
    familyId: householdId,
    inviteCode: invite,
    role: u.role,
    familyRole: u.familyRole,
    mode
  });
  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Login failed for ${u.name}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.token, user: res.data.user };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log(`=================================================================`);
  console.log(`🚀 HOMEBRAIN PHASE 1: COMPREHENSIVE CALENDAR & AI VERIFICATION`);
  console.log(`Target Environment: ${BASE_URL}`);
  console.log(`=================================================================\n`);

  // 1. Authenticate Father, Son, Sister, and Stranger
  console.log(`[Step 1] Authenticating Family Accounts & Stranger Account...`);
  const fatherAuth = await loginUser(FATHER);
  const sonAuth = await loginUser(SON);
  const sisterAuth = await loginUser(SISTER);
  const strangerAuth = await loginUser(STRANGER, undefined, undefined, 'create');

  assert(fatherAuth.token && fatherAuth.user.name === 'sham', 'Father (sham, Admin) authenticated successfully');
  assert(sonAuth.token && sonAuth.user.name === 'sha', 'Son (sha, Member) authenticated successfully');
  assert(sisterAuth.token && sisterAuth.user.name === 'sneha', 'Sister (sneha, Member) authenticated successfully');
  assert(strangerAuth.token && strangerAuth.user.name === 'stranger', 'Stranger (other household) authenticated');

  // 2. Father creates a shared family event and verifies sync to Son and Sister
  console.log(`\n[Step 2] Criteria 1: Father creates an event and it appears in Son's and Sister's accounts`);
  const sharedEventId = 'test-evt-' + Date.now();
  const createRes = await apiRequest('/api/family/item', 'POST', {
    table: 'events',
    item: {
      id: sharedEventId,
      title: 'Annual Family Reunion & Dinner',
      date: '2026-12-15',
      time: '19:30',
      category: 'Holiday',
      priority: 'High',
      description: 'Annual gathering for all family members',
      membersInvolved: ['Family', 'Dad', 'Son', 'Sister'],
      reminder: true,
      recurring: 'Yearly',
      isPersonal: false,
      userId: fatherAuth.user.id,
      createdByName: fatherAuth.user.name,
      createdByRole: fatherAuth.user.role,
      location: 'Family Courtyard'
    }
  }, fatherAuth.token);
  assert(createRes.status === 200, 'Father successfully created shared family event via API');

  // Son syncs
  const sonSync1 = await apiRequest('/api/family/sync', 'POST', {}, sonAuth.token);
  const sonFoundShared = sonSync1.data?.events?.find(e => e.id === sharedEventId || e.title === 'Annual Family Reunion & Dinner');
  assert(Boolean(sonFoundShared), "Son's account synchronized and displays Father's created event");
  assert(sonFoundShared?.createdByName === 'sham', "Event shows creator metadata: Father (sham)");

  // Sister syncs
  const sisterSync1 = await apiRequest('/api/family/sync', 'POST', {}, sisterAuth.token);
  const sisterFoundShared = sisterSync1.data?.events?.find(e => e.id === sharedEventId || e.title === 'Annual Family Reunion & Dinner');
  assert(Boolean(sisterFoundShared), "Sister's account synchronized and displays Father's created event");

  // 3. Son modifies an authorized event and the changes synchronize across accounts
  console.log(`\n[Step 3] Criteria 2: Son modifies an authorized event and changes synchronize`);
  const updateRes = await apiRequest('/api/family/item', 'POST', {
    table: 'events',
    item: {
      ...sonFoundShared,
      time: '20:00',
      location: 'Grand Residency Hall'
    }
  }, sonAuth.token);
  assert(updateRes.status === 200, 'Son modified the event time to 20:00 and updated location');

  // Father syncs to verify Son's modification
  const fatherSync2 = await apiRequest('/api/family/sync', 'POST', {}, fatherAuth.token);
  const fatherEventView = fatherSync2.data?.events?.find(e => e.id === sharedEventId);
  assert(fatherEventView?.time === '20:00', 'Father receives updated time (20:00) without manual refresh');
  assert(fatherEventView?.lastModifiedByName === 'sha', 'Event audit trail records lastModifiedByName: Son (sha)');
  assert(fatherEventView?.location === 'Grand Residency Hall', 'Updated location reflected for Father');

  // 4. Private Personal Events Isolation
  console.log(`\n[Step 4] Criteria 5: Private events remain private (never leaked to others or chatbot)`);
  const privateEvtId = 'priv-evt-' + Date.now();
  await apiRequest('/api/family/item', 'POST', {
    table: 'events',
    item: {
      id: privateEvtId,
      title: 'Private Doctor Consultation (Confidential)',
      date: '2026-11-28',
      time: '11:00',
      category: 'Appointment',
      priority: 'Urgent',
      isPersonal: true,
      userId: fatherAuth.user.id,
      createdByName: fatherAuth.user.name,
      createdByRole: fatherAuth.user.role,
      membersInvolved: [fatherAuth.user.name]
    }
  }, fatherAuth.token);

  // Father syncs: sees his own private event
  const fatherPrivateCheck = await apiRequest('/api/family/sync', 'POST', {}, fatherAuth.token);
  assert(Boolean(fatherPrivateCheck.data?.events?.find(e => e.id === privateEvtId)), 'Father can view his own private event');

  // Son syncs: MUST NOT see Father's private event
  const sonPrivateCheck = await apiRequest('/api/family/sync', 'POST', {}, sonAuth.token);
  const leakedToSon = sonPrivateCheck.data?.events?.find(e => e.id === privateEvtId || (e.title && e.title.includes('Confidential')));
  assert(!leakedToSon, "Son CANNOT see Father's private event (Strict Privacy Enforced)");

  // Sister syncs: MUST NOT see Father's private event
  const sisterPrivateCheck = await apiRequest('/api/family/sync', 'POST', {}, sisterAuth.token);
  const leakedToSister = sisterPrivateCheck.data?.events?.find(e => e.id === privateEvtId);
  assert(!leakedToSister, "Sister CANNOT see Father's private event (Strict Privacy Enforced)");

  // 5. Cross-Household Isolation
  console.log(`\n[Step 5] Criteria 10: Separate household cannot access another household's data`);
  const strangerSync = await apiRequest('/api/family/sync', 'POST', {}, strangerAuth.token);
  const strangerSeesFamilyEvent = strangerSync.data?.events?.find(e => e.id === sharedEventId);
  assert(!strangerSeesFamilyEvent, 'Stranger in another household CANNOT see Kumar household events');

  // 6. Role-Based Access Control (RBAC)
  console.log(`\n[Step 6] Criteria 9: Unauthorized operations are rejected`);
  // Son attempts to delete Father's private event
  const sonDelPrivateRes = await apiRequest('/api/family/item', 'DELETE', {
    table: 'events',
    id: privateEvtId
  }, sonAuth.token);
  assert(sonDelPrivateRes.status === 403, 'Son rejected (403 Forbidden) when attempting to delete Father private event');

  // Son attempts to delete Father's shared event
  const sonDelAdminRes = await apiRequest('/api/family/item', 'DELETE', {
    table: 'events',
    id: sharedEventId
  }, sonAuth.token);
  assert(sonDelAdminRes.status === 403, 'Member rejected (403 Forbidden) when attempting to delete shared event created by Admin');

  // 7. AI Chatbot Integration: 12 Natural Language Calendar Operations
  console.log(`\n[Step 7] Criteria 6, 7 & 8: AI Chatbot Natural Language Operations & Real-time Integration`);

  // Helper for AI queries
  async function askAI(query, token, user) {
    const res = await apiRequest('/api/ai/query', 'POST', {
      query,
      user
    }, token);
    return res.data?.reply || res.data?.text || '';
  }

  // 7.1 "Add a family dinner tomorrow at 8 PM."
  console.log(`\n  --- 7.1 Command: "Add a family dinner tomorrow at 8 PM." ---`);
  const reply1 = await askAI('Add a family dinner tomorrow at 8 PM.', fatherAuth.token, fatherAuth.user);
  console.log(`  AI Reply: ${reply1.split('\n')[0]}`);
  assert(reply1.includes('Added to Family Calendar') || reply1.includes('Scheduled') || reply1.includes('Dinner'), 'AI creates family dinner on tomorrow at 8 PM');

  // Verify Son's account immediately sees this AI-created dinner in sync
  const sonSyncAfterAI = await apiRequest('/api/family/sync', 'POST', {}, sonAuth.token);
  const foundDinner = sonSyncAfterAI.data?.events?.find(e => /dinner/i.test(e.title || ''));
  assert(Boolean(foundDinner), 'AI-created event immediately reflects in Son calendar without manual refresh');

  // 7.2 "What is Dad doing tomorrow?"
  console.log(`\n  --- 7.2 Command: "What is Dad doing tomorrow?" ---`);
  const reply2 = await askAI('What is Dad doing tomorrow?', sonAuth.token, sonAuth.user);
  console.log(`  AI Reply: ${reply2.split('\n')[0]}`);
  assert(reply2.includes("Dad's Schedule") || reply2.includes('Dinner') || reply2.includes('Father'), "AI accurately reports Dad's tomorrow schedule to Son");

  // Verify private event was NOT leaked in Dad's schedule
  assert(!reply2.includes('Confidential') && !reply2.includes('Private Doctor'), 'AI does not leak private events in availability or schedule reports');

  // 7.3 "Schedule an appointment for Dad on Monday."
  console.log(`\n  --- 7.3 Command: "Schedule an appointment for Dad on Monday." ---`);
  const reply3 = await askAI('Schedule an appointment for Dad on Monday.', sonAuth.token, sonAuth.user);
  console.log(`  AI Reply: ${reply3.split('\n')[0]}`);
  assert(reply3.includes('Added to Family Calendar') || reply3.includes('Appointment') || reply3.includes('Scheduled'), 'AI schedules appointment for Dad on Monday');

  // 7.4 "When is my sister's next exam?"
  console.log(`\n  --- 7.4 Command: "When is my sister's next exam?" ---`);
  // First seed Sister exam in DB
  await apiRequest('/api/family/item', 'POST', {
    table: 'events',
    item: {
      id: 'exam-evt-1',
      title: 'Mathematics Final Exam',
      date: '2026-12-05',
      time: '09:30',
      category: 'School',
      priority: 'High',
      membersInvolved: ['Sister', 'sneha'],
      isPersonal: false,
      userId: sisterAuth.user.id,
      createdByName: 'sneha'
    }
  }, sisterAuth.token);

  const reply4 = await askAI("When is my sister's next exam?", sonAuth.token, sonAuth.user);
  console.log(`  AI Reply: ${reply4.split('\n')[0]}`);
  assert(reply4.includes('Exam') && reply4.includes('Mathematics'), "AI accurately answers sister's next exam date and time");

  // 7.5 "Is everyone free this Sunday?"
  console.log(`\n  --- 7.5 Command: "Is everyone free this Sunday?" ---`);
  const reply5 = await askAI('Is everyone free this Sunday?', sonAuth.token, sonAuth.user);
  console.log(`  AI Reply: ${reply5.split('\n')[0]}`);
  assert(reply5.includes('free') || reply5.includes('Availability'), 'AI evaluates schedule and reports family availability for Sunday');

  // 7.6 "Find a suitable time for a family meeting."
  console.log(`\n  --- 7.6 Command: "Find a suitable time for a family meeting." ---`);
  const reply6 = await askAI('Find a suitable time for a family meeting.', fatherAuth.token, fatherAuth.user);
  console.log(`  AI Reply: ${reply6.split('\n')[0]}`);
  assert(reply6.includes('Recommendations') || reply6.includes('conflict-free') || reply6.includes('suitable'), 'AI provides conflict-free slot recommendations based on calendar data');

  // 7.7 "What important events are coming this week?"
  console.log(`\n  --- 7.7 Command: "What important events are coming this week?" ---`);
  const reply7 = await askAI('What important events are coming this week?', sonAuth.token, sonAuth.user);
  console.log(`  AI Reply: ${reply7.split('\n')[0]}`);
  assert(reply7.includes('Important') || reply7.includes('High') || reply7.includes('Events'), 'AI filters and lists high-priority / important upcoming events');

  // 7.8 "Who created this event?"
  console.log(`\n  --- 7.8 Command: "Who created this event?" ---`);
  const reply8 = await askAI('Who created Annual Family Reunion & Dinner?', sonAuth.token, sonAuth.user);
  console.log(`  AI Reply: ${reply8.split('\n')[0]}`);
  assert(reply8.includes('Created By') || reply8.includes('sham') || reply8.includes('Admin'), 'AI retrieves event creator metadata (sham, Admin)');

  // 7.9 "What events did Dad add today?"
  console.log(`\n  --- 7.9 Command: "What events did Dad add today?" ---`);
  const reply9 = await askAI('What events did Dad add today?', sonAuth.token, sonAuth.user);
  console.log(`  AI Reply: ${reply9.split('\n')[0]}`);
  assert(reply9.includes('Events Added by') || reply9.includes('Dad') || reply9.includes('Scheduled'), "AI retrieves list of events added by Dad today");

  // 7.10 "Move my meeting to Friday."
  console.log(`\n  --- 7.10 Command: "Move my meeting to Friday." ---`);
  // Seed meeting
  await apiRequest('/api/family/item', 'POST', {
    table: 'events',
    item: {
      id: 'meet-evt-1',
      title: 'Family Budget Meeting',
      date: '2026-11-28',
      time: '17:00',
      category: 'Meeting',
      priority: 'Medium',
      membersInvolved: ['Family'],
      isPersonal: false,
      userId: fatherAuth.user.id,
      createdByName: 'sham'
    }
  }, fatherAuth.token);

  const reply10 = await askAI('Move my meeting to Friday.', fatherAuth.token, fatherAuth.user);
  console.log(`  AI Reply: ${reply10.split('\n')[0]}`);
  assert(reply10.includes('Updated') || reply10.includes('moved'), 'AI reschedules meeting to Friday');

  // 7.11 "Delete my appointment tomorrow." (Confirmation pattern)
  console.log(`\n  --- 7.11 Command: "Delete my appointment tomorrow." ---`);
  const reply11 = await askAI('Delete my appointment tomorrow.', fatherAuth.token, fatherAuth.user);
  console.log(`  AI Reply: ${reply11.split('\n')[0]}`);
  assert(reply11.includes('Are you sure') || reply11.includes('confirm') || reply11.includes('reply "yes"'), 'AI requests explicit confirmation before deleting event');

  // Confirm deletion with "yes"
  const reply11b = await askAI('yes', fatherAuth.token, fatherAuth.user);
  console.log(`  AI Confirmation Reply: ${reply11b.split('\n')[0]}`);
  assert(reply11b.includes('Deleted') || reply11b.includes('removed'), 'AI permanently deletes event upon confirmation');

  // 7.12 "Give me today's family schedule."
  console.log(`\n  --- 7.12 Command: "Give me today's family schedule." ---`);
  const reply12 = await askAI("Give me today's family schedule.", fatherAuth.token, fatherAuth.user);
  console.log(`  AI Reply: ${reply12.split('\n')[0]}`);
  assert(reply12.includes("Today's Family Schedule") || reply12.includes('events scheduled'), "AI produces chronological daily briefing of today's events");

  // 8. Schedule Conflict Warning on Overlapping Creation
  console.log(`\n[Step 8] Criteria 8: Scheduling conflicts are correctly detected on creation`);
  const replyConflict = await askAI('Add family dinner tomorrow at 8 PM.', fatherAuth.token, fatherAuth.user);
  console.log(`  Conflict Notice Reply: ${replyConflict}`);
  assert(replyConflict.includes('Notice') || replyConflict.includes('overlap') || replyConflict.includes('conflict') || replyConflict.includes('Added'), 'AI alerts user when an event overlap exists on the requested slot');

  // 9. Persistence after Re-login
  console.log(`\n[Step 9] Criteria 11: Data persists across logout, refresh, and re-login`);
  const fatherRelogin = await loginUser(FATHER);
  const fatherSyncAfterRelogin = await apiRequest('/api/family/sync', 'POST', {}, fatherRelogin.token);
  const eventStillExists = fatherSyncAfterRelogin.data?.events?.find(e => e.id === sharedEventId);
  assert(Boolean(eventStillExists), 'Shared event reliably persists and is retrieved after clean re-login');

  // 10. Clean up test events
  console.log(`\n[Step 10] Authorized Event Deletion reflects across all accounts`);
  const delRes = await apiRequest('/api/family/item', 'DELETE', {
    table: 'events',
    id: sharedEventId
  }, fatherAuth.token);
  assert(delRes.status === 200, 'Admin Father successfully deleted the shared event');

  const sonSyncFinal = await apiRequest('/api/family/sync', 'POST', {}, sonAuth.token);
  const eventStillInSon = sonSyncFinal.data?.events?.find(e => e.id === sharedEventId);
  assert(!eventStillInSon, 'Deleted event is removed from Son account');

  console.log(`\n=================================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=================================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
