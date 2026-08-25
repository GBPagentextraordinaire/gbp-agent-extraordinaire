# Output parity verification

`baseline/en.html` and `baseline/es.html` are the built homepage HTML from the
commit *before* content was extracted, when the hero and FAQ copy was still
hardcoded inline in `src/pages/index.astro` and `src/pages/es/index.astro`
(commit `4c08abb`, the first commit on this branch).

`scripts/verify-parity.mjs` rebuilds the site from the CMS-backed content files
and compares the result against those snapshots, byte by byte.

    npm run build && node scripts/verify-parity.mjs

This is what backs the claim that extracting content into data files did not
change the rendered page.
