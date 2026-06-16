# Brevi — Motor i generació (Pla 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar l'enumerador de solucions a `generator/`, extreure'n el **Brevi** i el conjunt comptat sense el límit fix de k≤4, i regenerar `data/puzzles.json` amb dígits variables (grisos) i un espectre de dificultat.

**Architecture:** L'enumerador (de `research/tutti_enum.py`) enumera totes les solucions canòniques ancorant la cerca a l'objectiu via la DP de valors assolibles (`generator/tutti.py::_reach`). El generador (`make_puzzle`) l'usa per calcular el conjunt comptat fins a `maxOperands = max(4, brevi.operands)` i el tier mínim (Brevi). `build_pool` dosifica dificultat triant nombre de dígits, magnitud d'objectiu i banda. Tot offline; els reptes difícils tenen poques solucions → ràpid.

**Tech Stack:** Python 3.12, pytest. Sense dependències noves.

**Abast:** regles no-repeat `+−×÷` (sense arrel/potència, fora d'abast). Aquest pla NO toca el client (`js/`) — això és el Pla 2.

**Spec:** `docs/superpowers/specs/2026-06-16-brevi-dificultat-design.md`

---

## Estructura de fitxers

- **Crea** `generator/enumerate_solutions.py` — enumeració de solucions ancorada a l'objectiu (port + generalització de `research/tutti_enum.py`). Responsabilitat única: donat un rusc, retornar solucions per tier d'operands, el Brevi i el conjunt comptat.
- **Crea** `generator/tests/test_enumerate_solutions.py` — tests del mòdul nou.
- **Modifica** `generator/puzzles.py` — `make_puzzle` afegeix `brevi`, `difficulty`, `maxOperands` per repte i calcula el conjunt comptat amb l'enumerador.
- **Modifica** `generator/tests/test_puzzles.py` — tests dels camps nous.
- **Modifica** `generator/generate.py` — `build_pool` dosifica dificultat (dígits, magnitud, banda).
- **Modifica** `generator/tests/test_generate.py` (crea si no existeix) — test de l'espectre.
- **Regenera** `data/puzzles.json` (executant la CLI).

---

## Task 1: Portar el nucli de l'enumerador a `generator/`

**Files:**
- Create: `generator/enumerate_solutions.py`
- Test: `generator/tests/test_enumerate_solutions.py`

- [ ] **Step 1: Copiar el nucli i adaptar imports**

Copia `research/tutti_enum.py` → `generator/enumerate_solutions.py`. Manté les funcions `tutti_solutions_ast`, `tutti_solutions`, `_operands` i els helpers interns `enum`/`enum_binary` tal com estan (ja importen de `generator.engine` i `generator.tutti`). Renombra la funció pública `tutti_solutions_ast` → `solutions_full_ast` (és «solucions que usen EXACTAMENT tots els dígits donats»), i `tutti_solutions` → `solutions_full` (versió ordenada de cadenes). Actualitza el docstring del mòdul per dir que viu a `generator/` i que el seu abast validat és `+−×÷` sense arrel.

- [ ] **Step 2: Escriure el test d'auto-consistència i d'acord amb brute-force**

```python
# generator/tests/test_enumerate_solutions.py
from generator.engine import Variant, evaluate
from generator.solver import _build
from generator.enumerate_solutions import solutions_full_ast

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def _leaves(ast):
    if ast[0] == 'num':
        return [ast[1]]
    out = []
    for c in ast[1:]:
        if isinstance(c, tuple):
            out += _leaves(c)
    return out


def _brute_by_value(digits, variant):
    full = _build(variant)(tuple(sorted(digits)))
    by = {}
    for c, (v, _a) in full.items():
        by.setdefault(v, set()).add(c)
    return by


def test_matches_bruteforce_all_values_n4():
    digits = (1, 3, 4, 6)
    by_val = _brute_by_value(digits, BASIC)
    for v, expected in by_val.items():
        got = set(solutions_full_ast(digits, v, BASIC))
        assert got == expected, f"val={v}: {len(expected ^ got)} diferents"


def test_matches_bruteforce_all_values_n5():
    digits = (2, 3, 4, 6, 9)
    by_val = _brute_by_value(digits, BASIC)
    for v, expected in by_val.items():
        got = set(solutions_full_ast(digits, v, BASIC))
        assert got == expected


def test_selfconsistent_uses_all_digits_and_value():
    digits = (1, 3, 4, 5, 6, 7, 9)
    want = sorted(digits)
    sols = solutions_full_ast(digits, 20, BASIC)
    assert len(sols) > 0
    for c, ast in sols.items():
        assert evaluate(ast) == 20
        assert sorted(_leaves(ast)) == want
```

- [ ] **Step 3: Executar els tests (han de passar; el nucli ja està validat)**

Run: `python -m pytest generator/tests/test_enumerate_solutions.py -v`
Expected: 3 passed. (Si `solutions_full_ast` no existeix → ajusta els renoms del Step 1.)

- [ ] **Step 4: Commit**

```bash
git add generator/enumerate_solutions.py generator/tests/test_enumerate_solutions.py
git commit -m "feat(generator): porta l'enumerador de solucions ancorat a l'objectiu"
```

---

## Task 2: Conjunt comptat (solucions amb central, per tier)

**Files:**
- Modify: `generator/enumerate_solutions.py`
- Test: `generator/tests/test_enumerate_solutions.py`

- [ ] **Step 1: Escriure el test (regressió contra `generate` a k≤4)**

```python
# afegir a generator/tests/test_enumerate_solutions.py
from collections import defaultdict
from generator.solver import generate
from generator.enumerate_solutions import solutions_by_tier


def _counted_via_generate(digits, central, target, max_leaves):
    sols = generate(digits, max_leaves=max_leaves, variant=BASIC)
    out = set()
    for c, m in sols.items():
        if central in m['used'] and m['value'] == target:
            out.add(c)
    return out


def test_solutions_by_tier_matches_generate_k4():
    digits = (1, 3, 4, 5, 6, 7, 9)
    central, target = 6, 20
    tiers = solutions_by_tier(digits, central, target, BASIC, max_operands=4)
    union = set()
    for r, d in tiers.items():
        assert r <= 4
        union |= set(d)
    assert union == _counted_via_generate(digits, central, target, 4)


def test_solutions_by_tier_only_subsets_with_central():
    # cada solució retornada usa el central i val l'objectiu
    digits = (1, 3, 4, 5, 6, 7, 9)
    central, target = 6, 20
    tiers = solutions_by_tier(digits, central, target, BASIC, max_operands=4)
    from generator.engine import evaluate
    for r, d in tiers.items():
        for ast in d.values():
            leaves = _leaves(ast)
            assert central in leaves
            assert len(leaves) == r
            assert evaluate(ast) == target
```

- [ ] **Step 2: Executar el test (ha de fallar: `solutions_by_tier` no existeix)**

Run: `python -m pytest generator/tests/test_enumerate_solutions.py::test_solutions_by_tier_matches_generate_k4 -v`
Expected: FAIL — `ImportError: cannot import name 'solutions_by_tier'`.

- [ ] **Step 3: Implementar `solutions_by_tier`**

```python
# afegir a generator/enumerate_solutions.py
from itertools import combinations


def solutions_by_tier(digits, central, target, variant, max_operands):
    """{r: {canonical: ast}} de solucions = target que inclouen el central,
    usant exactament r dígits diferents (cada dígit <=1 cop), per r=2..max_operands.
    Suma sobre subconjunts de mida r que contenen el central."""
    digits = list(digits)
    others = [d for d in digits if d != central]
    tiers = {}
    for r in range(2, max_operands + 1):
        if r - 1 > len(others):
            break
        tier = {}
        for combo in combinations(others, r - 1):
            subset = list(combo) + [central]
            for c, ast in solutions_full_ast(subset, target, variant).items():
                tier[c] = ast
        if tier:
            tiers[r] = tier
    return tiers
```

- [ ] **Step 4: Executar els tests (han de passar)**

Run: `python -m pytest generator/tests/test_enumerate_solutions.py -v`
Expected: tots passen (5 tests).

- [ ] **Step 5: Commit**

```bash
git add generator/enumerate_solutions.py generator/tests/test_enumerate_solutions.py
git commit -m "feat(generator): conjunt comptat per tier d'operands (amb central)"
```

---

## Task 3: Brevi i conjunt comptat amb `maxOperands` dinàmic

**Files:**
- Modify: `generator/enumerate_solutions.py`
- Test: `generator/tests/test_enumerate_solutions.py`

- [ ] **Step 1: Escriure el test**

```python
# afegir a generator/tests/test_enumerate_solutions.py
from generator.enumerate_solutions import counted_and_brevi


def test_counted_and_brevi_today():
    # rusc d'avui: tier mínim = 3 operands amb 2 solucions; maxOperands=max(4,3)=4
    res = counted_and_brevi((1, 3, 4, 5, 6, 7, 9), 6, 20, BASIC)
    assert res is not None
    assert res['brevi']['operands'] == 3
    assert res['brevi']['count'] == 2
    assert res['maxOperands'] == 4
    # conjunt comptat == k<=4 amb central
    assert len(res['counted']) == len(_counted_via_generate((1, 3, 4, 5, 6, 7, 9), 6, 20, 4))
    # byLeaves suma al total comptat
    assert sum(res['byLeaves'].values()) == len(res['counted'])


def test_counted_and_brevi_none_when_unreachable():
    # objectiu impossible amb aquests dígits incloent el central
    res = counted_and_brevi((1, 3, 4, 5, 6, 7, 9), 6, 999999, BASIC)
    assert res is None
```

- [ ] **Step 2: Executar el test (ha de fallar)**

Run: `python -m pytest generator/tests/test_enumerate_solutions.py::test_counted_and_brevi_today -v`
Expected: FAIL — `cannot import name 'counted_and_brevi'`.

- [ ] **Step 3: Implementar `counted_and_brevi`**

```python
# afegir a generator/enumerate_solutions.py
from generator.engine import canonical  # ja importat a dalt; assegura't que hi és


def _ops_in(ast, acc):
    k = ast[0]
    if k == 'num':
        return
    acc.add(k)
    for c in ast[1:]:
        if isinstance(c, tuple):
            _ops_in(c, acc)


def counted_and_brevi(digits, central, target, variant, hard_cap=7):
    """Retorna dict amb 'counted' ({canonical: ast}), 'brevi' ({operands, count}),
    'maxOperands' i 'byLeaves'/'byOp', o None si no hi ha cap solució (incloent central).

    Enumera tiers ascendents; el primer tier no buit és el Brevi. El conjunt comptat
    acumula tiers fins a maxOperands = max(4, brevi.operands), acotat a hard_cap."""
    # primer, troba el tier mínim no buit (Brevi) sense calcular tiers buits cars
    brevi_ops = None
    for r in range(2, min(len(digits), hard_cap) + 1):
        tiers_r = solutions_by_tier(digits, central, target, variant, max_operands=r)
        if tiers_r:
            brevi_ops = min(tiers_r)
            break
    if brevi_ops is None:
        return None
    max_ops = min(max(4, brevi_ops), len(digits), hard_cap)
    tiers = solutions_by_tier(digits, central, target, variant, max_operands=max_ops)
    counted = {}
    by_leaves = {}
    by_op = {op: 0 for op in ('add', 'sub', 'mul', 'div', 'pow', 'sqrt')}
    for r, d in tiers.items():
        by_leaves[r] = len(d)
        for c, ast in d.items():
            counted[c] = ast
            ops = set()
            _ops_in(ast, ops)
            for op in ops:
                by_op[op] += 1
    brevi_count = by_leaves.get(brevi_ops, 0)
    return {
        'counted': counted,
        'brevi': {'operands': brevi_ops, 'count': brevi_count},
        'maxOperands': max_ops,
        'byLeaves': by_leaves,
        'byOp': by_op,
    }
```

Nota: aquesta implementació recalcula tiers en buscar el Brevi; com que els tiers buits són barats (la reachability els poda), és acceptable. Si cal optimitzar després, es pot memoitzar.

- [ ] **Step 4: Executar els tests (han de passar)**

Run: `python -m pytest generator/tests/test_enumerate_solutions.py -v`
Expected: tots passen (7 tests).

- [ ] **Step 5: Commit**

```bash
git add generator/enumerate_solutions.py generator/tests/test_enumerate_solutions.py
git commit -m "feat(generator): Brevi (tier mínim) i conjunt comptat amb maxOperands dinàmic"
```

---

## Task 4: `make_puzzle` emet `brevi`, `difficulty` i `maxOperands`

**Files:**
- Modify: `generator/puzzles.py`
- Test: `generator/tests/test_puzzles.py`

- [ ] **Step 1: Escriure el test dels camps nous**

```python
# afegir a generator/tests/test_puzzles.py
from generator.engine import Variant

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def test_make_puzzle_includes_brevi_and_difficulty():
    pz = make_puzzle([1, 3, 4, 5, 6, 7, 9], central_index=4,
                     band=(5, 9999), max_leaves=4, variant=BASIC,
                     target_range=(20, 20), difficulty="facil")
    assert pz is not None
    assert pz["target"] == 20
    assert pz["brevi"]["operands"] == 3
    assert pz["brevi"]["count"] == 2
    assert pz["difficulty"] == "facil"
    assert pz["maxOperands"] == 4
    # el conjunt comptat coincideix amb el nombre de solucions llistades
    assert sum(pz["hints"]["byLeaves"].values()) == len(pz["solutions"])
    assert pz["brevi"]["count"] <= len(pz["solutions"])
```

- [ ] **Step 2: Executar el test (ha de fallar)**

Run: `python -m pytest generator/tests/test_puzzles.py::test_make_puzzle_includes_brevi_and_difficulty -v`
Expected: FAIL — `make_puzzle() got an unexpected keyword argument 'difficulty'` (o KeyError `brevi`).

- [ ] **Step 3: Modificar `make_puzzle`**

A `generator/puzzles.py`, canvia la signatura i la sortida perquè (a) accepti `difficulty`, (b) calculi el conjunt comptat i el Brevi amb l'enumerador en lloc de només `generate`. Substitueix el cos que tria objectiu i munta el dict:

```python
# a dalt del fitxer
from generator.enumerate_solutions import counted_and_brevi

# nova signatura
def make_puzzle(digits, central_index, band=(40, 120), max_leaves=4, max_tutti_tries=5,
                target_range=(-9999, 9999), variant=FULL, difficulty="mitja"):
    digits = list(digits)
    central = digits[central_index]
    all_sols = generate(digits, max_leaves=max_leaves, variant=variant)

    by_value = defaultdict(list)
    for c, m in all_sols.items():
        if central in m["used"]:
            by_value[m["value"]].append((c, m))

    lo, hi = band
    tlo, thi = target_range
    candidates = [
        (v, items) for v, items in by_value.items()
        if lo <= len(items) <= hi and tlo <= v <= thi
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda t: (len(t[1]), -t[0]), reverse=True)

    for v, _items in candidates[:max_tutti_tries]:
        if not tutti_exists(digits, v, variant=variant):
            continue
        res = counted_and_brevi(digits, central, v, variant)
        if res is None:
            continue
        target = v
        counted = res["counted"]
        solutions = sorted(counted.keys())
        total = sum(
            solution_points(len(_leaves_of(ast)), has_pow_or_sqrt(ast))
            for ast in counted.values()
        )
        return {
            "target": target,
            "digits": digits,
            "centralIndex": central_index,
            "maxOperands": res["maxOperands"],
            "difficulty": difficulty,
            "solutions": solutions,
            "totalPoints": total,
            "ranks": build_ranks(total),
            "hasTutti": True,
            "brevi": res["brevi"],
            "hints": {
                "byLeaves": {str(k): res["byLeaves"][k] for k in sorted(res["byLeaves"])},
                "byOp": res["byOp"],
            },
            "rules": {
                "allowRepeat": variant.allow_repeat,
                "ops": list(variant.ops) + (["sqrt"] if variant.use_sqrt else []),
            },
        }
    return None
```

I afegeix l'ajudant per comptar fulles d'un AST (a `generator/puzzles.py`):

```python
def _leaves_of(ast):
    if ast[0] == "num":
        return [ast[1]]
    out = []
    for c in ast[1:]:
        if isinstance(c, tuple):
            out += _leaves_of(c)
    return out
```

- [ ] **Step 4: Executar TOTS els tests de puzzles (regressió + nou)**

Run: `python -m pytest generator/tests/test_puzzles.py -v`
Expected: tots passen. Nota: els tests antics passen `variant=FULL` per defecte (amb arrel) → `counted_and_brevi` està validat per `+−×÷`; si algun test antic usa FULL i falla per arrel, canvia'l perquè passi `variant=BASIC` (les regles reals del banc). Revisa `test_make_puzzle_in_band_with_tutti`, `test_make_puzzle_respects_target_range`, `test_make_puzzle_includes_hints`: afegeix-los `variant=BASIC`.

- [ ] **Step 5: Commit**

```bash
git add generator/puzzles.py generator/tests/test_puzzles.py
git commit -m "feat(generator): make_puzzle emet brevi, difficulty i maxOperands via enumerador"
```

---

## Task 5: `build_pool` dosifica l'espectre de dificultat (7 dígits; grisos diferits al Pla 2)

> **Decisió de seguretat:** el generador **suporta** dígits variables (5–7), però el banc que es publica manté **7 dígits**: el client actual (`ui.renderHive`) trencaria amb <7 cel·les. Els **grisos** s'activen al **Pla 2 (client)** juntament amb el seu render. Així aquest pla és **merge-segur a producció**. La dificultat es dosifica amb **magnitud d'objectiu + banda**.

**Files:**
- Modify: `generator/generate.py`
- Test: `generator/tests/test_generate.py` (crea)

- [ ] **Step 1: Escriure el test de l'espectre**

```python
# generator/tests/test_generate.py
from generator.generate import build_pool
from generator.engine import Variant

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def test_pool_has_difficulty_spectrum():
    pool = build_pool(count=12, seed=1, variant=BASIC)
    pz = pool["puzzles"]
    assert len(pz) == 12
    # hi ha barreja de dificultats (almenys 2 nivells)
    diffs = {p["difficulty"] for p in pz}
    assert len(diffs) >= 2
    # tots: 7 dígits (grisos diferits), brevi vàlid i tutti
    for p in pz:
        assert p["hasTutti"] is True
        assert p["brevi"]["count"] >= 1
        assert len(p["digits"]) == 7
        assert p["centralIndex"] < len(p["digits"])
    # els difícils tenen objectius més grans que els fàcils (de mitjana)
    import statistics
    facils = [p["target"] for p in pz if p["difficulty"] == "facil"]
    dificils = [p["target"] for p in pz if p["difficulty"] == "dificil"]
    if facils and dificils:
        assert statistics.mean(dificils) > statistics.mean(facils)
```

- [ ] **Step 2: Executar el test (ha de fallar)**

Run: `python -m pytest generator/tests/test_generate.py -v`
Expected: FAIL — `build_pool` encara no assigna `difficulty`.

- [ ] **Step 3: Modificar `build_pool`**

Substitueix `build_pool` a `generator/generate.py` per una versió que assigna un perfil de dificultat per repte (ciclant facil/mitja/dificil). **Tots amb 7 dígits** (grisos diferits):

```python
# perfils: (difficulty, target_range, band)  — tots amb 7 dígits (grisos al Pla 2)
PROFILES = [
    ("facil",   (10, 99),   (40, 120)),
    ("mitja",   (60, 299),  (8, 40)),
    ("dificil", (150, 999), (1, 12)),
]


def build_pool(count, max_leaves=4, seed=0, start_date="2026-06-01", variant=FULL):
    """Construeix `count` reptes dosificant l'espectre de dificultat (ciclant perfils)."""
    rng = random.Random(seed)
    digit_sets = list(combinations(DIGITS, 7))
    rng.shuffle(digit_sets)
    puzzles = []
    seen = set()
    di = 0
    attempts = 0
    while len(puzzles) < count and attempts < count * 200:
        attempts += 1
        difficulty, tr, band = PROFILES[len(puzzles) % len(PROFILES)]
        ds = list(digit_sets[di % len(digit_sets)])
        di += 1
        centrals = [i for i in range(7) if ds[i] != 1]
        rng.shuffle(centrals)
        made = False
        for ci in centrals:
            pz = make_puzzle(ds, ci, band=band, max_leaves=max_leaves,
                             target_range=tr, variant=variant, difficulty=difficulty)
            if pz is None:
                continue
            key = (pz["target"], tuple(pz["digits"]), pz["centralIndex"])
            if key in seen:
                continue
            seen.add(key)
            puzzles.append(pz)
            made = True
            break
        # (si cap central funciona, el perfil del següent intent es recalcula igual)
    return {"startDate": start_date, "puzzles": puzzles}
```

Actualitza `main()`: elimina/ignora `--band` (ara ve del perfil); manté `--count`, `--seed`, `--start-date`, `--out`, `--no-repeat`, `--no-pow-sqrt`. La crida `build_pool(...)` ja no passa `band`.

- [ ] **Step 4: Executar el test (ha de passar)**

Run: `python -m pytest generator/tests/test_generate.py -v`
Expected: PASS. Si `dificil` falla sovint per banda massa estreta, amplia-la a `(1, 20)`.

- [ ] **Step 5: Executar TOTA la suite**

Run: `python -m pytest generator/ -q`
Expected: tot verd.

- [ ] **Step 6: Commit**

```bash
git add generator/generate.py generator/tests/test_generate.py
git commit -m "feat(generator): espectre de dificultat per magnitud i banda (7 dígits)"
```

---

## Task 6: Regenerar `data/puzzles.json` i validar-lo

**Files:**
- Modify: `data/puzzles.json` (generat)
- Create: `generator/tests/test_data_integrity.py`

- [ ] **Step 1: Escriure el test d'integritat del banc**

```python
# generator/tests/test_data_integrity.py
import json
import os


def test_puzzles_json_schema():
    path = os.path.join("data", "puzzles.json")
    data = json.load(open(path, encoding="utf-8"))
    assert "startDate" in data and isinstance(data["puzzles"], list)
    assert len(data["puzzles"]) >= 1
    for p in data["puzzles"]:
        assert 5 <= len(p["digits"]) <= 7
        assert 0 <= p["centralIndex"] < len(p["digits"])
        assert p["hasTutti"] is True
        assert p["brevi"]["operands"] >= 2 and p["brevi"]["count"] >= 1
        assert p["difficulty"] in ("facil", "mitja", "dificil")
        assert p["maxOperands"] >= 4
        assert len(p["solutions"]) >= 1
        assert sum(int(v) for v in p["hints"]["byLeaves"].values()) == len(p["solutions"])
        # el Brevi no és més gran que el conjunt comptat
        assert p["brevi"]["count"] <= len(p["solutions"])
```

- [ ] **Step 2: Executar el test (ha de fallar amb el JSON antic)**

Run: `python -m pytest generator/tests/test_data_integrity.py -v`
Expected: FAIL — el `puzzles.json` actual no té `brevi`/`difficulty`.

- [ ] **Step 3: Regenerar el banc**

Run: `python -m generator.generate --count 60 --seed 0 --no-repeat --no-pow-sqrt --start-date 2026-06-01`
Expected: `Escrits 60 reptes a data/puzzles.json` (si en surten menys, augmenta el marge d'intents o amplia bandes dels perfils i torna a executar).

- [ ] **Step 4: Executar el test d'integritat (ha de passar)**

Run: `python -m pytest generator/tests/test_data_integrity.py -v`
Expected: PASS.

- [ ] **Step 5: Inspecció manual ràpida**

Run: `python -c "import json;d=json.load(open('data/puzzles.json',encoding='utf-8'));import collections;print(collections.Counter(p['difficulty'] for p in d['puzzles']));print([(p['target'],len(p['digits']),p['brevi']) for p in d['puzzles'][:6]])"`
Expected: una barreja de dificultats i exemples amb Brevi raonable (count petit als difícils). Revisa que els `dificil` tinguin objectius grans i pocs Brevi.

- [ ] **Step 6: Commit**

```bash
git add data/puzzles.json generator/tests/test_data_integrity.py
git commit -m "feat(data): regenera el banc amb brevi, dificultat i dígits variables"
```

---

## Self-review notes

- **Cobertura de l'spec (motor):** enumerador (§7) → Tasks 1-3; Brevi+counted+maxOperands (§3,§4,§8) → Tasks 3-4; difficulty + grisos a generació (§5,§6) → Task 5; dades (§8) → Task 6. El **client** (§4 UI, §5 render, §9) és el Pla 2.
- **Fora d'abast confirmat:** arrel/potència (variant BASIC a tot arreu); ratxa i UI (Pla 2).
- **Risc:** que `dificil` no ompli prou reptes → mitigació al Task 5/6 (ampliar banda). El nombre exacte de dies per dificultat és calibratge, no lògica.
- **Compat:** `maxOperands` ara és per repte (abans fix 4); el client ja el llegeix. Camps nous (`brevi`, `difficulty`) són additius.
