# Solució d'Or i tancament del Pla 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir el bonus *Numerogram* (inassolible) per la **Solució d'Or**, fixar `max_leaves=4` per resoldre el `MemoryError` del generador, generar el pool real `data/puzzles.json` i tancar el Pla 1 (motor + generador) amb un PR cap a `main`.

**Architecture:** Esmena la Tasca 4 del Pla 1 (`generator/puzzles.py`): la puntuació passa a marcar com a "d'or" les solucions amb el màxim de punts base del repte i els dona +5 punts; el repte exposa `goldenSolutions` per al client. Es fixa `max_leaves=4` a la CLI (`generator/generate.py`) perquè el cercador exhaustiu no esgote la memòria. Després es genera el pool i es committegen els fitxers de les Tasques 5 i 6 del Pla 1 (`generate.py`, `test_generate_cli.py`, `data/puzzles.json`, `docs/superpowers/specs/canonical-format.md`), ja escrits però sense committejar.

**Tech Stack:** Python 3.11+, pytest, biblioteca estàndard (`math`, `itertools`, `functools`, `json`, `random`, `argparse`).

**Spec de referència:** `docs/superpowers/specs/2026-05-24-solucio-or-design.md`.

**Estat de partida (branca `feat/engine-generator`):**
- Committejat: `engine.py`, `solver.py`, `puzzles.py` (amb Numerogram), els seus tests, i la spec de la Solució d'Or.
- Untracked (escrits, pendents de committejar): `generator/generate.py`, `generator/tests/test_generate_cli.py`, `docs/superpowers/specs/canonical-format.md`.

---

## File Structure

```
numerologic/
  generator/
    puzzles.py            # MODIFICAR: solution_points(+5 or), make_puzzle (or + goldenSolutions)
    generate.py           # MODIFICAR: max_leaves per defecte 6 -> 4 (untracked, committejar a Tasca 2)
    tests/
      test_puzzles.py     # MODIFICAR: tests del bonus d'or + goldenSolutions
      test_generate_cli.py# MODIFICAR: max_leaves 5 -> 4 (untracked, committejar a Tasca 2)
  data/
    puzzles.json          # CREAR: pool real (Tasca 3)
  docs/superpowers/specs/
    canonical-format.md   # COMMITTEJAR: ja escrit (Tasca 4)
```

---

## Task 1: Solució d'Or a `puzzles.py`

Substitueix el bonus Numerogram per la Solució d'Or: les solucions amb el màxim de punts base reben +5 punts i s'exposen a `goldenSolutions`. També baixa el `max_leaves` per defecte de `make_puzzle` de 6 a 4.

**Files:**
- Modify: `generator/puzzles.py`
- Modify: `generator/tests/test_puzzles.py`

- [ ] **Step 1: Reescriure els tests**

Substituir **tot** el contingut de `generator/tests/test_puzzles.py` per:

```python
import math
from generator.puzzles import (
    solution_points,
    build_ranks,
    make_puzzle,
    RANK_PCTS,
    GOLDEN_BONUS,
)


def test_solution_points_basic():
    # 2 fulles, sense pow/sqrt, no d'or -> 2 punts
    assert solution_points(leaves=2, uses_pow_sqrt=False, is_golden=False) == 2


def test_solution_points_pow_sqrt_bonus():
    assert solution_points(leaves=3, uses_pow_sqrt=True, is_golden=False) == 5


def test_solution_points_golden_bonus():
    # 4 fulles, sense pow/sqrt, d'or -> 4 + GOLDEN_BONUS
    assert solution_points(leaves=4, uses_pow_sqrt=False, is_golden=True) == 4 + GOLDEN_BONUS
    # 4 fulles, amb pow/sqrt, d'or -> 4 + 2 + GOLDEN_BONUS
    assert solution_points(leaves=4, uses_pow_sqrt=True, is_golden=True) == 4 + 2 + GOLDEN_BONUS


def test_golden_bonus_value():
    assert GOLDEN_BONUS == 5


def test_build_ranks_thresholds():
    ranks = build_ranks(total=100)
    names = [r[0] for r in ranks]
    assert names[0] == "Principiant" and names[-1] == "Totes"
    assert ranks[0][1] == 0
    assert ranks[-1][1] == 100
    # llindar 'Bé' al 10%
    be = dict(ranks)["Bé"]
    assert be == math.ceil(0.10 * 100)


def test_make_puzzle_in_band():
    # conjunt petit i banda relaxada per garantir trobar objectiu
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4)
    assert pz is not None
    assert 5 <= len(pz["solutions"]) <= 9999
    assert pz["digits"] == [1, 2, 3, 4, 5, 6, 7]
    assert pz["centralIndex"] == 2
    assert pz["totalPoints"] > 0
    assert isinstance(pz["solutions"][0], str)


def test_make_puzzle_has_golden_solutions():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4)
    assert pz is not None
    golden = pz["goldenSolutions"]
    # n'hi ha almenys una i totes son solucions del repte
    assert len(golden) >= 1
    assert set(golden).issubset(set(pz["solutions"]))
    # estan ordenades
    assert golden == sorted(golden)


def test_make_puzzle_golden_bonus_in_total():
    # el total inclou +GOLDEN_BONUS per cada solucio d'or
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4)
    assert pz is not None
    n_golden = len(pz["goldenSolutions"])
    # treure el bonus d'or ha de deixar un total estrictament menor
    assert pz["totalPoints"] - GOLDEN_BONUS * n_golden < pz["totalPoints"]


def test_make_puzzle_returns_none_when_no_target_in_band():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=0, band=(10**9, 10**9), max_leaves=3)
    assert pz is None
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `python -m pytest generator/tests/test_puzzles.py -q`
Expected: FAIL (`ImportError: cannot import name 'GOLDEN_BONUS'`).

- [ ] **Step 3: Reescriure `generator/puzzles.py`**

Substituir **tot** el contingut de `generator/puzzles.py` per:

```python
"""Construcció d'un repte: selecció d'objectiu, punts, Solució d'Or i rangs."""
import math
from collections import defaultdict

