# Stock Analysis Dashboard

## Stack
- Frontend: React + Vite (port 5173)
- Backend: Node.js + Express (port 3001)
- Data: yahoo-finance2
- AI: Claude API (claude-sonnet-4-20250514)

## Commands
- `cd backend && npm run dev` — start backend
- `cd frontend && npm run dev` — start frontend

## Conventions
- ES modules (import/export, not require)
- Async/await only, no .then() chains
- All Claude API calls stream responses
