import { useState, useCallback, useRef, useEffect } from 'react';
import { streamAnalysis } from '../api/stockApi';

export function useClaudeStream() {
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const cancelRef = useRef(null);
  const rawTextRef = useRef('');

  const startAnalysis = useCallback((symbol) => {
    if (cancelRef.current) cancelRef.current();

    setRawText('');
    setAnalysis(null);
    setStreaming(true);
    setError(null);
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
          setAnalysis(JSON.parse(text));
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

  return { rawText, analysis, streaming, error, startAnalysis };
}
