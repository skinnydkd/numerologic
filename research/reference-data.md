# Dades de referència (ground truth)

Números exactes que produeix el cercador actual (`generator/solver.py`). **Qualsevol prototip nou ha de reproduir-los.** Regenera-ho amb:

```bash
python -m research.gen_reference
```

## Recompte de solucions

| dígits | max_leaves (k) | solucions canòniques | valors distints |
|---|---|---|---|
| `{3,4}` | 2 | 45 | 18 |
| `{3,4}` | 3 | 1.145 | 107 |
| `{2,3,5}` | 3 | 899 | 127 |
| `{2,3,5}` | 4 | 23.230 | 891 |
| `{1,2,3,4,5,6,7}` | 2 | 276 | 61 |
| `{1,2,3,4,5,6,7}` | 3 | 16.075 | 829 |
| `{1,2,3,4,5,6,7}` | 4 | **1.111.167** | 8.747 |

L'explosió es veu clara amb 7 dígits: **276 → 16.075 → 1.111.167** classes canòniques per a `k = 2, 3, 4`. A `k = 5` l'enfoc actual ja no cap en memòria — aquest és el règim sense resoldre.

## Exemple comprovable a mà: `{3, 4}` amb `k = 2`

Les **45** solucions (forma canònica → valor). Nota: es permet **reutilitzar** dígits (p. ex. `(* 3 3)`), `r(x)` és `√x`, i `+`/`×` estan ordenats canònicament.

```
(* 3 3) = 9        (+ 3 3) = 6        (- 3 3) = 0        (/ 3 3) = 1
(* 3 4) = 12       (+ 3 4) = 7        (- 3 4) = -1       (/ 4 4) = 1
(* 3 r(4)) = 6     (+ 3 r(4)) = 5     (- 3 r(4)) = 1     (/ 4 r(4)) = 2
(* 4 4) = 16       (+ 4 4) = 8        (- 4 3) = 1        (/ r(4) r(4)) = 1
(* 4 r(4)) = 8     (+ 4 r(4)) = 6     (- 4 4) = 0
(* r(4) r(4)) = 4  (+ r(4) r(4)) = 4  (- 4 r(4)) = 2
                                      (- r(4) 3) = -1
                                      (- r(4) 4) = -2
                                      (- r(4) r(4)) = 0

(^ 3 3) = 27       (^ 4 3) = 64       (^ r(4) 3) = 8
(^ 3 4) = 81       (^ 4 4) = 256      (^ r(4) 4) = 16
(^ 3 r(4)) = 9     (^ 4 r(4)) = 16    (^ r(4) r(4)) = 4

r((* 3 3)) = 3     r((^ 3 4)) = 9     r((^ 4 4)) = 16    r((^ r(4) 4)) = 4
r((* 4 4)) = 4     r((^ 3 r(4))) = 3  r((^ 4 r(4))) = 4  r((^ r(4) r(4))) = 2
r((* r(4) r(4))) = 2  r((^ 4 3)) = 8
r((+ r(4) r(4))) = 2
```

(Total: 45 classes canòniques, 18 valors distints.)
