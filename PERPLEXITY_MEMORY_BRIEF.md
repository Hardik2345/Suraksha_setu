# Suraksha Setu — Project Memory Brief (for Perplexity)

Date: 10 Mar 2026

## 1) One‑line summary
Suraksha Setu is a disaster management platform with a citizen app for SOS reporting/resources/alerts and an admin console for SOS triage, resource CRUD, and alert broadcasting.

## 2) Current architecture (what exists today)
- Frontend: React + TypeScript (Vite dev server) with route-level separation for citizens vs admins.
- Backend: Express (CommonJS) + MongoDB (Mongoose) with session-based auth via Passport LocalStrategy.
- Auth: HTTP-only session cookies (frontend sends `credentials: include`).
- Data: MongoDB collections for Users, SOS, Resources, Alerts.
- Geospatial: Resources and Alerts store GeoJSON `Point` and use `2dsphere` indices for `$near` queries.
- Optional Redis: used for sessions + rate limiting when `REDIS_URL` is set (and `USE_REDIS_IN_DEV=true` for local opt-in).
- API docs: Swagger UI served at `/api-docs` when `swagger-ui-express` and the spec are present.

## 3) Roles & permissions
- `citizen`: can create SOS, list/view own SOS, view resources, view alerts, view citizen dashboard.
- `admin`: can view all SOS, update SOS status, create/update/delete resources, broadcast/deactivate alerts, view alert history, view admin dashboard aggregates.

## 4) Backend entrypoint & security posture
Backend entry: `backend/server.js`
- Security headers: Helmet + CSP (nonce per request). CSP runs in report-only mode in dev.
- Sanitization: uses mongo-sanitize and xss-clean in a “safe” way (avoids overwriting `req.query` in Express).
- Rate limiting: `express-rate-limit` with a custom Redis-backed store if Redis enabled; otherwise memory store.
- CORS: allows `http://localhost:5173` and `http://localhost:5174`, `credentials: true`.
- Routing base: all API routes are mounted under `/api/*`.

## 5) Data models (actual code)
### User (`backend/models/User.js`)
- Fields: `name`, `email (unique)`, `password (bcrypt, select:false)`, `phone`, `role` (`citizen|admin`), `location {lat,lng,address}`.
- Geo: `locationGeo: { type: 'Point', coordinates: [lng,lat] }` with `2dsphere` index.
- Hooks: password hash on save; `locationGeo` kept in sync from `location.lat/lng`.

### SOS (`backend/models/SOS.js`)
- Fields: `userId`, `type`, `severity`, `status`, `description`, `location {lat,lng,address}`, `contactNumber`, `adminNotes`, timestamps.
- Note: SOS uses numeric `lat/lng` (not GeoJSON).

### Resource (`backend/models/Resource.js`)
- Fields: `name`, `type`, `location: Point + address fields`, `contact`, `services[]`, `capacity/currentOccupancy`, `operatingHours`, `isActive`, `createdBy`.
- Indices: `location: 2dsphere` and text index for searching.

### Alert (`backend/models/Alert.js`)
- Fields: `title`, `message`, `severity`, `type`, `targetAudience` (`all|location-based|admin-only`), optional `location: Point + radius/city/state`, `expiresAt`, `readBy[]`, `isActive`, `createdBy`.
- Indices: `location: 2dsphere`, `expiresAt`.
- Validation: removes malformed `location` to avoid breaking 2dsphere inserts.

## 6) Backend API surface (real mounted routes)
Base prefix: `/api`

### Auth (`/api/auth`)
- `POST /api/auth/register` — register (expects `name,email,password,passwordConfirm`, optional `phone,role`).
- `POST /api/auth/login` — login (Passport Local). Important: body expects `username` (email) + `password`.
- `POST /api/auth/logout` (also `GET`) — logout.
- `GET /api/auth/me` and `GET /api/auth/profile` — return current user.

