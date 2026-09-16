# Samiul Portfolio API — Skill Guide

Use this file whenever you change code in the **server** repo. Match the documented target shape; do not invent new architecture.

Cursor loads `.cursor/skills/portfolio/` automatically when relevant. This file is the canonical overview (easy to `@skills.md`).

---

## Project

```
samiuls-portfolio-server   Express 4 + Mongoose + TypeScript → Koyeb (Docker)
```

- Package manager: **pnpm**
- Zod schemas/types: `src/shared` → this repo's **own** copy
- The client repo (`Samiul-portfolio-client`) keeps its own zod schemas. The two are deliberately independent — no shared package, no sync obligation. After any contract change, update both sides by hand and re-check the contract table below.
- **No** Redis, no Firebase, no serverless assumptions
- Reply to the user in **Bangla + English** when chatting (code and comments stay English)

---

## Hard rules (always)

1. **Read before write** — open `src/modules/projects/` and copy its naming and nesting.
2. **Surgical diffs** — only touch what the task needs; no drive-by refactors.
3. **No secrets** in commits. `.env.development` / `.env.production` are gitignored; production values live on the host.
4. **Errors:** throw `ApiError(status, message)` from services; `middleware/errorHandler.ts` formats it. Wrap async handlers in `asyncHandler` — Express 4 does not forward rejected promises.
5. **Validation:** zod schema in `src/shared/schemas` + `validate()` middleware. Unknown body keys are stripped, which doubles as the mass-assignment whitelist — never hand-roll a field list in a controller.
6. Every changed line should trace back to the request.

---

## Migration status (September 2026)

The `projects` domain is migrated and is **the reference implementation** — copy it when moving `auth` and `resume`.

```
src/
  app.ts                   # express app, cors, /health, route mounting, errorHandler
  server.ts                # awaits the DB, listens, handles SIGTERM  ← real entry
  index.ts                 # Vercel-only shim (exports app); dies with vercel.json
  routes.ts                # mounts everything under /api
  config/                  # env (zod, exits at boot), db (memoised), cloudinary
  middleware/              # requireAuth, validate, upload, errorHandler
  models/                  # project.model, user.model
  modules/projects/        # routes → controller → service → serializer
  shared/schemas/          # project + common zod schemas
  utils/                   # ApiError, asyncHandler
  scripts/                 # one-off data migrations
  controllers/ + routes/   # LEGACY: authController, resumeController and their routes
  types/                   # ProjectType, userType
```

Still open, in order:

1. `auth` and `resume` move into `src/modules/`, copying `modules/projects/`. Their controllers still hand-write status codes and call `console.log(error)`.
2. **`sendSuccess` envelope is deliberately absent.** Wrapping responses in `{ success, message, data }` changes every payload and would break the client, which reads arrays and objects directly. Land it together with the client change, never before.
3. Run the image data migration — the code path is ready but existing documents still hold Buffers (see below).
4. `/api/v1` prefix. Changes client paths, so both repos land together.
5. Koyeb: add a Dockerfile, then delete `vercel.json`, the committed `dist/`, the `pre-commit`/`add-build` scripts and `src/index.ts`.
6. Auth to httpOnly cookies — **last**, and only when a task explicitly asks.

Smaller items still open: `bcrypt` cost is 8 (12 is the current default), `/api/auth/login` has no rate limit, the allowed admin email is hardcoded twice inside `authController.ts`, there is no `helmet` or `compression`, there are no tests, `nodemon` is an unused dependency, and `eslint.config.mjs` imports `@eslint/eslintrc` without declaring it.

Domains: `projects` · `auth` · `resume`

---

## Images — Cloudinary

Uploads go `multer.memoryStorage()` → `sharp().resize(1920, 1080).webp({ quality: 80 })` → Cloudinary, and the document stores `image: { url, publicId }`. The serializer exposes only `image` as a URL string, so `publicId` never leaves the API. Deleting a project also destroys its Cloudinary asset, and a failed insert destroys the asset it just uploaded.

The 1920×1080 resize uses sharp's default `fit: 'cover'`, so every image is cropped to 16:9 on purpose — the client relies on those fixed dimensions for `next/image`.

**The data migration has not been run yet.** Existing documents still hold `image: { data: Buffer, contentType }`:

```bash
pnpm build
pnpm migrate:images                      # uses .env.development
cross-env NODE_ENV=production pnpm migrate:images   # for the live database
```

`src/scripts/migrateProjectImagesToCloudinary.ts` reads through the raw collection (the Mongoose model no longer declares the old shape), uploads each buffer and rewrites the field. Re-running is safe — migrated documents no longer match `image.data`.

