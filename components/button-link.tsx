import Link from "next/link";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

/**
 * Anchor styled as a button. Base UI's `Button` has no `asChild`, so links that
 * should look like buttons use the shared variants directly.
 */
export function ButtonLink({
  className,
  variant,
  size = "lg",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), "px-4", className)}
      {...props}
    />
  );
}
