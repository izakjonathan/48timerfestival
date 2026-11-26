# 48 Timer Festival

A bilingual Next.js App Router site. All 28 public pages are rendered using native React components. Festival content is structured in `content/native-pages.json`; the homepage, programme, inner pages, gallery, map, forms, navigation and footer share the festival design system. WordPress snapshots remain in the repository only as source material for the offline content migration. The public website does not load Divi stylesheets or scripts.

## Run locally

Use Node 24. Run `npm ci`, then `npm run dev`. Visit `/` for Danish, `/en/` for English and `/admin` for the editor. Local drafts and publications use a gitignored JSON file unless a private Blob token is configured.

## Deploy

Push the project to GitHub and import it in Vercel using the Next.js preset. Connect a dedicated private Vercel Blob store using the default OIDC connection or a BLOB_READ_WRITE_TOKEN. Use separate stores for preview and production if both environments need independent editorial state.

## Edit

Section backgrounds apply to the corresponding Danish and English sections; shared navigation, footer and countdown settings apply globally. Fonts, weights, line heights and letter spacing apply to the four type roles. Images can be replaced using the device picker. Content lets you edit headings, body text, and links per language, plus shared navigation and footer copy. Festival dates are global and drive the countdown, ticker and programme days (poster artwork remains unchanged). Program supports manual bilingual events or importing approved CSV/TSV rows from a spreadsheet. Download the template in the editor, review validation and duplicate warnings, then add valid events to the draft before publishing. Registration is not connected to the import. Save draft, preview, publish and restore previous use the existing Blob document.

## External services

All 54 original image keys are mapped to independent storage in `content/archived-media.json`. Original festival press PNGs are served losslessly from `public/festival-media/press`; other images are archived as WebP in the production private Blob store. Legacy asset paths redirect to their archived equivalents; responsive image optimization and editable replacements remain supported. Keep the archive objects when cleaning up the Blob store. Event registration submits to the existing Google Forms destination. Volunteer registration uses a native form with the original live WordPress submission fields and user-entered verification question, with a link to the original form if it cannot be loaded. The original site must remain available for volunteer submission only. The archive map uses Leaflet and Esri map tiles. Real form delivery should be checked with the festival organisers before switching the domain.

## Content migration

Run `npm run migrate-content` to regenerate structured page content from the archived compressed snapshots. This is deliberate maintenance; normal Next.js builds use the checked-in structured JSON directly. Reconcile field IDs and image keys before replacing snapshots.

## Editorial tools

- **Blocks**: add text, photo, image-and-text, quote or call-to-action sections to any page, before or after its existing content. Reorder blocks and choose a brand background. Danish and English blocks are separate.
- **Media**: existing archived images and uploaded assets form a reusable library. Choose a library asset for existing image slots, blocks or social cards; use X/Y focal-point controls for cover crops. Posters and logos retain their complete artwork. Uploading stores the asset; saving a draft retains the library entry.
- **Preview**: open an unsaved draft in a desktop or 390px mobile viewport. Links and registration submissions within the framed preview are disabled; programme filters and gallery controls remain interactive.
- **History**: keep the latest 20 previous publications in the existing Blob document. Dates/revisions for versions published before this feature may be unavailable. A rollback preserves the version it replaces. Rollback restores live content and replaces the draft; the draft also retains reusable uploaded-media references.
- **SEO**: per-language titles, descriptions and image choice, canonical and hreflang tags, automatically rendered 1200×630 share cards, sitemap and robots.txt. Programme events get stable individual bilingual URLs; Event JSON-LD is emitted only when an actual venue address is supplied. Set `FESTIVAL_SITE_URL` to the canonical domain when moving off the current Vercel domain.
- **Analytics**: first-party aggregate page views by route and Copenhagen calendar day; no user identifier, cookies, referrer, query string or IP are stored by the application. DNT/GPC signals and draft previews are excluded. Counts are approximate (including potential bots, excluding visitors who leave before the delayed request), not unique visitors. Private Blob records are separate from editorial state. Hosting platform logs and data retention are subject to the hosting configuration.

## Quality checks

Run `node --test tests/*.test.mjs` for date, import, block, media, SEO and history validation. For HTTP integration testing, start a local production build with no production Blob credentials and an isolated test editor file using port 4328; run `node tests/editorial-http.mjs`. It saves, publishes and restores synthetic content locally, checks metadata and links across all 28 pages, validates event pages, share-card rendering and aggregate analytics. Never target a live deployment with this write test.

For a read-only link audit, run `node scripts/check-links.mjs https://48timerfestival-nextjs.vercel.app --external`. HTTP 404/410 responses are flagged as broken; other failures (rate limits, blocked requests, timeouts) are inconclusive and must be checked manually.
