import json
import os


def test_puzzles_json_schema():
    path = os.path.join("data", "puzzles.json")
    data = json.load(open(path, encoding="utf-8"))
    assert "startDate" in data and isinstance(data["puzzles"], list)
    assert len(data["puzzles"]) >= 1
    expected_ranks = ["Principiant", "Aprenent", "Avançat", "Expert", "Mestre", "Geni", "Llegenda"]
    for p in data["puzzles"]:
        assert 5 <= len(p["digits"]) <= 7
        assert 0 <= p["centralIndex"] < len(p["digits"])
        assert p["hasTutti"] is True
        assert p["brevi"]["operands"] >= 2 and p["brevi"]["count"] >= 1
        assert p["difficulty"] in ("facil", "mitja", "dificil")
        assert p["maxOperands"] >= 4
        # cap repte degenerat: sempre com a mínim 4 solucions (evita reptes d'una sola idea)
        assert len(p["solutions"]) >= 4
        assert sum(int(v) for v in p["hints"]["byLeaves"].values()) == len(p["solutions"])
        # el Brevi no és més gran que el conjunt comptat
        assert p["brevi"]["count"] <= len(p["solutions"])
        # rangs amb noms uniformes (escala de nivell), de Principiant a Llegenda
        assert [name for name, _ in p["ranks"]] == expected_ranks
