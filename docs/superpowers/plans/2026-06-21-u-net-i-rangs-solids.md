# «1 net» (anti ×1/÷1) + escala de rangs sòlida — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que els farciments trivials `×1`/`÷1` deixin de comptar com a solucions noves, i que el rang exigeixi trobar el tutti (denominador sòlid).

**Architecture:** Una funció pura `reduce1(ast)` (idèntica en Python i JS) absorbeix `×1`/`÷1` del dígit-fulla `1`. La forma canònica passa a ser `canonical(reduce1(ast))` (dedup automàtic) i la detecció de **tutti** i el **recompte d'operands** es fan sobre la forma reduïda. Al generador, `meaningful_tutti_exists` garanteix un tutti *real* i el denominador de rangs hi suma +10. Es regenera el banc.

**Tech Stack:** Python 3 (generador, `pytest`/`python -m pytest`), JavaScript ESM (client, `node --test`).

## Global Constraints

- Variant del banc desplegat: `+−×÷`, **sense** arrel/potència, **sense** repetició (`Variant(('add','sub','mul','div'), False, False)`).
- **Paritat byte a byte** Py↔JS de `canonical` (test `js/tests/parity.test.js` + fixtures `js/tests/fixtures/canonical_fixtures.json`, generades per `generator/fixtures.py`).
- `reduce1` només absorbeix el **dígit-fulla** `('num',1)` com a operand de `×`/`÷`; **no** toca un `1` calculat (`5−4`) ni `^1`/`√` (fora d'abast; la variant del banc no els usa).
- ASTs: Python = tuples `('op', a, b)` / `('num', n)`; JS = arrays `["op", a, b]` / `["num", n]`.
- El central **mai** és `1` (ja garantit a `generator/generate.py`).
- Catalan a comentaris de domini; English no requerit aquí (segueix l'estil del fitxer).
- Regenerar el banc: `python -m generator.generate --no-repeat --no-pow-sqrt` (defaults: `--count 60 --seed 0 --start-date 2026-06-01`).

---

### Task 1: `reduce1` + canònica reductora (Python)

**Files:**
- Modify: `generator/engine.py:66-89` (`_flatten`, `canonical`)
- Test: `generator/tests/test_canonical.py`

**Interfaces:**
- Produces: `reduce1(ast) -> ast` i `canonical(ast) -> str` (ara absorbeix ×1/÷1) a `generator/engine.py`.

- [ ] **Step 1: Escriu els tests que fallen**

A `generator/tests/test_canonical.py`, afegeix al final:

```python
def test_reduce1_absorbs_mul_one():
    from generator.engine import reduce1
    assert reduce1(('mul', ('num', 7), ('num', 1))) == ('num', 7)
    assert reduce1(('mul', ('num', 1), ('num', 7))) == ('num', 7)


def test_reduce1_absorbs_div_one():
    from generator.engine import reduce1
    assert reduce1(('div', ('num', 7), ('num', 1))) == ('num', 7)


def test_reduce1_keeps_computed_one():
    from generator.engine import reduce1
    # 5-4 = 1 calculat: no es toca
    e = ('mul', ('sub', ('num', 5), ('num', 4)), ('num', 3))
    assert reduce1(e) == e


def test_canonical_collapses_times_one():
    a = ('add', ('mul', ('num', 7), ('num', 1)), ('num', 2))  # 7*1+2
    b = ('add', ('num', 7), ('num', 2))                       # 7+2
    assert canonical(a) == canonical(b) == "(+ 2 7)"


def test_canonical_collapses_div_one():
    assert canonical(('div', ('num', 7), ('num', 1))) == "7"
```

- [ ] **Step 2: Executa i verifica que fallen**

Run: `python -m pytest generator/tests/test_canonical.py -q`
Expected: FAIL (`ImportError: cannot import name 'reduce1'` / assert errors).

- [ ] **Step 3: Implementa `reduce1` i refactoritza `canonical`**

A `generator/engine.py`, substitueix el bloc actual de `_flatten` + `canonical` (línies 66-89) per:

```python
def reduce1(ast):
    """Absorbeix ×1 i ÷1 del dígit-fulla 1 (identitats; preserva el valor).
    És la clau de dedup i de tutti: el 1 trivial no compta com a operand."""
    k = ast[0]
    if k == 'num':
        return ast
    if k == 'sqrt':
        return ('sqrt', reduce1(ast[1]))
    a = reduce1(ast[1])
    b = reduce1(ast[2])
    if k == 'mul':
        if a == ('num', 1):
            return b
        if b == ('num', 1):
            return a
    elif k == 'div':
        if b == ('num', 1):
            return a
    # ponytail: només ×1/÷1 del dígit-fulla; ^1 fora d'abast (el banc no usa pow)
    return (k, a, b)


def _flatten(ast, k):
    """Aplana fills del mateix operador commutatiu i retorna les seves cadenes canòniques."""
    parts = []
    for child in (ast[1], ast[2]):
        if child[0] == k:
            parts.extend(_flatten(child, k))
        else:
            parts.append(_canonical(child))
    return parts


def _canonical(ast):
    """Forma canònica d'un AST ja reduït (sense absorbir; ús intern)."""
    k = ast[0]
    if k == 'num':
        return str(ast[1])
    if k == 'sqrt':
        return "r(" + _canonical(ast[1]) + ")"
    if k == 'add':
        return "(+ " + " ".join(sorted(_flatten(ast, 'add'))) + ")"
    if k == 'mul':
        return "(* " + " ".join(sorted(_flatten(ast, 'mul'))) + ")"
    sym = {'sub': '-', 'div': '/', 'pow': '^'}[k]
    return "(" + sym + " " + _canonical(ast[1]) + " " + _canonical(ast[2]) + ")"


def canonical(ast):
    """Cadena canònica determinista (clau de deduplicació), amb ×1/÷1 absorbits."""
    return _canonical(reduce1(ast))
```

- [ ] **Step 4: Executa i verifica que passen (canònica + enumerador)**

Run: `python -m pytest generator/tests/test_canonical.py generator/tests/test_enumerate_solutions.py -q`
Expected: PASS. (L'enumerador i el brute-force usen tots dos la mateixa `canonical` reductora → els seus conjunts col·lapsen idènticament; els tests `test_matches_bruteforce_*` i `test_counted_and_brevi_today` segueixen quadrant.)

- [ ] **Step 5: Commit**

```bash
git add generator/engine.py generator/tests/test_canonical.py
git commit -m "feat(engine): reduce1 absorbeix ×1/÷1 a la forma canònica"
```

---

### Task 2: `reduce1` + canònica reductora (JS) i fixtures de paritat

**Files:**
- Modify: `js/canonical.js` (tot el fitxer)
- Modify: `generator/fixtures.py:9-30` (`HANDPICKED`)
- Regenerate: `js/tests/fixtures/canonical_fixtures.json`
- Test: `js/tests/parity.test.js` (sense canvis de codi; valida les fixtures noves)

**Interfaces:**
- Consumes: `reduce1`/`canonical` de Python (Task 1) per generar fixtures.
- Produces: `reduce1(ast)` i `canonical(ast)` exportats a `js/canonical.js`.

- [ ] **Step 1: Afegeix casos ×1/÷1 a les fixtures (test que fallarà)**

A `generator/fixtures.py`, dins la llista `HANDPICKED` (després de la línia `("mul", ("num", 4), ("num", 6)),`), afegeix:

```python
    # ×1 / ÷1 del dígit-fulla 1 -> absorbits
    ("mul", ("num", 7), ("num", 1)),                       # 7×1 -> "7"
    ("div", ("num", 7), ("num", 1)),                       # 7÷1 -> "7"
    ("add", ("mul", ("num", 7), ("num", 1)), ("num", 2)),  # 7×1+2 -> "(+ 2 7)"
```

Regenera les fixtures (usa la canònica reductora de Task 1):

Run: `python -m generator.fixtures`
Expected: `Escrits NN casos a js/tests/fixtures/canonical_fixtures.json` (NN ≥ 19).

- [ ] **Step 2: Executa la paritat JS i verifica que falla**

Run: `node --test js/tests/parity.test.js`
Expected: FAIL (`canonical divergeix per ["mul",["num",7],["num",1]]` — el JS encara no absorbeix).

- [ ] **Step 3: Implementa `reduce1` i refactoritza `canonical` (JS)**

Substitueix **tot** `js/canonical.js` per:

```javascript
// Forma canònica determinista d'un AST.
// Paritat byte a byte amb generator/engine.py::canonical (amb ×1/÷1 absorbits).

function isOne(ast) {
  return ast[0] === "num" && ast[1] === 1;
}

export function reduce1(ast) {
  // Absorbeix ×1 i ÷1 del dígit-fulla 1 (identitats; preserva el valor).
  const k = ast[0];
  if (k === "num") return ast;
  if (k === "sqrt") return ["sqrt", reduce1(ast[1])];
  if (k === "neg") return ["neg", reduce1(ast[1])];
  const a = reduce1(ast[1]);
  const b = reduce1(ast[2]);
  if (k === "mul") {
    if (isOne(a)) return b;
    if (isOne(b)) return a;
  } else if (k === "div") {
    if (isOne(b)) return a;
  }
  return [k, a, b];
}

function flatten(ast, op) {
  // Aplana fills del mateix operador commutatiu i retorna les seves cadenes canòniques.
  const parts = [];
  for (const child of [ast[1], ast[2]]) {
    if (child[0] === op) {
      parts.push(...flatten(child, op));
    } else {
      parts.push(canonicalRaw(child));
    }
  }
  return parts;
}

function canonicalRaw(ast) {
  const k = ast[0];
  if (k === "num") return String(ast[1]);
  if (k === "sqrt") return "r(" + canonicalRaw(ast[1]) + ")";
  if (k === "neg") return "(~ " + canonicalRaw(ast[1]) + ")"; // menys unari (només al client)
  if (k === "add") return "(+ " + flatten(ast, "add").sort().join(" ") + ")";
  if (k === "mul") return "(* " + flatten(ast, "mul").sort().join(" ") + ")";
  const sym = { sub: "-", div: "/", pow: "^" }[k];
  return "(" + sym + " " + canonicalRaw(ast[1]) + " " + canonicalRaw(ast[2]) + ")";
}

export function canonical(ast) {
  return canonicalRaw(reduce1(ast));
}
```

- [ ] **Step 4: Executa la paritat i la resta de canònica JS**

Run: `node --test js/tests/parity.test.js js/tests/canonical.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/canonical.js generator/fixtures.py js/tests/fixtures/canonical_fixtures.json
git commit -m "feat(canonical): reduce1 ×1/÷1 al client + fixtures de paritat"
```

---

### Task 3: Tutti i recompte d'operands sobre forma reduïda (client)

**Files:**
- Modify: `js/score.js:19-34` (`usesAllDigits`) + import
- Modify: `js/game.js` (import `reduce1`; `leaves` via `reduce1`)
- Test: `js/tests/game.test.js` (reescriu el fixture i els tests afectats)

**Interfaces:**
- Consumes: `reduce1` de `js/canonical.js` (Task 2).
- Produces: `usesAllDigits(ast, digits)` (sobre forma reduïda) a `js/score.js`; `createGame` puntua segons operands reduïts.

- [ ] **Step 1: Reescriu el fixture i els tests (fallaran)**

Substitueix **tot** `js/tests/game.test.js` per:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, TUTTI_BONUS, BREVI_BONUS, BREVI_POINTS } from "../game.js";

// Fixture realista: central = 7 (mai 1), no-repeat. 4*7 = 28.
function puzzle() {
  return {
    target: 28,
    digits: [1, 2, 3, 4, 5, 6, 7],
    centralIndex: 6, // central = 7
    solutions: ["(* 4 7)"],
    totalPoints: 12,
    ranks: [["Principiant", 0], ["Mig", 6], ["Llegenda", 12]],
    hasTutti: true,
    rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
  };
}

test("solució comptada nova -> found (operands reduïts)", () => {
  const g = createGame(puzzle());
  const r = g.submit("4*7");
  assert.equal(r.status, "found");
  assert.equal(r.points, 2); // 2 operands
  assert.equal(g.found.size, 1);
  assert.equal(g.score(), 2);
});

test("dedup commutatiu -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("4*7");
  assert.equal(g.submit("7*4").status, "duplicate");
  assert.equal(g.found.size, 1);
});

test("×1 trivial no crea solució nova -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("4*7");
  const r = g.submit("4*7*1"); // ×1 -> mateixa forma canònica
  assert.equal(r.status, "duplicate");
  assert.equal(g.found.size, 1);
});

