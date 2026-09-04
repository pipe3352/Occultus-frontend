"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { LoadingBlock } from "@/components/spinner";
import { useAuth } from "@/lib/auth/auth-context";

/** Client-side guard: every route below requires a valid JWT. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <LoadingBlock
          label={
            status === "loading" ? "Checking your session…" : "Redirecting…"
          }
        />
      </main>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 pb-6 text-xs text-muted-foreground sm:px-6">
        Files are encrypted with the recipient&apos;s RSA key and removed
        automatically once the share link expires.
      </footer>
    </>
  );
}
