# Tutti real i tancament del Pla 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el **tutti autèntic** (una expressió que usa els 7 dígits = objectiu) com a cim del joc, substituint la "Solució d'Or" (que les dades van demostrar no rara), i tancar el Pla 1 amb el pool real i un PR cap a `main`.

**Architecture:** Nou mòdul `generator/tutti.py` amb `tutti_exists(digits, target)` — una DP de **valors assolibles** sobre subconjunts de bits (guarda enters, no expressions → sense `MemoryError`) amb early-exit. `generator/puzzles.py` deixa d'exposar la "Solució d'Or": `make_puzzle` exigeix que l'objectiu triat tinga tutti i marca `hasTutti: true`. El client (Pla 2) detectarà el tutti en viu (la solució vàlida usa els 7 dígits) i no cal precalcular cap llista de tuttis.

**Tech Stack:** Python 3.11+, pytest, biblioteca estàndard.

**Spec de referència:** `docs/superpowers/specs/2026-05-24-tutti-real-design.md` (substitueix `2026-05-24-solucio-or-design.md`).

**Estat de partida (branca `feat/engine-generator`):**
- Committejat: `engine.py`, `solver.py`, `generate.py`, `puzzles.py` (amb la "Solució d'Or"), els seus tests, i el pla/spec "d'Or".
- Untracked: `data/puzzles.json` (pool antic amb `goldenSolutions` inflat — es regenerarà), `docs/superpowers/specs/canonical-format.md` (escrit, pendent de committejar).

---

## File Structure

```
numerologic/
  generator/
    tutti.py              # CREAR: tutti_exists (reachability + early-exit)
    puzzles.py            # MODIFICAR: treure Solucio d'Or; exigir tutti; hasTutti
    tests/
      test_tutti.py       # CREAR: tests deterministes de tutti_exists
      test_puzzles.py     # MODIFICAR: treure tests d'or; afegir hasTutti
  data/
    puzzles.json          # REGENERAR (Tasca 3)
  docs/superpowers/specs/
    canonical-format.md   # COMMITTEJAR: ja escrit (Tasca 4)
```

---

## Task 1: `generator/tutti.py` — existència del tutti

DP de valors assolibles sobre subconjunts dels dígits (cada dígit una vegada), amb early-exit. No emmagatzema expressions → sense explosió de memòria.

**Files:**
- Create: `generator/tutti.py`
- Test: `generator/tests/test_tutti.py`

- [ ] **Step 1: Escriure els tests que fallen**

`generator/tests/test_tutti.py`:

```python
from generator.tutti import tutti_exists


def test_pair_reachable_sum():
    assert tutti_exists([2, 3], 5) is True   # 2 + 3


def test_pair_reachable_pow():
    assert tutti_exists([2, 3], 9) is True   # 3 ** 2


def test_pair_unreachable():
    # amb 2 i 3 (cadascun una vegada) no es pot fer 7
    assert tutti_exists([2, 3], 7) is False


def test_requires_using_all_digits():
    # per fer 2 nomes caldria el 2, pero el tutti exigeix usar TOTS els digits
    assert tutti_exists([2, 3], 2) is False


def test_seven_digits_sum():
    assert tutti_exists([1, 2, 3, 4, 5, 6, 7], 28) is True  # 1+2+3+4+5+6+7
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `python -m pytest generator/tests/test_tutti.py -q`
Expected: FAIL (`ModuleNotFoundError: No module named 'generator.tutti'`).

- [ ] **Step 3: Implementar `generator/tutti.py`**

```python
"""Existència del tutti: hi ha una expressió que usa tots els dígits (cadascun una
vegada) i val l'objectiu? Cerca per valors assolibles (no per expressions)."""
from generator.engine import combine, do_sqrt, InvalidExpr

OPS = ("add", "sub", "mul", "div", "pow")


def _reach(mask, digits, n, cache):
    """Conjunt de valors assolibles usant exactament les fulles de `mask` (cada dígit una vegada)."""
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
            left = _reach(sub, digits, n, cache)
            right = _reach(comp, digits, n, cache)
            for a in left:
                for b in right:
                    for op in OPS:
                        try:
                            s.add(combine(op, a, b))
                        except InvalidExpr:
                            pass
    # augmentació amb arrel (no afegeix fulles)
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


def tutti_exists(digits, target):
    """True si alguna expressió que usa els `len(digits)` dígits (cadascun una vegada) val `target`.

    DP de valors assolibles sobre subconjunts de bits: només guarda enters, no
    expressions, de manera que evita l'explosió de memòria del cercador exhaustiu.
    Early-exit: retorna en trobar l'objectiu sense materialitzar el conjunt complet.
    """
    n = len(digits)
    full = (1 << n) - 1
    cache = {}
    sub = full
    while True:
        sub = (sub - 1) & full
        if sub == 0:
            break
        comp = full ^ sub
        left = _reach(sub, digits, n, cache)
        right = _reach(comp, digits, n, cache)
        for a in left:
            for b in right:
                for op in OPS:
                    try:
                        v = combine(op, a, b)
                    except InvalidExpr:
                        continue
                    if v == target:
                        return True
                    # arrel(s) damunt del resultat (no afegeix fulles)
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

