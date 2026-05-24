# Contracte de la forma canònica

Tant el generador Python (`generator/engine.py::canonical`) com el client JS
(`js/canonical.js`) han de produir **exactament** aquesta cadena per a cada AST.
La cadena és la clau de deduplicació de solucions; qualsevol divergència trenca
el recompte de solucions del joc.

## Nodes de l'AST
- `num(d)` → `"d"`  (ex: `3` → `"3"`)
- `sqrt(x)` → `"r(" + C(x) + ")"`
- `sub(a,b)` → `"(- " + C(a) + " " + C(b) + ")"`
- `div(a,b)` → `"(/ " + C(a) + " " + C(b) + ")"`
- `pow(a,b)` → `"(^ " + C(a) + " " + C(b) + ")"`
- `add(...)` → aplana fills `add` imbricats; ordena les seves cadenes canòniques;
  `"(+ " + parts.join(" ") + ")"`
- `mul(...)` → igual amb `"(* "`.

`C(x)` = cadena canònica del subarbre `x`.

## Ordenació
Ordre lexicogràfic per **punt de codi Unicode**. Per a les cadenes ASCII que
produïm, coincideix amb `sorted()` per defecte de Python i amb
`Array.prototype.sort()` per defecte de JS. No usar comparadors de localització.

## Exemples (casos de paritat)
| AST | Cadena canònica |
|---|---|
| `mul(mul(3,4),2)` | `(* 2 3 4)` |
| `add(add(1,2),3)` | `(+ 1 2 3)` |
| `sub(5,3)` | `(- 5 3)` |
| `div(8,4)` | `(/ 8 4)` |
| `pow(2,3)` | `(^ 2 3)` |
| `sqrt(9)` | `r(9)` |
| `mul(3,8)` ≠ `mul(4,6)` | `(* 3 8)` ≠ `(* 4 6)` |

El Pla 2 (client) inclourà tests de paritat que comparen aquestes mateixes
entrades contra la sortida del generador.
