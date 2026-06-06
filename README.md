# Reachout

A smart networking follow-up app that uses AI to draft personalised LinkedIn and email messages for every person you meet.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js / Express
- **Database**: SQLite (via better-sqlite3)
- **AI**: Anthropic Claude API

## Prerequisites

- Node.js 18+
- Windows: Visual C++ Build Tools (required for `better-sqlite3`)
  - Install via: `npm install -g windows-build-tools` or install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

## Setup

### 1. Clone / extract the project

```
cd reachout
```

### 2. Add your Anthropic API key

Copy `.env.example` to `.env` and fill in your key:

```
cp .env.example .env
```

Edit `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-5
PORT=3001
```

Get your API key from [console.anthropic.com](https://console.anthropic.com).

### 3. Install server dependencies

```bash
cd server
npm install
cd ..
```

### 4. Install client dependencies

```bash
cd client
npm install
cd ..
```

## Running Locally

You need two terminal windows:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
Server starts on http://localhost:3001

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
App opens on http://localhost:5173

## Building for Production

```bash
# Build the frontend
cd client
npm run build

# The built files are in client/dist/
# Serve them from your backend or a static host
```

To serve the built frontend from Express, add this to `server/index.js`:

```js
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

## Features

- **Add contacts** from events, conferences and meetings
- **AI-generated messages** — LinkedIn connection request, LinkedIn DM, and email — all personalised from your conversation notes
- **Urgency tracking** — red indicators for contacts not followed up within 7 days
- **Event management** — group contacts by event with follow-up stats
- **Analytics** — follow-up rate, reply rate, average response time
- **Email reminders** — daily or weekly digest of contacts needing follow-up (requires SMTP config)

## Folder Structure

```
reachout/
├── client/          React frontend (Vite + Tailwind)
│   └── src/
│       ├── api/     API client
│       ├── components/
│       └── pages/
├── server/          Express backend
│   └── routes/      API route handlers
├── database/        SQLite database file (auto-created)
├── .env             API keys (create from .env.example)
└── README.md
```
