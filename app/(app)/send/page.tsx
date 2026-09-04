"use client";

import { useRef, useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { FormField } from "@/components/form-field";
import { RecipientEmailField } from "@/components/recipient-email-field";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { uploadFile } from "@/lib/api/files";
import { ApiError, toErrorDetails, toErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { MAX_UPLOAD_BYTES, MIN_PASSWORD_LENGTH } from "@/lib/config";
import {
  defaultExpirationInput,
  formatBytes,
  isEmail,
  localInputToRfc3339,
  minExpirationInput,
} from "@/lib/format";

export default function SendPage() {
  const { authRequest } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipient, setRecipient] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [expiration, setExpiration] = useState(() => defaultExpirationInput());

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState({ message: "", details: [] as string[] });
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errors: Record<string, string> = {};

    if (!recipient.trim()) errors.recipient = "Recipient email is required.";
    else if (!isEmail(recipient))
      errors.recipient = "Enter a valid email address.";

    if (!file) errors.file = "Choose a file to send.";
    else if (file.size === 0) errors.file = "The selected file is empty.";
    else if (file.size > MAX_UPLOAD_BYTES)
      errors.file = `The backend rejects uploads larger than ${formatBytes(
        MAX_UPLOAD_BYTES,
      )} (Axum default body limit). This file is ${formatBytes(file.size)}.`;

    if (password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (passwordConfirm !== password)
      errors.passwordConfirm = "Passwords do not match.";

    const iso = localInputToRfc3339(expiration);
    if (!iso) errors.expiration = "Expiration date is required.";
    else if (new Date(iso).getTime() <= Date.now())
      errors.expiration = "Expiration date must be in the future.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetForm() {
    setFile(null);
    setPassword("");
    setPasswordConfirm("");
    setRecipient("");
    setExpiration(defaultExpirationInput());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError({ message: "", details: [] });
    setSuccess("");
    if (!validate() || !file) return;

    const expirationDate = localInputToRfc3339(expiration);
    if (!expirationDate) return;

    setSubmitting(true);
    try {
      const response = await authRequest((token) =>
        uploadFile(token, {
          file,
          recipientEmail: recipient.trim(),
          password,
          expirationDate,
        }),
      );
      setSuccess(
        `${response.message} Share the password with ${recipient.trim()} through a separate channel — it is the only way they can open the file.`,
      );
      resetForm();
    } catch (err) {
      const details = toErrorDetails(err);
      // A dropped connection during an upload is almost always the server's
      // 2 MB body limit, which it enforces by closing the socket.
      if (err instanceof ApiError && err.isNetworkError) {
        details.push(
          `The upload was interrupted. Files above ${formatBytes(
            MAX_UPLOAD_BYTES,
          )} are refused by the server.`,
        );
      }
      setError({ message: toErrorMessage(err), details });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send a file"
        description="The file is encrypted on the server with the recipient's public key. Only that account can download it, and only before the expiration date."
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <StatusMessage
              variant="error"
              message={error.message}
              details={error.details}
              onDismiss={() => setError({ message: "", details: [] })}
            />
            <StatusMessage
              variant="success"
              message={success}
              onDismiss={() => setSuccess("")}
            />

            <RecipientEmailField
              value={recipient}
              onChange={setRecipient}
              disabled={submitting}
              error={fieldErrors.recipient}
            />

            <div className="space-y-1.5">
              <Label htmlFor="file-upload">File</Label>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                disabled={submitting}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm file:font-medium focus-visible:border-ring disabled:opacity-50"
              />
              {fieldErrors.file ? (
                <p className="text-xs text-destructive">{fieldErrors.file}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {file
                    ? `${file.name} · ${formatBytes(file.size)}`
                    : `Maximum ${formatBytes(MAX_UPLOAD_BYTES)} per file.`}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Download password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                error={fieldErrors.password}
              />
              <FormField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                disabled={submitting}
                error={fieldErrors.passwordConfirm}
              />
            </div>

            <FormField
              label="Expires on"
              type="datetime-local"
              value={expiration}
              min={minExpirationInput()}
              onChange={(event) => setExpiration(event.target.value)}
              disabled={submitting}
              hint="After this moment the link stops working and the file is deleted by the server."
              error={fieldErrors.expiration}
            />

            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton
                type="submit"
                loading={submitting}
                loadingLabel="Encrypting and uploading…"
              >
                Send file
              </SubmitButton>
              <ButtonLink href="/sent" variant="outline">
                View sent files
              </ButtonLink>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Before you send</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              The recipient must already have a SecureShare account — the server
              encrypts with their stored public key.
            </li>
            <li>
              The download password is set here and is never sent to the
              recipient automatically. Share it yourself.
            </li>
            <li>
              You cannot download your own sent file: retrieval is restricted to
              the recipient account.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
