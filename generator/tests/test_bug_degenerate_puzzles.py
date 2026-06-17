"""Reprodueix el bug dels reptes degenerats.

El perfil 'dificil' (banda lo=1 a generate.PROFILES) deixa passar reptes amb 1
sola solució; com que solen portar el dígit 1 al rusc, l'únic tutti possible és
trivial (multiplicar per 1). Resultat: un repte amb una idea i cap tutti "real".

Aquest test recrea el pool live (mateixos paràmetres que la comanda de generació:
`--no-pow-sqrt --no-repeat`, count=60, seed=0) i exigeix un mínim de solucions per
repte. HA de passar; ara FALLA (idx 2, 17, 20, 23, 35, 53 amb <4 solucions)."""
from generator.generate import build_pool
from generator.engine import Variant

# regles reals del banc: +−×÷, sense arrel, sense repetició
BASIC = Variant(("add", "sub", "mul", "div"), False, False)

MIN_SOLUTIONS = 4  # cap repte no hauria de tenir menys (evita reptes d'una sola idea)


def test_pool_has_no_degenerate_puzzles():
    pool = build_pool(count=60, seed=0, variant=BASIC)
    degenerate = [
        (i, p["difficulty"], len(p["solutions"]))
        for i, p in enumerate(pool["puzzles"])
        if len(p["solutions"]) < MIN_SOLUTIONS
    ]
    assert not degenerate, f"reptes degenerats (<{MIN_SOLUTIONS} solucions): {degenerate}"
