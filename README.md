# Occultus — frontend

Next.js (App Router) client for the `Occultus` Axum API. Every screen
maps to an endpoint that actually exists in the Rust code; there are no mocks and
no invented features.

## Requirements

- Node.js 20+ (developed on 24)
- The Rust backend running on `http://localhost:8000`
- PostgreSQL, as configured in `Occultus/.env`

## Running

```bash
# 1. backend (from Occultus-backend/)
cargo run          # -> http://localhost:8000

# 2. frontend (from Occultus-frontend/)
npm install
npm run dev        # -> http://localhost:3000
```

The frontend **must** stay on port 3000: `Occultus/src/main.rs` pins
the CORS origin to `http://localhost:3000`. The `dev` and `start` scripts pass
`-p 3000` explicitly.

