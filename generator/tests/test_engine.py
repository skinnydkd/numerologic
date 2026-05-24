import pytest
from generator.engine import evaluate, InvalidExpr, CAP


def test_num():
    assert evaluate(('num', 5)) == 5


def test_basic_ops():
    assert evaluate(('add', ('num', 3), ('num', 4))) == 7
    assert evaluate(('sub', ('num', 3), ('num', 4))) == -1   # intermedis negatius permesos
    assert evaluate(('mul', ('num', 3), ('num', 4))) == 12


def test_division_must_be_exact():
    assert evaluate(('div', ('num', 8), ('num', 4))) == 2
    with pytest.raises(InvalidExpr):
        evaluate(('div', ('num', 7), ('num', 2)))
    with pytest.raises(InvalidExpr):
        evaluate(('div', ('num', 4), ('num', 0)))


def test_power_rules():
    assert evaluate(('pow', ('num', 2), ('num', 3))) == 8
    with pytest.raises(InvalidExpr):                       # exponent negatiu
        evaluate(('pow', ('num', 2), ('sub', ('num', 1), ('num', 3))))
    with pytest.raises(InvalidExpr):                       # 0^0
        evaluate(('pow', ('num', 0), ('num', 0)))
    with pytest.raises(InvalidExpr):                       # exponent massa gran
        evaluate(('pow', ('num', 2), ('num', 99)))


def test_sqrt_rules():
    assert evaluate(('sqrt', ('num', 9))) == 3
    with pytest.raises(InvalidExpr):                       # no és quadrat perfecte
        evaluate(('sqrt', ('num', 8)))
    with pytest.raises(InvalidExpr):                       # negatiu
        evaluate(('sqrt', ('sub', ('num', 1), ('num', 5))))
    with pytest.raises(InvalidExpr):                       # no-op / bucle
        evaluate(('sqrt', ('num', 1)))


def test_cap():
    with pytest.raises(InvalidExpr):
        evaluate(('pow', ('num', 9), ('num', 7)))          # 4_782_969 >= CAP
    assert CAP == 1_000_000