test("÷1 trivial no crea solució nova -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("4*7");
  assert.equal(g.submit("(4*7)/1").status, "duplicate");
});

test("no arriba a l'objectiu -> wrong", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("7+7").status, "wrong");
});

test("sintaxi invàlida -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("4*").status, "invalid");
});

test("sense el dígit central -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("4*1*2").status, "invalid"); // no usa el 7 central
});

test("tutti real (1 sumat de debò) -> tutti amb bonus", () => {
  const g = createGame(puzzle());
  const r = g.submit("1+2+3+4+5+6+7"); // = 28, tots els dígits, l'1 sumat
  assert.equal(r.status, "tutti");
  assert.equal(r.points, TUTTI_BONUS);
  assert.equal(g.tuttiFound, true);
  assert.equal(g.tuttiBonus(), TUTTI_BONUS);
});

test("usar l'1 com a ×1 NO és tutti", () => {
  const g = createGame(puzzle());
  // (2*3+4+5+6+7)*1 = 28, usa els 7 dígits però l'1 és trivial -> no tutti
  const r = g.submit("(2*3+4+5+6+7)*1");
  assert.equal(r.status, "found");
  assert.equal(g.tuttiFound, false);
});

test("tutti repetit -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("1+2+3+4+5+6+7");
  assert.equal(g.submit("7+6+5+4+3+2+1").status, "duplicate");
});

