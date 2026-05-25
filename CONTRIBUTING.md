# Contribuir a Numerològic

Numerològic és un *Paraulògic matemàtic*: cada dia, un **objectiu** (un número) i un **rusc de 7 dígits**; cal descobrir totes les expressions matemàtiques vàlides que hi arriben.

## Estructura del projecte

- `generator/` — **Python**: motor matemàtic i generador del pool de reptes.
  - `engine.py` — avaluació d'expressions + **forma canònica** (regles de validesa).
  - `solver.py` — cercador exhaustiu de solucions (DP sobre multiconjunts de dígits).
  - `tutti.py` — existència del *tutti* (cerca per valors assolibles).
  - `puzzles.py` — construcció d'un repte (objectiu, punts, rangs, pistes).
  - `generate.py` — CLI que escriu `data/puzzles.json`.
  - `tests/` — proves amb **pytest**.
- `js/` — **client web** (ES modules, sense build): `parser`, `evaluator`, `canonical`, `validate`, `score`, `game`, `storage`, `modes`, `ui`, `app`, `share`, `difficulty`. Proves amb **`node:test`**.
- `docs/superpowers/` — especificacions (`specs/`) i plans (`plans/`) de disseny.

## Com executar les proves

**Python** (3.11+):

```bash
pip install -r requirements-dev.txt
python -m pytest
```

**JavaScript** (Node 18+):

```bash
node --test
```

## Contracte crític: la forma canònica

La **forma canònica** (`generator/engine.py::canonical` i `js/canonical.js`) ha de produir **exactament la mateixa cadena** als dos costats — és la clau de deduplicació de solucions; qualsevol divergència trenca el recompte del joc. El contracte és a `docs/superpowers/specs/canonical-format.md`, i hi ha **tests de paritat** (`js/tests/parity.test.js`) que el comproven contra una bateria generada per Python (`generator/fixtures.py`).

## Flux de treball amb GitHub

1. Crea una **branca** des de `main` (`git checkout -b la-meva-millora`).
2. Fes els canvis, **amb tests**.
3. Obre un **Pull Request**: la **CI** (GitHub Actions) executa `pytest` i `node --test` automàticament i marca verd/vermell.
4. Quan les proves passin i es revisi, es fa **merge** a `main`.

> No facis mai `push` directe a `main`.

## Problema obert

Hi ha un repte matemàtic/algorísmic obert per millorar el joc: optimitzar el cercador (`generator/solver.py`) perquè suporti més operands sense esgotar la memòria. Vegeu les *issues* del repositori.
