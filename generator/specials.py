"""Reptes especials: un objectiu temàtic per a dies assenyalats (π, Nadal, 11/11…).

Cada especial substitueix el repte del banc a l'índex del seu dia, (data − startDate) % len,
i hi afegeix `special: {title}` (el client el mostra i l'afegeix al text de compartir).
Dígits i central fixats a mà (comprovats: ≥4 solucions comptades i tutti) perquè la
generació sigui determinista i ràpida.

CLI: python -m generator.specials   (reescriu data/puzzles.json)
"""
import datetime as dt
import json
import os
import sys
from dataclasses import dataclass

from generator.engine import Variant
from generator.puzzles import make_special_puzzle

BASIC = Variant(ops=("add", "sub", "mul", "div"), use_sqrt=False, allow_repeat=False)


@dataclass(frozen=True)
class Special:
    date: dt.date
    title: str
    target: int
    digits: list
    central_index: int
    count_operands: int = 4
    difficulty: str = "dificil"
    note: str = ""        # cartell explicatiu (el guiny a la data)
    hex: str = ""         # color de les cel·les del rusc (buit = el de sempre)
    center: str = ""      # color de la cel·la central


D = dt.date
SPECIALS = [
    Special(D(2026, 10, 31), "🎃 Castanyada", 31, [1, 2, 4, 6, 7, 8, 9], 6, difficulty="mitja",
            note="Bona Castanyada! Avui és 31 d'octubre i l'objectiu és el 31.",
            hex="#d97706", center="#7c2d12"),
    Special(D(2026, 11, 11), "11/11", 1111, [3, 4, 5, 6, 7, 8, 9], 4, count_operands=6,
            note="11/11: el dia amb més uns de l'any. Arriba a 1111! Repte gros: calen 5 operands o més.",
            hex="#6366f1", center="#312e81"),
    Special(D(2026, 11, 21), "💯 Repte #100", 100, [1, 3, 4, 5, 6, 9], 1,
            note="Avui és el repte número 100 del Numerològic. Gràcies per jugar! Arriba a 100.",
            hex="#ca8a04", center="#b45309"),
    Special(D(2026, 11, 23), "🌀 Dia de Fibonacci", 233, [1, 2, 3, 6, 8, 9], 2, count_operands=6,
            note="23/11 → 1, 1, 2, 3: comença la successió de Fibonacci. I 233 també n'és un terme (…89, 144, 233).",
            hex="#059669", center="#065f46"),
    Special(D(2026, 12, 12), "12/12", 1212, [2, 4, 5, 6, 7, 8, 9], 5, count_operands=6,
            note="12/12: el dia i el mes coincideixen. Arriba a 1212! Repte gros: calen 6 operands.",
            hex="#0284c7", center="#1e3a8a"),
    Special(D(2026, 12, 25), "🎄 Nadal", 2512, [1, 2, 5, 6, 7, 8, 9], 2, count_operands=6,
            note="Bon Nadal! 25/12 → 2512, amb el 5 al centre. Repte gros: calen 5 operands o més.",
            hex="#15803d", center="#dc2626"),
    Special(D(2027, 1, 1), "🎆 2027 · llegendari", 2027, [1, 2, 3, 4, 7, 8, 9], 4, count_operands=7,
            note="Feliç 2027! Repte llegendari: arriba a 2027 amb el 7 al centre. Les solucions més curtes ja tenen 6 operands.",
            hex="#374151", center="#ca8a04"),
    Special(D(2027, 2, 7), "e · 7/2/27", 271, [1, 2, 3, 4, 5, 6, 7], 1, count_operands=6,
            note="7/2/27 es llegeix igual del revés (7-2-2-7), i 2,71 és el començament del nombre e. Arriba a 271.",
            hex="#8b5cf6", center="#db2777"),
    Special(D(2027, 3, 14), "π Dia del Pi", 314, [1, 2, 3, 4, 5, 6, 9], 2, count_operands=6,
            note="14/3 és el Dia del Pi i de les Matemàtiques. El rusc són les xifres de π (3,1415926), el 3 al centre, i l'objectiu és 314.",
            hex="#3b82f6", center="#ec5a52"),
    Special(D(2027, 4, 23), "🌹 Sant Jordi", 234, [1, 2, 3, 4, 5, 6, 8], 3,
            note="Bona diada de Sant Jordi! 23/4 → 234, i al rusc hi ha el 2, el 3 i el 4.",
            hex="#16a34a", center="#dc2626"),
    Special(D(2027, 6, 28), "τ Dia de Tau", 628, [1, 3, 4, 6, 7, 8, 9], 3, count_operands=6,
            note="τ = 2π ≈ 6,28, i avui és 28/6: el Dia de Tau. Arriba a 628 amb el 6 al centre.",
            hex="#0d9488", center="#7c3aed"),
    Special(D(2027, 7, 22), "π ≈ 22/7", 227, [1, 2, 3, 4, 5, 6, 7], 6, count_operands=6,
            note="22/7 = 3,142…: la fracció clàssica per aproximar π. Avui és 22/7: arriba a 227 amb el 7 al centre.",
            hex="#4f46e5", center="#ec5a52"),
]


def special_index(pool, date):
    """Índex del banc que toca el dia `date` (mateixa fórmula que js/modes.js)."""
    start = dt.date.fromisoformat(pool["startDate"])
    return (date - start).days % len(pool["puzzles"])


def build(sp):
    pz = make_special_puzzle(sp.digits, sp.central_index, sp.target, variant=BASIC,
                             difficulty=sp.difficulty, count_operands=sp.count_operands)
    if pz is None or len(pz["solutions"]) < 4:
        raise ValueError(f"especial {sp.date} ({sp.target}) no és viable amb {sp.digits}")
    return pz


def apply_specials(pool, specials=None, build=build):
    """Substitueix al banc el repte de cada dia especial. Modifica `pool` i el retorna."""
    for sp in specials if specials is not None else SPECIALS:
        pz = build(sp)
        pz["special"] = {"title": sp.title, "note": sp.note, "hex": sp.hex, "center": sp.center}
        pool["puzzles"][special_index(pool, sp.date)] = pz
    return pool


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # els títols porten emojis (la consola de Windows és cp1252)
    path = os.path.join("data", "puzzles.json")
    with open(path, encoding="utf-8") as f:
        pool = json.load(f)
    for sp in SPECIALS:
        print(f"{sp.date} #{special_index(pool, sp.date) + 1} {sp.title} → {sp.target}", flush=True)
    apply_specials(pool)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(pool, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Aplicats {len(SPECIALS)} especials a {path}")


if __name__ == "__main__":
    main()
