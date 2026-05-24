import json
from generator.generate import build_pool


def test_build_pool_small():
    pool = build_pool(count=3, band=(20, 200), max_leaves=4, seed=42)
    assert len(pool["puzzles"]) == 3
    assert "startDate" in pool
    for pz in pool["puzzles"]:
        assert 20 <= len(pz["solutions"]) <= 200
        assert len(pz["digits"]) == 7
        assert len(set(pz["digits"])) == 7
        assert 0 <= pz["centralIndex"] < 7
    # reptes diferents (objectiu o dígits)
    keys = {(pz["target"], tuple(pz["digits"]), pz["centralIndex"]) for pz in pool["puzzles"]}
    assert len(keys) == 3
