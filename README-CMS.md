# UMC Innovation — git-based CMS prototype

A working prototype of [Sveltia CMS](https://github.com/sveltia/sveltia-cms) as a
git-based content management layer, so the client can edit copy and swap images
without a developer.

> **This is a prototype built for discussion, not a production deployment.**
> Read "Known limitations" at the bottom before planning a rollout.

---

## Scope

| In scope | Out of scope |
| --- | --- |
| Homepage hero section | Every other section on the homepage |
| Homepage FAQ section | The other 7 pages |
| English and Spanish | The other 5 locales (pt, zh, it, fr, de) |
| Homepage meta title + description | Structure, layout, navigation, colours, spacing |

Nothing structural is editable by design: no section ordering, no layout
controls, no navigation editing, no adding or deleting pages, and no colour or
spacing options.

---

## Setup

```bash
npm install      # installs Astro 6.4.8 and the pinned Sveltia CMS bundle
npm run cms:sync # copies the CMS bundle into public/admin/ (run after any install)
npm run build    # build the static site into dist/
```

`npm run cms:sync` vendors `node_modules/@sveltia/cms/dist/sveltia-cms.js` into
`public/admin/`. The CMS is deliberately **not** loaded from a CDN, so the editor
works with no network connection and its version is pinned by
`package-lock.json`.

---

## Running the CMS locally (no GitHub account required)

This is the offline demo path. It reads and writes the real files in your
working copy — nothing touches GitHub.

```bash
npm run dev
```

Then:

1. Open <http://localhost:4321/admin/> in **Chrome or Edge**.
2. Click **"Work with Local Repository"**.
3. In the folder picker, choose the **project root** (the folder containing
   `package.json`), and allow read/write access when the browser asks.
4. Open **Homepage → Homepage — English** (or Spanish) and edit.
5. Click **Save**. The JSON file under `src/content/pages/home/` is written
   directly. The Astro dev server hot-reloads, so the change appears at
   <http://localhost:4321/> immediately.

No proxy server is needed. Sveltia uses the browser's File System Access API
directly — unlike Decap CMS, there is no `npx decap-server` step.

> **Browser requirement:** the File System Access API is Chromium-only. Local
> mode does not work in Firefox or Safari. Use Chrome or Edge for the demo.

To commit what the client changed, just use git as normal — the CMS edits are
ordinary file changes in your working tree.

---

## Where content lives

```
src/content/pages/
└── home/
    ├── en.json          ← Homepage, English
    └── es.json          ← Homepage, Spanish
```

The pattern is `src/content/pages/<page>/<locale>.json` — one file per page per
locale. Scaled to production that is 8 directories × 7 files = 56 files.

Each file is validated twice:

* **In the CMS** — character limits and required fields, enforced in the editing
  UI (`public/admin/config.yml`).
* **At build time** — the same limits re-expressed as a Zod schema in
  `src/content.config.ts`, so a hand-edit, a bad merge, or a direct commit that
  bypasses the CMS fails the build instead of shipping broken copy.

If you change a limit in one place, change it in the other. They are intentional
duplicates, and the comments in both files say so.

---

## How images work (the important part)

The requirement was that CMS uploads still pass through Astro's build-time image
optimisation rather than being dumped into `public/`. They do.

**The chain:**

1. `public/admin/config.yml` sets `media_folder: src/assets/uploads`, so Sveltia
   writes uploaded files into the Astro source tree, not `public/`.
2. It also sets `public_folder: /src/assets/uploads`. This is deliberately a
   *source* path, not a public URL — the string stored in the JSON content file
   has to match a Vite module id.
3. `src/lib/images.ts` builds a lookup map with
   `import.meta.glob('/src/assets/uploads/**/*.{jpeg,jpg,png,webp,avif,gif,tiff}', { eager: true })`.
   At build time Vite imports every asset in that folder and returns real
   `ImageMetadata` objects.
4. `resolveUpload()` turns the stored string into that `ImageMetadata`, which is
   handed to Astro's `<Image />` component.
5. Astro emits an optimised, content-hashed `.webp` under `/_astro/`.

**Verified output:**

```
dist/_astro/hero-innovation-lab.DQcFXOec_Z1ke76V.webp   (33 kB JPEG → 8 kB WebP)
<img src="/_astro/hero-innovation-lab.DQcFXOec_Z1ke76V.webp" … width="1600" height="900">
```

No image is written to `public/`, and the original JPEG is not shipped.

**Upload processing.** Sveltia converts uploads client-side before writing them,
configured in `media_libraries.default.config.transformations.raster_image`:
WebP, quality 85, maximum width 2400px. That is *in addition to* the Astro
optimisation above — it stops a 12MB camera JPEG entering git in the first
place.

**Bad paths fail loudly.** If a content file points at an image that is not in
`src/assets/uploads/`, the build aborts with a message listing what is actually
available, rather than emitting a broken `<img>`:

```
[images] No uploaded asset matches "/public/uploads/oops.jpg"
Images must live in src/assets/uploads/ so they are optimised at build time.
Available uploads:
  /src/assets/uploads/hero-innovation-lab.jpg
```

---

## Verifying the rendered output did not change

The hero and FAQ were first built with the copy hardcoded inline (commit
`4c08abb`, the first commit on this branch), and that HTML was snapshotted
into `verification/baseline/`. The content was then extracted into JSON and the site
rebuilt.

```bash
npm run build
npm run verify:parity
```

Result: the two builds are the same size and differ by **exactly one byte per
locale** — a space where markdown now emits a newline, between the two
paragraphs of the one multi-paragraph FAQ answer. Whitespace between block-level
elements is not rendered, so the visible page is unchanged. Everything else —
all markup, all attributes, the image URL and hash, both meta tags — is
byte-identical. See "Known limitations" for the detail.

---

## Moving from local mode to GitHub-backed auth in production

Local mode is for demos. In production the CMS authenticates against GitHub and
commits to the repository. GitHub's OAuth flow requires a client *secret*, which
cannot live in a static page, so it needs a small auth relay.

**These steps have not been executed — this prototype only runs in local mode.**

### 1. Create a GitHub OAuth App

GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**

* Homepage URL: `https://umcinnovation.com`
* Authorization callback URL: your auth relay's callback (from step 2)

Note the **Client ID** and generate a **Client Secret**.

### 2. Deploy an OAuth relay

The maintained option is
[`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth), a Cloudflare
Workers app. Deploy it and set these environment variables:

| Variable | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | from step 1 |
| `GITHUB_CLIENT_SECRET` | from step 1 |
| `ALLOWED_DOMAINS` | `umcinnovation.com` |

Then set the callback URL from step 1 to
`https://<your-worker>.workers.dev/callback`.

*(If you would rather not add Cloudflare: the same handshake can be implemented
as two Vercel serverless functions on the existing deployment. That keeps
everything on one platform but is code you then own and maintain.)*

### 3. Point the CMS at the relay

In `public/admin/config.yml`, add `base_url` to the existing backend block and
confirm the repo and branch:

```yaml
backend:
  name: github
  repo: BrightDigitalNZ/umcinnovation   # ← confirm the real repo path
  branch: main
  base_url: https://<your-worker>.workers.dev
```

### 4. Grant the client access

Add them as a collaborator on the repository with **write** permission. Sveltia
uses their GitHub identity, so commits are correctly attributed and repository
permissions are the access control.

### 5. Leave `local_backend: true` in place

It only activates on `localhost`, so it is safe in production and keeps the
offline demo working.

### 6. Decide how edits reach production

* **Direct to `main`** (as configured): a save commits straight to `main` and
  Vercel rebuilds. Simple; no review step.
* **Editorial workflow**: add `publish_mode: editorial_workflow` so saves open a
  pull request instead. Slower, but gives you a Vercel preview deployment and a
  review gate before anything goes live. **Recommended** given the client will be
  editing production copy across 7 locales.

### 7. Consider protecting `/admin`

The page itself contains no secrets and writes require GitHub auth, so this is
optional. `public/admin/index.html` already sets `noindex, nofollow`. If you want
it fully private, Vercel Deployment Protection can password-gate the path.

---

## Known limitations

Read this before planning a rollout.

1. **Image previews inside the CMS in production.** Because `public_folder`
   points at `/src/assets/uploads` (which is required for the optimisation chain
   to work), the CMS builds preview URLs that resolve during `astro dev` — Vite
   serves `/src/...` — but do **not** resolve on the deployed site, where `/src/`
   does not exist. Newly uploaded images preview fine (from a local blob);
   previously-saved images may show a broken thumbnail in the production editor.
   The published website is unaffected. This needs testing on a real deployment,
   and is the main open question in this prototype.

2. **One byte of whitespace differs per locale.** Markdown emits `</p>\n<p>`
   where the hardcoded source produced `</p> <p>`. Not rendered, so the page is
   visually identical. If byte-equality matters to your diff tooling, normalise
   the renderer output — but note that adds a transform to every future FAQ
   answer for a cosmetic gain.

3. **Local mode is Chromium-only.** File System Access API. No Firefox, no
   Safari.

4. **File collections rewrite the whole file on save.** Any JSON key without a
   matching field in `config.yml` is dropped. `faq.heading` is therefore declared
   as a `hidden` field so it survives. Every future field must be declared, even
   if it is not meant to be editable.

5. **No side-by-side translation UI.** One file per locale (per the brief) means
   English and Spanish are separate CMS entries. Sveltia's built-in i18n mode
   would show locales side by side in one editor, but uses a different file
   layout. Worth revisiting before extending to all 7 locales.

6. **The FAQ section heading is not client-editable.** It lives in the content
   file (it has to, for translation) but is exposed as a `hidden` field, because
   the brief specified question and answer fields only. Trivial to expose if you
   want it.
