# Família Lògic — 4 jocs germans de Numerològic

Treballes al repo de Numerològic (`C:\projects\numerologic`). Vull afegir 4 jocs diaris nous de números i lògica, en valencià, amb el mateix ADN que Numerològic. Abans de començar, llig el codi existent (`index.html`, `css/styles.css`, `js/*.js`, `generator/*.py`, `CONTRIBUTING.md`) i el generador d'Igualògic que ja hi ha a `igualogic/gen_igualogic/` (fet i provat: no el reescrigues, continua'l).

Fes-los en aquest ordre i un per un: **Igualògic → Simbològic → Quadrològic → Rutalògic**. Per a cada joc: branca pròpia (`git checkout -b igualogic`), proves verdes i Pull Request. Mai `push` a `main`. Quan acabes un joc, para i ensenya'm el resultat abans de passar al següent.

## Decisions ja preses

- **Portal únic**: cada joc viu en una subcarpeta del mateix repo i del mateix domini (`numerologic.cat/igualogic/`, `/simbologic/`, `/quadrologic/`, `/rutalogic/`). Lloc estàtic a Vercel, sense build.
- **Sense backend ni rànquing entre jugadors**: com Numerològic, tot va en `localStorage`. La «classificació» són els 7 rangs del dia.
- **No toques els fitxers de Numerològic**, excepte per afegir, al final, un enllaç «Més jocs» al peu de `index.html` i les URL noves a `sitemap.xml`.

## Estructura de cada joc (exemple: igualogic)

```
igualogic/
  index.html  manifest.json  sw.js  favicon.svg  og-image.png
  css/styles.css
  js/app.js  js/game.js  js/ui.js  js/share.js  js/storage.js  js/streak.js  js/modes.js  (+ mòduls propis)
  js/tests/*.test.js          ← els executa `node --test` des de l'arrel
  data/puzzles.json
  gen_<joc>/                  ← paquet Python propi (NO es pot dir `generator`: xocaria amb el de Numerològic)
    __init__.py  generate.py  ...
    tests/__init__.py  tests/test_<joc>_*.py   ← noms únics: pytest falla si dos fitxers de test es diuen igual
```

- El generador s'executa des de la carpeta del joc: `python -m gen_<joc>.generate`. El pool ha de tindre 364 reptes (múltiple de 7, perquè els reptes per dia de la setmana continuen quadrant quan el pool torna a començar) i `startDate` = `2026-10-26`.
- `python -m pytest` i `node --test` des de l'arrel han de passar amb els tests de Numerològic **i** els dels jocs nous (ara: 73 + 100 verds, més els d'Igualògic).
- `modes.js`, `streak.js` i `storage.js` es copien de Numerològic. `storage` porta un prefix propi (`igualogic:p:`, `igualogic:streak`) perquè no es barregen els progressos.
- Cada joc té el seu `sw.js` (scope a la seua carpeta, cache amb versió) i el seu `manifest.json`. La font és `../fonts/anton.woff2` (no la dupliques).
- `og-image.png` de 1200×630 generada amb un script Python semblant a `scripts/og_image.py`.

## ADN comú (ha de semblar de la mateixa casa)

- **Pell**: targeta blanca de 400 px màxim sobre `#f1f5f9`, radi 18, ombra suau. Turquesa `#58b4c4` principal, roig `#ec5a52` per a l'element central, or `#eab308` per a la proesa, botons en píndola. Xips de dificultat Fàcil/Mitjà/Difícil amb els colors de Numerològic.
- **Logo**: text en Anton. Prefix negre + `L` turquesa + `Ò` roja + `GIC` turquesa. Per exemple: IGUA·L·Ò·GIC.
- **Repte diari**: índex per data des de `startDate` (`dailyIndex`). Tothom juga el mateix.
- **✦ Objectiu del dia**: completar-lo fa créixer la ratxa 🔥. **★ Proesa**: opcional, dona prestigi.
- **Rangs**: Principiant 0 · Aprenent 10 · Avançat 25 · Expert 45 · Mestre 65 · Geni 85 · Llegenda 100 (% dels punts totals del dia), excepte on s'indica una altra cosa.
- **Peu**: comptador i rang (clicables), estat ✦/★/ratxa, i la fila `Núm. N · Solució d'ahir · Pistes · Com jugar · Comparteix` amb el mateix panell modal.
- **Compartir**: text tipus Wordle que mai revela la solució, amb l'URL del joc. Fa servir `navigator.share` i, si no n'hi ha, el porta-retalls.
- Funciona amb el teclat físic, és PWA i funciona sense connexió.

## 1. Igualògic: endevina l'equació amagada

- Tauler de 6 intents × 8 caselles. El diumenge, **Maxi** de 10 caselles (el pool ja ho porta: `"maxi": true`). Teclat en pantalla amb `0–9 + − × ÷ =`, Esborra i Envia.
- Cada intent ha de ser una igualtat certa: un sol `=`, a la dreta només un nombre, nombres sense zeros a l'esquerra, sense menys unari, prioritat d'operacions i divisió exacta a cada pas. Les regles són a `gen_igualogic/equacions.py`. Porta-les a `js/equacions.js` **amb paritat exacta**: genera des de Python un fitxer de casos (vàlides, invàlides i colors) i fes un test JS que el compare, igual que `parity.test.js`.
- Colors: turquesa = lloc correcte, or = hi és en un altre lloc, gris = no hi és. Els repetits segueixen la regla del Wordle (funció `feedback`). El teclat en pantalla també es pinta.
- Rang segons els intents: 1 Llegenda, 2 Geni, 3 Mestre, 4 Expert, 5 Avançat, 6 Aprenent, no resolta Principiant.
- ✦ **Resolta** (fa créixer la ratxa). ★ **Mode difícil**: s'activa abans del primer intent i obliga a reutilitzar tota pista turquesa a la mateixa posició i tota pista or.
- Pistes: nombre d'operadors · xifres del resultat · si hi ha alguna xifra repetida. Usar-ne alguna limita el rang màxim a Expert.
- Compartir: `Igualògic #12 · 3/6 · Mestre ★` + graella 🟦🟨⬜ + `🔥 Ratxa N` + URL.
- Solució d'ahir: l'equació d'ahir.

