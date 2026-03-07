# Stock Analysis Dashboard

## Stack
- Frontend: React + Vite (port 5173)
- Backend: Node.js + Express (port 3001)
- Data: yahoo-finance2
- AI: Claude API (claude-sonnet-4-20250514)

## Commands
- `cd backend && npm run dev` — start backend
- `cd frontend && npm run dev` — start frontend
- `cd backend && npm test` — run backend tests
- `cd frontend && npm test` — run frontend tests

## Testing
- Always run relevant tests before marking work as done
- Backend: Vitest (utils + route helpers)
- Frontend: Vitest + jsdom (hooks, cache logic)

## General Behaviour
- When asked to fix or change something, focus on the specific scope requested
- Do NOT modify unrelated code, run builds, or generate artifacts (e.g., dist/) during verification unless explicitly asked

## Documentation
- Project uses JavaScript, TypeScript, and YAML primarily; docs are Markdown-based
- When updating README.md or CLAUDE.md, deduplicate content and keep instructions beginner-friendly with step-by-step setup flows

## Conventions
- ES modules (import/export, not require)
- Async/await only, no .then() chains
- All Claude API calls stream responses
