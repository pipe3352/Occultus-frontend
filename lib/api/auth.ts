import { apiJson } from "@/lib/api/client";
import type {
  LoginPayload,
  LoginResponse,
  MessageResponse,
  RegisterPayload,
} from "@/lib/types";

/** `POST /api/auth/register` -> 201 `{ status, message }` (409 if email taken). */
export function register(payload: RegisterPayload) {
  return apiJson<MessageResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

/** `POST /api/auth/login` -> `{ status, token }` (400 on wrong credentials). */
export function login(payload: LoginPayload) {
  return apiJson<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}
