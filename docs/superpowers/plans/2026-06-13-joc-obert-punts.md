# Pla — Joc obert per punts (sense conjunt curat)

## Context

Els usuaris escriuen expressions **matemàticament vàlides** que arriben a l'objectiu
(p. ex. `3+4+5+6+7 = 25`, `5×8−7−6−3+1 = 25`) i el joc les rebutja amb el missatge
enganyós *"No és una solució del repte"*. La causa: el conjunt de solucions està
**precalculat només fins a 4 operands** (`generator/puzzles.py::make_puzzle(max_leaves=4)`,
limitació coneguda a `research/PROBLEMA.md`). Les expressions de 5–6 operands evaluen bé,
usen el central i no repeteixen dígits, però la seva forma canònica no és al conjunt → `notInList`.

Comptar-les com a conjunt tancat és inviable: per a aquest repte n'hi ha 111 fins a k=4,
**2.797** fins a k=5 i **38.245** fins a k=6 (26 min de generació). Decisió de producte (acordada):
**eliminar el conjunt curat com a porta de validació**. El joc accepta **qualsevol expressió vàlida**
i puntua per **punts** (= nombre d'operands), deduplicant per **forma canònica**. S'abandona el
"X de N solucions" i el rang passa a basar-se en punts (personal, sense backend).

Resultat esperat: cap expressió vàlida es torna a rebutjar; ranking personal per punts; i, de pas,
en escriure una solució ja trobada (mateixa canònica) l'entrada s'**esborra sola**.

**No cal regenerar `data/puzzles.json` ni tocar el generador Python.** Es reaprofiten `target`,
`digits`, `centralIndex`, `rules`, `ranks`, `hints`. El camp `solutions` deixa d'usar-se al client.

## Canvis (test primer, segons skill bug-fix)

### 1. Tests de reproducció (escriure'ls i veure'ls FALLAR primer)
Nou fitxer `js/tests/open-validation.test.js` amb un puzzle tipus repte 12
(`target:25, digits:[1,3,4,5,6,7,8], centralIndex:3 (central=5), rules:{allowRepeat:false, ops:["add","sub","mul","div"]}, ranks:[["Principiant",0],["Geni",20]], solutions:[]`):
- `3+4+5+6+7` → `found`, points 5  *(ara dóna `notInList`)*
- `5*8-7-6-3+1` → `found`, points 6
- `(6+4)+3+7+5` després de `3+4+5+6+7` → `duplicate` (mateixa canònica)
- `5+5+5+5+5` → `invalid` (no-repetir)  *(ara s'acceptaria)*
- `5^2*1` → `invalid` (operador no permès per `rules.ops`)  *(ara s'acceptaria)*

### 2. `js/validate.js` — aplicar regles que abans eren implícites pel conjunt
Afegir a `validate(ast, { digits, central, allowRepeat = true, ops = null })`:
- **No-repetir**: si `!allowRepeat`, comptar multiplicitat de cada dígit fulla; si algun
  supera la seva multiplicitat al rusc (dígits distints ⇒ màx 1) → `{ ok:false }`.
- **Operadors**: si `ops` no és null, recórrer els nodes; si algun tipus (`add/sub/mul/div/pow/sqrt`)
  no és a `new Set(ops)` → `{ ok:false }`. (`rules.ops` ja inclou `"sqrt"` quan toca.)
- Reusa `collectLeafDigits` existent; les comprovacions de dígit-al-rusc i central no canvien.

### 3. `js/game.js` — obrir la validació, treure el gate
- Llegir regles: `const r = puzzle.rules||{}; const allowRepeat = r.allowRepeat !== false; const ops = r.ops||null;`
- Passar `{ digits, central, allowRepeat, ops }` a `validate`.
- **Eliminar** `solutionSet` i la branca `notInList`: després del tutti, tota canònica nova
  és `found` (punts = `solutionPoints(countLeaves(ast), hasPowOrSqrt(ast))`), i si ja és a `found` → `duplicate`.
- **Tutti sense canvis**: `usesAllDigits` → `tutti` (+`TUTTI_BONUS`, un sol cop, flag separat, no compta a `score()`).
- `score()`, `rank()`, `progress()`, restauració: sense canvis (segueixen amb `puzzle.ranks`).

### 4. `js/app.js`
- `send()`: també buidar l'entrada quan `res.status === "duplicate"` (petició 2), a més de `found`/`tutti`.
  `saveProgress`/`refreshFooter` només en `found`/`tutti`.
- `refreshFooter()`: passar `score: game.score()`, treure `total`.
- Handler de `share`: passar `score: game.score()`, treure `total`.

### 5. `js/ui.js`
- `updateFooter`: signatura `{ countEl, rankEl, tuttiEl, found, score, rankName, tuttiFound }`;
  text → `Has trobat ${found} solucions (${score} punts).`
- `FLASH`/`MSG`: treure l'entrada `notInList` (queda inabastable).
- `hintsHTML`: reetiquetar capçalera a "Solucions **de fins a 4 operands** per nombre d'operands"
  (les pistes provenen del conjunt k≤4; ara és orientatiu).

### 6. `js/share.js`
- `buildShareText({ number, rankName, score, found, tuttiFound })` →
  `Numerològic #N · {rank}` / `{score} punts · {found} solucions` / `★ Tutti!` (si) / URL.
- Eliminar `emojiBar` (només l'usava el share i els seus tests) i depèn de `total` inexistent.

### 7. Tests existents a actualitzar
- `js/tests/game.test.js`: substituir el test `notInList` (l. 49–53) per acceptació oberta;
  afegir puzzle amb `rules` per provar no-repetir i ops. La resta es manté.
- `js/tests/validate.test.js`: afegir casos no-repetir i ops.
- `js/tests/share.test.js`: reescriure per al nou `buildShareText`; treure els tests d'`emojiBar`.

## Notes de disseny / decisions menors
- **Rangs**: es mantenen els llindars de `puzzle.ranks` com a **fites** escalades a la riquesa
  del dia (el `totalPoints` k≤4). Amb joc obert la puntuació pot **superar** la fita superior;
  el rang es queda al cim. El nom del rang cim ("Totes") es deixa tal qual (canvi de nom = opcional, futur).
- **Sense backend**: ranking = rang personal per punts al propi dispositiu (localStorage). Leaderboard
  multijugador queda per a una fase 2 separada (necessitaria backend + identitat + anti-trampes).
- **Compatibilitat**: el format de progrés desat (`{found:[{canonical,text}], tuttiFound}`) no canvia;
  el progrés existent es restaura sense migració.

## Verificació
1. `npm test` (node --test) → tota la suite en verd (inclosos els nous tests de reproducció).
2. Harness ràpid amb Node carregant `data/puzzles.json` (puzzle índex 12) i cridant `game.submit`
   per a les 4 expressions de les captures → totes `found` amb els punts esperats; un repeat → `duplicate`.
3. Manual a `index.html` (repte diari del 2026-06-13): escriure `3+4+5+6+7` → "Trobada! +5",
   el comptador i els punts pugen; tornar a escriure-la (o `(6+4)+3+7+5`) → "Ja la tens" i
   **l'entrada es buida sola**; `5+5+5` → "No és vàlida"; comprovar Comparteix mostra punts.
