# BreadFlows public site

This checkout publishes breadflows.com from main using `.github/workflows/publish.yml`.
Edit `pages-app/src`, validate with `npm run typecheck`, `npm run build`, `npm test`, and `python -m unittest discover -s tests -p 'test_*.py'` for importer changes. Push source changes; the workflow deploys `.pages-build`. Do not regenerate the historical root HTML with `publish:files` for ordinary changes, or revert Pages to legacy branch publishing.

The workflow refreshes public Spotify and YouTube metadata every six hours. Read `scripts/catalog-sync-state.json` for provider status. Pull/rebase before editing or pushing because the scheduled job can commit catalogue updates. Preserve curated credits, series assignments, episode numbers, extras, native audio and the commission showcase. New imported uploads initially belong to Latest videos.

The direct FormSubmit contact form is activated. The owner confirmed inbox delivery. Do not send another test email without user authorization.
