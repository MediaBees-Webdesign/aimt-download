#!/usr/bin/env python3
"""Erzeugt die Mitgliederkarten und Filter in index.html aus data/members.json.

Aufruf (im Ordner bni1000feuer):  python3 tools/build.py

Fotos:  assets/img/members/<slug>.webp  (320x320)
Logos:  assets/img/logos/<slug>.webp    (max. 360x140)
Fehlt ein Foto, werden Initialen angezeigt. Fehlt ein Logo, entfällt es.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
DATA = ROOT / "data" / "members.json"

ICON_PHONE = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>'
ICON_MAIL = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg>'
ICON_WEB = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h2.9c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zm1.7-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z"/></svg>'


def slug(name: str) -> str:
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("Ä", "Ae"), ("Ö", "Oe"), ("Ü", "Ue"), ("ß", "ss")):
        name = name.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def tel(phone: str) -> str:
    digits = re.sub(r"[^\d+]", "", phone)
    if digits.startswith("0"):
        digits = "+49" + digits[1:]
    return digits


def initials(name: str) -> str:
    parts = name.split()
    return (parts[0][0] + parts[-1][0]).upper()


def card(m: dict, cats: dict) -> str:
    e = html.escape
    s = slug(m["name"])
    photo = ROOT / "assets" / "img" / "members" / f"{s}.webp"
    logo = ROOT / "assets" / "img" / "logos" / f"{s}.webp"
    search = " ".join([m["name"], m["role"], m.get("company", ""), cats[m["cat"]]]).lower()

    if photo.exists():
        avatar = f'<img src="assets/img/members/{s}.webp" alt="" width="160" height="160" loading="lazy" decoding="async">'
    else:
        avatar = f'<span class="avatar-initials" aria-hidden="true">{initials(m["name"])}</span>'

    links = [f'<li><a href="tel:{tel(m["phone"])}">{ICON_PHONE}<span>{e(m["phone"])}</span></a></li>']
    if m.get("email"):
        links.append(f'<li><a href="mailto:{e(m["email"])}">{ICON_MAIL}<span>{e(m["email"])}</span></a></li>')
    if m.get("web"):
        links.append(f'<li><a href="https://{e(m["web"])}" target="_blank" rel="noopener">{ICON_WEB}<span>{e(m["web"])}</span></a></li>')

    company = f'<p class="member-company">{e(m["company"])}</p>' if m.get("company") else ""
    badge = '<span class="badge-new">Neu</span>' if m.get("neu") else ""
    logo_html = (
        f'<div class="member-logo"><img src="assets/img/logos/{s}.webp" alt="Logo {e(m.get("company") or m["name"])}" loading="lazy" decoding="async"></div>'
        if logo.exists() else ""
    )
    return f'''      <article class="member reveal" data-cat="{m["cat"]}" data-search="{e(search)}">
        {badge}<div class="member-avatar">{avatar}</div>
        <h3 class="member-name">{e(m["name"])}</h3>
        <p class="member-role">{e(m["role"])}</p>
        {company}
        <ul class="member-links">
          {"".join(links)}
        </ul>
        {logo_html}
      </article>'''


def replace_block(src: str, marker: str, content: str) -> str:
    pattern = re.compile(rf"(<!-- {marker}:START -->).*?(<!-- {marker}:END -->)", re.S)
    if not pattern.search(src):
        raise SystemExit(f"Marker {marker} fehlt in index.html")
    return pattern.sub(lambda mo: f"{mo.group(1)}\n{content}\n      {mo.group(2)}", src)


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    cats = data["categories"]
    members = sorted(data["members"], key=lambda m: m["name"])

    cards = "\n".join(card(m, cats) for m in members)
    counts = {k: sum(1 for m in members if m["cat"] == k) for k in cats}
    chips = [f'<button type="button" class="chip is-active" data-filter="all" aria-pressed="true">Alle <span>{len(members)}</span></button>']
    chips += [
        f'<button type="button" class="chip" data-filter="{k}" aria-pressed="false">{html.escape(v)} <span>{counts[k]}</span></button>'
        for k, v in cats.items() if counts[k]
    ]

    src = INDEX.read_text(encoding="utf-8")
    src = replace_block(src, "MEMBERS", cards)
    src = replace_block(src, "FILTERS", "        " + "\n        ".join(chips))
    src = re.sub(r'(data-count-members>)\d+(<)', rf"\g<1>{len(members)}\2", src)
    INDEX.write_text(src, encoding="utf-8")
    print(f"{len(members)} Mitglieder geschrieben.")


if __name__ == "__main__":
    main()
