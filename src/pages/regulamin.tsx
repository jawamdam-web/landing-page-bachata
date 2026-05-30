import { MetaTags } from '@/components/seo/MetaTags';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Regulamin } from '@/features/legal/components/Regulamin';

/**
 * /regulamin — Regulamin serwisu. Lazy-loaded w router.tsx.
 */
export function RegulaminPage() {
  return (
    <>
      <MetaTags
        title="Regulamin — Bachata Napoli"
        description="Regulamin korzystania z serwisu Bachata Napoli — biblioteki filmów tanecznych."
        imageUrl="/og-image.svg"
      />
      <div className="flex min-h-dvh flex-col bg-bg">
        <PublicHeader />
        <main className="flex-1 py-12 md:py-16">
          <div className="mx-auto max-w-[42rem] px-5 md:px-8">
            <Regulamin />
          </div>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

export default RegulaminPage;
