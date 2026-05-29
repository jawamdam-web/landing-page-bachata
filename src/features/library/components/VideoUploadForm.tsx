/**
 * VideoUploadForm — formularz uploadu pliku wideo na YouTube (unlisted).
 *
 * Flow:
 *  1. Sprawdź hasYoutubeUploadScope() → jeśli brak → GoogleScopeUpgradePrompt
 *  2. File input + title input → walidacja (rozmiar > 2GB → block)
 *  3. submit → useResumableUpload.startUpload()
 *  4. Podczas uploadu: UploadProgress (cancel)
 *  5. Sukces → onSuccess()
 *
 * DESIGN.md: mobile-first, tap targets ≥ 44px, input font-size ≥ 16px.
 */

import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleScopeUpgradePrompt } from '@/features/auth/components/GoogleScopeUpgradePrompt';
import { hasYoutubeUploadScope } from '@/features/auth/api/google-identity';
import { useResumableUpload } from '../hooks/useResumableUpload';
import { UploadProgress } from './UploadProgress';
import { cn } from '@/lib/utils';

// ─── Stałe ────────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const WARN_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

// ─── Typy ─────────────────────────────────────────────────────────────────────

interface VideoUploadFormProps {
  onSuccess: () => void;
}

type ScopeStatus = 'checking' | 'granted' | 'missing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileNameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return filename;
  return filename.slice(0, lastDot);
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function VideoUploadForm({ onSuccess }: VideoUploadFormProps) {
  const [scopeStatus, setScopeStatus] = useState<ScopeStatus>('checking');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadState, startUpload, cancelUpload, persistedState } =
    useResumableUpload();

  // Sprawdzanie scope przy mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const granted = await hasYoutubeUploadScope();
      if (!cancelled) {
        setScopeStatus(granted ? 'granted' : 'missing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect do sukcesu po zakończeniu uploadu
  useEffect(() => {
    if (uploadState.status === 'success') {
      onSuccess();
    }
  }, [uploadState.status, onSuccess]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Blokada > 2 GB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('Plik za duży (max 2 GB). Wybierz mniejszy plik.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Ostrzeżenie > 500 MB na słabym łączu
    const connection = (
      navigator as Navigator & { connection?: { effectiveType?: string } }
    ).connection;
    const effectiveType = connection?.effectiveType;
    if (
      file.size > WARN_FILE_SIZE_BYTES &&
      (effectiveType === '2g' || effectiveType === '3g')
    ) {
      toast.warning(
        'Duży plik na wolnym łączu — upload może potrwać dłużej. Upewnij się, że jesteś na Wi-Fi.',
      );
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(fileNameWithoutExtension(file.name));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !title.trim()) return;
    startUpload(selectedFile, title.trim());
  }

  // ─── Rendering ────────────────────────────────────────────────────────────────

  // Checking scope
  if (scopeStatus === 'checking') {
    return (
      <div
        className="flex items-center justify-center py-8"
        aria-busy="true"
        aria-label="Sprawdzanie uprawnień"
      >
        <div className="size-5 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  // Brak scope
  if (scopeStatus === 'missing') {
    return (
      <GoogleScopeUpgradePrompt
        onScopeRequested={() => setScopeStatus('checking')}
      />
    );
  }

  // Upload w toku
  if (uploadState.status === 'uploading') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <UploadCloud
            className="size-5 text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-fg">
            Wysyłam: <span className="text-fg-muted">{title}</span>
          </p>
        </div>
        <UploadProgress
          uploadedBytes={uploadState.uploadedBytes}
          totalBytes={uploadState.totalBytes}
          onCancel={cancelUpload}
        />
      </div>
    );
  }

  // Formularz
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Persisted state — wznów propozycja */}
      {persistedState && uploadState.status === 'idle' && (
        <div className="rounded-lg border border-border bg-bg-subtle p-3 text-sm">
          <p className="text-fg-muted">
            Poprzedni upload nie został dokończony:{' '}
            <strong className="text-fg">{persistedState.title}</strong>.
          </p>
          <p className="mt-1 text-fg-subtle text-xs">
            Wybierz ten sam plik ponownie i kliknij &quot;Wyślij&quot;, aby
            wznowić.
          </p>
        </div>
      )}

      {/* File input */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video-file">Plik wideo</Label>
        <div
          className={cn(
            'flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center',
            'cursor-pointer transition-colors duration-120',
            selectedFile
              ? 'border-accent bg-accent-soft'
              : 'border-border hover:border-border-strong hover:bg-bg-subtle',
          )}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Wybierz plik wideo"
        >
          <UploadCloud
            className={cn(
              'size-8',
              selectedFile ? 'text-accent' : 'text-fg-subtle',
            )}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          {selectedFile ? (
            <p className="text-sm font-medium text-accent-soft-foreground">
              {selectedFile.name}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-fg">
                Kliknij lub przeciągnij plik
              </p>
              <p className="text-xs text-fg-subtle">MP4, MOV, AVI · max 2 GB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="video-file"
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
          aria-describedby={fileError ? 'file-error' : undefined}
        />
        {fileError && (
          <p id="file-error" role="alert" className="text-sm text-error">
            {fileError}
          </p>
        )}
      </div>

      {/* Title input */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video-title">Tytuł</Label>
        <Input
          id="video-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Np. Partnerowanie — lekcja 3"
          maxLength={200}
          required
          className="text-base" // ≥ 16px — iOS Safari no-zoom
          aria-required="true"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!selectedFile || !title.trim()}
        className={cn('w-full gap-2 min-h-11', 'active:scale-[0.96]')}
      >
        <UploadCloud className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Wyślij na YouTube
      </Button>
    </form>
  );
}
