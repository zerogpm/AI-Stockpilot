# Stock Analysis Dashboard

A stock analysis dashboard with real-time data, FastGraphs-style valuation charts, and AI-powered analysis using Claude.

## What it does

- Search any stock by ticker symbol (AAPL, MSFT, TSLA, etc.)
- View current price, market cap, and key financial metrics
- FastGraphs-style valuation chart with historical P/E fair value lines
- Recent news articles for the stock
- AI-powered analysis with buy/sell verdict, risk flags, catalysts, and price targets

## Prerequisites

Before you start, make sure you have these installed:

1. **Node.js** (version 18 or higher) — [Download here](https://nodejs.org/)
2. **npm** — comes bundled with Node.js
3. **Anthropic API key** — needed for the AI analysis feature. Get one at [console.anthropic.com](https://console.anthropic.com/)

To check if Node.js is installed, open a terminal and run:

```bash
node --version
```

You should see something like `v18.x.x` or higher.

## Setup (step by step)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd stocks
```

### 2. Create your environment file

Create a file called `.env` in the project root (the `stocks` folder):

```bash
ANTHROPIC_API_KEY=your-api-key-here
```

Replace `your-api-key-here` with your actual Anthropic API key. This file is gitignored and will not be committed.

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. Start the app

Go back to the project root and run:

```bash
cd ..
./start.sh
```

This starts both the backend (port 3001) and frontend (port 5173).

**Windows users:** Run this in Git Bash (comes with [Git for Windows](https://git-scm.com/downloads)), not Command Prompt or PowerShell.

### 6. Open in your browser

Go to [http://localhost:5173](http://localhost:5173)

## How to use

1. Type a stock ticker in the search bar (e.g. `AAPL`, `MSFT`, `GOOGL`, `TSLA`)
2. Click **Search**
3. You'll see:
   - Stock price and daily change
   - Valuation chart with fair value lines
   - Key financial metrics (P/E, EPS, dividend yield, etc.)
   - Recent news articles (click to read full article)
4. Click **Analyze Stock** to get an AI-powered analysis from Claude
   - A loading spinner will show while Claude is thinking
   - When done, you'll see a verdict (Undervalued/Overvalued/Fair Value), risk flags, catalysts, and a 12-month price target

## How to stop

```bash
./stop.sh
```

## Running manually (without start.sh)

If you prefer to run each server separately, open two terminals:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

## Project structure

```
stocks/
  backend/           Express API server (port 3001)
    routes/          API endpoints (stock, news, analyze)
    services/        Yahoo Finance data fetching
    utils/           Fair value calculation logic
    server.js        Entry point
  frontend/          React app (port 5173)
    src/
      components/    UI components
      hooks/         Custom React hooks
      api/           API client functions
  .env               Your API key (not committed)
  start.sh           Start both servers
  stop.sh            Stop both servers
```

## Troubleshooting

**"fetch failed" or 502 errors when searching a stock**
- Make sure the backend is running on port 3001
- Try restarting: `./stop.sh && ./start.sh`

**AI analysis not working**
- Check that your `.env` file exists and has a valid `ANTHROPIC_API_KEY`
- The key should start with `sk-ant-`

**Styles look broken / no dark theme**
- Hard refresh your browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

**start.sh won't run on Windows**
- Use Git Bash, not Command Prompt or PowerShell
