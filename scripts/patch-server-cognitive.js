import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverIndexPath = path.resolve(__dirname, '..', 'server', 'index.ts');

let code = fs.readFileSync(serverIndexPath, 'utf-8');
code = code.replace(/\r\n/g, '\n');

// 1. Add updateFamilyData and deleteFamilyData if missing
if (!code.includes('const updateFamilyData =')) {
  const insertTarget = '// Helper: Optional local Ollama inference fallback';
  const helperCode = `// Helper: Update row in Supabase REST
const updateFamilyData = async (table: string, id: string, payload: any, token: string): Promise<any> => {
  if (!SUPABASE_URL || token === 'demo-token') return payload;
  const url = \`\${SUPABASE_URL}/rest/v1/\${table}?id=eq.\${id}\`;
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: \`Bearer \${token}\`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn(\`Could not update in \${table}: \${await res.text()}\`);
      return payload;
    }
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (e) {
    console.warn(\`Failed update into \${table}:\`, e);
    return payload;
  }
};

// Helper: Delete row from Supabase REST
const deleteFamilyData = async (table: string, id: string, token: string): Promise<boolean> => {
  if (!SUPABASE_URL || token === 'demo-token') return true;
  try {
    const res = await fetch(\`\${SUPABASE_URL}/rest/v1/\${table}?id=eq.\${id}\`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: \`Bearer \${token}\`
      }
    });
    return res.ok;
  } catch (err) {
    console.error(\`Error deleting from \${table}:\`, err);
    return false;
  }
};

// Helper: Optional local Ollama inference fallback`;

  if (code.includes(insertTarget)) {
    code = code.replace(insertTarget, helperCode);
    console.log('Added updateFamilyData and deleteFamilyData');
  } else {
    console.warn('Could not find insertTarget for updateFamilyData');
  }
}

// 2. Update matchHomeBrainTrainedDialogue signature to accept effectiveBills
code = code.replace(
  'function matchHomeBrainTrainedDialogue(rawQuery: string, effectiveDocuments: any[], user: any): string | null {',
  'function matchHomeBrainTrainedDialogue(rawQuery: string, effectiveDocuments: any[], user: any, effectiveBills: any[] = []): string | null {'
);

// 3. Update mark electricity bill as paid
code = code.replace(
  `  // A. Bill payment
  if (/^mark\\s+electricity\\s+bill\\s+as\\s+paid$/i.test(clean)) {
    return 'Your electricity bill has been marked as paid.';
  }`,
  `  // A. Bill payment
  if (/^mark\\s+electricity\\s+bill\\s+as\\s+paid$/i.test(clean)) {
    const eb = effectiveBills.find((b: any) => /electricity|eb/i.test(b.title || b.category || ''));
    if (eb && (eb.is_paid || eb.status === 'paid')) {
      return 'Your electricity bill has been marked as paid. It is already marked as paid on record.';
    }
    if (eb) {
      eb.is_paid = true;
      eb.status = 'paid';
    }
    return 'Your electricity bill has been marked as paid.';
  }`
);

// 4. Update add father's birthday in matchHomeBrainTrainedDialogue
code = code.replace(
  `  if (/^add\\s+(?:my\\s+)?father['’]?s\\s+birthday$/i.test(clean)) {
    return "What date is your father's birthday?";
  }`,
  `  if (/^add\\s+(?:my\\s+)?father['’]?s\\s+birthday$/i.test(clean)) {
    const sessionKey = user?.familyId || user?.id || 'demo-family';
    setPendingAction(sessionKey, {
      sessionKey,
      type: 'calendar_missing_date',
      data: { person: 'Father' }
    });
    return "What date is your father's birthday?";
  }`
);

// 5. Update upload aadhaar in matchHomeBrainTrainedDialogue
code = code.replace(
  `  if (/^upload\\s+(?:my\\s+)?aadhaar$/i.test(clean)) {
    return 'Sure! Please select your Aadhaar document to upload.';
  }`,
  `  if (/^upload\\s+(?:my\\s+)?aadhaar$/i.test(clean)) {
    const hasAadhaar = effectiveDocuments.some(d => /aadhaar|aadhar|uid/i.test(\`\${d.title || ''} \${d.description || ''}\`));
    if (hasAadhaar) {
      return 'An Aadhaar document already exists in your Document Vault. Would you like to upload a new version? Please select your Aadhaar document to upload.';
    }
    return 'Sure! Please select your Aadhaar document to upload.';
  }`
);

