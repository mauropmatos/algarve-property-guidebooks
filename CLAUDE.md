# Algarve Property Guidebooks

## Stack
Plain HTML, Google Sheets via CSV export (live data), Vercel (auto-deploys from main), GitHub.

## Principle: robustness before features
Vibe-coded projects rot from the back end. Client pages are paid deliverables and cannot break.
- Before any new feature: confirm the current build renders from its sheet, handles empty/missing keys, and fails gracefully if the sheet is unreachable.
- Data handling (sheet fetch, CSV parse, key matching, hidden-when-empty) takes priority over visual polish.
- Features ship only when the basics they sit on are verified on a phone against the real sheet.
- Balance clause: this is a gate, not a parking brake. Basics pass = build proceeds.

## Git discipline (non-negotiable)
- Branch per client / per change. Never work on main.
- Commit and push are separate, explicit approvals from Mauro.
- Never merge without a phone test on the latest Vercel preview URL (take it from the Deployments tab, it changes every push).
- Delete the branch after merge.

## Templates
- _template is stale: last real change 2026-07-05, 445 lines against 1135-1400 in the live client pages. It has no accordions, no photo gallery, no welcome note, no checkout checklist and no help renderer — only the expiry screen survives. Do not duplicate it until it is rebuilt.
- Reference page is clients/luzbeachhouse (last change 2026-07-27) — the most current build, carrying every joao-demo pattern plus the tab hide/sync logic. clients/joao-demo (2026-07-07) is the runner-up and the cleaner start when you want a page with no real client content in it. Duplicate one of those, then swap the Sheet ID, hero, gallery and contacts.
- Fixes discovered during any build go to the template first, then per-client.
- No cross-client contamination: distances, recommendations, contacts verified per property.

## Content rules
- Content lives in the Google Sheet, not the HTML. Empty sheet key = hidden section.
- Keysafe and access codes are never rendered on the page.
- Photos: content-based lowercase names, JPG quality 80, max 1600px wide.
- Hero photo lives in the per-client folder: /clients/[slug]/assets/images/hero.jpg (joao-demo, luzbeachhouse, omarafado). Root /assets/images/ is legacy — it holds only pdm10-hero.jpg, which pdm10 alone references by relative path. The same per-client folder also holds the gallery photos, the footer wordmark and any PDFs.

## Delivery
- Branded URLs are rewrites in the guestpage-landing repo (slug = folder, copy the luzbeachhouse pattern).
- Mandatory pre-delivery audit before any client delivery: full sheet read against rendered page.

## Design system
Font: Montserrat · Primary #1AA3DC · Navy #1C1C5C · Background #FFFFFF · Card #F8F9FB · Border #E8EAEC · Grey #9BA3AB
