// @ts-check
import { defineConfig } from 'astro/config';

// Mirrors the umcinnovation.com production setup: static output, deployed to
// Vercel (zero-config static detection, no adapter required).
export default defineConfig({
  site: 'https://umcinnovation.com',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    // All seven production locales are declared so routing behaviour matches
    // production. Only `en` and `es` have pages in this prototype (in scope).
    locales: ['en', 'es', 'pt', 'zh', 'it', 'fr', 'de'],
    routing: { prefixDefaultLocale: false },
  },
});
