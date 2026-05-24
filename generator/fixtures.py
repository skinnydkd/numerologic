"""Emet la bateria de fixtures de paritat per als tests JS (canonical + evaluate)."""
import json
import os

from generator.engine import canonical, evaluate, InvalidExpr
from generator.solver import generate

# Casos triats a ma: exemples del contracte + limits d'invalidesa.
HANDPICKED = [
    ("num", 3),
    ("sqrt", ("num", 9)),
    ("sub", ("num", 5), ("num", 3)),
    ("div", ("num", 8), ("num", 4)),
    ("pow", ("num", 2), ("num", 3)),
    ("mul", ("mul", ("num", 3), ("num", 4)), ("num", 2)),
    ("add", ("add", ("num", 1), ("num", 2)), ("num", 3)),
    ("mul", ("num", 3), ("num", 8)),
    ("mul", ("num", 4), ("num", 6)),
    # invalids
    ("div", ("num", 7), ("num", 2)),                       # divisio inexacta
    ("div", ("num", 4), ("num", 0)),                       # divisio per zero
    ("sqrt", ("num", 8)),                                  # arrel no exacta
    ("sqrt", ("num", 1)),                                  # arrel de 1 (exclос)
    ("pow", ("num", 0), ("num", 0)),                       # 0^0
    ("pow", ("num", 9), ("num", 7)),                       # >= CAP
    ("add", ("num", 999999), ("num", 1)),                  # add >= CAP
    ("mul", ("num", 999), ("num", 9999)),                  # mul >= CAP
    ("sub", ("num", 0), ("num", 1000000)),                 # sub <= -CAP
    ("pow", ("num", 2), ("sub", ("num", 1), ("num", 3))),  # exponent negatiu
]


def _case(ast):
    try:
        value = evaluate(ast)
        valid = True
    except InvalidExpr:
        value = None
        valid = False
    return {"ast": ast, "canonical": canonical(ast), "value": value, "valid": valid}


def build_cases():
    cases = [_case(ast) for ast in HANDPICKED]
    # mostra d'ASTs reals d'un cercat petit (deterministes)
    for _c, m in list(generate([2, 3, 5], max_leaves=3).items())[:50]:
        cases.append(_case(m["ast"]))
    return cases


def main():
    out = os.path.join("js", "tests", "fixtures", "canonical_fixtures.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    cases = build_cases()
    with open(out, "w", encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)
    print(f"Escrits {len(cases)} casos a {out}")


if __name__ == "__main__":
    main()