// 6. Update Document retrieval person handling
const oldPersonDocBlock = `  let person = 'your';
  let personName = user?.name || 'You';
  if (/\\bsham(?:'s)?\\b/i.test(clean)) {
    person = "Sham's";
    personName = 'Sham';
  } else if (/\\bfather(?:'s)?\\b|\\bdad(?:'s)?\\b/i.test(clean)) {
    person = "Father's";
    personName = 'Father';
  } else if (/\\bmother(?:'s)?\\b|\\bmom(?:'s)?\\b/i.test(clean)) {
    person = "Mother's";
    personName = 'Mother';
  } else if (/\\bsarah(?:'s)?\\b/i.test(clean)) {
    person = "Sarah's";
    personName = 'Sarah';
  } else if (/\\bsneha(?:'s)?\\b/i.test(clean)) {
    person = "Sneha's";
    personName = 'Sneha';
  }

  // A. AADHAAR CARD
  if (/aadhaar|aadhar|uid\\b|uidai/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      if (/^fetch\\b/i.test(clean)) checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\\n\\n";
      else if (/^show\\b/i.test(clean)) checkMsg = "I'll check for Sham's Aadhaar document.\\n\\n";
      else if (/^send\\b/i.test(clean)) checkMsg = "I'll check whether Sham's Aadhaar card is available and whether you have permission to access it.\\n\\n";
      else checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\\n\\n";
    } else {
      if (/^get\\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available in your Document Vault.\\n\\n";
      else if (/^where\\b/i.test(clean)) checkMsg = "I'll search your uploaded documents for your Aadhaar card.\\n\\n";
      else if (/^download\\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available and authorized for download.\\n\\n";
      else checkMsg = "Let me check your Document Vault.\\n\\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = \`\${d.title || ''} \${d.description || ''}\`.toLowerCase();
      const isAadhaar = txt.includes('aadhaar') || txt.includes('aadhar') || txt.includes('uid');
      if (!isAadhaar) return false;
      if (personName === 'Sham') return txt.includes('sham');
      return true;
    });

    if (doc) {
      return checkMsg + \`\${person} Aadhaar card has been found in your Document Vault. Would you like to view or download it?\\n\\n• **\${(doc.title || '').replace('[DEMO] ', '')}** (\${doc.category}, \${(doc.file_type || doc.fileType)} - \${(doc.file_size || doc.fileSize)}): Uploaded by \${(doc.uploader_name || doc.uploaderName)}\\n  📝 **Summary**: \${(doc.summary_content || doc.summaryContent) || doc.description || 'Verified Aadhaar Card'}\`;
    } else {
      if (personName === 'Sham') {
        return checkMsg + "I couldn't find Sham's Aadhaar card in the Document Vault.\\n\\nPlease upload the Aadhaar card so I can store it and make it available for future retrieval.";
      }
      return checkMsg + "I couldn't find your Aadhaar card in the Document Vault. Please upload it first.";
    }
  }`;

