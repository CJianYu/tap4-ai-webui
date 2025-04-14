import Script from 'next/script';

import { GOOGLE_TRACKING_ID } from '@/lib/env';

export default function SeoScript() {
  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TAP4.ai',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${process.env.NEXT_PUBLIC_SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TAP4.ai',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`,
  };

  return (
    <>
      <Script strategy='afterInteractive' src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TRACKING_ID}`} />
      <Script
        id='gtag-init'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_TRACKING_ID}', {
            page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Script
        id='schema-website'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      <Script
        id='schema-organization'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}
