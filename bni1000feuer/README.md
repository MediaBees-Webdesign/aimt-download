# bni1000feuer.de – statische Website

Reines HTML/CSS/JS, kein WordPress, keine Abhängigkeiten, keine Cookies.
Einfach den Inhalt dieses Ordners per FTP ins Webroot laden.

## Aufbau
- `index.html` – Startseite
- `impressum.html`, `datenschutz.html` – Rechtstexte
- `assets/css/style.css`, `assets/js/main.js`
- `assets/fonts/` – Montserrat und Open Sans lokal (DSGVO)
- `assets/img/members/<slug>.webp` – Mitgliederfotos (320x320)
- `assets/img/logos/<slug>.webp` – Firmenlogos
- `data/members.json` – Mitgliederdaten

## Mitglieder ändern
1. `data/members.json` bearbeiten (Eintrag hinzufügen/entfernen, `"neu": true` zeigt das Neu-Badge).
2. Foto/Logo als WebP unter dem Slug ablegen (z. B. `jean-pascal-koehler.webp`). Ohne Foto erscheinen Initialen.
3. `python3 tools/build.py` ausführen. Das Skript schreibt Karten, Filter und Mitgliederzahl in `index.html`.

Abgleich mit der offiziellen Liste: bni-nordwest.com, Chapter TAUSEND FEUER (26009).
