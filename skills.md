# Samiul Portfolio API — Skill Guide

Use this file whenever you change code in the **server** repo. Match the documented shape; do not invent new architecture.

Cursor loads `.cursor/skills/portfolio/` automatically when relevant. This file is the canonical overview (easy to `@skills.md`).

---

## Project

```
samiuls-portfolio-server   Express 5 + Mongoose 9 + TypeScript (ESM, NodeNext) → Koyeb (Docker)
```

- Package manager: **pnpm**; Node 22
- TypeScript runs directly through **tsx** in development *and* in production. `pnpm build` exists for typecheck/emit, but the container never runs `dist/`.
- Zod schemas and shared types: `src/shared`, imported as **`#shared`** (a package.json `imports` subpath)
- The client repo (`Samiul-portfolio-client`) keeps its own zod schemas. The two are deliberately independent — no shared package, no sync obligation. After any contract change, update both sides by hand and re-check the contract table below.
- **No** Redis, no Firebase, no serverless assumptions
- Reply to the user in **Bangla + English** when chatting (code and comments stay English)

---

## Hard rules (always)

1. **Read before write** — open `src/modules/projects/` and copy its naming and nesting.
2. **Surgical diffs** — only touch what the task needs; no drive-by refactors.
3. **No secrets** in commits. `.env.development` is gitignored; production values live on Koyeb.
4. **Errors:** throw `ApiError` (or its statics: `ApiError.notFound(...)`) from services; `middleware/errorHandler.ts` formats every one of them. Express 5 forwards rejected promises on its own — **do not** add an `asyncHandler` wrapper or a try/catch that only re-sends the error.
5. **Responses:** every success goes through `sendSuccess(res, message, data, status?)`, which emits `{ success: true, message, data }`. Never call `res.json()` with a bare payload, and never invent a second envelope. Serializers return `id`, never `_id`.
6. **Validation:** zod schema in `src/shared/schemas` + the `validate()` middleware, which `.parse()`s and replaces the request section. Unknown body keys are stripped, which doubles as the mass-assignment whitelist — never hand-roll a field list in a controller. A failure throws `ZodError`, which `errorHandler` turns into a 422 with per-field details.
7. **Type-only imports** use `import type` (`@typescript-eslint/consistent-type-imports` is an error), and relative imports carry the **`.js` extension** because the package is ESM/NodeNext.
8. `no-console` is a lint error. Only `server.ts`, `requestLog.ts`, `errorHandler.ts` and the scripts disable it.
9. Every changed line should trace back to the request.

---

## Layout

```
src/
  app.ts                   # createApp(): helmet, cors, compression, requestLog, /health, routes, errorHandler
  server.ts                # bootstrap: connect DB, listen, SIGTERM/SIGINT shutdown  ← entry point
  routes.ts                # export const routes — mounts each module's router
  config/
    env.ts                 # zod-validated process.env; also isProduction, isTest, corsOrigins
    db.ts                  # connectDatabase / disconnectDatabase
    cloudinary.ts          # SDK config, folder names, assertCloudinaryConfigured()
  middleware/              # errorHandler, validate, requireAuth, upload, rateLimit, requestLog
  models/                  # Project.ts, User.ts, schemaOptions.ts, index.ts (barrel)
  modules/
    projects/              # project.routes → project.controller → project.service → project.serializer
    auth/                  # + password.ts (bcrypt) and tokens.ts (jwt)
    resume/                # redirects to the Cloudinary-hosted PDF
  shared/
    index.ts               # the #shared barrel
    constants.ts
    types/api.ts           # ApiSuccessResponse / ApiErrorResponse
    schemas/               # common, auth, project
  scripts/                 # one-off: migrateProjectImagesToCloudinary, uploadResume
  test/                    # setup.ts (mongodb-memory-server) + helpers.ts (supertest client)
  types/express.d.ts       # req.auth
  utils/                   # ApiError, response.ts (sendSuccess)
```

Every module is `<domain>.routes.ts` → `<domain>.controller.ts` → `<domain>.service.ts` → `<domain>.serializer.ts`, with `<domain>.test.ts` beside them. Routers, handlers and classes are **named exports**; there are no default exports.

Responsibilities: routes wire middleware, controllers read the request and shape the response, services own the database and Cloudinary, serializers decide what leaves the API.

Domains: `projects` · `auth` · `resume`

---

## Still open, in order

