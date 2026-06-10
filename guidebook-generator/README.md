# Algarve Property Guidebook Generator

Generates a **print-ready A4 PDF** and a **single-file HTML** guidebook from a simple Python config.
All five language variants (English UK, English US/CA, Portuguese, French, German) appear in every section.

---

## Quick Start

### 1. Install dependencies

```bash
pip install reportlab
pip install qrcode[pil]   # optional — improves QR code quality
```

### 2. Run the example

```bash
cd guidebook-generator
python generate.py properties/example_property
```

Output lands in `output/`:
- `casa_azul_guidebook.pdf`
- `casa_azul_guidebook.html`

---

## Creating a new property

### Step 1 — Duplicate the example folder

```
properties/
  example_property/    ← copy this
  my_new_villa/        ← paste and rename
    config.py
    photos/
```

### Step 2 — Add photos

Drop JPEG or PNG files into the `photos/` folder and update the paths in `config.py`:

| Key         | Recommended size | Usage                   |
|-------------|-----------------|-------------------------|
| `cover`     | 2400 × 1600 px  | Full-bleed cover page   |
| `living`    | 1200 × 800 px   | Living area             |
| `kitchen`   | 1200 × 800 px   | Kitchen                 |
| `bedroom`   | 1200 × 800 px   | Main bedroom            |
| `exterior`  | 1200 × 800 px   | Exterior / garden       |
| `pool`      | 1200 × 800 px   | Pool (if enabled)       |

Photos are optional — grey placeholder panels appear automatically if a file is missing.

### Step 3 — Edit config.py

Open `config.py` and update the `PROPERTY` dict:

```python
PROPERTY = {
    "name": "Villa Maravilha",
    "primary_color": "#2E7D4F",   # hex — full colour palette auto-generated
    "logo": None,                  # or "photos/logo.png"

    "photos": {
        "cover":   "photos/cover.jpg",
        # ...
    },

    "features": {
        "pool":            True,   # adds pool care section to Appliances
        "ac":              True,
        "dishwasher":      True,
        "washing_machine": True,
        "parking":         True,
    },

    "wifi": {
        "network":  "VillaMaravilha_WiFi",
        "password": "MySecurePass2024",
    },

    "last_updated": "2026-03-01",

    "contact": {
        "name":  "Ana Rodrigues",
        "phone": "+351 912 000 000",
        "email": "stay@villamaravilha.pt",
    },

    "qr_url": "https://villamaravilha.pt/guidebook",

    "content": {
        "welcome": {
            "en_uk": "Your welcome text here...",
            "en_us": "...",
            "pt":    "...",
            "fr":    "...",
            "de":    "...",
        },
        # Repeat for all sections (see list below)
    },
}
```

#### Content section keys

| Key                | Section name            |
|--------------------|-------------------------|
| `welcome`          | Welcome message         |
| `checkin_checkout` | Check-in & Check-out    |
| `house_rules`      | House Rules             |
| `appliances`       | Appliances & Electricity|
| `local_area`       | Local Area Guide        |
| `getting_around`   | Getting Around          |
| `emergency`        | Emergency Contacts      |
| `checkout`         | Checkout Checklist      |

WiFi is handled automatically from the `wifi` key — no content entry needed.

### Step 4 — Generate

```bash
python generate.py properties/my_new_villa
```

Options:

```bash
python generate.py properties/my_new_villa --html-only   # skip PDF
python generate.py properties/my_new_villa --pdf-only    # skip HTML
```

---

## US/CA language differences

The `en_us` content variant should differ from `en_uk` as follows:

| Topic             | UK/EU                        | US/CA                                  |
|-------------------|------------------------------|----------------------------------------|
| Temperature       | °C                           | °F with °C in brackets                 |
| Distances         | km / metres                  | miles / feet with metric in brackets   |
| Voltage warning   | Standard adapter note        | Voltage converter required note        |
| Driving side      | Mention right-hand traffic   | "Same as US/CA" reassurance            |
| Emergency number  | 112                          | 112 = European equivalent of 911       |
| Times             | 24-hour (16:00)              | 12-hour (4:00 PM)                      |
| Dates             | DD/MM/YYYY                   | MM/DD/YYYY                             |

---

## Folder structure

```
guidebook-generator/
  generate.py          ← main script
  README.md            ← this file
  template/            ← reserved for future shared assets
  properties/
    example_property/
      config.py        ← property configuration
      photos/          ← property photos
  output/              ← generated files land here (git-ignored)
```

---

## Colour system

Set `primary_color` to any hex value. The generator automatically derives:

- `dark` — deeper tone for headers and footer backgrounds
- `light` — softer tone for borders and dividers
- `very_light` — near-white tint for backgrounds and cards
- `accent_text` — white or dark depending on primary brightness

---

## Tips

- Plain text in `config.py` content fields supports simple formatting:
  - Lines in **ALL CAPS** become sub-headings
  - Lines starting with `•` become bullet points
  - Lines starting with `□` become checklist items
  - Lines starting with `⚠` get a yellow warning box treatment
- The HTML guidebook is entirely self-contained (no external fonts, CSS, or JS) — safe to email or host as a single file.
- The PDF targets A4 (210 × 297 mm) print-ready output with 18 mm margins.
