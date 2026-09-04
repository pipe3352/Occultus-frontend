"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/** Copies a value (share id, email…) to the clipboard with inline feedback. */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={copy}
      className={className}
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Failed" : label}
    </Button>
  );
}
