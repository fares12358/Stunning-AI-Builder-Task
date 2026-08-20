# Stunning AI Builder

A small AI-powered application builder. A user describes what they want to build, optionally selects a set of dummy integrations (Stripe, Shopify, Gmail, Slack, Google Sheets), and gets back an AI-generated architecture/implementation plan that genuinely takes those integrations into account — not just a text prompt echoed back with extra words appended.

Built as a candidate task for the Full-Stack Vibe Coder / Builder Mindset role at Stunning.

---

## Features

- **Landing page** with a chat-style prompt composer (character counter, focus states, submit disabled while empty/loading) and an integration picker (multi-select, dropdown popover).
- **AI-generated build plans** via OpenRouter — the model is instructed to act as an AI application architect/builder assistant, analyze the request, and produce a structured implementation plan (Project Overview, Architecture, Integrations, Main Features, Data Model, Frontend Structure, Backend Structure, Implementation Notes) scaled to the size of the request. Selected integrations are injected only into the system prompt — the conversation transcript shows the user's raw prompt, unmodified.
- **Integrations genuinely affect the output.** Each selected integration is injected into the system prompt with real semantic context (what it is, how it should shape the architecture, backend responsibilities, data flow, security considerations) — the model designs around them, it doesn't just mention their names.
- **Multi-turn conversations.** After the first response, you can send follow-up prompts in the same conversation; the full message history is sent back to the model for context, and MongoDB persists the conversation (not just the first exchange).
- **Sidebar with conversation history** — recent conversations, click to reopen (restores on page refresh too), delete with a confirmation dialog. Collapsible ChatGPT/Claude-style: open by default on desktop (width-collapses in place, content reflows smoothly), closed by default on small screens (off-canvas drawer with a backdrop) — the reopen toggle lives in the page header rather than floating over content.
- **Dark/light theme**, token-based (no hardcoded colors), smooth transitions, persisted per browser.
- **Non-fatal persistence** — if MongoDB is unreachable, the AI response still comes back; the conversation just won't be saved.

## Tech stack

**Frontend** — React 19 (with React Compiler), Vite 8, JavaScript, Tailwind CSS v4, Axios, Framer Motion, react-icons.

**Backend** — Node.js (ES Modules), Express 5, MongoDB + Mongoose 9.

**AI gateway** — [OpenRouter](https://openrouter.ai), model configurable via env var (never hardcoded).

## Architecture

```
Frontend (React)
  → src/api/chat.api.js
  → Axios client (src/api/client.js)
  → POST /api/chat  (new conversation)  or  POST /api/chats/:id/messages  (follow-up)
  → chat.routes.js
  → chat.validation.js        (prompt + integrations validated server-side)
  → chat.controller.js
  → chat.service.js
      → buildSystemPrompt(integrations)   ← per-integration semantic knowledge injected here
      → OpenRouter API
      → MongoDB (Chat document — non-fatal on failure)
  → { chatId, title, integrations, messages, createdAt, updatedAt }
  → Workspace / conversation view
```

Backend follows a modular-monolith layout — one Express app, feature modules under `src/modules/*` (`chat`, `health`), each with its own routes/controller/service/validation, plus shared `config/`, `middleware/`, and `utils/`.

## Project structure

```
Stunning/
├── backend/
│   └── src/
│       ├── config/          env.js, db.js
│       ├── middleware/      error + 404 handling
│       ├── modules/
│       │   ├── chat/        routes, controller, service, validation, model, integration-knowledge
│       │   └── health/      routes, controller
│       ├── utils/           ApiError
│       ├── app.js
│       └── server.js
├── frontend/
│   └── src/
│       ├── api/              client.js (Axios), chat.api.js
│       ├── components/       LandingPage, IntegrationSelector, Workspace, ResponsePanel,
│       │                     Sidebar, ConfirmDialog
│       ├── constants/        integrations.js (single source of truth for names/icons)
│       ├── hooks/             useTheme.js
│       ├── App.jsx, main.jsx, index.css
└── package.json               root scripts (runs both apps together)
```

## Installation

Requires Node.js and npm, and access to a MongoDB instance (Atlas or local) and an OpenRouter API key.

```bash
git clone <this-repo>
cd Stunning

npm install               # root (installs `concurrently`)
cd backend && npm install
cd ../frontend && npm install
```

## Environment variables

Copy the example files and fill in real values — **never commit real secrets**.

**`backend/.env`** (see `backend/.env.example`):

```env
PORT=5000
MONGO_URI=your-mongodb-connection-string
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=your-chosen-openrouter-model
CLIENT_URL=http://localhost:5173
```

**`frontend/.env`** (see `frontend/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

`OPENROUTER_API_KEY` and `MONGO_URI` must never be exposed to the frontend — only `VITE_`-prefixed variables are readable by the Vite build, and the frontend never talks to OpenRouter or MongoDB directly.

## Local development

From the repository root:

```bash
npm run dev
```

This runs the backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) together via `concurrently`. Individually:

```bash
npm run dev:backend
npm run dev:frontend
```

Confirm the backend is up: `GET http://localhost:5000/api/health` → `{ "success": true, "status": "ok", "timestamp": "..." }`.

## Docker

```bash
docker compose up --build
```

Starts three services: `mongodb` (with a named volume for persistence), `backend` (`http://localhost:5000`), and `frontend` (nginx, `http://localhost:5173`) — same ports as local dev, so both ways of running the app are interchangeable.

- The backend container reuses `backend/.env` for its secrets (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`) via `env_file` — only `MONGO_URI` is overridden in `docker-compose.yml` to point at the containerized Mongo instead of Atlas.
- The frontend's `VITE_API_URL` is baked in at build time (Vite requirement) via a Docker build arg, defaulting to `http://localhost:5000/api`.

Local development does not require Docker; `npm run dev` (above) works independently of it.

## API overview

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | Start a new conversation: `{ prompt, integrations }` → AI response, saved as a new chat |
| `POST` | `/api/chats/:id/messages` | Send a follow-up in an existing conversation: `{ prompt }` |
| `GET` | `/api/chats` | List recent conversations (title, integrations, timestamps — no message bodies) |
| `GET` | `/api/chats/:id` | Get a single conversation with its full message history |
| `DELETE` | `/api/chats/:id` | Delete a conversation |

**`POST /api/chat` request:**

```json
{
  "prompt": "Build a customer support ticketing dashboard for a small team",
  "integrations": ["Slack", "Google Sheets"]
}
```

**Response shape (all chat endpoints):**

```json
{
  "success": true,
  "data": {
    "chatId": "...",
    "title": "Build a customer support ticketing dashboard for a small tea",
    "integrations": ["Slack", "Google Sheets"],
    "messages": [
      { "role": "user", "content": "...", "createdAt": "..." },
      { "role": "assistant", "content": "...", "createdAt": "..." }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Validation errors return `400` with a specific message (e.g. `"prompt must not be empty"`, `"\"PayPal\" is not a supported integration..."`); AI provider failures return `502`; unknown routes return `404`. Integrations are validated server-side against a fixed whitelist — the frontend selector is never trusted.

Supported integrations: `Stripe`, `Shopify`, `Gmail`, `Slack`, `Google Sheets` — these are dummy/context-only and never connect to a real external service.

## Production notes

See `DECISIONS.md` for the full production-readiness writeup, including the biggest known risk (no rate limiting on `POST /api/chat`, combined with a free-tier OpenRouter model with a daily request cap) and what was intentionally left out of this build. See `TECH.md` for a write-up on Mongoose 9's middleware changes, discovered and fixed during development of this project.