const newPersonDocBlock = `  let person = 'your';
  let personName = user?.name || 'You';
  if (/\\bsham(?:'s)?\\b/i.test(clean)) {
    person = "Sham's";
    personName = 'Sham';
  } else if (/\\bfather(?:'s)?\\b|\\bdad(?:'s)?\\b/i.test(clean)) {
    person = "Father's";
    personName = 'Father';
  } else if (/\\bmother(?:'s)?\\b|\\bmom(?:'s)?\\b/i.test(clean)) {
    person = "Mother's";
    personName = 'Mother';
  } else if (/\\bgrandfather(?:'s)?\\b|\\bgrandpa(?:'s)?\\b/i.test(clean)) {
    person = "grandfather's";
    personName = 'Grandfather';
  } else if (/\\bgrandmother(?:'s)?\\b|\\bgrandma(?:'s)?\\b/i.test(clean)) {
    person = "grandmother's";
    personName = 'Grandmother';
  } else if (/\\bsarah(?:'s)?\\b/i.test(clean)) {
    person = "Sarah's";
    personName = 'Sarah';
  } else if (/\\bsneha(?:'s)?\\b/i.test(clean)) {
    person = "Sneha's";
    personName = 'Sneha';
  } else if (/\\bsister(?:'s)?\\b/i.test(clean)) {
    person = "Sister's";
    personName = 'Sister';
  } else if (/\\bbrother(?:'s)?\\b/i.test(clean)) {
    person = "Brother's";
    personName = 'Brother';
  }

  // A. AADHAAR CARD
  if (/aadhaar|aadhar|uid\\b|uidai/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      if (/^fetch\\b/i.test(clean)) checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\\n\\n";
      else if (/^show\\b/i.test(clean)) checkMsg = "I'll check for Sham's Aadhaar document.\\n\\n";
      else if (/^send\\b/i.test(clean)) checkMsg = "I'll check whether Sham's Aadhaar card is available and whether you have permission to access it.\\n\\n";
      else checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\\n\\n";
    } else if (personName === 'Grandfather' || personName === 'Grandmother') {
      checkMsg = \`Let me check the Document Vault for \${person} Aadhaar card.\\n\\n\`;
    } else {
      if (/^get\\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available in your Document Vault.\\n\\n";
      else if (/^where\\b/i.test(clean)) checkMsg = "I'll search your uploaded documents for your Aadhaar card.\\n\\n";
      else if (/^download\\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available and authorized for download.\\n\\n";
      else checkMsg = "Let me check your Document Vault.\\n\\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = \`\${d.title || ''} \${d.description || ''} \${d.uploader_name || d.uploaderName || ''}\`.toLowerCase();
      const isAadhaar = txt.includes('aadhaar') || txt.includes('aadhar') || txt.includes('uid');
      if (!isAadhaar) return false;
      if (personName !== 'You') return txt.includes(personName.toLowerCase());
      return true;
    });

    if (doc) {
      return checkMsg + \`\${person} Aadhaar card has been found in your Document Vault. Would you like to view or download it?\\n\\n• **\${(doc.title || '').replace('[DEMO] ', '')}** (\${doc.category}, \${(doc.file_type || doc.fileType)} - \${(doc.file_size || doc.fileSize)}): Uploaded by \${(doc.uploader_name || doc.uploaderName)}\\n  📝 **Summary**: \${(doc.summary_content || doc.summaryContent) || doc.description || 'Verified Aadhaar Card'}\`;
    } else {
      if (personName !== 'You') {
        return checkMsg + \`I couldn't find \${person} Aadhaar card in the Document Vault.\\n\\nPlease upload the Aadhaar card so I can store it and make it available for future retrieval.\`;
      }
      return checkMsg + "I couldn't find your Aadhaar card in the Document Vault. Please upload it first.";
    }
  }`;

if (code.includes(oldPersonDocBlock)) {
  code = code.replace(oldPersonDocBlock, newPersonDocBlock);
  console.log('Updated Document retrieval person resolution');
}

