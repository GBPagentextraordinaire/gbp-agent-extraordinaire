/**
 * Copies the pinned Sveltia CMS bundle from node_modules into public/admin/.
 *
 * Vendoring keeps the editor working offline and pins the version via
 * package-lock.json instead of relying on a CDN. Run after any npm install:
 *   npm run cms:sync
 */
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'node_modules/@sveltia/cms/dist/sveltia-cms.js');
const to = resolve(root, 'public/admin/sveltia-cms.js');

await mkdir(dirname(to), { recursive: true });
await copyFile(from, to);
const { size } = await stat(to);
console.log(`[cms:sync] public/admin/sveltia-cms.js  (${(size / 1024 / 1024).toFixed(2)} MB)`);