1. Run the image data migration: existing documents still hold `image: { data: Buffer, contentType }` (see below). Until then every project serialises to an empty `image`.
2. Upload the resume PDF (`pnpm upload:resume`) and set `RESUME_PUBLIC_ID`. Until then `/api/v1/resume/download` answers 503.
3. Create the Koyeb service from the `Dockerfile` and delete the Vercel project.
4. Auth to httpOnly cookies — **last**, and only when a task explicitly asks.

---

## Images — Cloudinary

Uploads go `multer.memoryStorage()` → `sharp().resize(1920, 1080).webp({ quality: 80 })` → Cloudinary, and the document stores `image: { url, publicId }`. The serializer exposes only `image` as a URL string, so `publicId` never leaves the API. Deleting a project also destroys its Cloudinary asset, and a failed insert destroys the asset it just uploaded.

The 1920×1080 resize uses sharp's default `fit: 'cover'`, so every image is cropped to 16:9 on purpose — the client relies on those fixed dimensions for `next/image`.

Cloudinary keys are **optional** outside production so the API boots from a bare clone; anything that actually calls Cloudinary runs `assertCloudinaryConfigured()` first and answers 503 rather than failing inside the SDK. In production the keys are required and `config/env.ts` refuses to boot without them.

**The data migration has not been run yet:**

```bash
pnpm migrate:images     # uses .env.development
```

`src/scripts/migrateProjectImagesToCloudinary.ts` reads through the raw collection (the model no longer declares the old shape), uploads each buffer and rewrites the field. Re-running is safe — migrated documents no longer match `image.data`.

Afterwards, delete the two client-side workarounds that only existed for base64: `src/app/api/project-image/[projectId]/route.ts` and `src/utils/projectImage.ts`.

---

## Deployment — Koyeb

The `Dockerfile` installs with a frozen lockfile and runs `pnpm start`, i.e. `tsx src/server.ts`. Koyeb runs a normal long-lived Node process:

- `app.listen` stays; never add a serverless handler export
- `GET /health` sits **outside** the API prefix so the platform's probe never counts against the rate limit
- `app.set('trust proxy', 1)` — the platform terminates TLS, so client IPs arrive in headers and the rate limiter needs them
- Mongo connections survive between requests; in production `autoIndex` is off and `syncIndexes()` runs once at boot instead
- `SIGTERM`/`SIGINT` close the HTTP server, then the Mongo connection
- Nothing is read from or written to the container filesystem: images and the resume PDF both live in Cloudinary
- Set `CORS_ORIGIN` to the Vercel client origin (comma separated for more than one)

Vercel is gone: `vercel.json`, the committed `dist/`, `src/index.ts` and the `pre-commit`/`add-build` scripts have all been deleted. Do not bring them back.

---

## Auth

- `POST /api/auth/login` returns a JWT. `middleware/requireAuth.ts` reads `Authorization: Bearer <token>`, verifies it via `modules/auth/tokens.ts`, and puts `{ id }` on `req.auth`. A missing token is 401 `UNAUTHORIZED`; an invalid one is 401 `ACCESS_TOKEN_INVALID`.
- Exactly one account may exist: `auth.service.ts` compares against `ADMIN_EMAIL` before any database work. The address is **not** hardcoded anywhere.
- Hashing lives in `modules/auth/password.ts` (bcrypt, cost 12) — not in a schema hook. The `User` model is a plain document definition, and `schemaOptions.ts` strips `password` from `toJSON` as a backstop.
- Tokens are stateless. The old `user.tokens` array was removed — it grew without bound and nothing read it. Re-introduce it only if logout/revocation is actually needed.
- `authLimiter` (20 requests / 15 min / IP) guards the credential routes; `apiLimiter` (600) guards everything under the prefix. Counters are in memory because this runs as a single instance, and both are skipped in tests.
- **Planned (last step):** httpOnly cookies with `sameSite: 'none'` + `secure: true`, because the client is on Vercel and the API on Koyeb. Do not start this as a side effect of another task.
- No Redis — no refresh-token rotation, no OTP, no rate-limit store. This is a single-admin dashboard; do not add that machinery.

---

## API contract

Mounted under `env.API_PREFIX`, which defaults to `/api/v1`.

