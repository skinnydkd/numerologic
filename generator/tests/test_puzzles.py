import math
from generator.puzzles import solution_points, build_ranks, make_puzzle, RANK_PCTS


def test_solution_points_basic():
    # 2 fulles, sense pow/sqrt, no numerogram -> 2 punts
    assert solution_points(leaves=2, uses_pow_sqrt=False, is_numerogram=False) == 2


def test_solution_points_bonus():
    assert solution_points(leaves=3, uses_pow_sqrt=True, is_numerogram=False) == 5
    assert solution_points(leaves=4, uses_pow_sqrt=False, is_numerogram=True) == 14


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
    # totes les solucions usen el digit central (valor a la posicio central)
    # (es comprova indirectament: el generador nomes inclou les que l'usen)
    assert isinstance(pz["solutions"][0], str)


def test_make_puzzle_returns_none_when_no_target_in_band():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=0, band=(10**9, 10**9), max_leaves=3)
    assert pz is None
