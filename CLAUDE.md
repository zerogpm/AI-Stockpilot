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
- When fixing bugs, write a regression test covering the fix
- When adding new logic, write unit tests covering the new behavior
- Backend: Vitest (utils + route helpers)
- Frontend: Vitest + jsdom (hooks, cache logic)

## Debugging Guidelines
- When fixing a bug, identify the root cause before implementing a fix. Do not apply surface-level patches (e.g., capping values, string parsing) without understanding why the data is wrong upstream
- When the user reports an issue, check ALL layers (frontend UI, backend API, prompt logic, data pipeline) before declaring the fix complete

## General Behaviour
- When asked to fix or change something, focus on the specific scope requested
- Do NOT modify unrelated code, run builds, or generate artifacts (e.g., dist/) during verification unless explicitly asked

## Communication Style
- When the user asks a simple question, give a concise answer first. Do NOT extensively explore the codebase or enter plan mode unless the question requires it
- Ask before deep-diving

## Documentation
- Project uses JavaScript, TypeScript, and YAML primarily; docs are Markdown-based
- When updating README.md or CLAUDE.md, deduplicate content and keep instructions beginner-friendly with step-by-step setup flows

## Conventions
- ES modules (import/export, not require)
- Async/await only, no .then() chains
- All Claude API calls stream responses

## Frontend Design Guidelines

### Theme
- Dark/light via `.dark` class on root; components use `isDark` prop or `theme === 'dark'`
- Color tokens in `frontend/src/index.css` (OKLch format)
- For inline theme-aware colors (charts, canvas), use ternary: `isDark ? '#334155' : '#e2e8f0'`

### Colors (semantic)
- Positive values (gains, buy): `text-green-500`
- Negative values (losses, sell): `text-red-500`
- Warning/neutral: `text-yellow-600`
- Muted/secondary text: `text-muted-foreground`
- Primary accent: violet (`bg-violet-600`, `ring-violet-500`)

### Buttons
- Use `<Button>` from `@/components/ui/button` with variants: `default`, `outline`, `ghost`, `destructive`
- Sizes: `xs`, `sm` (default for controls), `default`, `lg`, `icon`
- Destructive actions (clear, delete): use visible border + `text-red-400/500` + `font-semibold`, size `sm` or larger — never tiny/subtle
- Custom inline buttons (date ranges, mode toggles): `rounded-full text-xs font-medium`, violet-600 when active

### Typography
- Page heading: `text-4xl font-bold`
- Section heading: `text-lg font-bold`
- Stat label: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Stat value: `text-lg font-bold` with semantic color
- Body: `text-sm` or `text-base`

### Spacing
- Card padding: `px-3 py-2` (stat cards), `p-4` (sections)
- Grid gaps: `gap-3` (metrics), `gap-4` (sections)
- Section margins: `mb-5` or `mb-6`
- Grids: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (responsive)

### Component patterns
- Stat cards: `rounded-lg border border-border bg-card px-3 py-2` with label above value
- Semantic card backgrounds: `border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20` (also red, yellow, violet variants)
- Form inputs: inline with label, `w-28 px-2 py-1 rounded border text-sm font-medium`
- Checkboxes: `accent-emerald-500`
- Transitions: `transition-all duration-150` or `transition-colors`
- Focus: `focus-visible:ring-2 focus-visible:ring-violet-500`

### Key files
- Color tokens: `frontend/src/index.css`
- Base components: `frontend/src/components/ui/` (button, card, input, badge, alert)
- Design reference components: `MetricsGrid.jsx`, `ClaudeAnalysis.jsx`, `BacktestResults.jsx`

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
