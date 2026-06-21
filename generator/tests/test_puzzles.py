import math
from generator.puzzles import solution_points, build_ranks, make_puzzle, RANK_PCTS
from generator.tutti import tutti_exists
from generator.engine import Variant

# regles reals del banc: +−×÷, sense arrel, sense repetició
BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def test_solution_points_basic():
    assert solution_points(leaves=2, uses_pow_sqrt=False) == 2


def test_solution_points_pow_sqrt_bonus():
    assert solution_points(leaves=3, uses_pow_sqrt=True) == 5


def test_build_ranks_thresholds():
    ranks = build_ranks(total=100)
    names = [r[0] for r in ranks]
    assert names[0] == "Principiant" and names[-1] == "Llegenda"
    assert ranks[0][1] == 0
    assert ranks[-1][1] == 100
    aprenent = dict(ranks)["Aprenent"]
    assert aprenent == math.ceil(0.10 * 100)


def test_make_puzzle_in_band_with_tutti():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4,
                     variant=BASIC)
    assert pz is not None
    assert 5 <= len(pz["solutions"]) <= 9999
    assert pz["digits"] == [1, 2, 3, 4, 5, 6, 7]
    assert pz["centralIndex"] == 2
    assert pz["totalPoints"] > 0
    assert pz["hasTutti"] is True
    assert "goldenSolutions" not in pz
    assert isinstance(pz["solutions"][0], str)
    # la garantia de tutti és real, no un camp hardcodejat
    assert tutti_exists(pz["digits"], pz["target"], variant=BASIC) is True


def test_make_puzzle_returns_none_when_no_target_in_band():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=0, band=(10**9, 10**9), max_leaves=3)
    assert pz is None


def test_make_puzzle_respects_target_range():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4,
                     target_range=(100, 999), variant=BASIC)
    assert pz is not None
    assert 100 <= pz["target"] <= 999


def test_make_puzzle_includes_hints():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999), max_leaves=4,
                     variant=BASIC)
    assert pz is not None
    h = pz["hints"]
    assert set(h["byOp"].keys()) == {"add", "sub", "mul", "div", "pow", "sqrt"}
    assert all(isinstance(v, int) for v in h["byOp"].values())
    # cada solució compta exactament un cop al recompte per operands
    assert sum(int(v) for v in h["byLeaves"].values()) == len(pz["solutions"])


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
    assert sum(int(v) for v in pz["hints"]["byLeaves"].values()) == len(pz["solutions"])
    assert pz["brevi"]["count"] <= len(pz["solutions"])


def test_game_total_points_adds_guaranteed_tutti():
    from generator.puzzles import game_total_points
    digits = [1, 2, 3, 4, 5, 6]  # rusc gran: cap solució de ≤4 operands és tutti
    counted = {
        "a": ("mul", ("num", 2), ("num", 3)),                       # 2 ops (brevi)
        "b": ("add", ("mul", ("num", 2), ("num", 3)), ("num", 4)),  # 3 ops
    }
    base = game_total_points(counted, brevi_ops=2, digits=digits, has_tutti=False)
    with_tutti = game_total_points(counted, brevi_ops=2, digits=digits, has_tutti=True)
    assert with_tutti == base + 10


def test_game_total_points_brevi_and_tutti_worth_ten():
    """totalPoints usa l'escala del joc: Brevi i tutti valen 10, +10 per Brevi complet."""
    from generator.puzzles import game_total_points
    digits = [2, 3, 4, 5]
    counted = {
        "a": ("mul", ("num", 2), ("num", 3)),  # 2 operands = Brevi
        "b": ("add", ("mul", ("num", 2), ("num", 3)), ("num", 4)),  # 3 operands
        "t": ("add", ("add", ("num", 2), ("num", 3)), ("add", ("num", 4), ("num", 5))),  # tutti
    }
    # Brevi=10, 3-operands=3, tutti=10, +10 bonus = 33
    assert game_total_points(counted, brevi_ops=2, digits=digits) == 33
