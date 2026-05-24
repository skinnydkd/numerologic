# Nucli de lògica del client (Pla 2a) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el nucli de lògica pura del client JS (parser, avaluador, forma canònica, validació, puntuació) amb **paritat byte a byte amb Python**, verificada per una bateria de fixtures.

**Architecture:** JS vanilla amb ES modules, sense framework ni build. Cada mòdul és una funció pura sense DOM ni estat. L'AST es representa amb arrays (`["add", a, b]`) en paral·lel a les tuples de Python. La paritat es garanteix amb un fitxer de fixtures generat per Python (`generator/fixtures.py`) que els tests JS (`node:test`) comproven.

**Tech Stack:** JavaScript (ES modules), Node v24 (`node:test` + `node:assert`, sense dependències). Python 3.11+ per als fixtures.

**Spec de referència:** `docs/superpowers/specs/2026-05-24-client-core-design.md`. Contracte canònic: `docs/superpowers/specs/canonical-format.md`.

**Prerequisit:** El Pla 1 (PR #1) ha d'estar fusionat a `main`. Treballar en una branca nova `feat/client-core` sortida de `main` (el codi Python d'`engine.py`/`solver.py` ha de ser-hi present per generar els fixtures).

---

## File Structure

```
numerologic/
  package.json                         # {"type":"module","private":true}
  js/
    canonical.js                       # canonical(ast)
    evaluator.js                       # evaluate(ast), combine, doSqrt, InvalidExpr, CAP, MAX_EXPONENT
    parser.js                          # parse(str) -> ast, ParseError
    score.js                           # solutionPoints, hasPowOrSqrt, countLeaves, usesAllDigits
    validate.js                        # validate(ast, {digits, central})
    tests/
      smoke.test.js
      canonical.test.js
      evaluator.test.js
      parser.test.js
      score.test.js
      validate.test.js
      parity.test.js
      fixtures/
        canonical_fixtures.json        # generat per generator/fixtures.py
  generator/
    fixtures.py                        # emet el fitxer de fixtures
```

---

## Task 0: Bootstrap del client JS (ESM + node:test)

**Files:**
- Create: `package.json`
- Create: `js/tests/smoke.test.js`

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "numerologic",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 2: Escriure un test de fum**

`js/tests/smoke.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";

test("smoke", () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 3: Executar**

Run: `node --test js/tests/smoke.test.js`
Expected: PASS (1 test, 1 pass).

- [ ] **Step 4: Commit**

```bash
git add package.json js/tests/smoke.test.js
git commit -m "chore: bootstrap del client JS (ESM + node:test)"
```

---

## Task 1: `canonical.js` (paritat amb engine.py)

**Files:**
- Create: `js/canonical.js`
- Test: `js/tests/canonical.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/canonical.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical } from "../canonical.js";

test("num", () => {
  assert.equal(canonical(["num", 3]), "3");
});

test("ordre commutatiu i aplanat (mul)", () => {
  const a = ["mul", ["mul", ["num", 3], ["num", 4]], ["num", 2]];
  const b = ["mul", ["num", 2], ["mul", ["num", 4], ["num", 3]]];
  assert.equal(canonical(a), "(* 2 3 4)");
  assert.equal(canonical(b), "(* 2 3 4)");
});

test("aplanat add", () => {
  const a = ["add", ["add", ["num", 1], ["num", 2]], ["num", 3]];
  assert.equal(canonical(a), "(+ 1 2 3)");
});

test("no commutatius mantenen l'ordre", () => {
  assert.equal(canonical(["sub", ["num", 5], ["num", 3]]), "(- 5 3)");
  assert.equal(canonical(["div", ["num", 8], ["num", 4]]), "(/ 8 4)");
  assert.equal(canonical(["pow", ["num", 2], ["num", 3]]), "(^ 2 3)");
});

test("sqrt", () => {
  assert.equal(canonical(["sqrt", ["num", 9]]), "r(9)");
});

