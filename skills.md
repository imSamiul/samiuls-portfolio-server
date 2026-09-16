# Samiul Portfolio Backend — Skill Guide

Use this file whenever you change code in the **backend** repo. Match existing patterns; do not invent new architecture.

Cursor loads `.cursor/skills/portfolio/` automatically when relevant. This file is the canonical overview (easy to `@skills.md`).

---

## Project

```
samiuls-portfolio-api   Express 5 + Mongoose 9 + Cloudinary → Koyeb (Docker)
```

- Package manager: **pnpm**; Node 22
- Schemas/types: `src/shared` → import `#shared` (`package.json` `"imports"`)
- Sister frontend repo owns its own copy as `@/shared`. After a contract change, update **both** copies.
- Manual API examples live in [`bruno/`](./bruno/README.md) (Bearer token, not a cookie jar)
- **No** Redis, no Firebase; do **not** host this API on Vercel serverless
- Respond to the user in **Bangla + English** when chatting (code/comments stay English)

### The one account

There is no seed and no roles. `ADMIN_EMAIL` is the only address that may sign up or log in; every other address is refused with 401 `NOT_ADMIN` before a database round trip.

---

## Hard rules (always)

1. **Read before write** — open `src/modules/projects/`; copy its naming and nesting.
2. **Schemas** — validate with `#shared` zod + `validate()` middleware, not ad-hoc checks in controllers.
3. **Errors** — throw `ApiError` (status + machine `code`); `errorHandler` formats the envelope. Express 5 forwards rejected promises, so there is **no** `asyncHandler` and no try/catch that only re-sends.
4. **Responses** — `sendSuccess(res, message, data, status?)`. Never `res.json()` a bare payload. Serializers emit `id`, never `_id`.
5. **ESM** — `import type` for type-only imports, `.js` extension on every relative import.
6. **Surgical diffs** — only touch what the task needs; no drive-by refactors.
7. **No secrets** in commits; copy `.env.example` → `.env.development` (gitignored). Live secrets live on Koyeb.

---

## Structure

```
src/
  app.ts / server.ts / routes.ts
  config/          # env (zod), db, cloudinary
  middleware/      # requireAuth, validate, rateLimit, upload, errorHandler
  models/          # Project, User, SiteAsset, schemaOptions, index
  modules/<domain>/
    *.routes.ts
    *.controller.ts
    *.service.ts
    *.serializer.ts   # public DTO mapping
  shared/          # zod schemas + constants + api types (API copy of contract)
  utils/           # ApiError, response
  scripts/         # one-off migrations
  types/           # express.d.ts
```

### Must follow

- Mount under `/api/v1` via `routes.ts` (health at `/health`, outside the prefix)
- Validate with `#shared` zod + `validate()` middleware
- Auth = Bearer JWT in `Authorization` (cookies are the last planned migration)
- Public responses via serializers + `sendSuccess` / `ApiError`
- Named exports only — no default exports anywhere
- Nothing touches the filesystem: images and the resume PDF both live in Cloudinary

### Domains

`projects` · `auth` · `resume`

---

## Stack details

- Express 5 + TypeScript (ESM, `NodeNext`), executed by **tsx** in dev *and* in the container
- Mongoose 9 + MongoDB Atlas
- Cloudinary + multer (memory storage) + sharp
- JWT Bearer token, `JWT_TOKEN_TTL_DAYS` (7 by default)
- `express-rate-limit` with the in-memory store — one instance, no shared store to sync

### Module rules

1. Validate with shared zod schemas via `validate({ body|params })`
2. Controllers call services; keep HTTP thin
3. Serializers are the only shape leaving the API for entities
4. Throw `ApiError` (status + machine `code`); `errorHandler` formats the envelope
5. Success: `sendSuccess(res, message, data, status?)`

### Read paths

Every read is `.lean()` — nothing needs a hydrated document.

Lists and single entities have **separate serializers**: `toProjectSummary` (list) and `toProjectDetail` (one project). Lists project `projectDetails` away with `.select('-projectDetails')` because no card renders it, and the website hands list data to a client component — so anything in a list payload is also inlined into the page HTML. Keep list payloads to what a card draws; put anything long behind the by-id route.

Indexes must match the sort, not just the filter. Both public lists filter on `status` and sort `{ order: 1, createdAt: -1 }`, so the indexes carry every field in that order: `{ status: 1, showOnHomepage: 1, order: 1, createdAt: -1 }` for the homepage and `{ status: 1, order: 1, createdAt: -1 }` for the full list. Adding a field to a filter or a sort means revisiting these — a prefix mismatch silently turns the sort into an in-memory one.

The dashboard list is deliberately left unindexed: it is admin-only, unfiltered, and this collection is small enough that another index would cost more than it saves.

Prefer one round trip over read-modify-write — `toggleHomepage` and `toggleStatus` flip their field with a pipeline update (`$not` / `$cond`, `updatePipeline: true`), not `findById` + `save()`.

### Logging

