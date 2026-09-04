/**
 * Frontend configuration.
 *
 * The Rust backend is the source of truth. These values only describe how to
 * reach it and which limits it enforces.
 */

/** Base URL of the Axum API. Must include the `/api` prefix used in router.rs. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"
).replace(/\/+$/, "");

/** Timeout for normal JSON requests. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Uploads/downloads move real bytes, so they get a longer budget. */
export const TRANSFER_TIMEOUT_MS = 120_000;

/**
 * Axum applies a 2 MB default request body limit and the backend never raises
 * it (no `DefaultBodyLimit` layer in router.rs / main.rs). Worse, when the limit
 * is hit `upload_file` panics on `field.bytes().await.unwrap()` and the
 * connection is dropped without any HTTP response — the browser only sees a
 * network failure. So the frontend must refuse oversized files itself.
 *
 * The cap below is the 2 MB body limit minus headroom for the multipart
 * boundaries and the three text fields that travel with the file.
 */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 - 16 * 1024;

/** `RequestQueryDto` validates `limit` with range(min = 1, max = 50). */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** `UserPasswordUpdateDto` / `FileUploadDtos` require at least 6 characters. */
export const MIN_PASSWORD_LENGTH = 6;