test("nombres diferents donen canòniques diferents", () => {
  assert.notEqual(
    canonical(["mul", ["num", 3], ["num", 8]]),
    canonical(["mul", ["num", 4], ["num", 6]])
  );
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/canonical.test.js`
Expected: FAIL (`Cannot find module '../canonical.js'`).

- [ ] **Step 3: Implementar `js/canonical.js`**

```javascript
// Forma canònica determinista d'un AST.
// Paritat byte a byte amb generator/engine.py::canonical.

function flatten(ast, op) {
  // Aplana fills del mateix operador commutatiu i retorna les seves cadenes canòniques.
  const parts = [];
  for (const child of [ast[1], ast[2]]) {
    if (child[0] === op) {
      parts.push(...flatten(child, op));
    } else {
      parts.push(canonical(child));
    }
  }
  return parts;
}

export function canonical(ast) {
  const k = ast[0];
  if (k === "num") return String(ast[1]);
  if (k === "sqrt") return "r(" + canonical(ast[1]) + ")";
  if (k === "add") return "(+ " + flatten(ast, "add").sort().join(" ") + ")";
  if (k === "mul") return "(* " + flatten(ast, "mul").sort().join(" ") + ")";
  const sym = { sub: "-", div: "/", pow: "^" }[k];
  return "(" + sym + " " + canonical(ast[1]) + " " + canonical(ast[2]) + ")";
}
```

> Nota de paritat: `Array.prototype.sort()` per defecte ordena per unitat de codi UTF-16; per a les cadenes ASCII que produïm coincideix amb `sorted()` de Python (punt de codi). No passar comparador.

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/canonical.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add js/canonical.js js/tests/canonical.test.js
git commit -m "feat: canonical.js (paritat amb engine.py)"
```

---

## Task 2: `evaluator.js` (avaluador amb regles)

**Files:**
- Create: `js/evaluator.js`
- Test: `js/tests/evaluator.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/evaluator.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, InvalidExpr, CAP } from "../evaluator.js";

test("num", () => assert.equal(evaluate(["num", 5]), 5));

test("operacions bàsiques", () => {
  assert.equal(evaluate(["add", ["num", 3], ["num", 4]]), 7);
  assert.equal(evaluate(["sub", ["num", 3], ["num", 4]]), -1);
  assert.equal(evaluate(["mul", ["num", 3], ["num", 4]]), 12);
});

test("divisió exacta", () => {
  assert.equal(evaluate(["div", ["num", 8], ["num", 4]]), 2);
  assert.throws(() => evaluate(["div", ["num", 7], ["num", 2]]), InvalidExpr);
  assert.throws(() => evaluate(["div", ["num", 4], ["num", 0]]), InvalidExpr);
});

test("regles de potència", () => {
  assert.equal(evaluate(["pow", ["num", 2], ["num", 3]]), 8);
  assert.throws(
    () => evaluate(["pow", ["num", 2], ["sub", ["num", 1], ["num", 3]]]),
    InvalidExpr
  );
  assert.throws(() => evaluate(["pow", ["num", 0], ["num", 0]]), InvalidExpr);
  assert.throws(() => evaluate(["pow", ["num", 2], ["num", 99]]), InvalidExpr);
});

test("regles d'arrel", () => {
  assert.equal(evaluate(["sqrt", ["num", 9]]), 3);
  assert.throws(() => evaluate(["sqrt", ["num", 8]]), InvalidExpr);
  assert.throws(() => evaluate(["sqrt", ["sub", ["num", 1], ["num", 5]]]), InvalidExpr);
  assert.throws(() => evaluate(["sqrt", ["num", 1]]), InvalidExpr);
});

test("cap de valor", () => {
  assert.throws(() => evaluate(["pow", ["num", 9], ["num", 7]]), InvalidExpr);
  assert.equal(CAP, 1_000_000);
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/evaluator.test.js`
Expected: FAIL (`Cannot find module '../evaluator.js'`).

- [ ] **Step 3: Implementar `js/evaluator.js`**

```javascript
// Avaluador d'expressions amb regles de validesa.
// Paritat amb generator/engine.py (combine, do_sqrt, evaluate).

export const CAP = 1_000_000;
export const MAX_EXPONENT = 19;

export class InvalidExpr extends Error {}

export function combine(op, a, b) {
  let v;
  if (op === "add") v = a + b;
  else if (op === "sub") v = a - b;
  else if (op === "mul") v = a * b;
  else if (op === "div") {
    if (b === 0 || a % b !== 0) throw new InvalidExpr();
    v = a / b;
  } else if (op === "pow") {
    if (b < 0 || b > MAX_EXPONENT || (a === 0 && b === 0)) throw new InvalidExpr();
    v = a ** b;
  } else {
    throw new Error("operador desconegut: " + op);
  }
  if (Math.abs(v) >= CAP) throw new InvalidExpr();
  return v;
}

export function doSqrt(v) {
  if (v < 0 || v === 0 || v === 1) throw new InvalidExpr();
  const r = Math.round(Math.sqrt(v));
  if (r * r !== v) throw new InvalidExpr();
  return r;
}

export function evaluate(ast) {
  const k = ast[0];
  if (k === "num") return ast[1];
  if (k === "sqrt") return doSqrt(evaluate(ast[1]));
  const a = evaluate(ast[1]);
  const b = evaluate(ast[2]);
  return combine(k, a, b);
}
```

> Nota de paritat: la divisió exacta (`a % b === 0`) i el quocient `a / b` donen el mateix enter que `a // b` de Python quan la divisió és exacta. Tots els valors vàlids són `< 10^6`, dins del rang d'enters segurs de JS, de manera que `a ** b` i `Math.sqrt` són exactes per als valors que es conserven.

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/evaluator.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add js/evaluator.js js/tests/evaluator.test.js
git commit -m "feat: evaluator.js (avaluador amb regles, paritat)"
```

---

## Task 3: `parser.js` (entrada → AST)

**Files:**
- Create: `js/parser.js`
- Test: `js/tests/parser.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/parser.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, ParseError } from "../parser.js";

test("dígit simple", () => assert.deepEqual(parse("3"), ["num", 3]));

test("precedència * abans +", () => {
  assert.deepEqual(parse("2+3*4"), ["add", ["num", 2], ["mul", ["num", 3], ["num", 4]]]);
});

test("parèntesis", () => {
  assert.deepEqual(parse("(2+3)*4"), ["mul", ["add", ["num", 2], ["num", 3]], ["num", 4]]);
});

test("^ associativa per la dreta", () => {
  assert.deepEqual(parse("2^3^2"), ["pow", ["num", 2], ["pow", ["num", 3], ["num", 2]]]);
});

test("√ unari lliga més fort que ^", () => {
  assert.deepEqual(parse("√9^2"), ["pow", ["sqrt", ["num", 9]], ["num", 2]]);
});

test("resta associativa per l'esquerra", () => {
  assert.deepEqual(parse("9-3-2"), ["sub", ["sub", ["num", 9], ["num", 3]], ["num", 2]]);
});

test("errors de sintaxi", () => {
  assert.throws(() => parse("2+"), ParseError);
  assert.throws(() => parse("(2+3"), ParseError);
  assert.throws(() => parse("2@3"), ParseError);
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/parser.test.js`
Expected: FAIL (`Cannot find module '../parser.js'`).

- [ ] **Step 3: Implementar `js/parser.js`**

```javascript
// Parseja una cadena d'entrada a AST.
// Precedència (alta -> baixa): √ (unari) > ^ (dreta) > * / (esquerra) > + - (esquerra).

export class ParseError extends Error {}

function tokenize(str) {
  const tokens = [];
  for (const ch of str) {
    if (ch === " " || ch === "\t") continue;
    if (ch >= "1" && ch <= "9") tokens.push({ type: "num", value: Number(ch) });
    else if ("+-*/^()".includes(ch)) tokens.push({ type: ch });
    else if (ch === "√") tokens.push({ type: "sqrt" });
    else throw new ParseError("caràcter no vàlid: " + ch);
  }
  return tokens;
}

export function parse(str) {
  const tokens = tokenize(str);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr() {
    let node = parseTerm();
    while (peek() && (peek().type === "+" || peek().type === "-")) {
      const op = next().type === "+" ? "add" : "sub";
      node = [op, node, parseTerm()];
    }
    return node;
  }
  function parseTerm() {
    let node = parseFactor();
    while (peek() && (peek().type === "*" || peek().type === "/")) {
      const op = next().type === "*" ? "mul" : "div";
      node = [op, node, parseFactor()];
    }
    return node;
  }
  function parseFactor() {
    const node = parseUnary();
    if (peek() && peek().type === "^") {
      next();
      return ["pow", node, parseFactor()]; // associativa per la dreta
    }
    return node;
  }
  function parseUnary() {
    if (peek() && peek().type === "sqrt") {
      next();
      return ["sqrt", parseUnary()];
    }
    return parseAtom();
  }
  function parseAtom() {
    const t = peek();
    if (!t) throw new ParseError("expressió incompleta");
    if (t.type === "num") {
      next();
      return ["num", t.value];
    }
    if (t.type === "(") {
      next();
      const node = parseExpr();
      if (!peek() || peek().type !== ")") throw new ParseError("falta ')'");
      next();
      return node;
    }
    throw new ParseError("token inesperat: " + t.type);
  }

  const ast = parseExpr();
  if (pos !== tokens.length) throw new ParseError("tokens sobrants");
  return ast;
}
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/parser.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add js/parser.js js/tests/parser.test.js
git commit -m "feat: parser.js (entrada -> AST)"
```

---

## Task 4: `score.js` (punts i ajudes de classificació)

**Files:**
- Create: `js/score.js`
- Test: `js/tests/score.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/score.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { solutionPoints, hasPowOrSqrt, countLeaves, usesAllDigits } from "../score.js";

test("solutionPoints", () => {
  assert.equal(solutionPoints(2, false), 2);
  assert.equal(solutionPoints(3, true), 5);
});

test("hasPowOrSqrt", () => {
  assert.equal(hasPowOrSqrt(["pow", ["num", 2], ["num", 3]]), true);
  assert.equal(hasPowOrSqrt(["sqrt", ["num", 9]]), true);
  assert.equal(hasPowOrSqrt(["add", ["num", 1], ["mul", ["num", 2], ["num", 3]]]), false);
});

test("countLeaves", () => {
  assert.equal(countLeaves(["num", 5]), 1);
  assert.equal(countLeaves(["add", ["num", 1], ["mul", ["num", 2], ["num", 3]]]), 3);
  assert.equal(countLeaves(["sqrt", ["add", ["num", 1], ["num", 2]]]), 2);
});

test("usesAllDigits", () => {
  assert.equal(usesAllDigits(["add", ["num", 1], ["num", 2]], [1, 2]), true);
  assert.equal(usesAllDigits(["add", ["num", 1], ["num", 2]], [1, 2, 3]), false);
  assert.equal(usesAllDigits(["mul", ["num", 2], ["num", 2]], [2]), true);
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/score.test.js`
Expected: FAIL (`Cannot find module '../score.js'`).

- [ ] **Step 3: Implementar `js/score.js`**

```javascript
// Puntuació d'una solució i ajudes de classificació.

export function solutionPoints(leaves, usesPowSqrt) {
  return leaves + (usesPowSqrt ? 2 : 0);
}

export function hasPowOrSqrt(ast) {
  const k = ast[0];
  if (k === "num") return false;
  if (k === "pow" || k === "sqrt") return true;
  return ast.slice(1).some((c) => hasPowOrSqrt(c));
}

export function countLeaves(ast) {
  if (ast[0] === "num") return 1;
  return ast.slice(1).reduce((sum, c) => sum + countLeaves(c), 0);
}

function collectDigits(ast, out) {
  if (ast[0] === "num") {
    out.add(ast[1]);
    return;
  }
  for (const c of ast.slice(1)) collectDigits(c, out);
}

export function usesAllDigits(ast, digits) {
  const used = new Set();
  collectDigits(ast, used);
  const needed = new Set(digits);
  if (used.size !== needed.size) return false;
  for (const d of needed) if (!used.has(d)) return false;
  return true;
}
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/score.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/score.js js/tests/score.test.js
git commit -m "feat: score.js (punts i ajudes de classificacio)"
```

---

## Task 5: `validate.js` (regles d'una expressió per rusc)

**Files:**
- Create: `js/validate.js`
- Test: `js/tests/validate.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/validate.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../validate.js";

const rusc = { digits: [2, 3, 5, 6, 7, 8, 9], central: 5 };

test("expressió vàlida", () => {
  const r = validate(["add", ["num", 5], ["num", 3]], rusc);
  assert.equal(r.ok, true);
  assert.equal(r.value, 8);
});

test("dígit fora del rusc", () => {
  const r = validate(["add", ["num", 5], ["num", 1]], rusc); // 1 no és al rusc
  assert.equal(r.ok, false);
});

test("no usa el dígit central", () => {
  const r = validate(["add", ["num", 2], ["num", 3]], rusc); // sense 5
  assert.equal(r.ok, false);
});

test("regla del motor (divisió inexacta)", () => {
  const r = validate(["div", ["num", 5], ["num", 2]], rusc);
  assert.equal(r.ok, false);
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/validate.test.js`
Expected: FAIL (`Cannot find module '../validate.js'`).

- [ ] **Step 3: Implementar `js/validate.js`**

```javascript
// Validació d'una expressió per a un rusc donat (no limita el nombre d'operands).
import { evaluate, InvalidExpr } from "./evaluator.js";

function collectLeafDigits(ast, out) {
  if (ast[0] === "num") {
    out.push(ast[1]);
    return;
  }
  for (const c of ast.slice(1)) collectLeafDigits(c, out);
}

export function validate(ast, { digits, central }) {
  const leaves = [];
  collectLeafDigits(ast, leaves);

  const allowed = new Set(digits);
  for (const d of leaves) {
    if (!allowed.has(d)) return { ok: false, reason: "dígit fora del rusc: " + d };
  }
  if (!leaves.includes(central)) {
    return { ok: false, reason: "no usa el dígit central" };
  }

  let value;
  try {
    value = evaluate(ast);
  } catch (e) {
    if (e instanceof InvalidExpr) return { ok: false, reason: "expressió no vàlida" };
    throw e;
  }
  return { ok: true, value };
}
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/validate.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/validate.js js/tests/validate.test.js
git commit -m "feat: validate.js (regles d'una expressio per rusc)"
```

---

## Task 6: Fixtures de paritat Python ↔ JS

**Files:**
- Create: `generator/fixtures.py`
- Create: `js/tests/fixtures/canonical_fixtures.json` (generat)
- Test: `js/tests/parity.test.js`

- [ ] **Step 1: Implementar el generador de fixtures `generator/fixtures.py`**

```python
"""Emet la bateria de fixtures de paritat per als tests JS (canonical + evaluate)."""
import json
import os

from generator.engine import canonical, evaluate, InvalidExpr
from generator.solver import generate

# Casos triats a mà: exemples del contracte + límits d'invalidesa.
HANDPICKED = [
    ("num", 3),
    ("sqrt", ("num", 9)),
    ("sub", ("num", 5), ("num", 3)),
    ("div", ("num", 8), ("num", 4)),
    ("pow", ("num", 2), ("num", 3)),
    ("mul", ("mul", ("num", 3), ("num", 4)), ("num", 2)),
    ("add", ("add", ("num", 1), ("num", 2)), ("num", 3)),
    ("mul", ("num", 3), ("num", 8)),
    ("mul", ("num", 4), ("num", 6)),
    # invàlids
    ("div", ("num", 7), ("num", 2)),                       # divisió inexacta
    ("div", ("num", 4), ("num", 0)),                       # divisió per zero
    ("sqrt", ("num", 8)),                                  # arrel no exacta
    ("sqrt", ("num", 1)),                                  # arrel de 1 (exclòs)
    ("pow", ("num", 0), ("num", 0)),                       # 0^0
    ("pow", ("num", 9), ("num", 7)),                       # >= CAP
    ("pow", ("num", 2), ("sub", ("num", 1), ("num", 3))),  # exponent negatiu
]


def _case(ast):
    try:
        value = evaluate(ast)
        valid = True
    except InvalidExpr:
        value = None
        valid = False
    return {"ast": ast, "canonical": canonical(ast), "value": value, "valid": valid}


def build_cases():
    cases = [_case(ast) for ast in HANDPICKED]
    # mostra d'ASTs reals d'un cercat petit (deterministes)
    for _c, m in list(generate([2, 3, 5], max_leaves=3).items())[:50]:
        cases.append(_case(m["ast"]))
    return cases


def main():
    out = os.path.join("js", "tests", "fixtures", "canonical_fixtures.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    cases = build_cases()
    with open(out, "w", encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)
    print(f"Escrits {len(cases)} casos a {out}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Generar el fitxer de fixtures**

Run: `python -m generator.fixtures`
Expected: imprimeix `Escrits N casos a js\tests\fixtures\canonical_fixtures.json` (N ≥ 16) i crea el fitxer.

- [ ] **Step 3: Escriure el test de paritat**

`js/tests/parity.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { canonical } from "../canonical.js";
import { evaluate, InvalidExpr } from "../evaluator.js";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  readFileSync(join(here, "fixtures", "canonical_fixtures.json"), "utf-8")
);

test("paritat canònica amb Python", () => {
  assert.ok(cases.length >= 16);
  for (const c of cases) {
    assert.equal(canonical(c.ast), c.canonical, "canonical divergeix per " + JSON.stringify(c.ast));
  }
});

test("paritat de l'avaluador amb Python", () => {
  for (const c of cases) {
    if (c.valid) {
      assert.equal(evaluate(c.ast), c.value, "value divergeix per " + JSON.stringify(c.ast));
    } else {
      assert.throws(() => evaluate(c.ast), InvalidExpr, "hauria de ser invàlid: " + JSON.stringify(c.ast));
    }
  }
});
```

- [ ] **Step 4: Executar per verificar que passa**

Run: `node --test js/tests/parity.test.js`
Expected: PASS (2 tests). Si falla, hi ha una divergència real JS↔Python a corregir a `canonical.js` o `evaluator.js`.

- [ ] **Step 5: Commit**

```bash
git add generator/fixtures.py js/tests/fixtures/canonical_fixtures.json js/tests/parity.test.js
git commit -m "test: fixtures de paritat Python<->JS"
```

---

## Task 7: Suite completa i tancament

- [ ] **Step 1: Executar tota la suite JS**

Run: `node --test js/tests`
Expected: tots els tests passen (smoke, canonical, evaluator, parser, score, validate, parity).

- [ ] **Step 2: Executar la suite Python (no regressió)**

Run: `python -m pytest -q`
Expected: tots els tests Python segueixen passant (inclou ara `generator/fixtures.py` importable; no afegeix tests Python però no ha de trencar res).

- [ ] **Step 3: Completar la branca**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."
**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch — verificar tests, presentar opcions i, en triar PR, obrir-lo cap a `main` al repo `skinnydkd/numerologic`.

---

## Self-Review

- **Cobertura de la spec (`2026-05-24-client-core-design.md`):**
  - §2 stack (ESM, `package.json`, `node:test`) → Task 0. ✓
  - §4 `canonical.js` → Task 1. ✓
  - §4 `evaluator.js` (CAP, MAX_EXPONENT, regles) → Task 2. ✓
  - §4 `parser.js` (precedència, `^` dreta, `√` unari, errors) → Task 3. ✓
  - §4 `score.js` (solutionPoints, hasPowOrSqrt, countLeaves, usesAllDigits) → Task 4. ✓
  - §4 `validate.js` (dígits del rusc, central, regles motor, sense límit d'operands) → Task 5. ✓
  - §5 paritat (`fixtures.py` + `parity.test.js`) → Task 6. ✓
  - §7 estratègia de proves (un test per mòdul) → Tasks 1-6. ✓
  - §3 AST com a arrays → usat consistentment a totes les tasques. ✓
- **Placeholders:** cap; tot pas amb codi té el codi complet.
- **Consistència de tipus/noms:** `canonical(ast)`, `evaluate(ast)`/`InvalidExpr`/`CAP`, `parse(str)`/`ParseError`, `solutionPoints/hasPowOrSqrt/countLeaves/usesAllDigits`, `validate(ast,{digits,central})` — usats igual entre implementació i tests. L'AST és sempre `["op", ...]`. El fitxer de fixtures consumit per `parity.test.js` té la forma `{ast, canonical, value, valid}` que emet `fixtures.py`. ✓
```