**There is none, by choice.** No logger, no access log, no `x-request-id`, and `errorHandler` does not log the 500s it answers. `no-console` is a lint error, and only `src/scripts/` is exempt — those are CLIs whose output is meant for a human.

What that costs, so nobody is surprised by it: a 500 in production leaves no stack anywhere, and a failed revalidation webhook is silent. The client's response still carries `message` and `code`, and outside production it carries the stack too, so the response body is the only place a failure is visible. Do not add a logger back on a hunch — ask first.

### Publishing and ordering

`status` (`draft` | `published`) is the publish gate; `showOnHomepage` is only a display flag and must never be mistaken for one. New projects default to `draft`, so saving does not publish.

Both public lists filter `status: 'published'`. The dashboard needs drafts, so it gets its own **authenticated** route, `getAllProjectsForDashboard` — a query param was rejected because the difference is who may see drafts, and that belongs in the route, not the query string.

`order` is a plain ascending integer applied before `createdAt: -1`, so an older, stronger project can sit on top. No drag-and-drop: with this many projects a number field carries almost all the value.

`status` defaults only apply to documents mongoose creates, so projects that predate the field read back as `undefined` and would vanish from the site. `pnpm backfill:publishing` fixes that and must run with the deploy.

### Revalidation

The website caches project data **indefinitely** (`revalidate: false` + tags), so it depends on being told when something changed. Every project write calls `revalidateProject(slug)` from `utils/revalidateWeb.ts`, which POSTs `{ tags: ['projects', 'project:<slug>'] }` to `WEB_REVALIDATE_URL` with `REVALIDATE_SECRET`.

Two rules:

- It runs in the **controller, after `sendSuccess`** — this is an outbound integration, not domain logic, and the response must not wait on it.
- It is **fire-and-forget**: the promise is not awaited, failures are logged and swallowed. A write must never fail because the site is unreachable.

Unset in development, so writes simply skip the call. **Required in production** — without it the site caches forever and never updates. The tag strings are a hand-maintained contract with the frontend's `projectServerApis.ts`; there is no shared package.

### Slugs

Projects are addressed publicly by `slug`, not by `_id`. It is derived from the title **once, at create time** (`deriveSlug`) and never moves on its own — a URL that is indexed and shared must survive a reworded title. An admin can still set it explicitly; the unique index is the final arbiter and a clash surfaces as 409 `DUPLICATE_KEY`.

`slug` stays in the **summary** DTO: the website's sitemap and JSON-LD build project URLs out of list data.

`getProjectBySlug/:slug` is a separate route from `getProjectById/:id` rather than one param accepting either. The id route validates its param as an ObjectId, so a slug sent there is rejected — and a polymorphic param schema would be worse than two routes. The dashboard keeps using ids; only the public site uses slugs.

### Auth

- Bearer only, for now. `requireAuth` verifies the token and puts `{ id }` on `req.auth`
- 401 `UNAUTHORIZED` when the header is missing, 401 `ACCESS_TOKEN_INVALID` when it fails to verify
- Hashing lives in `modules/auth/password.ts` (bcrypt, cost 12) — not in a schema hook. `schemaOptions` strips `password` from `toJSON` as a backstop
- Tokens are stateless; there is no `user.tokens` array and no revocation
- `authLimiter` (20 / 15 min / IP) on credential routes, `apiLimiter` (600) on everything else; both still carry a `skip` for `NODE_ENV=test`, which nothing sets now
- **Planned, last:** httpOnly cookies with `sameSite: 'none'` + `secure: true`. Do not start this as a side effect of another task

### Images

`multer.memoryStorage()` → `sharp().resize(1920, 1080).webp({ quality: 80 })` → `cloudinary.uploader.upload_stream`; the document stores `image: { url, publicId }` and the serializer exposes only the URL. The buffer is streamed, not sent as a base64 data URI — that would inflate it by a third and hold the image in memory twice. The resize uses sharp's default `fit: 'cover'`, so every image is cropped to 16:9 on purpose — the client relies on those fixed dimensions for `next/image`.

Deleting a project destroys its asset; a failed insert destroys the asset it just uploaded. Cloudinary keys are **optional** outside production so the API boots from a bare clone — anything that calls Cloudinary runs `assertCloudinaryConfigured()` first and answers 503.

### Resume

The PDF is a raw Cloudinary asset and its pointer is a `SiteAsset` document (`key: 'resume'`, `publicId`, `version`) — **not** an env var, so replacing the resume is a dashboard upload with no redeploy. `url` is deliberately not stored: `fl_attachment` is applied at delivery, so the URL is always rebuilt from `publicId + version`.

`version` is the cache-busting mechanism. The public id is stable, so uploads pass `invalidate: true` and the stored version goes into the delivery URL — otherwise the CDN would keep handing out the previous PDF from an unchanged URL.

Two things must not change: `GET /download` stays a **302** (streaming bytes through Node would burn Koyeb egress and memory and lose CDN range requests), and the asset stays `resource_type: 'raw'` (Cloudinary blocks PDF delivery for `image` assets by default).