| Method | Path | Auth | `data` |
| --- | --- | --- | --- |
| GET | `/api/v1/project/getAllProjects` | – | project array, newest first; `image` is a Cloudinary URL |
| GET | `/api/v1/project/getProjectById/:id` | – | one project; 404 when missing, 422 on a malformed id |
| GET | `/api/v1/project/getProjectsForHomepage` | – | `showOnHomepage: true` only |
| POST | `/api/v1/project/create` | Bearer | the created project. Multipart, file field `image`, `frontEndTech`/`backEndTech` as JSON strings, max 2 MB, jpeg/jpg/png |
| PATCH | `/api/v1/project/updateShowOnHomePage/:id` | Bearer | the project with the flag flipped |
| PATCH | `/api/v1/project/updateProject/:id` | Bearer | the updated project. JSON, partial; unknown keys (`id`, `image`, timestamps) are stripped by the schema |
| DELETE | `/api/v1/project/deleteProject/:id` | Bearer | `null`; also destroys the Cloudinary asset |
| POST | `/api/v1/auth/login` | – | `{ user: { id, email }, token }`; 401 on bad credentials |
| POST | `/api/v1/auth/signUp` | – | same, 201; 409 on duplicate, 422 on validation |
| GET | `/api/v1/resume/download` | – | 302 to the Cloudinary PDF (not an envelope); 503 until `RESUME_PUBLIC_ID` is set |

Success: `{ success: true, message, data }`. Errors: `{ success: false, message, code, details? }`. Every project carries `id`, never `_id`. The client reads `data` and `error.response.data.message`, so keep both keys.

---

## Env

Declared and validated in `src/config/env.ts`. Import `env` from there — never read `process.env` anywhere else.

| Name | Notes |
| --- | --- |
| `DB_URL` | MongoDB connection string |
| `JWT_TOKEN` | JWT signing secret |
| `ADMIN_EMAIL` | the only address allowed to sign up or log in |
| `CORS_ORIGIN` | comma separated browser origins; defaults to `http://localhost:3002` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | optional in dev/test, required in production |
| `RESUME_PUBLIC_ID` | printed by `pnpm upload:resume` |
| `PORT` | defaults to 4000; the host injects its own |
| `API_PREFIX` | defaults to `/api/v1` |
| `JWT_TOKEN_TTL_DAYS` | defaults to 7 |
| `NODE_ENV` | `development` \| `test` \| `production` |

`dotenv` reads `.env.development` only and never overrides a key the platform already set. A missing or malformed variable throws at boot listing the offending names, instead of crashing inside a request later.

---

## Tests

`vitest` + `supertest` + `mongodb-memory-server`. `vitest.config.ts` injects the test env, so the suite needs no `.env` file and no running Mongo.

- `src/test/setup.ts` starts the in-memory server, builds indexes once, and truncates every collection after each test.
- `src/test/helpers.ts` exports the supertest client, `url()` (prefixes `API_PREFIX`), and `createAdmin()` which returns a signed token.
- Tests live next to the code as `<domain>.test.ts` and go through the real HTTP stack. Nothing reaches the network: paths that would call Cloudinary are covered at their guard (auth, validation, 404) rather than mocked.

---

## Run

```bash
pnpm install
cp .env.example .env.development
pnpm dev                # tsx watch, port 4000
pnpm test
pnpm lint
pnpm typecheck
pnpm build              # tsc → dist/ (typecheck/emit only; the container runs tsx)
pnpm migrate:images     # one-off
pnpm upload:resume      # one-off, prints RESUME_PUBLIC_ID
```

Health check: `GET /health`.

---

## What not to do

- Do not host this API on Vercel serverless or add serverless handler exports
- Do not add Redis, OTP flows, or refresh-token rotation
- Do not write image bytes into MongoDB, or read either the images or the resume off the filesystem
- Do not add `asyncHandler` or a controller `try/catch` that only forwards the error — Express 5 already does it
- Do not return a Mongoose document straight from a controller — go through the module's serializer and `sendSuccess`
- Do not expose `_id` — serializers emit `id`
- Do not read `process.env` outside `src/config/env.ts`
- Do not hand-write `res.status(500)` in a controller — throw `ApiError` and let `errorHandler` answer
- Do not use default exports, and do not drop the `.js` extension from a relative import
- Do not invent `services/` at the top level, `containers/`, or a parallel routing layer — modules own their own files
- Do not assume a monorepo or shared package — zod schemas are this repo's own `src/shared`
- Do not switch auth to cookies as a side effect of another task
