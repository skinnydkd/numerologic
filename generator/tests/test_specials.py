import datetime as dt

from generator.engine import Variant
from generator.puzzles import make_special_puzzle
from generator.specials import Special, apply_specials, special_index

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def test_special_puzzle_pi_counts_up_to_six_operands():
    # rusc de π (3,1415926 → 1 2 3 4 5 6 9), central 3: amb Brevi de 5 només n'hi ha 2;
    # comptant fins a 6 operands el repte és ric
    pz = make_special_puzzle([1, 2, 3, 4, 5, 6, 9], 2, 314, variant=BASIC, count_operands=6)
    assert pz["target"] == 314
    assert pz["maxOperands"] == 6
    assert len(pz["solutions"]) >= 4
    assert pz["hasTutti"] is True
    assert sum(int(v) for v in pz["hints"]["byLeaves"].values()) == len(pz["solutions"])


def test_apply_specials_replaces_only_the_day_index():
    pool = {"startDate": "2026-08-14", "puzzles": [{"target": i} for i in range(365)]}
    sp = Special(dt.date(2026, 10, 31), "🎃 Castanyada", 31, [2, 3, 4, 6, 7, 8, 9], 4,
                 note="Avui és 31/10", hex="#d97706", center="#7c2d12")
    built = []
    apply_specials(pool, [sp], build=lambda s: built.append(s) or {"target": s.target})
    idx = special_index(pool, sp.date)
    assert idx == 78  # 31/10/2026 = 78 dies després del 14/08/2026
    assert pool["puzzles"][idx] == {"target": 31, "special": {
        "title": "🎃 Castanyada", "note": "Avui és 31/10", "hex": "#d97706", "center": "#7c2d12"}}
    assert [p["target"] for i, p in enumerate(pool["puzzles"]) if i != idx] == [i for i in range(365) if i != idx]
    assert built == [sp]


def test_data_has_every_special_on_its_day():
    import json
    from generator.specials import SPECIALS
    pool = json.load(open("data/puzzles.json", encoding="utf-8"))
    assert len(SPECIALS) == 12
    for sp in SPECIALS:
        pz = pool["puzzles"][special_index(pool, sp.date)]
        assert pz["special"]["title"] == sp.title and pz["special"]["note"], sp
        assert pz["target"] == sp.target
        assert len(pz["solutions"]) >= 4
