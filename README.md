# BreadFlows — GitHub Pages edition

The public site for **https://breadflows.com**, built from **main** and deployed by **GitHub Actions**. The custom domain stays breadflows.com.

## What works

- Automatically refreshed Spotify releases and YouTube uploads, plus the curated music, album and series collection; search and filters. The 26 existing hosted audio tracks keep native playback; the soundtrack and three added singles use official Spotify players loaded on request.
- AXIOMORT leads the homepage carousel, followed by SIGNAL_404 and Collaborations.
- Episode collections, delayed muted previews, preview-position handoff to full video, persistent music playback and Spotify links.
- Official inline AIU.FM player, mobile touch controls and keyboard/TV navigation.
- Commission and collaboration enquiries submit directly through FormSubmit to **contact@breadflows.com**, with all seven fields and the visitor’s reply email. Success requires an accepted provider response; errors preserve the draft. Inbox activation and delivery were confirmed by the owner.
- Merch and CDs/vinyl show upcoming states until real product information is supplied.

This static edition has **no accounts, shared comments, uploads, creator studio, database or YouTube comment imports**. The separate full Sites version remains available privately with those backend capabilities. No server or API keys are needed for this edition.

## Edit and build

Use Node 22.13+ (Node 24 used for this build):

```sh
npm ci
npm run typecheck
npm run build
npm test
python -m unittest discover -s tests -p "test_*.py"
```

Commit source changes and push `main`. `.github/workflows/publish.yml` builds, tests and deploys `.pages-build` directly to GitHub Pages. Do not regenerate root HTML for routine changes: those files are retained only for historical rollback. The same workflow checks public releases at 00:17, 06:17, 12:17 and 18:17 UTC and supports manual **Run workflow**. GitHub may delay scheduled runs.

- `pages-app/src/`: React source and copied design components.
- `pages-app/src/lib/catalog.json`: curated music/video metadata.
- `tests/release-audit.json`: releases verified against the public Spotify artist page on 2026-09-07. AXIOMORT uses the current 18-track Original Motion Picture Soundtrack edition; newer singles are AXIOMOTOR and QWERTY APE SHACK, plus the previously missing Sovereign Zero audio release. Tests check their music shelf visibility and the complete album track list.
- `pages-app/src/lib/collections.ts`: series descriptions and episode grouping.
- `pages-app/src/lib/products.json`: currently empty; add only real products with HTTPS hosted-checkout links.
- `media/`: artwork and MP3 listening copies, kept at stable public URLs.
- `scripts/prerender.mjs`: renders every known route as real HTML, with page metadata, a sitemap and a real 404 page.
- `scripts/publish-files.mjs`: historical export helper, no longer the deployment path.
- `scripts/sync_catalog.py`: reads the official YouTube Atom feed and public Spotify artist/release metadata.
- `scripts/catalog-sync-state.json`: last successful provider checks, processed Spotify albums and errors.
- `scripts/catalog-sync-config.json`: exclusion list for intentionally omitted releases.

The client router keeps music playing across navigation. Direct navigation to a release or collection uses its own `index.html`, so GitHub Pages needs no catch-all rewrite or hash routing. Product routes must also be included in the page list before publishing products.

## Validation and rollback

The catalogue automatically imports public Spotify releases and YouTube uploads every six hours. New uploads appear in Latest videos and Watch; music appears in Music and search. Existing titles, credits, artwork, audio files, episode numbers, extras and series membership are preserved. Series assignments remain editorial. When manually adding or editing a release, verify its metadata before building. Album tracks use `albumId` and `trackNumber`; they appear on the album page and in search, while main music shelves show one card per album or single. Never use a Spotify preview URL as a full audio file.

Automated checks cover catalog/media completeness, all rendered internal links and assets, removal of backend-only controls, homepage series order, radio inclusion and direct enquiry payloads and provider failure handling. Physical TV hardware still requires testing on those devices. The owner confirmed receipt of the direct contact-form delivery test.

The site before this release is commit `d776a34a76d6f98dff2ccb29d1bde08cac686e69`. Roll back using GitHub's revert operation on the hub deployment commit; the prior website and historical assets remain recoverable in Git. Preserve `CNAME` and existing DNS settings.

AIU.FM adapts by viewport: compact (80px) through 650px, stacked standard (300px) through 1024px, and the original wide (300px) above that. Phones use device volume and omit the extra outbound control. A single iframe is retained during navigation; changing across a layout breakpoint reloads the provider player.

## Contact delivery

`pages-app/src/lib/contact.ts` sends only the allowed fields to the fixed FormSubmit AJAX endpoint. No SMTP credentials or API secrets are exposed. FormSubmit handles mail delivery and retains submissions for 30 days. The owner must activate contact@breadflows.com using the provider email. Test via the live commission page and confirm actual inbox receipt; an HTTP success confirms provider acceptance, not inbox delivery. The UI prevents duplicate in-flight submissions and does not retry automatically.

## Automatic release refresh

The importer uses no account credentials: YouTube's official channel feed and Spotify's public artist and embed pages. Spotify does not offer an equivalent public RSS feed; its page metadata format can change. If either provider fails, that provider's existing releases remain and the other provider's valid updates may still publish; the workflow then reports failure so the owner sees it in Actions. No release is deleted merely because it disappears from a limited feed. The YouTube feed currently exposes its 15 latest uploads, so a burst of more than 15 between checks or a long outage may require a backfill. Spotify discovers the latest/public discography entries and reads each new album's full embed track list once. This imports public metadata and streaming links, never audio files or unpublished drafts.

To permanently omit an imported item, put its YouTube ID or Spotify URL in `scripts/catalog-sync-config.json` under `excluded`, and remove its existing entry from `catalog.json`. An album URL excludes its tracks too. Existing entries are never deleted by sync. To re-read an album's track list, remove its ID from `spotifyAlbums` in the state file and run the workflow. Review changed editions manually rather than deleting curated tracks automatically.

A daily check record is committed even when there are no new releases, keeping activity recorded between releases. Catalogue changes are committed only after the complete build and tests pass; all generated routes and media ship together in the Pages artifact. Concurrent publication is serialized, and a stale checkout refuses to overwrite a newer push.
