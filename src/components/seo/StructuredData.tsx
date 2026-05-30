/**
 * StructuredData — JSON-LD structured data dla Google.
 *
 * Renderuje <script type="application/ld+json"> z połączonymi schematami:
 * - WebSite
 * - LocalBusiness
 * - Organization
 * - Person (instruktorzy)
 *
 * Mount TYLKO na landing page (/). Komponent statyczny — dane przekazywane przez props
 * z sensownymi wartościami domyślnymi dla MVP.
 */

interface Instructor {
  name: string;
  affiliation: string;
}

interface StructuredDataProps {
  siteUrl?: string;
  businessName?: string;
  addressLocality?: string;
  addressCountry?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  instructors?: Instructor[];
}

const DEFAULT_INSTRUCTORS: Instructor[] = [
  { name: 'Małgorzata Andrzejewska', affiliation: 'Bachata Rebel' },
  { name: 'Szymon Andrzejewski', affiliation: 'Bachata Rebel' },
];

export function StructuredData({
  siteUrl = 'https://bachatanapoli.pl',
  businessName = 'Bachata Napoli',
  addressLocality = 'Lubin',
  addressCountry = 'PL',
  facebookUrl = 'https://www.facebook.com/bachatanapoli',
  instagramUrl = 'https://www.instagram.com/bachatanapoli',
  instructors = DEFAULT_INSTRUCTORS,
}: StructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: businessName,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/?s={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${siteUrl}/#localbusiness`,
        name: businessName,
        url: siteUrl,
        address: {
          '@type': 'PostalAddress',
          addressLocality,
          addressCountry,
        },
        sameAs: [facebookUrl, instagramUrl],
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: businessName,
        url: siteUrl,
        sameAs: [facebookUrl, instagramUrl],
        founder: instructors.map((instructor) => ({
          '@type': 'Person',
          name: instructor.name,
          affiliation: {
            '@type': 'Organization',
            name: instructor.affiliation,
          },
        })),
      },
      ...instructors.map((instructor) => ({
        '@type': 'Person',
        name: instructor.name,
        affiliation: {
          '@type': 'Organization',
          name: instructor.affiliation,
        },
        worksFor: {
          '@id': `${siteUrl}/#organization`,
        },
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
