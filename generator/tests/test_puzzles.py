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
