# HOMEBRAIN — AI DEVELOPMENT RULES

## 1. Project Preservation
- HomeBrain is an existing, partially completed project.
- NEVER rebuild it from scratch.
- NEVER redesign the existing UI unnecessarily.
- Preserve all working features and existing architecture.
- Inspect existing implementations before changing anything.
- Never replace real functionality with mock data.

## 2. Development Workflow
- Understand the existing code before proposing changes.
- Identify the exact files affected.
- Explain the problem and proposed solution.
- Make small, controlled changes.
- Avoid unnecessary file creation, deletion and refactoring.
- Maintain backward compatibility.
- Ask permission before destructive or high-impact changes.

## 3. Security
- Never expose API keys, passwords, tokens or environment variables.
- Never overwrite `.env.local`.
- Never modify database schemas or migrations without approval.
- Preserve Supabase Row-Level Security policies.
- Maintain family-level data isolation.
- Never execute destructive database commands without approval.

## 4. Existing Technology Stack
- Frontend: React 18, TypeScript, Tailwind CSS.
- Backend: Express, TypeScript.
- Database: Supabase PostgreSQL.
- AI: Existing Gemini/OpenAI integrations and family-data RAG.
- Local AI: Ollama.

Verify all architecture details against the actual source code.

## 5. AI Integration
- Preserve existing Gemini and OpenAI integrations.
- Add Ollama without breaking existing providers.
- Preserve existing RAG and family-data retrieval.
- Do not remove existing document processing or OCR functionality unnecessarily.

## 6. Git Protection
- Inspect Git status before making changes.
- Preserve all existing uncommitted changes.
- Never force-push.
- Never discard user changes.
- Use a separate development branch for new work.
- Review changes before committing.

## 7. Testing
- Run relevant tests after significant changes.
- Check TypeScript compilation.
- Check frontend and backend compatibility.
- Report test failures honestly.
- Never claim a feature works without verification.

## 8. Final Reporting
After each task, report:
1. What was changed.
2. Which files were modified.
3. Why the changes were necessary.
4. Tests performed and their results.
5. Remaining issues.

## 9. Absolute Rule
HomeBrain must continue from its existing implementation. Preservation, security, compatibility and controlled development take priority over speed.