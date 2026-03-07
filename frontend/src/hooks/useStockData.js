import { useState, useCallback, useRef } from 'react';
import { fetchStockData, fetchNews } from '../api/stockApi';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useStockData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef(new Map());

  const loadStock = useCallback(async (symbol) => {
    setError(null);

    const cached = cache.current.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setData(null);
    try {
      const [stockResult, newsResult] = await Promise.all([
        fetchStockData(symbol),
        fetchNews(symbol),
      ]);
      const result = { ...stockResult, news: newsResult.news };
      cache.current.set(symbol, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, loadStock, reset };
}
