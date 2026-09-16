---
name: portfolio-api
description: >-
  Samiul portfolio API conventions (Express + Mongoose + TypeScript on Koyeb).
  Use when coding, scaffolding, refactoring, or reviewing anything in this API
  repository, or when the user mentions portfolio projects endpoints, admin
  login, resume download, project image uploads, Cloudinary, or the Koyeb
  deployment.
---

# Samiul Portfolio API

**Before writing code**, read the project guide:

→ [skills.md](../../../skills.md)

The shape is `src/modules/<domain>/` with routes → controller → service → serializer, zod in `src/shared` behind the `#shared` import, `ApiError` + a central `errorHandler`, named exports only, ESM (`.js` on relative imports), and a Koyeb/Docker runtime rather than Vercel serverless. Copy `src/modules/projects/`.

Keep the API contract table in the guide aligned with the client repo after any change.
