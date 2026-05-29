/**
 * VideoGrid — responsywny grid kart filmów.
 *
 * - Mobile: 1 kolumna
 * - sm (640px): 2 kolumny
 * - lg (1024px): 3 kolumny
 * - Emituje EmptyLibrary gdy lista pusta.
 */

import { EmptyLibrary } from './EmptyLibrary';
import { VideoCard } from './VideoCard';
import { useFolders } from '../hooks/useFolders';
import type { Video } from '../types';

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  // useFolders wołany raz na poziomie gridu — nie 30 razy per VideoCard
  const { data: folders = [] } = useFolders();

  if (videos.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <section aria-label="Twoje filmy">
      <ul
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {videos.map((video) => (
          <li key={video.id}>
            {/* TODO IU-8: przekaż currentFolderIds z video_folders join */}
            <VideoCard video={video} folders={folders} />
          </li>
        ))}
      </ul>
    </section>
  );
}
