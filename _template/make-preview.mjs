/*
 * Generates _template/preview.html — the template with a fake sheet baked in,
 * so every section (including the 20 new keys) can be eyeballed on a phone
 * without wiring a real client sheet.
 *
 *   node _template/make-preview.mjs
 *
 * preview.html is a throwaway: it is regenerated from index.html every run, so
 * it can never drift from the template. It is NOT a client page — the demo
 * content below is deliberately generic placeholder text.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(HERE, 'index.html'), 'utf8');

const DEMO = {
  property_name: 'Template Preview',
  location: 'Algarve, Portugal',
  welcome_note: "This is placeholder text so you can see how the welcome note renders. It supports several paragraphs. | - Check-in from 16:00 | - Checkout by 10:00 | Anything after the bullets becomes a paragraph again.",
  host_availability: 'Reachable 08:00–20:00 daily, and any time for urgent problems.',

  checkin_time: '16:00', checkout_time: '10:00',
  wifi_name: 'PreviewNetwork', wifi_password: 'preview1234', router_location: 'Shelf by the front door',
  parking: 'Free street parking directly outside. The two marked bays belong to the building next door, so avoid those.',
  ev_charging: 'Nearest charger is at the supermarket car park, about 5 minutes away. There is no charge point at the property.',
  pool: 'Shared pool, open 09:00–20:00. No lifeguard, children must be supervised.',
  flexibility: 'Early check-in and late checkout are usually possible outside high season — just ask.',
  postal_info: 'Parcels can be left with the neighbour in flat 2 if you are out.',
  delivery_address: 'Rua do Exemplo 12, 8600-000 Preview, Portugal',
  address: 'Rua do Exemplo 12, 8600-000 Preview',
  gps: 'https://maps.app.goo.gl/example',

  checkin_steps: '1. Park in the marked bay. 2. Take the stairs to the first floor. 3. The door is on your right. 4. Drop your bags and put the kettle on.',
  keys_info: 'Two sets of keys on the hook inside the door. Please leave both when you go.',
  keysafe_location: 'On the wall to the left of the main entrance, below the letterboxes.',
  access_floor: 'First floor, door on the right. There is no lift.',
  gate_info: 'The pedestrian gate is on the latch during the day and locks automatically after 21:00.',
  luggage_storage: 'Bags can be left in the hallway cupboard on your last day if you have a late flight.',

  bedrooms_capacity: '2 bedrooms · 1 double, 2 singles · sleeps 4',
  included_items: 'Bed linen, Towels, Beach towels, Hairdryer, Iron and board, Travel cot, High chair',
  kitchen_info: 'Fully equipped. Salt, pepper, oil and coffee are there for you to use.',
  oven: 'Electric fan oven. The dial on the left is the timer — it must be set to the clock symbol or the oven will not heat.',
  dishwasher: 'Under the sink. Tablets in the cupboard above.',
  coffee_machine: 'Nespresso. A few capsules are provided; more from the supermarket.',
  washing_machine: 'In the bathroom. Programme 3 is a good 40°C everyday wash, about 90 minutes.',
  tv_info: 'Smart TV with Netflix and YouTube. Sign into your own accounts and sign out before you leave.',
  ac_info: 'Units in both bedrooms and the living room. Please close the windows while they run.',
  heating_info: 'Electric wall panels in each room. The thermostat is in the hallway.',
  wood_burner: 'Wood burner in the living room. A basket of wood is provided; please do not burn anything else in it.',

  bathroom_info: 'One full bathroom with a bath and overhead shower, plus a separate WC off the hallway.',
  hot_water: 'Gas boiler, instant hot water. Nothing to switch on.',
  gas_info: 'Gas bottle in the cupboard on the balcony. If the hob stops, the bottle is empty — call us and we will swap it.',
  plumbing_info: 'Please do not put anything other than paper down the toilet. The stopcock is under the kitchen sink.',

  fuse_box: 'In the hallway cupboard, above the coats. If everything goes off, flip the large switch back up.',
  shutters_windows: 'Electric shutters in both bedrooms — the switch is beside each window. The living room shutters are manual, using the strap.',
  bins_location: 'Communal bins at the end of the street. Yellow is plastic, blue is paper, green is glass.',
  manuals_location: 'Appliance manuals are in the drawer under the TV.',

  security_info: 'Please lock the door and close the shutters whenever you go out, even briefly.',
  alarm: 'Alarm panel by the front door. It is not armed during your stay — please leave it alone.',
  security_light: 'The outside light is on a motion sensor and switches itself off after two minutes. That is normal.',
  fire_safety: 'Extinguisher under the kitchen sink, fire blanket beside the hob. Smoke alarm in the hallway.',

  bbq_info: 'Charcoal BBQ on the terrace. Please let it cool fully and empty the ash before you leave.',
  sun_products: 'Four sun loungers, two parasols and a cool box are in the storage cupboard on the terrace.',
  fruit_trees: 'The lemon and orange trees in the garden are yours to pick from — please help yourself.',
  pests_info: 'Ants and the occasional gecko are normal here. Keep food sealed and the terrace door shut at dusk.',

  staff_housekeeper: 'Comes every Monday morning for about two hours. Just let her in and carry on with your day.',
  staff_pool: 'Services the pool on Wednesdays. He only needs access to the pool gate.',
  staff_gardener: 'Comes on Fridays to water and tidy. He works outside only.',

  house_rules: 'No smoking indoors, No parties or events, Quiet hours 22:00 to 08:00, No pets, Maximum 4 guests',
  smoking_areas: 'Smoking is fine on the terrace and balcony. Please use the ashtray provided and not the plant pots.',
  long_stay_cleaning: 'Stays over 14 nights include a mid-stay clean and a change of linen. We will arrange the day with you.',
  breakages: 'Accidents happen — just tell us. Small breakages are not charged for; we only ask that you let us know so we can replace things for the next guest.',
  al_licence: 'Alojamento Local registration nº 00000/AL. A copy of the licence is in the folder on the shelf.',

  tap_water: 'Safe to drink, though most guests prefer bottled.',
  distance_centre: '8 minutes walk',
  atm_info: 'Two ATMs on the main square, both outside banks. The one inside the supermarket charges a fee.',
  getting_around: 'On foot — Most of the town is walkable in 15 minutes | Local bus — Stop at the end of the road, roughly hourly | Taxi — About 10 minutes to the next town',
  supermarkets: 'Large supermarket — 5 min drive, open until 21:00 — https://maps.app.goo.gl/example | Corner shop — 3 min walk, bread and basics',
  pharmacy_atm: 'Town pharmacy — On the main square, 8 min walk — https://maps.app.goo.gl/example | Late-night pharmacy — Rotates weekly, notice posted in the window',
  hospital: 'District hospital — 20 min drive, 24h emergency — https://maps.app.goo.gl/example | Local health centre — 10 min drive, appointments only',

  beaches: 'Main beach — 10 min walk, lifeguard in summer, cafe at the top of the steps — https://maps.app.goo.gl/example | Quiet cove — 15 min drive, no facilities, best at low tide | Long sandy beach — 25 min drive, plenty of parking, good for kids',
  restaurants: 'Harbour grill — Fish and seafood, 10 min walk, book at weekends — https://maps.app.goo.gl/example | Corner tasca — Portuguese home cooking, very good value, cash only | Pizzeria — 5 min walk, does takeaway',
  activities: 'Coastal walk — Follows the cliffs for about 6km, start early in summer | Boat trip — Leaves from the harbour, book the day before — https://maps.app.goo.gl/example | Market — Saturday mornings in the town square',
  activities_kids: 'Water park — 30 min drive, open June to September | Playground — In the town park, shaded, 10 min walk | Mini golf — By the beach, open evenings',

  checkout_checklist: 'Strip the beds and leave linen in the bathroom, Empty the fridge and take rubbish to the bins, Wash and put away any dishes, Close all windows and shutters, Turn off the air conditioning and lights, Leave both sets of keys on the kitchen table',

  contact_primary_name: 'Your Host — first point of contact',
  contact_primary_phone: '+351 900 000 001',
  contact_owner_name: 'Property Owner',
  contact_owner_phone: '+351 900 000 002',
  contact_taxi: 'Town Taxi — 289 000 000 | Airport transfer — 289 000 001',
  emergency: '112 (general emergency) | Local police — 289 000 002',
  whatsapp_number: '+351 900 000 001',
  expiry_date: '',
};

// A neutral placeholder tile so the gallery layout is visible without shipping
// any client photography.
const swatch = label => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#E8EAEC"/><text x="400" y="310" font-family="Montserrat,sans-serif" font-size="44" font-weight="700" fill="#9BA3AB" text-anchor="middle">${label}</text></svg>`
);

const csv = Object.entries(DEMO)
  .map(([k, v]) => `"${k}","${String(v).replace(/"/g, '""')}"`).join('\n');

let out = HTML;

// Swap the REPLACE-SLUG image paths for inline placeholders.
out = out.replace(/\/clients\/REPLACE-SLUG\/assets\/images\/([a-z-]+)\.(jpg|png)/g,
  (_, name) => swatch(name.replace(/-/g, ' ')));

// Replace the live fetch with the demo sheet above.
out = out.replace(
  /const SHEET_URL = '[^']*';/,
  `const SHEET_URL = 'demo';\n    const DEMO_CSV = ${JSON.stringify(csv)};\n    window.fetch = () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(DEMO_CSV) });`
);

out = out.replace('<title>Guest Information</title>',
  '<title>Template Preview — not a client page</title>');

writeFileSync(join(HERE, 'preview.html'), out);
console.log(`preview.html written — ${Object.keys(DEMO).length} demo keys, ${out.length} bytes`);
