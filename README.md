# BreadFlows — GitHub Pages edition

The public site for **https://breadflows.com**, published from this repository's **main branch / root**. The original domain and GitHub Pages configuration are retained.

## What works

- 47 music tracks, the 18-track AXIOMORT album page, and 23 video, clip and teaser entries; search and filters. The 26 existing hosted audio tracks keep native playback; the soundtrack and three added singles use official Spotify players loaded on request.
- AXIOMORT leads the homepage carousel, followed by SIGNAL_404 and Collaborations.
- Episode collections, delayed muted previews, preview-position handoff to full video, persistent music playback and Spotify links.
- Official inline AIU.FM player, mobile touch controls and keyboard/TV navigation.
- Commission and collaboration enquiries submit directly through FormSubmit to **contact@breadflows.com**, with all seven fields and the visitor’s reply email. Success requires an accepted provider response; errors preserve the draft. One-time inbox activation is required.
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
- `tests/release-audit.json`: releases verified against the public Spotify artist page on 2026-09-07. AXIOMORT uses the current 18-track Original Motion Picture Soundtrack edition; newer singles are AXIOMOTOR and QWERTY APE SHACK, plus the previously missing Sovereign Zero audio release. Tests check their music shelf visibility and the complete album track list.
- `pages-app/src/lib/collections.ts`: series descriptions and episode grouping.
- `pages-app/src/lib/products.json`: currently empty; add only real products with HTTPS hosted-checkout links.
- `media/`: artwork and MP3 listening copies, kept at stable public URLs.
- `scripts/prerender.mjs`: renders every known route as real HTML, with page metadata, a sitemap and a real 404 page.
- `scripts/publish-files.mjs`: copies the validated static build into the Pages root.

The client router keeps music playing across navigation. Direct navigation to a release or collection uses its own `index.html`, so GitHub Pages needs no catch-all rewrite or hash routing. Product routes must also be included in the page list before publishing products.

## Validation and rollback

The catalogue is curated, with no automatic DistroKid or Spotify sync. When adding a release, verify its title, date, artwork, track list and streaming destination; add it to `catalog.json` and the release audit before building. Album tracks use `albumId` and `trackNumber`; they appear on the album page and in search, while main music shelves show one card per album or single. Never use a Spotify preview URL as a full audio file.

Automated checks cover catalog/media completeness, all rendered internal links and assets, removal of backend-only controls, homepage series order, radio inclusion and direct enquiry payloads and provider failure handling. Physical TV hardware and delivery through a visitor's email app still depend on those devices/services.

The site before this release is commit `d776a34a76d6f98dff2ccb29d1bde08cac686e69`. Roll back using GitHub's revert operation on the hub deployment commit; the prior website and historical assets remain recoverable in Git. Preserve `CNAME` and existing DNS settings.

AIU.FM adapts by viewport: compact (80px) through 650px, stacked standard (300px) through 1024px, and the original wide (300px) above that. Phones use device volume and omit the extra outbound control. A single iframe is retained during navigation; changing across a layout breakpoint reloads the provider player.

## Contact delivery

`pages-app/src/lib/contact.ts` sends only the allowed fields to the fixed FormSubmit AJAX endpoint. No SMTP credentials or API secrets are exposed. FormSubmit handles mail delivery and retains submissions for 30 days. The owner must activate contact@breadflows.com using the provider email. Test via the live commission page and confirm actual inbox receipt; an HTTP success confirms provider acceptance, not inbox delivery. The UI prevents duplicate in-flight submissions and does not retry automatically.
