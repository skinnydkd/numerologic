# Numerològic — Disseny: client jugable (Pla 2b)

**Data:** 2026-05-25
**Estat:** Aprovat per l'usuari (pendent revisió final de la spec)
**Autor:** Pau + Claude
**Context:** Segon dels plans del client. Reutilitza el nucli del Pla 2a (`parser`, `evaluator`, `canonical`, `validate`, `score`). El **compartir** i la **PWA** són el Pla 2c (fora d'abast aquí).

## 1. Abast

El client **jugable** complet al navegador: repte **diari** i **pràctica lliure**, amb el rusc interactiu, entrada d'expressions, validació en viu, puntuació, rangs, detecció del **tutti** i progrés desat a `localStorage`. Sense backend ni build.

**Fora d'abast (Pla 2c):** compartir resultat (estil Wordle), `manifest.json` + service worker (offline/instal·lable).

## 2. Stack i estil

- JS vanilla amb ES modules, sense framework ni build (consistent amb el 2a).
- **Tema Paraulògic** (validat amb mockups): hexàgons turquesa `#58b4c4`, central coral `#ec5a52`, fons blanc, botons "pastilla". Rusc en flor amb **buit uniforme** (amplada 72 · alçada 83 ≈ 2/√3·amplada · buit 8 · solapament −14; hexàgons *pointy-top*).
- Layout "Calculadora": logo "Numerològic" → objectiu ("Arriba a N") → display de l'expressió → rusc → fila d'operadors (`+ − × ÷ ^ √ ( )`) → accions (Esborra · ⟳ Remena · Envia) → peu (comptador, rang, ★ tutti).

## 3. Fitxers i mòduls

```
numerologic/
  index.html              # estructura de la pàgina
  css/styles.css          # tema Paraulògic
  js/
    game.js               # estat i lògica de partida (pura, testable, sense DOM)
    storage.js            # persistència localStorage (pura sobre un "store" injectable)
    ui.js                 # render i events del DOM (prim)
    app.js                # entrada: carrega puzzles.json, connecta game/ui/storage
```

Reutilitza del 2a: `parser.js`, `evaluator.js`, `canonical.js`, `validate.js`, `score.js`.

## 4. `game.js` — lògica de partida (nucli testable)

Sense DOM. Opera sobre un objecte repte del pool: `{target, digits, centralIndex, solutions, totalPoints, ranks, hasTutti}`.

- `createGame(puzzle, progress?) → game` — crea l'estat; si es passa `progress` (de storage) el restaura.
- `game.submit(inputText) → result` — el cor. Passos:
  1. `parse(inputText)` → si `ParseError`: `{status:"invalid"}`.
  2. `validate(ast, {digits, central})` → si no ok: `{status:"invalid"}`.
  3. si `value !== target`: `{status:"wrong"}`.
  4. si `usesAllDigits(ast, digits)` (és un **tutti**): si `!tuttiFound` → marca'l, `{status:"tutti", points:10}`; si ja trobat → `{status:"duplicate"}`.
  5. `c = canonical(ast)`; si `c` ∈ `solutions`: si `c` ja trobada → `{status:"duplicate"}`; si nova → registra `{canonical:c, text:inputText, points:solutionPoints(countLeaves(ast), hasPowOrSqrt(ast))}` i `{status:"found", points}`.
  6. altrament (vàlida, = objectiu, però no a la llista ni tutti): `{status:"notInList"}`.
- `game.found` — Map `canonical → {text, points}` (l'ordre d'inserció és l'ordre de trobada).
- `game.tuttiFound` — boolean.
- `game.score()` — suma dels punts de les trobades (la llista comptada). **No** inclou el bonus del tutti.
- `game.tuttiBonus()` — `tuttiFound ? 10 : 0` (es mostra a part).
- `game.rank()` — nom del rang segons `score()` vs `puzzle.ranks`.
- `game.progress()` — objecte serialitzable per a storage: `{found:[{canonical,text}], tuttiFound}`.

**Constants:** `TUTTI_BONUS = 10`.

## 5. `storage.js` — persistència

Tots dos modes (diari i pràctica) **desen progrés**, per repte.

- Clau per repte: `numerologic:p:<poolIndex>` (l'índex del repte dins del pool; diari i pràctica comparteixen progrés si és el mateix repte).
- `loadProgress(store, poolIndex) → progress|null`.
- `saveProgress(store, poolIndex, progress)`.
- `store` és injectable (per defecte `localStorage`; als tests s'usa un objecte fals) → mòdul pur i testable.
- Format desat: `{found:[{canonical, text}], tuttiFound}` (JSON). En carregar, `createGame(puzzle, progress)` recalcula punts i rang.

## 6. Modes

- **Diari:** `poolIndex = floor((avui − startDate) / 1 dia) mod pool.length`. Igual per a tothom el mateix dia. Núm. de repte = aquest índex (o dies des de startDate).
- **Pràctica lliure:** tria un `poolIndex` a l'atzar **diferent** del diari d'avui. Botó "nova pràctica" per triar-ne un altre. Desa progrés per repte igual que el diari.
- Selector de mode a la part superior.

## 7. `ui.js` + `app.js` — interfície

- **Render:** logo, objectiu, display (expressió en construcció + cursor), rusc (cel·les des de `digits`, central destacada per `centralIndex`), operadors, accions, peu (comptador `trobades/total`, rang, ★ tutti).
- **Entrada:**
  - Tocar una cel·la del rusc afegeix el dígit; tocar un operador l'afegeix.
  - **Teclat:** dígits `1-9`, `+ - * / ^`, `(` `)`, `r` o `√` per a l'arrel, **Enter** = Envia, **Retrocés** = esborra l'últim, **Esc** = neteja.
  - "Remena" barreja les 6 cel·les perifèriques (la central es queda).
- **Feedback** (flash breu sota el display): verd `Trobada! +N`; daurat `★ TUTTI! +10`; groc `Ja la tens`; vermell `No és vàlida` / `No arriba a l'objectiu` / `No és del repte d'avui` segons `result.status`.
- **Llista de trobades:** tocar el comptador obre un panell amb les expressions trobades en **el text que va escriure el jugador** (Opció A), agrupades/ordenades per punts; el tutti hi surt marcat amb ★.
- **Rang:** tocar el rang mostra els llindars (`puzzle.ranks`) i on ets.
- `app.js` carrega `data/puzzles.json`, calcula el repte segons el mode, restaura el progrés via storage, crea el game i fa el render; cada `submit` desa el progrés.

## 7b. Forma llegible d'una solució

A la llista de trobades es mostra **el text literal que el jugador va escriure** (desat amb cada trobada). No es reconstrueix res des de la canònica. La canònica només s'usa internament com a clau de deduplicació.

## 8. Estratègia de proves

- `game.js` i `storage.js` amb `node:test` (lògica pura): classificació de cada `status` (`found`, `duplicate`, `tutti`, `wrong`, `invalid`, `notInList`), càlcul de `score`/`rank`, separació del bonus del tutti, serialització `progress()` i restauració amb `createGame(puzzle, progress)`, `loadProgress`/`saveProgress` amb un store fals.
- `ui.js`/`app.js` són DOM: el gruix lògic viu a `game.js` (testat); la UI es verifica **visualment** al navegador (i, amb la PWA, al Pla 2c).

## 9. Límits coneguts (acceptats)

- Les expressions de 5–6 operands no compten (no són del pool ni tutti) → `status:"notInList"`, amb missatge clar. És conseqüència del cap de generació (`max_leaves=4`).
- Un repte podria, en teoria, no tenir tutti; el pool actual garanteix `hasTutti:true` per a tots, així que l'estrela sempre és assolible.
