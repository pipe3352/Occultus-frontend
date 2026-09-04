"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { EmptyState } from "@/components/empty-state";
import { ErrorRetry } from "@/components/error-retry";
import { ExpiryBadge } from "@/components/expiry-badge";
import { PageHeader } from "@/components/page-header";
import { LoadingBlock } from "@/components/spinner";
import { StatusMessage } from "@/components/status-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listReceivedFiles, listSentFiles } from "@/lib/api/files";
import { toErrorDetails, toErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDateTime } from "@/lib/format";
import type { ReceivedFile, SentFile } from "@/lib/types";

interface Overview {
  sent: SentFile[];
  sentTotal: number;
  received: ReceivedFile[];
  receivedTotal: number;
}

interface OverviewState {
  /** Identifies the request that produced this snapshot ("" = none yet). */
  key: string;
  data: Overview | null;
  error: { message: string; details: string[] };
}

const EMPTY_ERROR = { message: "", details: [] as string[] };

export default function OverviewPage() {
  const { user, authRequest } = useAuth();

  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<OverviewState>({
    key: "",
    data: null,
    error: EMPTY_ERROR,
  });

  const key = String(reloadToken);
  const loading = state.key !== key;
  const { data, error } = state;

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    authRequest(async (token) => {
      const [sent, received] = await Promise.all([
        listSentFiles(token, { page: 1, limit: 5 }, controller.signal),
        listReceivedFiles(token, { page: 1, limit: 5 }, controller.signal),
      ]);
      return { sent, received };
    })
      .then(({ sent, received }) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          data: {
            sent: sent.files,
            sentTotal: sent.results,
            received: received.files,
            receivedTotal: received.results,
          },
          error: EMPTY_ERROR,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          data: null,
          error: {
            message: toErrorMessage(err),
            details: toErrorDetails(err),
          },
        });
      });

    return () => controller.abort();
  }, [authRequest, key]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={user ? `Hi, ${user.name}` : "Overview"}
        description="Send an encrypted file to another registered user, or download what has been shared with you."
        actions={<ButtonLink href="/send">Send a file</ButtonLink>}
      />

      <StatusMessage
        variant="error"
        message={error.message}
        details={error.details}
      />

      {loading && !data ? (
        <LoadingBlock />
      ) : error.message && !data ? (
        <ErrorRetry
          message="Could not load your files."
          onRetry={reload}
          retrying={loading}
        />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Files received"
              value={data.receivedTotal}
              href="/received"
              linkLabel="Open received"
            />
            <StatCard
              label="Files sent"
              value={data.sentTotal}
              href="/sent"
              linkLabel="Open sent"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Latest received</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.received.length === 0 ? (
                  <EmptyState
                    title="Nothing received yet"
                    description="Files shared with you will appear here."
                  />
                ) : (
                  data.received.map((file) => (
                    <RecentRow
                      key={file.file_id}
                      name={file.file_name}
                      meta={`From ${file.sender_email} · ${formatDateTime(file.created_at)}`}
                      expirationDate={file.expiration_date}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest sent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.sent.length === 0 ? (
                  <EmptyState
                    title="Nothing sent yet"
                    description="Upload a file to share it securely."
                    action={{ href: "/send", label: "Send a file" }}
                  />
                ) : (
                  data.sent.map((file) => (
                    <RecentRow
                      key={file.file_id}
                      name={file.file_name}
                      meta={`To ${file.recipient_email} · ${formatDateTime(file.created_at)}`}
                      expirationDate={file.expiration_date}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  linkLabel,
}: {
  label: string;
  value: number;
  href: string;
  linkLabel: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-3xl font-medium tabular-nums">
            {value}
          </p>
        </div>
        <Link
          href={href}
          className="text-sm underline underline-offset-4 hover:no-underline"
        >
          {linkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

function RecentRow({
  name,
  meta,
  expirationDate,
}: {
  name: string;
  meta: string;
  expirationDate: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <ExpiryBadge expirationDate={expirationDate} />
    </div>
  );
}
