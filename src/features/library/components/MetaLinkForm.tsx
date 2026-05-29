/**
 * MetaLinkForm — tab "Facebook / Instagram" w AddVideoDialog.
 *
 * Walidacja Zod: parseMetaUrl → inline error jeśli nieprawidłowy URL.
 * Submit → useCreateVideoFromMetaLink.
 * oEmbed unavailable → nadal dodaje film (fallback manual entry).
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMetaUrl } from '@/lib/url-parsers';
import { useCreateVideoFromMetaLink } from '../hooks/useVideoMutations';

const metaLinkSchema = z.object({
  url: z
    .string()
    .min(1, 'Wklej link do posta z Facebooka lub Instagrama.')
    .refine((val) => parseMetaUrl(val) !== null, {
      message: 'Nie rozpoznaję linku. Wklej URL z Facebooka lub Instagrama.',
    }),
});

type MetaLinkFields = z.infer<typeof metaLinkSchema>;

interface MetaLinkFormProps {
  onSuccess: () => void;
}

export function MetaLinkForm({ onSuccess }: MetaLinkFormProps) {
  const { mutateAsync, isPending } = useCreateVideoFromMetaLink();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MetaLinkFields>({
    resolver: zodResolver(metaLinkSchema),
    defaultValues: { url: '' },
  });

  async function handleAdd(data: MetaLinkFields) {
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
        <Label htmlFor="meta-url">Link z Facebooka lub Instagrama</Label>
        <Input
          id="meta-url"
          type="url"
          autoFocus
          placeholder="https://www.instagram.com/reel/..."
          autoComplete="off"
          aria-invalid={errors.url ? 'true' : 'false'}
          aria-describedby={errors.url ? 'meta-url-error' : 'meta-url-hint'}
          className="text-base"
          {...register('url')}
        />
        {errors.url ? (
          <p
            id="meta-url-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.url.message}
          </p>
        ) : (
          <p id="meta-url-hint" className="text-xs text-fg-muted">
            Wklej publiczny link do posta, reela lub wideo z FB/IG.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="gap-2"
      >
        <Facebook className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {isPending ? 'Dodaję...' : 'Dodaj film'}
      </Button>
    </form>
  );
}
