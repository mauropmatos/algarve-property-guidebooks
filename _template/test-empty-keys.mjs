/*
 * Empty-key harness for _template/index.html.
 *
 * The template's contract is: a blank sheet key hides its row, card, accordion,
 * subgroup, section and tab, leaving no orphan heading and no accordion that
 * opens onto nothing. This exercises that contract against a fake sheet.
 *
 * jsdom is not a repo dependency — install it anywhere and point JSDOM_PATH at
 * the install, so the repo stays dependency-free:
 *   npm install jsdom --prefix /tmp/gp-test
 *   JSDOM_PATH=/tmp/gp-test/node_modules/jsdom node _template/test-empty-keys.mjs
 * With jsdom already resolvable from the repo, plain `node _template/test-empty-keys.mjs` works.
 */
import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const { JSDOM } = await import(
  process.env.JSDOM_PATH ? pathToFileURL(join(process.env.JSDOM_PATH, 'lib/api.js')).href : 'jsdom'
);

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(HERE, 'index.html'), 'utf8');

// Every key the template reads, gathered from the markup plus the keys the
// renderers look up directly in JS.
const ATTR_KEYS = [...HTML.matchAll(/data-(?:key|list|steps|checklist|inclusion|rulelist|accordion-text|accordion-list)="([a-z0-9_]+)"/g)].map(m => m[1]);
const JS_KEYS = [
  'property_name', 'location', 'welcome_note', 'host_availability', 'postal_info',
  'delivery_address', 'address', 'gps', 'whatsapp_number',
  'contact_primary_name', 'contact_primary_phone',
  'contact_owner_name', 'contact_owner_phone', 'contact_taxi', 'emergency',
];
const ALL_KEYS = [...new Set([...ATTR_KEYS, ...JS_KEYS])].sort();

const NEW_KEYS = [
  'access_floor', 'shutters_windows', 'gas_info', 'plumbing_info', 'pests_info',
  'long_stay_cleaning', 'smoking_areas', 'manuals_location', 'ev_charging',
  'gate_info', 'wood_burner', 'bbq_info', 'bathroom_info', 'security_info',
  'security_light', 'fire_safety', 'sun_products', 'fruit_trees', 'breakages',
  'al_licence',
];

const csvEscape = v => '"' + String(v).replace(/"/g, '""') + '"';
const toCSV = obj => Object.entries(obj).map(([k, v]) => `${csvEscape(k)},${csvEscape(v)}`).join('\n');

// Plausible values so list/step/accordion renderers all take their filled path.
function sampleValue(key) {
  if (['beaches', 'restaurants', 'activities', 'activities_kids', 'hospital', 'getting_around', 'supermarkets', 'pharmacy_atm'].includes(key))
    return 'Sample Place — a short description — https://maps.app.goo.gl/abc | Second Place — another description';
  if (key === 'checkin_steps') return '1. Park in the bay. 2. Open the door. 3. Drop your bags.';
  if (['included_items', 'house_rules', 'checkout_checklist'].includes(key))
    return 'First item, Second item, Third item';
  if (key === 'welcome_note') return 'Welcome to the house. | - Check-in from 16:00 | - Checkout by 10:00';
  if (key === 'gps') return 'https://maps.app.goo.gl/sample';
  if (key === 'whatsapp_number') return '+351 900 000 000';
  if (key === 'emergency' || key === 'contact_taxi') return 'Local Taxi — 289 000 000 | 112 (general emergency)';
  if (key.endsWith('_phone')) return '+351 900 000 001';
  if (key === 'expiry_date') return '';   // never expire the test page
  return 'Sample value for ' + key + '.';
}

function build(overrides = {}, { failFetch = false } = {}) {
  const csv = toCSV(overrides);
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously',
    url: 'https://example.test/clients/x/',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = () => failFetch
        ? Promise.reject(new Error('network down'))
        : Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(csv) });
      // jsdom has no layout, so scrollIntoView is unimplemented. Stub it rather
      // than let it throw inside the scroll-spy and mask real failures.
      window.Element.prototype.scrollIntoView = function () {};
    },
  });
  return new Promise(resolve => setTimeout(() => resolve(dom.window), 120));
}

