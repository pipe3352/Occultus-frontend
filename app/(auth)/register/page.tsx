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

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState({ message: "", details: [] as string[] });
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!isEmail(form.email)) errors.email = "Enter a valid email address.";
    if (form.password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (form.passwordConfirm !== form.password)
      errors.passwordConfirm = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError({ message: "", details: [] });
    setSuccess("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Registration also generates the user's RSA key pair on the backend,
      // which is what makes the account a valid file recipient.
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });
      setSuccess("Account created. Signing you in…");
      await login({ email: form.email.trim(), password: form.password });
      router.replace("/");
    } catch (err) {
      setSuccess("");
      setError({ message: toErrorMessage(err), details: toErrorDetails(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <StatusMessage
            variant="error"
            message={error.message}
            details={error.details}
            onDismiss={() => setError({ message: "", details: [] })}
          />
          <StatusMessage variant="success" message={success} />

          <FormField
            label="Name"
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
            disabled={submitting}
            error={fieldErrors.name}
          />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            disabled={submitting}
            error={fieldErrors.email}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            disabled={submitting}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            error={fieldErrors.password}
          />
          <FormField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.passwordConfirm}
            onChange={update("passwordConfirm")}
            disabled={submitting}
            error={fieldErrors.passwordConfirm}
          />

          <SubmitButton
            type="submit"
            loading={submitting}
            loadingLabel="Creating account…"
            className="w-full"
          >
            Create account
          </SubmitButton>

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
