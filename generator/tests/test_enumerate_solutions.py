from collections import defaultdict

from generator.engine import Variant, evaluate
from generator.solver import _build, generate
from generator.enumerate_solutions import (
    solutions_full_ast,
    solutions_by_tier,
    counted_and_brevi,
)

BASIC = Variant(('add', 'sub', 'mul', 'div'), False, False)


def _leaves(ast):
    if ast[0] == 'num':
        return [ast[1]]
    out = []
    for c in ast[1:]:
        if isinstance(c, tuple):
            out += _leaves(c)
    return out


def _brute_by_value(digits, variant):
    full = _build(variant)(tuple(sorted(digits)))
    by = {}
    for c, (v, _a) in full.items():
        by.setdefault(v, set()).add(c)
    return by


# --- Task 1: nucli de l'enumerador ---

def test_matches_bruteforce_all_values_n4():
    digits = (1, 3, 4, 6)
    by_val = _brute_by_value(digits, BASIC)
    for v, expected in by_val.items():
        got = set(solutions_full_ast(digits, v, BASIC))
        assert got == expected, f"val={v}: {len(expected ^ got)} diferents"


def test_matches_bruteforce_all_values_n5():
    digits = (2, 3, 4, 6, 9)
    by_val = _brute_by_value(digits, BASIC)
    for v, expected in by_val.items():
        got = set(solutions_full_ast(digits, v, BASIC))
        assert got == expected


def test_selfconsistent_uses_all_digits_and_value():
    digits = (1, 3, 4, 5, 6, 7, 9)
    want = sorted(digits)
    sols = solutions_full_ast(digits, 20, BASIC)
    assert len(sols) > 0
    for c, ast in sols.items():
        assert evaluate(ast) == 20
        assert sorted(_leaves(ast)) == want


# --- Task 2: conjunt comptat per tier ---

def _counted_via_generate(digits, central, target, max_leaves):
    sols = generate(digits, max_leaves=max_leaves, variant=BASIC)
    out = set()
    for c, m in sols.items():
        if central in m['used'] and m['value'] == target:
            out.add(c)
    return out


def test_solutions_by_tier_matches_generate_k4():
    digits = (1, 3, 4, 5, 6, 7, 9)
    central, target = 6, 20
    tiers = solutions_by_tier(digits, central, target, BASIC, max_operands=4)
    union = set()
    for r, d in tiers.items():
        assert r <= 4
        union |= set(d)
    assert union == _counted_via_generate(digits, central, target, 4)


def test_solutions_by_tier_only_subsets_with_central():
    digits = (1, 3, 4, 5, 6, 7, 9)
    central, target = 6, 20
    tiers = solutions_by_tier(digits, central, target, BASIC, max_operands=4)
    for r, d in tiers.items():
        for ast in d.values():
            leaves = _leaves(ast)
            assert central in leaves
            assert len(leaves) == r
            assert evaluate(ast) == target


# --- Task 3: Brevi i conjunt comptat amb maxOperands dinàmic ---

def test_counted_and_brevi_today():
    res = counted_and_brevi((1, 3, 4, 5, 6, 7, 9), 6, 20, BASIC)
    assert res is not None
    assert res['brevi']['operands'] == 3
    assert res['brevi']['count'] == 2
    assert res['maxOperands'] == 4
    assert len(res['counted']) == len(_counted_via_generate((1, 3, 4, 5, 6, 7, 9), 6, 20, 4))
    assert sum(res['byLeaves'].values()) == len(res['counted'])


def test_counted_and_brevi_none_when_unreachable():
    res = counted_and_brevi((1, 3, 4, 5, 6, 7, 9), 6, 999999, BASIC)
    assert res is None


import re


def _has_trivial_one(c):
    if re.search(r"\(/ .* 1\)", c):
        return True
    for m in re.finditer(r"\(\* ([^()]*)\)", c):
        if "1" in m.group(1).split():
            return True
    return False


def test_counted_has_no_trivial_one():
    res = counted_and_brevi((1, 2, 3, 4, 5, 7, 9), 5, 25, BASIC)
    assert res is not None
    for c in res["counted"]:
        assert not _has_trivial_one(c), c
    assert sum(res["byLeaves"].values()) == len(res["counted"])