// jsdom never loads images, so gallery <img> tags always look like content.
// A fresh template copy has no photos yet, so fire the failures explicitly.
async function failAllImages(w) {
  w.document.querySelectorAll('.gallery-item img, .hero-img, .footer-logo').forEach(img => {
    img.dispatchEvent(new w.Event('error'));
  });
  await new Promise(r => setTimeout(r, 30));
}

const shown = el => {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (n.style && n.style.display === 'none') return false;
  }
  return true;
};
const text = el => (el.textContent || '').replace(/\s+/g, ' ').trim();

// textContent includes display:none branches, so anything asserting "the guest
// sees nothing" has to walk the tree and skip hidden subtrees.
function visibleTextOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return '';
  if (node.style && node.style.display === 'none') return '';
  let out = '';
  node.childNodes.forEach(c => { out += visibleTextOf(c); });
  return out;
}

let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) { console.log(`  PASS  ${name}`); }
  else { failures++; console.log(`  FAIL  ${name}${detail ? '\n         ' + detail : ''}`); }
};

// A heading is orphaned when it is visible but everything else in its container is not.
function orphanHeadings(doc) {
  const out = [];
  const probe = (headingSel, containerSel) => {
    doc.querySelectorAll(headingSel).forEach(h => {
      if (!shown(h)) return;
      const box = h.closest(containerSel);
      if (!box) return;
      const siblingContent = Array.from(box.children)
        .filter(c => c !== h && shown(c))
        .map(c => text(c) || (c.querySelector('img') ? 'img' : ''))
        .join('');
      if (!siblingContent) out.push(`${headingSel} "${text(h)}"`);
    });
  };
  probe('.section-heading', '.section');
  probe('.subsection-heading', '.subgroup');
  probe('.card-label', '.card');
  return out;
}

// An accordion that is visible but whose collapse body has nothing in it.
function emptyAccordions(doc) {
  return Array.from(doc.querySelectorAll('.accordion'))
    .filter(acc => shown(acc))
    .filter(acc => {
      const c = acc.querySelector(':scope > .gallery-collapse');
      return c && !text(c) && !c.querySelector('img');
    })
    .map(acc => text(acc.querySelector('.acc-label, .gallery-toggle span')) || acc.id || '(unlabelled)');
}

const visibleSections = doc => Array.from(doc.querySelectorAll('.section')).filter(shown).map(s => s.id);
const visibleTabs = doc => Array.from(doc.querySelectorAll('.tab-btn')).filter(shown).map(b => b.dataset.target);

console.log(`Template reads ${ALL_KEYS.length} sheet keys.\n`);

/* --- 1. Every key blank ------------------------------------------------- */
{
  console.log('1. All keys blank');
  const blank = Object.fromEntries(ALL_KEYS.map(k => [k, '']));
  const w = await build(blank);
  const d = w.document;
  // Photos are file-driven, not sheet-driven, so a blank sheet alone leaves it
  // standing. That is correct: a client with photos but an unfilled sheet
  // should still show the gallery.
  check('only the file-driven Photos section survives a blank sheet',
    visibleSections(d).join() === 'photos', 'visible: ' + visibleSections(d).join(', '));
  await failAllImages(w);
  check('no section left visible once photos 404 too', visibleSections(d).length === 0, 'visible: ' + visibleSections(d).join(', '));
  check('no tab left visible', visibleTabs(d).length === 0, 'visible: ' + visibleTabs(d).join(', '));
  check('no orphan heading', orphanHeadings(d).length === 0, orphanHeadings(d).join('; '));
  check('no empty accordion', emptyAccordions(d).length === 0, emptyAccordions(d).join('; '));
  check('WhatsApp button hidden', !shown(d.getElementById('whatsapp-fab')));
  check('guest sees no text at all', visibleTextOf(d.querySelector('main')).trim() === '',
    visibleTextOf(d.querySelector('main')).slice(0, 160));
  console.log('');
}