test("rang segons la puntuació", () => {
  const g = createGame(puzzle());
  assert.equal(g.rank(), "Principiant");
  g.submit("1+2+3+4+5+6+7"); // tutti +10 >= 6
  assert.equal(g.rank(), "Mig");
});

test("progress() i restauració amb createGame", () => {
  const g = createGame(puzzle());
  g.submit("4*7");             // +2
  g.submit("1+2+3+4+5+6+7");   // tutti +10
  const g2 = createGame(puzzle(), g.progress());
  assert.equal(g2.found.size, 2);
  assert.equal(g2.score(), 2 + TUTTI_BONUS);
  assert.equal(g2.tuttiFound, true);
});

test("progrés corrupte no peta (omet entrades dolentes)", () => {
  const g = createGame(puzzle(), { found: [{ canonical: "x", text: "@@@" }], tuttiFound: false });
  assert.equal(g.found.size, 0);
});

test("la suma de punts del panell quadra amb score (tutti inclòs)", () => {
  const g = createGame(puzzle());
  g.submit("4*7");            // +2
  g.submit("1+2+3+4+5+6+7");  // tutti +10
  let sum = 0;
  for (const { points } of g.found.values()) sum += points;
  assert.equal(sum, g.score());
  assert.equal(g.found.size, 2);
});

