import random

from gen_simbologic.grid import lines_of, linear_rank, totals
from gen_simbologic.pool import build_pool, make_grid
from gen_simbologic.solver import solve


def test_rang_exacte():
    lines = lines_of([[0, 1], [1, 0]], ["+", "+"], [8, 8], [8, 8])
    assert linear_rank(lines, 2) == 1
    lines = lines_of([[0, 0], [0, 1]], ["+", "+"], [4, 9], [4, 9])
    assert linear_rank(lines, 2) == 2


def test_cada_nivell_compleix_la_seua_definicio():
    rnd = random.Random(3)
    for level in ("facil", "mitja", "dificil"):
        for _ in range(20):
            g = make_grid(rnd, level)
            n = len(g["values"])
            assert (g["rowTotals"], g["colTotals"]) == totals(g["cells"], g["values"], g["rowOps"])
            assert len(set(g["values"])) == n and {s for r in g["cells"] for s in r} == set(range(n))
            res = solve(lines_of(g["cells"], g["rowOps"], g["rowTotals"], g["colTotals"]), n)
            assert res["values"] == dict(enumerate(g["values"]))
            assert res["order"] == g["order"]
            combo = any(k in "bc" for k in res["steps"])
            if level == "facil":
                assert g["size"] == 3 and not combo and all(1 <= v <= 20 for v in g["values"])
            elif level == "mitja":
                assert g["size"] == 4 and combo and all(1 <= v <= 20 for v in g["values"])
            else:
                assert "*" in g["rowOps"] and combo
                assert any(v < 0 for v in g["values"]) and 0 not in g["values"]
                assert all(-9 <= v <= 20 for v in g["values"])


def test_pool_determinista():
    a, b = build_pool(7, seed=5), build_pool(7, seed=5)
    assert a == b and len(a["puzzles"]) == 7
    assert [g["level"] for g in a["puzzles"][0]["grids"]] == ["facil", "mitja", "dificil"]