from generator.solver import generate
from generator.engine import has_pow_or_sqrt

GOLDEN_BONUS = 5  # punts extra per a cada Solució d'Or

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


def solution_points(leaves, uses_pow_sqrt, is_golden):
    """Punts d'una solució: operands + bonus pow/sqrt + bonus Solució d'Or."""
    return leaves + (2 if uses_pow_sqrt else 0) + (GOLDEN_BONUS if is_golden else 0)


def build_ranks(total):
    """Llindars de rang en punts a partir del total."""
    return [(name, math.ceil(pct / 100 * total)) for name, pct in RANK_PCTS]


def make_puzzle(digits, central_index, band=(40, 120), max_leaves=4):
    """Construeix un repte per a aquests dígits/central si algun objectiu cau dins la banda.

    La Solució d'Or és la solució (o solucions) amb el màxim de punts base del repte;
    cadascuna rep GOLDEN_BONUS punts extra i s'exposa a `goldenSolutions`.

    Retorna un dict serialitzable o None si cap objectiu té un comptador dins la banda.
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

    # tria l'objectiu amb més solucions dins la banda (repte més ric); desempat pel valor
    target, items = max(candidates, key=lambda t: (len(t[1]), -t[0]))

    # punts base de cada solució (sense bonus d'or)
    base = [
        (c, solution_points(m["leaves"], has_pow_or_sqrt(m["ast"]), False))
        for c, m in items
    ]
    max_base = max(bp for _, bp in base)
    golden = sorted(c for c, bp in base if bp == max_base)

    total = sum(bp for _, bp in base) + GOLDEN_BONUS * len(golden)
    solutions = sorted(c for c, _ in base)

    return {
        "target": target,
        "digits": digits,
        "centralIndex": central_index,
        "maxOperands": max_leaves,
        "solutions": solutions,
        "goldenSolutions": golden,
        "totalPoints": total,
        "ranks": build_ranks(total),
    }
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `python -m pytest generator/tests/test_puzzles.py -q`
Expected: PASS (8 passed). Pot trigar ~15-30 s pels tests de `make_puzzle`.

- [ ] **Step 5: Commit**

```bash
git add generator/puzzles.py generator/tests/test_puzzles.py
git commit -m "feat: Solucio d'Or (substitueix el Numerogram) amb bonus +5"
```

---

## Task 2: Fixar `max_leaves=4` a la CLI i committejar la Tasca 5 del Pla 1

`generator/generate.py` i `generator/tests/test_generate_cli.py` ja existeixen (untracked). El test usa `max_leaves=5`, que provoca `MemoryError`. Es baixa a `max_leaves=4` tant al test com al valor per defecte de la CLI, es verifica que passa i es committegen.

**Files:**
- Modify: `generator/generate.py` (untracked)
- Modify: `generator/tests/test_generate_cli.py` (untracked)

- [ ] **Step 1: Ajustar el test a `max_leaves=4`**

A `generator/tests/test_generate_cli.py`, canviar la línia de la crida a `build_pool`:

```python
    pool = build_pool(count=3, band=(20, 200), max_leaves=4, seed=42)
```

(abans deia `max_leaves=5`). La resta del fitxer no canvia.

- [ ] **Step 2: Baixar el `max_leaves` per defecte de la CLI a 4**

A `generator/generate.py`, canviar la signatura de `build_pool`:

```python
def build_pool(count, band=(40, 120), max_leaves=4, seed=0, start_date="2026-06-01"):
```

(abans `max_leaves=6`). I a `main()`, l'argument per defecte:

```python
    parser.add_argument("--max-leaves", type=int, default=4)
```

(abans `default=6`). La resta del fitxer no canvia.

- [ ] **Step 3: Executar el test i verificar que passa (sense MemoryError)**

Run: `python -m pytest generator/tests/test_generate_cli.py -q`
Expected: PASS (1 passed). Pot trigar 1-3 minuts; usa un timeout generós.

- [ ] **Step 4: Commit (Tasca 5 del Pla 1)**

```bash
git add generator/generate.py generator/tests/test_generate_cli.py
git commit -m "feat: CLI del generador del pool amb max_leaves=4 (evita MemoryError)"
```

---

## Task 3: Generar el pool real i committejar `data/puzzles.json`

**Files:**
- Create: `data/puzzles.json`

- [ ] **Step 1: Generar el pool**

Run: `python -m generator.generate --count 60 --seed 1`
Expected: imprimeix `Escrits N reptes a data\puzzles.json` i crea el fitxer. Pot trigar diversos minuts; usa un timeout generós.

- [ ] **Step 2: Verificar el contingut i les estadístiques de solucions**

Run:
```bash
python -c "import json; d=json.load(open('data/puzzles.json',encoding='utf-8')); s=[len(p['solutions']) for p in d['puzzles']]; g=[len(p['goldenSolutions']) for p in d['puzzles']]; print('reptes:',len(d['puzzles'])); print('solucions min/avg/max:',min(s),sum(s)//len(s),max(s)); print('dor min/avg/max:',min(g),sum(g)//len(g),max(g)); print('startDate:',d['startDate'])"
```
Expected: imprimeix el nombre de reptes (idealment 60), les solucions per repte dins de [40, 120], i que cada repte té ≥1 solució d'or.

> **Nota de contingència:** si el nombre de reptes és clarament < 60, la banda `(40, 120)` és massa estreta per a `max_leaves=4`. En aquest cas, regenerar ampliant la banda: `python -m generator.generate --count 60 --seed 1 --band 25 200`, i tornar a executar la verificació del Step 2. Aturar i informar l'usuari del valor de banda final emprat.

- [ ] **Step 3: Commit**

```bash
git add data/puzzles.json
git commit -m "feat: pool inicial de reptes (data/puzzles.json)"
```

---

## Task 4: Committejar el contracte de la forma canònica (Tasca 6 del Pla 1)

`docs/superpowers/specs/canonical-format.md` ja existeix (untracked). Aquesta tasca el committega. Verificar abans que el seu contingut coincideix amb el contracte vigent.

**Files:**
- Commit: `docs/superpowers/specs/canonical-format.md`

- [ ] **Step 1: Verificar el contingut del document**

Run: `python -c "print(open('docs/superpowers/specs/canonical-format.md',encoding='utf-8').read())"`
Expected: el document descriu els nodes `num/sqrt/sub/div/pow/add/mul`, l'ordenació per punt de codi Unicode i la taula d'exemples de paritat (`(* 2 3 4)`, `(+ 1 2 3)`, `(- 5 3)`, `(/ 8 4)`, `(^ 2 3)`, `r(9)`). Si falta alguna cosa respecte a `generator/engine.py::canonical`, corregir-ho abans de committejar.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/canonical-format.md
git commit -m "docs: contracte de la forma canonica per al client"
```

---

## Task 5: Tancar la branca i obrir el PR

- [ ] **Step 1: Executar tota la suite**

Run: `python -m pytest -q`
Expected: tots els tests passen (engine, canonical, solver, puzzles, generate_cli, smoke). Pot trigar uns minuts pels tests de `make_puzzle`/`build_pool`.

- [ ] **Step 2: Completar la branca**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."
**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch — verificar tests, presentar opcions i, en triar PR, obrir-lo cap a `main` al repo `skinnydkd/numerologic`.

---

## Self-Review

- **Cobertura de la spec (`2026-05-24-solucio-or-design.md`):**
  - §3 definició (punts base, màxim, +5 or) → Task 1 (`solution_points`, `make_puzzle`). ✓
  - §4 puntuació i rangs (`total = Σbase + 5×|or|`) → Task 1 (`total = ...`) + tests. ✓
  - §5 model de dades (`goldenSolutions`) → Task 1 (sortida de `make_puzzle`) + `test_make_puzzle_has_golden_solutions`. ✓
  - §7 canvis de codi (signatura, lògica, tests) → Task 1. ✓
  - §1 decisió `max_leaves=4` (memòria) → Task 2 (CLI) + Task 1 (`make_puzzle` per defecte). ✓
  - §8 límit d'empats → acceptat; cobert per `test_make_puzzle_has_golden_solutions` (no falla si n'hi ha moltes). ✓
  - Tancament Pla 1 (pool + doc contracte + PR) → Tasks 3, 4, 5. ✓
- **Placeholders:** cap; tot pas amb codi té el codi complet.
- **Consistència de tipus/noms:** `GOLDEN_BONUS` (constant) i `solution_points(leaves, uses_pow_sqrt, is_golden)` s'usen igual a test i implementació. `make_puzzle` retorna `goldenSolutions` (llista de strings), consumit pels tests i, al Pla 2, pel client. `build_pool(..., max_leaves=4, ...)` coherent amb el test. ✓
```
