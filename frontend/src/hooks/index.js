import { useState, useEffect, useCallback, useRef } from 'react';

/* ── useDebounce ─────────────────────────── */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

/* ── useLocalStorage ─────────────────────── */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) { console.error(error); }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/* ── useAutoSave ─────────────────────────── */
export function useAutoSave(data, saveFn, delay = 3000) {
  const timerRef = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await saveFn(data);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [data, delay]);

  return { lastSaved };
}

/* ── useWindowSize ───────────────────────── */
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

/* ── usePreviewScale ─────────────────────── */
export function usePreviewScale(containerRef) {
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const calc = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 80;
        const resumeWidth = 794; // A4 width in px at 96dpi
        setScale(Math.min(0.75, containerWidth / resumeWidth));
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [containerRef]);
  return scale;
}

/* ── useDownload ─────────────────────────── */
export function useDownload() {
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async (apiFn, filename, mimeType) => {
    setDownloading(true);
    try {
      const { data } = await apiFn();
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Download failed:', err);
      return false;
    } finally {
      setDownloading(false);
    }
  }, []);

  return { downloading, download };
}
