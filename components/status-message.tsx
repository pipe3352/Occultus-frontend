import { cn } from "@/lib/utils";

export type StatusVariant = "error" | "success" | "info";

const variantStyles: Record<StatusVariant, string> = {
  error: "border-destructive/35 bg-destructive/5 text-destructive",
  success: "border-success/35 bg-success/5 text-success",
  info: "border-border bg-muted/40 text-muted-foreground",
};

const variantLabel: Record<StatusVariant, string> = {
  error: "Error",
  success: "Success",
  info: "Note",
};

interface StatusMessageProps {
  variant: StatusVariant;
  message: string;
  /** Extra lines, typically one per invalid field returned by the backend. */
  details?: string[];
  onDismiss?: () => void;
  className?: string;
}

/**
 * Single place where backend failures become visible UI. Never rendered when
 * `message` is empty, so callers can pass state straight through.
 */
export function StatusMessage({
  variant,
  message,
  details,
  onDismiss,
  className,
}: StatusMessageProps) {
  if (!message) return null;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium break-words">
          <span className="sr-only">{variantLabel[variant]}: </span>
          {message}
        </p>
        {details && details.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-4 opacity-90">
            {details.map((detail) => (
              <li key={detail} className="break-words">
                {detail}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-mr-1 shrink-0 rounded px-1 text-xs opacity-70 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
