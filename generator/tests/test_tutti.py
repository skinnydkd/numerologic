from generator.tutti import tutti_exists


def test_pair_reachable_sum():
    assert tutti_exists([2, 3], 5) is True   # 2 + 3


def test_pair_reachable_pow():
    assert tutti_exists([2, 3], 9) is True   # 3 ** 2


def test_pair_unreachable():
    # amb 2 i 3 (cadascun una vegada) no es pot fer 7
    assert tutti_exists([2, 3], 7) is False


def test_requires_using_all_digits():
    # per fer 2 nomes caldria el 2, pero el tutti exigeix usar TOTS els digits
    assert tutti_exists([2, 3], 2) is False


def test_seven_digits_sum():
    assert tutti_exists([1, 2, 3, 4, 5, 6, 7], 28) is True  # 1+2+3+4+5+6+7
