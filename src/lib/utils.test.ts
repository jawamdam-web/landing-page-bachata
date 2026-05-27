import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn()', () => {
  it('łączy klasy w jeden string', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2');
  });

  it('resolves Tailwind utility conflicts (px-2 vs px-4 → px-4)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('obsługuje conditional classes (falsy values ignored)', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
      'base active',
    );
  });

  it('obsługuje tablicę klas', () => {
    expect(cn(['flex', 'gap-2'], 'p-4')).toBe('flex gap-2 p-4');
  });

  it('obsługuje undefined/null/empty bez błędu', () => {
    expect(cn('base', undefined, null, '', 'end')).toBe('base end');
  });

  it('resolves color conflict (bg-red-500 vs bg-blue-500 → bg-blue-500)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});