// --- Brevi ---

function breviPuzzle() {
  return {
    target: 20,
    digits: [1, 3, 4, 5, 6, 7, 9],
    centralIndex: 4, // central = 6
    brevi: { operands: 3, count: 2 },
    ranks: [["Principiant", 0], ["Totes", 100]],
    rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
  };
}

test("una solució de 3 operands compta com a Brevi", () => {
  const g = createGame(breviPuzzle());
  assert.equal(g.breviFound(), 0);
  const r = g.submit("(6-1)*4"); // = 20, 3 operands, central 6
  assert.equal(r.status, "found");
  assert.equal(g.breviFound(), 1);
  assert.equal(g.breviComplete(), false);
});

test("cada solució Brevi val BREVI_POINTS", () => {
  const g = createGame(breviPuzzle());
  g.submit("(6-1)*4");
  const entry = [...g.found.values()][0];
  assert.equal(entry.points, BREVI_POINTS);
});

test("completar el Brevi -> breviComplete i bonus", () => {
  const g = createGame(breviPuzzle());
  g.submit("(6-1)*4");
  g.submit("5+6+9");
  assert.equal(g.breviFound(), 2);
  assert.equal(g.breviComplete(), true);
  assert.equal(g.breviBonus(), BREVI_BONUS);
  assert.equal(g.score(), BREVI_POINTS + BREVI_POINTS + BREVI_BONUS);
});

test("una solució més llarga no compta com a Brevi", () => {
  const g = createGame(breviPuzzle());
  const r = g.submit("6*4-(3+1)"); // = 20, 4 operands
  assert.equal(r.status, "found");
  assert.equal(g.breviFound(), 0);
});

test("BREVI_BONUS és un nombre positiu", () => {
  assert.equal(typeof BREVI_BONUS, "number");
  assert.ok(BREVI_BONUS > 0);
});
```

- [ ] **Step 2: Executa i verifica que falla**

Run: `node --test js/tests/game.test.js`
Expected: FAIL (p. ex. «×1 trivial» dona `found` en lloc de `duplicate`; «usar l'1 com a ×1 NO és tutti» dona `tutti`).

- [ ] **Step 3: `usesAllDigits` sobre forma reduïda**

A `js/score.js`, afegeix l'import al capdamunt:

```javascript
import { reduce1 } from "./canonical.js";
```

i substitueix `usesAllDigits` (línies 27-34) per:

```javascript
export function usesAllDigits(ast, digits) {
  const used = new Set();
  collectDigits(reduce1(ast), used);
  const needed = new Set(digits);
  if (used.size !== needed.size) return false;
  for (const d of needed) if (!used.has(d)) return false;
  return true;
}
```

- [ ] **Step 4: Recompte d'operands reduït a `game.js`**

A `js/game.js`, canvia l'import de `canonical` (línia 4) per incloure `reduce1`:

```javascript
import { canonical, reduce1 } from "./canonical.js";
```

A la branca de restauració (`savedProgress`), substitueix:

```javascript
      const leaves = isTutti ? digits.length : countLeaves(ast);
```

per:

```javascript
      const leaves = isTutti ? digits.length : countLeaves(reduce1(ast));
