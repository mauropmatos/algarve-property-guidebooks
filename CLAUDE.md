# Algarve Property Guidebooks

## Stack
Plain HTML, one page per client. Content comes live from each client's Google Sheet via CSV export. Vercel auto-deploys from main. GitHub repo: mauropmatos/algarve-property-guidebooks.

## Read this first, trust it
This file is the source of truth for how the repo works. Do not re-derive the process by reading old client pages, and do not copy a client page to start a new one. Per-client content work is SHEET editing, not code editing. Code changes happen for two reasons only: a new client page (checklist below) or a template fix.

## Principle: robustness before features
Client pages are paid deliverables and cannot break.
- Before any new feature: confirm the current build renders from its sheet, handles empty/missing keys, and fails gracefully if the sheet is unreachable.
- Data handling (sheet fetch, CSV parse, key matching, hidden-when-empty) takes priority over visual polish.
- Features ship only when verified on a phone against the real sheet.
- Balance clause: this is a gate, not a parking brake. Basics pass = build proceeds.

## Git discipline (non-negotiable)
- Branch per client / per change. Never work on main.
- Commit and push are separate, explicit approvals from Mauro.
- Never merge without a phone test on the latest Vercel preview URL (Deployments tab, it changes every push).
- Delete the branch after merge.

## The template is current — use it
_template/index.html IS the master. Version 2 (Nov 2026, branch redesign-v2) is the guest guide redesign: Home, Arrive, House, Explore and Checkout tabs, a Contacts sheet, search, and quick fixes. It is built from the approved prototype in Claude's workspace, so do not hand-edit large parts of it; template changes go back through that source.
- A client page is still a copy with two swaps: `REPLACE-SLUG` (image folder) and `REPLACE-SHEET-ID` (in SHEET_URL). Both sit in the PER-CLIENT SETTINGS block at the top of the script.
- It reads the new sheet keys first and falls back to the old ones (contact_primary_name, host_availability, flexibility, luggage_storage, included_items), so an old sheet still renders before its new rows are added.
- It keeps the last good copy of the sheet on the guest's phone and opens from it when the signal is weak (4 second wait). With no copy and no signal, it shows a "try again" screen instead of an empty page.
- Photos: hero.jpg, optional host.jpg (the host's face on the cards), and the gallery files named in the sheet's `photos` row ("living-room — Living room | terrace — The terrace"). Missing files are skipped.
- expiry_date and tips_hide work as before. The Tips Library is now built into the page (73 tips), not fetched from the Tips sheet.
- The "Add a note" Google Form is not in version 2 (open question for Mauro).
- The old test tools (test-live-sheet.mjs, test-empty-keys.mjs, make-preview.mjs) were written for version 1 and do not test version 2. Claude runs the version 2 gate (all client sheets, broken and empty sheets, offline, phone widths, accessibility) from its workspace until they are replaced.
Client pages on version 1 (cantinhodapraia, luzbeachhouse, omarafado, joao-demo, pdm10) keep working unchanged until each is moved, one at a time, with its own phone test.

## New client checklist (the whole job)
1. Sheet: in the GuestPage Drive, copy "GuestPage Master Property Sheet (copy per client)", rename to the property, fill it during onboarding. Share: anyone with the link, viewer (required for CSV export). Column C is guidance for filling — the page reads only columns A and B.
2. Branch: `git checkout -b <slug>`.
3. Copy: `cp -r _template clients/<slug>`, then delete the three .mjs files from the copy (clients ship index.html + assets only).
4. Two swaps in clients/<slug>/index.html: replace every `REPLACE-SLUG` with the slug; set `SHEET_URL` to `https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv`.
5. Gate: `node _template/test-live-sheet.mjs <SHEET_ID>` — no blank keys visible, no orphan headings, no empty accordions, no filled sheet key without a template slot.
6. Photos (whenever they arrive, page ships fine without them): /clients/<slug>/assets/images/, hero.jpg plus content-named lowercase JPGs, quality 80, max 1600px wide. Missing tiles remove themselves and pruneEmpty drops the Photos section.
7. Branded URL: add the rewrite in the guestpage-landing repo (slug = folder, copy the existing pattern), so guestpagealgarve.com/<slug> serves the page.
8. Phone test on the Vercel preview URL → Mauro approves → merge to main → delete branch.

## Content rules
- Content lives in the Google Sheet, not the HTML. Empty sheet key = hidden section.
- List keys use " | " between items and " — " between name, description and link within an item. Simple lists (house_rules, checkout_checklist, included_items) are comma-separated.
- Keysafe and access codes are NEVER rendered on the page or written in the sheet. Codes go to each guest directly.
- The sheet's first tab is what the page reads (CSV export takes sheet 1).

## Delivery
- Mandatory pre-delivery audit before any client delivery: full sheet read against rendered page.
- Delivery email covers: the live link, the QR card attachment, the sheet link with edit instructions, the payment details.

## Clients (live)
cantinhodapraia · luzbeachhouse · omarafado · pdm10 · joao-demo (demo page, safe to copy nothing from)
pdm10 is the one legacy page: its hero lives at root /assets/images/pdm10-hero.jpg by relative path. Every other client keeps everything under its own folder.

## Known legacy (delete when convenient, nothing references them)
- guidebook-generator/ — pre-sheet PDF generator, superseded by the live pages.
- Root landing files (index.html, about.html, contact.html, styles.css, logo.svg, images/, the stray pexels-*.jpg) — the public site lives in the guestpage-landing repo; these are the old copy.
- Root assets/ — only pdm10-hero.jpg matters; migrate it into clients/pdm10/ and the folder can go.

## Design system
Font: Montserrat · Primary #1AA3DC · Navy #1C1C5C · Background #FFFFFF · Card #F8F9FB · Border #E8EAEC · Grey #9BA3AB