Afterwards, delete the two client-side workarounds that only existed for base64: `src/app/api/project-image/[projectId]/route.ts` and `src/utils/projectImage.ts`.

---

## Deployment — Vercel → Koyeb

Koyeb runs a normal long-lived Node process, so the serverless workarounds go away:

- `app.listen` **stays** (do not add a serverless handler export)
- Bind to `0.0.0.0` and read Koyeb's `PORT`
- Build in Docker; **committed `dist/` is no longer needed** — delete it from git, delete `vercel.json`, drop the `pre-commit` / `add-build` scripts
- Add `GET /health` outside the API prefix for Koyeb's health check
- `sharp`'s native binary and `public/assets/Samiul_Resume.pdf` both just work inside the image (on Vercel the `includeFiles: ["dist/**"]` config excluded `public/`, so resume download is likely broken in production today — verify before and after)
- Mongo connections survive between requests, so no connection-caching workaround is needed
- Set `CORS_ORIGIN`/the cors whitelist to the Vercel client origin

---

## Auth

- **Current:** `POST /api/auth/login` returns a JWT; `src/middleware/requireAuth.ts` reads `Authorization: Bearer <token>` and verifies it, answering 401 for a missing or invalid token. `JWT_TOKEN` is validated at boot, so there is no misconfiguration branch left in the request path.
- Tokens are stateless. The old `user.tokens` array was removed — it grew without bound and nothing ever read it. Re-introduce it only if logout/revocation is actually needed.
- **Planned (last step):** httpOnly cookies with `sameSite: 'none'` + `secure: true`, because the client is on Vercel and the API on Koyeb. Do not start this as a side effect of another task.
- No Redis — no refresh-token rotation, no OTP, no rate-limit store. This is a single-admin dashboard; do not add that machinery.

---

## API contract

Everything is mounted under `/api/...` today; `/api/v1` is planned (step 4 above).

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/project/getAllProjects` | – | newest first; `image` is a Cloudinary URL |
| GET | `/api/project/getProjectById/:id` | – | 404 when missing, 400 on a malformed id |
| GET | `/api/project/getProjectsForHomepage` | – | `showOnHomepage: true` only |
| POST | `/api/project/create` | Bearer | multipart, file field `image`, `frontEndTech`/`backEndTech` as JSON strings, max 2MB, jpeg/jpg/png |
| PATCH | `/api/project/updateShowOnHomePage/:id` | Bearer | toggles the flag |
| PATCH | `/api/project/updateProject/:id` | Bearer | JSON; partial. Unknown keys (`_id`, `image`, timestamps) are stripped by the schema |
| DELETE | `/api/project/deleteProject/:id` | Bearer | |
| POST | `/api/auth/login` | – | 200 + `{ token }`; 401 on bad credentials |
| POST | `/api/auth/signup` | – | 409 duplicate email, 400 validation |
| GET | `/api/resume/download` | – | PDF from `public/assets/` |

Errors are `{ message: string }`. The client reads `error.response.data.message`, so keep that key when the error envelope changes.

---

## Env

All of these are declared and validated in `src/config/env.ts`. Import `env` from there — never read `process.env` anywhere else.

| Name | Notes |
| --- | --- |
| `DB_URL` | MongoDB connection string |
| `JWT_TOKEN` | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary → Settings → API Keys |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |
| `PORT` | defaults to 3000; the host injects its own |
| `NODE_ENV` | picks `.env.development` or `.env.production` |

A missing or malformed variable makes the process exit at boot listing the offending names, instead of crashing inside a request later. `.env.example` holds the full list; on a hosted runtime the values come from the platform and the `dotenv` call is a local-only convenience.

---

## Run

```bash
pnpm install
cp .env.example .env.development
pnpm start              # ts-node-dev on src/server.ts, port 3000
pnpm lint
pnpm build              # tsc → dist/
pnpm migrate:images     # one-off, needs pnpm build first
```

Health check: `GET /health`.

Note: `eslint.config.mjs` imports `@eslint/eslintrc` but it is not a declared dependency — it currently resolves transitively. Make it an explicit devDependency before wiring lint into a git hook or CI.

---

## What not to do

- Do not host this API on Vercel serverless or add serverless handler exports
- Do not add Redis, OTP flows, or refresh-token rotation
- Do not write image bytes into MongoDB
- Do not return a Mongoose document straight from a controller — go through the module's serializer
- Do not read `process.env` outside `src/config/env.ts`
- Do not hand-write `res.status(500)` in a controller — throw `ApiError` and let `errorHandler` answer
- Do not invent `services/` at the top level, `containers/`, or a parallel routing layer — modules own their own files
- Do not assume a monorepo or shared package — zod schemas are this repo's own `src/shared`
- Do not switch auth to cookies as a side effect of another task
