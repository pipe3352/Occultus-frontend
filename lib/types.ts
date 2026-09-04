/**
 * TypeScript mirrors of the DTOs in `secureshare_backend/src/dtos.rs`.
 * Field names match the JSON produced by serde exactly.
 */

/** `FilterUserDto` */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  public_key: string | null;
  created_at: string;
  updated_at: string;
}

/** `UserResponseDto` */
export interface UserResponse {
  status: string;
  data: { user: ApiUser };
}

/** `Response` — generic `{ status, message }` payload. */
export interface MessageResponse {
  status: string;
  message: string;
}

/** `UserLoginResponseDto` */
export interface LoginResponse {
  status: string;
  token: string;
}

/**
 * `UserSendFileDto`.
 * NOTE: `file_id` here is `files.id` (see `get_sent_files` in db.rs).
 * It is *not* a share id and cannot be passed to `/file/retrieve`.
 */
export interface SentFile {
  file_id: string;
  file_name: string;
  recipient_email: string;
  expiration_date: string;
  created_at: string;
}

/** `UserSendFileListResponseDto` */
export interface SentFileListResponse {
  status: string;
  files: SentFile[];
  results: number;
}

/**
 * `UserReceiveFileDto`.
 * NOTE: `file_id` here is `shared_links.id` (see `get_receive_files` in db.rs),
 * which is exactly the `shared_id` expected by `POST /api/file/retrieve`.
 */
export interface ReceivedFile {
  file_id: string;
  file_name: string;
  sender_email: string;
  expiration_date: string;
  created_at: string;
}

/** `UserReceiveFileListResponseDto` */
export interface ReceivedFileListResponse {
  status: string;
  files: ReceivedFile[];
  results: number;
}

/** `EmailListResponseDto` */
export interface EmailListResponse {
  status: string;
  emails: { email: string }[];
}

/** `RegisterUserDto` — note the serde rename on `passwordConfirm`. */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

/** `LoginUserDto` */
export interface LoginPayload {
  email: string;
  password: string;
}

/** `UserPasswordUpdateDto` */
export interface PasswordUpdatePayload {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

/** `RetrieveFileDto` */
export interface RetrievePayload {
  shared_id: string;
  password: string;
}

export interface PageQuery {
  page: number;
  limit: number;
}
