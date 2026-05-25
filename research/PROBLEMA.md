# El problema del cercador — repte obert

Aquest document enuncia, en termes **matemàtics** (independents del llenguatge), el problema central per millorar Numerològic. Es pot atacar i prototipar amb qualsevol eina — **Mathematica** és ideal. La integració final al joc (en Python) és un pas a part.

## Definicions

- **Rusc**: un multiconjunt de **7 dígits** `D` triats de l'1 al 9 (es poden **reutilitzar** dins d'una expressió).
- **Expressió**: un arbre on les **fulles** són dígits de `D` i els **nodes** són operacions binàries `{+, −, ×, ÷, ^}` (potència) més l'operador **unari** `√` (arrel). El nombre de fulles és el nombre d'**operands** `k`.
- **Validesa** (regles del joc, a `generator/engine.py`):
  - Divisió **exacta** (resultat enter): `8÷4` ✓, `7÷2` ✗.
  - Arrel **exacta** d'un enter `≥ 2`: `√9` ✓, `√8` ✗, `√1`/`√0` ✗.
  - Potència amb **exponent enter** `0 ≤ e ≤ 19`, i no `0^0`.
  - Tot valor (intermedi **i** final) compleix `|v| < 1.000.000`.
  - Els intermedis poden ser negatius.
- **Equivalència canònica**: dues expressions són **la mateixa solució** si tenen la mateixa **forma canònica**. `+` i `×` són commutatius/associatius (s'**aplanen i s'ordenen** els fills); `−`, `÷`, `^`, `√` **no** es reordenen. La definició formal de la cadena canònica és a [`docs/superpowers/specs/canonical-format.md`](../docs/superpowers/specs/canonical-format.md). Exemple: `3×4×2` ≡ `2×4×3` (mateixa), però `3×8` ≢ `4×6` (diferents).
- Una **solució** és, doncs, una **classe d'equivalència canònica** d'expressions vàlides.

## El problema computacional

La funció `generate(D, k)` ha de produir **totes les solucions** amb fins a `k` operands, agrupades pel seu **valor**. L'enfoc actual (`generator/solver.py`) fa programació dinàmica sobre multiconjunts de dígits i **emmagatzema totes les classes canòniques** trobades. El nombre de classes creix de manera explosiva i a `k ≥ 5` es queda **sense memòria**.

Per llançar el joc s'ha capat a `k = 4`.

## Què es demana

Un **algorisme** (i un **prototip en Mathematica**) que, per a un rusc de 7 dígits, **enumeri o compti les solucions distintes** per a `k = 5, 6, 7` de manera **eficient en memòria** (i en temps raonable), respectant les definicions de dalt.

- Si s'aconsegueix **comptar** de manera fiable (amb representants recuperables), ja és un gran avenç.
- L'ideal: arribar a `k = 7`, perquè aleshores el **tutti** (una solució que usa els 7 dígits diferents) forma part natural de les solucions.

## Com validar

A [`reference-data.md`](reference-data.md) hi ha els **recomptes exactes** que produeix el cercador actual per a casos petits (`k = 2, 3, 4`). Qualsevol prototip nou ha de **reproduir aquests mateixos números**. El script `research/gen_reference.py` els regenera.

## Pistes / direccions (obert)

- El cost és en les **claus de deduplicació canòniques**: el repte és comptar classes canòniques distintes **sense materialitzar-les totes**.
- `generator/tutti.py` mostra una tècnica **lleugera en memòria**: una DP de **valors assolibles** (conjunts d'enters), no d'expressions. La dificultat és estendre la idea a l'**enumeració/comptatge de solucions canòniques**.
- **Subobjectiu pràctic**: el joc només necessita les solucions dels **valors objectiu** amb **40–120 solucions** que usen un **dígit central** concret — no de tots els valors. Potser es pot evitar enumerar-ho tot.
- Altres camins: *meet-in-the-middle* sobre subconjunts de dígits, funcions generatrius, representacions compactes (el domini de valors és `|v| < 10^6`), comptatge probabilístic…

## Repartiment de feina suggerit

En Juan ataca l'**algorisme** (prototip en Mathematica, validat contra `reference-data.md`); el **port a Python** dins de `generator/solver.py` el fem després conjuntament. Per a la part de GitHub, n'hi ha prou que pugi el **notebook de Mathematica** i/o un writeup a `research/` via una branca i un Pull Request (vegeu [`CONTRIBUTING.md`](../CONTRIBUTING.md)).
