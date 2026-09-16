# Claude instructions

The conventions for this repository live in [`skills.md`](./skills.md). **Read it before writing or reviewing code here**, and follow it over generic Express advice.

Short version:

- Express 5 + Mongoose 9 + TypeScript (ESM, NodeNext), run by `tsx` locally and deployed to **Vercel's zero-config Express** runtime. The default export in `src/app.ts` is the deployment; `server.ts` keeps `app.listen` for local and Docker.
- The layout is `src/modules/<domain>/` with routes → controller → service → serializer. Named exports only, `.js` extensions on relative imports, no `asyncHandler` (Express 5 forwards rejected promises).
- Zod lives in `src/shared` and is independent from the client repo's copy. Update both sides by hand after a contract change.
- No Redis. Auth stays Bearer JWT until a task explicitly asks for the httpOnly cookie migration.
- Project images and the resume PDF live in Cloudinary; nothing is read from or written to the filesystem, and no image bytes go into MongoDB.
- Chat in Bangla + English; code and comments stay English.
