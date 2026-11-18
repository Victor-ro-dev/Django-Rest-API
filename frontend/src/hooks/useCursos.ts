import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Curso } from '../types/api';

interface UseCursosOptions {
  page: number;
  search: string;
  ordering: string;
}

export function useCursos({ page, search, ordering }: UseCursosOptions) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .listCursos({
        page,
        search: search || undefined,
        ordering,
        signal: controller.signal,
      })
      .then((data) => {
        setCursos(data.results);
        setTotalCount(data.count);
        setHasNext(Boolean(data.next));
        setHasPrev(Boolean(data.previous));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível conectar à API Django.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, search, ordering, refreshTick]);

  return { cursos, totalCount, hasNext, hasPrev, loading, error, refetch };
}
