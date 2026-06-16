"""Tests de la variant 'sense repetir · només +-*/' (engine.BASIC_NOREPEAT)."""
from generator.engine import BASIC_NOREPEAT, has_pow_or_sqrt
from generator.solver import generate
from generator.tutti import tutti_exists
from generator.puzzles import make_puzzle
from generator.generate import build_pool


def _leaves(ast):
    """Llista de valors de fulla d'un AST (per comprovar la no-repetició)."""
    if ast[0] == "num":
        return [ast[1]]
    out = []
    for child in ast[1:]:
        if isinstance(child, tuple):
            out.extend(_leaves(child))
    return out


def test_basic_norepeat_small_is_hand_verifiable():
    # {3,4}, k=2, sense repetir, només +-*/: 4 classes exactes (comprovable a mà).
    sols = generate([3, 4], max_leaves=2, variant=BASIC_NOREPEAT)
    assert {c: m["value"] for c, m in sols.items()} == {
        "(+ 3 4)": 7,
        "(- 3 4)": -1,
        "(* 3 4)": 12,
        "(- 4 3)": 1,
    }


def test_basic_norepeat_has_no_pow_or_sqrt():
    sols = generate([2, 4, 5, 7], max_leaves=4, variant=BASIC_NOREPEAT)
    assert sols
    for c, m in sols.items():
        assert "^" not in c and "r(" not in c
        assert has_pow_or_sqrt(m["ast"]) is False


def test_basic_norepeat_never_reuses_a_digit():
    sols = generate([2, 4, 5, 7], max_leaves=4, variant=BASIC_NOREPEAT)
    for m in sols.values():
        leaves = _leaves(m["ast"])
        assert len(leaves) == len(set(leaves))


def test_default_variant_unchanged():
    # Per defecte (FULL): ha de coincidir amb les dades de referència (45 classes per a {3,4}, k=2).
    assert len(generate([3, 4], max_leaves=2)) == 45


def test_make_puzzle_under_variant():
    pz = make_puzzle([1, 2, 3, 4, 5, 6, 7], central_index=2, band=(5, 9999),
                     max_leaves=4, variant=BASIC_NOREPEAT)
    assert pz is not None
    for c in pz["solutions"]:
        assert "^" not in c and "r(" not in c
    assert tutti_exists(pz["digits"], pz["target"], variant=BASIC_NOREPEAT) is True
    assert pz["hints"]["byOp"]["pow"] == 0
    assert pz["hints"]["byOp"]["sqrt"] == 0
    # el repte porta marcades les regles de la variant (el client les llegeix)
    assert pz["rules"]["allowRepeat"] is False
    assert "pow" not in pz["rules"]["ops"]
    assert "sqrt" not in pz["rules"]["ops"]


def test_build_pool_under_variant():
    pool = build_pool(count=2, max_leaves=4, seed=0, variant=BASIC_NOREPEAT)
    assert len(pool["puzzles"]) >= 1
    for pz in pool["puzzles"]:
        for c in pz["solutions"]:
            assert "^" not in c and "r(" not in c
