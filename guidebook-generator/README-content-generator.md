# Guidebook Content Generator

Produces a single Word document (`.docx`) containing all guidebook content in five
languages — English UK, English US/CA, Portuguese, French, and German — ready to
copy-paste into a Canva template.

---

## Quick start

### 1. Install the dependency

```bash
pip install python-docx
```

### 2. Run the example

```bash
cd guidebook-generator
python generate_content.py properties/casa_azul
```

Output: `output/casa-azul-content.docx`

Or run without arguments and type the path when prompted:

```bash
python generate_content.py
Property folder path: properties/casa_azul
```

---

## Creating a new property

### Step 1 — Duplicate the casa_azul folder

```
properties/
  casa_azul/        ← copy this entire folder
  my_new_villa/     ← paste and rename
    config.py
```

### Step 2 — Edit config.py

Open `config.py` and fill in the `PROPERTY` dict:

```python
PROPERTY = {

    "name": "Villa Maravilha",

    "tagline": {
        "en_uk": "Your sea-view retreat above Albufeira.",
        "en_us": "Your sea-view retreat above Albufeira.",
        "pt":    "O seu retiro com vista mar acima de Albufeira.",
        "fr":    "Votre retraite avec vue mer au-dessus d'Albufeira.",
        "de":    "Ihr Meerblick-Rückzugsort oberhalb von Albufeira.",
    },

    "features": {
        "pool":            True,
        "ac":              True,
        "dishwasher":      True,
        "washing_machine": True,
        "parking":         True,
    },

    "wifi": {
        "network":  "VillaMaravilha_WiFi",
        "password": "Albufeira2024!",
    },

    "content": {
        "welcome": {
            "en_uk": "Your welcome text here...",
            "en_us": "...",
            "pt":    "...",
            "fr":    "...",
            "de":    "...",
        },
        # repeat for all sections (see list below)
    },
}
```

### Step 3 — Generate

```bash
python generate_content.py properties/my_new_villa
```

---

## Content sections

Fill all eight sections in `content`. Each section needs five language keys.

| Key                | Section in document         |
|--------------------|-----------------------------|
| `welcome`          | 3. Welcome Message          |
| `checkin_checkout` | 4. Check-in & Check-out     |
| `house_rules`      | 5. House Rules              |
| `appliances`       | 6. Appliances & Electricity |
| `local_area`       | 7. Local Area Guide         |
| `getting_around`   | 8. Getting Around           |
| `emergency`        | 9. Emergency Contacts       |
| `checkout`         | 10. Checkout Checklist      |

WiFi (section 2) and the property name/tagline (section 1) are handled automatically
from the `wifi` and `tagline` keys — no content entry needed for those.

---

## Text formatting in content fields

Plain text in content fields supports lightweight formatting that translates to
proper Word styles:

| In config.py                        | In Word document          |
|-------------------------------------|---------------------------|
| `ALL CAPS LINE`                     | Bold sub-heading          |
| `• bullet item`                     | Bulleted list item        |
| `□ checklist item`                  | Bulleted checklist item   |
| `⚠ warning text`                    | Bold red warning line     |
| Blank line                          | Paragraph spacer          |
| Everything else                     | Normal paragraph          |

Example:
```python
"house_rules": {
    "en_uk": """\
QUIET HOURS
• 23:00 – 08:00. No music outdoors after 23:00.
• Maximum occupancy: 8 guests.

BIN COLLECTION
Put the black bin on the pavement by 07:00 on Tuesday and Friday.
"""
}
```

---

## US/CA language differences

The `en_us` version should differ from `en_uk` as follows:

| Topic              | UK/EU                     | US/CA                                         |
|--------------------|---------------------------|-----------------------------------------------|
| Temperature        | °C                        | °F with °C in brackets                        |
| Distances          | km / metres               | miles / feet with metric in brackets          |
| Voltage warning    | Standard adapter note     | Voltage converter required warning            |
| Driving side       | Mention right-hand traffic| "Same as US/CA" — reassuring note             |
| Emergency number   | 112                       | "112 = European equivalent of 911"            |
| Times              | 24-hour (16:00)           | 12-hour (4:00 PM)                             |
| Dates              | DD/MM/YYYY                | MM/DD/YYYY                                    |

---

## Word document structure

The generated document follows this order:

```
Property Name & Tagline      ← sections 1-2 auto-generated from top-level keys
WiFi

Welcome Message              ← sections 3-10 from content dict
Check-in & Check-out
House Rules
Appliances & Electricity
Local Area Guide
Getting Around
Emergency Contacts
Checkout Checklist
```

Each section contains five language blocks in this order:
1. English (UK)
2. English (US/CA)
3. Português
4. Français
5. Deutsch

Each section starts on a new page for clean copying into Canva.
