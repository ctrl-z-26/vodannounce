# @vodannounce/backend

Express API server for the Vodannounce platform. Handles campaign AI analysis, CRUD, and push notification delivery.

## Tech Stack

- Node.js + Express 5 + TypeScript
- Supabase (PostgreSQL) via `@supabase/supabase-js`
- Google Gemini (`@google/genai`) for AI campaign analysis
- Firebase Admin SDK for push notifications (FCM)
- Zod for request validation
- Vitest for testing

## Getting Started

```bash
cp .env.example .env   # fill in your keys
npm install
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with tsx (default: `http://localhost:3000`) |
| `npm run dev:watch` | Dev server with file watching |
| `npm run build` | TypeScript compilation to `dist/` |
| `npm start` | Run compiled JS from `dist/` |
| `npm test` | Run tests with Vitest |

## Project Structure

```
/backend/src/
├── index.ts                      # Express app entry point
├── shared/
│   ├── config/env.ts             # Zod-validated env vars
│   ├── middleware/auth.middleware.ts  # requireAuth + requireRole
│   └── supabase/
│       ├── supabase.ts           # Service-role Supabase client
│       └── database.types.ts     # Generated DB schema types
└── modules/
    ├── campaigns/                # Campaign CRUD + AI analysis
    │   ├── campaigns.routes.ts
    │   ├── campaigns.controller.ts
    │   ├── campaigns.service.ts
    │   └── campaigns.utils.ts
    ├── fcm/                      # Firebase push notification delivery
    │   ├── fcm.routes.ts
    │   ├── fcm.controller.ts
    │   └── fcm.service.ts
    └── llm/                      # Gemini AI integration
        └── ...
```

## API Endpoints

See `docs/API_ROUTES.md` for the full endpoint reference.