// 7. Add sharedFallback data definitions and resetSharedFallbackState right above // --- RAG & AI Chatbot Query Endpoint (Phase 1) ---
const ragMarker = '// --- RAG & AI Chatbot Query Endpoint (Phase 1) ---';
if (!code.includes('const sharedFallbackEvents =')) {
  const fallbackDefinitions = `// --- Shared Module-Scoped In-Memory State for Demo Evaluation ---
const initialFallbackEvents = [
  {
    id: 'demo-event-match-1',
    title: "Sham's Interschool Football Match",
    date: '2026-11-12',
    time: '16:30',
    category: 'School',
    description: 'Quarter-finals against St. Joseph Academy at City Stadium',
    members_involved: ['Sham', 'Father'],
    recurring: 'None'
  },
  {
    id: 'demo-event-checkup-2',
    title: "Mother's Diabetic Health Checkup",
    date: '2026-11-20',
    time: '11:00',
    category: 'Appointment',
    description: 'Quarterly HbA1c review with Dr. Sharma at Apollo Clinic',
    members_involved: ['Mother', 'Father'],
    recurring: 'Monthly'
  },
  {
    id: 'demo-event-bday-sarah',
    title: "Sarah's Birthday",
    date: '2026-03-10',
    time: '18:30',
    category: 'Birthday',
    description: 'Dinner with close friends and family',
    members_involved: ['Sarah'],
    recurring: 'Yearly'
  },
  {
    id: 'demo-event-anniv-parents',
    title: 'Parents 26th Wedding Anniversary',
    date: '2026-05-20',
    time: '20:00',
    category: 'Holiday',
    description: 'Celebrating 26 wonderful years of marriage! Family weekend getaway',
    members_involved: ['Father', 'Mother', 'Sarah', 'Sneha', 'Sham'],
    recurring: 'Yearly'
  },
  {
    id: 'demo-event-bday-father',
    title: "Father's Birthday Celebration",
    date: '2026-06-15',
    time: '19:00',
    category: 'Birthday',
    description: 'Family dinner at Royal Orchid Restaurant celebrating Dad 52nd birthday',
    members_involved: ['Father'],
    recurring: 'Yearly'
  },
  {
    id: 'demo-event-bday-mother',
    title: "Mother's Birthday & Puja",
    date: '2026-09-22',
    time: '09:00',
    category: 'Birthday',
    description: 'Special morning prayer followed by family lunch for Mom',
    members_involved: ['Mother'],
    recurring: 'Yearly'
  },
  {
    id: 'demo-event-bday-test',
    title: "bday test",
    date: '2026-11-05',
    time: '10:00',
    category: 'Birthday',
    description: 'Sneha birthday test',
    members_involved: ['Sneha'],
    recurring: 'Yearly'
  },
  {
    id: 'demo-event-bday-sham',
    title: "SHAM",
    date: '2026-11-20',
    time: '12:00',
    category: 'Birthday',
    description: 'Sham celebration',
    members_involved: ['Sham'],
    recurring: 'Yearly'
  }
];

const initialFallbackGroceries = [
  { id: 'demo-groc-1', name: 'Milk', quantity: '1 unit', category: 'Dairy', is_purchased: false },
  { id: 'demo-groc-2', name: 'Bread', quantity: '1 packet', category: 'Bakery', is_purchased: false }
];

const initialFallbackBills = [
  { id: 'demo-bill-1', title: 'Electricity Bill', amount: 1500, due_date: '2026-11-25', is_paid: false, category: 'Utility' },
  { id: 'demo-bill-2', title: 'Water Bill', amount: 450, due_date: '2026-11-28', is_paid: false, category: 'Utility' },
  { id: 'demo-bill-3', title: 'Internet Bill', amount: 999, due_date: '2026-11-30', is_paid: false, category: 'Utility' }
];

const initialFallbackDocuments = [
  {
    id: 'demo-doc-aadhaar-sham',
    title: "Sham's Aadhaar Card",
    category: 'Identity',
    file_type: 'PDF',
    file_size: '1.4 MB',
    uploader_name: 'Sarah',
    upload_date: '2026-01-15',
    description: 'Official Aadhaar Card for Sham Kumar. Stored in Family Document Vault.',
    summary_content: '• Document Type: Aadhaar Card\\n• Holder: Sham Kumar\\n• Status: Verified and indexed in private storage.'
  },
  {
    id: 'demo-doc-pan-father',
    title: "Father's PAN Card",
    category: 'Identity',
    file_type: 'PDF',
    file_size: '0.8 MB',
    uploader_name: 'Sarah',
    upload_date: '2026-01-20',
    description: 'Permanent Account Number Card for Father (Rajesh Kumar).',
    summary_content: '• Document Type: PAN Card\\n• Holder: Rajesh Kumar'
  },
  {
    id: 'demo-doc-passport-1',
    title: "Father's Republic of India Passport",
    category: 'Identity',
    file_type: 'PDF',
    file_size: '1.85 MB',
    uploader_name: 'Sarah',
    upload_date: '2026-01-10',
    expiry_date: '2031-08-13',
    description: 'Official Indian Passport for Father (Rajesh Kumar). Document No: Z4892107. Issued by RPO Bangalore. Valid: 14 Aug 2021 to 13 Aug 2031. Physical Location: Master Bedroom Study Safe Locker #2, Shelf A.',
    summary_content: '• Document Type: Republic of India Passport\\n• Passport No: Z4892107\\n• Holder: Rajesh Kumar (Father)\\n• DOB: 15 Jun 1978\\n• Place of Issue: Bangalore\\n• Expiry Date: 13 Aug 2031\\n• Physical House Storage: Master Bedroom Safe Locker #2, Shelf A\\n• Emergency Contact: Priya Kumar (Mother)'
  },
  {
    id: 'demo-doc-insurance-2',
    title: 'Family Health Insurance Policy 2026 (Star Health)',
    category: 'Medical',
    file_type: 'PDF',
    file_size: '3.2 MB',
    uploader_name: 'Sarah',
    upload_date: '2026-02-01',
    expiry_date: '2026-12-15',
    description: 'Comprehensive Family Floater Health Insurance Policy covering 5 members (Father, Mother, Sarah, Sneha, Sham). Sum Insured: ₹25,00,000. Policy No: SH-99201-2026. TPA: MediAssist India.',
    summary_content: '• Insurer: Star Health & Allied Insurance\\n• Policy Number: SH-99201-2026\\n• Sum Insured: ₹25,00,000 (Floater)\\n• Beneficiaries: Rajesh Kumar, Priya Kumar, Sarah Kumar, Sneha Kumar, Sham Kumar\\n• Renewal Date: 15 Dec 2026\\n• Covered Hospitals: Apollo Hospitals, Manipal Hospitals, Fortis\\n• TPA Helpline: 1800-425-2255 / 1800-102-4477\\n• Physical Copy Location: Master Bedroom Filing Cabinet, Green Folder labeled "Insurance 2026"'
  },
  {
    id: 'demo-doc-license-3',
    title: "Father's Karnataka Driving License",
    category: 'Identity',
    file_type: 'PDF',
    file_size: '1.1 MB',
    uploader_name: 'Sarah',
    upload_date: '2026-02-15',
    expiry_date: '2026-11-28',
    description: 'Permanent Driving License (LMV & MCWG). DL No: KA-01-20060012345. Holder: Rajesh Kumar. RTO: Indiranagar KA-01. Expiry / Renewal Date: 28 Nov 2026.',
    summary_content: '• Document Type: Driving License (Karnataka RTO)\\n• DL Number: KA-01-20060012345\\n• Holder: Rajesh Kumar\\n• Vehicle Class: LMV + MCWG\\n• Expiry / Renewal Date: 28 Nov 2026\\n• Physical Location: Father Black Leather Wallet & Study Desk Folder #1'
  }
];

let sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
let sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
let sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
let sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));

function resetSharedFallbackState() {
  sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
  sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
  sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
  sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));
}

app.post('/api/ai/reset-demo-state', (req: Request, res: Response) => {
  resetSharedFallbackState();
  res.json({ success: true, message: 'Demo fallback state successfully reset' });
});

${ragMarker}`;

  code = code.replace(ragMarker, fallbackDefinitions);
  console.log('Added shared fallback state and reset endpoint');
}

