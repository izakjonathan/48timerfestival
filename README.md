# 48 Timer Festival

Next.js migration of the Danish and English public site at https://www.48timerfestival.dk/en/. The homepage and programme in both languages use native App Router pages and shared navigation and footer. The remaining routes retain the imported WordPress/Divi content, with the new shared navigation and footer. The saved snapshot is `content/pages.json.gz`; development and build commands unpack it automatically. This GitHub version serves static assets through the original festival host. The migration ZIP contains the local asset snapshot under `public/festival-assets` and those assets can be added here. Pages are served by the Next.js App Router.

## Run locally

Use Node 24. Run `npm ci`, then run `npm run dev`. Visit `/` for Danish, `/en/` for English and `/admin` for the editor. The editor is open to anyone who can reach it. Local drafts and publications use a gitignored JSON file unless a private Blob token is configured.

## Deploy

Push this project to a GitHub repository and import it in Vercel using the Next.js preset. Connect a dedicated **private Vercel Blob** store using Vercel’s default OIDC connection or a `BLOB_READ_WRITE_TOKEN`. Use separate stores for preview and production if both environments need independent editorial state. The existing festival domain can continue serving WordPress during review.

## Edit

Use **Section backgrounds** to choose a festival color for a page section. Choices apply to the matching Danish and English sections, and shared sections apply sitewide. Use **Fonts** to set Google Fonts for main headings, subheadings, buttons and menu links, and body text. Use **Images** to replace images with the device’s photo or file picker. Replacements apply wherever the same imported image is used. The homepage offers a desktop poster and an optional mobile poster override.

**Program** lets you add bilingual events for 14–16 May 2027, with start/end times, category, venue, description and an optional event link. The public programme shows day, category, venue and search filters when events are published.

**Save draft** stores changes for later. **Publish** applies them to the public pages. **Restore previous** restores the preceding publication, including its colors and images. Large photos are resized when the browser can open them. External embeds and images loaded dynamically by third-party services remain managed at their source.

## WordPress dependencies

Volunteer form actions and EventON integration still refer to WordPress and require a working origin. A small number of missing assets fall back to the existing host. Test form delivery, live calendar interactions, gallery and navigation on the new deployment before any DNS cutover. For a fully independent migration, move these functions and outstanding assets off WordPress first.

Refresh the baseline only deliberately. `python scripts/import-site.py` requires Python, lxml and curl. Field IDs are assigned in document order, so a new import can invalidate existing editorial overrides. Back up and reconcile published data before replacing a baseline.
