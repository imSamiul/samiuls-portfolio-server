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
  middleware/      # requireAuth, validate, rateLimit, upload, errorHandler, requestLog
  models/          # Project, User, schemaOptions, index
  modules/<domain>/
    *.routes.ts
    *.controller.ts
    *.service.ts
    *.serializer.ts   # public DTO mapping
    *.test.ts
  shared/          # zod schemas + constants + api types (API copy of contract)
  utils/           # ApiError, response
  scripts/         # one-off migrations
  test/            # setup (mongodb-memory-server) + helpers (supertest)
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

### Auth

- Bearer only, for now. `requireAuth` verifies the token and puts `{ id }` on `req.auth`
- 401 `UNAUTHORIZED` when the header is missing, 401 `ACCESS_TOKEN_INVALID` when it fails to verify
- Hashing lives in `modules/auth/password.ts` (bcrypt, cost 12) — not in a schema hook. `schemaOptions` strips `password` from `toJSON` as a backstop
- Tokens are stateless; there is no `user.tokens` array and no revocation
- `authLimiter` (20 / 15 min / IP) on credential routes, `apiLimiter` (600) on everything else; both skipped in tests
- **Planned, last:** httpOnly cookies with `sameSite: 'none'` + `secure: true`. Do not start this as a side effect of another task

### Images

`multer.memoryStorage()` → `sharp().resize(1920, 1080).webp({ quality: 80 })` → Cloudinary; the document stores `image: { url, publicId }` and the serializer exposes only the URL. The resize uses sharp's default `fit: 'cover'`, so every image is cropped to 16:9 on purpose — the client relies on those fixed dimensions for `next/image`.

Deleting a project destroys its asset; a failed insert destroys the asset it just uploaded. Cloudinary keys are **optional** outside production so the API boots from a bare clone — anything that calls Cloudinary runs `assertCloudinaryConfigured()` first and answers 503.

### API surface (`API_PREFIX`, default `/api/v1`)

| Prefix | Notes |
| --- | --- |
| `/auth` | `signUp`, `login` → `{ user: { id, email }, token }` |
| `/project` | public `getAllProjects`, `getProjectsForHomepage`, `getProjectById/:id`; admin `create` (multipart), `updateProject/:id`, `updateShowOnHomePage/:id`, `deleteProject/:id` |
| `/resume` | `download` → 302 to the Cloudinary PDF (**not** enveloped) |

Health: `GET /health` (outside prefix). Success is `{ success, message, data }`, errors are `{ success, message, code, details? }`.

### Tests

Vitest + Supertest + mongodb-memory-server. `vitest.config.ts` injects the test env, so the suite needs no `.env` file and no running Mongo. `src/test/helpers.ts` gives the supertest client, `url()` (prefixes `API_PREFIX`) and `createAdmin()`. Nothing reaches the network: paths that would call Cloudinary are covered at their guard instead of mocked.

---

## Still open, in order

1. Run `pnpm migrate:images` — existing documents still hold `image: { data: Buffer, contentType }`, so they serialise to an empty `image`.
2. Run `pnpm upload:resume` and set `RESUME_PUBLIC_ID`; until then `/api/v1/resume/download` answers 503.
3. Create the Koyeb service from the `Dockerfile` and delete the Vercel project.
4. Auth to httpOnly cookies — **last**, and only when a task explicitly asks.

---

## Run / deploy

```bash
pnpm install
cp .env.example .env.development   # DB_URL, JWT_TOKEN and ADMIN_EMAIL are required
pnpm dev
pnpm test
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
