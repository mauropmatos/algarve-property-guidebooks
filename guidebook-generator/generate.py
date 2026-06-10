#!/usr/bin/env python3
"""
Algarve Property Guidebook Generator
Produces A4-print-ready PDF and single-file HTML guidebooks from a property config.

Usage:
    python generate.py properties/example_property
    python generate.py properties/example_property --html-only
    python generate.py properties/example_property --pdf-only
"""

import argparse
import importlib.util
import sys
import colorsys
import base64
from pathlib import Path

# ── colour helpers ─────────────────────────────────────────────────────────────

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4))

def rgb_to_hex(r, g, b):
    return "#{:02X}{:02X}{:02X}".format(int(r*255), int(g*255), int(b*255))

def build_palette(primary_hex):
    """Return a dict of colour roles derived from a single primary hex."""
    r, g, b = hex_to_rgb(primary_hex)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)

    def variant(sv_factor_s, sv_factor_v):
        nr, ng, nb = colorsys.hsv_to_rgb(h,
                                          min(1.0, s * sv_factor_s),
                                          min(1.0, v * sv_factor_v))
        return rgb_to_hex(nr, ng, nb)

    return {
        "primary":     primary_hex,
        "dark":        variant(1.1, 0.65),
        "light":       variant(0.4, 1.4) if v < 0.8 else variant(0.25, 1.5),
        "very_light":  variant(0.2, 1.7) if v < 0.7 else variant(0.12, 1.6),
        "accent_text": "#FFFFFF" if v < 0.65 else "#1A1A1A",
    }

# ── image helpers ──────────────────────────────────────────────────────────────

def img_b64(path):
    """Return base64-encoded image string, or None if file absent."""
    if path and Path(path).exists():
        mime = "image/jpeg" if str(path).lower().endswith((".jpg", ".jpeg")) else "image/png"
        with open(path, "rb") as f:
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode()}"
    return None

def placeholder_svg(label, w=800, h=500, bg="#D0D8E0"):
    """Return inline SVG as a data URI — used when a photo is missing."""
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">'
        f'<rect width="100%" height="100%" fill="{bg}"/>'
        f'<text x="50%" y="50%" font-family="sans-serif" font-size="22" '
        f'fill="#6B7280" text-anchor="middle" dy=".35em">{label}</text>'
        f'</svg>'
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()

# ── language meta ──────────────────────────────────────────────────────────────

LANGS = [
    ("en_uk", "English (UK)"),
    ("en_us", "English (US/CA)"),
    ("pt",    "Português"),
    ("fr",    "Français"),
    ("de",    "Deutsch"),
]

SECTION_TITLES = {
    "wifi":              {"en_uk": "WiFi", "en_us": "WiFi", "pt": "WiFi", "fr": "WiFi", "de": "WLAN"},
    "welcome":           {"en_uk": "Welcome", "en_us": "Welcome", "pt": "Bem-vindo", "fr": "Bienvenue", "de": "Willkommen"},
    "checkin_checkout":  {"en_uk": "Check-in & Check-out", "en_us": "Check-in & Check-out",
                          "pt": "Check-in & Check-out", "fr": "Arrivée & Départ", "de": "Check-in & Check-out"},
    "house_rules":       {"en_uk": "House Rules", "en_us": "House Rules", "pt": "Regras da Casa",
                          "fr": "Règlement Intérieur", "de": "Hausregeln"},
    "appliances":        {"en_uk": "Appliances & Electricity", "en_us": "Appliances & Electricity",
                          "pt": "Electrodomésticos e Eletricidade", "fr": "Appareils & Électricité",
                          "de": "Geräte & Strom"},
    "local_area":        {"en_uk": "Local Area Guide", "en_us": "Local Area Guide",
                          "pt": "Guia da Região", "fr": "Guide de la Région", "de": "Ortsführer"},
    "getting_around":    {"en_uk": "Getting Around", "en_us": "Getting Around",
                          "pt": "Como Deslocar-se", "fr": "Se Déplacer", "de": "Fortbewegung"},
    "emergency":         {"en_uk": "Emergency Contacts", "en_us": "Emergency Contacts",
                          "pt": "Contactos de Emergência", "fr": "Contacts d'Urgence", "de": "Notfallkontakte"},
    "checkout":          {"en_uk": "Checkout Checklist", "en_us": "Checkout Checklist",
                          "pt": "Lista de Saída", "fr": "Liste de Départ", "de": "Abreise-Checkliste"},
}

