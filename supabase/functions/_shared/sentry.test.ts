/**
 * withSentry wrapper tests (review Faza 5 P2-12).
 *
 * WAŻNE: uruchamiane przez Vitest (Node), NIE przez Deno. `withSentry` czyta
 * `Deno.env.get('SENTRY_DSN')` dopiero w momencie wywołania (nie przy imporcie),
 * więc stubujemy globalny `Deno` przed każdym wywołaniem.
 *
 * Handler i Response są tu uproszczone (zwykłe obiekty) — ten plik jest poza
 * `src/` więc nie jest typecheckowany; testujemy wyłącznie zachowanie wrappera.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { withSentry } from './sentry';

function stubDeno(dsn: string | undefined): void {
  vi.stubGlobal('Deno', {
    env: { get: (key: string) => (key === 'SENTRY_DSN' ? dsn : undefined) },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('withSentry', () => {
  it('zwraca handler jako no-op wrapper gdy brak SENTRY_DSN', async () => {
    stubDeno(undefined);
    const response = { status: 200 };
    const handler = vi.fn(async () => response);

    const wrapped = withSentry(handler as never);
    const result = await wrapped({} as never);

    expect(result).toBe(response);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('przepuszcza odpowiedź handlera gdy SENTRY_DSN ustawiony i brak błędu', async () => {
    stubDeno('https://abc@o1.ingest.sentry.io/1');
    const response = { status: 201 };
    const handler = vi.fn(async () => response);

    const wrapped = withSentry(handler as never);
    const result = await wrapped({} as never);

    expect(result).toBe(response);
  });

  it('loguje przez console.error i re-throwuje błąd gdy SENTRY_DSN ustawiony', async () => {
    stubDeno('https://abc@o1.ingest.sentry.io/1');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boom = new Error('boom');
    const handler = vi.fn(async () => {
      throw boom;
    });

    const wrapped = withSentry(handler as never);

    await expect(wrapped({} as never)).rejects.toThrow('boom');
    expect(errorSpy).toHaveBeenCalled();
  });
});
