# Rutalògic: quart i últim joc de la família Lògic

## Context
Quart joc del prompt `docs/familia-logic-prompt.md` (§4). És un rusc hexagonal de 19 cel·les en files de 3-4-5-4-3. Es surt del centre, que és roig i té un valor inicial del 2 al 9, i es fan rutes per cel·les veïnes sense repetir-ne cap. Cada cel·la aplica la seua operació: `+n`, `−n`, `×2`, `×3`, `÷2` o `÷3`. L'objectiu és arribar al nombre del dia per tantes rutes com puguem.

Va en la branca `rutalogic`, creada des de `main`. Reaprofita el patró dels altres tres jocs: `modes`, `streak` i `storage` amb prefix `rutalogic:`, SW `rutalogic-v1` que només esborra caches pròpies, `og_image` i l'estructura de `ui.js` i `app.js`. El rang va per % dels punts totals, com Numerològic: `math.ceil(pct/100·total)`, igual que `generator/puzzles.py::build_ranks`.

Amb aquest joc, la família queda completa. Per això aquesta PR també afegeix, com deia el prompt, l'enllaç «Més jocs» al peu de Numerològic. Obri un panell amb els 4 jocs i es fa amb el mateix `openPanel`. Afegeix, a més, `/rutalogic/` a `sitemap.xml`.

## Decisions per defecte
1. **Longitud d'una ruta:** el nombre de cel·les d'operació recorregudes, sense comptar el centre. «Brevi de 4 o més» vol dir almenys 4 salts.
2. **Generador** (`gen_rutalogic/`):
   - DFS exhaustiu de totes les rutes simples des del centre, que es talla quan una divisió no és exacta o quan |valor| ≥ 1000.
   - Per a cada valor final guarda el nombre de rutes, la longitud mínima i la màxima.
   - Accepta el tauler si hi ha un objectiu del 10 al 99 (diferent del valor inicial) amb 20–200 rutes i un Brevi de 4 o més. Entre els valors que compleixen, en tria un a l'atzar.
   - Barreja d'operacions ajustada per tindre més o menys un 40 % de taulers acceptats. La mesuraré.
   - Al JSON hi van:
     - `start`, `ops[19]` i `target`;
     - `byLength`, el recompte de rutes per longitud;
     - `brevi`, totes les rutes de longitud mínima;
     - `marato`, totes les de longitud màxima;
     - `total`, els punts totals, i `ranks`.
3. **Punts:**
   - Una ruta nova val tantes cel·les com té.
   - Les ✦ (longitud mínima) i les ★ (longitud màxima) valen 10.
   - Completar totes les ✦ suma +10 i fa créixer la ratxa.
   - `total` és la suma de tot.
4. **Interacció:**
   - Es toca una cel·la veïna de l'última i el valor s'actualitza en viu. Les cel·les que no es poden tocar (no veïnes, ja usades o amb divisió no exacta) es veuen apagades.
   - **Enrere** desfà l'últim salt. **Esborra** torna al centre.
   - **Envia** només s'activa quan el valor és l'objectiu.
   - Teclat físic: Retrocés per desfer, Enter per enviar i Esc per tornar al centre. Les cel·les també es poden triar amb Tab i Enter.
   - Les rutes repetides no compten.
5. **Peu:**
   - «Has trobat N rutes (P punts)» obri el panell de trobades per longitud.
   - El rang obri el panell de Rangs.
   - Estat: ✦ Brevi (x/y) · ★ Marató · 🔥.
6. **Pistes:**
   - rutes per longitud;
   - quantes ✦ hi ha i de quina longitud;
   - la longitud de la ★.
7. **Solució d'ahir:** les rutes ✦ i una ★, mostrades com a seqüència d'operacions (`5 → ×3 → −4 → ÷... = 23`).
8. **Compartir:**
   - `Rutalògic #8 · Expert`
   - `P punts · N rutes`
   - `✦ Brevi!` / `★ Marató!` si escau
   - `🔥 Ratxa N`
   - URL

## Fitxers nous (`rutalogic/`)
- **Generador:**
  - `gen_rutalogic/hive.py`: coordenades, veïns i aplicació d'operacions.
  - `gen_rutalogic/routes.py`: DFS amb estadístiques per valor.
  - `gen_rutalogic/pool.py`, `generate.py`, `og_image.py` i `data/puzzles.json`.
- **Tests Python** (`tests/test_rutalogic_*.py`):
  - 19 cel·les i veïns simètrics;
  - sense restriccions de valor, hi ha exactament **888.205** rutes simples;
  - la poda de divisions;
  - l'acceptació del tauler;
  - els punts totals;
  - 364 dies.
- **Client:**
  - `js/hive.js`: veïns i operacions, amb la mateixa geometria.
  - `js/game.js`: ruta en curs, `tap`, `back`, `submit`, punts, Brevi, Marató, rang i `progress()`.
  - `js/share.js`, `js/ui.js` i `js/app.js`, amb el rusc en files hexagonals amb la classe `.hex` de Numerològic.
  - `modes.js`, `streak.js` i `storage.js` copiats.
  - `index.html`, `css`, `sw.js`, `manifest.json`, `favicon.svg` i `og-image.png`.
- **Tests JS:**
  - `game.test.js`, `share.test.js`, `storage.test.js`;
  - `pool.test.js`: el JS refà les rutes ✦ i ★ i comprova que arriben a l'objectiu i que tenen la longitud mínima i la màxima.
  - `hive.test.js`: la geometria del JS és idèntica a la de Python, comprovant els veïns contra el JSON.
- **Numerològic:**
  - `index.html`: «· Més jocs» a la fila d'enllaços.
  - `js/app.js`: el panell de «Més jocs».
  - `sitemap.xml`.

## Verificació
1. `python -m pytest` i `node --test` des de l'arrel, tot verd.
2. Playwright a 400 px:
   - Jugar el repte d'avui: trobar totes les ✦ (+10 i ratxa), una ★ i alguna ruta més, i provar una repetida.
   - Comprovar els punts, el rang, la recàrrega, el text de compartir, que funciona sense connexió i que no hi ha errors a la consola.
   - Comprovar que el panell «Més jocs» de Numerològic s'obri.
   - Fer una captura.
3. Push, PR i ensenyar-te-la.
4. Copiar aquest pla a `documents/plans/2026-10-27-rutalogic.md`.
