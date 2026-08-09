/*
 * Robustness gate: render _template against a REAL client sheet.
 *
 * Synthetic data does not have the quirks real sheets do (smart quotes, stray
 * newlines, " | " separators, phone formats). This points the rebuilt template
 * at a live published sheet and reports what it rendered, so a regression in
 * the union template shows up before any client sees it.
 *
 *   JSDOM_PATH=/tmp/gp-test/node_modules/jsdom node _template/test-live-sheet.mjs <sheetId>
 */
import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const { JSDOM } = await import(
  process.env.JSDOM_PATH ? pathToFileURL(join(process.env.JSDOM_PATH, 'lib/api.js')).href : 'jsdom'
);

const SHEET_ID = process.argv[2];
if (!SHEET_ID) { console.error('usage: node _template/test-live-sheet.mjs <sheetId>'); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(HERE, 'index.html'), 'utf8');

const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const res = await fetch(url);
if (!res.ok) { console.error(`Sheet fetch failed: HTTP ${res.status}`); process.exit(1); }
const csv = await res.text();

const dom = new JSDOM(HTML, {
  runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true,
  beforeParse(window) {
    window.fetch = () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(csv) });
    window.Element.prototype.scrollIntoView = function () {};
  },
});
const w = await new Promise(r => setTimeout(() => r(dom.window), 200));
const d = w.document;

const shown = el => {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (n.style && n.style.display === 'none') return false;
  return true;
};
const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();

// Keys present in the sheet vs keys the template can actually place on the page.
const sheetKeys = csv.replace(/\r/g, '').split('\n')
  .map(l => (l.match(/^"?([a-z0-9_]+)"?,/) || [])[1]).filter(Boolean);
const sheetFilled = csv.replace(/\r/g, '').split('\n')
  .map(l => l.match(/^"?([a-z0-9_]+)"?,\s*"?(.*?)"?\s*$/))
  .filter(m => m && m[2].trim()).map(m => m[1]);
const templateKeys = [...new Set([
  ...[...HTML.matchAll(/data-(?:key|list|steps|checklist|inclusion|rulelist|accordion-text|accordion-list)="([a-z0-9_]+)"/g)].map(m => m[1]),
  'property_name', 'location', 'welcome_note', 'host_availability', 'postal_info', 'delivery_address',
  'address', 'gps', 'whatsapp_number', 'contact_primary_name', 'contact_primary_phone',
  'contact_owner_name', 'contact_owner_phone', 'contact_taxi', 'emergency', 'expiry_date',
])];

console.log(`Sheet ${SHEET_ID}`);
console.log(`  rows: ${sheetKeys.length}   filled: ${sheetFilled.length}\n`);

console.log('Sections rendered:');
d.querySelectorAll('.section').forEach(s => {
  const vis = shown(s);
  const chars = text(s).length;
  console.log(`  ${vis ? 'shown ' : 'hidden'}  ${s.id.padEnd(12)} ${vis ? chars + ' chars' : ''}`);
});

console.log('\nTabs shown: ' + Array.from(d.querySelectorAll('.tab-btn')).filter(shown).map(b => text(b)).join(', '));

const unplaced = sheetFilled.filter(k => !templateKeys.includes(k));
console.log('\nFilled sheet keys the template has no slot for (' + unplaced.length + '):');
console.log(unplaced.length ? '  ' + unplaced.join(', ') : '  none');

const emptySlots = templateKeys.filter(k => !sheetFilled.includes(k));
console.log('\nTemplate slots this sheet leaves blank (' + emptySlots.length + ') — all must be invisible:');
console.log('  ' + emptySlots.join(', '));

// The contract: nothing blank may still be on screen, and no chrome left behind.
const leaked = emptySlots.filter(k => {
  const el = d.querySelector(`[data-key="${k}"], [data-accordion-text="${k}"], [data-accordion-list="${k}"], [data-list="${k}"]`);
  return el && shown(el) && text(el);
});
const orphans = [];
d.querySelectorAll('.section-heading, .subsection-heading, .card-label').forEach(h => {
  if (!shown(h)) return;
  const box = h.closest('.section, .subgroup, .card');
  if (!box) return;
  const rest = Array.from(box.children).filter(c => c !== h && shown(c))
    .map(c => text(c) || (c.querySelector('img') ? 'img' : '')).join('');
  if (!rest) orphans.push(text(h));
});
const emptyAcc = Array.from(d.querySelectorAll('.accordion')).filter(shown).filter(a => {
  const c = a.querySelector(':scope > .gallery-collapse');
  return c && !text(c) && !c.querySelector('img');
}).map(a => text(a.querySelector('.acc-label')) || a.id);

console.log('\nResult:');
console.log(`  blank keys still visible : ${leaked.length ? leaked.join(', ') : 'none'}`);
console.log(`  orphan headings          : ${orphans.length ? orphans.join(', ') : 'none'}`);
console.log(`  empty accordions         : ${emptyAcc.length ? emptyAcc.join(', ') : 'none'}`);

const ok = !leaked.length && !orphans.length && !emptyAcc.length;
console.log('\n' + (ok ? 'LIVE SHEET RENDER OK' : 'LIVE SHEET RENDER HAS PROBLEMS'));
process.exit(ok ? 0 : 1);
