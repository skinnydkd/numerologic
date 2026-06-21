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


def test_single_digit():
    # cas n==1: el dígit mateix és l'únic valor assolible
    assert tutti_exists([5], 5) is True
    assert tutti_exists([5], 6) is False


def test_tutti_via_final_sqrt():
    # sqrt(3**2) = 3, usant tots dos dígits -> exercita el camí d'sqrt final inline
    assert tutti_exists([2, 3], 3) is True


def test_meaningful_tutti_excludes_trivial_one():
    from generator.tutti import meaningful_tutti_exists, tutti_exists
    from generator.engine import Variant
    V = Variant(('add', 'sub', 'mul', 'div'), False, False)
    # 14 amb {1,2,7}: només 2*7*1 (trivial). Cap tutti amb l'1 sumat/restat val 14.
    assert tutti_exists((1, 2, 7), 14, V) is True
    assert meaningful_tutti_exists((1, 2, 7), 14, V) is False
    # 10 = 1+2+7: tutti real.
    assert meaningful_tutti_exists((1, 2, 7), 10, V) is True


def test_meaningful_equals_tutti_when_no_one():
    from generator.tutti import meaningful_tutti_exists, tutti_exists
    from generator.engine import Variant
    V = Variant(('add', 'sub', 'mul', 'div'), False, False)
    for tgt in (12, 14, 20):
        assert meaningful_tutti_exists((2, 3, 7), tgt, V) == tutti_exists((2, 3, 7), tgt, V)
