# Numerològic — Disseny: nucli de lògica del client (Pla 2a)

**Data:** 2026-05-24
**Estat:** Aprovat per l'usuari (pendent revisió final de la spec)
**Autor:** Pau + Claude
**Context:** Primer dels dos plans del client (Pla 2). El Pla 2b (joc, UI/rusc, storage, share, PWA) ve després.

## 1. Abast

Només la **lògica pura** del client, agnòstica de la UI i de l'estat de partida: parseig, avaluació, forma canònica, validació d'una expressió i puntuació. **Sense DOM, sense `localStorage`, sense `puzzles.json`.** Tot funcions pures, testables amb `node:test`.

El risc crític que aquest pla resol primer: la **paritat byte a byte** del `canonical()` (i de l'avaluador) entre JS i Python. El contracte és `docs/superpowers/specs/canonical-format.md`.

## 2. Stack i tooling

- **JS vanilla amb ES modules**, sense framework ni pas de build.
- Per habilitar ESM `.js` a Node, un **`package.json` mínim** a l'arrel: `{"type": "module", "private": true}` (sense dependències). Els mateixos `.js` funcionaran al navegador amb `<script type="module">` al Pla 2b.
- **Tests:** `node:test` + `node:assert` integrats (Node v24). S'executen amb `node --test`.

## 3. Representació de l'AST (paral·lela a Python)

Arrays JSON que reflecteixen les tuples de Python:
- `["num", d]` (d enter 1–9)
- `["add", a, b]`, `["sub", a, b]`, `["mul", a, b]`, `["div", a, b]`, `["pow", a, b]`
- `["sqrt", x]`

Mateixa estructura a banda i banda → mateixa cadena canònica.

## 4. Mòduls (`js/`, un fitxer = una responsabilitat)

### `canonical.js` — `canonical(ast) → string`
Rèplica EXACTA de `generator/engine.py::canonical`:
- `["num", d]` → `String(d)`
- `["sqrt", x]` → `"r(" + canonical(x) + ")"`
- `["add", …]` → aplana fills `add` imbricats, `canonical` de cada part, **ordena** (`.sort()` per defecte, lexicogràfic per unitat UTF-16 = punt de codi per a ASCII), uneix amb espai: `"(+ " + parts.join(" ") + ")"`
- `["mul", …]` → igual amb `"(* "`
- `sub`/`div`/`pow` → `"(" + sym + " " + canonical(a) + " " + canonical(b) + ")"` amb `sym` ∈ `{- , / , ^}`

### `evaluator.js` — `evaluate(ast) → number`, `InvalidExpr`
Rèplica EXACTA de `engine.py` (`combine`, `do_sqrt`, `evaluate`). Constants idèntiques: `CAP = 1_000_000`, `MAX_EXPONENT = 19`.
- Divisió **exacta**: `b !== 0 && a % b === 0`, si no `InvalidExpr`.
- `pow`: `b ≥ 0 && b ≤ MAX_EXPONENT && !(a === 0 && b === 0)`, si no `InvalidExpr`.
- Qualsevol resultat amb `|v| ≥ CAP` → `InvalidExpr`.
- `sqrt`: arrel entera exacta d'un enter `≥ 2` (exclou 0 i 1, i negatius). Implementació: `r = Math.round(Math.sqrt(v)); r*r === v`. (Tots els valors vàlids són `< 10^6`, dins del rang segur de float.)
- Llança `InvalidExpr` (classe pròpia) en violar qualsevol regla.

### `parser.js` — `parse(str) → ast`
Tokenitza i parseja l'entrada de l'usuari a AST. Alfabet: dígits `1–9`, operadors `+ - * / ^`, `√` (unari prefix), parèntesis `( )`. Precedència (de més alta a més baixa): `√` (unari) → `^` (associativa per la **dreta**) → `* /` (esquerra) → `+ -` (esquerra), modificable amb parèntesis. Sense unari menys ni nombres de més d'un dígit (concatenació fora d'abast). Errors de sintaxi → llança un error propi (`ParseError`).

### `validate.js` — `validate(ast, {digits, central}) → {ok, value?, reason?}`
Comprova que l'expressió és vàlida per a un rusc donat:
- Tots els dígits-fulla pertanyen a `digits` (es permet repetició).
- El dígit `central` apareix **com a mínim una vegada**.
- `evaluate(ast)` no llança (totes les regles del motor es compleixen).
- Retorna `{ok: true, value}` o `{ok: false, reason}`.
- **No** limita el nombre d'operands (la classificació comptada/tutti és del Pla 2b).

### `score.js`
- `solutionPoints(leaves, usesPowSqrt) → number` = `leaves + (usesPowSqrt ? 2 : 0)`.
- `hasPowOrSqrt(ast) → boolean` (rèplica de `engine.py::has_pow_or_sqrt`).
- `countLeaves(ast) → number` (nombre d'operands).
- `usesAllDigits(ast, digits) → boolean` (conjunt de dígits-fulla === conjunt de `digits`; ajuda per a la detecció del tutti al Pla 2b).

## 5. Paritat amb Python (xarxa de seguretat)

- **Nou script `generator/fixtures.py`**: emet `js/tests/fixtures/canonical_fixtures.json`, una bateria de casos `{"ast", "canonical", "value", "valid"}`:
  - els exemples del contracte (`canonical-format.md`),
  - casos límit d'invalidesa (divisió inexacta, `√` no exacta, `0^0`, exponent gran, cap de valor),
  - una mostra d'ASTs reals extrets de `generate()` sobre uns dígits petits.
  - `value` = `evaluate(ast)` si `valid`, si no `null`; `valid` = si `evaluate` té èxit.
- **Test `js/tests/parity.test.js`**: carrega el fitxer i, per cada cas, comprova:
  - `canonical(ast) === cas.canonical`,
  - si `cas.valid`: `evaluate(ast) === cas.value`; si no: `evaluate(ast)` llança `InvalidExpr`.
- Divergència en un sol cas → test vermell. Aquesta és la garantia de paritat.

## 6. Estructura de fitxers

```
numerologic/
  package.json                       # {"type":"module","private":true}
  js/
    canonical.js
    evaluator.js
    parser.js
    validate.js
    score.js
    tests/
      canonical.test.js
      evaluator.test.js
      parser.test.js
      validate.test.js
      score.test.js
      parity.test.js
      fixtures/
        canonical_fixtures.json      # generat per generator/fixtures.py
  generator/
    fixtures.py                      # emet el fitxer de fixtures
```

## 7. Estratègia de proves

- Cada mòdul amb el seu fitxer de test (`node --test js/tests`).
- `parser.test.js`: precedència, associativitat de `^`, `√` unari, parèntesis, errors de sintaxi.
- `evaluator.test.js`: mateixos casos clau que `test_engine.py` (divisió/arrel exactes, cap, `0^0`, exponent gran).
- `canonical.test.js`: mateixos casos que `test_canonical.py` (aplanat, ordre commutatiu, no-commutatius).
- `validate.test.js`: dígits fora del rusc, central absent, expressió vàlida.
- `score.test.js`: punts, `hasPowOrSqrt`, `usesAllDigits`, `countLeaves`.
- `parity.test.js`: la bateria de fixtures contra Python.

## 8. Fora d'abast (Pla 2b)

`game.js`, `storage.js`, `ui.js` (rusc), `share.js`, `manifest.json` + `sw.js`, i la classificació d'un intent (solució comptada vs tutti vs fora de llista), que necessita l'estat de partida i `puzzles.json`.
