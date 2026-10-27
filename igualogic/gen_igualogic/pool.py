"""Selecció de respostes interessants i dificultat per a Igualògic.

Dificultat: com d'amagada queda la resposta després d'una bona obertura.
  puntuació = ln(respostes que donen els mateixos colors que ella a l'obertura)
              + 0,6 × (operadors − 1)
Els llindars són els terciles de la puntuació sobre totes les respostes possibles:
terç baix fàcil, terç mitjà mitjà, terç alt difícil.
"""
import math
import random
import re
from collections import Counter

from gen_igualogic.equacions import feedback, enumerate_equations, eval_lhs, is_valid

_NUM = re.compile(r"\d+")
_OP = re.compile(r"[+\-*/]")
ORDER = ("facil", "mitja", "dificil")


def is_interesting(eq):
    """Resposta digna de repte: sense zeros com a operand, sense ×1 ni ÷1, amb 1–3 operadors."""
    lhs, _ = eq.split("=")
    nums = _NUM.findall(lhs)
    ops = _OP.findall(lhs)
    if not 1 <= len(ops) <= 3:
        return False
    if any(n == "0" for n in nums):
        return False
    for i, op in enumerate(ops):
        if op in "*/" and (nums[i] == "1" or nums[i + 1] == "1"):
            return False
    return True


def interesting_equations(length):
    return [e for e in enumerate_equations(length) if is_interesting(e)]


def choose_opener(candidates, sample=300, seed=1):
    """Obertura que reparteix millor una mostra de respostes en grups de colors."""
    rnd = random.Random(seed)
    probe = rnd.sample(candidates, min(sample, len(candidates)))
    target = rnd.sample(candidates, min(2000, len(candidates)))
    return max(probe, key=lambda g: (len({feedback(g, c) for c in target}), g))


def difficulty_scores(candidates, opener):
    groups = Counter(feedback(opener, c) for c in candidates)
    return {
        c: math.log(groups[feedback(opener, c)]) + 0.6 * (len(_OP.findall(c)) - 1)
        for c in candidates
    }


def tercile_labels(scores):
    vals = sorted(scores.values())
    lo, hi = vals[len(vals) // 3], vals[2 * len(vals) // 3]
    return {c: ("facil" if s < lo else "mitja" if s < hi else "dificil") for c, s in scores.items()}


def random_maxi(rnd, length=10, tries=200000):
    """Una resposta de `length` caràcters per mostreig (l'espai complet és massa gran per enumerar)."""
    for _ in range(tries):
        n_ops = rnd.choice((2, 2, 3))
        parts = [str(rnd.randint(2, 99))]
        for _ in range(n_ops):
            parts.append(rnd.choice("+-*/"))
            parts.append(str(rnd.randint(2, 99)))
        lhs = "".join(parts)
        v = eval_lhs(lhs)
        if v is None or v < 0:
            continue
        eq = f"{lhs}={v}"
        if len(eq) == length and is_interesting(eq):
            return eq
    raise RuntimeError("no s'ha trobat cap resposta Maxi")


def build_pool(count, length=8, seed=0, start_date="2026-10-26", maxi_length=10):
    """`count` reptes que alternen fàcil, mitjà i difícil, sense repetir resposta.

    Els diumenges (segons `start_date` + índex) el repte és Maxi: `maxi_length` caràcters.
    Convé que `count` siga múltiple de 7 perquè, en tornar a començar el pool, els Maxi
    continuen caient en diumenge.
    """
    from datetime import date, timedelta
    rnd = random.Random(seed)
    cands = interesting_equations(length)
    opener = choose_opener(cands)
    labels = tercile_labels(difficulty_scores(cands, opener))
    buckets = {k: sorted(c for c in cands if labels[c] == k) for k in ORDER}
    for k in ORDER:
        rnd.shuffle(buckets[k])
    start = date.fromisoformat(start_date)
    puzzles, used = [], set()
    normal = 0
    for i in range(count):
        if maxi_length and (start + timedelta(days=i)).weekday() == 6:
            eq = random_maxi(rnd, maxi_length)
            while eq in used:
                eq = random_maxi(rnd, maxi_length)
            used.add(eq)
            puzzles.append({"eq": eq, "difficulty": "dificil", "maxi": True})
            continue
        k = ORDER[normal % 3]
        normal += 1
        if not buckets[k]:
            break
        eq = buckets[k].pop()
        used.add(eq)
        puzzles.append({"eq": eq, "difficulty": k})
    return {"startDate": start_date, "puzzles": puzzles}
