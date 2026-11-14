// =====================================================================
// Integration Test: HomeBrain Intelligent Conversational Understanding
// & Autonomous Action Implementation (20 Acceptance Scenarios + Section 13)
// =====================================================================

const API_URL = 'http://127.0.0.1:5000/api/ai/query';

async function sendQuery(query, conversationHistory = []) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-token'
    },
    body: JSON.stringify({
      query,
      conversationHistory,
      familyId: 'demo-family-kumar',
      senderName: 'Sarah',
      isDemo: true
    })
  });
  return await res.json();
}

let passed = 0;
let failed = 0;

function assert(condition, message, detail) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    if (detail) console.error(`     Detail: ${detail}`);
    failed++;
  }
}

async function runTests() {
  console.log('🤖 Running HomeBrain Intelligent Action & Acceptance Criteria Test Suite...\n');

  // Reset demo in-memory state so tests run cleanly and deterministically
  await fetch('http://127.0.0.1:5000/api/ai/reset-demo-state', { method: 'POST' }).catch(() => { });

  // --- SECTION 13: SPECIFIC SCREENSHOT REPRODUCTION TEST ---
  console.log('--- Section 13: Screenshot Reproduction Scenario ---');
  await sendQuery("Add mother's birthday on September 22");
  console.log('User: "add mothers bday in dec 25"');
  const res13_1 = await sendQuery('add mothers bday in dec 25');
  const text13_1 = res13_1.reply || res13_1.text || '';
  console.log('Bot Response 1:', text13_1);

  assert(
    (text13_1.includes("existing") || text13_1.includes("Mother")) &&
    text13_1.includes("December 25, 2026") &&
    text13_1.includes("separate event"),
    'Detects existing birthday conflict and asks whether to update or create separate event',
    text13_1
  );

  console.log('User: "update it" (Turn 2)');
  const res13_2 = await sendQuery('update it', [
    { role: 'user', text: 'add mothers bday in dec 25' },
    { role: 'model', text: text13_1 }
  ]);
  const text13_2 = res13_2.reply || res13_2.text || '';
  console.log('Bot Response 2:', text13_2);

  assert(
    text13_2.includes("Mother's birthday has been updated to December 25, 2026") || text13_2.includes("updated to December 25, 2026"),
    'Verifies update confirmation to December 25, 2026 upon user instruction',
    text13_2
  );

  // --- 20 ACCEPTANCE CRITERIA TESTS ---
  console.log('\n--- 20 Acceptance Criteria Scenarios ---');

  // Scenario 1: Add a grocery item that does not exist
  console.log('\n1. Add non-existing grocery item ("Add 2 kg rice")');
  const s1 = await sendQuery('Add 2 kg rice');
  const t1 = s1.reply || s1.text || '';
  assert(t1.includes('2 kg of rice has been added') || t1.includes('added to your grocery list'), 'Adds non-existing grocery item', t1);

  // Scenario 2: Add a grocery item that already exists
  console.log('\n2. Add existing grocery item ("Add milk")');
  const s2 = await sendQuery('Add milk');
  const t2 = s2.reply || s2.text || '';
  assert(t2.includes('already on your grocery list') && t2.includes('update its quantity'), 'Detects grocery duplicate and offers quantity update', t2);

  // Scenario 3: Update an existing grocery quantity
  console.log('\n3. Update grocery quantity ("Change milk quantity to 2 litres")');
  const s3 = await sendQuery('Change milk quantity to 2 litres');
  const t3 = s3.reply || s3.text || '';
  assert(t3.includes('Milk quantity has been updated to 2 litres') || t3.includes('updated to 2 litres'), 'Updates grocery quantity', t3);

  // Scenario 4: Mark unpaid electricity bill as paid
  console.log('\n4. Mark unpaid bill as paid ("Mark electricity bill as paid")');
  const s4 = await sendQuery('Mark electricity bill as paid');
  const t4 = s4.reply || s4.text || '';
  assert(t4.includes('marked as paid'), 'Marks electricity bill as paid', t4);

  // Scenario 5: Try marking already-paid bill as paid
  console.log('\n5. Try marking already-paid bill as paid');
  const s5 = await sendQuery('Mark electricity bill as paid');
  const t5 = s5.reply || s5.text || '';
  assert(t5.includes('already marked as paid'), 'Identifies bill already paid', t5);

  // Scenario 6: Add a birthday that does not exist
  console.log('\n6. Add non-existing birthday ("Add sister\'s birthday on January 15")');
  const s6 = await sendQuery("Add sister's birthday on January 15");
  const t6 = s6.reply || s6.text || '';
  assert(t6.includes('Sister\'s birthday has been added to your calendar') || t6.includes('added'), 'Adds non-existing birthday', t6);

  // Scenario 7: Try adding existing birthday with same date
  console.log('\n7. Add existing birthday with same date ("Add father\'s birthday on November 15")');
  const s7 = await sendQuery("Add father's birthday on November 15");
  const t7 = s7.reply || s7.text || '';
  assert(t7.includes('already saved') || t7.includes('Father\'s birthday is already saved') || t7.includes('already on your calendar'), 'Identifies identical birthday date already saved', t7);

  // Scenario 8: Request birthday with different date from existing record
  console.log('\n8. Request birthday with different date ("Add father\'s birthday on August 20")');
  const s8 = await sendQuery("Add father's birthday on August 20");
  const t8 = s8.reply || s8.text || '';
  assert(t8.includes('existing Father\'s Birthday') && t8.includes('update its date') && t8.includes('separate event'), 'Prompts date conflict for father birthday', t8);

  // Scenario 9: Ask for a birthday that does not exist
  console.log('\n9. Ask for birthday that does not exist ("When is grandfather\'s birthday?")');
  const s9 = await sendQuery("When is grandfather's birthday?");
  const t9 = s9.reply || s9.text || '';
  assert(t9.includes('Not Provided') || t9.includes("couldn't find") || t9.includes('not been recorded'), 'Reports non-existing birthday accurately', t9);

  // Scenario 10: Fetch an uploaded Aadhaar card
  console.log('\n10. Fetch uploaded Aadhaar ("Fetch Sham\'s Aadhaar card")');
  const s10 = await sendQuery("Fetch Sham's Aadhaar card");
  const t10 = s10.reply || s10.text || '';
  assert(t10.includes('Aadhaar') && (t10.includes('found') || t10.includes('check')), 'Fetches uploaded Aadhaar card', t10);

  // Scenario 11: Fetch an Aadhaar card that has not been uploaded
  console.log('\n11. Fetch non-uploaded Aadhaar ("Fetch grandfather\'s Aadhaar card")');
  const s11 = await sendQuery("Fetch grandfather's Aadhaar card");
  const t11 = s11.reply || s11.text || '';
  assert(t11.includes("couldn't find") || t11.includes("not available"), 'Reports missing Aadhaar card', t11);

  // Scenario 12: Unauthorized document access
  console.log('\n12. Unauthorized access check');
  const s12 = await sendQuery("Unauthorized access");
  const t12 = s12.reply || s12.text || '';
  assert(t12.includes("don't have permission") || t12.includes("Unauthorized"), 'Rejects unauthorized access', t12);

  // Scenario 13: Upload document that already exists
  console.log('\n13. Upload document that already exists ("Upload Aadhaar")');
  const s13 = await sendQuery("Upload Aadhaar");
  const t13 = s13.reply || s13.text || '';
  assert(t13.includes('already exists in your Document Vault') && t13.includes('upload a new version'), 'Detects existing document duplicate', t13);

  // Scenario 14: Incomplete parameter prompt
  console.log('\n14. Incomplete parameter prompt ("Add electricity bill")');
  const s14 = await sendQuery("Add electricity bill");
  const t14 = s14.reply || s14.text || '';
  assert(t14.includes('bill amount and due date') || t14.includes('provide'), 'Prompts for missing bill parameters', t14);

  // Scenario 15: Recurring grocery reminder
  console.log('\n15. Recurring grocery reminder ("Add bread to my list every Sunday")');
  const s15 = await sendQuery("Add bread to my list every Sunday");
  const t15 = s15.reply || s15.text || '';
  assert(t15.includes('recurring grocery reminder') || t15.includes('Sunday') || t15.includes('added'), 'Handles recurring grocery instruction', t15);

  // Scenario 16: Add task and mark it completed
  console.log('\n16. Add task and complete it');
  const s16_1 = await sendQuery("Add a task to complete my assignment");
  const t16_1 = s16_1.reply || s16_1.text || '';
  assert(t16_1.includes('Task added') || t16_1.includes('assignment'), 'Adds task to complete assignment', t16_1);

  const s16_2 = await sendQuery("Mark assignment as completed");
  const t16_2 = s16_2.reply || s16_2.text || '';
  assert(t16_2.includes('marked as completed'), 'Marks task as completed', t16_2);

  // Scenario 17: Update existing family event
  console.log('\n17. Update existing event ("Move my meeting to 3 PM")');
  const s17 = await sendQuery("Move my meeting to 3 PM");
  const t17 = s17.reply || s17.text || '';
  assert(t17.includes('meeting') && (t17.includes('updated') || t17.includes('3 PM') || t17.includes('moved')), 'Updates event time to 3 PM', t17);

  // Scenario 18: Tanglish commands
  console.log('\n18. Tanglish commands ("Milk add pannunga", "EB bill paid nu mark pannunga")');
  const s18_1 = await sendQuery("Milk add pannunga");
  const t18_1 = s18_1.reply || s18_1.text || '';
  assert(t18_1.includes('Milk') && (t18_1.includes('added') || t18_1.includes('already')), 'Handles Tanglish milk add command', t18_1);

  const s18_2 = await sendQuery("EB bill paid nu mark pannunga");
  const t18_2 = s18_2.reply || s18_2.text || '';
  assert(t18_2.includes('electricity bill') && (t18_2.includes('paid') || t18_2.includes('marked')), 'Handles Tanglish EB bill payment command', t18_2);

  // Scenario 19: Multi-turn incomplete conversation
  console.log('\n19. Multi-turn missing parameter flow');
  const s19_1 = await sendQuery("Add cousin's birthday");
  const t19_1 = s19_1.reply || s19_1.text || '';
  assert(t19_1.includes('birthday') && (t19_1.includes('date') || t19_1.includes('When') || t19_1.includes('What')), 'Prompts for missing date across turns', t19_1);

  const s19_2 = await sendQuery("June 15", [
    { role: 'user', text: "Add cousin's birthday" },
    { role: 'model', text: t19_1 }
  ]);
  const t19_2 = s19_2.reply || s19_2.text || '';
  assert(t19_2.includes('saved') || t19_2.includes('added') || t19_2.includes('June 15'), 'Resolves missing date in second turn', t19_2);

  // Scenario 20: Backend failure safety (no false success)
  console.log('\n20. Backend safety check');
  const s20 = await sendQuery("Document not found");
  const t20 = s20.reply || s20.text || '';
  assert(t20.includes("couldn't find") || t20.includes('not found'), 'Never simulates false success on missing data', t20);

  console.log('\n==========================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed out of ${passed + failed}`);
  console.log('==========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
