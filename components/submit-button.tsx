"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;

interface SubmitButtonProps extends Omit<ButtonProps, "children"> {
  loading?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
}

/**
 * Button that disables itself while a request is in flight, which is what keeps
 * users from firing the same mutation twice.
 */
export function SubmitButton({
  loading = false,
  loadingLabel,
  disabled,
  children,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("h-9 px-4", className)}
    >
      {loading ? <Spinner className="size-3.5" /> : null}
      {loading ? (loadingLabel ?? children) : children}
    </Button>
  );
}
