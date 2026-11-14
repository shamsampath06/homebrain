// Automated Test Suite for HomeBrain Trained Bot Intents
import http from 'http';

console.log('🤖 Starting HomeBrain Trained Bot Intent & Conversational Verification Suite...\n');

let passed = 0;
let failed = 0;

function queryBot(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.reply || '');
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function check(testName, actual, expectedFragment) {
  const normActual = actual.toLowerCase().replace(/\s+/g, ' ');
  const normExpected = expectedFragment.toLowerCase().replace(/\s+/g, ' ');
  if (normActual.includes(normExpected)) {
    console.log(`  ✅ PASS: [${testName}]`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: [${testName}]`);
    console.error(`     Expected snippet: "${expectedFragment}"`);
    console.error(`     Actual output:    "${actual.slice(0, 150)}..."`);
    failed++;
  }
}

async function runTests() {
  console.log('--- 1. Testing Greetings & Identity ---');
  check('Hi', await queryBot('Hi'), 'Hello! Welcome back. How can I help you today?');
  check('Hello', await queryBot('Hello'), 'Hey there! How can I assist you?');
  check('Hey', await queryBot('Hey'), 'Hey! What can I do for you?');
  check('Good morning', await queryBot('Good morning'), "Good morning! Hope you're having a great day. How can I help?");
  check('Good afternoon', await queryBot('Good afternoon'), 'Good afternoon! How can I assist you today?');
  check('Good evening', await queryBot('Good evening'), 'Good evening! What can I help you with?');
  check('Good night', await queryBot('Good night'), 'Good night! Have a peaceful night.');
  check('How are you?', await queryBot('How are you?'), "I'm doing great! Ready to help you with your tasks. How are you?");
  check('Who are you?', await queryBot('Who are you?'), "I'm HomeBrain, your personal AI assistant. I can help you manage documents, retrieve information, and assist with everyday tasks.");
  check('What can you do?', await queryBot('What can you do?'), 'I can retrieve your uploaded documents, search personal information, answer questions, manage your family records, and assist with everyday requests.');
  check('Thank you', await queryBot('Thank you'), "You're welcome! I'm always happy to help.");
  check('Thanks', await queryBot('Thanks'), 'Happy to help!');
  check('Bye', await queryBot('Bye'), 'Goodbye! Feel free to come back whenever you need me.');
  check('See you', await queryBot('See you'), 'See you again! Take care.');
  check('Are you there?', await queryBot('Are you there?'), "Yes! I'm here and ready to assist you.");
  check('Help me', await queryBot('Help me'), 'Of course! Tell me what you need help with.');
  check('What is your name?', await queryBot('What is your name?'), "I'm HomeBrain, your personal AI assistant.");
  check('Who created you?', await queryBot('Who created you?'), "I'm HomeBrain, an AI assistant designed to help manage personal and family information.");

  console.log('\n--- 2. Testing Document Retrieval ---');
  check("Fetch Sham's Aadhaar card", await queryBot("Fetch Sham's Aadhaar card"), "Let me check the Document Vault for Sham's Aadhaar card.");
  check("Fetch Sham's Aadhaar missing", await queryBot("Fetch Sham's Aadhaar card"), "I couldn't find Sham's Aadhaar card in the Document Vault.");
  check("Get my Aadhaar card", await queryBot("Get my Aadhaar card"), "I'll check whether your Aadhaar card is available in your Document Vault.");
  check("Find Aadhaar card (Clarification)", await queryBot("Find Aadhaar card"), "Whose Aadhaar card would you like me to find?");
  check("Where is my Aadhaar?", await queryBot("Where is my Aadhaar?"), "I'll search your uploaded documents for your Aadhaar card.");
  check("Show Sham's Aadhaar", await queryBot("Show Sham's Aadhaar"), "I'll check for Sham's Aadhaar document.");
  check("Do you have my Aadhaar card?", await queryBot("Do you have my Aadhaar card?"), "Let me check your Document Vault.");
  check("Download my Aadhaar", await queryBot("Download my Aadhaar"), "I'll check whether your Aadhaar card is available and authorized for download.");
  check("Send me Sham's Aadhaar", await queryBot("Send me Sham's Aadhaar"), "I'll check whether Sham's Aadhaar card is available and whether you have permission to access it.");

  check("Fetch my PAN card", await queryBot("Fetch my PAN card"), "I'll search your Document Vault for your PAN card.");
  check("Fetch my PAN card missing", await queryBot("Fetch my PAN card"), "I couldn't find the PAN card in your Document Vault. Please upload it so I can retrieve it next time.");
  check("Find Sham's PAN", await queryBot("Find Sham's PAN"), "Let me check whether Sham's PAN card is uploaded.");
  check("Show my PAN card", await queryBot("Show my PAN card"), "I'll check its availability and your access permissions.");
  check("Download PAN card", await queryBot("Download PAN card"), "I'll check whether your PAN card is available for download.");
  check("Do you have my PAN?", await queryBot("Do you have my PAN?"), "Let me check your uploaded documents.");

  check("Fetch my driving licence (Found)", await queryBot("Fetch my driving licence"), "Father's Karnataka Driving License has been found in your Document Vault");
  check("Find Sham's licence (Missing)", await queryBot("Find Sham's licence"), "Your driving licence is not currently available in the Document Vault. Please upload it first.");
  check("Show my DL (Found)", await queryBot("Show my DL"), "Father's Karnataka Driving License has been found in your Document Vault");

  check("Fetch my 10th marksheet", await queryBot("Fetch my 10th marksheet"), "I couldn't find the requested educational document. Please upload it to your Document Vault.");
  check("Find my 12th certificate", await queryBot("Find my 12th certificate"), "I couldn't find the requested educational document. Please upload it to your Document Vault.");
  check("Get my college ID", await queryBot("Get my college ID"), "I couldn't find the requested educational document. Please upload it to your Document Vault.");
  check("Find my degree certificate", await queryBot("Find my degree certificate"), "I couldn't find the requested educational document. Please upload it to your Document Vault.");
  check("Fetch Sham's college documents", await queryBot("Fetch Sham's college documents"), "I couldn't find the requested educational document. Please upload it to your Document Vault.");

  check("Fetch my passport (Found)", await queryBot("Fetch my passport"), "Father's Republic of India Passport has been found in your Document Vault");
  check("Show my insurance document (Found)", await queryBot("Show my insurance document"), "Family Health Insurance Policy 2026 (Star Health) has been found in your Document Vault");
  check("Show all my documents", await queryBot("Show all my documents"), "I'll retrieve a list of documents you are authorized to access.");

  console.log('\n--- 3. Testing Document Upload Commands ---');
  check("Upload my Aadhaar", await queryBot("Upload my Aadhaar"), "Sure! Please select your Aadhaar document to upload.");
  check("I want to add my PAN card", await queryBot("I want to add my PAN card"), "Please upload your PAN card. I'll help you save it in your Document Vault.");
  check("Save this document", await queryBot("Save this document"), "Sure! I'll process the uploaded document and prepare it for storage.");
  check("Store Sham's Aadhaar", await queryBot("Store Sham's Aadhaar"), "Please upload the document. I'll save it under Sham's records after validation and authorization.");
  check("Add a new document", await queryBot("Add a new document"), "Sure! Please upload your document and specify its type.");
  check("Upload completed", await queryBot("Upload completed"), "I'll verify the upload and confirm once the document is successfully stored.");
  check("Where can I upload documents?", await queryBot("Where can I upload documents?"), "You can upload documents through the Document Vault.");
  check("Can you save PDF files?", await queryBot("Can you save PDF files?"), "Yes! I can process supported PDF documents. Please upload your file.");

  console.log('\n--- 4. Testing Document Search & Management ---');
  check("Search for my documents", await queryBot("Search for my documents"), "Sure! I'll search your Document Vault.");
  check("How many documents do I have?", await queryBot("How many documents do I have?"), "I'll check your Document Vault and count your available documents.");
  check("Show my uploaded files", await queryBot("Show my uploaded files"), "I'll retrieve your uploaded file list.");
  check("Find documents uploaded today", await queryBot("Find documents uploaded today"), "I'll search for documents uploaded today.");
  check("Find my latest document", await queryBot("Find my latest document"), "I'll check your most recently uploaded documents.");
  check("Delete my Aadhaar", await queryBot("Delete my Aadhaar"), "I'll identify the document and ask you to confirm before deleting it.");
  check("Rename my document", await queryBot("Rename my document"), "Please specify the document and its new name.");
  check("When did I upload my PAN?", await queryBot("When did I upload my PAN?"), "I'll check the upload date in your Document Vault.");
  check("Is my document expired?", await queryBot("Is my document expired?"), "I'll check the document's expiry date, if available.");

  console.log('\n--- 5. Testing General AI Assistant Commands ---');
  check("What is today's date?", await queryBot("What is today's date?"), "I'll provide today's date based on the system clock.");
  check("Remember this information", await queryBot("Remember this information"), "Sure! Please tell me what information you want to save.");
  check("Find my family details", await queryBot("Find my family details"), "I'll search your authorized family records.");
  check("Show my family timeline", await queryBot("Show my family timeline"), "I'll retrieve the available events from your Family Timeline.");
  check("Add a family event", await queryBot("Add a family event"), "Sure! Please provide the event details and date.");
  check("Summarize this document", await queryBot("Summarize this document"), "Please upload the document, and I'll summarize its contents.");
  check("Explain this PDF", await queryBot("Explain this PDF"), "Upload the PDF, and I'll help explain its contents.");
  check("What is written in this document?", await queryBot("What is written in this document?"), "I'll extract and explain the available document content.");
  check("Search my previous records", await queryBot("Search my previous records"), "I'll search your available personal records.");
  check("I need assistance", await queryBot("I need assistance"), "Of course! Tell me what you need, and I'll help you.");

  console.log('\n--- 6. Testing Error Handling & Clarification ---');
  check("Fetch my card", await queryBot("Fetch my card"), "Which card would you like me to retrieve?");
  check("Fetch Sham's document", await queryBot("Fetch Sham's document"), "Which document belonging to Sham are you looking for?");
  check("Find the certificate", await queryBot("Find the certificate"), "Whose certificate would you like me to find?");
  check("Get that file", await queryBot("Get that file"), "Could you specify the file name or document type?");
  check("I want my document", await queryBot("I want my document"), "Sure! Which document do you need?");
  check("Show my semester marksheet", await queryBot("Show my semester marksheet"), "Which semester marksheet are you looking for?");
  check("Document not found", await queryBot("Document not found"), "I couldn't find the requested document. Please upload it first.");
  check("File corrupted", await queryBot("File corrupted"), "The uploaded file appears to be unreadable. Please upload another copy.");
  check("Upload failed", await queryBot("Upload failed"), "The upload was unsuccessful. Please try again.");
  check("Unsupported file", await queryBot("Unsupported file"), "This file format is currently not supported. Please upload a supported file.");
  check("Unauthorized access", await queryBot("Unauthorized access"), "You don't have permission to access this document.");
  check("Unknown command", await queryBot("Unknown command"), "I'm not sure I understood that. Could you rephrase your request?");

  console.log('\n==========================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('==========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

