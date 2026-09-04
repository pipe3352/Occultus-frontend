import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "@/lib/config";
import {
  ApiError,
  fallbackMessageForStatus,
  splitBackendMessage,
} from "@/lib/api/errors";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT";
  /** Plain object -> JSON body. FormData -> multipart body (no manual header). */
  body?: unknown;
  /** JWT from `POST /api/auth/login`, sent as `Authorization: Bearer <token>`. */
  token?: string | null;
  query?: Record<string, string | number | undefined>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/** Reads a failed response and converts it to an ApiError. */
async function buildApiError(response: Response): Promise<ApiError> {
  let raw = "";
  try {
    raw = await response.text();
  } catch {
    raw = "";
  }

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { message?: unknown };
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        const { message, details } = splitBackendMessage(parsed.message);
        return new ApiError(message, response.status, details);
      }
    } catch {
      // Not JSON: axum rejections (bad JSON body, 404, 405, 413) reply in
      // plain text. Use it only when it is short enough to be readable.
      const text = raw.trim();
      if (text && text.length <= 200) {
        return new ApiError(text, response.status);
      }
    }
  }

  return new ApiError(
    fallbackMessageForStatus(response.status),
    response.status,
  );
}

/**
 * Single entry point for every backend call.
 *
 * Auth uses the `Authorization: Bearer` branch of `middleware.rs`; cookies are
 * never sent (the request is cross-origin, so `fetch` omits them by default).
 */
export async function apiRequest(
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const {
    method = "GET",
    body,
    token,
    query,
    timeoutMs = REQUEST_TIMEOUT_MS,
    signal,
  } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      signal: controller.signal,
      // Cross-origin: rely on the Bearer token, not on the session cookie.
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    if (signal?.aborted) {
      throw new ApiError("The request was cancelled.", 0);
    }
    if (controller.signal.aborted) {
      throw new ApiError(
        "The server took too long to answer. Please try again.",
        0,
      );
    }
    throw new ApiError(
      `Cannot reach the backend at ${API_BASE_URL}. Make sure the Rust server is running.`,
      0,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }
  return response;
}

/** Performs a request and parses the JSON body. */
export async function apiJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await apiRequest(path, options);
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(
      "The server returned a response the app could not read.",
      response.status,
    );
  }
}

/** Performs a request and returns the raw binary body (file download). */
export async function apiBlob(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  const response = await apiRequest(path, options);
  return response.blob();
}
