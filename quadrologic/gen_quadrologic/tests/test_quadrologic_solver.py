import random

from gen_quadrologic.latin import cage_tuples, cage_value, latin_square, make_cages
from gen_quadrologic.pool import SIZE_BY_WEEKDAY, build_pool, make_puzzle
from gen_quadrologic.solver import count_solutions, logic_solve


def test_quadrat_llati():
    rnd = random.Random(2)
    for n in (4, 5, 6):
        sq = latin_square(rnd, n)
        for i in range(n):
            assert sorted(sq[i]) == list(range(1, n + 1))
            assert sorted(r[i] for r in sq) == list(range(1, n + 1))


def test_operacions_de_gabia():
    assert cage_value("-", (2, 5)) == 3
    assert cage_value("/", (2, 6)) == 3
    assert cage_value("/", (4, 6)) is None
    assert cage_value("*", (2, 3, 4)) == 24
    # dues cel·les de la mateixa fila no poden repetir: 2+2 no és una opció
    assert (2, 2) not in cage_tuples({"cells": [[0, 0], [0, 1]], "op": "+", "target": 4}, 4)


def test_gabies_cobreixen_i_quadren():
    rnd = random.Random(4)
    sol = latin_square(rnd, 6)
    cages = make_cages(rnd, sol)
    cells = sorted(tuple(p) for c in cages for p in c["cells"])
    assert cells == [(r, c) for r in range(6) for c in range(6)]
    for c in cages:
        assert 1 <= len(c["cells"]) <= 3
        assert c["target"] == cage_value(c["op"], [sol[r][k] for r, k in c["cells"]])
        assert (c["op"] == "=") == (len(c["cells"]) == 1)
    assert sum(len(c["cells"]) == 1 for c in cages) <= 3


def test_unicitat_i_logica():
    # sense gàbies amb informació (només sumes de fila sencera) hi ha moltes solucions
    rows = [{"cells": [[r, c] for c in range(4)], "op": "+", "target": 10} for r in range(4)]
    assert count_solutions(4, rows) == 2
    rnd = random.Random(6)
    for n in (4, 5, 6):
        p = make_puzzle(rnd, n)
        assert count_solutions(n, p["cages"]) == 1
        res = logic_solve(n, p["cages"])
        assert res["grid"] == p["solution"]
        assert sorted(map(tuple, p["order"])) == [(r, c) for r in range(n) for c in range(n)]


def test_mida_per_dia_de_la_setmana():
    pool = build_pool(7, seed=1)
    assert [p["size"] for p in pool["puzzles"]] == list(SIZE_BY_WEEKDAY)  # 2026-10-26 és dilluns
    refs = {p["size"]: p["refSeconds"] for p in pool["puzzles"]}
    assert refs[4] < refs[5] < refs[6]
