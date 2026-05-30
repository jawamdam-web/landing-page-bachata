import { MetaTags } from '@/components/seo/MetaTags';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PrivacyPolicy } from '@/features/legal/components/PrivacyPolicy';

/**
 * /privacy — Polityka prywatności. Lazy-loaded w router.tsx.
 */
export function PrivacyPage() {
  return (
    <>
      <MetaTags
        title="Polityka prywatności — Bachata Napoli"
        description="Jak chronimy Twoje dane osobowe i jakie prawa Ci przysługują zgodnie z RODO."
        imageUrl="/og-image.svg"
      />
      <div className="flex min-h-dvh flex-col bg-bg">
        <PublicHeader />
        <main className="flex-1 py-12 md:py-16">
          <div className="mx-auto max-w-[42rem] px-5 md:px-8">
            <PrivacyPolicy />
          </div>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

export default PrivacyPage;