## 2. Simbològic: àlgebra amb símbols

- Graella de símbols (hexàgon turquesa, cercle roig, rombe fosc i, a la 4×4, un quart símbol) amb el total de cada fila a la dreta i de cada columna a sota. El jugador escriu el valor de cada símbol i prem Comprova: turquesa si és correcte, roig si és incorrecte, i l'error compta.
- 3 graelles al dia: **Fàcil** 3×3 amb 3 símbols · **Mitjà** 4×4 amb 4 · **Difícil** 4×4 amb alguna fila de producte (×) i valors negatius. Valors enters de l'1 al 20 (en la difícil, del −9 al 20).
- Punts: 10 per graella, −2 per error, −3 per pista, mínim 1. El total del dia és 30 i els rangs van per %.
- ✦ **Tres de tres** (fa créixer la ratxa). ★ **Net**: les tres graelles sense errors ni pistes. Pista: revela un símbol.
- Generador: solució entera **única** (rang complet, aritmètica exacta amb `fractions`) i resoluble per un solucionador «humà» pas a pas (substituir símbols coneguts, restar files o columnes que difereixen en un símbol…). Els passos necessaris defineixen la dificultat. Rebutja les graelles on les files soles són dependents i cap combinació senzilla no les desbloqueja.
- Compartir: `Simbològic #5 · Mestre` + `🟦🟦🟥` (una per graella: neta / amb errors) + punts + ratxa.

## 3. Quadrològic: calcudoku

- Graella N×N amb les xifres 1..N sense repetir en cap fila ni columna. Cada gàbia té un resultat i una operació (`12×`, `2÷`, `1−`, `7+`; en les gàbies d'una cel·la, només el número). Mode **notes** per escriure candidats en petit.
- Mida segons el dia: 4×4 de dilluns a dimecres, 5×5 dijous i divendres, 6×6 dissabte i diumenge.
- Rangs per **temps** respecte d'un temps de referència `refSeconds` que calcula el generador. ≤0,5× Llegenda · ≤0,7× Geni · ≤1× Mestre · ≤1,5× Expert · ≤2× Avançat · ≤3× Aprenent · més Principiant. Comprovació errònia: +30 s. Pista (revela una cel·la): +60 s.
- ✦ **Resolt** (fa créixer la ratxa). ★ **Perfecte**: sense errors ni pistes (les notes sí que es permeten).
- Generador: quadrat llatí aleatori → gàbies de 2–3 cel·les → solucionador amb retrocés que compta solucions i s'atura a 2 → només graelles amb solució **única**. Un solucionador lògic estima la dificultat i `refSeconds`.
- Compartir: `Quadrològic #21 · 5×5` + `⏱ 3:12 · Mestre` + ★ + ratxa.
- Nom: no fer servir «KenKen», que és marca registrada.

## 4. Rutalògic: rutes dins d'un rusc gran

- Rusc hexagonal de 19 cel·les en files de 3-4-5-4-3. El centre (roig) té el valor inicial, del 2 al 9. Les altres 18 cel·les tenen operacions: `+n`, `−n`, `×2`, `×3`, `÷2`, `÷3`.
- El jugador surt del centre i va tocant cel·les **veïnes** sense repetir-ne cap, i el valor s'actualitza en viu. Divisió exacta i `|valor| < 1000`. Envia quan el valor és l'objectiu. Una solució és una **seqüència de cel·les**: dues rutes amb el mateix valor però per llocs diferents són dues solucions. «Enrere» desfà l'últim salt.
- Punts: 1 per cel·la recorreguda. Les rutes ✦ i ★ valen 10. Rangs per %, com Numerològic.
- ✦ **Brevi**: totes les rutes de longitud mínima. Completar-les dona +10 i fa créixer la ratxa. ★ **Marató**: trobar una de les rutes de longitud màxima.
- Generador: DFS exhaustiu de totes les rutes simples des del centre. N'hi ha exactament 888.205 i es recorren en uns 0,2 s per tauler. Per a cada valor final guarda el nombre de rutes, la longitud mínima i la màxima. Accepta el tauler si hi ha un objectiu del 10 al 99 amb 20–200 rutes i un Brevi de 4 cel·les o més. En un prototip ho complien uns 4 taulers aleatoris de cada 10: ajusta la barreja d'operacions. Guarda al JSON les rutes ✦ i ★ per a la «Solució d'ahir» i els recomptes per longitud per a les pistes.
- Compartir: `Rutalògic #8 · Expert` + punts i rutes + ✦/★ + ratxa.

## Verificació de cada joc (abans de dir-me que està fet)

1. `python -m pytest` i `node --test` des de l'arrel, tot verd.
2. Servidor local (`python -m http.server 8000`) i Playwright a 400 px d'ample: juga una partida sencera del repte d'avui, comprova que el progrés i la ratxa sobreviuen a una recàrrega, que el text de compartir és correcte i que no hi ha errors a la consola. Fes una captura i ensenya-me-la.
3. Qualsevol ordre que m'hages de donar a mi, per a CMD de Windows.
