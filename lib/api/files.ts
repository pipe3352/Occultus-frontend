import { apiBlob, apiJson } from "@/lib/api/client";
import { TRANSFER_TIMEOUT_MS } from "@/lib/config";
import type {
  MessageResponse,
  PageQuery,
  ReceivedFileListResponse,
  RetrievePayload,
  SentFileListResponse,
} from "@/lib/types";

export interface UploadPayload {
  file: File;
  recipientEmail: string;
  password: string;
  /** RFC 3339 timestamp, must be in the future (validated by the backend). */
  expirationDate: string;
}

/**
 * `POST /api/file/upload` — multipart/form-data.
 *
 * Field names come straight from `handler/file.rs`: `fileUpload`,
 * `recipient_email`, `password`, `expiration_date`. Anything else is ignored.
 */
export function uploadFile(token: string, payload: UploadPayload) {
  const form = new FormData();
  form.append("fileUpload", payload.file, payload.file.name);
  form.append("recipient_email", payload.recipientEmail);
  form.append("password", payload.password);
  form.append("expiration_date", payload.expirationDate);

  return apiJson<MessageResponse>("/file/upload", {
    method: "POST",
    token,
    body: form,
    timeoutMs: TRANSFER_TIMEOUT_MS,
  });
}

/**
 * `POST /api/file/retrieve` — returns the decrypted file as a binary body.
 *
 * `shared_id` is `shared_links.id`, which the receive list exposes as
 * `file_id`. Only the recipient of a non-expired link can retrieve it.
 */
export function retrieveFile(token: string, payload: RetrievePayload) {
  return apiBlob("/file/retrieve", {
    method: "POST",
    token,
    body: payload,
    timeoutMs: TRANSFER_TIMEOUT_MS,
  });
}

/** `GET /api/list/send?page=&limit=` */
export function listSentFiles(
  token: string,
  { page, limit }: PageQuery,
  signal?: AbortSignal,
) {
  return apiJson<SentFileListResponse>("/list/send", {
    token,
    query: { page, limit },
    signal,
  });
}

/** `GET /api/list/receive?page=&limit=` */
export function listReceivedFiles(
  token: string,
  { page, limit }: PageQuery,
  signal?: AbortSignal,
) {
  return apiJson<ReceivedFileListResponse>("/list/receive", {
    token,
    query: { page, limit },
    signal,
  });
}
