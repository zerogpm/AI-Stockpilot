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

## Adding Stock Analysis Profiles

Stock-specific analysis rules live in `backend/data/stockProfiles.json`. Profiles override default valuation assumptions (P/E baseline, debt interpretation, scenario bounds) and inject industry context into the Claude analysis prompt.

When a profile is requested, first check if the ticker or industry already exists in `backend/data/stockProfiles.json`. If it exists, update the existing entry with the new information (merge/replace `additionalContext` and other fields). Only create a new entry if the ticker/industry does not exist yet.

To add or update a profile, provide:

```
Add a stock profile for [TICKER] ([COMPANY NAME]).

Industry: [existing industry from stockProfiles.json, or "create new: [Name]"]
Fair P/E range: [low]-[high]

What's different about this stock:
1. Valuation: [why standard P/E comparison is wrong]
2. Debt: [why D/E ratio should be interpreted differently, if applicable]
3. Key metrics: [what metrics matter more than standard EPS/P/E]
4. Context: [major programs, business model, cyclicality, or other specifics]

Optional data overrides (when Yahoo Finance data is inaccurate):
- Forward EPS guidance: [range, e.g., $29.35-$30.25] (source: [e.g., "FY2026 company guidance"])
- Valuation note: [e.g., "Trailing EPS is temporarily depressed, weight forward guidance"]
```

Existing industry profiles: Aerospace & Defense, Semiconductors, Oil & Gas Integrated, Drug Manufacturers - General, Utilities - Regulated Electric, Telecom Services, Insurance - Diversified, Tobacco.

API endpoints for managing profiles:
- `GET /api/profiles` — list all
- `PUT /api/profiles/industry/:key` — create/update industry
- `PUT /api/profiles/ticker/:symbol` — create/update ticker
- `DELETE /api/profiles/industry/:key` or `/ticker/:symbol` — remove
