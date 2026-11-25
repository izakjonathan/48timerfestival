# 48 Timer Festival

Next.js migration of the English public site at https://www.48timerfestival.dk/en/. The 14 imported pages retain the WordPress/Divi HTML, CSS, scripts and routes. The saved snapshot is `content/pages.json.gz`; development and build commands unpack it automatically. This GitHub version serves static assets through the original festival host. The migration ZIP contains the local asset snapshot under `public/festival-assets` and those assets can be added here. Pages are served by the Next.js App Router.

## Run locally

Use Node 24. Run `npm ci`, copy `.env.example` to `.env.local`, set `EDITOR_PASSWORD`, and run `npm run dev`. Visit `/en/` for the site and `/admin` for the editor. Sign in with the username `editor` and the configured password. Local drafts and publications use a gitignored JSON file unless a private Blob token is configured.

## Deploy

Push this project to a GitHub repository and import it in Vercel using the Next.js preset. Set `EDITOR_PASSWORD` for the deployment and connect a dedicated **private Vercel Blob** store with its `BLOB_READ_WRITE_TOKEN`. Use separate stores for preview and production if both environments need independent editorial state. The existing festival domain can continue serving WordPress during review.

## Edit

Choose a page and open a field. The preview reflects unsaved text, link and image changes. **Save draft** stores the changes for later. **Publish** applies them to the public page. **Restore previous** switches back to the previous publication. Photo uploads accept supported images under 4 MB and store a resized WebP. The editor covers captured text-only elements and image tags; embedded plugin content, styled text structures, and section layout remain in the imported markup.

## WordPress dependencies

The Danish switch goes to the existing site. Volunteer form actions and EventON integration still refer to WordPress and require a working origin. A small number of missing assets fall back to the existing host. Test form delivery, live calendar interactions, gallery and navigation on the new deployment before any DNS cutover. For a fully independent migration, move these functions and outstanding assets off WordPress first.

Refresh the baseline only deliberately. `python scripts/import-site.py` requires Python, lxml and curl. Field IDs are assigned in document order, so a new import can invalidate existing editorial overrides. Back up and reconcile published data before replacing a baseline.
