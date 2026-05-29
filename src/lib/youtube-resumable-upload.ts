/**
 * YouTube Resumable Upload — czysty protokół (bez React).
 * POST initiate → PUT chunks (8MB) → 308 resume | 200 done | 401 refresh | 5xx backoff
 */

// ─── Typy publiczne ───────────────────────────────────────────────────────────

export interface UploadOptions {
  file: File;
  title: string;
  accessToken: string;
  onProgress: (uploadedBytes: number, totalBytes: number) => void;
  signal?: AbortSignal;
  /** Zwraca nowy access token po odświeżeniu. */
  refreshToken: () => Promise<string>;
}

export interface UploadResult {
  youtubeVideoId: string;
}

// ─── Klasy błędów ─────────────────────────────────────────────────────────────

export class UploadFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadFailedError';
  }
}

export class QuotaExceededError extends Error {
  constructor() {
    super('Dziś osiągnęliśmy limit YouTube API. Spróbuj jutro.');
    this.name = 'QuotaExceededError';
  }
}

export class UploadAbortedError extends Error {
  constructor() {
    super('Upload anulowany.');
    this.name = 'UploadAbortedError';
  }
}

export class UploadUnauthorizedError extends Error {
  constructor() {
    super('Token dostępu wygasł.');
    this.name = 'UploadUnauthorizedError';
  }
}

// ─── Stałe ───────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_RETRIES = 5;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];
const INITIATE_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

// ─── Prywatne funkcje pomocnicze ──────────────────────────────────────────────

async function initiateUploadSession(
  title: string,
  accessToken: string,
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(INITIATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Length': String(file.size),
      'X-Upload-Content-Type': file.type || 'video/*',
    },
    body: JSON.stringify({
      snippet: { title },
      status: { privacyStatus: 'unlisted' },
    }),
    signal,
  });

  if (!response.ok) {
    throw new UploadFailedError(
      `Nie udało się zainicjować sesji uploadu (HTTP ${response.status}).`,
    );
  }

  const location = response.headers.get('Location');
  if (!location) {
    throw new UploadFailedError('Brak Location header w odpowiedzi YouTube.');
  }

  return location;
}

async function uploadChunk(
  resumableUrl: string,
  accessToken: string,
  chunk: ArrayBuffer,
  rangeStart: number,
  totalSize: number,
  signal?: AbortSignal,
): Promise<
  | { done: true; youtubeVideoId: string }
  | { done: false; bytesReceived: number }
> {
  const rangeEnd = rangeStart + chunk.byteLength - 1;

  const response = await fetch(resumableUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Range': `bytes ${rangeStart}-${rangeEnd}/${totalSize}`,
      'Content-Type': 'application/octet-stream',
    },
    body: chunk,
    signal,
  });

  // Sukces — upload zakończony
  if (response.status === 200 || response.status === 201) {
    const body = (await response.json()) as { id?: string };
    const id = body.id;
    if (!id) {
      throw new UploadFailedError(
        'YouTube nie zwrócił video ID po zakończeniu uploadu.',
      );
    }
    return { done: true, youtubeVideoId: id };
  }

  // Kontynuacja — chunk przyjęty, nie ostatni
  if (response.status === 308) {
    const rangeHeader = response.headers.get('Range');
    if (!rangeHeader) {
      // Brak Range = żadne bajty nie zostały przyjęte — wznów od 0
      return { done: false, bytesReceived: 0 };
    }
    // Format: bytes=0-<n>
    const match = /bytes=0-(\d+)/.exec(rangeHeader);
    const bytesReceived =
      match?.[1] !== undefined ? parseInt(match[1], 10) + 1 : 0;
    return { done: false, bytesReceived };
  }

  // Unauthorized — token wygasł
  if (response.status === 401) {
    throw new UploadUnauthorizedError();
  }

  // Quota exceeded
  if (response.status === 403) {
    throw new QuotaExceededError();
  }

  // 5xx → server error z property status (retriable)
  if (response.status >= 500) {
    const err = new UploadFailedError(
      `Server error ${response.status}`,
    ) as UploadFailedError & {
      status: number;
    };
    err.status = response.status;
    throw err;
  }

  throw new UploadFailedError(`Nieoczekiwany status HTTP ${response.status}.`);
}

