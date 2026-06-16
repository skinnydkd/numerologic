import statistics

from generator.generate import build_pool
from generator.engine import Variant

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def test_pool_has_difficulty_spectrum():
    pool = build_pool(count=12, seed=1, variant=BASIC)
    pz = pool["puzzles"]
    assert len(pz) == 12
    # hi ha barreja de dificultats (almenys 2 nivells)
    diffs = {p["difficulty"] for p in pz}
    assert len(diffs) >= 2
    # tots: 7 dígits (grisos diferits), brevi vàlid i tutti
    for p in pz:
        assert p["hasTutti"] is True
        assert p["brevi"]["count"] >= 1
        assert len(p["digits"]) == 7
        assert p["centralIndex"] < len(p["digits"])
    # els difícils tenen objectius més grans que els fàcils (de mitjana)
    facils = [p["target"] for p in pz if p["difficulty"] == "facil"]
    dificils = [p["target"] for p in pz if p["difficulty"] == "dificil"]
    if facils and dificils:
        assert statistics.mean(dificils) > statistics.mean(facils)
