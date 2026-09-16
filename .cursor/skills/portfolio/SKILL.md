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

This repo is still in its pre-migration shape (`src/controllers/` + `src/routes/`), so do not copy the existing layout. The guide documents the target — `src/modules/<domain>/` with routes → controller → service → serializer, zod in `src/shared`, `ApiError` + central `errorHandler`, and a Koyeb/Docker runtime rather than Vercel serverless.

Keep the API contract table in the guide aligned with the client repo after any change.
