from generator.engine import canonical, has_pow_or_sqrt


def test_num():
    assert canonical(('num', 3)) == "3"


def test_commutative_sort_and_flatten():
    a = ('mul', ('mul', ('num', 3), ('num', 4)), ('num', 2))
    b = ('mul', ('num', 2), ('mul', ('num', 4), ('num', 3)))
    assert canonical(a) == canonical(b) == "(* 2 3 4)"


def test_add_flatten():
    a = ('add', ('add', ('num', 1), ('num', 2)), ('num', 3))
    assert canonical(a) == "(+ 1 2 3)"


def test_subtraction_is_signed_addition():
    # La resta s'aplana a suma amb signe (termes negatius com (~ x)), conservant el valor.
    assert canonical(('sub', ('num', 5), ('num', 3))) == "(+ (~ 3) 5)"
    assert canonical(('sub', ('num', 3), ('num', 5))) == "(+ (~ 5) 3)"


def test_additive_reorder_dedup():
    # 7×2×5−6−4 ≡ −6−4+7×5×2 ≡ 7×2×5−(6+4): mateixa suma de termes amb signe.
    m = ('mul', ('mul', ('num', 7), ('num', 2)), ('num', 5))
    a = ('sub', ('sub', m, ('num', 6)), ('num', 4))     # 7×2×5 − 6 − 4
    b = ('sub', ('sub', m, ('num', 4)), ('num', 6))     # 7×2×5 − 4 − 6
    c = ('sub', m, ('add', ('num', 6), ('num', 4)))     # 7×2×5 − (6+4)
    assert canonical(a) == canonical(b) == canonical(c) == "(+ (* 2 5 7) (~ 4) (~ 6))"
    # però signes diferents NO es fusionen:
    assert canonical(('sub', ('num', 9), ('num', 3))) != canonical(('sub', ('num', 3), ('num', 9)))


def test_non_commutative_keeps_order():
    assert canonical(('div', ('num', 8), ('num', 4))) == "(/ 8 4)"
    assert canonical(('pow', ('num', 2), ('num', 3))) == "(^ 2 3)"


def test_sqrt():
    assert canonical(('sqrt', ('num', 9))) == "r(9)"


def test_different_numbers_are_different():
    assert canonical(('mul', ('num', 3), ('num', 8))) != \
           canonical(('mul', ('num', 4), ('num', 6)))


def test_has_pow_or_sqrt():
    assert has_pow_or_sqrt(('pow', ('num', 2), ('num', 3))) is True
    assert has_pow_or_sqrt(('sqrt', ('num', 9))) is True
    assert has_pow_or_sqrt(('add', ('num', 1), ('mul', ('num', 2), ('num', 3)))) is False


def test_reduce1_absorbs_mul_one():
    from generator.engine import reduce1
    assert reduce1(('mul', ('num', 7), ('num', 1))) == ('num', 7)
    assert reduce1(('mul', ('num', 1), ('num', 7))) == ('num', 7)


def test_reduce1_absorbs_div_one():
    from generator.engine import reduce1
    assert reduce1(('div', ('num', 7), ('num', 1))) == ('num', 7)


def test_reduce1_keeps_computed_one():
    from generator.engine import reduce1
    # 5-4 = 1 calculat: no es toca
    e = ('mul', ('sub', ('num', 5), ('num', 4)), ('num', 3))
    assert reduce1(e) == e


def test_canonical_collapses_times_one():
    a = ('add', ('mul', ('num', 7), ('num', 1)), ('num', 2))  # 7*1+2
    b = ('add', ('num', 7), ('num', 2))                       # 7+2
    assert canonical(a) == canonical(b) == "(+ 2 7)"


def test_canonical_collapses_div_one():
    assert canonical(('div', ('num', 7), ('num', 1))) == "7"
