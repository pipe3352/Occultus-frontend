"use client";

import { useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { ExpiryBadge } from "@/components/expiry-badge";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { retrieveFile } from "@/lib/api/files";
import { toErrorDetails, toErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { MIN_PASSWORD_LENGTH } from "@/lib/config";
import { downloadBlob, formatDateTime, isExpired, isUuid } from "@/lib/format";
import type { ReceivedFile } from "@/lib/types";

/**
 * One received share, with the inline password prompt used by
 * `POST /api/file/retrieve`.
 */
export function ReceivedFileCard({
  file,
  onExpiredDetected,
}: {
  file: ReceivedFile;
  onExpiredDetected?: () => void;
}) {
  const { authRequest } = useAuth();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState({ message: "", details: [] as string[] });
  const [success, setSuccess] = useState("");

  const expired = isExpired(file.expiration_date);

  async function handleDownload(event: React.FormEvent) {
    event.preventDefault();
    if (downloading) return;
    setError({ message: "", details: [] });
    setSuccess("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError({
        message: `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        details: [],
      });
      return;
    }
    // The backend unwraps the UUID parse, so a malformed id would panic it.
    if (!isUuid(file.file_id)) {
      setError({ message: "This share has an invalid identifier.", details: [] });
      return;
    }

    setDownloading(true);
    try {
      const blob = await authRequest((token) =>
        retrieveFile(token, { shared_id: file.file_id, password }),
      );
      downloadBlob(blob, file.file_name);
      setSuccess(`“${file.file_name}” has been downloaded.`);
      setPassword("");
      setOpen(false);
    } catch (err) {
      const message = toErrorMessage(err);
      setError({ message, details: toErrorDetails(err) });
      // "does not exist or has expired" also covers links that expired between
      // the list request and this one; refresh so the list stays truthful.
      if (message.toLowerCase().includes("expired")) onExpiredDetected?.();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium" title={file.file_name}>
            {file.file_name}
          </p>
          <p className="text-sm text-muted-foreground">
            From <span className="text-foreground">{file.sender_email}</span>
          </p>
        </div>
        <ExpiryBadge expirationDate={file.expiration_date} />
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Shared on</dt>
          <dd>{formatDateTime(file.created_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expires</dt>
          <dd>{formatDateTime(file.expiration_date)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">Share id</dt>
          <dd className="flex items-center gap-1">
            <code className="truncate font-mono">{file.file_id}</code>
            <CopyButton value={file.file_id} label="Copy" />
          </dd>
        </div>
      </dl>

      <div className="mt-3 space-y-3">
        <StatusMessage
          variant="success"
          message={success}
          onDismiss={() => setSuccess("")}
        />
        <StatusMessage
          variant="error"
          message={error.message}
          details={error.details}
          onDismiss={() => setError({ message: "", details: [] })}
        />

        {expired ? (
          <p className="text-xs text-muted-foreground">
            This link has expired and can no longer be downloaded.
          </p>
        ) : open ? (
          <form
            onSubmit={handleDownload}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-1.5 sm:max-w-xs">
              <Label htmlFor={`password-${file.file_id}`}>
                Download password
              </Label>
              <Input
                id={`password-${file.file_id}`}
                type="password"
                autoComplete="off"
                autoFocus
                value={password}
                disabled={downloading}
                onChange={(event) => setPassword(event.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex gap-2">
              <SubmitButton
                type="submit"
                loading={downloading}
                loadingLabel="Decrypting…"
              >
                Download
              </SubmitButton>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={downloading}
                onClick={() => {
                  setOpen(false);
                  setPassword("");
                  setError({ message: "", details: [] });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button type="button" size="lg" onClick={() => setOpen(true)}>
            Download
          </Button>
        )}
      </div>
    </li>
  );
}
