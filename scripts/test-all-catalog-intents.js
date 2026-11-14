/**
 * Comprehensive Automated Verification Suite for HomeBrain Complete Intent Catalogue
 * Tests all 12 modules and over 120 specific conversational utterances against the live backend.
 */
import http from 'http';

const API_HOST = 'localhost';
const API_PORT = 5000;
const TOKEN = 'demo-token';

function queryBackend(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: text });
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: '/api/ai/query',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Authorization: `Bearer ${TOKEN}`
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve({ status: res.statusCode, text: data.text || data.error || '' });
          } catch (e) {
            resolve({ status: res.statusCode, text: raw });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

const testCases = [
  // ==========================================
  // MODULE 1: GROCERY VAULT
  // ==========================================
  { section: '1. Grocery Management', query: 'Add milk to grocery list', expected: 'Milk has been added to your grocery list.' },
  { section: '1. Grocery Management', query: 'Add 2 kg rice', expected: '2 kg of rice has been added.' },
  { section: '1. Grocery Management', query: 'Add tomatoes and onions', expected: 'Tomatoes and onions have been added to your list.' },
  { section: '1. Grocery Management', query: 'Add 1 litre oil', expected: '1 litre of cooking oil has been added.' },
  { section: '1. Grocery Management', query: 'Add eggs to my shopping list', expected: 'Eggs have been added to your shopping list.' },
  { section: '1. Grocery Management', query: 'Add vegetables for tomorrow', expected: 'Vegetables have been added to your grocery list.' },
  { section: '1. Grocery Management', query: 'Add these items to groceries', expected: "Sure! I'll add the identified items to your list." },
  { section: '1. Grocery Management', query: 'Add water can to grocery list', expected: 'Water can has been added to your grocery list.' },
  { section: '1. Grocery Management', query: 'Remove milk from grocery list', expected: 'Milk has been removed from your grocery list.' },
  { section: '1. Grocery Management', query: 'Delete rice from my list', expected: 'Rice has been removed.' },
  { section: '1. Grocery Management', query: 'Change milk quantity to 2 litres', expected: 'Milk quantity has been updated to 2 litres.' },
  { section: '1. Grocery Management', query: 'Show my grocery list', expected: 'Here is your current grocery list.' },
  { section: '1. Grocery Management', query: 'What should I buy?', expected: 'Here are the items remaining on your grocery list.' },
  { section: '1. Grocery Management', query: 'What groceries are pending?', expected: "These are the grocery items you haven't marked as purchased." },
  { section: '1. Grocery Management', query: 'Mark milk as purchased', expected: 'Milk has been marked as purchased.' },
  { section: '1. Grocery Management', query: 'I bought all the groceries', expected: 'All items have been marked as purchased.' },
  { section: '1. Grocery Management', query: 'Clear my grocery list', expected: 'Are you sure you want to clear your grocery list?' },
  { section: '1. Grocery Management', query: 'Add bread every morning', expected: 'Do you want me to create a recurring grocery reminder for bread?' },
  { section: '1. Grocery Management', query: 'What did I buy last week?', expected: "I'll check your grocery purchase history." },
  { section: '1. Grocery Management', query: 'How much did I spend on groceries?', expected: "I'll calculate your recorded grocery expenses." },
  { section: '1. Grocery Management', query: 'Is milk already in my list?', expected: 'Yes, milk is already on your grocery list.' },

  // ==========================================
  // MODULE 2: FINANCE AND BILL MANAGEMENT
  // ==========================================
  // A. Bill payment
  { section: '2. Finance - Bills', query: 'Mark electricity bill as paid', expected: 'Your electricity bill has been marked as paid.' },
  { section: '2. Finance - Bills', query: 'Mark EB bill as paid', expected: 'Your electricity bill has been updated as paid.' },
  { section: '2. Finance - Bills', query: 'I paid the water bill', expected: "I'll update your water bill payment status." },
  { section: '2. Finance - Bills', query: 'Mark internet bill as paid', expected: 'Your internet bill has been marked as paid.' },
  { section: '2. Finance - Bills', query: "Have I paid this month's EB bill?", expected: "I'll check your electricity bill payment records." },
  { section: '2. Finance - Bills', query: 'When is my next electricity bill due?', expected: "I'll check your upcoming electricity bill due date." },
  { section: '2. Finance - Bills', query: 'Show pending bills', expected: 'Here are your unpaid bills.' },
  { section: '2. Finance - Bills', query: 'What bills are due this week?', expected: 'Here are the bills due this week.' },
  { section: '2. Finance - Bills', query: 'Add electricity bill', expected: 'Sure! Please provide the bill amount and due date.' },
  { section: '2. Finance - Bills', query: 'Add ₹1,500 electricity bill', expected: 'Your ₹1,500 electricity bill has been recorded. When is it due?' },
  { section: '2. Finance - Bills', query: 'Remind me to pay EB tomorrow', expected: "I'll set a reminder for tomorrow to pay the electricity bill." },
  { section: '2. Finance - Bills', query: 'Delete my old water bill', expected: 'Which water bill would you like me to delete?' },
  { section: '2. Finance - Bills', query: 'How much is my pending bill amount?', expected: "I'll calculate the total amount of your unpaid bills." },
  { section: '2. Finance - Bills', query: 'Did I already pay the internet bill?', expected: "I'll check your payment history." },

  // B. Income and expenses
  { section: '2. Finance - Expenses', query: 'Add ₹500 expense', expected: '₹500 expense recorded. What was it for?' },
  { section: '2. Finance - Expenses', query: 'I spent ₹200 on food', expected: '₹200 food expense has been recorded.' },
  { section: '2. Finance - Expenses', query: 'Add ₹1,000 for petrol', expected: '₹1,000 petrol expense has been added.' },
  { section: '2. Finance - Expenses', query: 'Record ₹5,000 salary', expected: '₹5,000 salary income has been recorded.' },
  { section: '2. Finance - Expenses', query: 'I received ₹2,000', expected: "I'll record ₹2,000 as income. What was the source?" },
  { section: '2. Finance - Expenses', query: 'Show my expenses today', expected: 'Here are your recorded expenses for today.' },
  { section: '2. Finance - Expenses', query: 'How much did I spend this month?', expected: "I'll calculate your total expenses for this month." },
  { section: '2. Finance - Expenses', query: "Show last month's expenses", expected: 'Here is your expense summary for last month.' },
  { section: '2. Finance - Expenses', query: 'What is my total income?', expected: "I'll calculate your recorded income." },
  { section: '2. Finance - Expenses', query: 'How much did I save?', expected: "I'll calculate your savings from recorded income and expenses." },
  { section: '2. Finance - Expenses', query: 'Show my biggest expenses', expected: "I'll identify your highest recorded expenses." },
  { section: '2. Finance - Expenses', query: 'Delete the ₹200 food expense', expected: "I'll locate that transaction before deleting it." },
  { section: '2. Finance - Expenses', query: 'Change petrol expense to ₹1,200', expected: "I'll update the petrol expense amount." },
  { section: '2. Finance - Expenses', query: 'Add ₹300 for groceries yesterday', expected: "I'll record the ₹300 grocery expense for yesterday." },

  // C. Budget management
  { section: '2. Finance - Budget', query: 'Set monthly budget to ₹20,000', expected: 'Your monthly budget has been set to ₹20,000.' },
  { section: '2. Finance - Budget', query: 'Set grocery budget to ₹5,000', expected: 'Your grocery budget has been set to ₹5,000.' },
  { section: '2. Finance - Budget', query: 'How much budget is remaining?', expected: "I'll calculate your remaining monthly budget." },
  { section: '2. Finance - Budget', query: 'Am I exceeding my budget?', expected: "I'll compare your recorded expenses with your budget." },
  { section: '2. Finance - Budget', query: 'Show my budget', expected: 'Here are your current budget limits.' },
  { section: '2. Finance - Budget', query: 'Increase my budget to ₹25,000', expected: 'Your monthly budget has been updated to ₹25,000.' },
  { section: '2. Finance - Budget', query: 'How much did I spend on transport?', expected: "I'll calculate your recorded transport expenses." },
  { section: '2. Finance - Budget', query: 'Compare this month and last month', expected: "I'll compare both months' recorded income and expenses." },

  // ==========================================
  // MODULE 3: CALENDAR & FAMILY EVENTS
  // ==========================================
  // A. Add events
  { section: '3. Calendar - Add', query: "Add my father's birthday", expected: "What date is your father's birthday?" },
  { section: '3. Calendar - Add', query: "Add father's birthday on December 10", expected: "Your father's birthday is already marked on December 10. I haven't created a duplicate event." },
  { section: '3. Calendar - Add', query: "Add mother's birthday tomorrow", expected: "I'll add your mother's birthday for tomorrow." },
  { section: '3. Calendar - Add', query: 'Add my birthday', expected: 'Sure! What date is your birthday?' },
  { section: '3. Calendar - Add', query: 'Add wedding anniversary', expected: 'Whose wedding anniversary should I add, and what is the date?' },
  { section: '3. Calendar - Add', query: 'Schedule a family function', expected: 'Sure! Please provide the event date and details.' },
  { section: '3. Calendar - Add', query: 'Add a meeting tomorrow at 10 AM', expected: 'Your meeting has been added for tomorrow at 10 AM.' },
  { section: '3. Calendar - Add', query: 'Schedule a doctor appointment on Friday', expected: "I'll add your appointment for Friday. What time?" },
  { section: '3. Calendar - Add', query: 'Add college event next Monday', expected: "I'll add the college event for next Monday." },
  { section: '3. Calendar - Add', query: "Add a reminder for my father's birthday", expected: "I'll create a birthday reminder for your father." },
  { section: '3. Calendar - Add', query: 'Add a housewarming ceremony on January 15', expected: 'Your housewarming event has been added for January 15.' },
  { section: '3. Calendar - Add', query: 'Add a family trip next week', expected: 'What date and time should I schedule the family trip?' },

  // B. Ask about existing events
  { section: '3. Calendar - Query', query: "When is my father's birthday?", expected: "Your father's birthday is on December 10." },
  { section: '3. Calendar - Query', query: "When is my mother's birthday?", expected: "Your mother's birthday is on May 15." },
  { section: '3. Calendar - Query', query: 'What is the next family event?', expected: 'Your next family event is Family Dinner on Friday.' },
  { section: '3. Calendar - Query', query: 'Do we have any events tomorrow?', expected: 'You have 1 scheduled events tomorrow.' },
  { section: '3. Calendar - Query', query: 'What events are coming this month?', expected: 'Here are your upcoming events for this month.' },
  { section: '3. Calendar - Query', query: "Is father's birthday saved?", expected: "Yes! Your father's birthday is already saved in the Family Calendar on December 10." },
  { section: '3. Calendar - Query', query: "Have I added mother's birthday?", expected: "Yes, your mother's birthday is already in the calendar." },
  { section: '3. Calendar - Query', query: 'When is my next anniversary?', expected: 'Your next saved anniversary is on June 24.' },
  { section: '3. Calendar - Query', query: 'Any birthdays this week?', expected: 'Here are the birthdays scheduled for this week.' },
  { section: '3. Calendar - Query', query: 'What did I schedule for Sunday?', expected: "I'll show your events scheduled for Sunday." },
  { section: '3. Calendar - Query', query: 'Show my family calendar', expected: 'Here is your family calendar.' },
  { section: '3. Calendar - Query', query: 'How many events are scheduled this month?', expected: 'You have 4 events scheduled this month.' },

  // C. Update and delete events
  { section: '3. Calendar - Manage', query: "Change father's birthday date", expected: 'What is the correct date?' },
  { section: '3. Calendar - Manage', query: 'Move my meeting to 3 PM', expected: 'Your meeting time has been updated to 3 PM.' },
  { section: '3. Calendar - Manage', query: "Cancel tomorrow's appointment", expected: 'Which appointment would you like to cancel?' },
  { section: '3. Calendar - Manage', query: 'Delete the birthday event', expected: 'Which birthday event should I remove?' },
  { section: '3. Calendar - Manage', query: "Add a reminder one day before father's birthday", expected: "I'll set a reminder one day before your father's birthday." },
  { section: '3. Calendar - Manage', query: 'Remind me about the family function', expected: 'What date and time should I set the reminder for?' },
  { section: '3. Calendar - Manage', query: 'Is my meeting postponed?', expected: "I'll check the latest saved meeting details." },

  // ==========================================
  // MODULE 4: REMINDERS AND NOTIFICATIONS
  // ==========================================
  { section: '4. Reminders', query: 'Remind me to drink water', expected: 'Sure! What time should I remind you?' },
  { section: '4. Reminders', query: 'Remind me tomorrow to pay EB', expected: "I'll schedule a reminder for tomorrow to pay your electricity bill." },
  { section: '4. Reminders', query: 'Set an alarm for 6 AM', expected: "I'll set an alarm for 6 AM, if alarm integration is available." },
  { section: '4. Reminders', query: 'Remind me about my meeting', expected: 'Your meeting is scheduled for tomorrow at 10 AM. When should I remind you?' },
  { section: '4. Reminders', query: 'Remind me every Sunday to buy groceries', expected: "I'll set a recurring Sunday grocery reminder." },
  { section: '4. Reminders', query: 'Remind me to call father tonight', expected: 'What time tonight should I remind you?' },
  { section: '4. Reminders', query: 'Show my reminders', expected: 'Here are your upcoming reminders.' },
  { section: '4. Reminders', query: 'Cancel my grocery reminder', expected: 'Your grocery reminder has been cancelled.' },
  { section: '4. Reminders', query: 'What reminders do I have today?', expected: 'Here are your reminders for today.' },
  { section: '4. Reminders', query: 'Snooze my reminder', expected: 'How long would you like to snooze it?' },
  { section: '4. Reminders', query: 'Remind me 2 days before the event', expected: "I'll schedule a reminder two days before the event." },
  { section: '4. Reminders', query: 'Did I miss any reminders?', expected: "I'll check your overdue reminders." },

  // ==========================================
  // MODULE 5: FAMILY INFORMATION & MANAGEMENT
  // ==========================================
  { section: '5. Family Profile', query: 'Who is in my family?', expected: "I'll show the family members saved in your Family Profile." },
  { section: '5. Family Profile', query: 'Add my brother', expected: "Sure! Please provide your brother's details." },
  { section: '5. Family Profile', query: 'Add my father to family', expected: "I'll check whether your father is already registered." },
  { section: '5. Family Profile', query: "What is my father's birthday?", expected: "Your father's birthday is December 10." },
  { section: '5. Family Profile', query: "What is my mother's name?", expected: "Your mother's name is Sarah." },
  { section: '5. Family Profile', query: "Show father's details", expected: "I'll retrieve the authorized details from your Family Profile." },
  { section: '5. Family Profile', query: "Update father's phone number", expected: 'Please provide the new phone number.' },
  { section: '5. Family Profile', query: "What is my brother's age?", expected: "I'll check your brother's saved date of birth." },
  { section: '5. Family Profile', query: "Add father's anniversary", expected: 'What is the anniversary date?' },
  { section: '5. Family Profile', query: 'Show all family birthdays', expected: 'Here are the saved birthdays of your family members.' },
  { section: '5. Family Profile', query: "Is my brother's birthday saved?", expected: "I'll check the Family Calendar." },
  { section: '5. Family Profile', query: 'When was the last family event?', expected: 'Your most recent recorded family event was Diwali Gathering on November 01.' },
  { section: '5. Family Profile', query: 'Show my family timeline', expected: "I'll retrieve the available events from your Family Timeline." },

  // ==========================================
  // MODULE 6: DOCUMENT VAULT & RETRIEVAL
  // ==========================================
  // A. Fetch documents
  { section: '6. Documents - Fetch', query: "Fetch Sham's Aadhaar card", expected: "check the Document Vault for Sham's Aadhaar card" },
  { section: '6. Documents - Fetch', query: 'Show my PAN card', expected: "I'll search your uploaded PAN card." },
  { section: '6. Documents - Fetch', query: "Find father's passport", expected: "I'll check your father's available documents." },
  { section: '6. Documents - Fetch', query: "Get mother's voter ID", expected: "I'll search for your mother's voter ID." },
  { section: '6. Documents - Fetch', query: 'Fetch my 10th marksheet', expected: "I'll search for your 10th marksheet." },
  { section: '6. Documents - Fetch', query: 'Show my degree certificate', expected: "Your degree certificate hasn't been found in the Document Vault." },
  { section: '6. Documents - Fetch', query: 'Find my bank statement', expected: "I'll check your uploaded bank statements." },
  { section: '6. Documents - Fetch', query: 'Get my insurance policy', expected: "I'll search your insurance documents." },
  { section: '6. Documents - Fetch', query: 'Show my property papers', expected: "I'll check your property records." },
  { section: '6. Documents - Fetch', query: 'Find my birth certificate', expected: "I'll search for your birth certificate." },
  { section: '6. Documents - Fetch', query: 'Download my driving licence', expected: "I'll check its availability and access permissions." },
  { section: '6. Documents - Fetch', query: 'Show all my PDFs', expected: "I'll list the PDFs you are authorized to access." },

  // B. Missing document scenarios
  { section: '6. Documents - Missing', query: 'Fetch my Aadhaar', expected: "I couldn't find your Aadhaar card. Please upload it first." },
  { section: '6. Documents - Missing', query: "Do you have father's PAN?", expected: "Your father's PAN card is not currently available in the Document Vault." },
  { section: '6. Documents - Missing', query: 'Find my passport', expected: "I couldn't find an uploaded passport. Would you like to upload it?" },
  { section: '6. Documents - Missing', query: 'Fetch a document I never uploaded', expected: "I couldn't find that document. Please upload it before requesting retrieval." },
  { section: '6. Documents - Missing', query: 'Where is my old certificate?', expected: "I couldn't locate that certificate. Could you provide its name or type?" },
  { section: '6. Documents - Missing', query: "Find Sham's documents", expected: "I'll list the available documents belonging to Sham that you can access." },

  // C. Upload & manage
  { section: '6. Documents - Manage', query: 'Upload Aadhaar', expected: 'Please select your Aadhaar document to upload.' },
  { section: '6. Documents - Manage', query: "Save father's PAN", expected: "Please upload the PAN document and confirm the document owner's details." },
  { section: '6. Documents - Manage', query: 'Add my new certificate', expected: 'Please upload the certificate.' },
  { section: '6. Documents - Manage', query: 'Replace my old Aadhaar', expected: "Please upload the new document. I'll ask you to confirm before replacing the existing one." },
  { section: '6. Documents - Manage', query: 'Delete old passport', expected: "Which passport record should I delete? I'll ask for confirmation first." },
  { section: '6. Documents - Manage', query: 'Summarize my PDF', expected: "Please select the PDF you'd like me to summarize." },
  { section: '6. Documents - Manage', query: 'Read this document', expected: "I'll extract and explain the readable content." },
  { section: '6. Documents - Manage', query: 'Search for a word in my PDF', expected: 'Which word or phrase should I search for?' },
  { section: '6. Documents - Manage', query: 'When did I upload Aadhaar?', expected: "I'll check the Aadhaar upload date." },
  { section: '6. Documents - Manage', query: 'Is my passport expired?', expected: "I'll check its expiry date, if available." },

  // ==========================================
  // MODULE 7: TASKS AND TO-DO MANAGEMENT
  // ==========================================
  { section: '7. Tasks', query: 'Add a task to complete my assignment', expected: 'Your assignment task has been added.' },
  { section: '7. Tasks', query: 'Add a task to call the bank', expected: 'Your bank call task has been added.' },
  { section: '7. Tasks', query: 'Create a task for tomorrow', expected: 'What task would you like me to create?' },
  { section: '7. Tasks', query: 'Mark assignment as completed', expected: 'Your assignment task has been marked as completed.' },
  { section: '7. Tasks', query: 'Show pending tasks', expected: 'Here are your incomplete tasks.' },
  { section: '7. Tasks', query: 'What tasks do I have today?', expected: 'Here are your tasks scheduled for today.' },
  { section: '7. Tasks', query: 'Delete my completed tasks', expected: 'Would you like me to remove all completed tasks?' },
  { section: '7. Tasks', query: 'Change my task deadline', expected: 'Which task and what new deadline?' },
  { section: '7. Tasks', query: 'Add high priority task', expected: 'Sure! What task should I mark as high priority?' },
  { section: '7. Tasks', query: 'What is my next task?', expected: 'Your next scheduled task is Review documents.' },
  { section: '7. Tasks', query: 'Did I complete my assignment?', expected: "I'll check its current status." },
  { section: '7. Tasks', query: 'Add a task to buy groceries', expected: 'Your grocery shopping task has been added.' },

  // ==========================================
  // MODULE 8: NOTES AND PERSONAL MEMORY
  // ==========================================
  { section: '8. Notes', query: 'Save a note', expected: 'Sure! What would you like me to save?' },
  { section: '8. Notes', query: "Remember father's birthday", expected: "I'll check whether his birthday is already saved." },
  { section: '8. Notes', query: 'Remember that the Wi-Fi password is stored in my router records', expected: "I'll save a note about that, without requesting or exposing the password." },
  { section: '8. Notes', query: 'Add a note about my college project', expected: "Please tell me what you'd like to remember." },
  { section: '8. Notes', query: 'Show my notes', expected: 'Here are your saved notes.' },
  { section: '8. Notes', query: 'Find my project notes', expected: "I'll search your saved notes for project-related information." },
  { section: '8. Notes', query: 'Delete my old note', expected: 'Which note would you like me to delete?' },
  { section: '8. Notes', query: 'Update my note', expected: 'Please tell me which note and what to change.' },
  { section: '8. Notes', query: 'What did I tell you yesterday?', expected: "I'll search the available conversation history." },
  { section: '8. Notes', query: 'Save this information for later', expected: "Sure! I'll save it in your personal notes." },

  // ==========================================
  // MODULE 9: HOME & HOUSEHOLD MANAGEMENT
  // ==========================================
  { section: '9. Household', query: 'Add gas cylinder booking reminder', expected: "I'll create a reminder for your gas cylinder booking." },
  { section: '9. Household', query: 'When did I last book gas?', expected: "I'll check your saved gas booking records." },
  { section: '9. Household', query: 'Add a maintenance expense', expected: 'What was the amount and purpose?' },
  { section: '9. Household', query: 'Remind me to service my bike', expected: 'When should I remind you?' },
  { section: '9. Household', query: 'Add AC service on Sunday', expected: "I'll add AC servicing to your schedule for Sunday." },
  { section: '9. Household', query: 'Show house expenses', expected: "I'll retrieve your recorded household expenses." },
  { section: '9. Household', query: 'Is gas booking due?', expected: "I'll check your saved booking schedule." },
  { section: '9. Household', query: 'Add electricity meter reading', expected: 'Please provide the meter reading and date.' },
  { section: '9. Household', query: 'Show my household inventory', expected: "I'll list the household items saved in your records." },

  // ==========================================
  // MODULE 10: QUESTIONS ABOUT HOMEBRAIN ITSELF
  // ==========================================
  { section: '10. HomeBrain Capabilities', query: 'What can you do?', expected: 'I can manage your groceries, finances, family calendar, reminders, documents, tasks, and personal records.' },
  { section: '10. HomeBrain Capabilities', query: 'Can you manage my bills?', expected: 'Yes! I can track bills, payment status, due dates, and reminders.' },
  { section: '10. HomeBrain Capabilities', query: 'Can you remember birthdays?', expected: 'Yes! I can save family birthdays and help you check upcoming occasions.' },
  { section: '10. HomeBrain Capabilities', query: 'Can you fetch my documents?', expected: 'Yes! I can search your uploaded and authorized documents.' },
  { section: '10. HomeBrain Capabilities', query: 'Can you manage groceries?', expected: 'Yes! I can add, remove, update, and track grocery items.' },
  { section: '10. HomeBrain Capabilities', query: 'Can you remind me?', expected: 'Yes! I can schedule reminders when the notification integration is enabled.' },
  { section: '10. HomeBrain Capabilities', query: 'Can you access my files?', expected: 'I can access documents available through your connected and authorized Document Vault.' },
  { section: '10. HomeBrain Capabilities', query: 'What did I ask you to do?', expected: "I'll check your available task and conversation history." },

  // ==========================================
  // MODULE 11: TANGLISH COMMANDS
  // ==========================================
  { section: '11. Tanglish Commands', query: 'Milk add pannunga', expected: 'Milk has been added to your grocery list.' },
  { section: '11. Tanglish Commands', query: 'Grocery list kaaminga', expected: 'Here is your grocery list.' },
  { section: '11. Tanglish Commands', query: 'EB bill paid nu mark pannunga', expected: 'Your electricity bill has been marked as paid.' },
  { section: '11. Tanglish Commands', query: 'Appa birthday eppo?', expected: "Your father's birthday is on December 10." },
  { section: '11. Tanglish Commands', query: 'Appa birthday already add pannirukoma?', expected: "Yes! Your father's birthday is already saved on December 10." },
  { section: '11. Tanglish Commands', query: 'Naalaiku meeting add pannunga', expected: 'What time should I schedule your meeting tomorrow?' },
  { section: '11. Tanglish Commands', query: 'En Aadhaar card eduthu kudu', expected: "I'll search your Document Vault for your Aadhaar card." },
  { section: '11. Tanglish Commands', query: 'Sham oda PAN card irukka?', expected: "Let me check whether Sham's PAN card is available." },
  { section: '11. Tanglish Commands', query: 'Intha expense add pannunga', expected: 'Sure! What was the expense amount and purpose?' },
  { section: '11. Tanglish Commands', query: 'En pending bills enna?', expected: 'Here are your pending bills.' },
  { section: '11. Tanglish Commands', query: 'Reminder set pannunga', expected: 'Sure! What would you like me to remind you about?' },
  { section: '11. Tanglish Commands', query: 'Appa birthday ku reminder podu', expected: "I'll set a reminder for your father's birthday." },

  // ==========================================
  // MODULE 12: ERROR HANDLING & CLARIFICATION
  // ==========================================
  { section: '12. Error Handling & Clarification', query: 'Fetch my card', expected: 'Which card would you like me to retrieve?' },
  { section: '12. Error Handling & Clarification', query: "Fetch Sham's document", expected: "Which document belonging to Sham are you looking for?" },
  { section: '12. Error Handling & Clarification', query: 'Find the certificate', expected: 'Whose certificate would you like me to find?' },
  { section: '12. Error Handling & Clarification', query: 'Get that file', expected: 'Could you specify the file name or document type?' },
  { section: '12. Error Handling & Clarification', query: 'I want my document', expected: 'Sure! Which document do you need?' },
  { section: '12. Error Handling & Clarification', query: 'Document not found', expected: "I couldn't find the requested document. Please upload it first." },
  { section: '12. Error Handling & Clarification', query: 'File corrupted', expected: 'The uploaded file appears to be unreadable. Please upload another copy.' },
  { section: '12. Error Handling & Clarification', query: 'Upload failed', expected: 'The upload was unsuccessful. Please try again.' },
  { section: '12. Error Handling & Clarification', query: 'Unsupported file', expected: 'This file format is currently not supported. Please upload a supported file.' },
  { section: '12. Error Handling & Clarification', query: 'Unauthorized access', expected: "You don't have permission to access this document." },
  { section: '12. Error Handling & Clarification', query: 'Unknown command', expected: "I'm not sure I understood that. Could you rephrase your request?" }
];

async function runAllTests() {
  console.log(`🤖 Starting HomeBrain Complete Conversational Intent Catalogue Test Suite (${testCases.length} assertions)...\n`);

  let passed = 0;
  let failed = 0;
  let currentSection = '';

  for (const tc of testCases) {
    if (tc.section !== currentSection) {
      currentSection = tc.section;
      console.log(`\n--- ${currentSection} ---`);
    }

    try {
      const res = await queryBackend(tc.query);
      const text = res.text || '';
      const ok = text.toLowerCase().includes(tc.expected.toLowerCase());

      if (ok) {
        console.log(`  ✅ PASS: [${tc.query}]`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: [${tc.query}]`);
        console.error(`     Expected snippet: "${tc.expected}"`);
        console.error(`     Actual response:  "${text.replace(/\n+/g, ' ').substring(0, 140)}..."`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ ERROR on [${tc.query}]: ${err.message}`);
      failed++;
    }
  }

  console.log('\n==========================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed out of ${testCases.length}`);
  console.log('==========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests();
