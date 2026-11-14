// scripts/test-phase4-calendar.cjs
// Automated verification suite for HomeBrain Calendar Module (Phase 4 & Phase 5)

const http = require('http');

function postChat(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      'http://localhost:5000/api/ai/query',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Authorization': 'Bearer demo-token'
        }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 HOMEBRAIN CALENDAR MODULE VERIFICATION (PHASE 4 & PHASE 5)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const testCases = [
    // A. READ OPERATIONS
    {
      name: '1. Read: Show all calendar events',
      query: 'Show all my calendar events.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Family Calendar Events') && text.includes('scheduled');
      }
    },
    {
      name: '2. Read: Next upcoming event',
      query: 'What is my next upcoming event?',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Next Upcoming Family Event') && text.includes('Father\'s Birthday');
      }
    },
    {
      name: '3. Filter: Find all medical appointments (PREVIOUS BUG VERIFICATION)',
      query: 'Find all medical appointments.',
      check: (res) => {
        const text = res.body?.reply || '';
        const hasDoctor = text.toLowerCase().includes('doctor appointment');
        const hasDentist = text.toLowerCase().includes('dentist appointment');
        const hasFatherBday = text.toLowerCase().includes('father\'s birthday');
        return hasDoctor && hasDentist && !hasFatherBday;
      }
    },
    {
      name: '4. Date: Tomorrow\'s events',
      query: 'Find tomorrow\'s events.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Tomorrow\'s Schedule') && text.includes('Father\'s Birthday');
      }
    },
    {
      name: '5. Date: Specific date (Nov 20)',
      query: 'What events are scheduled on 20 November?',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Family Meeting') || text.includes('2026-11-20');
      }
    },
    {
      name: '6. Filter: Month of November',
      query: 'Show all events in November.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Events in November 2026') && text.includes('2026-11');
      }
    },
    {
      name: '7. Filter: Month of December',
      query: 'Show all events in December.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Events in December 2026') && text.includes('Dentist Appointment');
      }
    },
    {
      name: '8. Search: Specific title (family dinner)',
      query: 'Find family dinner.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.toLowerCase().includes('family dinner') && text.includes('2026-11-16');
      }
    },
    {
      name: '9. Summary: Upcoming schedule summary',
      query: 'Summarize the family\'s upcoming schedule.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Family Schedule Summary') && text.includes('upcoming events');
      }
    },

    // B. CREATE OPERATIONS
    {
      name: '10. Create: Schedule doctor appointment for Nov 20 at 10 AM',
      query: 'Schedule a doctor\'s appointment for November 20 at 10 AM.',
      check: (res) => {
        const text = res.body?.reply || '';
        return (text.includes('Added to Family Calendar') || text.includes('Scheduled')) &&
          text.includes('2026-11-20') && text.includes('10:00');
      }
    },
    {
      name: '11. Create: Add a family dinner tomorrow at 7 PM',
      query: 'Add a family dinner tomorrow at 7 PM.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Added to Family Calendar') && text.includes('19:00');
      }
    },
    {
      name: '12. Create: Event with title, date, time, category, description, and location',
      query: 'Schedule an event with title: Dental Checkup, date: 2026-12-05, time: 11:30 am, category: Appointment, location: Apollo Dental Clinic, description: Routine teeth cleaning and scaling',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Dental Checkup') && text.includes('Apollo Dental Clinic') && text.includes('Routine teeth cleaning');
      }
    },

    // C. UPDATE OPERATIONS
    {
      name: '13. Update: Move my family dinner to 8 PM',
      query: 'Move my family dinner to 8 PM.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Event Updated') && text.includes('20:00');
      }
    },
    {
      name: '14. Update: Update event location to Apollo Clinic',
      query: 'Update the event location to Apollo Clinic.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Location Updated') && text.includes('Apollo Clinic');
      }
    },
    {
      name: '15. Update: Change event description',
      query: 'Change the event description to Bi-weekly household budget discussion.',
      check: (res) => {
        const text = res.body?.reply || '';
        return text.includes('Description Updated') && text.includes('Bi-weekly household budget discussion');
      }
    }
  ];

  for (const tc of testCases) {
    try {
      const res = await postChat({
        query: tc.query,
        user: { id: '00000000-0000-4000-8000-000000000001', name: 'Sarah', familyId: '00000000-0000-4000-8000-000000000001' }
      });
      const ok = tc.check(res);
      if (ok) {
        console.log(`✅ [PASS] ${tc.name}`);
        passed++;
      } else {
        console.log(`❌ [FAIL] ${tc.name}`);
        console.log('   Response:', JSON.stringify(res.body?.reply || res.raw || ''));
        failed++;
      }
    } catch (e) {
      console.log(`❌ [ERROR] ${tc.name}:`, e.message);
      failed++;
    }
  }

  // D. DELETE OPERATION WITH CONFIRMATION (2-step multi-turn flow)
  console.log('\n--- Testing Multi-Turn Delete Confirmation ---');
  try {
    // Step 1: Request delete
    const delReq = await postChat({
      query: 'Delete my family dinner.',
      user: { id: '00000000-0000-4000-8000-000000000001', name: 'Sarah', familyId: '00000000-0000-4000-8000-000000000001' }
    });
    const promptText = delReq.body?.reply || '';
    const askedConfirm = promptText.includes('Are you sure you want to delete') && promptText.includes('Family Dinner');
    if (askedConfirm) {
      console.log('✅ [PASS] 16. Delete: Prompt explicit confirmation before deleting');
      passed++;
    } else {
      console.log('❌ [FAIL] 16. Delete: Did not prompt confirmation:', promptText);
      failed++;
    }

    // Step 2: Confirm delete with "yes"
    const confirmReq = await postChat({
      query: 'yes',
      user: { id: '00000000-0000-4000-8000-000000000001', name: 'Sarah', familyId: '00000000-0000-4000-8000-000000000001' }
    });
    const confirmText = confirmReq.body?.reply || '';
    const deletedOk = confirmText.includes('Event Deleted') && confirmText.includes('Family Dinner');
    if (deletedOk) {
      console.log('✅ [PASS] 17. Delete: Confirmed deletion executed successfully');
      passed++;
    } else {
      console.log('❌ [FAIL] 17. Delete: Confirmation failed:', confirmText);
      failed++;
    }
  } catch (e) {
    console.log('❌ [ERROR] Multi-Turn Delete test:', e.message);
    failed += 2;
  }

  // E. MULTI-TURN CONFLICT RESOLUTION
  console.log('\n--- Testing Multi-Turn Conflict Resolution ---');
  try {
    // Trigger conflict
    const confReq = await postChat({
      query: 'Add Father\'s birthday on 25 December.',
      user: { id: '00000000-0000-4000-8000-000000000001', name: 'Sarah', familyId: '00000000-0000-4000-8000-000000000001' }
    });
    const confPrompt = confReq.body?.reply || '';
    const askedConflict = confPrompt.includes('existing') && confPrompt.includes('separate event');
    if (askedConflict) {
      console.log('✅ [PASS] 18. Conflict: Detected existing Father\'s birthday & prompted conflict');
      passed++;
    } else {
      console.log('❌ [FAIL] 18. Conflict: Conflict not detected:', confPrompt);
      failed++;
    }

    // Answer conflict with "update it and change into march 12"
    const resReq = await postChat({
      query: 'update it and change into march 12',
      user: { id: '00000000-0000-4000-8000-000000000001', name: 'Sarah', familyId: '00000000-0000-4000-8000-000000000001' }
    });
    const resText = resReq.body?.reply || '';
    const updatedCorrectly = resText.toLowerCase().includes('father') &&
      (resText.includes('March 12') || resText.includes('2026-03-12')) &&
      !resText.toLowerCase().includes('mother');
    if (updatedCorrectly) {
      console.log('✅ [PASS] 19. Conflict: "update it and change into march 12" accurately updated Father to March 12');
      passed++;
    } else {
      console.log('❌ [FAIL] 19. Conflict: Incorrect update result:', resText);
      failed++;
    }
  } catch (e) {
    console.log('❌ [ERROR] Multi-Turn Conflict test:', e.message);
    failed += 2;
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
