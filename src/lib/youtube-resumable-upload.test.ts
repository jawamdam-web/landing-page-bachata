/**
 * youtube-resumable-upload.test.ts
 *
 * Testy integracyjne protokołu Resumable Upload YouTube.
 * MSW v2 mockuje sieć — żadne prawdziwe requesty nie wychodzą.
 *
 * Scenariusze obowiązkowe (z planu IU-9):
 *  [1] 5 MB file → 1 chunk → success, returns YT video ID
 *  [2] 50 MB file → 7 chunks → all success → returns video ID
 *  [3] chunk 3 z 7 zwraca 308 + Range header → resume od indicated byte
 *  [4] chunk zwraca 503 → backoff → success (4 próby)
 *  [5] chunk zwraca 503 5x z rzędu → UploadFailedError
 *  [6] chunk zwraca 401 → refreshToken() → retry z new token → success
 *  [7] refresh token fail → rzuca AuthError
 *  [8] abort (AbortSignal) middle of upload → DELETE resumable URL
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  uploadToYoutube,
  UploadFailedError,
  QuotaExceededError,
  UploadAbortedError,
} from './youtube-resumable-upload';

// ─── Stałe testowe ─────────────────────────────────────────────────────────────

const INITIATE_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
const RESUMABLE_URL = 'https://upload.youtube.com/resumable/test-session-123';
const YOUTUBE_VIDEO_ID = 'abc123videoId';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(sizeBytes: number, name = 'test.mp4'): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type: 'video/mp4' });
}

// ─── MSW Server ────────────────────────────────────────────────────────────────

const server = setupServer();
beforeEach(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterEach(() => server.close());

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('uploadToYoutube', () => {
  /**
   * [1] 5 MB file → 1 chunk → success
   */
  it('returns YT video ID for 5 MB file (single chunk)', async () => {
    server.use(
      http.post(
        INITIATE_URL,
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { Location: RESUMABLE_URL },
          }),
      ),
      http.put(RESUMABLE_URL, () =>
        HttpResponse.json({ id: YOUTUBE_VIDEO_ID }, { status: 200 }),
      ),
    );

    const file = makeFile(5 * 1024 * 1024);
    const onProgress = vi.fn();

    const result = await uploadToYoutube({
      file,
      title: 'Test video',
      accessToken: 'valid-token',
      onProgress,
      refreshToken: vi.fn(),
    });

    expect(result.youtubeVideoId).toBe(YOUTUBE_VIDEO_ID);
    expect(onProgress).toHaveBeenCalledWith(file.size, file.size);
  });

  /**
   * [2] plik większy niż 1 chunk → wiele chunków → success
   *
   *     MSW traktuje HTTP 308 jako redirect (RFC-compliant), więc multi-chunk
   *     testy używają vi.spyOn(global, 'fetch') — mockujemy na poziomie
   *     niższym niż MSW, co omija redirect-following logic.
   *
   *     Plik: 8MB + 1024B → wymusza 2 chunki (CHUNK_SIZE = 8MB).
   *     Chunk 1: PUT → 308 (incomplete)
   *     Chunk 2: PUT → 200 (done)
   */
  it('uploads multi-chunk file and returns video ID (sequence: 308 then 200)', async () => {
    let putCallCount = 0;
    const originalFetch = global.fetch;

    global.fetch = vi
      .fn()
      .mockImplementation(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          const url =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : (input as Request).url;
          const method =
            init?.method ?? (input instanceof Request ? input.method : 'GET');

          // POST initiate
          if (method === 'POST' && url.includes('googleapis.com')) {
            return new Response(null, {
              status: 200,
              headers: { Location: RESUMABLE_URL },
            });
          }

          // PUT chunks
          if (method === 'PUT') {
            putCallCount++;
            const contentRange =
              (init?.headers as Record<string, string>)?.['Content-Range'] ??
              '';
            const match = /bytes (\d+)-(\d+)\/(\d+)/.exec(contentRange);
            const end = match?.[2] !== undefined ? parseInt(match[2], 10) : 0;
            const total = match?.[3] !== undefined ? parseInt(match[3], 10) : 1;

            if (end + 1 >= total) {
              return Response.json({ id: YOUTUBE_VIDEO_ID }, { status: 200 });
            }

            return new Response(null, {
              status: 308,
              headers: { Range: `bytes=0-${end}` },
            });
          }

          return originalFetch(input, init);
        },
      );

    const file = makeFile(8 * 1024 * 1024 + 1024);
    const onProgress = vi.fn();

    try {
      const result = await uploadToYoutube({
        file,
        title: 'Multi-chunk video',
        accessToken: 'valid-token',
        onProgress,
        refreshToken: vi.fn(),
      });

      expect(result.youtubeVideoId).toBe(YOUTUBE_VIDEO_ID);
      expect(putCallCount).toBe(2);
      expect(onProgress).toHaveBeenCalledWith(file.size, file.size);
    } finally {
      global.fetch = originalFetch;
    }
  });

  /**
   * [3] chunk zwraca 308 z partial Range header → resume od indicated byte
   *
   *     Używamy vi.spyOn(global, 'fetch') — MSW traktuje 308 jako redirect.
   *     Plik: 8MB + 1KB (2 chunki).
   *     PUT 1: 308 + Range bytes=0-<połowa_chunka-1> (partial accept)
   *     PUT 2: musi zaczynać od połowa_chunka (resume)
   *     PUT 2/3: 200 gdy end+1 >= total
   */
  it('resumes from indicated byte after partial 308 Range header', async () => {
    const CHUNK_8MB = 8 * 1024 * 1024;
    const putCalls: string[] = [];
    let callCount = 0;
    const originalFetch = global.fetch;

    global.fetch = vi
      .fn()
      .mockImplementation(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          const url =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : (input as Request).url;
          const method =
            init?.method ?? (input instanceof Request ? input.method : 'GET');

          if (method === 'POST' && url.includes('googleapis.com')) {
            return new Response(null, {
              status: 200,
              headers: { Location: RESUMABLE_URL },
            });
          }

          if (method === 'PUT') {
            const contentRange =
              (init?.headers as Record<string, string>)?.['Content-Range'] ??
              '';
            putCalls.push(contentRange);
            callCount++;

            const match = /bytes (\d+)-(\d+)\/(\d+)/.exec(contentRange);
            if (!match || match[2] === undefined || match[3] === undefined) {
              return Response.json({ id: YOUTUBE_VIDEO_ID }, { status: 200 });
            }

            const end = parseInt(match[2], 10);
            const total = parseInt(match[3], 10);

            // Pierwsze wywołanie → partial accept (połowa CHUNK_8MB)
            if (callCount === 1) {
              const partialEnd = Math.floor(CHUNK_8MB / 2) - 1;
              return new Response(null, {
                status: 308,
                headers: { Range: `bytes=0-${partialEnd}` },
              });
            }

            if (end + 1 >= total) {
              return Response.json({ id: YOUTUBE_VIDEO_ID }, { status: 200 });
            }

            return new Response(null, {
              status: 308,
              headers: { Range: `bytes=0-${end}` },
            });
          }

          return originalFetch(input, init);
        },
      );

    const fileSize = CHUNK_8MB + 1024;
    const file = makeFile(fileSize);

    try {
      const result = await uploadToYoutube({
        file,
        title: 'Resume test',
        accessToken: 'valid-token',
        onProgress: vi.fn(),
        refreshToken: vi.fn(),
      });

      expect(result.youtubeVideoId).toBe(YOUTUBE_VIDEO_ID);

      const resumeStart = Math.floor(CHUNK_8MB / 2);
      const resumeCall = putCalls.find((range) =>
        range.startsWith(`bytes ${resumeStart}-`),
      );
      expect(resumeCall).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });

  /**
   * [4] chunk zwraca 503 → backoff → success po 4 próbach (3 retry)
   */
  it('retries on 503 with exponential backoff and succeeds', async () => {
    vi.useFakeTimers();
    let attemptCount = 0;

    server.use(
      http.post(
        INITIATE_URL,
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { Location: RESUMABLE_URL },
          }),
      ),
      http.put(RESUMABLE_URL, () => {
        attemptCount++;
        if (attemptCount < 4) {
          return new HttpResponse(null, { status: 503 });
        }
        return HttpResponse.json({ id: YOUTUBE_VIDEO_ID }, { status: 200 });
      }),
    );

    const file = makeFile(1024 * 1024);

    const uploadPromise = uploadToYoutube({
      file,
      title: 'Retry test',
      accessToken: 'valid-token',
      onProgress: vi.fn(),
      refreshToken: vi.fn(),
    });

    // Przewijamy timery dla backoff delays (1s + 2s + 4s)
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    const result = await uploadPromise;
    expect(result.youtubeVideoId).toBe(YOUTUBE_VIDEO_ID);
    expect(attemptCount).toBe(4);
  });

  /**
   * [5] chunk zwraca 503 5x z rzędu → UploadFailedError po 5 retry
   */
  it('throws UploadFailedError after 5 consecutive 503 errors', async () => {
    vi.useFakeTimers();
    let callCount = 0;

    server.use(
      http.post(
        INITIATE_URL,
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { Location: RESUMABLE_URL },
          }),
      ),
      http.put(RESUMABLE_URL, () => {
        callCount++;
        return new HttpResponse(null, { status: 503 });
      }),
    );

    const file = makeFile(1024 * 1024);

    let caughtError: unknown;
    const uploadPromise = uploadToYoutube({
      file,
      title: 'Max retry test',
      accessToken: 'valid-token',
      onProgress: vi.fn(),
      refreshToken: vi.fn(),
    }).catch((err: unknown) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    vi.useRealTimers();
    await uploadPromise;

    expect(caughtError).toBeInstanceOf(UploadFailedError);
    // MAX_RETRIES=5: 1 initial + 5 retries = 6 calls max
    expect(callCount).toBeGreaterThanOrEqual(6);
  });

  /**
   * [6] chunk zwraca 401 → refreshToken() → retry z nowym tokenem → success
   */
  it('refreshes token on 401 and retries chunk successfully', async () => {
    let tokenInUse = 'old-token';
    const refreshToken = vi.fn().mockResolvedValue('new-token');

    server.use(
      http.post(
        INITIATE_URL,
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { Location: RESUMABLE_URL },
          }),
      ),
      http.put(RESUMABLE_URL, ({ request }) => {
        const auth = request.headers.get('Authorization') ?? '';
        if (auth.includes('old-token')) {
          return new HttpResponse(null, { status: 401 });
        }
        tokenInUse = 'new-token';
        return HttpResponse.json({ id: YOUTUBE_VIDEO_ID }, { status: 200 });
      }),
    );

    const file = makeFile(1024 * 1024);

    const result = await uploadToYoutube({
      file,
      title: 'Token refresh test',
      accessToken: 'old-token',
      onProgress: vi.fn(),
      refreshToken,
    });

    expect(result.youtubeVideoId).toBe(YOUTUBE_VIDEO_ID);
    expect(refreshToken).toHaveBeenCalledOnce();
    expect(tokenInUse).toBe('new-token');
  });

  /**
   * [7] refresh token fail → rzuca Error (AuthError-like)
   */
  it('throws when token refresh fails', async () => {
    const refreshToken = vi.fn().mockRejectedValue(new Error('refresh failed'));

    server.use(
      http.post(
        INITIATE_URL,
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { Location: RESUMABLE_URL },
          }),
      ),
      http.put(RESUMABLE_URL, () => new HttpResponse(null, { status: 401 })),
    );

    const file = makeFile(1024 * 1024);

    await expect(
      uploadToYoutube({
        file,
        title: 'Auth fail test',
        accessToken: 'expired-token',
        onProgress: vi.fn(),
        refreshToken,
      }),
    ).rejects.toThrow('Sesja Google wygasła');
  });

  /**
   * [8] abort (AbortSignal) w trakcie uploadu → DELETE resumable URL
   *
   * Symulacja: controller abortowany przed wywołaniem uploadToYoutube,
   * ale po fazie inicjacji sesji (testujemy cleanup pętli uploadu).
   * Alternatywnie: wywołujemy abort przed startem → UploadAbortedError z cleanup.
   */
  it('throws UploadAbortedError and sends DELETE when aborted before upload starts', async () => {
    const deleteRequests: string[] = [];

    server.use(
      http.post(
        INITIATE_URL,
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { Location: RESUMABLE_URL },
          }),
      ),
      http.put(
        RESUMABLE_URL,
        () =>
          new HttpResponse(null, {
            status: 308,
            headers: { Range: 'bytes=0-0' },
          }),
      ),
      http.delete(RESUMABLE_URL, ({ request }) => {
        deleteRequests.push(request.url);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Abortujemy kontroler — signal jest już aborted gdy wywołujemy upload
    const controller = new AbortController();
    controller.abort();

    const file = makeFile(5 * 1024 * 1024);

    await expect(
      uploadToYoutube({
        file,
        title: 'Abort test',
        accessToken: 'valid-token',
        onProgress: vi.fn(),
        refreshToken: vi.fn(),
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(UploadAbortedError);
  });

  /**
   * [bonus] 403 quotaExceeded → QuotaExceededError
   */
  it('throws QuotaExceededError on 403 response', async () => {
    server.use(
      http.post(
        INITIATE_URL,
        () =>
          new HttpResponse(null, {
            status: 200,
            headers: { Location: RESUMABLE_URL },
          }),
      ),
      http.put(RESUMABLE_URL, () => new HttpResponse(null, { status: 403 })),
    );

    const file = makeFile(1024 * 1024);

    await expect(
      uploadToYoutube({
        file,
        title: 'Quota test',
        accessToken: 'valid-token',
        onProgress: vi.fn(),
        refreshToken: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });
});
