from generator.solver import generate
from generator.engine import evaluate


def test_simple_pair():
    # Amb dígits {3,4}: 3+4=7, 3*4=12, 4-3=1, 3-4=-1, 4^3=64, 3^4=81, etc.
    sols = generate([3, 4], max_leaves=2)
    values = {m["value"] for m in sols.values()}
    assert 7 in values     # 3+4
    assert 12 in values    # 3*4
    assert 1 in values     # 4-3
    for c, m in sols.items():
        assert m["used"].issubset({3, 4})
        assert 1 <= m["leaves"] <= 2


def test_commutative_dedup():
    sols = generate([3, 4], max_leaves=2)
    plus = [m for m in sols.values() if m["value"] == 7 and m["leaves"] == 2]
    assert len(plus) == 1


def test_used_set_tracks_distinct_digits():
    sols = generate([2, 5], max_leaves=4)
    assert any(m["used"] == {2, 5} for m in sols.values())


def test_values_match_evaluate():
    sols = generate([2, 3, 5], max_leaves=3)
    for c, m in sols.items():
        assert m["value"] == evaluate(m["ast"])
