# Web Routes — Navigation Contract

## Route Table

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| `/login` | `pages/login.tsx` | No | Supabase OAuth (Google) sign-in. No app chrome. |
| `/` | `pages/dashboard.tsx` | Yes | KPIs derived from campaign status counts. |
| `/campaign/new` | `pages/create-campaign.tsx` | Yes | Form → AI analysis → navigates to `/campaign/:id/plan`. |
| `/campaign/:id/plan` | `pages/ai-plan.tsx` | Yes | Displays urgency, topic, deadline, target audience, channels. |
| `/campaign/:id/preview` | `pages/content-preview.tsx` | Yes | Per-channel content tabs (Teams/Outlook/Push). |
| `/campaign/:id/approve` | `pages/approval.tsx` | Yes | Summary grid, approval checkbox → sends. |
| `/campaign/:id/monitor` | `pages/monitoring.tsx` | Yes | Live delivery stats, recipient table, ack rate. |
| `/history` | `pages/campaign-history.tsx` | Yes | Campaign list with stats, search, filters. |
| `/history/:id` | `pages/campaign-detail.tsx` | Yes | Single campaign detail with recipient stats. |

## Wizard Flow

The campaign creation wizard follows a linear path through four screens, all sharing the same `campaign/:id` URL prefix:

```
/campaign/new  →  /campaign/:id/plan  →  /campaign/:id/preview  →  /campaign/:id/approve  →  /campaign/:id/monitor
   (form)            (AI plan)            (content preview)          (review & approve)         (live monitoring)
```

- The campaign ID is created by `POST /campaigns/analyze` and flows through URL params — no lifted state.
- Each page is self-contained: fetches the campaign by ID on mount.
- The wizard is not stateful — navigating backward is safe (each page re-fetches).

## Auth & Authorization

All routes under `<AppShell />` enforce two checks:

1. **Authentication** — `useUser()` reads the Supabase session. If no session exists, the user is redirected to `/login`.
2. **Authorization** — After the session loads, the user's role is fetched from the `profiles` table. Only `admin` and `sender` roles are permitted on the web portal. Employees are signed out and redirected to `/login?error=unauthorized`, which displays an access-denied message.

The `AppShell` renders `null` while the role is loading to prevent a flash of unauthorized content.