```

I a `submit`, a la branca de solució normal (no-tutti), substitueix:

```javascript
    const leaves = countLeaves(ast);
```

per:

```javascript
    const leaves = countLeaves(reduce1(ast));
```

- [ ] **Step 5: Executa i verifica que passa**

Run: `node --test js/tests/game.test.js js/tests/score.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/score.js js/game.js js/tests/game.test.js
git commit -m "feat(client): tutti i operands sobre forma reduïda (1 net)"
```

---

### Task 4: `meaningful_tutti_exists` + tutti reduït (generador)

**Files:**
- Modify: `generator/tutti.py` (afegeix `meaningful_tutti_exists` + helper)
- Modify: `generator/puzzles.py:7` (import), `:81-83` (`_uses_all_digits`), `:137` (`make_puzzle`)
- Test: `generator/tests/test_tutti.py`

**Interfaces:**
- Consumes: `reduce1` de `generator/engine.py` (Task 1).
- Produces: `meaningful_tutti_exists(digits, target, variant=FULL) -> bool` a `generator/tutti.py`.

- [ ] **Step 1: Escriu els tests que fallen**

A `generator/tests/test_tutti.py`, afegeix:

```python
def test_meaningful_tutti_excludes_trivial_one():
    from generator.tutti import meaningful_tutti_exists, tutti_exists
    from generator.engine import Variant
    V = Variant(('add', 'sub', 'mul', 'div'), False, False)
    # 14 amb {1,2,7}: només 2*7*1 (trivial). Cap tutti amb l'1 sumat/restat val 14.
    assert tutti_exists((1, 2, 7), 14, V) is True
    assert meaningful_tutti_exists((1, 2, 7), 14, V) is False
    # 10 = 1+2+7: tutti real.
    assert meaningful_tutti_exists((1, 2, 7), 10, V) is True


def test_meaningful_equals_tutti_when_no_one():
    from generator.tutti import meaningful_tutti_exists, tutti_exists
    from generator.engine import Variant
    V = Variant(('add', 'sub', 'mul', 'div'), False, False)
    for tgt in (12, 14, 20):
        assert meaningful_tutti_exists((2, 3, 7), tgt, V) == tutti_exists((2, 3, 7), tgt, V)
```

- [ ] **Step 2: Executa i verifica que falla**

Run: `python -m pytest generator/tests/test_tutti.py -q`
Expected: FAIL (`ImportError: cannot import name 'meaningful_tutti_exists'`).

- [ ] **Step 3: Implementa `meaningful_tutti_exists`**

A `generator/tutti.py`, afegeix al final:

```python
def _meaningful_reach(mask, digits, n, cache, variant, one_bit):
    """Com `_reach`, però veta combinar la fulla-1 (màscara `one_bit`) amb × o ÷."""
    cached = cache.get(mask)
    if cached is not None:
        return cached
    bits = [i for i in range(n) if mask & (1 << i)]
    if len(bits) == 1:
        s = {digits[bits[0]]}
    else:
        s = set()
        sub = mask
        while True:
            sub = (sub - 1) & mask
            if sub == 0:
                break
            comp = mask ^ sub
            left = _meaningful_reach(sub, digits, n, cache, variant, one_bit)
            right = _meaningful_reach(comp, digits, n, cache, variant, one_bit)
            for op in variant.ops:
                if op in ('mul', 'div') and (sub == one_bit or comp == one_bit):
                    continue  # la fulla-1 com a operand de ×/÷ és trivial
                for a in left:
                    for b in right:
                        try:
                            s.add(combine(op, a, b))
                        except InvalidExpr:
                            pass
    if variant.use_sqrt:
        frontier = list(s)
        while frontier:
            nxt = []
            for v in frontier:
                try:
                    sv = do_sqrt(v)
                except InvalidExpr:
                    continue
                if sv not in s:
                    s.add(sv)
                    nxt.append(sv)
            frontier = nxt
    cache[mask] = s
    return s


def meaningful_tutti_exists(digits, target, variant=FULL):
    """True si hi ha un tutti on el dígit-fulla 1 NO s'usa com a ×1/÷1 trivial.
    Si el rusc no té cap 1, és idèntic a `tutti_exists`."""
    n = len(digits)
    if n == 1:
        return digits[0] == target
    one_bit = None
    for i in range(n):
        if digits[i] == 1:
            one_bit = 1 << i
            break
    if one_bit is None:
        return tutti_exists(digits, target, variant)
    full = (1 << n) - 1
    cache = {}
    sub = full
    while True:
        sub = (sub - 1) & full
        if sub == 0:
            break
        comp = full ^ sub
        left = _meaningful_reach(sub, digits, n, cache, variant, one_bit)
        right = _meaningful_reach(comp, digits, n, cache, variant, one_bit)
        for op in variant.ops:
            if op in ('mul', 'div') and (sub == one_bit or comp == one_bit):
                continue
            for a in left:
                for b in right:
                    try:
                        v = combine(op, a, b)
                    except InvalidExpr:
                        continue
                    if v == target:
                        return True
                    if variant.use_sqrt:
                        sv = v
                        while True:
                            try:
                                sv = do_sqrt(sv)
                            except InvalidExpr:
                                break
                            if sv == target:
                                return True
    return False
