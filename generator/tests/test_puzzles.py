import math
from generator.puzzles import solution_points, build_ranks, make_puzzle, RANK_PCTS
from generator.tutti import tutti_exists


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
    # la garantia de tutti és real, no un camp hardcodejat
    assert tutti_exists(pz["digits"], pz["target"]) is True


def test_make_puzzle_returns_none_when_no_target_in_band():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=0, band=(10**9, 10**9), max_leaves=3)
    assert pz is None


def test_make_puzzle_respects_target_range():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4,
                     target_range=(100, 999))
    assert pz is not None
    assert 100 <= pz["target"] <= 999
