# Samiul Portfolio — Bruno API collection

Open this folder in [Bruno](https://www.usebruno.com/) (**Open Collection** → select `bruno/`).

## Setup

1. Copy `.env.example` → `.env.development` and fill in `DB_URL`, `JWT_TOKEN` and `ADMIN_EMAIL`
2. Start the API: `pnpm dev`
3. In Bruno, select the **Local** environment
4. Set `adminEmail` and `password` to match the server's `ADMIN_EMAIL`
5. Run **Auth → Sign Up** once, then **Auth → Login** before any protected route

## Bearer auth

The API uses a Bearer JWT, not cookies. **Auth → Login** has a post-response
script that writes the token into the `token` variable, and the collection's
bearer auth reads it — so protected requests with `auth: inherit` just work.
No cookie jar needed.

The httpOnly cookie migration is the last planned change; when it lands, this
section and the login script go away.

## Variables

| Variable     | Purpose                                             |
| ------------ | --------------------------------------------------- |
| `baseUrl`    | API host, no trailing slash                         |
| `apiPrefix`  | Usually `/api/v1`                                   |
| `adminEmail` | Must equal the server's `ADMIN_EMAIL`               |
| `password`   | Admin password, at least 6 characters               |
| `projectId`  | Set automatically by Create Project; also copyable from List Projects |
| `token`      | Set automatically by Sign Up / Login                |

## Folders

| Folder   | Contents                                                  |
| -------- | --------------------------------------------------------- |
| Health   | Liveness, outside the API prefix                          |
| Auth     | Sign up and login for the single admin account            |
| Projects | Public reads; admin create, update, homepage toggle, delete |
| Resume   | 302 to the Cloudinary-hosted PDF                          |

## Notes

- Create Project is multipart and needs a real file — use Bruno's file picker to
  replace the placeholder path in the `image` field.
- `frontEndTech` / `backEndTech` are JSON array **strings** in Create (multipart
  is all text) but real arrays in Update (JSON).
- A project whose `image` comes back empty still holds the pre-Cloudinary buffer.
  Run `pnpm migrate:images`.
- Credential routes allow 20 requests per 15 minutes per IP; everything else
  under the prefix allows 600.
