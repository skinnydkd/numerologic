"""Pool diari de Quadrològic: la mida depén del dia de la setmana.

  dl–dc 4×4 (fàcil) · dj–dv 5×5 (mitjà) · ds–dg 6×6 (difícil)
Només s'accepten graelles amb solució única i resolubles sense provar (logic_solve).
"""
import random
from datetime import date, timedelta

from gen_quadrologic.latin import latin_square, make_cages
from gen_quadrologic.solver import count_solutions, logic_solve

SIZE_BY_WEEKDAY = (4, 4, 4, 5, 5, 6, 6)
DIFFICULTY = {4: "facil", 5: "mitja", 6: "dificil"}
# ponytail: calibratge a ull (≈1:40, 3:20, 6:00); ajusta-ho amb temps reals de jugadors.
SECONDS_PER_CELL = {4: 6, 5: 8, 6: 10}


def ref_seconds(n, passes):
    return round(n * n * SECONDS_PER_CELL[n] * (0.85 + 0.05 * passes))


def make_puzzle(rnd, n, tries=10000):
    for _ in range(tries):
        sol = latin_square(rnd, n)
        cages = make_cages(rnd, sol)
        if count_solutions(n, cages) != 1:
            continue
        res = logic_solve(n, cages)
        if res is None:
            continue
        return {
            "size": n, "difficulty": DIFFICULTY[n], "solution": sol, "cages": cages,
            "refSeconds": ref_seconds(n, res["passes"]), "order": res["order"],
        }
    raise RuntimeError(f"no s'ha trobat cap graella {n}×{n}")


def build_pool(count, seed=0, start_date="2026-10-26"):
    """`count` dies (múltiple de 7 perquè la mida per dia de la setmana quadre en tornar a començar)."""
    rnd = random.Random(seed)
    start = date.fromisoformat(start_date)
    sizes = [SIZE_BY_WEEKDAY[(start + timedelta(days=i)).weekday()] for i in range(count)]
    return {"startDate": start_date, "puzzles": [make_puzzle(rnd, n) for n in sizes]}
