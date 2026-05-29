/**
 * parseIso8601Duration tests.
 */

import { describe, expect, it } from 'vitest';
import { parseIso8601Duration } from './duration';

describe('parseIso8601Duration', () => {
  it('PT4M30S → 270', () => {
    expect(parseIso8601Duration('PT4M30S')).toBe(270);
  });

  it('PT1H2M3S → 3723', () => {
    expect(parseIso8601Duration('PT1H2M3S')).toBe(3723);
  });

  it('PT30S → 30 (brak minut)', () => {
    expect(parseIso8601Duration('PT30S')).toBe(30);
  });

  it('PT5M → 300 (same minuty)', () => {
    expect(parseIso8601Duration('PT5M')).toBe(300);
  });

  it('PT1H → 3600 (sama godzina)', () => {
    expect(parseIso8601Duration('PT1H')).toBe(3600);
  });

  it('pusty string → 0', () => {
    expect(parseIso8601Duration('')).toBe(0);
  });

  it('nieprawidłowy format → 0', () => {
    expect(parseIso8601Duration('invalid')).toBe(0);
  });

  it('P0D → 0 (duration zero)', () => {
    expect(parseIso8601Duration('P0D')).toBe(0);
  });
});
