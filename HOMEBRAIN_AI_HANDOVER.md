# HOMEBRAIN — AI AGENT HANDOVER & OPERATIONAL BRIEF

> **For:** AI Coding Agents (Cline, Roo Code, Aider, GitHub Copilot, Continue.dev) running in **VS Code** with **Ollama** or **Cloud LLMs**  
> **Source Project:** HomeBrain — Autonomous Multimodal Cognitive Ecosystem  
> **Repository Root:** `e:\2Autonomous Multimodal Cognitive Ecosystem\Autonomous Multimodal Cognitive Ecosystem for`  
> **Parent Documentation:** See `HOMEBRAIN_PROJECT_MASTER_DOCUMENTATION.md` for full 17-part architectural audit.

---

## ⚡ 1. THE 10 COMMANDMENTS FOR THIS CODEBASE

1. **DO NOT REWRITE OR REDESIGN THE APPLICATION.** The UI layout, Tailwind color system, and component structure are working, approved, and must be preserved.
2. **NEVER USE MOCK DATA OR SIMULATED TIMEOUTS.** All 12 modules read and write to real Supabase PostgreSQL tables using Row Level Security (RLS).
3. **DO NOT DELETE OR MOVE EXISTING FILES.** Keep the modular organization under `src/components/modules/`.
4. **ALWAYS KEEP BOTH SERVERS RUNNING:**
   - Frontend: `npm run dev` (Port 3000)
   - Backend: `npm run server` (Port 5000)
   - Proxy: Vite proxies `/api/*` requests directly to `http://localhost:5000`.
5. **DO NOT TOUCH `.env.local` SECRETS.** Supabase credentials and API keys are already configured.
6. **PRESERVE TYPES FIRST.** All data interfaces are defined in `src/types/index.ts`. Check types before modifying context or components.
7. **NO DIRECT FETCH TO EXTERNAL SERVICES FROM COMPONENTS (EXCEPT STORAGE & NOMINATIM).** Heavy logic (AI, RAG, document parsing, OCR) belongs in `server/index.ts`.
8. **SESSION PERSISTENCE IS WORKING.** Do NOT add `clearStoredSession()` back to `HomeBrainContext.tsx`.
9. **VERIFY CHANGES WITH TEST COMMANDS:** Run `npx tsc --noEmit` and `node scripts/test-suite.js` after modifications.
10. **LEGACY FILE NOTICE:** `src/data/initialData.ts` is dead/legacy code. Do NOT import it; ignore it.

---

## 📂 2. INITIAL CONTEXT LOAD (READ THESE FIRST)

Load these files into your context window in this exact sequence:

