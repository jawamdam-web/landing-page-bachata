/**
 * YoutubeLinkForm — tab "YouTube link" w AddVideoDialog.
 *
 * Walidacja Zod: parseYoutubeUrl → inline error jeśli nieprawidłowy URL.
 * Submit → useCreateVideoFromYoutubeLink → toast + close dialog.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseYoutubeUrl } from '@/lib/url-parsers';
import { useCreateVideoFromYoutubeLink } from '../hooks/useVideoMutations';

const youtubeLinkSchema = z.object({
  url: z
    .string()
    .min(1, 'Wklej link do filmu z YouTube.')
    .refine((val) => parseYoutubeUrl(val) !== null, {
      message: 'Nie rozpoznaję linku. Wklej URL z YouTube.',
    }),
});

type YoutubeLinkFields = z.infer<typeof youtubeLinkSchema>;

interface YoutubeLinkFormProps {
  onSuccess: () => void;
}

export function YoutubeLinkForm({ onSuccess }: YoutubeLinkFormProps) {
  const { mutateAsync, isPending } = useCreateVideoFromYoutubeLink();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<YoutubeLinkFields>({
    resolver: zodResolver(youtubeLinkSchema),
    defaultValues: { url: '' },
  });

  async function handleAdd(data: YoutubeLinkFields) {
    await mutateAsync(data.url);
    reset();
    onSuccess();
  }

  return (
    <form
      onSubmit={handleSubmit(handleAdd)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="yt-url">Link do YouTube</Label>
        <Input
          id="yt-url"
          type="url"
          autoFocus
          placeholder="https://youtu.be/..."
          autoComplete="off"
          aria-invalid={errors.url ? 'true' : 'false'}
          aria-describedby={errors.url ? 'yt-url-error' : 'yt-url-hint'}
          className="text-base"
          {...register('url')}
        />
        {errors.url ? (
          <p
            id="yt-url-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.url.message}
          </p>
        ) : (
          <p id="yt-url-hint" className="text-xs text-fg-muted">
            Wklej link np. youtube.com/watch?v=... lub youtu.be/...
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="gap-2"
      >
        <Youtube className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {isPending ? 'Dodaję...' : 'Dodaj film'}
      </Button>
    </form>
  );
}
