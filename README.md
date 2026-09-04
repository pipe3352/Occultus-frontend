# SecureShare — frontend

Next.js (App Router) client for the `secureshare_backend` Axum API. Every screen
maps to an endpoint that actually exists in the Rust code; there are no mocks and
no invented features.

## Requirements

- Node.js 20+ (developed on 24)
- The Rust backend running on `http://localhost:8000`
- PostgreSQL, as configured in `secureshare_backend/.env`

## Running

```bash
# 1. backend (from secureshare_backend/)
cargo run          # -> http://localhost:8000

# 2. frontend (from secureshare_frontend/)
npm install
npm run dev        # -> http://localhost:3000
```

The frontend **must** stay on port 3000: `secureshare_backend/src/main.rs` pins
the CORS origin to `http://localhost:3000`. The `dev` and `start` scripts pass
`-p 3000` explicitly.

## Configuration

`.env` (see `.env.example`):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

The `NEXT_PUBLIC_` prefix is required — the value is read in the browser. If it
is missing the client falls back to `http://localhost:8000/api`.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server on port 3000               |
| `npm run build`     | Production build (runs TypeScript)    |
| `npm start`         | Serves the production build on 3000   |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run lint`      | ESLint                                |

## Endpoints used

| Screen        | Calls                                                              |
| ------------- | ------------------------------------------------------------------ |
| `/login`      | `POST /auth/login`, `GET /users/me`                                 |
| `/register`   | `POST /auth/register`, then login                                   |
| `/`           | `GET /list/send`, `GET /list/receive`                               |
| `/send`       | `GET /users/search-emails`, `POST /file/upload`                     |
| `/sent`       | `GET /list/send`                                                    |
| `/received`   | `GET /list/receive`, `POST /file/retrieve`                          |
| `/account`    | `GET /users/me`, `PUT /users/name`, `PUT /users/password`           |

## Auth

Login returns a JWT (valid 60 minutes) that is stored in `localStorage` and sent
as `Authorization: Bearer <token>`. The backend also sets an httpOnly cookie, but
it is unusable across origins, so requests are made with `credentials: "omit"`.
Any `401` clears the session and returns the user to `/login`.

## Known backend limits

- **Uploads are capped at ~2 MB.** Axum's default body limit is 2 MB and
  `upload_file` panics on `field.bytes().await.unwrap()` when it is exceeded,
  dropping the connection without an HTTP response. The client refuses larger
  files before sending.
- **There is no delete endpoint.** Shares disappear only when they expire; an
  hourly job in `main.rs` purges them.
- **Senders cannot download their own files.** `get_shared` filters on
  `recipient_user_id`, so only the recipient can retrieve.
