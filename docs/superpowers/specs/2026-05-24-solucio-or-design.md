# Numerològic — Disseny: la "Solució d'Or"

**Data:** 2026-05-24
**Estat:** Aprovat per l'usuari
**Autor:** Pau + Claude
**Substitueix:** el concepte *Numerogram* del disseny original (§5 de `2026-05-24-numerologic-design.md`).

## 1. Context i motivació

El disseny original definia el **Numerogram** com l'equivalent del *tutti*/pangrama del
Paraulògic: una solució que usa **els 7 dígits diferents** del rusc, amb +10 punts i destacat
especial.

En implementar el motor s'han descobert dos problemes que invaliden aquest concepte:

1. **Contradicció del disseny original.** La regla de validació 1 limita una expressió a
   **2–6 operands**, però usar 7 dígits diferents requereix **com a mínim 7 operands**. El
   Numerogram era, per tant, **inassolible des del principi** (codi mort: el bonus mai
   s'activava).
2. **Límit de memòria del cercador.** El cercador exhaustiu (`generator/solver.py`) es queda
   **sense memòria** (`MemoryError`) ja amb `max_leaves=5` sobre 7 dígits. Per generar el pool
   de manera viable s'ha decidit fixar **`max_leaves=4`** (decisió de l'usuari). Això redueix
   encara més els dígits diferents que pot tocar una expressió (màxim 4 dels 7), de manera que
   un *tutti* literal és impossible.

**Decisió de l'usuari:** no perseguir el *tutti* literal ("usa tots els dígits"), sinó conservar
la **sensació** que el fa especial: una **fita-cim rara i molt premiada**. El resultat és la
**Solució d'Or**.

## 2. Concepte

Cada repte té una **Solució d'Or**: la solució (o poques) que val **més punts** del dia — la més
llarga i elaborada. Trobar-la dóna un **destacat daurat**, una **celebració** i un **bonus de
punts**. És el cim natural del repte, equivalent funcional del *tutti*.

## 3. Definició precisa

- **Punts base** d'una solució: `operands + (2 si l'expressió usa ^ o √, altrament 0)`.
- És **d'Or** tota solució que arribe al **màxim de punts base** del repte.
- Cada solució d'or rep **+5 punts** de bonus (a sobre dels seus punts base).

Amb el cap actual de 4 operands, el màxim de punts base possible és `4 + 2 = 6` (una expressió de
4 operands que usa potència o arrel). L'assoleixen molt poques expressions, cosa que garanteix la
**raresa** del cim.

## 4. Puntuació i rangs

- `total = Σ(punts base de totes les solucions) + 5 × (nombre de solucions d'or)`.
- Els llindars de rang (Principiant → Totes) es calculen sobre aquest `total`, igual que ara
  (`build_ranks`).
- La Solució d'Or **no** és requisit de cap rang; només suma punts i atorga la fita visual.

## 5. Model de dades (`puzzles.json`)

El dict d'un repte afegeix un camp:

- `goldenSolutions`: llista (ordenada) de **cadenes canòniques** que són d'or.

`solutions` segueix sent una llista de cadenes canòniques (totes les solucions). El client
compara cada encert amb `goldenSolutions` per decidir si el pinta de daurat.

## 6. Impacte al client (Pla 2)

Quan el jugador encerta una solució present a `goldenSolutions`:
- es mostra amb estil **daurat**,
- es dispara una **animació/celebració** especial ("Has trobat la Solució d'Or!").

La resta del client (rusc, recompte, rangs) no canvia respecte al disseny original.

## 7. Canvis al codi (Pla 1, Tasca 4 — `generator/puzzles.py`)

`puzzles.py` ja està implementada amb la lògica del Numerogram; cal substituir-la:

- `solution_points(leaves, uses_pow_sqrt, is_golden)`: el tercer bonus passa de **+10
  (numerogram)** a **+5 (or)**.
- `make_puzzle`:
  1. calcular els punts base de cada solució de l'objectiu triat,
  2. determinar el **màxim** de punts base,
  3. marcar com a d'or les solucions amb aquest màxim,
  4. sumar `+5` a cadascuna i acumular el `total`,
  5. afegir `goldenSolutions` (cadenes canòniques d'or, ordenades) a la sortida.
- Actualitzar `generator/tests/test_puzzles.py` (renombrar/ajustar els tests del bonus i afegir
  cobertura de `goldenSolutions` i del càlcul del total amb bonus).

La forma canònica (`engine.py::canonical`) i el seu contracte **no canvien**.

## 8. Límit conegut (acceptat)

Si un dia **totes** les solucions empaten en punts base (p. ex. cap usa `^`/`√` i totes tenen la
mateixa longitud), totes serien "d'or". És improbable amb longituds variades. Si en generar el
pool el conjunt d'or ix massa gran, s'afinarà el criteri (p. ex. exigir que l'or use `^`/`√`). De
moment es deixa la definició simple del §3.
