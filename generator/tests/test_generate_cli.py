from generator.generate import build_pool
from generator.engine import Variant

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def test_build_pool_small():
    pool = build_pool(count=3, max_leaves=4, seed=42, variant=BASIC)
    assert len(pool["puzzles"]) == 3
    assert "startDate" in pool
    for pz in pool["puzzles"]:
        assert len(pz["digits"]) == 7
        assert len(set(pz["digits"])) == 7
        assert 0 <= pz["centralIndex"] < 7
        assert pz["difficulty"] in ("facil", "mitja", "dificil")
        assert pz["brevi"]["count"] >= 1
        assert pz["hasTutti"] is True
    # count=3 → un de cada dificultat (els perfils es ciclen per ordre)
    assert [pz["difficulty"] for pz in pool["puzzles"]] == ["facil", "mitja", "dificil"]
    # reptes diferents (objectiu, dígits o central)
    keys = {(pz["target"], tuple(pz["digits"]), pz["centralIndex"]) for pz in pool["puzzles"]}
    assert len(keys) == 3
