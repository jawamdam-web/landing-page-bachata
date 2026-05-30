import { MetaTags } from '@/components/seo/MetaTags';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ContactForm } from '@/features/legal/components/ContactForm';

/**
 * /contact — Strona kontaktowa. Lazy-loaded w router.tsx.
 */
export function ContactPage() {
  return (
    <>
      <MetaTags
        title="Kontakt — Bachata Napoli"
        description="Skontaktuj się z nami w sprawie biblioteki tańca Bachata Napoli w Lubinie."
        imageUrl="/og-image.svg"
      />
      <div className="flex min-h-dvh flex-col bg-bg">
        <PublicHeader />
        <main className="flex-1 py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-5 md:px-8 xl:px-10">
            <div className="mb-10">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg md:text-[2.75rem]">
                Kontakt
              </h1>
              <p className="mt-2 text-base text-fg-muted">
                Masz pytanie? Napisz do nas — odpiszemy w ciągu 1–2 dni
                roboczych.
              </p>
            </div>
            <ContactForm />
          </div>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

export default ContactPage;
