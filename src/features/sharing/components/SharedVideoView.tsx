/**
 * SharedVideoView — publiczny widok pojedynczego udostępnionego filmu.
 *
 * Read-only: VideoPlayer + tytuł + notatki (read-only).
 * Footer CTA: "Załóż konto i organizuj własne filmy z zajęć".
 * DESIGN.md: editorial, mobile-first.
 */

import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/features/library/components/VideoPlayer';
import type { SharedVideo } from '@/features/sharing/api/shareTokens';

interface SharedVideoViewProps {
  video: SharedVideo;
}

export function SharedVideoView({ video }: SharedVideoViewProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8 md:px-8">
      {/* Player */}
      <VideoPlayer
        source={video.source}
        sourceId={video.source_id}
        embedHtml={video.embed_html}
        title={video.title}
      />

      {/* Title + notes */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold leading-snug text-fg">
          {video.title}
        </h1>

        {video.notes && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
            {video.notes}
          </p>
        )}
      </div>

      {/* CTA footer */}
      <footer className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-border bg-bg-subtle p-5 text-center">
        <p className="text-sm text-fg-muted">
          Udostępnione przez{' '}
          <span className="font-medium text-fg">Bachata Napoli</span> — załóż
          konto i organizuj własne filmy z zajęć.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => void navigate('/signup')}
          className="min-w-[160px]"
        >
          Załóż konto
        </Button>
      </footer>
    </div>
  );
}
