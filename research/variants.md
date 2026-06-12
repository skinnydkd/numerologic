# Variants de l'esquema: experiments d'acotació

Proves exploratòries per veure si **canviar les regles del rusc** redueix l'explosió
combinatòria descrita a [`PROBLEMA.md`](PROBLEMA.md). Totes parteixen del cercador
actual (`generator/solver.py`) sobre el rusc complet `{1,2,3,4,5,6,7}` i es comparen
contra les [dades de referència](reference-data.md).

> **Línia base** (regles actuals: es poden **repetir** dígits, ops completes `+ − × ÷ ^ √`):
> `k=2` → 276 classes · `k=3` → 16.075 · `k=4` → **1.111.167** · `k≥5` → sense memòria.

## Variant A — sense repetir dígits (ops completes)

Cada dígit del rusc s'usa **com a molt un cop** dins de l'expressió
(`combinations` en lloc de `combinations_with_replacement` al nivell superior).
Manté totes les operacions `{+ − × ÷ ^ √}`.

| k | classes canòniques | valors | temps | memòria |
|---|---|---|---|---|
| 2 | 214 | 57 | 0,01 s | 0,1 MB |
| 3 | 8.395 | 609 | 0,57 s | 5,3 MB |
| 4 | 298.620 | 5.039 | 27,2 s | 191,7 MB |
| 5 | — | — | — | **MemoryError** |

Redueix les classes a `k=4` ~3,7× respecte la base (1.111.167 → 298.620), però
**a `k=5` segueix petant per memòria**.

## Variant B — sense `^` ni `√` (amb repeticions, com avui)

Es manté la repetició de dígits però es retalla el conjunt d'operacions a
`{+ − × ÷}` (sense potència ni arrel).

| k | classes canòniques | valors | temps |
|---|---|---|---|
| 4 | 148.489 | 624 | 3,25 s |
| 5 | 6.416.403 | 2.635 | ~34 min (2.047 s) |

Acota més que la variant A a `k=4` (~7,5× respecte la base), i **sí que arriba a
`k=5`**, però amb 6,4M de classes i ~34 min: el creixement segueix sent explosiu i
inviable per a producció en temps real.

## Conclusió

Cap de les dues variants **resol** el problema de fons de [`PROBLEMA.md`](PROBLEMA.md):

- Retallar operacions o prohibir repeticions **redueix** l'espai (factor ~4–8× a
  `k=4`), però no canvia el règim d'explosió: la variant A es queda sense memòria a
  `k=5` igual que la base, i la variant B hi arriba només a costa de minuts de càlcul.
- El coll d'ampolla continua sent **materialitzar totes les classes canòniques**, no
  el conjunt d'operacions. Cal l'algorisme eficient-en-memòria que es demana a
  `PROBLEMA.md` (comptatge sense materialitzar, meet-in-the-middle, etc.).

Per tant aquestes palanques (repetició sí/no, ops completes/reduïdes) són útils com a
**eixos de dificultat del joc**, no com a solució al problema computacional.

## Reproduir

Scripts a `research/` (s'executen des de l'arrel del repo, `python -m research.<nom>`):

- `exp_no_repeat.py` — variant A, `k=2..7`.
- `exp_no_pow_sqrt.py` — variant B, `k=4,5`.
