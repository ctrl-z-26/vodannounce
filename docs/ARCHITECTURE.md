# Architecture

## Monorepo Layout

```
vodannounce/
├── shared/           # @vodannounce/shared — types + API client (consumed by web & backend)
├── web/              # @vodannounce/web — React admin portal (Vite + Shadcn)
├── mobile/           # @vodannounce/mobile — Ionic/Capacitor employee app
├── backend/          # @vodannounce/backend — Express API server
└── docs/             # Project-level documentation
```

Code sharing is strictly limited to **business logic and TypeScript types**. UI components are never shared between web and mobile.

### Shared package (`@vodannounce/shared`)

| Path | Exports | Why shared |
|------|---------|------------|
| `types/campaign.ts` | `Campaign`, `CampaignRecipient`, `ProfileRole`, enums | Single source of truth for the API contract between backend and frontend. |
| `api/client.ts` | `createApiClient(config)` | Avoids duplicating axios setup, token injection, and 401 handling in every consumer. |

**What does NOT live here:**
- **Auth logic** — each consumer owns its own auth flow (Supabase session, token retrieval, sign-out). The shared client is auth-agnostic — it receives a `getToken` callback.
- **UI components** — web and mobile have separate component libraries.
- **Backend database types** — these live at `backend/src/shared/supabase/database.types.ts`.

Consumers import via `@shared/*` aliases (Vite alias for web, tsconfig paths for backend):

```ts
import { createApiClient } from '@shared/api/client';
import type { Campaign } from '@shared/types/campaign';
```

## Backend — Modular Monolith

The Express backend uses a **feature-based (package-by-feature)** architecture. There are no global `/controllers` or `/routes` folders.

```
backend/src/
├── index.ts                      # Express app, mounts module routes
├── shared/                       # Cross-cutting concerns
│   ├── config/env.ts             # Zod-validated environment variables
│   ├── middleware/auth.middleware.ts  # requireAuth + requireRole
│   └── supabase/
│       ├── supabase.ts           # Service-role Supabase client (bypasses RLS)
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

Each module is self-contained with its own routes, controller, service, and tests. This prevents merge conflicts across the team — changes in `campaigns/` never touch `fcm/`.

## Authentication Flow

Authentication uses a **direct client auth** pattern (no auth proxy through the backend):

1. Web/mobile clients authenticate directly with Supabase via Google OAuth.
2. Supabase returns a JWT Access Token to the client.
3. The client attaches this token as a `Bearer` header in requests to the Express backend.
4. The `requireAuth` middleware validates the JWT using the service-role key and sets `res.locals.userId`.
5. The `requireRole(...roles)` middleware (optional) queries the `profiles` table and returns 403 if the role is not permitted.

```
┌─────────┐    OAuth    ┌───────────┐    JWT     ┌─────────┐
│  Web /   │ ──────────→ │  Supabase │ ─────────→ │ Backend │
│  Mobile  │             │   Auth    │            │  API    │
└─────────┘ ←────────── └───────────┘            └─────────┘
   client                  issues JWT             validates JWT
```

## Role Model

Roles are stored in the `profiles` table (`profile_role` enum):

| Role | Web Portal | Mobile App | Backend |
|------|-----------|------------|---------|
| `admin` | Full access | — | All endpoints |
| `sender` | Full access | — | Campaign endpoints |
| `employee` | Blocked | Full access | FCM endpoints |

The web portal enforces `admin`/`sender` at both the client level (AppShell role guard) and server level (`requireRole` middleware on campaign routes).

## Database

Supabase (PostgreSQL) with Row Level Security. The backend uses a **service-role** client that bypasses RLS — all access control is handled explicitly in middleware and controller logic.

Table definitions are generated into `backend/src/shared/supabase/database.types.ts` and used as the single source of truth for typed queries.
