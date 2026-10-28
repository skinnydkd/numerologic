"""El fixture de paritat desat ha de coincidir amb el que genera el codi Python actual."""
import json
import os

from gen_igualogic.fixtures import OUT, build

GAME_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_fixture_al_dia():
    with open(os.path.join(GAME_DIR, OUT), encoding="utf-8") as f:
        saved = json.load(f)
    assert saved == build(), "regenera'l: python -m gen_igualogic.fixtures (des d'igualogic/)"


def test_fixture_te_de_tot():
    data = build()
    vals = [c["valid"] for c in data["equations"]]
    assert sum(vals) >= 20 and vals.count(False) >= 20
    assert any("y" in c["colors"] for c in data["colors"])
