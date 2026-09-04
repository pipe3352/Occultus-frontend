import { isExpired, relativeToNow } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A share link is usable only while `expiration_date > NOW()` (see `get_shared`
 * in db.rs); expired rows are also purged hourly by the backend scheduler.
 */
export function ExpiryBadge({ expirationDate }: { expirationDate: string }) {
  const expired = isExpired(expirationDate);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        expired
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {expired ? "Expired" : `Expires ${relativeToNow(expirationDate)}`}
    </span>
  );
}
