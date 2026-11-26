# 48 Timer Festival

A bilingual Next.js App Router site. All 28 public pages are rendered using native React components. Festival content is structured in `content/native-pages.json`; the homepage, programme, inner pages, gallery, map, forms, navigation and footer share the festival design system. WordPress snapshots remain in the repository only as source material for the offline content migration. The public website does not load Divi stylesheets or scripts.

## Run locally

Use Node 24. Run `npm ci`, then `npm run dev`. Visit `/` for Danish, `/en/` for English and `/admin` for the editor. Local drafts and publications use a gitignored JSON file unless a private Blob token is configured.

## Deploy

Push the project to GitHub and import it in Vercel using the Next.js preset. Connect a dedicated private Vercel Blob store using the default OIDC connection or a BLOB_READ_WRITE_TOKEN. Use separate stores for preview and production if both environments need independent editorial state.

## Edit

Section backgrounds apply to the corresponding Danish and English sections; shared navigation, footer and countdown settings apply globally. Fonts, weights, line heights and letter spacing apply to the four type roles. Images can be replaced using the device picker. The programme editor supports bilingual events for 14–16 May 2027, including day, time, category and venue. Save draft, preview, publish and restore previous use the existing Blob document.

## External services

Original imagery remains available through the image asset proxy, with optimized responsive images and support for Blob replacements. Event registration submits to the existing Google Forms destination. Volunteer registration uses a native form with the original live WordPress submission fields and user-entered verification question, with a link to the original form if it cannot be loaded. The original site must remain available for volunteer submission and source asset delivery. The archive map uses Leaflet and Esri map tiles. Real form delivery should be checked with the festival organisers before switching the domain.

## Content migration

Run `npm run migrate-content` to regenerate structured page content from the archived compressed snapshots. This is deliberate maintenance; normal Next.js builds use the checked-in structured JSON directly. Reconcile field IDs and image keys before replacing snapshots.