SECTION_ICONS = {
    "wifi":             "📶",
    "welcome":          "🏡",
    "checkin_checkout": "🔑",
    "house_rules":      "📋",
    "appliances":       "⚡",
    "local_area":       "🗺️",
    "getting_around":   "🚗",
    "emergency":        "🚨",
    "checkout":         "✅",
}

SECTION_ORDER = [
    "wifi", "welcome", "checkin_checkout", "house_rules",
    "appliances", "local_area", "getting_around", "emergency", "checkout",
]

# ═══════════════════════════════════════════════════════════════════════════════
#  HTML GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

def generate_html(prop, prop_dir, output_path):
    p = prop
    pal = build_palette(p["primary_color"])
    name = p["name"]

    # ── load template ──────────────────────────────────────────────────────────
    template_path = Path(__file__).parent / "template" / "guidebook.html"
    with open(template_path, encoding="utf-8") as f:
        template = f.read()

    def photo_src(key, label):
        rel = p["photos"].get(key)
        if rel:
            abs_p = prop_dir / rel
            b64 = img_b64(abs_p)
            if b64:
                return b64
        return placeholder_svg(label)

    cover_src = photo_src("cover", "Cover Photo")

    # ── QR code ────────────────────────────────────────────────────────────────
    qr_src = _make_qr_src(p.get("qr_url", ""))

    # ── logo ──────────────────────────────────────────────────────────────────
    logo_html = ""
    if p.get("logo"):
        lb = img_b64(prop_dir / p["logo"])
        if lb:
            logo_html = f'<img src="{lb}" alt="Logo" style="max-height:60px;max-width:160px;">'
    if not logo_html:
        logo_html = f'<span style="font-size:1.5rem;font-weight:700;color:{pal["primary"]}">{name}</span>'

    # ── language buttons ───────────────────────────────────────────────────────
    lang_buttons = ""
    for code, label in LANGS:
        lang_buttons += (
            f'<button class="lang-btn" onclick="showLang(\'{code}\')" id="btn_{code}">'
            f'{label}</button>\n'
        )

    # ── sections ───────────────────────────────────────────────────────────────
    sections_html = _html_wifi(p, pal)
    for section_key in [s for s in SECTION_ORDER if s != "wifi"]:
        section_data = p.get("content", {}).get(section_key)
        if section_data:
            sections_html += _html_section(section_key, section_data, pal)
    sections_html += _html_back(p, pal, qr_src)

    contact = p.get("contact", {})

    # ── fill placeholders ──────────────────────────────────────────────────────
    html = (template
        .replace("{{PROPERTY_NAME}}",  name)
        .replace("{{COLOR_PRIMARY}}",  pal["primary"])
        .replace("{{COLOR_DARK}}",     pal["dark"])
        .replace("{{COLOR_LIGHT}}",    pal["light"])
        .replace("{{COLOR_VERY_LIGHT}}",pal["very_light"])
        .replace("{{LOGO_HTML}}",      logo_html)
        .replace("{{COVER_SRC}}",      cover_src)
        .replace("{{LANG_BUTTONS}}",   lang_buttons)
        .replace("{{SECTIONS}}",       sections_html)
        .replace("{{LAST_UPDATED}}",   p.get("last_updated", "—"))
        .replace("{{CONTACT_EMAIL}}",  contact.get("email", ""))
        .replace("{{JS}}",             _html_js())
    )

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✓ HTML → {output_path}")


