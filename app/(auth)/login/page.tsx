"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/form-field";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toErrorDetails, toErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { MIN_PASSWORD_LENGTH } from "@/lib/config";
import { isEmail } from "@/lib/format";

export default function LoginPage() {
  const router = useRouter();
  const { login, notice, clearNotice } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState({ message: "", details: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!isEmail(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError({ message: "", details: [] });
    clearNotice();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace("/");
    } catch (err) {
      setError({ message: toErrorMessage(err), details: toErrorDetails(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {notice ? (
            <StatusMessage
              variant="info"
              message={notice}
              onDismiss={clearNotice}
            />
          ) : null}
          <StatusMessage
            variant="error"
            message={error.message}
            details={error.details}
            onDismiss={() => setError({ message: "", details: [] })}
          />

          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            error={fieldErrors.email}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            error={fieldErrors.password}
          />

          <SubmitButton
            type="submit"
            loading={submitting}
            loadingLabel="Signing in…"
            className="w-full"
          >
            Sign in
          </SubmitButton>

          <p className="text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link href="/register" className="underline underline-offset-4">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
