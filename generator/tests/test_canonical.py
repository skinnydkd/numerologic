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


def test_non_commutative_keeps_order():
    assert canonical(('sub', ('num', 5), ('num', 3))) == "(- 5 3)"
    assert canonical(('sub', ('num', 3), ('num', 5))) == "(- 3 5)"
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
