# Numerològic — Disseny: «1 net» (anti ×1/÷1) + escala de rangs sòlida

**Data:** 2026-06-21
**Estat:** Aprovat per l'usuari (pendent revisió final de la spec)
**Autor:** Pau + Claude
**Depèn de:** `generator/enumerate_solutions.py` (enumeració ancorada a l'objectiu) i la canònica de paritat Py↔JS (`generator/engine.py::canonical` ↔ `js/canonical.js`).

## 1. Context

Dos problemes observats al joc desplegat (variant **no-repeat, `+−×÷`**; ruscs de 5/6/7 dígits; `maxOperands = 4` als 60 reptes):

1. **Inflació per ×1/÷1.** Quan el rusc conté un `1`, qualsevol solució es pot «farcir» amb un `×1` o `÷1` trivial i compta com a solució nova. Mesurat al banc real: en els **45/60 reptes amb un 1**, el **26%** de les solucions comptades són farciment ×1/÷1 (mediana 32% per repte, fins a 89%). Ja s'evita que el **central** sigui 1; falta el cas del 1 **no-central**.
2. **Escala de rangs poc sòlida.** Els rangs surten de `totalPoints` = punts del **conjunt comptat** (solucions de 2–4 operands; cap als `maxOperands=4`), amb llindars a 0/10/25/45/65/85/100%. Conseqüències:
   - El **tutti val 0 al denominador** (usa 5–7 dígits > 4 operands) → es pot arribar a **Llegenda sense trobar mai el tutti**.
   - El joc en viu premia tuttis i solucions de 5–7 operands que **no** són al denominador → es pot **passar del 100%**; el percentatge no és una barra de progrés neta. (Aquest deute ja era anomenat al spec de Brevi, §11.)

**Per què no «comptar-ho tot»:** mesurat, un rusc de 7 dígits té **~306.841** solucions fins a N operands (el tier de tuttis tot sol: ~270.000), ~14 s d'enumeració. Comptar-ho tot mata el `puzzles.json` i fa **Llegenda inabastable**. La solidesa s'aconsegueix fitant l'objectiu, no inflant-lo.

**Decisions (usuari):**
- ×1/÷1: **absorbir-los a la forma canònica** (es dedupen sols) **i documentar-ho a les regles**.
- Rangs: **+10 fix pel tutti garantit al denominador** + **sostre del rang a Llegenda** (clamp); base de recompte es manté a ≤4 operands.

## 2. Peça central: `reduce1(ast)`

Funció pura AST→AST, **idèntica en Python i JS**, única font de veritat de la noció «el dígit-fulla 1 no fa res quan multiplica/divideix»:

- `mul(a, b)` → si `reduce1(a) == ('num',1)` retorna `reduce1(b)`; si `reduce1(b) == ('num',1)` retorna `reduce1(a)`; si no, `mul(reduce1(a), reduce1(b))`.
- `div(a, b)` → si `reduce1(b) == ('num',1)` retorna `reduce1(a)`; si no, `div(reduce1(a), reduce1(b))`.
- Altres nodes: reconstrucció recursiva (`sub`, `add`, `num`, …) sense canvis.

**Abast deliberat:** només el **dígit-fulla** `1` (`('num',1)`). No toca un 1 *calculat* (`5−4`), ni `^1`/`√` (la variant desplegada no els usa; vegeu §7). `reduce1` **preserva el valor** (×1/÷1 són identitats) → és segur per a dedup i per a la detecció de tutti. L'**avaluació** segueix usant l'AST cru (`validate.js` no canvia).

## 3. Part A — «1 net»

1. **Canònica:** `canonical(ast) := canonical_raw(reduce1(ast))` als dos llenguatges. Així `(7+2)×1`, `(7+2)÷1`, `7×1+2`, `(7×1+2)÷1`… col·lapsen tots en la clau de `7+2` → es dedupen automàticament (a l'enumerador i en viu, on el segon intent surt com a `duplicate`).
2. **Tutti sobre forma reduïda:** una expressió és tutti si el **conjunt de dígits de `reduce1(ast)`** == `digits`. Usar el `1` com a `×1`/`÷1` deixa de comptar com a «fer servir tots els dígits»; per ser tutti, el `1` s'ha d'usar de debò (sumant/restant, o dins d'un subarbre que sí entra al càlcul). Afecta `js/score.js::usesAllDigits` (+ `js/game.js`) i `generator/puzzles.py::_uses_all_digits`.
3. **Generació — tutti *real* garantit:** se substitueix la comprovació `tutti_exists` per **`meaningful_tutti_exists`**: el mateix DP de valors de `generator/tutti.py`, però que **prohibeix combinar la fulla-1 amb `×`/`÷`** (es detecta quan un dels operands del combine és la màscara *singleton* del bit del dígit 1). Ràpid (DP de valors, sense materialitzar ASTs), coherent amb `reduce1`. Si no existeix tutti meaningful per a un objectiu, es descarta aquell objectiu.
4. **Regles (`js/ui.js`):** nova línia a «Com es juga»: *«Multiplicar o dividir per 1 no crea una solució nova.»*

## 4. Part B — Escala de rangs sòlida

5. **Denominador (`generator/puzzles.py::game_total_points`):** se suma **+10 fix** pel tutti garantit (constant, no escalat: un tutti). Avui aquest terme val 0 perquè el conjunt comptat es para a 4 operands i cap solució de ≤4 usa tots els dígits. Amb el +10, **Llegenda exigeix el tutti**. Es manté la resta del càlcul (Brevi i solucions val 10 / 1-per-operand + bonus Brevi complet).
6. **Sostre (`js/game.js::rank`):** la puntuació usada per al rang es clampa al llindar de Llegenda (`= totalPoints`): `s = min(score(), ranksLlegenda)`. No es pot passar del 100% acumulant tuttis extra o solucions llargues. **La puntuació mostrada al peu segueix sent la real** (pot superar `totalPoints`); només el **rang** té sostre.
7. **Base de recompte:** es manté a `maxOperands = 4` (l'únic tram enumerable i «trobable»). No es compten solucions de 5–7 operands ni la totalitat dels tuttis.

## 5. Fitxers afectats

- `generator/engine.py` — `reduce1` + `canonical` la crida.
- `js/canonical.js` — `reduce1` (paritat byte a byte) + `canonical` la crida.
- `generator/tutti.py` — `meaningful_tutti_exists` (DP que veta la fulla-1 com a operand ×/÷).
- `generator/puzzles.py` — usa `meaningful_tutti_exists`; `_uses_all_digits` sobre reduït; `game_total_points` +10 tutti.
- `js/score.js` + `js/game.js` — `usesAllDigits`/tutti sobre reduït; `pointsFor` igual; `rank` amb clamp.
- `js/ui.js` — línia de regles.
- `data/puzzles.json` — **regenerat** (seed 0) amb el nou pipeline.
- `sw.js` — pujar versió de cache (entrega el nou JSON + JS).

## 6. Model de dades (`puzzles.json`)

Sense camps nous. Canvien **valors**: `solutions` (menys, sense farciment ×1), `totalPoints`/`ranks` (recalculats amb el +10 del tutti), `hints.byLeaves`/`byOp` (sense els trivials). `hasTutti` segueix `true` però ara garanteix tutti **meaningful**. Alguns objectius/reptes poden **caure** (si només tenien tutti trivial) i ser substituïts en regenerar.

## 7. Fora d'abast / límits

- **`^1` i `√`**: la variant desplegada és `+−×÷`; `reduce1` no absorbeix `x^1`/`1^x`. Si algun dia s'activa `pow`/`sqrt` al banc, caldrà estendre `reduce1` (deute conegut, marcat amb comentari `ponytail:`).
- **Tier complet de solucions** (5–7 operands): no es compta (explosió 270k); el rang queda fitat a ≤4 operands + tutti, a propòsit.
- **1 calculat** (`5−4`) usat com a `×1`: no es redueix; només la fulla-dígit `1`.

## 8. Testing / validació

- **Paritat Py↔JS**: `reduce1`/canònica donen la mateixa cadena en els dos llenguatges (ampliar `js/tests/parity.test.js` i les fixtures `js/tests/fixtures/canonical_fixtures.json`).
- **`reduce1`**: `(7+2)×1` ≡ `7+2`, `7÷1` ≡ `7`, `7×1+2` ≡ `7+2`; **no** redueix `(5−4)×3` ni `1+7`.
- **Tutti sobre reduït**: `(a+b+c+d+e+f)×1` en rusc de 7 amb un 1 **no** és tutti; un tutti que usa el 1 sumant **sí**.
- **`meaningful_tutti_exists`**: rebutja objectius amb només tutti trivial; accepta els que tenen tutti real (verificació creuada amb enumeració del tier complet en casos petits, n=5).
- **Denominador**: `game_total_points` inclou +10 una vegada; un repte amb tutti real té Llegenda > suma de solucions ≤4 sense el tutti.
- **Clamp del rang**: amb `score > totalPoints`, `rank()` retorna Llegenda i no peta.
- **Regressió de dades**: integritat del `puzzles.json` regenerat (tests existents de `generator/tests/test_data_integrity.py`).

## 9. Ordre de construcció

1. `reduce1` + canònica (Py i JS) + tests de paritat/fixtures.
2. Tutti sobre reduït (client + generador) + `meaningful_tutti_exists` + tests.
3. Denominador +10 tutti + clamp del rang + línia de regles + tests.
4. Regenerar `data/puzzles.json` (seed 0) + pujar `sw.js`.
