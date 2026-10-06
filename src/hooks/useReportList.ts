import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getReportPage,
  getSummary,
  type ReportQuery,
} from '../data/reportRepository';
import type { Report, ReportSummary } from '../types';

export default function useReportList(query: ReportQuery) {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    total: 0,
    pendiente: 0,
    revision: 0,
    solucionado: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const generation = useRef(0);
  const morePending = useRef(false);
  const key = JSON.stringify(query);
  const currentKey = useRef(key);
  currentKey.current = key;
  const load = useCallback(async () => {
    const version = ++generation.current;
    try {
      const params = JSON.parse(key) as ReportQuery;
      const [page, counts] = await Promise.all([
        getReportPage(params),
        getSummary(!!params.own),
      ]);
      if (version !== generation.current || key !== currentKey.current) return;
      setReports(page.items);
      setCursor(page.nextCursor);
      setTotal(page.total);
      setSummary(counts);
      setError(null);
    } catch {
      if (version === generation.current && key === currentKey.current)
        setError('No pudimos actualizar los reportes. Intenta de nuevo.');
    } finally {
      if (version === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [key]);
  useEffect(
    () => () => {
      ++generation.current;
    },
    [],
  );
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);
  const loadMore = useCallback(async () => {
    if (!cursor || loading || refreshing || morePending.current) return;
    morePending.current = true;
    setLoadingMore(true);
    const version = generation.current;
    try {
      const page = await getReportPage({ ...JSON.parse(key), cursor });
      if (version !== generation.current || key !== currentKey.current) return;
      setReports(previous => [
        ...previous,
        ...page.items.filter(r => !previous.some(p => p.id === r.id)),
      ]);
      setCursor(page.nextCursor);
      setError(null);
    } catch (e) {
      if (version === generation.current)
        setError(
          e instanceof Error ? e.message : 'No pudimos cargar más reportes.',
        );
    } finally {
      morePending.current = false;
      setLoadingMore(false);
    }
  }, [cursor, key, loading, refreshing]);
  return {
    reports,
    summary,
    total,
    loading,
    refreshing,
    error,
    load,
    refresh,
    loadMore,
    loadingMore,
    hasMore: !!cursor,
  };
}
