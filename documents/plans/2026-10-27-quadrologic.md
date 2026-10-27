# Quadrològic: tercer joc de la família Lògic (calcudoku)

## Context
Tercer joc del prompt `docs/familia-logic-prompt.md` (§3). És una graella N×N en què cada fila i cada columna té les xifres 1..N sense repetir, i unes gàbies amb un resultat i una operació. Va en la branca `quadrologic`, creada des de `main`. Les PR #39 i #40 encara no estan fusionades. Reaprofita el patró dels altres dos jocs: `modes`, `streak` i `storage` amb prefix `quadrologic:`, SW `quadrologic-v1` que només esborra caches pròpies, `og_image`, i l'estructura de `ui.js` i `app.js`. `sitemap.xml` tindrà el mateix conflicte trivial que en les altres dues PR. No fem servir el nom «KenKen» enlloc.

## Decisions per defecte
1. **Mida segons el dia:** 4×4 de dilluns a dimecres, 5×5 dijous i divendres, 6×6 dissabte i diumenge. El xip de dificultat va per mida: 4 Fàcil, 5 Mitjà, 6 Difícil. `startDate` és 2026-10-26, un dilluns, i el pool té 364 dies.
2. **Generador** (`gen_quadrologic/`):
   - Quadrat llatí aleatori: el cíclic, amb files, columnes i xifres barrejades.
   - Gàbies:
     - creixement aleatori de 2–3 cel·les veïnes, amb com a molt N/2 gàbies d'una cel·la;
     - les de 2 cel·les tenen `+`, `×`, `−` o `÷` (`÷` només si és exacta);
     - les de 3 cel·les tenen `+` o `×`;
     - les d'una cel·la només porten el número.
   - Solucionador amb retrocés que compta solucions i s'atura a 2. Només s'accepten graelles amb solució única.
   - Solucionador lògic:
     - fa combinacions de gàbia sobre els candidats, singles nus i singles amagats en files i columnes;
     - si no arriba al final sense provar, es rebutja la graella, perquè tot repte siga resoluble sense endevinar;
     - el nombre de passades estima la dificultat;
     - guarda l'ordre en què omple les cel·les, que fa servir la pista.
3. **`refSeconds`:** `cel·les × segons_per_cel·la[N] × (0,85 + 0,05·passades)`, amb 6, 8 i 10 segons per cel·la per a 4, 5 i 6. Dona uns 1:40, 3:20 i 6:00.
   - `# ponytail:` és una calibratge a ull i és la perilla per ajustar quan tingues temps reals de jugadors.
4. **Temps:**
   - El rellotge s'activa amb la primera acció.
   - Es para quan la pestanya no es veu i en resoldre.
   - Es desa en `localStorage`.
5. **Comprova:**
   - Mira les cel·les plenes.
   - Si n'hi ha cap d'errònia, les pinta de roig i suma 30 s. Si són totes correctes, no penalitza.
   - Quan la graella és plena i correcta, es resol sola.
   - La pista revela la següent cel·la buida o errònia en l'ordre del solucionador lògic, i suma 60 s.
6. **Rangs per temps efectiu / `refSeconds`:**
   - ≤0,5 Llegenda · ≤0,7 Geni · ≤1 Mestre · ≤1,5 Expert · ≤2 Avançat · ≤3 Aprenent · més, Principiant.
   - ✦ Resolt fa créixer la ratxa.
   - ★ Perfecte vol dir sense errors ni pistes; les notes es permeten.
7. **Interacció:**
   - Es toca una cel·la o s'hi va amb les fletxes.
   - Xifres 1..N amb el teclat en pantalla o el físic.
   - Esborra, Backspace o 0 buiden la cel·la.
   - El botó **Notes**, o la tecla `n`, canvia de mode. En mode notes, cada xifra activa o desactiva un candidat petit.
   - Escriure un valor esborra les notes d'aquella cel·la.
8. **Compartir:**
   - `Quadrològic #21 · 5×5`
   - `⏱ 3:12 · Mestre`
   - `★ Perfecte` si escau
   - `🔥 Ratxa N`
   - URL

## Fitxers nous (`quadrologic/`, la mateixa estructura)
- **Generador:**
  - `gen_quadrologic/latin.py`: quadrat llatí i gàbies.
  - `gen_quadrologic/solver.py`: retrocés que compta fins a 2 i solucionador lògic.
  - `gen_quadrologic/pool.py`, `generate.py`, `og_image.py`.
  - `data/puzzles.json`: `{size, solution, cages:[{cells, op, target}], refSeconds, order, difficulty}`.
- **Tests Python** (`tests/test_quadrologic_{latin,solver,pool}.py`):
  - el quadrat és llatí;
  - les gàbies cobreixen la graella i quadren amb la solució;
  - unicitat;
  - el solucionador lògic resol el que s'accepta;
  - mida per dia de la setmana.
- **Client:**
  - `js/game.js`: valors, notes, comprova, pista, temps efectiu, rang, ★ i `progress()`.
  - `js/share.js`, `js/ui.js`, `js/app.js`, i `modes.js`, `streak.js` i `storage.js` copiats.
  - `index.html`, `css/styles.css`, `sw.js`, `manifest.json`, `favicon.svg`, `og-image.png`.
- **Tests JS:**
  - `game.test.js`, `share.test.js`, `storage.test.js`;
  - `pool.test.js`: el JS recalcula les gàbies i el quadrat llatí, i comprova la mida per dia.
- `sitemap.xml`: s'hi afegeix `/quadrologic/`.

## Verificació
1. `python -m pytest` i `node --test` des de l'arrel, tot verd.
2. Playwright a 400 px:
   - Resoldre el repte d'avui (dimarts, 4×4) amb una comprovació errònia i amb notes.
   - Comprovar el temps i la penalització, el rang, la ratxa i la recàrrega (el temps es manté).
   - Comprovar el text de compartir, que funciona sense connexió i que no hi ha errors a la consola.
   - Fer una captura.
   - Comprovar també que un 6×6 es veu bé a 400 px, avançant el rellotge de Playwright a un dissabte (sense afegir cap paràmetre a l'URL).
3. Push i PR. M'ature per ensenyar-te-la abans de Rutalògic.
4. Copiar aquest pla a `documents/plans/2026-10-27-quadrologic.md`.