```

- [ ] **Step 4: Tutti reduït + ús a `make_puzzle`**

A `generator/puzzles.py`, canvia l'import (línia 7):

```python
from generator.tutti import tutti_exists, meaningful_tutti_exists
```

i (línia 1, ja hi és `import math`) afegeix l'import de `reduce1` a la línia d'`engine` (línia 6):

```python
from generator.engine import has_pow_or_sqrt, FULL, reduce1
```

Substitueix `_uses_all_digits` (línies 81-83):

```python
def _uses_all_digits(ast, digits):
    """True si l'expressió, un cop reduïda (×1/÷1 absorbits), fa servir tots els dígits."""
    return set(_leaves_of(reduce1(ast))) == set(digits)
```

A `make_puzzle`, substitueix la comprovació de tutti (línia 137):

```python
        if not meaningful_tutti_exists(digits, v, variant=variant):
```

- [ ] **Step 5: Executa i verifica que passa**

Run: `python -m pytest generator/tests/test_tutti.py generator/tests/test_puzzles.py -q`
Expected: PASS. (`test_make_puzzle_in_band_with_tutti` segueix verdader: meaningful ⟹ `tutti_exists`.)

- [ ] **Step 6: Commit**

```bash
git add generator/tutti.py generator/puzzles.py generator/tests/test_tutti.py
git commit -m "feat(generator): meaningful_tutti_exists + tutti sobre forma reduïda"
```

---

### Task 5: Denominador +10 tutti + pistes des del conjunt reduït

**Files:**
- Modify: `generator/enumerate_solutions.py` (import `reduce1`; helper `_leaf_count`; recompte de `counted_and_brevi`)
- Modify: `generator/puzzles.py` (`game_total_points` amb `has_tutti`; crida a `make_puzzle`)
- Test: `generator/tests/test_puzzles.py`, `generator/tests/test_enumerate_solutions.py`

**Interfaces:**
- Consumes: `reduce1` (Task 1), `counted`/`byLeaves` reduïts.
- Produces: `game_total_points(counted, brevi_ops, digits, has_tutti=False) -> int`; `counted_and_brevi(...)` amb `byLeaves`/`brevi` calculats sobre forma reduïda.

- [ ] **Step 1: Escriu els tests que fallen**

A `generator/tests/test_puzzles.py`, afegeix:

```python
def test_game_total_points_adds_guaranteed_tutti():
    from generator.puzzles import game_total_points
    digits = [1, 2, 3, 4, 5, 6]  # rusc gran: cap solució de ≤4 operands és tutti
    counted = {
        "a": ("mul", ("num", 2), ("num", 3)),                       # 2 ops (brevi)
        "b": ("add", ("mul", ("num", 2), ("num", 3)), ("num", 4)),  # 3 ops
    }
    base = game_total_points(counted, brevi_ops=2, digits=digits, has_tutti=False)
    with_tutti = game_total_points(counted, brevi_ops=2, digits=digits, has_tutti=True)
    assert with_tutti == base + 10
```

A `generator/tests/test_enumerate_solutions.py`, afegeix:

```python
import re


def _has_trivial_one(c):
    if re.search(r"\(/ .* 1\)", c):
        return True
    for m in re.finditer(r"\(\* ([^()]*)\)", c):
        if "1" in m.group(1).split():
            return True
    return False


def test_counted_has_no_trivial_one():
    res = counted_and_brevi((1, 2, 3, 4, 5, 7, 9), 5, 25, BASIC)
    assert res is not None
    for c in res["counted"]:
        assert not _has_trivial_one(c), c
    assert sum(res["byLeaves"].values()) == len(res["counted"])
