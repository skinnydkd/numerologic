"""Genera dades de referència (ground truth) per validar prototips del cercador.

Executa amb:  python -m research.gen_reference   (des de l'arrel del repositori)

Per a cada (dígits, max_leaves) imprimeix:
  - solucions_canòniques: nombre de classes d'equivalència canònica vàlides
  - valors_distints: nombre de valors enters diferents que s'hi assoleixen
Un prototip nou (p. ex. en Mathematica) ha de reproduir aquests mateixos números.
"""
from generator.solver import generate

CASES = [
    ([3, 4], 2),
    ([3, 4], 3),
    ([2, 3, 5], 3),
    ([2, 3, 5], 4),
    ([1, 2, 3, 4, 5, 6, 7], 2),
    ([1, 2, 3, 4, 5, 6, 7], 3),
    ([1, 2, 3, 4, 5, 6, 7], 4),
]


def main():
    print("digits | max_leaves | solucions_canòniques | valors_distints")
    for digits, k in CASES:
        sols = generate(digits, max_leaves=k)
        values = {m["value"] for m in sols.values()}
        print(f"{digits} | {k} | {len(sols)} | {len(values)}")

    # Exemple petit, comprovable a mà: totes les solucions de {3,4} amb 2 operands.
    print("\nExemple {3,4}, max_leaves=2 (canònica -> valor):")
    for c, m in sorted(generate([3, 4], max_leaves=2).items()):
        print(f"  {c} = {m['value']}")


if __name__ == "__main__":
    main()
