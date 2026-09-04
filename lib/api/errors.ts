/**
 * Normalised transport/API error.
 *
 * The backend answers failures with `{ "status": "fail", "message": "..." }`
 * (see `error.rs`). `validator` errors are multi-line strings such as
 * `email: Email is invalid\npassword: Password must be at least 6 characters`,
 * so we keep the individual lines in `details` for display.
 */
export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;
  /** One entry per line of the backend message. */
  readonly details: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details ?? [];
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

/** Turns a raw backend message into a headline + per-field detail lines. */
export function splitBackendMessage(raw: string): {
  message: string;
  details: string[];
} {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return { message: lines[0] ?? raw, details: [] };
  }
  return { message: "Some fields are invalid", details: lines };
}

/** Human-readable fallback for statuses the backend returns without a body. */
export function fallbackMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The request was rejected by the server.";
    case 401:
      return "You are not logged in, please sign in again.";
    case 404:
      return "The requested resource was not found.";
    case 405:
      return "This operation is not allowed by the server.";
    case 409:
      return "This record already exists.";
    case 413:
      return "The file is too large for the server to accept.";
    case 415:
      return "The server refused the request format.";
    case 422:
      return "The request body could not be read by the server.";
    case 500:
      return "The server ran into an internal error.";
    default:
      return `Unexpected server response (HTTP ${status}).`;
  }
}

/** Safe message extraction for anything thrown inside a handler. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function toErrorDetails(error: unknown): string[] {
  return error instanceof ApiError ? error.details : [];
}
