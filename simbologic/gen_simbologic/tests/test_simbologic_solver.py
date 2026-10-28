from gen_simbologic.grid import lines_of, totals
from gen_simbologic.solver import solve


def _grid(cells, values, row_ops=None):
    row_ops = row_ops or ["+"] * len(cells)
    rt, ct = totals(cells, values, row_ops)
    return lines_of(cells, row_ops, rt, ct)


def test_resol_directe_amb_una_fila_monocolor():
    cells = [[0, 0, 0], [0, 1, 1], [1, 2, 2]]
    res = solve(_grid(cells, [4, 7, 9]), 3)
    assert res["values"] == {0: 4, 1: 7, 2: 9}
    assert set(res["steps"]) == {"a"}
    assert res["order"][0] == 0


def test_cal_combinar_dues_files():
    # cap línia té un sol símbol; fila0 − 2·fila1 deixa només el símbol 2
    cells = [[0, 0, 1, 1], [0, 1, 2, 2], [3, 0, 1, 2], [1, 3, 2, 0]]
    res = solve(_grid(cells, [5, 8, 11, 2]), 4)
    assert res["values"] == {0: 5, 1: 8, 2: 11, 3: 2}
    assert res["steps"][0] == "c" and res["order"][0] == 2


def test_rebutja_files_dependents():
    # cada línia té un 0 i un 1: només se'n sap la suma, no cadascun
    cells = [[0, 1], [1, 0]]
    assert solve(_grid(cells, [3, 5]), 2) is None


def test_fila_de_producte_amb_negatius():
    cells = [[0, 0, 0], [0, 1, 1], [1, 2, 2]]
    res = solve(_grid(cells, [-2, 7, 3], ["+", "*", "+"]), 3)
    assert res["values"] == {0: -2, 1: 7, 2: 3}


def test_producte_amb_desconegut_repetit_no_es_dedueix_pel_signe():
    # fila 0 = x·x = 9 no diu si x és 3 o −3: el solucionador no la pot fer servir sola
    lines = lines_of([[0, 0]], ["*"], [9], [])
    assert solve(lines, 1) is None
