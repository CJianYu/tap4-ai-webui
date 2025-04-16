import Script from 'next/script';

import { GOOGLE_ADSENSE_URL } from '@/lib/env';

export default function GoogleAdScript() {
  return <Script id='google-adsense' strategy='lazyOnload' src={GOOGLE_ADSENSE_URL} crossOrigin='anonymous' />;
}
