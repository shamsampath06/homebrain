import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..');

const botTrainingPath = path.join(baseDir, 'src', 'lib', 'botTraining.ts');
const serverIndexPath = path.join(baseDir, 'server', 'index.ts');

let botTrainingCode = fs.readFileSync(botTrainingPath, 'utf-8');

// Extract the matchHomeBrainTrainedDialogue function body
const funcStart = botTrainingCode.indexOf('export function matchHomeBrainTrainedDialogue');
if (funcStart === -1) {
  console.error('Could not find matchHomeBrainTrainedDialogue in botTraining.ts');
  process.exit(1);
}

let funcCode = botTrainingCode.substring(funcStart).trim();
// Replace export with standard function declaration
funcCode = funcCode.replace(
  /^export\s+function\s+matchHomeBrainTrainedDialogue[\s\S]*?\):\s*string\s*\|\s*null/m,
  'function matchHomeBrainTrainedDialogue(rawQuery: string, effectiveDocuments: any[], user: any, effectiveBills: any[] = [], extraContext?: any): string | null'
);

// In server/index.ts, document fields can be d.file_type || d.fileType etc.
funcCode = funcCode.replace(/d\.fileType/g, '(d.file_type || d.fileType)');
funcCode = funcCode.replace(/d\.fileSize/g, '(d.file_size || d.fileSize)');
funcCode = funcCode.replace(/d\.uploaderName/g, '(d.uploader_name || d.uploaderName)');
funcCode = funcCode.replace(/d\.uploadDate/g, '(d.upload_date || d.uploadDate)');
funcCode = funcCode.replace(/d\.expiryDate/g, '(d.expiry_date || d.expiryDate)');
funcCode = funcCode.replace(/d\.summaryContent/g, '(d.summary_content || d.summaryContent)');

// Add specific handler for "remind me to pay eb tomorrow" vs "remind me tomorrow to pay eb"
funcCode = funcCode.replace(
  `  if (/^remind\\s+me\\s+to\\s+pay\\s+eb\\s+tomorrow$/i.test(clean) || /^remind\\s+me\\s+tomorrow\\s+to\\s+pay\\s+eb$/i.test(clean)) {
    return "I'll set a reminder for tomorrow to pay the electricity bill.";
  }`,
  `  if (/^remind\\s+me\\s+to\\s+pay\\s+eb\\s+tomorrow$/i.test(clean)) {
    return "I'll set a reminder for tomorrow to pay the electricity bill.";
  }
  if (/^remind\\s+me\\s+tomorrow\\s+to\\s+pay\\s+eb$/i.test(clean)) {
    return "I'll schedule a reminder for tomorrow to pay your electricity bill.";
  }`
);

// Read server/index.ts
let serverIndexCode = fs.readFileSync(serverIndexPath, 'utf-8');

const markerStart = '// --- HomeBrain Trained Conversational & Intent Resolver ---';
const markerEnd = '// --- RAG & AI Chatbot Query Endpoint (Phase 1) ---';

const idxStart = serverIndexCode.indexOf(markerStart);
const idxEnd = serverIndexCode.indexOf(markerEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Could not find markers in server/index.ts');
  process.exit(1);
}

const newServerCode =
  serverIndexCode.substring(0, idxStart) +
  markerStart + '\n' +
  funcCode + '\n\n' +
  serverIndexCode.substring(idxEnd);

fs.writeFileSync(serverIndexPath, newServerCode, 'utf-8');
console.log('✅ Successfully synchronized matchHomeBrainTrainedDialogue into server/index.ts');

