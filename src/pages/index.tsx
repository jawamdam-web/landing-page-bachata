import { MetaTags } from '@/components/seo/MetaTags';
import { StructuredData } from '@/components/seo/StructuredData';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Hero } from '@/features/landing/components/Hero';
import { AboutNapoli } from '@/features/landing/components/AboutNapoli';
import { HowItWorks } from '@/features/landing/components/HowItWorks';
import { BachataSocial } from '@/features/landing/components/BachataSocial';
import { Instructors } from '@/features/landing/components/Instructors';
import { FinalCTA } from '@/features/landing/components/FinalCTA';

/**
 * LandingPage — publiczna strona główna (`/`). Eager-loaded (LCP + SEO
 * critical), więc NIE importuje supabase ani api/auth (ograniczenie
 * środowiska #3). useAuth w PublicHeader czyta tylko kontekst.
 *
 * Sekcje (R1–R6): Hero → Dlaczego Napoli → Jak to działa → Bachata Social →
 * Instruktorzy → Final CTA. Główne CTA prowadzi do /signup.
 */
export function LandingPage() {
  return (
    <>
      <MetaTags
        title="Bachata Napoli — Twoja biblioteka tańca + spotkania w Lubinie"
        description="Zapisuj filmy z zajęć bachaty z YouTube, Facebooka i własnego telefonu. Lokalna społeczność dancerów w Lubinie."
        imageUrl="/og-image.svg"
      />
      <StructuredData />
      <div className="flex min-h-dvh flex-col bg-bg">
        <PublicHeader />
        <main className="flex-1">
          <Hero />
          <AboutNapoli />
          <HowItWorks />
          <BachataSocial />
          <Instructors />
          <FinalCTA />
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

export default LandingPage;
