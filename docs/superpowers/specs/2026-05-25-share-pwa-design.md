# Numerològic — Disseny: compartir + PWA (Pla 2c)

**Data:** 2026-05-25
**Estat:** Aprovat per l'usuari (pendent revisió final de la spec)
**Autor:** Pau + Claude
**Context:** Tercer i últim pla del client. Sobre el client jugable del Pla 2b. Converteix el joc en una PWA instal·lable i offline-first i afegeix el compartir resultat.

## 1. Abast

- **Compartir** el resultat (estil Wordle/Paraulògic), sense desvelar cap solució.
- **PWA**: `manifest.json` + service worker → instal·lable i **100% offline** després de la primera càrrega.
- **Robustesa**: protegir la lectura de `localStorage` corrupte (deute apuntat al Pla 2b).

## 2. `share.js` — text de compartir (pur, testable)

- `emojiBar(found, total, cells = 10) → string`: `blaves = floor(found/total*cells)`; una `🟨` si queda fracció (i `blaves < cells`); la resta `⬜`. Casos: `0/n → ⬜×10`; `n/n → 🟦×10`; `87/118 → 🟦×7 🟨 ⬜×2`.
- `buildShareText({number, rankName, found, total, tuttiFound}) → string`:
  ```
  Numerològic #12 · Expert
  87/118 · 🟦🟦🟦🟦🟦🟦🟦🟨⬜⬜
  ★ Tutti!
  ```
  La línia `★ Tutti!` només apareix si `tuttiFound`. **Sense URL** (encara no hi ha domini). **Mai inclou solucions.**

## 3. Mecanisme de compartir (a `ui.js` / `app.js`)

- Botó "Comparteix" al peu.
- En clicar: si `navigator.share` existeix → `navigator.share({ text })` (full de compartir natiu, mòbil); si no → `navigator.clipboard.writeText(text)` + flaix "Copiat!".
- Errors (p. ex. l'usuari cancel·la el share) s'ignoren silenciosament.

## 4. PWA — `manifest.json`

```json
{
  "name": "Numerològic",
  "short_name": "Numerològic",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#58b4c4",
  "icons": [{ "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }]
}
```

A `index.html` (al `<head>`): `<link rel="manifest" href="manifest.json">`, `<meta name="theme-color" content="#58b4c4">`, `<link rel="apple-touch-icon" href="icon.svg">`.

## 5. PWA — `sw.js` (service worker)

- **Cache-first** de l'app shell. Precarrega a `install`: `./`, `index.html`, `css/styles.css`, tots els `js/*.js` (app, game, ui, storage, modes, parser, evaluator, canonical, validate, score, share), `data/puzzles.json`, `manifest.json`, `icon.svg`.
- Nom de cau **versionat** (`numerologic-v1`); a `activate` esborra els caus amb un altre nom (mecanisme d'actualització: pujar la versió en cada desplegament).
- `fetch`: respon des del cau; si no hi és, va a xarxa. Per a navegacions, recau a `index.html` del cau.
- Registrat des de `app.js`: `if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js")`.

## 6. Icona — `icon.svg`

Un **mini-rusc** (flor de 7 hexàgons): 6 turquesa (`#58b4c4`) + central coral (`#ec5a52`), centrat sobre fons blanc arrodonit (zona segura per a icona *maskable*). SVG quadrat (viewBox 512×512). Es generarà i s'afinarà visualment en provar la PWA.

> Nota: la icona SVG cobreix Android/escriptori instal·lable. iOS Safari prefereix PNG per a la pantalla d'inici; si cal, s'afegirà un PNG més endavant (fora d'abast d'aquest pla).

## 7. Robustesa de `localStorage` (deute del 2b)

- `storage.loadProgress`: embolcallar `JSON.parse` en `try/catch` → retornar `null` si el contingut està corrupte (en lloc de llançar).
- `game.js` (restauració): embolcallar `parse(f.text)` per entrada en `try/catch` → ometre les entrades corruptes en lloc de bloquejar la creació de la partida.

## 8. Estratègia de proves

- `share.js` amb `node:test`: `emojiBar` (buit / ple / parcial) i `buildShareText` (amb i sense tutti, format exacte).
- `storage.js`: test nou de `loadProgress` amb un valor corrupte → `null`.
- PWA (instal·lació, offline, service worker) i el botó de compartir: verificació **manual** al navegador (DevTools → Application; mode avió).

## 9. Fora d'abast

- Domini/URL real al text de compartir.
- Icona PNG per a iOS.
- Notificacions push, sincronització en línia.