async function cancelUploadSession(
  resumableUrl: string,
  accessToken: string,
): Promise<void> {
  try {
    await fetch(resumableUrl, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Ignorujemy błędy anulowania — upload jest przerywany i tak
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Czyta Blob jako ArrayBuffer. Fallback przez FileReader (JSDOM/starsze env). */
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

// ─── Publiczne API ────────────────────────────────────────────────────────────

/** Uploaduje plik na YouTube jako unlisted. Zwraca { youtubeVideoId } po sukcesie. */
export async function uploadToYoutube(
  options: UploadOptions,
): Promise<UploadResult> {
  const { file, title, onProgress, signal, refreshToken } = options;
  let { accessToken } = options;

  // Sprawdź abort przed inicjacją
  if (signal?.aborted) throw new UploadAbortedError();

  const resumableUrl = await initiateUploadSession(
    title,
    accessToken,
    file,
    signal,
  );

  let offset = 0;
  const totalSize = file.size;

  while (offset < totalSize) {
    if (signal?.aborted) {
      await cancelUploadSession(resumableUrl, accessToken);
      throw new UploadAbortedError();
    }

    const chunkEnd = Math.min(offset + CHUNK_SIZE, totalSize);
    const blob = file.slice(offset, chunkEnd);
    const chunkBuffer = await readBlobAsArrayBuffer(blob);

    let attempt = 0;
    let chunkResult: Awaited<ReturnType<typeof uploadChunk>> | null = null;

    while (attempt <= MAX_RETRIES) {
      try {
        chunkResult = await uploadChunk(
          resumableUrl,
          accessToken,
          chunkBuffer,
          offset,
          totalSize,
          signal,
        );
        break; // sukces — wychodzimy z retry loop
      } catch (err) {
        if (err instanceof UploadAbortedError) throw err;
        if (err instanceof QuotaExceededError) throw err;

        // 401 → refresh token i retry raz (nie liczy jako attempt dla backoff)
        if (err instanceof UploadUnauthorizedError) {
          try {
            accessToken = await refreshToken();
            // nie zwiększamy attempt — retry z nowym tokenem
            continue;
          } catch {
            throw new Error(
              'Sesja Google wygasła. Zaloguj się ponownie przez Google.',
            );
          }
        }

        // 5xx → sprawdź czy błąd ma status >= 500
        const errWithStatus = err as Error & { status?: number };
        const isServerError =
          errWithStatus.status !== undefined && errWithStatus.status >= 500;

        if (!isServerError) throw err;

        // Exponential backoff dla 5xx
        if (attempt >= MAX_RETRIES) {
          throw new UploadFailedError(
            'Nie udało się wysłać chunka po 5 próbach. Spróbuj ponownie.',
          );
        }

        const delayMs =
          attempt < RETRY_DELAYS_MS.length ? RETRY_DELAYS_MS[attempt]! : 16000;
        await sleep(delayMs);
        attempt++;
      }
    }

    if (!chunkResult) {
      throw new UploadFailedError('Nieoczekiwany stan pętli upload.');
    }

    if (chunkResult.done) {
      onProgress(totalSize, totalSize);
      return { youtubeVideoId: chunkResult.youtubeVideoId };
    }

    // 308 — aktualizuj offset na podstawie faktycznie przyjętych bajtów
    offset = chunkResult.bytesReceived;
    onProgress(offset, totalSize);
  }

  throw new UploadFailedError('Upload zakończył się bez odpowiedzi sukcesu.');
}
