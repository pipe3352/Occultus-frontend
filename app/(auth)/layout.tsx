"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingBlock } from "@/components/spinner";
import { useAuth } from "@/lib/auth/auth-context";

/** Centered shell for the public screens; bounces signed-in users to the app. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <LoadingBlock label="Checking your session…" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="font-heading text-lg font-semibold tracking-tight">
            SecureShare
          </p>
          <p className="text-sm text-muted-foreground">
            End-to-end encrypted file sharing
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