// 8. Replace effectiveEvents in /api/ai/query
const targetEventsBlock = `    const effectiveDocuments = (documents && documents.length > 0) ? documents : [
      {
        id: 'demo-doc-passport-1',
        title: "Father's Republic of India Passport",
        category: 'Identity',
        file_type: 'PDF',
        file_size: '1.85 MB',
        uploader_name: 'Sarah',
        upload_date: '2026-01-10',
        description: 'Official Indian Passport for Father (Rajesh Kumar). Document No: Z4892107. Issued by RPO Bangalore. Valid: 14 Aug 2021 to 13 Aug 2031. Physical Location: Master Bedroom Study Safe Locker #2, Shelf A.',
        summary_content: '• Document Type: Republic of India Passport\\n• Passport No: Z4892107\\n• Holder: Rajesh Kumar (Father)\\n• DOB: 15 Jun 1978\\n• Place of Issue: Bangalore\\n• Expiry Date: 13 Aug 2031\\n• Physical House Storage: Master Bedroom Safe Locker #2, Shelf A\\n• Emergency Contact: Priya Kumar (Mother)'
      },
      {
        id: 'demo-doc-insurance-2',
        title: 'Family Health Insurance Policy 2026 (Star Health)',
        category: 'Medical',
        file_type: 'PDF',
        file_size: '3.2 MB',
        uploader_name: 'Sarah',
        upload_date: '2026-02-01',
        description: 'Comprehensive Family Floater Health Insurance Policy covering 5 members (Father, Mother, Sarah, Sneha, Sham). Sum Insured: ₹25,00,000. Policy No: SH-99201-2026. TPA: MediAssist India.',
        summary_content: '• Insurer: Star Health & Allied Insurance\\n• Policy Number: SH-99201-2026\\n• Sum Insured: ₹25,00,000 (Floater)\\n• Beneficiaries: Rajesh Kumar, Priya Kumar, Sarah Kumar, Sneha Kumar, Sham Kumar\\n• Renewal Date: 15 Dec 2026\\n• Covered Hospitals: Apollo Hospitals, Manipal Hospitals, Fortis\\n• TPA Helpline: 1800-425-2255 / 1800-102-4477\\n• Physical Copy Location: Master Bedroom Filing Cabinet, Green Folder labeled "Insurance 2026"'
      }
    ];`;

