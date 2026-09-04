"use client";

import { useCallback, useEffect, useState } from "react";

import { toErrorDetails, toErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { DEFAULT_PAGE_SIZE } from "@/lib/config";
import type { PageQuery } from "@/lib/types";

interface ListResponse<T> {
  files: T[];
  results: number;
}

type ListFetcher<T> = (
  token: string,
  query: PageQuery,
  signal?: AbortSignal,
) => Promise<ListResponse<T>>;

interface ListState<T> {
  /** Identifies which request produced this snapshot. */
  key: string;
  items: T[];
  total: number;
  error: { message: string; details: string[] };
}

const EMPTY_ERROR = { message: "", details: [] as string[] };

/**
 * Shared paging/loading/error state for `/api/list/send` and
 * `/api/list/receive`, which expose the same response shape.
 *
 * `loading` is derived by comparing the key of the request we want with the key
 * of the snapshot we hold, so the effect never sets state synchronously.
 */
export function useFileList<T>(fetcher: ListFetcher<T>) {
  const { authRequest } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<ListState<T>>({
    key: "",
    items: [],
    total: 0,
    error: EMPTY_ERROR,
  });

  const key = `${page}|${limit}|${reloadToken}`;
  const loading = state.key !== key;
  const loaded = state.key !== "";

  useEffect(() => {
    const controller = new AbortController();

    authRequest((token) => fetcher(token, { page, limit }, controller.signal))
      .then((response) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          items: response.files,
          total: response.results,
          error: EMPTY_ERROR,
        });
        // A page can go empty after files expire; fall back to the first one.
        if (response.files.length === 0 && page > 1) setPage(1);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          items: [],
          total: 0,
          error: {
            message: toErrorMessage(err),
            details: toErrorDetails(err),
          },
        });
      });

    return () => controller.abort();
  }, [authRequest, fetcher, page, limit, key]);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  const changeLimit = useCallback((next: number) => {
    setLimit(next);
    setPage(1);
  }, []);

  return {
    page,
    limit,
    items: state.items,
    total: state.total,
    loading,
    loaded,
    error: state.error,
    setPage,
    changeLimit,
    reload,
  };
}
