# BreadFlows — GitHub Pages edition

The public site for **https://breadflows.com**, published from this repository's **main branch / root**. The original domain and GitHub Pages configuration are retained.

## What works

- 26 music tracks and 23 video, clip and teaser entries; search and filters.
- AXIOMORT leads the homepage carousel, followed by SIGNAL_404 and Collaborations.
- Episode collections, delayed muted previews, preview-position handoff to full video, persistent music playback and Spotify links.
- Official inline AIU.FM player, mobile touch controls and keyboard/TV navigation.
- Music-video enquiries compose an email to **contact@breadflows.com**. The visitor must press Send in their own email app. No enquiry is submitted or stored by this site.
- Merch and CDs/vinyl show upcoming states until real product information is supplied.

This static edition has **no accounts, shared comments, uploads, creator studio, database or YouTube comment imports**. The separate full Sites version remains available privately with those backend capabilities. No server or API keys are needed for this edition.

## Edit and build

Use Node 22.13+ (Node 24 used for this build):

```sh
npm ci
npm run typecheck
npm run build
npm test
npm run publish:files
```

Commit the source changes **and the generated root files**, then push `main`. GitHub's existing Pages publishing builds the root without Jekyll; `.nojekyll` is included. There is no new Actions workflow or hosting account to configure.

- `pages-app/src/`: React source and copied design components.
- `pages-app/src/lib/catalog.json`: curated music/video metadata.
- `pages-app/src/lib/collections.ts`: series descriptions and episode grouping.
- `pages-app/src/lib/products.json`: currently empty; add only real products with HTTPS hosted-checkout links.
- `media/`: artwork and MP3 listening copies, kept at stable public URLs.
- `scripts/prerender.mjs`: renders every known route as real HTML, with page metadata, a sitemap and a real 404 page.
- `scripts/publish-files.mjs`: copies the validated static build into the Pages root.

The client router keeps music playing across navigation. Direct navigation to a release or collection uses its own `index.html`, so GitHub Pages needs no catch-all rewrite or hash routing. Product routes must also be included in the page list before publishing products.

## Validation and rollback

Automated checks cover catalog/media completeness, all rendered internal links and assets, removal of backend-only controls, homepage series order, radio inclusion and safely encoded enquiry drafts. Physical TV hardware and delivery through a visitor's email app still depend on those devices/services.

The site before this release is commit `d776a34a76d6f98dff2ccb29d1bde08cac686e69`. Roll back using GitHub's revert operation on the hub deployment commit; the prior website and historical assets remain recoverable in Git. Preserve `CNAME` and existing DNS settings.
