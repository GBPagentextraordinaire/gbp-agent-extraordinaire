/**
 * Resolves a CMS-authored image path to an Astro ImageMetadata object.
 *
 * WHY THIS EXISTS
 * Sveltia CMS stores a plain string in the JSON content file (for example
 * "/src/assets/uploads/hero-innovation-lab.jpg"). Astro's <Image /> component
 * cannot optimise a plain runtime string — it needs the ESM module that Vite
 * produces when an asset under src/ is imported.
 *
 * import.meta.glob with eager: true gives us that: at build time Vite walks
 * src/assets/uploads/, imports every asset, and hands back a map keyed by the
 * project-root-relative path. Looking the CMS string up in that map converts it
 * into real ImageMetadata, so the image goes through the normal build-time
 * pipeline and is emitted as a hashed, optimised file under /_astro/.
 *
 * This is why config.yml sets public_folder to the SOURCE path rather than a
 * public/ URL — the stored string has to match a glob key.
 */
import type { ImageMetadata } from 'astro';

const uploads = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/uploads/**/*.{jpeg,jpg,png,webp,avif,gif,tiff}',
  { eager: true },
);

/** Normalises a stored path to the leading-slash form the glob map is keyed by. */
function toGlobKey(storedPath: string): string {
  const trimmed = storedPath.trim();
  return trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\.\//, '')}`;
}

export function resolveUpload(storedPath: string): ImageMetadata {
  const key = toGlobKey(storedPath);
  const entry = uploads[key];

  if (!entry) {
    // Fail the build loudly. A missing image is a content error that should be
    // caught in CI, not a broken <img> discovered by a visitor.
    const available = Object.keys(uploads).sort().join('\n  ');
    throw new Error(
      `[images] No uploaded asset matches "${storedPath}" (looked up "${key}").\n` +
        `Images must live in src/assets/uploads/ so they are optimised at build time.\n` +
        `Available uploads:\n  ${available || '(none)'}`,
    );
  }

  return entry.default;
}