### SOS (`/api/sos`)
- `GET /api/sos` — list SOS (citizen: own; admin: all). Optional query `status`.
- `POST /api/sos` — create SOS. Accepts either:
  - `location: { lat, lng, address? }` (preferred by frontend types)
  - or top-level `lat,lng,address` (backend accepts both).
- `GET /api/sos/:id` — view one SOS (owner or admin).
- `PUT /api/sos/:id` — admin-only: update status + optional `adminNotes`.

### Resources (`/api/resources`)
- `GET /api/resources` — list resources.
  - Optional query: `type`, `search` (text), and proximity: `lat,lng,radius(km)` which triggers `$near`.
- `GET /api/resources/:id` — resource detail.
- `POST /api/resources` — admin-only create.
- `PUT /api/resources/:id` — admin-only update.
- `DELETE /api/resources/:id` — admin-only soft delete (`isActive=false`).

### Alerts (`/api/alerts`)
- `GET /api/alerts` — list active, non-expired alerts.
  - If user has `user.location.lat/lng`, it returns both `location-based` (within 50km) + `all` alerts.
  - Otherwise returns only `all` alerts.
- `POST /api/alerts` — admin-only create/broadcast. Supports:
  - `targetAudience='all'` OR `targetAudience='location-based'` with `lat,lng` (or a `location` object with `coordinates`).
  - Optional `expiryHours`.
- `GET /api/alerts/history` — admin-only (latest 50).
- `PUT /api/alerts/:id/read` — mark as read (adds user to `readBy`).
- `DELETE /api/alerts/:id` — admin-only deactivate (`isActive=false`).

### Dashboard
- Citizen stats: `GET /api/dashboard/stats` — user’s recent SOS + `{total,pending,resolved}`.
- Admin stats: `GET /api/admin/dashboard` — totals + aggregates by status/severity + pending SOS list.

## 7) Frontend routes (actual React Router)
Public:
- `/login`, `/register`

Citizen (protected):
- `/dashboard`, `/create-sos`, `/my-sos`, `/sos/:id`, `/resources`, `/alerts`

Admin (protected + `requireAdmin`):
- `/admin/dashboard`, `/admin/sos`, `/admin/sos/:id`, `/admin/resources`, `/admin/broadcast`, `/admin/alert-history`

Auth bootstrap:
- On app load, frontend calls `GET /api/auth/profile` to restore session.

## 8) Frontend data layer
- RTK Query base: `credentials: 'include'`, base URL is `/api` unless `VITE_API_BASE_URL` is a full http(s) URL.
- API slices exist for auth, SOS, resources, alerts, dashboard.
- Redux `authSlice` updates state from RTK Query matchers (login/logout/getProfile).

## 9) How to run (as implemented)
Frontend dev proxy (Vite): `/api -> http://localhost:6001`.

Backend scripts (from `backend/`):
- `npm start` (nodemon)
- `npm test` (jest)

Frontend scripts (from `frontend/`):
- `npm run dev`, `npm run build`, `npm run preview`

## 10) Environment variables (important: docs vs code)
Backend **code** in `backend/server.js` uses:
- `PORT`
- `NODE_ENV`
- `SESSION_SECRET`
- `USE_REDIS_IN_DEV` (`true` to enable redis locally)
- `REDIS_URL`
- Mongo: **uses** `DATABASE` + `DATABASE_PASSWORD` (it replaces `<db_password>` in `DATABASE`).

Backend docs mention `MONGODB_URI`, but current server code is wired to `DATABASE`/`DATABASE_PASSWORD`.

Frontend:
- `VITE_API_BASE_URL` (optional; if not a full URL, frontend falls back to `/api`).

## 11) Known mismatches / tech debt worth mentioning to an assistant
- Frontend `package.json` currently does not list Redux Toolkit / RTK Query / MUI deps, but the code imports them (so installs may fail unless dependencies are present elsewhere or not yet updated).
- Backend integration test file hits `/sos` and `/dashboard` without the `/api` prefix; current server mounts routes under `/api/*`.
- Dashboard router is mounted twice (`/api/dashboard` and `/api/admin`) even though it contains both citizen and admin endpoints; effectively the real admin path is `/api/admin/dashboard`.
- CSP `connectSrc` contains a placeholder `https://api.example.com` (likely should be adjusted for production).

