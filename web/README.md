# @vodannounce/web

Admin portal for Communication Managers to draft, preview, and monitor campaigns.

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS 4 + Shadcn UI (Radix primitives)
- react-router 7 (route-based navigation)
- Supabase Auth (Google OAuth)

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (default: `http://localhost:5173`) |
| `npm run build` | Production build to `dist/` |

## Project Structure

```
/web/src/
├── api/api.ts              # Axios client + API functions (uses @shared)
├── lib/supabase.ts         # Supabase client init
└── app/
    ├── App.tsx             # Route definitions (react-router)
    ├── router/             # Auth guard shell (AppShell)
    ├── pages/              # Screen components (one per route)
    ├── components/         # Shared UI (badges, layout, icon)
    └── lib/                # Hooks, formatters, brand tokens
```

## Route Table

See `docs/WEB_ROUTES.md` for the full route table, wizard flow, and backend endpoint contract.

## Import Conventions

```ts
// Shared types and client
import type { Campaign } from '@shared/types/campaign';
import { createApiClient } from '@shared/api/client';

// React Router (v7 — merged from react-router-dom)
import { Route, Routes, useNavigate, useParams } from 'react-router';

// Lucide icons
import { Home, Plus } from 'lucide-react';
```

## TypeScript

- `verbatimModuleSyntax` is enabled — all type-only imports must use `import type`.
- `noUnusedLocals` and `noUnusedParameters` are enforced.
- The Vite esbuild does transpile-only (no type-checking during build). Run `tsc --noEmit` separately for type verification.
