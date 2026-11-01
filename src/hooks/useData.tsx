import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse } from '../types.ts';

interface RefreshContextType {
  refreshCount: number;
  bumpRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshCount: 0,
  bumpRefresh: () => {},
});

// Module-level listener to allow calling bumpRefresh() even outside of components if needed
let globalBump: (() => void) | null = null;

export function bumpRefresh(): void {
  if (globalBump) {
    globalBump();
  }
}

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const bump = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    globalBump = bump;
    return () => {
      if (globalBump === bump) {
        globalBump = null;
      }
    };
  }, [bump]);

  return (
    <RefreshContext.Provider value={{ refreshCount, bumpRefresh: bump }}>
      {children}
    </RefreshContext.Provider>
  );
};

export function useRefresh() {
  return useContext(RefreshContext);
}

export interface UseDataResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
}

export function useData<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: any[] = []
): UseDataResult<T> {
  const { refreshCount } = useRefresh();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Keep latest fetcher in ref
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const runFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetcherRef.current();
      setData(res.data);
      setError(res.error);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetcherRef.current()
      .then(res => {
        if (!cancelled) {
          setData(res.data);
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // Include refreshCount so every screen refetches from DB whenever bumpRefresh() is called
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount, ...deps]);

  return {
    data,
    error,
    loading,
    reload: runFetch,
  };
}
