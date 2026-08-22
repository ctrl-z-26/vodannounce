# API Routes — Backend Reference

All endpoints are mounted under the `/api` prefix (e.g. `http://localhost:3000/api`).

## Authentication

Every endpoint (except root `GET /`) requires a valid Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

The `requireAuth` middleware validates the token and sets `res.locals.userId`.

### Role-based access

Some endpoints additionally require `requireRole('admin', 'sender')`, which queries the `profiles` table and returns `403` if the user's role is not in the allow-list. The role is stored in `res.locals.userRole`.

## Error format

All errors return a JSON body:

```json
{ "error": "Human-readable message" }
```

Validation errors may include a `details` field with the Zod tree.

---

## Campaign Endpoints

Base path: `/api/campaigns`

### `GET /api/campaigns`

List all campaigns ordered by creation date (newest first).

- **Auth:** `requireAuth` + `requireRole('admin', 'sender')`
- **Response:** `200` — `Campaign[]`

### `GET /api/campaigns/:id`

Get a single campaign by UUID.

- **Auth:** `requireAuth` + `requireRole('admin', 'sender')`
- **Params:** `id` — UUID (validated via Zod)
- **Response:** `200` — `Campaign`
- **Errors:** `400` invalid id, `404` not found

### `GET /api/campaigns/:id/recipients`

Get all recipient records for a campaign.

- **Auth:** `requireAuth` + `requireRole('admin', 'sender')`
- **Params:** `id` — UUID (validated via Zod)
- **Response:** `200` — `CampaignRecipient[]`
- **Errors:** `400` invalid id

### `POST /api/campaigns/analyze`

Run AI analysis on a raw announcement draft and persist a new campaign.

- **Auth:** `requireAuth` + `requireRole('admin', 'sender')`
- **Body:**
  ```json
  {
    "prompt": "string (min 1 char)",
    "scheduledAt": "ISO-8601 datetime string"
  }
  ```
- **Response:** `201` — `Campaign`
- **Errors:** `400` invalid body, `500` analysis or DB failure

---

## FCM Endpoints

Base path: `/api/fcm`

### `POST /api/fcm/register`

Register or update a device token for push notifications.

- **Auth:** `requireAuth` (any role)
- **Body:** `{ token: string, platform: "ios" | "android" }`
- **Response:** `200`

### `POST /api/fcm/test`

Send a test push notification to the authenticated user's registered devices.

- **Auth:** `requireAuth` (any role)
- **Response:** `200`

---

## Types

All request/response shapes mirror the shared TypeScript types in `@vodannounce/shared` (`shared/types/campaign.ts`). See `docs/SHARED_MODULE.md` for import conventions.
