# Igualògic: primer joc de la família Lògic

## Context
Pau vol 4 jocs diaris germans de Numerològic (prompt a `docs/familia-logic-prompt.md`). Aquest pla cobreix només el primer, **Igualògic**: s'endevina una equació amagada en 6 intents, com el Nerdle. El generador Python ja està fet i provat (`igualogic/gen_igualogic/`, amb un pool de 364 reptes a `data/puzzles.json`). Falta tot el client web, la paritat JS↔Python, la PWA i la imatge OG.

**Repo:** el prompt diu `C:\projects\numerologic`, però aquell clon va 24 commits per darrere d'origin (no té el rànquing). Treballe a `C:\dev\numerologic`, que està al dia, i hi he copiat `igualogic/` i el prompt. L'original de `C:\projects` queda intacte.

**Base actual:** pytest 77 verds (68 + 9 d'Igualògic), `node --test` 137 verds. El prompt diu «73 + 100», però és una xifra antiga.

## Decisions per defecte (canvia-les en aprovar si no et van bé)
1. **Git:** branca `igualogic` i PR, sense push a main, com diu el prompt. Això té prioritat sobre la memòria («push directe a main»).
2. **Respostes commutatives:** no s'accepten. Només guanyes amb l'equació exacta, i els colors ho deixen clar. El Nerdle sí que les accepta per defecte; si les vols, és una línia a `game.js`.
3. **Pista «xifra repetida»:** mira totes les xifres de l'equació, no només les del resultat.
4. **«Més jocs» al peu de Numerològic:** es fa al final, quan hi haja més d'un joc. La URL `/igualogic/` sí que entra ara a `sitemap.xml`.
5. **Mode difícil:** a la manera del Wordle. Cada turquesa s'ha de repetir a la mateixa posició. Cada caràcter or o turquesa ha d'aparéixer almenys tantes vegades com se n'ha marcat.
6. **Peu:** el comptador («Intent N/6») i el rang obrin tots dos el panell de Rangs, amb la taula intents→rang i l'avís del límit per pistes.
7. **Sense rànquing ni backend**, com diu el prompt. Numerològic sí que en té ara, però no es toca.

## Fitxers nous (tot dins de `igualogic/`)
- `gen_igualogic/fixtures.py`: escriu `js/tests/fixtures/equacions_fixtures.json` amb cadenes vàlides i invàlides (incloses les de `test_igualogic_equacions.py`) i parells guess/answer → colors (repetits, Maxi). Funciona com `generator/fixtures.py`.
- `gen_igualogic/tests/test_igualogic_fixtures.py`: comprova que el fixture desat és el que genera el codi actual, perquè no quede desfasat.
- `gen_igualogic/og_image.py`: genera `og-image.png` de 1200×630, adaptant `scripts/og_image.py` (logo IGUA·L·Ò·GIC i una fila de caselles de colors). S'executa amb `python -m gen_igualogic.og_image`.
- `js/equacions.js`: port 1:1 de `equacions.py` (`evalLhs`, `isValid`, `feedback`). Només aquestes tres; l'enumeració no cal al client.
- `js/game.js`: estat pur, `createGame(puzzle, saved)`. Té els intents, `submit(guess)` → `{status: invalid|hardfail|guess|won|lost, colors, reason}`, el mode difícil (només activable abans del primer intent), les pistes usades, `rank()` (taula d'intents, limitat a Expert si hi ha pistes), `keyColors()` (millor color per tecla), `progress()` i `won`/`lost`.
- `js/share.js`: `Igualògic #12 · 3/6 · Mestre ★`, graella 🟦🟨⬜, `🔥 Ratxa N` i `https://numerologic.cat/igualogic/`. Si perds, `X/6`.
- `js/ui.js`: tauler 6×L, teclat en pantalla (`0–9 + − × ÷ =`, Esborra, Envia) pintat, flash, peu, panells (Com jugar, Pistes, Solució d'ahir, Rangs). Reutilitza `pretty()` i `openPanel()` de `js/ui.js` de Numerològic, copiats.
- `js/app.js`: la mateixa estructura que el `js/app.js` de Numerològic (fetch del pool, `start(dailyIdx())`, ratxa en guanyar, compartir amb `navigator.share` o porta-retalls). Teclat físic: dígits, `+ - * x / : =`, Enter, Backspace.
- `js/modes.js`, `js/streak.js`: còpies exactes. `js/storage.js`: còpia amb els prefixos `igualogic:p:` i `igualogic:streak`.
- `index.html`, `css/styles.css`: la pell de Numerològic (targeta de 400 px, xips de dificultat, píndoles, panell). El logo és text en Anton amb `../fonts/anton.woff2`. Diumenge, 10 caselles i xip «Maxi».
- `sw.js`: cache-first `igualogic-v1`, amb scope a la carpeta i `../fonts/anton.woff2` a la llista. `manifest.json` amb `start_url: "."` i `favicon.svg`.
- `js/tests/`: `equacions.test.js` (paritat amb el fixture), `game.test.js` (victòria, derrota, invàlides, mode difícil, límit de rang amb pistes, colors del teclat, restaurar el progrés), `share.test.js` (no revela la solució) i `storage.test.js` (prefix).

**Només es toca un fitxer de Numerològic:** `sitemap.xml`, per afegir `/igualogic/`. El SW arrel no interfereix, perquè l'scope més específic (`/igualogic/`) té prioritat.

## Ordre (TDD)
1. `fixtures.py` i el test de frescor → `equacions.js` + test de paritat.
2. `game.js` + tests → `share.js` + test → `storage.js`, `modes.js`, `streak.js`.
3. `ui.js`, `app.js`, `index.html`, `css`, `sw.js`, `manifest`, `favicon.svg`, `og_image.py`.
4. `sitemap.xml`. Commit per unitat lògica a la branca `igualogic`.

## Verificació
1. `python -m pytest` i `node --test` des de l'arrel, tot verd.
2. `python -m http.server 8000` i Playwright a 400 px a `/igualogic/`. Jugar el repte d'avui fins resoldre'l (amb la resposta del pool, després d'un intent erroni per veure els colors). Recarregar i comprovar que el tauler i la ratxa es mantenen. Llegir el text de compartir (stub de clipboard). Zero errors a la consola. Fer una captura i enviar-la amb SendUserFile.
3. Push de la branca, PR i comprovar la CI. Després pare i t'ho ensenye abans de Simbològic.
4. Després de l'aprovació, copiar aquest pla a `documents/plans/2026-10-27-igualogic.md`.
