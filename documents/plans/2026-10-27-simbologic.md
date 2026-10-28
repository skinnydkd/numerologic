# Simbològic: segon joc de la família Lògic

## Context
Segon joc del prompt `docs/familia-logic-prompt.md` (§2). Cada dia hi ha 3 graelles de símbols amb els totals de les files i de les columnes, i cal trobar el valor de cada símbol. Igualògic és a la PR #39, que encara no està fusionada. Simbològic va en una branca pròpia, `simbologic`, creada des de `main`. Copia l'estructura d'Igualògic, que ja està provada: `modes`, `streak` i `storage` amb prefix, el SW amb scope propi, l'`og_image` i el patró de `ui.js` i `app.js`. Les dues PR tocaran `sitemap.xml` i hi haurà un conflicte trivial; el resolc en fusionar la segona.

## Decisions per defecte
1. **Graelles:**
   - Fàcil: 3×3 amb 3 símbols, valors de l'1 al 20.
   - Mitjà: 4×4 amb 4 símbols, valors de l'1 al 20.
   - Difícil: 4×4 amb 4 símbols, valors del −9 al 20 amb almenys un negatiu i sense el 0. Té una o dues **files** de producte (les columnes sempre sumen) i el valor absolut del producte no passa de 2000.
   - Els símbols d'una graella tenen valors diferents, i tots surten almenys una vegada.
2. **Símbols:** hexàgon turquesa, cercle roig, rombe fosc i, a les 4×4, triangle or. Són SVG inline.
3. **Comprova:** revisa tots els símbols que tenen valor i no estan resolts. Cada valor erroni és 1 error (−2), es pinta de roig i es pot tornar a escriure. Els correctes es pinten de turquesa i queden fixos.
4. **Pista:** revela el símbol que el solucionador dedueix primer d'entre els que falten (−3).
5. **Punts:** per graella, `max(1, 10 − 2·errors − 3·pistes)`, només si la resols. Rangs per % de 30 amb els llindars de la família, arrodonint cap amunt.
6. **Solucionador humà** (`gen_simbologic/solver.py`). Cada línia és una equació sobre els recomptes de símbols. Les regles, per ordre:
   - (a) Línia de suma o de producte amb un sol símbol desconegut: és divisió o resta exacta. En una de producte, el desconegut ha d'aparéixer una sola vegada; així no hi ha ambigüitat de signe.
   - (b) Dues línies de suma la diferència de les quals només té un símbol desconegut.
   - (c) Una combinació d'una línia amb una altra multiplicada per k = ±1, ±2 que deixe un sol desconegut.

   Totes les regles són sòlides: si el solucionador ho resol tot, la solució és única. A més, per a les graelles només de sumes, `fractions` comprova que el rang és complet.
7. **Dificultat pels passos:**
   - Fàcil: es resol només amb la regla (a).
   - Mitjà: necessita almenys un pas (b) o (c).
   - Difícil: té producte i necessita almenys un pas (b) o (c).

   Es rebutja tota graella que el solucionador no resol del tot.
8. **Peu:** «Graelles N/3 (P punts)» obri el panell de punts per graella, i el rang obri el panell de Rangs. ✦ «Tres de tres» fa créixer la ratxa. ★ Net vol dir les tres graelles sense errors ni pistes.
9. **Compartir:** `Simbològic #5 · Mestre`, `🟦🟦🟥` (🟦 neta, 🟥 amb errors o pistes, ⬜ no resolta), `27/30 punts`, `★ Net!`, `🔥 Ratxa N` i l'URL.
10. **Navegació:** pestanyes Fàcil/Mitjà/Difícil per triar la graella. Es toca un símbol del costat per escriure'n el valor amb el teclat en pantalla (0–9, −, Esborra) o el físic: dígits, `-`, Backspace, Tab o fletxes per canviar de símbol, Enter per comprovar.

## Fitxers nous (`simbologic/`, la mateixa estructura que `igualogic/`)
- `gen_simbologic/grid.py`: totals de les línies, generació aleatòria per nivell i comprovació de rang amb `Fraction`.
- `gen_simbologic/solver.py`: solucionador humà que retorna l'ordre de deducció i els tipus de pas.
- `gen_simbologic/pool.py`: 364 dies × 3 graelles, `startDate` 2026-10-26 i llavor fixa.
- `gen_simbologic/generate.py`, `gen_simbologic/og_image.py` i `data/puzzles.json`.
- Format de cada graella: `{level, size, cells, rowOps, rowTotals, colTotals, values, order}`.
- `gen_simbologic/tests/test_simbologic_{solver,grid,pool}.py`:
  - el solucionador és sòlid i rebutja els casos dependents;
  - els totals quadren;
  - la dificultat correspon als passos;
  - el pool té 364 dies.
- `js/game.js`: estat de les 3 graelles, `enter`, `check`, `hint`, punts, rang, ✦ i ★, `progress()`.
- `js/share.js`, `js/ui.js` (renderitza la graella amb SVG) i `js/app.js`.
- `js/modes.js`, `js/streak.js` i `js/storage.js` copiats, amb els prefixos `simbologic:p:` i `simbologic:streak`.
- `index.html`, `css/styles.css`, `sw.js` (`simbologic-v1`, que només esborra caches `simbologic-`), `manifest.json`, `favicon.svg` i `og-image.png`.
- `js/tests/`:
  - `game.test.js`;
  - `share.test.js`;
  - `storage.test.js`;
  - `pool.test.js`: el JS recalcula els totals a partir de `values` i han de quadrar amb el pool.
- `sitemap.xml`: s'hi afegeix `/simbologic/`.

## Verificació
1. `python -m pytest` i `node --test` des de l'arrel, tot verd.
2. `python -m http.server 8000` i Playwright a 400 px. Resoldre les 3 graelles del dia: la fàcil sense errors, la mitjana amb un error i la difícil amb una pista. Comprovar els punts, el rang, la ratxa, la recàrrega, el text de compartir, que funciona sense connexió i que no hi ha errors a la consola. Fer una captura.
3. Push, PR i aturar-me per ensenyar-te-la abans de Quadrològic.
4. Copiar aquest pla a `documents/plans/2026-10-27-simbologic.md`.