- [ ] **Step 4: Executar per verificar que passen**

Run: `python -m pytest generator/tests/test_tutti.py -q`
Expected: PASS (5 passed). Ràpid (< 1 s; els tests usen conjunts petits).

- [ ] **Step 5: Commit**

```bash
git add generator/tutti.py generator/tests/test_tutti.py
git commit -m "feat: tutti_exists per reachability (existencia del tutti sense OOM)"
```

---

## Task 2: `puzzles.py` — exigir tutti i treure la Solució d'Or

**Files:**
- Modify: `generator/puzzles.py`
- Modify: `generator/tests/test_puzzles.py`

- [ ] **Step 1: Reescriure els tests**

Substituir **tot** el contingut de `generator/tests/test_puzzles.py` per:

```python
import math
from generator.puzzles import solution_points, build_ranks, make_puzzle, RANK_PCTS


def test_solution_points_basic():
    assert solution_points(leaves=2, uses_pow_sqrt=False) == 2


def test_solution_points_pow_sqrt_bonus():
    assert solution_points(leaves=3, uses_pow_sqrt=True) == 5


def test_build_ranks_thresholds():
    ranks = build_ranks(total=100)
    names = [r[0] for r in ranks]
    assert names[0] == "Principiant" and names[-1] == "Totes"
    assert ranks[0][1] == 0
    assert ranks[-1][1] == 100
    be = dict(ranks)["Bé"]
    assert be == math.ceil(0.10 * 100)


def test_make_puzzle_in_band_with_tutti():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4)
    assert pz is not None
    assert 5 <= len(pz["solutions"]) <= 9999
    assert pz["digits"] == [1, 2, 3, 4, 5, 6, 7]
    assert pz["centralIndex"] == 2
    assert pz["totalPoints"] > 0
    assert pz["hasTutti"] is True
    assert "goldenSolutions" not in pz
    assert isinstance(pz["solutions"][0], str)


def test_make_puzzle_returns_none_when_no_target_in_band():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=0, band=(10**9, 10**9), max_leaves=3)
    assert pz is None
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `python -m pytest generator/tests/test_puzzles.py -q`
Expected: FAIL (l'antic `make_puzzle` retorna `goldenSolutions` i no `hasTutti`; a més `solution_points` encara té 3 paràmetres).

- [ ] **Step 3: Reescriure `generator/puzzles.py`**

Substituir **tot** el contingut de `generator/puzzles.py` per:

```python
"""Construcció d'un repte: selecció d'objectiu (amb tutti garantit), punts i rangs."""
import math
from collections import defaultdict

from generator.solver import generate
from generator.engine import has_pow_or_sqrt
from generator.tutti import tutti_exists

# (nom, percentatge sobre el total de punts)
RANK_PCTS = [
    ("Principiant", 0),
    ("Bé", 10),
    ("Molt bé", 25),
    ("Expert", 45),
    ("Mestre", 65),
    ("Geni", 85),
    ("Totes", 100),
]


def solution_points(leaves, uses_pow_sqrt):
    """Punts d'una solució: operands + bonus si usa potència o arrel."""
    return leaves + (2 if uses_pow_sqrt else 0)


def build_ranks(total):
    """Llindars de rang en punts a partir del total."""
    return [(name, math.ceil(pct / 100 * total)) for name, pct in RANK_PCTS]


def make_puzzle(digits, central_index, band=(40, 120), max_leaves=4, max_tutti_tries=5):
    """Construeix un repte amb tutti garantit per a aquests dígits/central, o None.

    Tria l'objectiu més ric dins la banda que tinga tutti, comprovant fins a
    `max_tutti_tries` candidats per ordre de riquesa. Retorna None si la banda és
    buida o si cap dels candidats provats té tutti.
    """
    digits = list(digits)
    central = digits[central_index]
    all_sols = generate(digits, max_leaves=max_leaves)

    # agrupa per valor, només solucions que facin servir el central
    by_value = defaultdict(list)
    for c, m in all_sols.items():
        if central in m["used"]:
            by_value[m["value"]].append((c, m))

    lo, hi = band
    candidates = [(v, items) for v, items in by_value.items() if lo <= len(items) <= hi]
    if not candidates:
        return None

    # ordena per riquesa (més solucions primer; desempat pel valor més baix)
    candidates.sort(key=lambda t: (len(t[1]), -t[0]), reverse=True)

    chosen = None
    for v, items in candidates[:max_tutti_tries]:
        if tutti_exists(digits, v):
            chosen = (v, items)
            break
    if chosen is None:
        return None
    target, items = chosen

    total = sum(
        solution_points(m["leaves"], has_pow_or_sqrt(m["ast"]))
        for _, m in items
    )
    solutions = sorted(c for c, _ in items)

    return {
        "target": target,
        "digits": digits,
        "centralIndex": central_index,
        "maxOperands": max_leaves,
        "solutions": solutions,
        "totalPoints": total,
        "ranks": build_ranks(total),
        "hasTutti": True,
    }
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `python -m pytest generator/tests/test_puzzles.py -q`
Expected: PASS (4 passed). Pot trigar ~20-40 s (genera + comprova tutti).