const replacementEventsBlock = `    const effectiveEvents = (events && events.length > 0) ? events : sharedFallbackEvents;
    const effectiveGroceries = (groceries && groceries.length > 0) ? groceries : sharedFallbackGroceries;
    const effectiveBills = (bills && bills.length > 0) ? bills : sharedFallbackBills;
    const effectiveDocuments = (documents && documents.length > 0) ? documents : sharedFallbackDocuments;`;

if (code.includes(targetEventsBlock)) {
  code = code.replace(targetEventsBlock, replacementEventsBlock);
  console.log('Replaced effectiveEvents with shared state in /api/ai/query');
} else {
  console.warn('targetEventsBlock NOT matched');
}

// 9. Update query endpoint resolution logic (prioritizing pending answers and cognitive action engine)
const oldQueryResolutionBlock = `    let reply = '';

    // LLM Call
    if (GEMINI_API_KEY) {`;

const newQueryResolutionBlock = `    let reply = '';

    const sessionKey = user.familyId || user.id || 'demo-family';
    const cleanQ = (query || '').toLowerCase().trim();
    const activePending = getPendingAction(sessionKey);
    const isConflictResolutionAnswer =
      (/^(update(?:\\s+it|\\s+date)?|yes\\s+update|change\\s+it|add\\s+(?:as\\s+)?separate|separate|keep\\s+both)$/i.test(cleanQ)) ||
      (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1]?.text?.includes("separate event?"));

    // 1. If actively answering a multi-turn pending action or conflict prompt, prioritize Cognitive Action Engine
    if ((isConflictResolutionAnswer || (activePending && isAnsweringPendingAction(query || '', activePending))) && (!attachments || attachments.length === 0)) {
      const pendingResult = await processIntelligentAction(
        query || '',
        {
          events: effectiveEvents,
          groceries: effectiveGroceries,
          bills: effectiveBills,
          expenses,
          reminders,
          documents: effectiveDocuments,
          knowledgeList,
          user,
          token,
          conversationHistory
        },
        {
          insertFamilyData,
          updateFamilyData,
          deleteFamilyData
        }
      );

      if (pendingResult.handled) {
        res.json({
          reply: pendingResult.reply,
          text: pendingResult.text,
          sources: pendingResult.sources,
          actions: [...actionsExecuted, ...pendingResult.actionsExecuted],
          processingTimeMs: Date.now() - startTime
        });
        return;
      }
    } else if (activePending && !isAnsweringPendingAction(query || '', activePending)) {
      clearPendingAction(sessionKey);
    }

    // 2. Fast-path for trained HomeBrain commands & conversational dialogue
    const trainedDialogue = (!attachments || attachments.length === 0)
      ? matchHomeBrainTrainedDialogue(query || '', effectiveDocuments, user, effectiveBills)
      : null;

    if (trainedDialogue) {
      res.json({
        reply: trainedDialogue,
        text: trainedDialogue,
        sources: ['HomeBrain Trained Dialog Catalog'],
        actions: actionsExecuted,
        processingTimeMs: Date.now() - startTime
      });
      return;
    }

    // 3. Dynamic Cognitive Action Engine (CREATE, UPDATE, DELETE, COMPLETE, PAYMENT, conflict resolution)
    if (!attachments || attachments.length === 0) {
      const cognitiveResult = await processIntelligentAction(
        query || '',
        {
          events: effectiveEvents,
          groceries: effectiveGroceries,
          bills: effectiveBills,
          expenses,
          reminders,
          documents: effectiveDocuments,
          knowledgeList,
          user,
          token,
          conversationHistory
        },
        {
          insertFamilyData,
          updateFamilyData,
          deleteFamilyData
        }
      );

      if (cognitiveResult.handled) {
        res.json({
          reply: cognitiveResult.reply,
          text: cognitiveResult.text,
          sources: cognitiveResult.sources,
          actions: [...actionsExecuted, ...cognitiveResult.actionsExecuted],
          processingTimeMs: Date.now() - startTime
        });
        return;
      }
    }

    // LLM Call
    if (GEMINI_API_KEY) {`;

if (code.includes(oldQueryResolutionBlock)) {
  code = code.replace(oldQueryResolutionBlock, newQueryResolutionBlock);
  console.log('Updated /api/ai/query resolution pipeline');
} else {
  console.warn('oldQueryResolutionBlock NOT matched');
}

fs.writeFileSync(serverIndexPath, code, 'utf-8');
console.log('✅ Server index successfully patched with cognitive action engine!');
