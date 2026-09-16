# Agent instructions

The conventions for this repository live in [`skills.md`](./skills.md). **Read it before writing or reviewing code here**, and follow it over generic Express advice.

Short version:

- Express + Mongoose + TypeScript, deployed to **Koyeb with Docker**. Not Vercel serverless — `app.listen` stays.
- The repo has **not** been restructured yet. `src/controllers/` and `src/routes/` are the legacy shape; the target is `src/modules/<domain>/` with routes → controller → service → serializer, as documented in `skills.md`.
- Zod lives in `src/shared` and is independent from the client repo's copy. Update both sides by hand after a contract change.
- No Redis. Auth stays Bearer JWT until a task explicitly asks for the httpOnly cookie migration.
- Project images are moving from MongoDB `Buffer` to Cloudinary; do not add new code that writes image bytes into MongoDB.
- Chat in Bangla + English; code and comments stay English.