- [ ] **Step 5: Commit**

```bash
git add generator/puzzles.py generator/tests/test_puzzles.py
git commit -m "feat: reptes amb tutti garantit (hasTutti); treu la Solucio d'Or"
```

---

## Task 3: Regenerar el pool real `data/puzzles.json`

**Files:**
- Create/replace: `data/puzzles.json`

- [ ] **Step 1: Regenerar el pool**

Run: `python -m generator.generate --count 60 --seed 1`
Expected: imprimeix `Escrits N reptes a data\puzzles.json`. Ara és més lent (+~6 s/repte per la comprovació de tutti); usa un timeout molt generós o executa en segon pla.

- [ ] **Step 2: Verificar contingut i estadístiques**

Run:
```bash
python -c "import json; d=json.load(open('data/puzzles.json',encoding='utf-8')); ps=d['puzzles']; s=[len(p['solutions']) for p in ps]; print('reptes:',len(ps)); print('solucions min/avg/max:',min(s),sum(s)//len(s),max(s)); print('tots hasTutti:',all(p.get('hasTutti') is True for p in ps)); print('cap goldenSolutions:',all('goldenSolutions' not in p for p in ps)); print('startDate:',d['startDate'])"
```
Expected: `reptes: 60` (o proper), solucions dins de [40, 120], `tots hasTutti: True`, `cap goldenSolutions: True`.

> **Nota de contingència:** si el nombre de reptes és clarament < 60, ampliar la banda: `python -m generator.generate --count 60 --seed 1 --band 25 200` i repetir la verificació. Aturar i informar l'usuari de la banda final.

- [ ] **Step 3: Commit**

```bash
git add data/puzzles.json
git commit -m "feat: pool inicial de reptes amb tutti garantit (data/puzzles.json)"
```

---

## Task 4: Committejar el contracte de la forma canònica

`docs/superpowers/specs/canonical-format.md` ja existeix (untracked) i no canvia amb aquesta feina.

**Files:**
- Commit: `docs/superpowers/specs/canonical-format.md`

- [ ] **Step 1: Verificar el contingut**

Run: `python -c "print(open('docs/superpowers/specs/canonical-format.md',encoding='utf-8').read())"`
Expected: descriu els nodes `num/sqrt/sub/div/pow/add/mul`, l'ordenació per punt de codi Unicode i la taula d'exemples (`(* 2 3 4)`, `(+ 1 2 3)`, `(- 5 3)`, `(/ 8 4)`, `(^ 2 3)`, `r(9)`). Si falta res respecte a `generator/engine.py::canonical`, corregir abans de committejar.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/canonical-format.md
git commit -m "docs: contracte de la forma canonica per al client"
```

---

## Task 5: Tancar la branca i obrir el PR

- [ ] **Step 1: Executar tota la suite**

Run: `python -m pytest -q`
Expected: tots els tests passen (engine, canonical, solver, tutti, puzzles, generate_cli, smoke). Pot trigar uns minuts.

- [ ] **Step 2: Completar la branca**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."
**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch — verificar tests, presentar opcions i, en triar PR, obrir-lo cap a `main` al repo `skinnydkd/numerologic`.

---

## Self-Review

- **Cobertura de la spec (`2026-05-24-tutti-real-design.md`):**
  - §3 solucions comptades 2–4 operands + `solution_points(leaves, uses_pow_sqrt)` → Task 2. ✓
  - §3 tutti = usa tots els dígits; existència garantida → Task 1 (`tutti_exists`) + Task 2 (`make_puzzle` exigeix tutti). ✓
  - §4 tutti com a assoliment (detecció en viu al client) → documentat per al Pla 2; el motor només garanteix existència i marca `hasTutti`. ✓
  - §5 motor: nou `tutti.py`, `make_puzzle` exigeix tutti, treu Solució d'Or → Tasks 1, 2. ✓
  - §6 model de dades: treu `goldenSolutions`, afegeix `hasTutti` → Task 2 + verificació Task 3. ✓
  - §8 cost: comprovació de tutti amb `max_tutti_tries` → Task 2. ✓
  - Tancament Pla 1 (pool + doc + PR) → Tasks 3, 4, 5. ✓
- **Placeholders:** cap; tot pas amb codi té el codi complet.
- **Consistència de tipus/noms:** `tutti_exists(digits, target)` definit a Task 1 i usat a Task 2. `solution_points(leaves, uses_pow_sqrt)` (2 params) coherent entre test i implementació. `make_puzzle` retorna `hasTutti` (consumit per la verificació de Task 3 i, al Pla 2, pel client) i ja **no** retorna `goldenSolutions`. ✓
```
