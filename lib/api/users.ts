import { apiJson } from "@/lib/api/client";
import type {
  EmailListResponse,
  MessageResponse,
  PasswordUpdatePayload,
  UserResponse,
} from "@/lib/types";

/** `GET /api/users/me` */
export function getMe(token: string, signal?: AbortSignal) {
  return apiJson<UserResponse>("/users/me", { token, signal });
}

/** `PUT /api/users/name` -> the updated user. */
export function updateName(token: string, name: string) {
  return apiJson<UserResponse>("/users/name", {
    method: "PUT",
    token,
    body: { name },
  });
}

/** `PUT /api/users/password` -> `{ status, message }`. */
export function updatePassword(token: string, payload: PasswordUpdatePayload) {
  return apiJson<MessageResponse>("/users/password", {
    method: "PUT",
    token,
    body: payload,
  });
}

/**
 * `GET /api/users/search-emails?query=...`
 *
 * The backend wraps the term in `%...%` and only returns other users that
 * already have a public key (i.e. valid recipients). `query` is required and
 * must not be empty, so callers must guard against blank input.
 */
export function searchEmails(
  token: string,
  query: string,
  signal?: AbortSignal,
) {
  return apiJson<EmailListResponse>("/users/search-emails", {
    token,
    query: { query },
    signal,
  });
}