/* --- 2. Every key populated --------------------------------------------- */
{
  console.log('2. All keys populated');
  const full = Object.fromEntries(ALL_KEYS.map(k => [k, sampleValue(k)]));
  const w = await build(full);
  const d = w.document;
  const secs = visibleSections(d);
  check('all 13 sections visible', secs.length === 13, 'visible: ' + secs.join(', '));
  check('all 6 tabs visible', visibleTabs(d).length === 6, 'visible: ' + visibleTabs(d).join(', '));
  check('no orphan heading', orphanHeadings(d).length === 0, orphanHeadings(d).join('; '));
  check('no empty accordion', emptyAccordions(d).length === 0, emptyAccordions(d).join('; '));
  check('hero title from sheet', text(d.querySelector('.hero-title')) === full.property_name);
  check('WhatsApp href built from number', d.getElementById('whatsapp-fab').getAttribute('href') === 'https://wa.me/351900000000',
    'got ' + d.getElementById('whatsapp-fab').getAttribute('href'));
  check('check-in steps split into 3', d.querySelectorAll('#arrival .step-item').length === 3,
    'got ' + d.querySelectorAll('#arrival .step-item').length);
  check('help contacts rendered', d.querySelectorAll('#help-contacts .contact-card').length >= 4,
    'got ' + d.querySelectorAll('#help-contacts .contact-card').length);
  const newVisible = NEW_KEYS.filter(k => {
    const el = d.querySelector(`[data-key="${k}"], [data-accordion-text="${k}"]`);
    return el && shown(el);
  });
  check(`all ${NEW_KEYS.length} new keys render`, newVisible.length === NEW_KEYS.length,
    'missing: ' + NEW_KEYS.filter(k => !newVisible.includes(k)).join(', '));
  console.log('');
}

/* --- 3. Only the new keys blank, everything else populated -------------- */
{
  console.log('3. New keys blank, existing keys populated');
  const mixed = Object.fromEntries(ALL_KEYS.map(k => [k, NEW_KEYS.includes(k) ? '' : sampleValue(k)]));
  const w = await build(mixed);
  const d = w.document;
  check('no orphan heading', orphanHeadings(d).length === 0, orphanHeadings(d).join('; '));
  check('no empty accordion', emptyAccordions(d).length === 0, emptyAccordions(d).join('; '));
  const leaked = NEW_KEYS.filter(k => {
    const el = d.querySelector(`[data-key="${k}"], [data-accordion-text="${k}"]`);
    return el && shown(el);
  });
  check('every blank new key is hidden', leaked.length === 0, 'still visible: ' + leaked.join(', '));
  // alarm is a kept, separate key — so Safety & Security must survive with only
  // the Alarm row in it, while the three blank rows around it disappear.
  const safety = Array.from(d.querySelectorAll('.acc-label')).find(l => text(l) === 'Safety & Security');
  check('Safety & Security survives on alarm alone', safety && shown(safety));
  const safetyRows = safety
    ? Array.from(safety.closest('.accordion').querySelectorAll('.prop-item')).filter(shown).map(r => text(r.querySelector('.prop-label')))
    : [];
  check('only the Alarm row remains in it', safetyRows.join() === 'Alarm', 'rows: ' + safetyRows.join(', '));
  // Outdoors is entirely new keys, so that whole accordion must be gone.
  const outdoors = Array.from(d.querySelectorAll('.acc-label')).find(l => text(l) === 'Outdoors & Grounds');
  check('all-new Outdoors & Grounds group gone', !outdoors || !shown(outdoors));
  check('sections with content still visible', visibleSections(d).length >= 10, 'visible: ' + visibleSections(d).join(', '));
  console.log('');
}

/* --- 4. Each new key alone, everything else blank ----------------------- */
{
  console.log('4. Each new key alone (20 renders)');
  let bad = [];
  for (const key of NEW_KEYS) {
    const one = Object.fromEntries(ALL_KEYS.map(k => [k, k === key ? sampleValue(k) : '']));
    const d = (await build(one)).document;
    const el = d.querySelector(`[data-key="${key}"], [data-accordion-text="${key}"]`);
    const orph = orphanHeadings(d);
    const empt = emptyAccordions(d);
    if (!el || !shown(el)) bad.push(`${key}: not rendered`);
    else if (orph.length) bad.push(`${key}: orphan ${orph.join('/')}`);
    else if (empt.length) bad.push(`${key}: empty accordion ${empt.join('/')}`);
  }
  check('each new key renders alone with no orphan/empty chrome', bad.length === 0, bad.join('\n         '));
  console.log('');
}