```

- [ ] **Step 2: Executa i verifica que falla**

Run: `python -m pytest generator/tests/test_puzzles.py::test_game_total_points_adds_guaranteed_tutti generator/tests/test_enumerate_solutions.py::test_counted_has_no_trivial_one -q`
Expected: FAIL (`game_total_points()` no accepta `has_tutti`; encara apareixen canòniques amb `1` trivial perquè `byLeaves` ve dels tiers crus).

- [ ] **Step 3: Recompte reduït a `counted_and_brevi`**

A `generator/enumerate_solutions.py`, afegeix a l'import d'`engine` (línia 23) `reduce1`:

```python
from generator.engine import combine, do_sqrt, canonical, reduce1, InvalidExpr, CAP, MAX_EXPONENT, FULL
```

Afegeix aquest helper a prop de `_ops_in` (després de la línia 181):

```python
def _leaf_count(ast):
    if ast[0] == 'num':
        return 1
    return sum(_leaf_count(c) for c in ast[1:] if isinstance(c, tuple))
```

A `counted_and_brevi`, substitueix el bloc d'acumulació i `return` (línies 195-217, des de `if brevi_ops is None:` fins al final) per:

```python
    if brevi_ops is None:
        return None
    max_ops = min(max(4, brevi_ops), len(digits), hard_cap)
    tiers = solutions_by_tier(digits, central, target, variant, max_operands=max_ops)
    # dedup entre tiers per canònica reductora: els farciments ×1/÷1 col·lapsen
    counted = {}
    for r, d in tiers.items():
        for c, ast in d.items():
            counted[c] = ast
    # pistes i Brevi des del conjunt DEDUPAT, comptant operands de la forma REDUÏDA
    by_leaves = {}
    by_op = {op: 0 for op in ('add', 'sub', 'mul', 'div', 'pow', 'sqrt')}
    for ast in counted.values():
        rast = reduce1(ast)
        lv = _leaf_count(rast)
        by_leaves[lv] = by_leaves.get(lv, 0) + 1
        ops = set()
        _ops_in(rast, ops)
        for op in ops:
            by_op[op] += 1
    brevi_ops = min(by_leaves)
    brevi_count = by_leaves[brevi_ops]
    return {
        'counted': counted,
        'brevi': {'operands': brevi_ops, 'count': brevi_count},
        'maxOperands': max_ops,
        'byLeaves': by_leaves,
        'byOp': by_op,
    }
```

(Nota: la variable del bucle de sondeig de les línies 189-194 segueix anomenant-se `brevi_ops`; aquí es reassigna al valor definitiu `min(by_leaves)`. El sondeig només fixa `max_ops`.)

- [ ] **Step 4: `game_total_points` amb `has_tutti`**

A `generator/puzzles.py`, substitueix `game_total_points` (línies 86-100) per:

```python
def game_total_points(counted, brevi_ops, digits, has_tutti=False):
    """Punts màxims del repte a l'escala REAL del joc (js/game.js::pointsFor): cada
    solució Brevi o tutti val 10; la resta, els seus operands (forma reduïda; +2 amb ^/√).
    Inclou el bonus de Brevi complet i, si `has_tutti`, el tutti garantit (+10) quan cap
    solució comptada ja n'és un. És el denominador dels rangs: 'Llegenda' exigeix el tutti."""
    total = BREVI_COMPLETE_BONUS
    counted_has_tutti = False
    for ast in counted.values():
        leaves = len(_leaves_of(reduce1(ast)))
        if _uses_all_digits(ast, digits):
            total += TUTTI_POINTS
            counted_has_tutti = True
        elif leaves == brevi_ops:
            total += BREVI_POINTS
        else:
            total += solution_points(leaves, has_pow_or_sqrt(ast))
    if has_tutti and not counted_has_tutti:
        total += TUTTI_POINTS
    return total
```

A `make_puzzle`, substitueix la crida (línia 144):

```python
        total = game_total_points(counted, res["brevi"]["operands"], digits, has_tutti=True)
```

- [ ] **Step 5: Executa i verifica que passa**

Run: `python -m pytest generator/tests/test_puzzles.py generator/tests/test_enumerate_solutions.py -q`
Expected: PASS. (`test_counted_and_brevi_today` segueix donant brevi 3/2 i `sum(byLeaves)==len(counted)`; `test_game_total_points_brevi_and_tutti_worth_ten` segueix donant 33.)

- [ ] **Step 6: Commit**

```bash
git add generator/enumerate_solutions.py generator/puzzles.py generator/tests/test_puzzles.py generator/tests/test_enumerate_solutions.py
git commit -m "feat(generator): +10 tutti al denominador + pistes sobre forma reduïda"
```

---

### Task 6: Regla nova a la UI

**Files:**
- Modify: `js/ui.js:193`

**Interfaces:** cap (només text).

- [ ] **Step 1: Afegeix la línia de regles**

A `js/ui.js`, just **abans** de la línia 193 (`<li>La mateixa solució no compta dues vegades...`), afegeix:

```javascript
      <li>Multiplicar o dividir per <b>1</b> no crea una solució nova.</li>
