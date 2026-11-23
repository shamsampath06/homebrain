// HomeBrain Trained Conversational & Document Vault Resolver (Shared Client & Server)
import type { DocumentItem, User } from '../types';

export function matchHomeBrainTrainedDialogue(
  rawQuery: string,
  effectiveDocuments: DocumentItem[] | any[],
  user: User | any | null,
  _effectiveBills: any[] = [],
  _extraContext?: {
    groceries?: any[];
    reminders?: any[];
    events?: any[];
    expenses?: any[];
    tasks?: any[];
    familyMembers?: any[];
    memories?: any[];
  }
): string | null {
  const qTrim = (rawQuery || '').trim();
  if (!qTrim) return null;

  // Normalized query: lowercase, stripped of surrounding punctuation
  const clean = qTrim.toLowerCase().replace(/^[?!.,\s]+|[?!.,\s]+$/g, '').trim();

  // Never intercept mutation commands (add, create, schedule, remind, mark, paid, spent, bought, remove, delete, update, change, move, cancel, log, record, remember, save a note, etc.)
  // unless it is a specific Document Vault upload/delete prompt.
  const isNonDocumentMutation =
    /\b(?:grocery|groceries|shopping\s*list|pantry|milk|rice|tomato|onion|oil|egg|vegetable|bread|butter|curd|paneer|sugar|water\s*can|bill|electricity|eb\b|expense|spent|petrol|salary|income|budget|birthday|bday|anniversary|meeting|appointment|doctor|housewarming|ceremony|trip|dinner|lunch|remind|reminder|alarm|snooze|task|assignment|medicine|medication|tablet|capsule|dose|dolo|paracetamol|allergic|allergy|prefer|note|knowledge|gas\s*cylinder|ac\s*service|bike\s*service|meter\s*reading)\b/i.test(clean) &&
    !/\b(?:aadhaar|aadhar|pan\s*card|passport|licen[cs]e|marksheet|degree\s*certificate|voter\s*id|birth\s*certificate|document\s*vault|uploaded\s*files|my\s*pdfs)\b/i.test(clean);

  if (isNonDocumentMutation) {
    return null;
  }

  // Any mutation/creation/deletion commands must be processed by the Cognitive Action Engine, not static training
  if (/\b(?:remove|delete|erase|clear|drop|upload|save|store)\b/i.test(clean)) {
    return null;
  }

  // ==========================================
  // 1. CLARIFICATION & ERROR SITUATIONS
  // ==========================================
  if (/^fetch\s+(?:my|the)\s+card$/i.test(clean) || /^show\s+(?:my|the)\s+card$/i.test(clean) || clean === 'my card' || clean === 'fetch card' || clean === 'find my card') {
    return 'Which card would you like me to retrieve?';
  }
  if (/^fetch\s+sham['’]?s\s+document$/i.test(clean) || /^find\s+sham['’]?s\s+document$/i.test(clean) || /^get\s+sham['’]?s\s+document$/i.test(clean) || clean === "sham's document") {
    return "Which document belonging to Sham are you looking for?";
  }
  if (/^find\s+(?:the\s+)?aadhaar(?:\s+card)?$/i.test(clean) || (/^fetch\s+aadhaar(?:\s+card)?$/i.test(clean) && !clean.includes('sham') && !clean.includes('my'))) {
    return 'Whose Aadhaar card would you like me to find?';
  }
  if (/^show\s+(?:my\s+)?semester\s+marksheet$/i.test(clean) || /^fetch\s+(?:my\s+)?semester\s+marksheet$/i.test(clean) || clean === 'semester marksheet') {
    return 'Which semester marksheet are you looking for?';
  }
  if (/^find\s+(?:the\s+)?certificate$/i.test(clean) || /^fetch\s+(?:the\s+)?certificate$/i.test(clean) || /^get\s+(?:the\s+)?certificate$/i.test(clean)) {
    return 'Whose certificate would you like me to find?';
  }
  if (/^get\s+that\s+file$/i.test(clean) || /^find\s+that\s+file$/i.test(clean) || /^fetch\s+that\s+file$/i.test(clean)) {
    return 'Could you specify the file name or document type?';
  }
  if (/^i\s+want\s+my\s+document$/i.test(clean) || clean === 'want my document' || clean === 'my document') {
    return 'Sure! Which document do you need?';
  }
  if (clean === 'document not found') {
    return "I couldn't find the requested document. Please upload it first.";
  }
  if (clean === 'file corrupted' || clean === 'corrupted file') {
    return 'The uploaded file appears to be unreadable. Please upload another copy.';
  }
  if (clean === 'upload failed') {
    return 'The upload was unsuccessful. Please try again.';
  }
  if (clean === 'unsupported file' || clean === 'unsupported format') {
    return 'This file format is currently not supported. Please upload a supported file.';
  }
  if (clean === 'unauthorized access') {
    return "You don't have permission to access this document.";
  }
  if (clean === 'unknown command') {
    return "I'm not sure I understood that. Could you rephrase your request?";
  }

  // ==========================================
  // 2. QUESTIONS ABOUT HOMEBRAIN ITSELF
  // ==========================================
  if (/^what\s+can\s+you\s+do$/i.test(clean)) {
    return 'I can manage your groceries, finances, family calendar, reminders, medicines, documents, tasks, and family knowledge records.';
  }
  if (/^can\s+you\s+manage\s+my\s+bills$/i.test(clean)) {
    return 'Yes! I can track bills, payment status, due dates, and reminders.';
  }
  if (/^can\s+you\s+remember\s+birthdays$/i.test(clean)) {
    return 'Yes! I can save family birthdays and help you check upcoming occasions.';
  }
  if (/^can\s+you\s+fetch\s+my\s+documents$/i.test(clean)) {
    return 'Yes! I can search your uploaded and authorized documents.';
  }
  if (/^can\s+you\s+manage\s+groceries$/i.test(clean)) {
    return 'Yes! I can add, remove, update, and track grocery items.';
  }
  if (/^can\s+you\s+remind\s+me$/i.test(clean)) {
    return 'Yes! I can schedule reminders and tasks across your household dashboard.';
  }
  if (/^can\s+you\s+access\s+my\s+files$/i.test(clean)) {
    return 'I can access documents available through your connected and authorized Document Vault.';
  }
  if (/^what\s+did\s+i\s+ask\s+you\s+to\s+do$/i.test(clean)) {
    return "I'll check your available task and conversation history.";
  }

  // ==========================================
  // 3. GREETINGS & PERSONAL ASSISTANT
  // ==========================================
  if (/^hi(?:\s+homebrain)?$/i.test(clean)) {
    return 'Hello! Welcome back. How can I help you today?';
  }
  if (/^hello(?:\s+homebrain)?$/i.test(clean)) {
    return 'Hey there! How can I assist you?';
  }
  if (/^hey(?:\s+homebrain)?$/i.test(clean)) {
    return 'Hey! What can I do for you?';
  }
  if (/^good\s*morning$/i.test(clean)) {
    return "Good morning! Hope you're having a great day. How can I help?";
  }
  if (/^good\s*afternoon$/i.test(clean)) {
    return 'Good afternoon! How can I assist you today?';
  }
  if (/^good\s*evening$/i.test(clean)) {
    return 'Good evening! What can I help you with?';
  }
  if (/^good\s*night$/i.test(clean)) {
    return 'Good night! Have a peaceful night.';
  }
  if (/^how\s+are\s+you$/i.test(clean)) {
    return "I'm doing great! Ready to help you with your tasks. How are you?";
  }
  if (/^who\s+are\s+you$/i.test(clean)) {
    return "I'm HomeBrain, your personal AI assistant. I can help you manage documents, retrieve information, and assist with everyday household tasks.";
  }
  if (/^thank\s+you$/i.test(clean)) {
    return "You're welcome! I'm always happy to help.";
  }
  if (/^thanks$/i.test(clean)) {
    return 'Happy to help!';
  }
  if (/^bye$/i.test(clean) || /^goodbye$/i.test(clean)) {
    return 'Goodbye! Feel free to come back whenever you need me.';
  }
  if (/^see\s+you$/i.test(clean) || /^see\s+ya$/i.test(clean)) {
    return 'See you again! Take care.';
  }
  if (/^are\s+you\s+there$/i.test(clean)) {
    return "Yes! I'm here and ready to assist you.";
  }
  if (/^help\s+me$/i.test(clean)) {
    return 'Of course! Tell me what you need help with.';
  }
  if (/^what\s+is\s+your\s+name$/i.test(clean)) {
    return "I'm HomeBrain, your personal AI assistant.";
  }
  if (/^who\s+created\s+you$/i.test(clean) || /^who\s+made\s+you$/i.test(clean)) {
    return "I'm HomeBrain, an AI assistant designed to help manage personal and family information.";
  }
  if (/^what\s+is\s+today['’]?s\s+date$/i.test(clean) || clean === 'today date' || clean === 'date today') {
    const dateFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `I'll provide today's date based on the system clock.\n\nToday's date is **${dateFormatted}**.`;
  }
  if (/^find\s+my\s+family\s+details$/i.test(clean) || /^who\s+is\s+in\s+my\s+family$/i.test(clean)) {
    if (_extraContext?.familyMembers && Array.isArray(_extraContext.familyMembers)) {
      if (_extraContext.familyMembers.length === 0) {
        return `I searched your authorized family records. Only **${user?.name || 'you'}** (${user?.role || 'Admin'}) is currently registered in this household.`;
      }
      return "I'll search your authorized family records.\n\n" +
        `👨‍👩‍👧‍👦 **Family Members in Ecosystem (${_extraContext.familyMembers.length})**:\n` +
        _extraContext.familyMembers.map((m: any) => `• **${m.name}** (${m.relation || m.role || 'Member'}${m.age ? `, Age ${m.age}` : ''})`).join('\n');
    }
    return "I'll search your authorized family records.\n\n" +
      `👨‍👩‍👧‍👦 **Family Members in Ecosystem**:\n` +
      `• **Father** (Parent, Age 52)\n• **Mother** (Parent, Age 48)\n• **Sarah** (Eldest Daughter, Age 24)\n• **Sneha** (Daughter, Age 19)\n• **Sham** (Son, High School, Age 16)`;
  }
  if (/^show\s+(?:my\s+)?family\s+timeline$/i.test(clean)) {
    if (_extraContext?.memories && Array.isArray(_extraContext.memories)) {
      if (_extraContext.memories.length === 0) {
        return "I checked your Family Timeline, and no photo albums or place memories have been added yet. You can add memories anytime under the Family Timeline tab.";
      }
      return "I'll retrieve the available events from your Family Timeline.\n\n" +
        `📸 **Available Family Photo Albums & Places (${_extraContext.memories.length})**:\n` +
        _extraContext.memories.map((m: any) => `• **${(m.title || '').replace('[DEMO] ', '')}** (${m.location || m.year || 'Album'})`).join('\n') +
        `\n\n*(You can view them anytime under the Family Timeline tab).*`;
    }
    return "I'll retrieve the available events from your Family Timeline.\n\n" +
      `📸 **Available Family Photo Albums & Places**:\n` +
      `• **Paris, France** (3 photos)\n• **Kyoto, Japan** (3 photos)\n• **Santorini, Greece** (2 photos)\n• **Swiss Alps, Switzerland** (3 photos)\n• **Manali, Himachal Pradesh** (2 photos)\n• **Bali, Indonesia** (3 photos)\n\n*(You can view them anytime under the Family Timeline tab).*`;
  }
  if (/^i\s+need\s+assistance$/i.test(clean) || clean === 'need assistance') {
    return "Of course! Tell me what you need, and I'll help you.";
  }

  // ==========================================
  // 4. DOCUMENT UPLOAD & MANAGEMENT COMMANDS
  // ==========================================
  if (/^upload\s+(?:my\s+)?aadhaar$/i.test(clean)) {
    const hasAadhaar = effectiveDocuments.some(d => /aadhaar|aadhar|uid/i.test(`${d.title || ''} ${d.description || ''}`));
    if (hasAadhaar) {
      return 'An Aadhaar document already exists in your Document Vault. Would you like to upload a new version? Please select your Aadhaar document to upload.';
    }
    return 'Sure! Please select your Aadhaar document to upload.';
  }
  if (/^(?:i\s+want\s+to\s+)?add\s+my\s+pan(?:\s*card)?$/i.test(clean)) {
    return "Please upload your PAN card. I'll help you save it in your Document Vault.";
  }
  if (/^save\s+father['’]?s\s+pan$/i.test(clean)) {
    return "Please upload the PAN document and confirm the document owner's details.";
  }
  if (/^add\s+my\s+new\s+certificate$/i.test(clean)) {
    return 'Please upload the certificate.';
  }
  if (/^replace\s+my\s+old\s+aadhaar$/i.test(clean)) {
    return "Please upload the new document. I'll ask you to confirm before replacing the existing one.";
  }
  if (/^delete\s+old\s+passport$/i.test(clean)) {
    return "Which passport record should I delete? I'll ask for confirmation first.";
  }
  if (/^summarize\s+my\s+pdf$/i.test(clean)) {
    return "Please select the PDF you'd like me to summarize.";
  }
  if (/^read\s+this\s+document$/i.test(clean)) {
    return "I'll extract and explain the readable content.";
  }
  if (/^search\s+for\s+a\s+word\s+in\s+my\s+pdf$/i.test(clean)) {
    return 'Which word or phrase should I search for?';
  }
  if (/^when\s+did\s+i\s+upload\s+aadhaar$/i.test(clean)) {
    return "I'll check the Aadhaar upload date.";
  }
  if (/^is\s+my\s+passport\s+expired$/i.test(clean)) {
    return "I'll check its expiry date, if available.";
  }
  if (/^save\s+this\s+document$/i.test(clean)) {
    return "Sure! I'll process the uploaded document and prepare it for storage.";
  }
  if (/^store\s+sham['’]?s\s+aadhaar$/i.test(clean)) {
    return "Please upload the document. I'll save it under Sham's records after validation and authorization.";
  }
  if (/^add\s+a\s+new\s+document$/i.test(clean) || clean === 'add new document') {
    return 'Sure! Please upload your document and specify its type.';
  }
  if (/^upload\s+completed$/i.test(clean)) {
    return "I'll verify the upload and confirm once the document is successfully stored.";
  }
  if (/^where\s+can\s+i\s+upload\s+documents$/i.test(clean)) {
    return 'You can upload documents through the Document Vault.';
  }
  if (/^can\s+you\s+save\s+pdf(?:\s+files)?$/i.test(clean)) {
    return 'Yes! I can process supported PDF documents. Please upload your file.';
  }
  if (/^summarize\s+this\s+document$/i.test(clean)) {
    return "Please upload the document, and I'll summarize its contents.";
  }
  if (/^explain\s+this\s+pdf$/i.test(clean)) {
    return "Upload the PDF, and I'll help explain its contents.";
  }
  if (/^what\s+is\s+written\s+in\s+this\s+document$/i.test(clean)) {
    return "I'll extract and explain the available document content.";
  }

  // Document Vault Search & Statistics
  if (/^search\s+(?:for\s+)?my\s+documents$/i.test(clean)) {
    if (effectiveDocuments.length === 0) {
      return "Sure! I'll search your Document Vault.\n\nNo documents have been uploaded to your Document Vault yet. Please upload your documents to make them accessible here.";
    }
    return "Sure! I'll search your Document Vault.\n\n" +
      `📁 **Retrieved Documents (${effectiveDocuments.length} files found)**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}, ${d.file_type || d.fileType} - ${d.file_size || d.fileSize})`).join('\n');
  }

  if (/^how\s+many\s+documents\s+do\s+i\s+have$/i.test(clean)) {
    return `I'll check your Document Vault and count your available documents.\n\nYou currently have **${effectiveDocuments.length}** document(s) in your Document Vault.`;
  }

  if (/^show\s+my\s+uploaded\s+files$/i.test(clean) || clean === 'show uploaded files') {
    if (effectiveDocuments.length === 0) {
      return "I'll retrieve your uploaded file list.\n\nYou currently have no files uploaded to your Document Vault.";
    }
    return "I'll retrieve your uploaded file list.\n\n" +
      `📁 **Your Uploaded Files (${effectiveDocuments.length})**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}) - Uploaded by ${d.uploader_name || d.uploaderName || user?.name || 'User'}`).join('\n');
  }

  if (/^find\s+documents\s+uploaded\s+today$/i.test(clean)) {
    const today = new Date().toISOString().split('T')[0];
    const docsToday = effectiveDocuments.filter(d => (d.upload_date || d.uploadDate || '').startsWith(today));
    if (docsToday.length === 0) {
      return "I'll search for documents uploaded today.\n\nNo documents were uploaded today.";
    }
    return "I'll search for documents uploaded today.\n\n" +
      `📁 **Documents Uploaded Today (${docsToday.length})**:\n\n` +
      docsToday.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category})`).join('\n');
  }

  if (/^find\s+my\s+latest\s+document$/i.test(clean) || clean === 'latest document') {
    if (effectiveDocuments.length === 0) {
      return "I'll check your most recently uploaded documents.\n\nNo documents found in your Document Vault.";
    }
    const latest = effectiveDocuments[0];
    return "I'll check your most recently uploaded documents.\n\n" +
      `• **${(latest.title || '').replace('[DEMO] ', '')}** (${latest.category}, ${latest.file_type || latest.fileType}): Uploaded on ${latest.upload_date || latest.uploadDate || 'recently'}\n  📝 **Summary**: ${latest.summary_content || latest.summaryContent || latest.description || 'Securely saved'}`;
  }

  if (/^search\s+(?:for\s+)?(?:my\s+)?certificates$/i.test(clean)) {
    const certs = effectiveDocuments.filter(d => {
      const txt = `${d.title || ''} ${d.category || ''} ${d.description || ''}`.toLowerCase();
      return txt.includes('certificate') || txt.includes('degree') || txt.includes('marksheet') || (d.category || '').toLowerCase() === 'education';
    });
    if (certs.length === 0) {
      return "I'll search your educational and professional certificates.\n\nI couldn't find the requested educational document. Please upload it to your Document Vault.";
    }
    return "I'll search your educational and professional certificates.\n\n" +
      certs.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}): ${d.description || 'Verified educational record'}`).join('\n');
  }

  if (/^delete\s+my\s+aadhaar$/i.test(clean)) {
    return "I'll identify the document and ask you to confirm before deleting it. Are you sure you want to permanently delete your Aadhaar card from the Document Vault?";
  }

  if (/^rename\s+my\s+document$/i.test(clean)) {
    return 'Please specify the document and its new name.';
  }

  if (/^when\s+did\s+i\s+upload\s+my\s+pan$/i.test(clean)) {
    const panDoc = effectiveDocuments.find(d => /pan/i.test(d.title || '') || /pan/i.test(d.description || ''));
    if (panDoc) {
      return `I'll check the upload date in your Document Vault.\n\nYour PAN card was uploaded on **${panDoc.upload_date || panDoc.uploadDate}**.`;
    }
    return "I'll check the upload date in your Document Vault.\n\nYour PAN card is not currently uploaded in the Document Vault.";
  }

  if (/^is\s+my\s+document\s+expired$/i.test(clean)) {
    const expiredList = effectiveDocuments.filter(d => {
      const exp = d.expiry_date || d.expiryDate;
      return exp && new Date(exp).getTime() < Date.now();
    });
    const expiringSoonList = effectiveDocuments.filter(d => {
      const exp = d.expiry_date || d.expiryDate;
      if (!exp) return false;
      const diffDays = Math.ceil((new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 60;
    });

    if (expiredList.length === 0 && expiringSoonList.length === 0) {
      return "I'll check the document's expiry date, if available.\n\n✅ None of your documents are expired or expiring in the next 60 days.";
    }
    let res = "I'll check the document's expiry date, if available.\n\n";
    if (expiredList.length > 0) {
      res += `🚨 **Expired Documents (${expiredList.length})**:\n` + expiredList.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** expired on ${d.expiry_date || d.expiryDate}`).join('\n') + '\n\n';
    }
    if (expiringSoonList.length > 0) {
      res += `⚠️ **Expiring Soon (${expiringSoonList.length})**:\n` + expiringSoonList.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** expires on ${d.expiry_date || d.expiryDate}`).join('\n');
    }
    return res.trim();
  }

  // ==========================================
  // 5. SPECIFIC DOCUMENT RETRIEVAL TRIGGERS
  // ==========================================
  let person = 'your';
  let personName = user?.name || 'You';
  if (/\bsham(?:'s)?\b/i.test(clean)) {
    person = "Sham's";
    personName = 'Sham';
  } else if (/\bfather(?:'s)?\b|\bdad(?:'s)?\b/i.test(clean)) {
    person = "Father's";
    personName = 'Father';
  } else if (/\bmother(?:'s)?\b|\bmom(?:'s)?\b/i.test(clean)) {
    person = "Mother's";
    personName = 'Mother';
  } else if (/\bsarah(?:'s)?\b/i.test(clean)) {
    person = "Sarah's";
    personName = 'Sarah';
  } else if (/\bsneha(?:'s)?\b/i.test(clean)) {
    person = "Sneha's";
    personName = 'Sneha';
  } else if (/\bgrandfather(?:'s)?\b|\bgrandpa(?:'s)?\b|\bthatha(?:'s)?\b/i.test(clean)) {
    person = "grandfather's";
    personName = 'Grandfather';
  } else if (/\bgrandmother(?:'s)?\b|\bgrandma(?:'s)?\b|\bpaati(?:'s)?\b/i.test(clean)) {
    person = "grandmother's";
    personName = 'Grandmother';
  }

  // A. AADHAAR CARD
  if (/aadhaar|aadhar|uid\b|uidai/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      if (/^fetch\b/i.test(clean)) checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll check for Sham's Aadhaar document.\n\n";
      else if (/^send\b/i.test(clean)) checkMsg = "I'll check whether Sham's Aadhaar card is available and whether you have permission to access it.\n\n";
      else checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\n\n";
    } else if (personName === 'Grandfather' || personName === 'Grandmother') {
      checkMsg = `Let me check the Document Vault for ${person} Aadhaar card.\n\n`;
    } else {
      if (/^get\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available in your Document Vault.\n\n";
      else if (/^where\b/i.test(clean)) checkMsg = "I'll search your uploaded documents for your Aadhaar card.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available and authorized for download.\n\n";
      else checkMsg = "Let me check your Document Vault.\n\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''}`.toLowerCase();
      const isAadhaar = txt.includes('aadhaar') || txt.includes('aadhar') || txt.includes('uid');
      if (!isAadhaar) return false;
      if (personName === 'Sham') return txt.includes('sham');
      if (personName === 'Grandfather') return txt.includes('grandfather') || txt.includes('grandpa');
      if (personName === 'Grandmother') return txt.includes('grandmother') || txt.includes('grandma');
      return true;
    });

    if (doc) {
      return checkMsg + `${person} Aadhaar card has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}\n  📝 **Summary**: ${doc.summary_content || doc.summaryContent || doc.description || 'Verified Aadhaar Card'}`;
    } else {
      if (personName === 'Sham') {
        return checkMsg + "I couldn't find Sham's Aadhaar card in the Document Vault.\n\nPlease upload the Aadhaar card so I can store it and make it available for future retrieval.";
      }
      return checkMsg + "I couldn't find your Aadhaar card in the Document Vault. Please upload it first.";
    }
  }

  // B. PAN CARD
  if (/\bpan\s*card\b|\b(?:my|father['’]?s|mother['’]?s|sham['’]?s|sarah['’]?s|sneha['’]?s|oda)\s+pan\b/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      checkMsg = "Let me check whether Sham's PAN card is uploaded.\n\n";
    } else {
      if (/^fetch\b/i.test(clean)) checkMsg = "I'll search your Document Vault for your PAN card.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll search your uploaded PAN card.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check whether your PAN card is available for download.\n\n";
      else checkMsg = "Let me check your uploaded documents.\n\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''}`.toLowerCase();
      if (!txt.includes('pan')) return false;
      if (personName === 'Sham') return txt.includes('sham');
      return true;
    });

    if (doc) {
      return checkMsg + `${person} PAN card has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}\n  📝 **Summary**: ${doc.summary_content || doc.summaryContent || doc.description || 'Official PAN record'}`;
    } else {
      return checkMsg + "I couldn't find the PAN card in your Document Vault. Please upload it so I can retrieve it next time.";
    }
  }

  // C. DRIVING LICENCE
  if (/licen[cs]e|\bdl\b/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      checkMsg = "Let me check Sham's uploaded documents.\n\n";
    } else {
      if (/^fetch\b/i.test(clean)) checkMsg = "I'll search for your driving licence.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll check your Document Vault for your driving licence.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check its availability and access permissions.\n\n";
      else checkMsg = "I'll search for your driving licence.\n\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''}`.toLowerCase();
      const isLic = txt.includes('license') || txt.includes('licence') || txt.includes('driving');
      if (!isLic) return false;
      if (personName === 'Sham') return txt.includes('sham');
      return true;
    });

    if (doc) {
      return checkMsg + `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}\n  📝 **Summary**: ${doc.summary_content || doc.summaryContent || doc.description || 'Permanent Driving License'}`;
    } else {
      return checkMsg + "Your driving licence is not currently available in the Document Vault. Please upload it first.";
    }
  }

  // D. EDUCATIONAL DOCUMENTS
  if (/(?:10th|11th|12th)\s*(?:mark\s*sheets?|marksheet|certificate)|college\s*id|degree\s*certificate|college\s*documents?|educational\s*documents?|\bmarksheet\b|\bmark\s*sheet\b/i.test(clean)) {
    let checkMsg = '';
    if (/10th/i.test(clean)) checkMsg = "I'll search for your 10th marksheet.\n\n";
    else if (/11th/i.test(clean)) checkMsg = "I'll search for your 11th marksheet.\n\n";
    else if (/12th/i.test(clean)) checkMsg = "Let me check your uploaded educational records.\n\n";
    else if (/college\s*id/i.test(clean)) checkMsg = "I'll check whether your college ID is available.\n\n";
    else if (/degree/i.test(clean)) checkMsg = "I'll search your Document Vault for your degree certificate.\n\n";
    else if (/sham/i.test(clean)) checkMsg = "I'll search for Sham's uploaded educational documents.\n\n";
    else checkMsg = "I'll search your Document Vault for your educational documents.\n\n";

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''} ${d.category || ''}`.toLowerCase();
      const normTxt = txt.replace(/\bmark\s*sheet\b/gi, 'marksheet');
      const isEdu = normTxt.includes('college') || normTxt.includes('marksheet') || normTxt.includes('degree') || normTxt.includes('10th') || normTxt.includes('11th') || normTxt.includes('12th') || (d.category || '').toLowerCase() === 'education';
      if (!isEdu) return false;
      if (/\b10th\b/i.test(clean) && !normTxt.includes('10th')) return false;
      if (/\b11th\b/i.test(clean) && !normTxt.includes('11th')) return false;
      if (/\b12th\b/i.test(clean) && !normTxt.includes('12th')) return false;
      if (/college\s*id/i.test(clean) && !normTxt.includes('college id')) return false;
      if (/degree/i.test(clean) && (!normTxt.includes('degree') && !normTxt.includes('b.tech') && !normTxt.includes('btech'))) return false;
      if (personName === 'Sham' && !normTxt.includes('sham')) return false;
      return true;
    });

    if (doc) {
      return checkMsg + `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}\n  📝 **Summary**: ${doc.summary_content || doc.summaryContent || doc.description}`;
    } else {
      if (/degree/i.test(clean)) {
        return "Your degree certificate hasn't been found in the Document Vault.";
      }
      return checkMsg + "I couldn't find the requested educational document. Please upload it to your Document Vault.";
    }
  }

  // E. OTHER PERSONAL DOCUMENTS
  if (/\bpassport\b/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('passport') || (d.description || '').toLowerCase().includes('passport'));
    if (doc) {
      return "I'll check your Document Vault for your passport.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}\n  📝 **Summary**: ${doc.summary_content || doc.summaryContent || doc.description}`;
    }
    return "I couldn't find an uploaded passport. Would you like to upload it?";
  }

  if (/voter\s*id/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('voter'));
    if (doc) {
      return "Let me search for your voter ID.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}): Uploaded by ${doc.uploader_name || doc.uploaderName}`;
    }
    return "Let me search for your voter ID.\n\nI couldn't find your voter ID in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/birth\s*certificate/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('birth'));
    if (doc) {
      return "I'll search for your birth certificate.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category})`;
    }
    return "I'll search for your birth certificate.\n\nI couldn't find your birth certificate in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/family\s*documents?/i.test(clean)) {
    return "I'll search for available family documents.\n\n" +
      `📁 **Available Family Documents (${effectiveDocuments.length})**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category})`).join('\n');
  }

  if (/insurance\s*(?:policy|document|paper|record)|(?:fetch|show|find|get|where\s+is)\s+(?:my\s+|family\s+)?insurance/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('insurance') || (d.description || '').toLowerCase().includes('insurance'));
    if (doc) {
      return "I'll search your insurance documents.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}\n  📝 **Summary**: ${doc.summary_content || doc.summaryContent || doc.description}`;
    }
    return "I'll search your insurance documents.\n\nI couldn't find your insurance document in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/property\s*(?:documents?|papers?|records?|deed)/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('property') || (d.category || '').toLowerCase() === 'home');
    if (doc) {
      return "I'll check your property records.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault.\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category})`;
    }
    return "I'll check your property records.\n\nI couldn't find property-related documents in the Document Vault. Please upload them to your Document Vault.";
  }

  if (/bank\s*statement/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('bank') || (d.title || '').toLowerCase().includes('statement'));
    if (doc) {
      return "I'll check your uploaded bank statements.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault.\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category})`;
    }
    return "I'll check your uploaded bank statements.\n\nI couldn't find your bank statement in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/show\s+all\s+(?:my\s+)?pdfs/i.test(clean)) {
    const pdfs = effectiveDocuments.filter(d => (d.file_type || d.fileType || '').toLowerCase().includes('pdf') || (d.title || '').toLowerCase().endsWith('.pdf'));
    return "I'll list the PDFs you are authorized to access.\n\n" +
      `📄 **Authorized PDF Documents (${pdfs.length})**:\n\n` +
      pdfs.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category})`).join('\n');
  }

  if (/(?:show|list|display|get|view|fetch)\s+(?:me\s+)?all\s+(?:my\s+)?(?:stored\s+|uploaded\s+|saved\s+|vault\s+)?documents/i.test(clean) || clean === 'all my documents' || clean === 'all documents' || clean === 'all stored documents' || clean === 'stored documents') {
    return "I'll retrieve a list of documents you are authorized to access.\n\n" +
      `📁 **Authorized Documents (${effectiveDocuments.length} files)**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}, ${d.file_type || d.fileType} - ${d.file_size || d.fileSize})`).join('\n') +
      `\n\n*(Click Download Document on any record below to download directly to your device).*`;
  }

  return null;
}
