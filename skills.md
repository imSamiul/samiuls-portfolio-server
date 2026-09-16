# Samiul Portfolio Backend — Skill Guide

Use this file whenever you change code in the **backend** repo. Match existing patterns; do not invent new architecture.

Cursor loads `.cursor/skills/portfolio/` automatically when relevant. This file is the canonical overview (easy to `@skills.md`).

---

## Project

```
samiuls-portfolio-api   Express 5 + Mongoose 9 + Cloudinary → Vercel (serverless Express)
```

- Package manager: **pnpm**; Node 22
- Schemas/types: `src/shared`, imported relatively (`../../shared/index.js`) — the `#shared` alias is gone, see [Run / deploy](#run--deploy)
- Sister frontend repo owns its own copy as `@/shared`. After a contract change, update **both** copies.
- Manual API examples live in [`bruno/`](./bruno/README.md) (Bearer token, not a cookie jar)
- **No** Redis, no Firebase. The runtime is Vercel's zero-config Express support — see [Serverless constraints](#serverless-constraints)
- Respond to the user in **Bangla + English** when chatting (code/comments stay English)

### The one account

There is no seed and no roles. `ADMIN_EMAIL` is the only address that may sign up or log in; every other address is refused with 401 `NOT_ADMIN` before a database round trip.

---

## Hard rules (always)

1. **Read before write** — open `src/modules/projects/`; copy its naming and nesting.
2. **Schemas** — validate with `src/shared` zod + `validate()` middleware, not ad-hoc checks in controllers.
3. **Errors** — throw `ApiError` (status + machine `code`); `errorHandler` formats the envelope. Express 5 forwards rejected promises, so there is **no** `asyncHandler` and no try/catch that only re-sends.
4. **Responses** — `sendSuccess(res, message, data, status?)`. Never `res.json()` a bare payload. Serializers emit `id`, never `_id`.
5. **ESM** — `import type` for type-only imports, `.js` extension on every relative import.
6. **Surgical diffs** — only touch what the task needs; no drive-by refactors.
7. **No secrets** in commits; copy `.env.example` → `.env.development` (gitignored). Live secrets live in the Vercel project's environment variables.

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
- Validate with `src/shared` zod + `validate()` middleware
- Auth = Bearer JWT in `Authorization` (cookies are the last planned migration)
- Public responses via serializers + `sendSuccess` / `ApiError`
- Named exports only. The single exception is `src/app.ts`, whose default export is how Vercel finds the app
- Nothing touches the filesystem: images and the resume PDF both live in Cloudinary

### Domains

`projects` · `auth` · `resume`

---

## Stack details

- Express 5 + TypeScript (ESM, `NodeNext`), executed by **tsx** locally; on Vercel the platform compiles the TypeScript itself
- Mongoose 9 + MongoDB Atlas
- Cloudinary + multer (memory storage) + sharp
- JWT Bearer token, `JWT_TOKEN_TTL_DAYS` (7 by default)
- `express-rate-limit` with the in-memory store — per instance, so the limits are weaker than they look (see below)

### Serverless constraints

Vercel finds the app through the **default export in `src/app.ts`** (its Express detection scans `app`/`index`/`server` at the root and under `src/`). `server.ts` listens on that same instance and is what Docker and `pnpm dev` run; Vercel never executes it. Neither `vercel.json` nor an `api/` folder is needed — adding them opts out of the detection.

Four things follow from there, and each one has already bitten a design decision:

- **There is no boot step.** The first request arrives before anything has connected, so `withDatabase` awaits `ensureDatabase()` ahead of every `/api/v1` route. The promise is cached per instance and cleared if it rejects, so a bad connection does not poison the instance. `/health` sits outside the prefix and answers without the database.
- **Indexes are not built at runtime.** `autoIndex` is off in production and a cold start must not check indexes, so `pnpm sync:indexes` is a deploy step — run it whenever an index changes.
- **Work must not outlive the response.** The instance can be frozen the moment the response is sent, so `revalidateWeb` hands its webhook to `waitUntil()`. Anything else fired after `sendSuccess` has to do the same or it will silently not happen.
- **Request bodies stop at 4.5 MB.** `MAX_RESUME_BYTES` is 4 MB so multer answers `RESUME_TOO_LARGE` instead of the edge returning an opaque 413. Project images are 2 MB, well inside it.

The rate limiters are in-memory, so each instance counts on its own: the effective limit is roughly *(configured limit × warm instances)*. That is accepted, not overlooked — a shared store means Redis, and this is a single-admin dashboard. The contact form's real defence is the honeypot.

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

### Pagination

`getAllProjects` is the one paginated list — it is the only one with no ceiling on its size. `?page=&limit=` (defaults 1 and `PROJECTS_PAGE_SIZE`, `limit` capped at 50, out-of-range values are a 422), and `data` is `{ items, meta }` where `meta` carries `page`, `limit`, `total`, `totalPages` and `hasMore`. The homepage and dashboard lists stay unpaginated: one is curated and short, the other is a single admin table.

Offset paging, not a cursor — the collection is small and admin-written, so the stability a cursor buys is not worth the awkward comparison that a compound `(order, createdAt)` sort key would need. The sort ends in `_id` precisely so the offsets stay honest: without a unique final key, projects sharing an `order` and a `createdAt` could repeat or disappear across a page boundary. Both list indexes carry the trailing `_id`, so keep them in step with the sort and run `pnpm sync:indexes` after changing either.

`status` defaults only apply to documents mongoose creates, so projects that predate the field read back as `undefined` and would vanish from the site. `pnpm backfill:publishing` fixes that and must run with the deploy.

### Revalidation

The website caches project data **indefinitely** (`revalidate: false` + tags), so it depends on being told when something changed. Every project write calls `revalidateProject(slug)` from `utils/revalidateWeb.ts`, which POSTs `{ tags: ['projects', 'project:<slug>'] }` to `WEB_REVALIDATE_URL` with `REVALIDATE_SECRET`.

Two rules:

- It runs in the **controller, after `sendSuccess`** — this is an outbound integration, not domain logic, and the response must not wait on it.
- It is **fire-and-forget**: the promise is not awaited and failures are swallowed. A write must never fail because the site is unreachable.
- On Vercel the promise is handed to `waitUntil()`, because a response-sent instance can be frozen before the fetch leaves. Without it the site would quietly stop updating.

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

Two things must not change: `GET /download` stays a **302** (streaming bytes through the function would burn its memory and execution time and lose CDN range requests), and the asset stays `resource_type: 'raw'` (Cloudinary blocks PDF delivery for `image` assets by default).

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

1. Run `pnpm sync:indexes` against production once the deploy is up — `autoIndex` is off there and nothing builds indexes at runtime any more. Re-run it whenever an index changes. The three data migrations (`backfill:slugs`, `backfill:publishing`, `migrate:images`) have already been run against Atlas.
2. In Cloudinary, Settings → Security → **Restricted media types**, allow PDF/raw delivery; until then `/resume/download` redirects to a URL that answers 401 `deny or ACL failure`.
3. Set `RESEND_API_KEY`; until then `/api/v1/contact` answers 503 `MAIL_NOT_CONFIGURED`.
4. Set `WEB_REVALIDATE_URL` and `REVALIDATE_SECRET` on both sides; the website caches project data indefinitely and will not update without them.
5. Auth to httpOnly cookies — **last**, and only when a task explicitly asks.

---

## Run / deploy

```bash
pnpm install
cp .env.example .env.development   # DB_URL, JWT_TOKEN and ADMIN_EMAIL are required
pnpm dev
pnpm lint && pnpm typecheck
```

- Local API: http://localhost:4000/health
- **Production:** Vercel (its own project, separate from the website) + MongoDB Atlas M0 + Cloudinary
- The Vercel project's Framework Preset must be **Express**; with it, there is no build command and no output directory. If the dashboard still says "Other", the deploy fails with *No Output Directory named "public"* — fix the preset, do not add `vercel.json` or a `public/` folder to work around it
- Every env var from `.env.example` goes into the Vercel project, plus `NODE_ENV=production`. `PORT` is not used there
- `tsx` is a **runtime** dependency for the local and container paths (`pnpm start`), never `dist/`. There is deliberately **no `build` script**: Vercel compiles and bundles the entrypoint itself, and its docs warn that a transpiling build script can break that. `pnpm typecheck` is the type gate
- **`src/shared` is imported relatively, never through a `package.json` `"imports"` alias.** Vercel traces the entrypoint, compiles every `.ts` it reaches and renames it to `.js` inside the function, but ships `package.json` untouched — so an alias has no target that works on both sides: `./src/shared/index.ts` is not in the function at runtime, and `./src/shared/index.js` does not exist at trace time, so the file never gets bundled. Both spellings were deployed and both answered every request with `FUNCTION_INVOCATION_FAILED` (`ERR_MODULE_NOT_FOUND` in the runtime log). Relative `.js` specifiers go through that same rename, which is why they work
- The `Dockerfile` is kept so the API can still run as a container (local parity, and an exit route if Vercel's limits stop fitting)
- `app.set('trust proxy', 1)` — the platform terminates TLS, and the rate limiter needs the real client IP
- `SIGTERM`/`SIGINT` close the server then the connection — container path only; Vercel recycles instances itself

---

## What not to do

- Do not add `vercel.json`, an `api/` folder or a serverless handler wrapper — Vercel's Express detection already covers all of it
- Do not add Redis, OTP flows, or refresh-token rotation — this is a single-admin dashboard
- Do not write image bytes into MongoDB, or read images or the resume off the filesystem
- Do not add `asyncHandler` or a controller `try/catch` that only forwards the error
- Do not invent `containers/`, `views/`, a top-level `services/`, or parallel routing layers
- Do not skip serializers for public entity responses, or expose `_id`
- Do not read `process.env` outside `src/config/env.ts`, or hand-write `res.status(500)`
- Do not use default exports outside `src/app.ts`, and do not drop the `.js` extension from a relative import
- Do not start long work after `sendSuccess` without `waitUntil` — the instance can be frozen before it runs
- Do not assume a monorepo `packages/shared` — schemas are local `src/shared`, imported relatively; do not reintroduce a `package.json` `"imports"` alias for them
- Do not switch auth to cookies as a side effect of another task
