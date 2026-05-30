/**
 * useIsMobile — detekcja mobile breakpoint (< md = 768px).
 *
 * Shared hook — jedno źródło prawdy zamiast duplikacji w dialogach
 * (AddVideoDialog, VideoDetailDialog, ShareDialog).
 *
 * SSR-safe: initial state false gdy `window` niedostępny.
 * Cleanup: removeEventListener przy unmount (§13).
 */

import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
