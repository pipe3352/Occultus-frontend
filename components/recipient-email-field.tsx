"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/spinner";
import { searchEmails } from "@/lib/api/users";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";

interface RecipientEmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Recipient picker backed by `GET /api/users/search-emails`.
 *
 * The endpoint only returns *other* users that already own a public key, i.e.
 * the exact set of addresses `POST /api/file/upload` can encrypt for. Free text
 * is still allowed so the form is never blocked by the lookup.
 */
export function RecipientEmailField({
  value,
  onChange,
  disabled,
  error,
}: RecipientEmailFieldProps) {
  const id = useId();
  const { authRequest } = useAuth();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [open, setOpen] = useState(false);
  const [searchedFor, setSearchedFor] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const term = value.trim();

  useEffect(() => {
    // The endpoint rejects an empty `query`, and nothing is shown for a blank
    // field anyway, so no request is made and no state needs resetting.
    if (!term) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError("");
      authRequest((token) => searchEmails(token, term, controller.signal))
        .then((response) => {
          if (controller.signal.aborted) return;
          setSuggestions(response.emails.map((entry) => entry.email));
          setSearchedFor(term);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          // A failing lookup must not block the form; show it inline only.
          setSearchError(
            err instanceof ApiError && err.isNetworkError
              ? "Lookup unavailable (backend unreachable)."
              : "Could not search for recipients.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [term, authRequest]);

  // Close the dropdown when clicking outside of the field.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Every derived flag is gated on a non-empty term so leftover results from a
  // previous term are never shown after the field is cleared.
  const showDropdown = open && term.length > 0;
  const isSearching = searching && term.length > 0;
  const lookupError = term.length > 0 ? searchError : "";
  const noMatches =
    showDropdown &&
    !isSearching &&
    !lookupError &&
    suggestions.length === 0 &&
    searchedFor === term;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <Label htmlFor={id}>Recipient email</Label>

      <div className="relative">
        <Input
          id={id}
          type="email"
          autoComplete="off"
          spellCheck={false}
          placeholder="name@example.com"
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="h-9 pr-8"
        />
        {isSearching ? (
          <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground">
            <Spinner className="size-3.5" />
          </span>
        ) : null}

        {showDropdown && suggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-sm">
            {suggestions.map((email) => (
              <li key={email}>
                <button
                  type="button"
                  className="w-full truncate px-3 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    onChange(email);
                    setOpen(false);
                  }}
                >
                  {email}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : lookupError ? (
        <p className="text-xs text-muted-foreground">{lookupError}</p>
      ) : noMatches ? (
        <p className="text-xs text-muted-foreground">
          No registered user matches “{term}”. The recipient must have an account
          before you can send them a file.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Start typing to search registered users.
        </p>
      )}
    </div>
  );
}
