/**
 * ISO 8601 duration parser.
 *
 * Eksport:
 * - parseIso8601Duration(duration: string) → liczba sekund (number)
 *
 * Zwraca 0 dla nieprawidłowych / nierozpoznanych stringów.
 */

/**
 * Parsuje ISO 8601 duration string do sekund.
 *
 * Przykłady:
 * - 'PT4M30S' → 270
 * - 'PT1H2M3S' → 3723
 * - 'PT30S' → 30
 * - '' → 0
 *
 * Obsługuje tylko time component (PTxHxMxS) — date part (P1Y, P2M, P5D) ignorowany.
 */
export function parseIso8601Duration(duration: string): number {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
