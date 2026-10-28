"""Emet la bateria de paritat per a js/tests/equacions.test.js (is_valid, eval_lhs, feedback).

Ús (des de la carpeta igualogic):  python -m gen_igualogic.fixtures
"""
import json
import os
import random

from gen_igualogic.equacions import ALPHABET, eval_lhs, feedback, is_valid

OUT = os.path.join("js", "tests", "fixtures", "equacions_fixtures.json")

HANDPICKED = [
    "3*7-4=17", "2+3*4=14", "8/4*3=6", "9-10+6=5", "246/3=82", "7/2=3", "5/0=0",
    "17=17", "05+3=8", "5+3=08", "-3+9=6", "3+4=5+2", "3+4=8", "3++4=7", "3+4=", "=7",
    "3+4==7", "0+0=0", "10-10=0", "0*5=0", "12/4/3=1", "12/4*3=9", "2*3/4=1", "19-92+77=4",
    "6/4*2=3", "3+4=07", "3+4*", "100/10=10", "",
]
PAIRS = [
    ("3*7-4=17", "3*7-4=17"), ("1+1+1=3", "9-3*2=3"), ("11+1=12", "12-1=11"),
    ("77-7=70", "70+7=77"), ("2*2*2=8", "16/2=8"), ("19-92+77=4", "98-16*6=2"),
]


def _random_strings(rnd, n, length):
    return ["".join(rnd.choice(ALPHABET) for _ in range(length)) for _ in range(n)]


def build():
    rnd = random.Random(7)
    eqs = list(HANDPICKED) + _random_strings(rnd, 300, 8)
    # mostres amb forma plausible: nombre op nombre = nombre
    for _ in range(300):
        a, b = rnd.randint(0, 120), rnd.randint(0, 30)
        op = rnd.choice("+-*/")
        v = eval_lhs(f"{a}{op}{b}")
        rhs = v if v is not None and v >= 0 and rnd.random() < 0.6 else rnd.randint(0, 150)
        eqs.append(f"{a}{op}{b}={rhs}")
    valid = [{"eq": e, "valid": is_valid(e), "lhs": eval_lhs(e.split("=")[0])} for e in eqs]
    pairs = list(PAIRS)
    pool = [e for e in eqs if is_valid(e) and len(e) == 8]
    for _ in range(200):
        pairs.append((rnd.choice(pool), rnd.choice(pool)))
    colors = [{"guess": g, "answer": a, "colors": feedback(g, a)} for g, a in pairs if len(g) == len(a)]
    return {"equations": valid, "colors": colors}


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(build(), f, ensure_ascii=False, indent=0)
    print(f"Escrit {OUT}")


if __name__ == "__main__":
    main()
