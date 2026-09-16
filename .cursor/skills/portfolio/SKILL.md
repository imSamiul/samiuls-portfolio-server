---
name: portfolio-backend
description: >-
  Samiul portfolio backend conventions (Express + Mongoose + Cloudinary on
  Koyeb). Use when coding, scaffolding, refactoring, or reviewing anything in
  this API repository, or when the user mentions portfolio projects endpoints,
  admin login, resume download, project image uploads, Cloudinary, or the Koyeb
  deployment.
---

# Samiul Portfolio Backend

**Before writing code**, read the project guide:

→ [skills.md](../../../skills.md)

Then match existing files under `src/` — copy `src/modules/projects/`. Do not invent new folder layouts. Schemas live in `src/shared` (`#shared`), modules go routes → controller → service → serializer with named exports, and every relative import carries `.js`. Keep contracts aligned with the frontend repo's own copy.
