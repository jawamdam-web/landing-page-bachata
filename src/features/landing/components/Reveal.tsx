import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Reveal — sekcja fade-in + slideY (~8px) gdy wjeżdża w viewport.
 *
 * Implementacja przez IntersectionObserver (zero zależności animacyjnych —
 * `motion` nie jest w projekcie). Observer jest odpinany w cleanup useEffect
 * (coding-rules §13). Przy `prefers-reduced-motion: reduce` — treść jest od
 * razu widoczna (bez transformacji), zgodnie z DESIGN.md sekcja 8.
 *
 * `delayMs` pozwala na stagger (max ~6 elementów wg DESIGN.md), wołający
 * przekazuje 30ms * index.
 */

interface RevealProps {
  children: ReactNode;
  /** Opóźnienie startu animacji (stagger). Domyślnie 0. */
  delayMs?: number;
  /** Element renderowany jako wrapper. Domyślnie 'div'. */
  as?: 'div' | 'section' | 'li';
  className?: string;
  id?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function Reveal({
  children,
  delayMs = 0,
  as: Tag = 'div',
  className,
  id,
}: RevealProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Callback ref typowany na HTMLElement — assignowalny do każdego wariantu
  // `as` (div/section/li). Observer pinany przy montażu node, odpinany w
  // cleanup (coding-rules §13).
  const setNode = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node || prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <Tag
      ref={setNode}
      id={id}
      style={{ transitionDelay: isVisible ? `${delayMs}ms` : '0ms' }}
      className={cn(
        'transition-[opacity,transform] duration-[var(--duration-slow)] ease-[var(--ease-enter)] motion-reduce:transition-none',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