def _html_wifi(p, pal):
    wifi = p.get("wifi", {})
    network  = wifi.get("network", "—")
    password = wifi.get("password", "—")

    lang_blocks = ""
    wifi_labels = {
        "en_uk": ("WiFi", "Network", "Password"),
        "en_us": ("WiFi", "Network", "Password"),
        "pt":    ("WiFi", "Rede", "Palavra-passe"),
        "fr":    ("WiFi", "Réseau", "Mot de passe"),
        "de":    ("WLAN", "Netzwerk", "Passwort"),
    }
    for code, label in LANGS:
        t = wifi_labels.get(code, ("WiFi", "Network", "Password"))
        lang_blocks += f"""
<div class="lang-block" data-lang="{code}">
  <div class="lang-label">{label[1]}</div>
  <div class="wifi-row">
    <div class="wifi-box">
      <div class="wifi-box__label">{t[1]}</div>
      <div class="wifi-box__value">{network}</div>
    </div>
    <div class="wifi-box">
      <div class="wifi-box__label">{t[2]}</div>
      <div class="wifi-box__value">{password}</div>
    </div>
  </div>
</div>"""

    icon = SECTION_ICONS["wifi"]
    return f"""
<section class="section" id="section-wifi">
  <div class="section__header">
    <span class="section__icon">{icon}</span>
    <h2>WiFi / WLAN</h2>
  </div>
  <div class="section__body">
    {lang_blocks}
  </div>
</section>"""


def _html_section(key, data, pal):
    icon = SECTION_ICONS.get(key, "•")
    lang_blocks = ""
    for code, label in LANGS:
        text = data.get(code, "")
        if not text:
            continue
        title = SECTION_TITLES.get(key, {}).get(code, key.replace("_", " ").title())
        # Convert plain-text formatting to HTML
        body_html = _text_to_html(text)
        lang_blocks += f"""
<div class="lang-block" data-lang="{code}">
  <div class="lang-label">{label}</div>
  <div class="section-text">{body_html}</div>
</div>"""

    # section heading — use en_uk title for the page anchor
    heading = SECTION_TITLES.get(key, {}).get("en_uk", key.replace("_", " ").title())
    return f"""
<section class="section" id="section-{key}">
  <div class="section__header">
    <span class="section__icon">{icon}</span>
    <h2>{heading}</h2>
  </div>
  <div class="section__body">
    {lang_blocks}
  </div>
</section>"""


def _html_back(p, pal, qr_src):
    contact = p.get("contact", {})
    return f"""
<section class="back-page" id="section-back">
  <p class="back-page__updated">Last updated: {p.get('last_updated','—')}</p>
  <h2 class="back-page__name">{p['name']}</h2>
  <p class="back-page__contact">
    {contact.get('name','')} &nbsp;|&nbsp;
    {contact.get('phone','')} &nbsp;|&nbsp;
    <a href="mailto:{contact.get('email','')}">{contact.get('email','')}</a>
  </p>
  <img class="back-page__qr" src="{qr_src}" alt="QR Code">
  <p class="back-page__qr-note">Scan for the digital guidebook</p>
</section>"""


def _text_to_html(text):
    """Convert plain text with • bullets and ALL-CAPS headings to HTML."""
    lines = text.splitlines()
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            out.append("<br>")
        elif stripped.isupper() and len(stripped) > 3 and not stripped.startswith("•"):
            out.append(f'<h4>{stripped}</h4>')
        elif stripped.startswith("•") or stripped.startswith("□") or stripped.startswith("✓"):
            out.append(f'<div class="bullet">'
                       f'<span>{stripped[0]}</span>'
                       f'<span>{stripped[1:].strip()}</span></div>')
        elif stripped.startswith("⚠"):
            out.append(f'<div class="warning">{stripped}</div>')
        else:
            out.append(f'<p>{stripped}</p>')
        i += 1
    return "\n".join(out)



def _html_js():
    codes = [c for c, _ in LANGS]
    return f"""
var LANGS = {codes};
function showLang(code) {{
  LANGS.forEach(function(c) {{
    document.querySelectorAll('.lang-block[data-lang="' + c + '"]')
      .forEach(function(el) {{ el.classList.remove('active'); }});
    var btn = document.getElementById('btn_' + c);
    if (btn) {{ btn.classList.remove('active-lang'); }}
  }});
  document.querySelectorAll('.lang-block[data-lang="' + code + '"]')
    .forEach(function(el) {{ el.classList.add('active'); }});
  var activeBtn = document.getElementById('btn_' + code);
  if (activeBtn) {{ activeBtn.classList.add('active-lang'); }}
}}
// Default to en_uk on load
showLang('en_uk');
"""


