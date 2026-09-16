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

1. **Read before write** — open an existing module and copy its naming and nesting. Until the first module lands, follow the target shape documented here.
2. **Surgical diffs** — only touch what the task needs; no drive-by refactors.
3. **No secrets** in commits. `.env.development` / `.env.production` are gitignored; production values live on Koyeb.
4. Every controller owns its status codes until the central error handler lands (see migration status).
5. Every changed line should trace back to the request.

---

## Migration status (September 2026)

**Nothing has been restructured yet.** The current tree is the pre-migration shape:

```
src/
  index.ts                 # app + listen + cors + route mounting, all in one file
  auth/auth.ts             # Bearer JWT middleware
  controllers/             # authController, projectController, resumeController
  routes/                  # authRoutes, projectRoutes, resumeRoutes
  models/                  # project.model, user.model
  db/mongoose.ts
  types/                   # ProjectType, userType
```

Target shape, mirroring the Bari Vara API:

```
src/
  app.ts                   # express app, middleware, route mounting (no listen)
  server.ts                # listen only
  routes.ts                # mounts modules under /api/v1
  config/                  # env (zod), db, cloudinary
  middleware/              # requireAuth, validate, errorHandler, upload
  models/                  # Project, User
  modules/<domain>/
    <domain>.routes.ts
    <domain>.controller.ts
    <domain>.service.ts
    <domain>.serializer.ts   # public DTO mapping
    <domain>.test.ts
  shared/schemas/          # zod (this repo's copy)
  utils/                   # ApiError, response
```

Migration order and open work:

1. `project` domain moves to `src/modules/projects/` first and becomes **the reference implementation** — every later module copies it.
2. Add `utils/ApiError.ts` + `utils/response.ts` (`sendSuccess`) + `middleware/errorHandler.ts`, then stop hand-writing `res.status(...).json({ message })` in controllers.
3. Add `shared/schemas/` zod + a `validate()` middleware; drop ad-hoc checks from controllers.
4. Split `index.ts` into `app.ts` / `server.ts` / `routes.ts` and move mounting to `/api/v1`. **This changes client paths — both repos must land together.**
5. Images move from MongoDB `Buffer` to **Cloudinary** (see below).
6. Deployment moves from Vercel to **Koyeb** (see below).
7. Auth moves from Bearer to httpOnly cookies — **last**, and only when the task explicitly asks.

Domains: `projects` · `auth` · `resume`

---

## Images — MongoDB Buffer → Cloudinary

Current: `multer.memoryStorage()` → `sharp().resize(1920, 1080)` → stored as `{ data: Buffer, contentType: String }` on the project document, and every read converts it to a base64 data URL.

This is the biggest structural problem in the repo: base64 payloads bloat every project response, cannot be CDN-cached or optimised by `next/image`, and push documents toward Mongo's 16MB limit. The client has two workarounds that exist only because of it (`src/app/api/project-image/[projectId]/route.ts` and `src/utils/projectImage.ts`).

The migration is not only new code:

- `image` field becomes a Cloudinary URL (+ `publicId` for deletes) in the model and in `ProjectType` — **in both repos**
- existing project documents need a **one-time data migration**: upload each stored buffer to Cloudinary, replace the field, then drop the old one
- delete the two client-side workarounds afterwards
- deleting a project must also delete its Cloudinary asset

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

- **Current:** `POST /api/auth/login` returns a JWT; `src/auth/auth.ts` reads `Authorization: Bearer <token>` and verifies it. 401 on missing/invalid token, 500 only when `JWT_TOKEN` is unset.
- **Planned (last step):** httpOnly cookies with `sameSite: 'none'` + `secure: true`, because the client is on Vercel and the API on Koyeb. Do not start this as a side effect of another task.
- No Redis — no refresh-token rotation, no OTP, no rate-limit store. This is a single-admin dashboard; do not add that machinery.

---

## API contract

Everything is mounted under `/api/...` today; `/api/v1` is planned (step 4 above).

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/project/getAllProjects` | – | image as base64 data URL |
| GET | `/api/project/getProjectById/:id` | – | 404 when missing |
| GET | `/api/project/getProjectsForHomepage` | – | `showOnHomepage: true` only |
| POST | `/api/project/create` | Bearer | multipart, file field `image`, `frontEndTech`/`backEndTech` as JSON strings, max 2MB, jpeg/jpg/png |
| PATCH | `/api/project/updateShowOnHomePage/:id` | Bearer | toggles the flag |
| PATCH | `/api/project/updateProject/:id` | Bearer | partial; only `UPDATABLE_PROJECT_FIELDS` |
| DELETE | `/api/project/deleteProject/:id` | Bearer | |
| POST | `/api/auth/login` | – | 200 + `{ token }`; 401 on bad credentials |
| POST | `/api/auth/signup` | – | 409 duplicate email, 400 validation |
| GET | `/api/resume/download` | – | PDF from `public/assets/` |

Errors are `{ message: string }`. The client reads `error.response.data.message`, so keep that key when the error envelope changes.

---

## Env

| Name | Notes |
| --- | --- |
| `DB_URL` | MongoDB connection string |
| `JWT_TOKEN` | JWT signing secret |
| `PORT` | 3000 dev / 4000 prod script default; Koyeb injects its own |
| `NODE_ENV` | picks `.env.development` or `.env.production` |

`src/index.ts` loads the file with `dotenv` by `NODE_ENV`. On Koyeb the values come from the dashboard, so that `dotenv.config` call is a local-only convenience.

---

## Run

```bash
pnpm install
pnpm start        # ts-node-dev on :3000
pnpm lint
pnpm build        # tsc → dist/
```

Note: `eslint.config.mjs` imports `@eslint/eslintrc` but it is not a declared dependency — it currently resolves transitively. Make it an explicit devDependency before wiring lint into a git hook or CI.

---

## What not to do

- Do not host this API on Vercel serverless or add serverless handler exports
- Do not add Redis, OTP flows, or refresh-token rotation
- Do not keep writing image bytes into MongoDB
- Do not skip serializers for public entity responses once they exist
- Do not invent `services/` at the top level, `containers/`, or a parallel routing layer — modules own their own files
- Do not assume a monorepo or shared package — zod schemas are this repo's own `src/shared`
- Do not switch auth to cookies as a side effect of another task