```

- [ ] **Step 2: Verifica que els tests del client segueixen verds**

Run: `node --test`
Expected: PASS (cap test cobreix el text de regles; és una comprovació de no-regressió).

- [ ] **Step 3: Commit**

```bash
git add js/ui.js
git commit -m "docs(ui): regla — ×1/÷1 no crea solució nova"
```

> **Nota (sostre del rang):** el disseny preveia clampar la puntuació a Llegenda. En revisar `js/game.js::rank`, el **nom** de rang ja topa a Llegenda (és l'últim llindar de `ranks`), de manera que clampar la puntuació **no canvia res observable** (no hi ha cap comptador de % a la UI). Per YAGNI **s'omet** el clamp; el que de debò fa el rang sòlid és el +10 del tutti al denominador (Task 5). Si més endavant es vol una **barra de % explícita**, llavors sí caldrà clampar a `totalPoints` en mostrar-la.

---

### Task 7: Regenerar el banc + pujar el service worker

**Files:**
- Regenerate: `data/puzzles.json`
- Modify: `sw.js:2`

**Interfaces:** cap.

- [ ] **Step 1: Regenera el banc amb el pipeline nou**

Run: `python -m generator.generate --no-repeat --no-pow-sqrt`
Expected: `Escrits 60 reptes a data/puzzles.json`.

- [ ] **Step 2: Executa TOTA la suite i reconcilia**

Run: `python -m pytest generator -q && node --test`
Expected: PASS.

Si algun test de **recompte** falla (p. ex. `test_solver.py`/`test_generate.py` amb comptes que incloïen farciment ×1, o `test_data_integrity.py`):
- Comprova que la causa és la dedup ×1 (els nous comptes són **menors** o iguals), no un error lògic.
- Actualitza l'assert al valor observat **només** si el canvi és coherent amb la dedup (cap solució trivial perduda; el central i el valor objectiu es conserven). Documenta el motiu al missatge de commit.
- `data/puzzles.json` ha de seguir complint `test_data_integrity.py`: `len(solutions) >= 4`, `sum(byLeaves) == len(solutions)`, `hasTutti is True`, `brevi.count >= 1`. Si algun repte queda amb `< 4` solucions després de la dedup, és que la banda del perfil el deixava just al límit: torna a generar amb el banc complet (el bucle de `build_pool` ja descarta reptes invàlids) i verifica de nou.

- [ ] **Step 3: Puja la versió del service worker**

A `sw.js`, línia 2, substitueix:

```javascript
const CACHE = "numerologic-v19";
```

per:

```javascript
const CACHE = "numerologic-v20";
```

- [ ] **Step 4: Verificació manual ràpida (opcional però recomanada)**

Obre `index.html` en local; tria un repte amb un `1` al rusc; comprova que `expr*1` surt com a duplicada i que un tutti amb l'1 multiplicador NO dona el ★.

- [ ] **Step 5: Commit**

```bash
git add data/puzzles.json sw.js
git commit -m "chore(data): regenera el banc (1 net + rangs amb tutti) + sw v20"
```

---

## Self-Review

**Spec coverage:**
- §2 `reduce1` → Tasks 1, 2. ✓
- §3.1 canònica reduïda → Tasks 1, 2. ✓
- §3.2 tutti sobre reduït → Tasks 3 (client), 4 (generador). ✓
- §3.3 `meaningful_tutti_exists` → Task 4. ✓
- §3.4 regla a la UI → Task 6. ✓
- §4.5 +10 tutti al denominador → Task 5. ✓
- §4.6 sostre del rang → Task 6 (documentat com a no-op i omès; justificat). ✓ (desviació conscient respecte a l'spec, explicada)
- §5 fitxers / §6 dades / §8 tests / §9 ordre → Tasks 1-7. ✓

**Placeholder scan:** sense TBD/TODO; tot el codi és complet. El pas de reconciliació (Task 7 Step 2) descriu el **mètode** exacte perquè els comptes post-dedup no es poden fixar sense executar; no és un placeholder de codi.

**Type consistency:** `reduce1`/`canonical` (Py i JS) coherents; `game_total_points(counted, brevi_ops, digits, has_tutti=False)` usat amb `has_tutti=True` a `make_puzzle`; `counted_and_brevi` retorna les mateixes claus (`counted`/`brevi`/`maxOperands`/`byLeaves`/`byOp`); `meaningful_tutti_exists(digits, target, variant=FULL)` signatura igual a `tutti_exists`.

**Desviació de l'spec:** el clamp del rang (§4.6) s'omet per ser un no-op observable; cal validar-ho amb l'usuari (ja assenyalat).
