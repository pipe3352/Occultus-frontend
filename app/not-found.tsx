import { ButtonLink } from "@/components/button-link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="space-y-4 text-center">
        <p className="font-heading text-lg font-medium">Page not found</p>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <ButtonLink href="/">Back to overview</ButtonLink>
      </div>
    </main>
  );
}
