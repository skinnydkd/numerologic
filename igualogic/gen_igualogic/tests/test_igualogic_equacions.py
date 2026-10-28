from gen_igualogic.equacions import is_valid, eval_lhs, feedback, enumerate_equations
from gen_igualogic.pool import is_interesting, build_pool


def test_prioritat_operacions():
    assert eval_lhs("3*7-4") == 17
    assert eval_lhs("2+3*4") == 14
    assert eval_lhs("8/4*3") == 6
    assert eval_lhs("9-10+6") == 5


def test_divisio_exacta():
    assert eval_lhs("7/2") is None
    assert eval_lhs("5/0") is None
    assert is_valid("246/3=82")


def test_formes_no_valides():
    assert not is_valid("17=17")          # cal almenys un operador
    assert not is_valid("05+3=8")         # zero a l'esquerra
    assert not is_valid("5+3=08")
    assert not is_valid("-3+9=6")         # menys unari
    assert not is_valid("3+4=5+2")        # a la dreta només un nombre
    assert not is_valid("3+4=8")          # falsa
    assert not is_valid("3++4=7")
    assert is_valid("3*7-4=17")


def test_colors_basics():
    assert feedback("3*7-4=17", "3*7-4=17") == "gggggggg"
    assert feedback("12+35=47", "3*7-4=17") == "yxxyxgyg"


def test_colors_repetits_regla_wordle():
    # el '3' de la posició 4 és or; el segon i el tercer '3' ja no hi caben
    assert feedback("4*9-3=33", "3*7-4=17") == "ygxgygxx"


def test_enumeracio_curta_es_valida():
    eqs = enumerate_equations(6)
    assert "2*3=6" not in eqs                # 5 caràcters
    assert "12/4=3" in eqs and "2+3*4=14" not in eqs
    assert all(is_valid(e) and len(e) == 6 for e in eqs)


def test_interessants():
    assert is_interesting("3*7-4=17")
    assert not is_interesting("0*55=0")
    assert not is_interesting("17*1=17")
    assert not is_interesting("1*17=17")


def test_pool_alterna_dificultat_sense_repetir():
    pool = build_pool(9, length=6, seed=3, maxi_length=0)
    eqs = [p["eq"] for p in pool["puzzles"]]
    assert len(eqs) == 9 and len(set(eqs)) == 9
    assert [p["difficulty"] for p in pool["puzzles"][:3]] == ["facil", "mitja", "dificil"]
    assert all(is_valid(e) and len(e) == 6 for e in eqs)


def test_maxi_els_diumenges():
    # 2026-10-26 és dilluns: l'índex 6 cau en diumenge
    pool = build_pool(7, length=6, seed=1, start_date="2026-10-26", maxi_length=10)
    pz = pool["puzzles"]
    assert [bool(p.get("maxi")) for p in pz] == [False] * 6 + [True]
    assert len(pz[6]["eq"]) == 10 and is_valid(pz[6]["eq"]) and is_interesting(pz[6]["eq"])
