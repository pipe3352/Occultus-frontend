"use client";

import { EmptyState } from "@/components/empty-state";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ReceivedFileCard } from "@/components/received-file-card";
import { LoadingBlock } from "@/components/spinner";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listReceivedFiles } from "@/lib/api/files";
import { useFileList } from "@/lib/hooks/use-file-list";
import type { ReceivedFile } from "@/lib/types";

export default function ReceivedPage() {
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
  } = useFileList<ReceivedFile>(listReceivedFiles);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Received files"
        description="Files other users shared with you. Enter the password the sender gave you to decrypt and download."
        actions={
          <Button variant="outline" size="lg" disabled={loading} onClick={reload}>
            Refresh
          </Button>
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
              message="Could not load your received files."
              onRetry={reload}
              retrying={loading}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No files received"
              description="When someone shares an encrypted file with your account, it shows up here."
            />
          ) : (
            <ul className={loading ? "space-y-3 opacity-60" : "space-y-3"}>
              {items.map((file) => (
                <ReceivedFileCard
                  key={file.file_id}
                  file={file}
                  onExpiredDetected={reload}
                />
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