## 12) Feature expansion map (good “next” features)
Non-GenAI (product):
- SOS assignment workflow: `assignedTo`, audit trail, SLA timers, comments, status transition validation.
- Notifications: email/SMS/push/websocket for new SOS + alert broadcasts; admin escalation and retry.
- Location improvements: store SOS as GeoJSON for real proximity queries and “nearest responders/resources”.
- Admin tools: bulk resource import, health/status of resources, occupancy updates, outage mode.
- Citizen tools: live status timeline, share SOS, offline-first draft SOS, emergency contacts.

GenAI ideas (safe + high-impact):
1) SOS triage assistant (admin-facing)
   - Input: SOS `type/severity/description/location`, plus recent alerts/resources.
   - Output: structured triage summary, suggested next steps/checklist, recommended resource types to dispatch.

2) Alert drafting + localization (admin-facing)
   - Draft concise alert text from a template and a few inputs.
   - Automatically generate translations (Hindi/Marathi/etc.) + a short “SMS length” variant.

3) Resource recommendation (citizen-facing)
   - Given user location + SOS type, recommend nearest resources with explanation (“why this resource”).
   - Uses existing `$near` resource query + an LLM for explanation/ranking.

4) Duplicate/cluster detection
   - Detect multiple SOS reports likely referring to the same incident (time+distance+semantic similarity).

5) Post-incident summarization
   - Summarize resolved SOS + actions into an “after action report” for admins.

6) Safety Q&A assistant (citizen-facing)
   - A constrained assistant that answers “what should I do now?” using curated guidance + current alerts.
   - Should be guardrailed: always recommend calling emergency services for immediate danger.

## 13) GenAI integration approach (minimal disruption)
- Add a new backend module `ai/` (controller + routes) with endpoints like:
  - `POST /api/ai/triage` (admin) — returns structured JSON.
  - `POST /api/ai/alert-draft` (admin)
  - `POST /api/ai/safety-advice` (citizen) with strict safety policy.
- Prefer “stateless” calls first (no vector DB needed) using current SOS/Alert/Resource data.
- If retrieval is needed later: add a small knowledge base (prepared disaster playbooks) embedded into a vector store.
- Log all model inputs/outputs (with PII minimization) for auditing.

---

# Pasteable prompt for Perplexity

You are helping extend an existing full-stack disaster management platform called Suraksha Setu. Use the following facts as ground truth and propose concrete feature additions, API changes, data schema changes, and frontend UX changes with minimal disruption:

- Frontend: React + TS (Vite), protected citizen/admin routes. Uses RTK Query with `credentials: include`.
- Backend: Express + Mongo (Mongoose). Session-based auth via Passport LocalStrategy. All routes mounted under `/api/*`.
- Auth endpoints: POST `/api/auth/register`, POST `/api/auth/login` (expects `username` + `password`), POST `/api/auth/logout`, GET `/api/auth/profile`.
- SOS endpoints: GET/POST `/api/sos`, GET `/api/sos/:id`, PUT `/api/sos/:id` (admin status update).
- Resources: GET `/api/resources` supports `$near` with `lat,lng,radius(km)`. Admin CRUD.
- Alerts: GET `/api/alerts` returns `all` + nearby `location-based` alerts (50km) if user has lat/lng; admin can create and view `/api/alerts/history`.
- Dashboard: GET `/api/dashboard/stats` (citizen) and GET `/api/admin/dashboard` (admin aggregates).
- Models: User has `locationGeo` (Point) indexed; Resource and Alert have Point + 2dsphere; SOS currently stores numeric `lat/lng`.

Now:
1) Suggest 5–8 next features (mix citizen/admin) with exact API endpoints and DB schema adjustments.
2) Include at least 3 GenAI features that are safe/guardrailed, with proposed prompts, input/output JSON schemas, and data minimization guidance.
3) Call out any mismatches/tech debt and propose the smallest fixes needed to support the features.
