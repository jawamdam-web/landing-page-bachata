/**
 * /library — Dashboard biblioteki filmów (IU-6 + IU-7).
 *
 * IU-7: filter by folder przez URL search param `?folder=<uuid>`.
 * - useSearchParams z React Router 7 → parse + set folderId
 * - "Wszystkie filmy" → brak `?folder` param (clean URL)
 * - Active folder visual: accent left-bar w LibrarySidebar/FolderList
 *
 * Layout:
 *   Desktop (>=lg): sidebar 240px + main grid
 *   Mobile (<lg): pełna szerokość + folder selector (LibrarySidebar mobile trigger)
 *
 * Stany:
 *   loading → skeleton
 *   error   → komunikat błędu
 *   empty   → EmptyLibrary
 *   data    → VideoGrid
 */

import { useSearchParams } from 'react-router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LibrarySidebar } from '@/features/library/components/LibrarySidebar';
import { VideoGrid } from '@/features/library/components/VideoGrid';
import { useVideos } from '@/features/library/hooks/useVideos';
import { useFolders } from '@/features/library/hooks/useFolders';

/** Skeleton placeholder dla kart filmów w stanie ładowania. */
function VideoGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Ładowanie filmów"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-border bg-bg-subtle"
        >
          <div className="aspect-video w-full bg-bg-muted" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-4 w-3/4 rounded bg-bg-muted" />
            <div className="h-3 w-1/2 rounded bg-bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LibraryContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFolderId = searchParams.get('folder');
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const activeFolderId =
    rawFolderId && UUID_RE.test(rawFolderId) ? rawFolderId : null;

  function handleFolderSelect(folderId: string | null) {
    if (folderId === null) {
      // Usuwamy param — clean URL dla "Wszystkie filmy"
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('folder');
        return next;
      });
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('folder', folderId);
        return next;
      });
    }
  }

  const { data: folders, isLoading: foldersLoading } = useFolders();
  const {
    data: videos,
    isLoading: videosLoading,
    isError,
  } = useVideos({ folderId: activeFolderId ?? undefined });

  const isLoading = foldersLoading || videosLoading;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 xl:px-10">
      {/* Page title */}
      <h1 className="text-2xl font-semibold tracking-[-0.015em] text-fg">
        Moja biblioteka
      </h1>

      {/* Desktop: sidebar + main / Mobile: main only */}
      <div className="flex gap-8">
        {/* LibrarySidebar zawiera wewnętrznie DesktopSidebar (>=lg) i MobileFolderSheet (<lg) */}
        {!foldersLoading && (
          <LibrarySidebar
            folders={folders ?? []}
            activeFolderId={activeFolderId}
            onFolderSelect={handleFolderSelect}
          />
        )}

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {isLoading && <VideoGridSkeleton />}

          {!isLoading && isError && (
            <div
              role="alert"
              className="rounded-lg border border-border bg-bg-subtle px-4 py-6 text-center"
            >
              <p className="text-sm text-fg-muted">Błąd ładowania filmów.</p>
            </div>
          )}

          {!isLoading && !isError && <VideoGrid videos={videos ?? []} />}
        </div>
      </div>
    </div>
  );
}

export function LibraryPage() {
  return (
    <DashboardLayout>
      <LibraryContent />
    </DashboardLayout>
  );
}

export default LibraryPage;