On the client this is a plain anchor. Never fetch it as a blob: that buffers the file in memory, discards the `Content-Disposition` filename, and makes the download depend on Cloudinary's CORS policy.

### Contact

`modules/contact/` has no model and no serializer — nothing is stored and nothing comes back but `null`. Mail goes out through Resend to `ADMIN_EMAIL` with `replyTo` set to the visitor, so replying from the inbox reaches them.

Spam is handled with a **honeypot**, not a captcha: the form renders a hidden `website` field, and when it arrives filled the controller answers 200 and drops the message, so a bot cannot tell it failed. `contactLimiter` allows 5 requests per 15 minutes per IP because every accepted message costs an email.

`RESEND_API_KEY` / `CONTACT_FROM_EMAIL` are optional outside production and the service answers 503 `MAIL_NOT_CONFIGURED` without them, mirroring Cloudinary. Without a verified Resend domain the only usable sender is `onboarding@resend.dev`, which is enough since it only mails the owner.

### API surface (`API_PREFIX`, default `/api/v1`)

| Prefix | Notes |
| --- | --- |
| `/auth` | `signUp`, `login` → `{ user: { id, email }, token }` |
| `/contact` | public `POST /` → mails `ADMIN_EMAIL`, returns `data: null` |
| `/project` | public `getAllProjects`, `getProjectsForHomepage`, `getProjectBySlug/:slug`, `getProjectById/:id` (all published-only); admin `getAllProjectsForDashboard`, `create` (multipart), `updateProject/:id`, `updateStatus/:id`, `updateShowOnHomePage/:id`, `deleteProject/:id` |
| `/resume` | public `GET /` → `{ updatedAt }` or 404 `RESUME_NOT_CONFIGURED`, `download` → 302 to the Cloudinary PDF (**not** enveloped); admin `POST /` (multipart) replaces it |

Health: `GET /health` (outside prefix). Success is `{ success, message, data }`, errors are `{ success, message, code, details? }`.

### Tests

**There are none.** The suite (Vitest + Supertest + mongodb-memory-server) was removed on request; `pnpm lint && pnpm typecheck` is the whole gate. Verify a change by running it — `pnpm dev` plus the Bruno collection in `bruno/`, which covers every route.

---

## Still open, in order

1. Run `pnpm backfill:slugs` — `slug` is required and unique, and existing documents predate it. Run it **before** the first boot that calls `syncIndexes()`.
2. Run `pnpm backfill:publishing` — `status` and `order` are required, and documents that predate them read back `undefined`, which the public lists filter out. **Ship this with the deploy or the site goes empty.**
3. Run `pnpm migrate:images` — existing documents still hold `image: { data: Buffer, contentType }`, so they serialise to an empty `image`.
4. Upload the resume once from the dashboard (`/dashboard/resume`); until then `/api/v1/resume` answers 404 and the homepage renders no download button.
5. Set `RESEND_API_KEY`; until then `/api/v1/contact` answers 503 `MAIL_NOT_CONFIGURED`.
6. Set `WEB_REVALIDATE_URL` and `REVALIDATE_SECRET` on both sides; the website caches project data indefinitely and will not update without them.
7. Create the Koyeb service from the `Dockerfile` and delete the Vercel project.
8. Auth to httpOnly cookies — **last**, and only when a task explicitly asks.

---

## Run / deploy

```bash
pnpm install
cp .env.example .env.development   # DB_URL, JWT_TOKEN and ADMIN_EMAIL are required
pnpm dev
pnpm lint && pnpm typecheck
```

- Local API: http://localhost:4000/health
- **Production:** Koyeb Web Service (Docker) + MongoDB Atlas M0 + Cloudinary
- `tsx` is a **runtime** dependency: the container runs `pnpm start`, never `dist/`. `pnpm build` exists for typecheck/emit only
- `app.set('trust proxy', 1)` — the platform terminates TLS, and the rate limiter needs the real client IP
- In production `autoIndex` is off and `syncIndexes()` runs once at boot; `SIGTERM`/`SIGINT` close the server then the connection
- Set `CORS_ORIGIN` to the Vercel frontend origin (comma separated for more than one)
- Vercel is gone: `vercel.json`, the committed `dist/`, `src/index.ts` and the `pre-commit`/`add-build` scripts were all deleted. Do not bring them back

---

## What not to do

- Do not host this Express API on Vercel serverless, or add serverless handler exports
- Do not add Redis, OTP flows, or refresh-token rotation — this is a single-admin dashboard
- Do not write image bytes into MongoDB, or read images or the resume off the filesystem
- Do not add `asyncHandler` or a controller `try/catch` that only forwards the error
- Do not invent `containers/`, `views/`, a top-level `services/`, or parallel routing layers
- Do not skip serializers for public entity responses, or expose `_id`
- Do not read `process.env` outside `src/config/env.ts`, or hand-write `res.status(500)`
- Do not use default exports, and do not drop the `.js` extension from a relative import
- Do not assume a monorepo `packages/shared` — schemas are local `#shared`
- Do not switch auth to cookies as a side effect of another task