/* --- 5. Sheet unreachable ----------------------------------------------- */
{
  console.log('5. Sheet unreachable (fetch rejects)');
  const w = await build({}, { failFetch: true });
  const d = w.document;
  check('page does not throw, body still present', !!d.body);
  check('renders as if every key were blank', visibleSections(d).join() === 'photos', 'visible: ' + visibleSections(d).join(', '));
  await failAllImages(w);
  check('no section left visible', visibleSections(d).length === 0, 'visible: ' + visibleSections(d).join(', '));
  check('no orphan heading', orphanHeadings(d).length === 0, orphanHeadings(d).join('; '));
  check('no placeholder text leaked to the guest', visibleTextOf(d.querySelector('main')).trim() === '',
    visibleTextOf(d.querySelector('main')).slice(0, 160));
  console.log('');
}

/* --- 6. Malformed / partial sheet --------------------------------------- */
{
  console.log('6. Malformed sheet (junk rows, missing keys, stray quotes)');
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously', url: 'https://example.test/', pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = () => Promise.resolve({
        ok: true, status: 200,
        text: () => Promise.resolve('not_a_key_at_all\n,,,\n"checkin_time","16:00"\nrandom,,junk\n"welcome_note","Hi there"\n'),
      });
    },
  });
  const d = await new Promise(r => setTimeout(() => r(dom.window.document), 120));
  check('known keys still render', text(d.querySelector('[data-key="checkin_time"]')) === '16:00');
  check('welcome note rendered', text(d.getElementById('welcome-body')).includes('Hi there'));
  check('no orphan heading', orphanHeadings(d).length === 0, orphanHeadings(d).join('; '));
  check('unknown rows ignored', !text(d.querySelector('main')).includes('junk'));
  console.log('');
}

/* --- 7. Gallery images all 404 ------------------------------------------ */
{
  console.log('7. All gallery images fail to load');
  const full = Object.fromEntries(ALL_KEYS.map(k => [k, sampleValue(k)]));
  const w = await build(full);
  const d = w.document;
  d.querySelectorAll('.gallery-item img').forEach(img => {
    img.dispatchEvent(new w.Event('error'));
  });
  await new Promise(r => setTimeout(r, 30));
  check('Photos section hidden', !shown(d.getElementById('photos')));
  check('no orphan heading', orphanHeadings(d).length === 0, orphanHeadings(d).join('; '));
  check('other sections unaffected', visibleSections(d).length === 12, 'visible: ' + visibleSections(d).join(', '));
  console.log('');
}

/* --- 8. No client content hardcoded ------------------------------------- */
{
  console.log('8. Template contains no client content');
  const banned = [
    [/wa\.me\/\d/, 'hardcoded WhatsApp number'],
    [/luzbeachhouse|joao-demo|casinha|omarafado|pdm10/i, 'client slug'],
    [/Natasha|Jo[ãa]o|Edna/, 'client/host name'],
    [/Praia da Luz|Lagos, Algarve/, 'client location'],
    [/docs\.google\.com\/spreadsheets\/d\/1[A-Za-z0-9_-]{10,}/, 'real sheet ID'],
    [/recycling-info\.pdf/, 'client-specific PDF'],
    [/tel:\+?351\d/, 'hardcoded phone'],
  ];
  banned.forEach(([re, label]) => check(`no ${label}`, !re.test(HTML), (HTML.match(re) || [''])[0]));
  check('SHEET_URL is a REPLACE placeholder', HTML.includes('REPLACE-SHEET-ID'));
  check('asset paths use assets/images/', !/\/clients\/[A-Za-z-]+\/images\//.test(HTML));
  check('no gate_code / building_code / keysafe_code slot',
    !/data-key="(gate_code|building_code|keysafe_code)"/.test(HTML),
    (HTML.match(/data-key="(gate_code|building_code|keysafe_code)"/) || [''])[0]);
  console.log('');
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