1. [`src/types/index.ts`](file:///e:/2Autonomous%20Multimodal%20Cognitive%20Ecosystem/Autonomous%20Multimodal%20Cognitive%20Ecosystem%20for/src/types/index.ts) — The contract for all 18 entities (`User`, `FamilyMember`, `FamilyEvent`, `ReminderItem`, `DocumentItem`, `GroceryItem`, `MedicineItem`, `ExpenseItem`, `BillItem`, `FamilyKnowledge`, `FamilyMemory`, `EmergencySession`).
2. [`server/index.ts`](file:///e:/2Autonomous%20Multimodal%20Cognitive%20Ecosystem/Autonomous%20Multimodal%20Cognitive%20Ecosystem%20for/server/index.ts) — Express backend with `authenticateUser` middleware, `/api/ai/query` RAG engine, `/api/documents/extract` OCR, and `/api/timeline/search`.
3. [`src/context/HomeBrainContext.tsx`](file:///e:/2Autonomous%20Multimodal%20Cognitive%20Ecosystem/Autonomous%20Multimodal%20Cognitive%20Ecosystem%20for/src/context/HomeBrainContext.tsx) — Main state machine and Supabase CRUD dispatchers.
4. [`src/lib/supabase.ts`](file:///e:/2Autonomous%20Multimodal%20Cognitive%20Ecosystem/Autonomous%20Multimodal%20Cognitive%20Ecosystem%20for/src/lib/supabase.ts) — Low-level REST API client, bearer token session management, and presigned file URL generators.
5. [`src/App.tsx`](file:///e:/2Autonomous%20Multimodal%20Cognitive%20Ecosystem/Autonomous%20Multimodal%20Cognitive%20Ecosystem%20for/src/App.tsx) — Sub-screen routing matrix and URL hash sync.

---

## 🚀 3. HOW TO RUN THE PROJECT IN VS CODE

### Terminal 1: Start Backend Express Server
```bash
npm run server
# Expected output:
# 🧠 HomeBrain Secure AI Backend running on http://localhost:5000
```

### Terminal 2: Start Frontend Vite Server
```bash
npm run dev
# Expected output:
# ➜  Local:   http://localhost:3000/
```

### Terminal 3: Run Validation & Tests
```bash
# Typecheck (Must pass with 0 errors)
npx tsc --noEmit

# API Integration & Security Test Suite
node scripts/test-suite.js
```

---

## 🧠 4. WORKING WITH OLLAMA / LOCAL LLMS

The backend in `server/index.ts` is configured with Google Gemini as primary, OpenAI as secondary, and a structured database RAG fallback.

To connect **Ollama** for 100% offline local intelligence:
1. Ensure Ollama is running locally: `ollama run llama3.2` (or `mistral`, `qwen2.5-coder`).
2. In `server/index.ts`, add an Ollama fetch call inside the `/api/ai/query` handler:
   ```typescript
   const ollamaRes = await fetch('http://localhost:11434/api/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       model: 'llama3.2',
       prompt: `${systemPrompt}\n\nUser Question: ${query}`,
       stream: false
     })
   });
   const data = await ollamaRes.json();
   reply = data.response;
   ```
3. Set `LLM_PROVIDER=ollama` in `.env.local`.

---

## 🎯 5. THE NEXT 5 TASKS TO IMPLEMENT

When continuing development, tackle these prioritized tasks in order:

### Task 1: Real SMS/Call Dispatch for SOS
- **File to modify:** `server/index.ts` and `src/components/modules/EmergencyModeModal.tsx`
- **Goal:** Connect `/api/emergency/broadcast` to Twilio / Fast2SMS API so emergency contacts receive real phone calls or SMS messages with GPS coordinates when SOS is triggered.

### Task 2: Persistent Chat History
- **File to modify:** `src/context/HomeBrainContext.tsx` and `server/index.ts`
- **Goal:** Read and write messages to the existing `chat_messages` table in Supabase so conversation history is preserved between browser sessions.

### Task 3: Context Decomposition
- **File to modify:** `src/context/HomeBrainContext.tsx`
- **Goal:** Split the 1050-line context into smaller hooks/providers (`AuthContext`, `FamilyDataContext`, `AIContext`) to optimize React rendering performance.

### Task 4: Interactive 30-Day Month Grid
- **File to modify:** `src/components/modules/CalendarModule.tsx`
- **Goal:** Render a standard 7x5 interactive calendar grid when viewing `#calendar`, using the already declared `currentMonth` state.

### Task 5: In-App Document Viewer
- **File to modify:** `src/components/modules/DocumentVaultModule.tsx`
- **Goal:** Embed an inline PDF and image viewer inside `DocumentDetailsModal` so users can inspect records without opening new browser tabs.

---

## 🛡️ 6. DATABASE REFERENCE CHEAT SHEET

- **19 Tables:** `families`, `profiles`, `family_members`, `events`, `reminders`, `documents`, `groceries`, `grocery_history`, `medicines`, `medicine_logs`, `expenses`, `bills`, `family_knowledge`, `knowledge_files`, `emergency_contacts`, `emergency_logs`, `emergency_sessions`, `emergency_notifications`, `family_memories`, `chat_messages`.
- **Row-Level Security:** Enforced by PostgreSQL function `current_family_id()`. Every query must include `Authorization: Bearer <token>` to pass RLS filters.
- **File Storage:** Private bucket `documents`. Path convention: `${familyId}/${folder}/${uuid}-${filename}`. Use `createPrivateFileUrl('documents', path)` to generate signed download URLs.

