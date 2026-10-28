import random

from gen_rutalogic.hive import CELLS, CENTER, NEIGHBORS, apply_op
from gen_rutalogic.pool import MAX_BREVI, MIN_BREVI, make_board, route_points
from gen_rutalogic.routes import routes_to, run, value_stats


def test_rusc_de_19_cel·les_amb_veins_simetrics():
    assert len(CELLS) == 19 and CENTER == 9
    assert [sum(1 for q, r in CELLS if r == k) for k in range(-2, 3)] == [3, 4, 5, 4, 3]
    assert len(NEIGHBORS[CENTER]) == 6
    for a, nbs in enumerate(NEIGHBORS):
        for b in nbs:
            assert a in NEIGHBORS[b]


def test_888205_rutes_simples_des_del_centre():
    count = 0

    def dfs(cell, mask):
        nonlocal count
        count += 1  # inclou la ruta buida (només el centre)
        for nb in NEIGHBORS[cell]:
            if not mask >> nb & 1:
                dfs(nb, mask | 1 << nb)

    dfs(CENTER, 1 << CENTER)
    assert count == 888205


def test_operacions_i_poda():
    assert apply_op(7, "/2") is None
    assert apply_op(-9, "/3") == -3
    assert apply_op(400, "*3") is None   # |v| < 1000
    assert apply_op(5, "-9") == -4
    ops = ["+1"] * 19
    ops[CENTER] = None
    for nb in NEIGHBORS[CENTER]:
        ops[nb] = "/2"
    assert value_stats(3, ops) == {}   # 3 no es pot dividir per 2: cap ruta


def test_estadistiques_i_rutes_coincideixen():
    rnd = random.Random(1)
    ops = [rnd.choice(["+2", "-1", "*2", "/2", "+5"]) for _ in range(19)]
    ops[CENTER] = None
    stats = value_stats(4, ops)
    for v in (10, 12, 15):
        routes = routes_to(4, ops, v)
        if v in stats:
            n, mn, mx = stats[v]
            assert len(routes) == n
            assert min(map(len, routes)) == mn and max(map(len, routes)) == mx
        assert all(run(4, ops, r) == v for r in routes)


def test_tauler_acceptat():
    b = make_board(random.Random(7))
    lengths = [n for k, c in b["byLength"].items() for n in [int(k)] * c]
    assert 10 <= b["target"] <= 99 and b["target"] != b["start"] and 2 <= b["start"] <= 9
    assert 20 <= len(lengths) <= 200 and MIN_BREVI <= min(lengths) <= MAX_BREVI
    assert all(len(r) == min(lengths) and run(b["start"], b["ops"], r) == b["target"] for r in b["brevi"])
    assert all(len(r) == max(lengths) and run(b["start"], b["ops"], r) == b["target"] for r in b["marato"])
    assert len(b["brevi"]) == b["byLength"][str(min(lengths))]
    assert b["total"] == sum(route_points(n, min(lengths), max(lengths)) for n in lengths) + 10
    assert b["ranks"][-1] == ["Llegenda", b["total"]]
