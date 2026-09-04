"use client";

import { useState } from "react";

import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateName, updatePassword } from "@/lib/api/users";
import { toErrorDetails, toErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { MIN_PASSWORD_LENGTH } from "@/lib/config";
import { formatDateTime } from "@/lib/format";

const EMPTY_ERROR = { message: "", details: [] as string[] };

export default function AccountPage() {
  const { user, setUser, authRequest } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account"
        description="Your profile and credentials. Changes apply immediately on the backend."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Detail label="Name" value={user?.name ?? "—"} />
            <Detail label="Email" value={user?.email ?? "—"} />
            <Detail
              label="User id"
              value={user?.id ?? "—"}
              className="font-mono text-xs"
            />
            <Detail
              label="Encryption key"
              value={
                user?.public_key
                  ? "RSA key pair generated — you can receive files"
                  : "Missing — you cannot receive files"
              }
            />
            <Detail
              label="Created"
              value={user ? formatDateTime(user.created_at) : "—"}
            />
            <Detail
              label="Last updated"
              value={user ? formatDateTime(user.updated_at) : "—"}
            />
          </dl>
        </CardContent>
      </Card>

      <NameForm
        currentName={user?.name ?? ""}
        onUpdated={setUser}
        authRequest={authRequest}
      />
      <PasswordForm authRequest={authRequest} />
    </div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={className ? `break-all ${className}` : "break-words"}>
        {value}
      </dd>
    </div>
  );
}

type AuthRequest = ReturnType<typeof useAuth>["authRequest"];

function NameForm({
  currentName,
  onUpdated,
  authRequest,
}: {
  currentName: string;
  onUpdated: ReturnType<typeof useAuth>["setUser"];
  authRequest: AuthRequest;
}) {
  // `AppLayout` only renders this page once `/users/me` has resolved, so
  // `currentName` is already the backend value on the first render.
  const [name, setName] = useState(currentName);
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState(EMPTY_ERROR);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(EMPTY_ERROR);
    setSuccess("");

    if (!name.trim()) {
      setFieldError("Name is required.");
      return;
    }
    setFieldError("");

    setSubmitting(true);
    try {
      const response = await authRequest((token) =>
        updateName(token, name.trim()),
      );
      onUpdated(response.data.user);
      setSuccess("Name updated.");
    } catch (err) {
      setError({ message: toErrorMessage(err), details: toErrorDetails(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display name</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 sm:max-w-md"
        >
          <StatusMessage
            variant="error"
            message={error.message}
            details={error.details}
            onDismiss={() => setError(EMPTY_ERROR)}
          />
          <StatusMessage
            variant="success"
            message={success}
            onDismiss={() => setSuccess("")}
          />

          <FormField
            label="Name"
            value={name}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
            disabled={submitting}
            error={fieldError}
          />

          <SubmitButton
            type="submit"
            loading={submitting}
            loadingLabel="Saving…"
            disabled={name.trim() === currentName}
          >
            Save name
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm({ authRequest }: { authRequest: AuthRequest }) {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState(EMPTY_ERROR);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (form.old_password.length < MIN_PASSWORD_LENGTH)
      errors.old_password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (form.new_password.length < MIN_PASSWORD_LENGTH)
      errors.new_password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (form.new_password_confirm !== form.new_password)
      errors.new_password_confirm = "New passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(EMPTY_ERROR);
    setSuccess("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await authRequest((token) =>
        updatePassword(token, form),
      );
      setSuccess(response.message);
      setForm({ old_password: "", new_password: "", new_password_confirm: "" });
    } catch (err) {
      setError({ message: toErrorMessage(err), details: toErrorDetails(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 sm:max-w-md"
        >
          <StatusMessage
            variant="error"
            message={error.message}
            details={error.details}
            onDismiss={() => setError(EMPTY_ERROR)}
          />
          <StatusMessage
            variant="success"
            message={success}
            onDismiss={() => setSuccess("")}
          />

          <FormField
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={form.old_password}
            onChange={update("old_password")}
            disabled={submitting}
            error={fieldErrors.old_password}
          />
          <FormField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.new_password}
            onChange={update("new_password")}
            disabled={submitting}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            error={fieldErrors.new_password}
          />
          <FormField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={form.new_password_confirm}
            onChange={update("new_password_confirm")}
            disabled={submitting}
            error={fieldErrors.new_password_confirm}
          />

          <SubmitButton
            type="submit"
            loading={submitting}
            loadingLabel="Updating…"
          >
            Update password
          </SubmitButton>

          <p className="text-xs text-muted-foreground">
            Your current session stays valid after the change.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
