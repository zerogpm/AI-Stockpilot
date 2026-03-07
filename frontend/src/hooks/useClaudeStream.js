import { useState, useCallback, useRef, useEffect } from 'react';
import { streamAnalysis } from '../api/stockApi';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_KEY_PREFIX = 'analysis_';

function getCached(symbol) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + symbol);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp < CACHE_TTL) return entry;
    localStorage.removeItem(CACHE_KEY_PREFIX + symbol);
    return null;
  } catch { return null; }
}

function setCached(symbol, analysis) {
  localStorage.setItem(CACHE_KEY_PREFIX + symbol, JSON.stringify({ analysis, timestamp: Date.now() }));
}

export { getCached, setCached };

export function useClaudeStream() {
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCachedState] = useState(false);
  const cancelRef = useRef(null);
  const rawTextRef = useRef('');

  const loadCachedAnalysis = useCallback((symbol) => {
    const entry = getCached(symbol);
    if (entry) {
      setAnalysis(entry.analysis);
      setError(null);
      setRawText('');
      setCachedState(true);
      return true;
    }
    setAnalysis(null);
    setCachedState(false);
    return false;
  }, []);

  const startAnalysis = useCallback((symbol) => {
    if (cancelRef.current) cancelRef.current();

    setRawText('');
    setAnalysis(null);
    setStreaming(true);
    setError(null);
    setCachedState(false);
    rawTextRef.current = '';

    cancelRef.current = streamAnalysis(
      symbol,
      (chunk) => {
        rawTextRef.current += chunk;
        setRawText(rawTextRef.current);
      },
      () => {
        setStreaming(false);
        try {
          // Strip markdown code fences if present
          let text = rawTextRef.current.trim();
          if (text.startsWith('```')) {
            text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          const parsed = JSON.parse(text);
          setAnalysis(parsed);
          setCached(symbol, parsed);
        } catch {
          setError('Failed to parse Claude response as JSON');
        }
      },
      (err) => {
        setStreaming(false);
        setError(err.message);
      }
    );
  }, []);

  useEffect(() => {
    return () => cancelRef.current?.();
  }, []);

  return { rawText, analysis, streaming, error, cached, startAnalysis, loadCachedAnalysis };
}