def _make_qr_src(url):
    try:
        import qrcode
        import io
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(url or "https://example.com")
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        # Fallback: simple SVG QR placeholder
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">'
            '<rect width="140" height="140" fill="#fff"/>'
            '<rect x="10" y="10" width="40" height="40" fill="#000"/>'
            '<rect x="15" y="15" width="30" height="30" fill="#fff"/>'
            '<rect x="20" y="20" width="20" height="20" fill="#000"/>'
            '<rect x="90" y="10" width="40" height="40" fill="#000"/>'
            '<rect x="95" y="15" width="30" height="30" fill="#fff"/>'
            '<rect x="100" y="20" width="20" height="20" fill="#000"/>'
            '<rect x="10" y="90" width="40" height="40" fill="#000"/>'
            '<rect x="15" y="95" width="30" height="30" fill="#fff"/>'
            '<rect x="20" y="100" width="20" height="20" fill="#000"/>'
            '<rect x="55" y="55" width="8" height="8" fill="#000"/>'
            '<rect x="70" y="55" width="8" height="8" fill="#000"/>'
            '<rect x="55" y="70" width="8" height="8" fill="#000"/>'
            '<rect x="70" y="70" width="8" height="8" fill="#000"/>'
            '<text x="70" y="132" font-family="sans-serif" font-size="9" '
            'fill="#666" text-anchor="middle">QR Code</text>'
            '</svg>'
        )
        return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


# ═══════════════════════════════════════════════════════════════════════════════
#  PDF GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

