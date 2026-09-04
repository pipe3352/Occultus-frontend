"use client";

import { ButtonLink } from "@/components/button-link";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { ErrorRetry } from "@/components/error-retry";
import { ExpiryBadge } from "@/components/expiry-badge";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { LoadingBlock } from "@/components/spinner";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listSentFiles } from "@/lib/api/files";
import { formatDateTime } from "@/lib/format";
import { useFileList } from "@/lib/hooks/use-file-list";
import type { SentFile } from "@/lib/types";

export default function SentPage() {
  const {
    items,
    total,
    page,
    limit,
    loading,
    loaded,
    error,
    setPage,
    changeLimit,
    reload,
  } = useFileList<SentFile>(listSentFiles);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sent files"
        description="Everything you shared. Only the recipient can download a file, so there is no download action here."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              disabled={loading}
              onClick={reload}
            >
              Refresh
            </Button>
            <ButtonLink href="/send">Send a file</ButtonLink>
          </div>
        }
      />

      <StatusMessage
        variant="error"
        message={error.message}
        details={error.details}
      />

      <Card>
        <CardContent className="space-y-4">
          {loading && !loaded ? (
            <LoadingBlock />
          ) : error.message ? (
            <ErrorRetry
              message="Could not load your sent files."
              onRetry={reload}
              retrying={loading}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No files sent"
              description="Upload a file to share it with another registered user."
              action={{ href: "/send", label: "Send a file" }}
            />
          ) : (
            <ul className={loading ? "space-y-3 opacity-60" : "space-y-3"}>
              {items.map((file) => (
                <li
                  key={file.file_id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        To{" "}
                        <span className="text-foreground">
                          {file.recipient_email}
                        </span>
                      </p>
                    </div>
                    <ExpiryBadge expirationDate={file.expiration_date} />
                  </div>

                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Sent on</dt>
                      <dd>{formatDateTime(file.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Expires</dt>
                      <dd>{formatDateTime(file.expiration_date)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">File id</dt>
                      <dd className="flex items-center gap-1">
                        <code className="truncate font-mono">
                          {file.file_id}
                        </code>
                        <CopyButton value={file.file_id} label="Copy" />
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}

          {loaded && !error.message ? (
            <Pagination
              page={page}
              limit={limit}
              total={total}
              loading={loading}
              onPageChange={setPage}
              onLimitChange={changeLimit}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
