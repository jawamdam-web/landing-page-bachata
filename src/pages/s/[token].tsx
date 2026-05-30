/**
 * /s/:token — publiczna strona udostępnionej treści.
 *
 * Nie wymaga auth — dostępna dla wszystkich z linkiem.
 * Fetch przez SECURITY DEFINER RPC (anon key wystarczy).
 *
 * Stany:
 *   loading → spinner / info
 *   error token_invalid_or_revoked → RevokedTokenView
 *   error target_not_found → RevokedTokenView (treść usunięta)
 *   type=video → SharedVideoView
 *   type=folder → SharedFolderView
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { fetchSharedContent } from '@/features/sharing/api/shareTokens';
import { RevokedTokenView } from '@/features/sharing/components/RevokedTokenView';
import { SharedVideoView } from '@/features/sharing/components/SharedVideoView';
import { SharedFolderView } from '@/features/sharing/components/SharedFolderView';
import type { SharedContent } from '@/features/sharing/api/shareTokens';

type FetchState =
  | { status: 'loading' }
  | { status: 'revoked' }
  | { status: 'success'; content: SharedContent };

function LoadingView() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3">
      <div
        className="size-8 animate-spin rounded-full border-2 border-border border-t-accent"
        aria-hidden="true"
      />
      <p className="text-sm text-fg-muted">Ładowanie...</p>
    </div>
  );
}

export function SharedTokenPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'revoked' });
      return;
    }

    // Supabase JS RPC nie wspiera AbortSignal — flaga `cancelled` chroni
    // przed setState po unmount (request dokończy się w tle, wynik ignorowany).
    let cancelled = false;

    fetchSharedContent(token)
      .then((content) => {
        if (!cancelled) {
          setState({ status: 'success', content });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'revoked' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleGoHome() {
    void navigate('/');
  }

  return (
    <div className="min-h-dvh bg-bg">
      <PublicHeader />

      <main>
        {state.status === 'loading' && <LoadingView />}

        {state.status === 'revoked' && (
          <RevokedTokenView onGoHome={handleGoHome} />
        )}

        {state.status === 'success' && state.content.type === 'video' && (
          <SharedVideoView video={state.content.video} />
        )}

        {state.status === 'success' && state.content.type === 'folder' && (
          <SharedFolderView
            folder={state.content.folder}
            videos={state.content.videos}
          />
        )}
      </main>
    </div>
  );
}