def generate_pdf(prop, prop_dir, output_path):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, PageBreak,
            Table, TableStyle, Image as RLImage, HRFlowable,
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from reportlab.platypus.flowables import KeepTogether
        import io
    except ImportError:
        print("  ✗ ReportLab not installed. Run: pip install reportlab")
        print("    Skipping PDF generation.")
        return

    p   = prop
    pal = build_palette(p["primary_color"])
    name = p["name"]

    primary_c = colors.HexColor(pal["primary"])
    dark_c    = colors.HexColor(pal["dark"])
    light_c   = colors.HexColor(pal["light"])
    vlight_c  = colors.HexColor(pal["very_light"])

    W, H = A4
    margin = 18 * mm

    styles = getSampleStyleSheet()

    def style(name_, **kw):
        return ParagraphStyle(name_, parent=styles["Normal"], **kw)

    cover_title  = style("CoverTitle",  fontSize=36, leading=44, textColor=colors.white,
                          alignment=TA_CENTER, fontName="Helvetica-Bold")
    cover_sub    = style("CoverSub",    fontSize=16, leading=22, textColor=colors.white,
                          alignment=TA_CENTER, fontName="Helvetica")
    sec_heading  = style("SecHeading",  fontSize=18, leading=24, textColor=colors.white,
                          fontName="Helvetica-Bold", spaceAfter=4)
    lang_lbl     = style("LangLbl",     fontSize=7.5, leading=10, textColor=colors.white,
                          fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=2,
                          backColor=primary_c, borderPadding=(2,6,2,6))
    body_style   = style("Body",        fontSize=9.5, leading=15, fontName="Helvetica",
                          spaceAfter=6)
    body_bold    = style("BodyBold",    fontSize=9.5, leading=15, fontName="Helvetica-Bold",
                          spaceAfter=4)
    wifi_net     = style("WifiNet",     fontSize=22, leading=28, fontName="Helvetica-Bold",
                          textColor=primary_c, alignment=TA_CENTER)
    wifi_lbl     = style("WifiLbl",     fontSize=8, leading=11, fontName="Helvetica-Bold",
                          textColor=colors.HexColor("#666666"), alignment=TA_CENTER,
                          spaceAfter=2, spaceBefore=8)
    footer_style = style("Footer",      fontSize=8, leading=10,
                          textColor=colors.HexColor("#888888"), alignment=TA_CENTER)
    checklist_st = style("Checklist",   fontSize=9.5, leading=16, fontName="Helvetica",
                          leftIndent=14, firstLineIndent=-14)

    # ── page template with footer ──────────────────────────────────────────────
    page_num_holder = [0]

    def on_page(canvas, doc):
        canvas.saveState()
        page_num_holder[0] = doc.page
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#999999"))
        footer_text = f"{name}  ·  Page {doc.page}"
        canvas.drawCentredString(W / 2, 10 * mm, footer_text)
        # accent line
        canvas.setStrokeColor(primary_c)
        canvas.setLineWidth(1.5)
        canvas.line(margin, 14 * mm, W - margin, 14 * mm)
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=margin, rightMargin=margin,
        topMargin=margin,  bottomMargin=22 * mm,
        onPage=on_page,
    )

    story = []

    # helper: load an image or return a spacer
    def get_image(key, label, width=W - 2*margin, height=80*mm):
        rel = p["photos"].get(key)
        if rel:
            abs_p = prop_dir / rel
            if abs_p.exists():
                try:
                    img = RLImage(str(abs_p), width=width, height=height)
                    img.hAlign = "CENTER"
                    return img
                except Exception:
                    pass
        # grey placeholder
        from reportlab.platypus import Flowable
        class GrayRect(Flowable):
            def __init__(self, w, h, lbl):
                self.w, self.h, self.lbl = w, h, lbl
            def draw(self):
                self.canv.setFillColor(colors.HexColor("#D0D8E0"))
                self.canv.rect(0, 0, self.w, self.h, fill=1, stroke=0)
                self.canv.setFillColor(colors.HexColor("#6B7280"))
                self.canv.setFont("Helvetica", 12)
                self.canv.drawCentredString(self.w/2, self.h/2 - 6, self.lbl)
            def wrap(self, *args):
                return self.w, self.h
        return GrayRect(width, height, label)

    # ── section header band ────────────────────────────────────────────────────
    def section_band(icon, title_en):
        from reportlab.platypus import Flowable
        class Band(Flowable):
            def __init__(self, color, icon_, title_, w):
                self.color = color
                self.icon  = icon_
                self.title = title_
                self.bw    = w
            def draw(self):
                self.canv.setFillColor(self.color)
                self.canv.roundRect(0, 0, self.bw, 36, 6, fill=1, stroke=0)
                self.canv.setFillColor(colors.white)
                self.canv.setFont("Helvetica-Bold", 15)
                self.canv.drawString(14, 11, f"{self.icon}  {self.title}")
            def wrap(self, *args):
                return self.bw, 38
        return Band(primary_c, icon, title_en, W - 2*margin)

    def lang_pill(label):
        from reportlab.platypus import Flowable
        class Pill(Flowable):
            def __init__(self, lbl, color_):
                self.lbl = lbl
                self.color_ = color_
            def draw(self):
                self.canv.setFillColor(self.color_)
                self.canv.roundRect(0, 1, 90, 14, 4, fill=1, stroke=0)
                self.canv.setFillColor(colors.white)
                self.canv.setFont("Helvetica-Bold", 7.5)
                self.canv.drawString(6, 4, self.lbl.upper())
            def wrap(self, *args):
                return 94, 18
        return Pill(label, primary_c)

    def render_text_block(text, indent=False):
        """Convert plain text to ReportLab Paragraphs."""
        items = []
        for line in text.splitlines():
            s = line.strip()
            if not s:
                items.append(Spacer(1, 4))
                continue
            if s.isupper() and len(s) > 3 and not s.startswith("•") and not s.startswith("□"):
                items.append(Paragraph(s, body_bold))
            elif s.startswith("□") or s.startswith("✓"):
                items.append(Paragraph(f'<font name="Helvetica">{s}</font>', checklist_st))
            elif s.startswith("•"):
                items.append(Paragraph(f'• {s[1:].strip()}', style("Bullet",
                    parent=body_style, leftIndent=14, firstLineIndent=-10, spaceAfter=3)))
            elif s.startswith("⚠"):
                items.append(Paragraph(s, style("Warn",
                    parent=body_style, backColor=colors.HexColor("#FEF3C7"),
                    borderColor=colors.HexColor("#D97706"), borderWidth=1,
                    borderPadding=(4,8,4,8), textColor=colors.HexColor("#92400E"))))
            else:
                items.append(Paragraph(s, body_style))
        return items

    # ══════════════════════════════════════════════════════════════════════
    # 1. COVER PAGE
    # ══════════════════════════════════════════════════════════════════════
    from reportlab.platypus import Flowable

    class CoverPage(Flowable):
        def __init__(self, img_path, title, subtitle, logo_path, qr_url, w, h,
                     primary_c_, dark_c_):
            self.img_path  = img_path
            self.title     = title
            self.subtitle  = subtitle
            self.logo_path = logo_path
            self.qr_url    = qr_url
            self.cw        = w
            self.ch        = h
            self.pc        = primary_c_
            self.dc        = dark_c_

        def draw(self):
            c = self.canv
            # background photo or colour
            drawn = False
            if self.img_path and Path(self.img_path).exists():
                try:
                    c.drawImage(str(self.img_path), 0, 0,
                                width=self.cw, height=self.ch,
                                preserveAspectRatio=True, anchor='c', mask='auto')
                    drawn = True
                except Exception:
                    pass
            if not drawn:
                c.setFillColor(self.dc)
                c.rect(0, 0, self.cw, self.ch, fill=1, stroke=0)

            # dark gradient overlay
            from reportlab.lib.colors import Color
            steps = 30
            for i in range(steps):
                alpha = (i / steps) ** 1.5 * 0.72
                c.setFillColor(Color(0, 0, 0, alpha=alpha))
                c.rect(0, i * (self.ch / steps), self.cw, self.ch / steps + 1,
                       fill=1, stroke=0)

            # title
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 42)
            c.drawCentredString(self.cw / 2, self.ch * 0.32, self.title)
            c.setFont("Helvetica", 18)
            c.setFillColor(colors.Color(1, 1, 1, alpha=0.82))
            c.drawCentredString(self.cw / 2, self.ch * 0.32 - 52, self.subtitle)

            # accent bar
            c.setFillColor(self.pc)
            c.rect(0, 0, self.cw, 8, fill=1, stroke=0)

        def wrap(self, *args):
            return self.cw, self.ch

    cover_img = None
    rel = p["photos"].get("cover")
    if rel:
        cp = prop_dir / rel
        if cp.exists():
            cover_img = str(cp)

    story.append(CoverPage(
        img_path=cover_img,
        title=name,
        subtitle="Your Algarve Guidebook",
        logo_path=p.get("logo"),
        qr_url=p.get("qr_url", ""),
        w=W, h=H,
        primary_c_=primary_c,
        dark_c_=dark_c,
    ))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 2. WiFi PAGE
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_band(SECTION_ICONS["wifi"], "WiFi / WLAN"))
    story.append(Spacer(1, 10*mm))

    wifi = p.get("wifi", {})
    network  = wifi.get("network",  "—")
    password = wifi.get("password", "—")

    wifi_labels = {
        "en_uk": ("Network", "Password"),
        "en_us": ("Network", "Password"),
        "pt":    ("Rede", "Palavra-passe"),
        "fr":    ("Réseau", "Mot de passe"),
        "de":    ("Netzwerk", "Passwort"),
    }

    for code, label in LANGS:
        lbl = wifi_labels.get(code, ("Network", "Password"))
        story.append(lang_pill(label))
        story.append(Spacer(1, 3))
        data = [
            [Paragraph(lbl[0].upper(), wifi_lbl), Paragraph(lbl[1].upper(), wifi_lbl)],
            [Paragraph(network,  wifi_net),        Paragraph(password, wifi_net)],
        ]
        tbl = Table(data, colWidths=[(W - 2*margin)/2 - 4]*2)
        tbl.setStyle(TableStyle([
            ('BOX',       (0,0), (-1,-1), 2, primary_c),
            ('INNERGRID', (0,0), (-1,-1), 0.5, light_c),
            ('BACKGROUND',(0,0), (-1,-1), vlight_c),
            ('ROUNDEDCORNERS', [8]),
            ('TOPPADDING',  (0,0), (-1,-1), 8),
            ('BOTTOMPADDING',(0,0),(-1,-1), 10),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 6))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 3–9. CONTENT SECTIONS
    # ══════════════════════════════════════════════════════════════════════
    content = p.get("content", {})
    section_order_without_wifi = [s for s in SECTION_ORDER if s != "wifi"]

    for section_key in section_order_without_wifi:
        section_data = content.get(section_key)
        if not section_data:
            continue

        icon      = SECTION_ICONS.get(section_key, "•")
        title_en  = SECTION_TITLES.get(section_key, {}).get("en_uk",
                      section_key.replace("_"," ").title())

        story.append(section_band(icon, title_en))
        story.append(Spacer(1, 6))

        for code, label in LANGS:
            text = section_data.get(code, "")
            if not text:
                continue
            story.append(lang_pill(label))
            story.append(Spacer(1, 2))
            story.extend(render_text_block(text))
            story.append(HRFlowable(width="100%", thickness=0.5,
                                     color=colors.HexColor("#E5E7EB"), spaceAfter=8))

        story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 10. BACK PAGE
    # ══════════════════════════════════════════════════════════════════════
    contact = p.get("contact", {})

    class BackPage(Flowable):
        def __init__(self, prop_, pal_, w_, h_):
            self.prop = prop_
            self.pal  = pal_
            self.bw   = w_
            self.bh   = h_

        def draw(self):
            c = self.canv
            pc = colors.HexColor(self.pal["primary"])
            dc = colors.HexColor(self.pal["dark"])

            c.setFillColor(dc)
            c.rect(0, 0, self.bw, self.bh, fill=1, stroke=0)

            c.setFillColor(pc)
            c.rect(0, self.bh - 8, self.bw, 8, fill=1, stroke=0)

            # property name
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 34)
            c.drawCentredString(self.bw/2, self.bh * 0.60, self.prop["name"])

            # contact
            c.setFont("Helvetica", 13)
            c.setFillColor(colors.Color(1, 1, 1, alpha=0.8))
            contact_ = self.prop.get("contact", {})
            line1 = contact_.get("name", "")
            line2 = f'{contact_.get("phone","")}  ·  {contact_.get("email","")}'
            c.drawCentredString(self.bw/2, self.bh * 0.60 - 46, line1)
            c.drawCentredString(self.bw/2, self.bh * 0.60 - 66, line2)

            # last updated
            c.setFont("Helvetica", 10)
            c.setFillColor(colors.Color(1, 1, 1, alpha=0.5))
            c.drawCentredString(self.bw/2, 30,
                                f'Last updated: {self.prop.get("last_updated","—")}')

        def wrap(self, *args):
            return self.bw, self.bh

    story.append(BackPage(p, pal, W, H))

    doc.build(story)
    print(f"  ✓ PDF  → {output_path}")


# ═══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def load_config(prop_dir):
    spec = importlib.util.spec_from_file_location(
        "config", prop_dir / "config.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.PROPERTY


def main():
    parser = argparse.ArgumentParser(description="Generate property guidebooks.")
    parser.add_argument("property_dir", help="Path to property folder (contains config.py)")
    parser.add_argument("--pdf-only",  action="store_true")
    parser.add_argument("--html-only", action="store_true")
    args = parser.parse_args()

    prop_dir = Path(args.property_dir).resolve()
    if not (prop_dir / "config.py").exists():
        print(f"Error: config.py not found in {prop_dir}")
        sys.exit(1)

    prop = load_config(prop_dir)
    name_slug = prop["name"].lower().replace(" ", "_").replace("/", "-")

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    html_out = output_dir / f"{name_slug}_guidebook.html"
    pdf_out  = output_dir / f"{name_slug}_guidebook.pdf"

    print(f"\nGenerating guidebook for: {prop['name']}")
    print(f"Output directory: {output_dir}\n")

    if not args.pdf_only:
        generate_html(prop, prop_dir, html_out)

    if not args.html_only:
        generate_pdf(prop, prop_dir, pdf_out)

    print("\nDone.")


if __name__ == "__main__":
    main()
