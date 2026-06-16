# Numerològic — Disseny: Brevi, hexàgons grisos i espectre de dificultat

**Data:** 2026-06-16
**Estat:** Aprovat per l'usuari (pendent revisió final de la spec)
**Autor:** Pau + Claude
**Depèn de:** prototip `research/tutti_enum.py` (enumeració de solucions ancorada a l'objectiu, validada per a regles no-repeat `+−×÷`).

## 1. Context

- El sistema de **punts/rangs** se sent «cec»: el cim del rang («Totes» = 100% dels punts) exigeix trobar totes les solucions llistades (~120), és inabastable i mai es completa; els llindars són números sense forma.
- **No hi havia un objectiu diari concret i completable.** El **tutti** ja existeix (usar tots els dígits, +10 pts) però (a) està amagat al peu i (b) a Numerològic **no és rar**: el rusc d'avui té **447.964 tuttis**.
- Un **prototip** (`research/tutti_enum.py`) ha demostrat que es pot **enumerar/comptar el conjunt complet de solucions** d'un rusc no-repeat ancorant la cerca a l'objectiu (sense l'explosió de memòria del cercador general). Validat: coincideix amb el brute-force per a tots els valors (n=4,5) i amb el generador del joc a k≤4 (el rusc d'avui: **120** a k≤4, **513.586** en total).
- **Dades de magnitud** (rusc d'avui, k≤4): objectius **petits** (1–30) tenen mediana **253** solucions; **grans** (100–999) en tenen **1–2** i **obliguen a encadenar** `×`/`÷`. La banda de selecció actual (40–120 solucions) **força objectius petits i «curts»**.

**Decisió:** afegir el **Brevi** (objectiu de les solucions més curtes) amb **taula de compleció**, suport d'**hexàgons grisos** (dígits variables) i un **espectre de dificultat** al generador. Es **manté** el tutti i el sistema de punts/rangs.

## 2. Concepte

Tres peces d'una mateixa idea: passar del *grinding* obert sobre números fàcils a un **puzle diari amb un conjunt de solucions petit i trobable**.

- **Brevi**: les solucions amb el **mínim nombre d'operands**. Quan són poques (objectius grans o ruscos petits) «troba-les totes» torna a ser un objectiu real, escàs i elegant — l'invers del tutti (premia la solució *més curta*, no la que ho usa *tot*).
- **Hexàgons grisos**: ruscos amb **menys de 7 dígits**; palanca de dificultat que redueix solucions, força encadenament i fa el **tutti rar de nou**.
- **Espectre de dificultat**: el generador dosifica fàcil↔difícil amb tres palanques (magnitud de l'objectiu, nombre de dígits, banda de solucions).

## 3. Definicions precises

- **Brevi**: el conjunt de **totes** les solucions vàlides (= objectiu, inclouen el central, dedup canònica) amb el **nombre d'operands mínim** present al repte. Com que cap solució té menys operands, **tota** solució amb aquest nombre d'operands és, per definició, del Brevi → la pertinença es detecta **només pel recompte d'operands**, sense revelar-ne cap.
- **Hexàgons grisos**: un rusc té `d ∈ [5,7]` **dígits actius**; les `7−d` cel·les restants de la flor 2-3-2 es mostren **grises** i inactives. **El central sempre és actiu.**
- **Tutti** (sense canvis de concepte): expressió vàlida = objectiu que usa **tots els dígits actius**. Amb `d<7` n'hi ha molts menys → recupera raresa.
- **Dificultat**: nivell (Fàcil/Mitjà/Difícil) derivat de les palanques del §6.
- **Conjunt comptat (denominador de rangs)**: solucions enumerades fins a `maxOperands` del repte (vegeu §8); els punts i rangs es calculen sobre aquest conjunt, **com ara**.

## 4. Brevi: objectiu i taula de compleció

- **Taula de compleció** (UI, estil Paraulògic): mostra el Brevi com a **caselles buides** (`◻◻◻ → 0/3`) que s'omplen en trobar cada solució curta, **sense desvelar les que falten**. És l'**objectiu titular** visible, no una pista amagada.
- **Detecció al client**: una solució trobada compta per al Brevi si el seu **nombre d'operands == `brevi.operands`**. El recompte de Brevi trobat = nombre de solucions distintes (canòniques) trobades amb aquest nombre d'operands. Funciona també en mode obert (no cal llista precalculada de Brevi).
- **Estat «Brevi complet»**: quan trobat == `brevi.count` → celebració + bonus (§7) + entra a la **ratxa** (vegeu §9).

## 5. Hexàgons grisos

- **Render** (`ui.renderHive`): la flor 2-3-2 es manté; el central al centre, els dígits actius ocupen cel·les perifèriques i les sobrants es pinten **grises** (classe CSS, no clicables, no reben `onCell`). **Quines** perifèriques queden grises és un detall de layout (per defecte, les últimes posicions; es pot fixar al pla); `⟳ Remena` permuta només els dígits **actius** entre cel·les actives.
- **Lògica de joc** (`game.js`, `validate.js`): cap canvi estructural; el conjunt de dígits és `digits` (només els actius). `usesAllDigits` ja compara amb `digits` → el tutti funciona amb `d<7` sense tocar res.
- **Generador**: pot emetre ruscos amb `d ∈ [5,7]`; `d` és una palanca de dificultat (§6). Ha de seguir garantint `hasTutti` i un Brevi vàlid (§6).

## 6. Espectre de dificultat (generador)

- Cada repte rep una **dificultat** dosificant tres palanques:
  - **magnitud de l'objectiu**: petit (molts) → gran (pocs, encadenat).
  - **nombre de dígits** `d`: 7 (fàcil) → 5 (difícil).
  - **banda de solucions** (conjunt comptat): ampla (fàcil) → estreta (difícil).
- Perfils orientatius (a calibrar):
  - **Fàcil** ≈ avui: `d=7`, objectiu petit, moltes solucions.
  - **Mitjà**: `d=6–7`, objectiu mitjà, solucions moderades.
  - **Difícil**: `d=5–6`, objectiu gran, **poques** solucions, **Brevi ajustat** (p. ex. `brevi.count ∈ [2,5]`), cadenes `×`/`÷`.
- **Selecció de l'objectiu**: en comptes de la banda fixa 40–120 sobre el recompte k≤4, el generador usa l'**enumerador** per triar objectius que compleixin el perfil de dificultat (magnitud + nombre de solucions + Brevi dins de rang).

## 7. Motor: productivització de l'enumerador

- **Nou mòdul a `generator/`** (port de `research/tutti_enum.py`): donat `(digits, target, variant)` no-repeat, enumera **totes** les solucions canòniques (= objectiu, inclouen el central) fins a un límit d'operands, ancorant la cerca a l'objectiu via la DP de valors assolibles (`generator/tutti.py::_reach`). En treu: el **conjunt comptat**, el **Brevi** (`operands` mínim + `count`) i els recomptes de **pistes** (`byLeaves`/`byOp`) reals.
- **Eficient per construcció**: els reptes **fàcils** segueixen pel camí barat existent (k≤4); els **difícils** tenen **poques** solucions → l'enumerador hi és **ràpid**. Mai es paga el cost del cas de 513k en producció.
- **Abast validat**: `+−×÷`, **sense arrel ni potència**. La branca d'arrel de l'enumerador divergeix entre `solver.py` (una √ per nivell) i `tutti.py` (encadena) → **fora d'abast** fins a reconciliar-les. Cap rusc del banc usa arrel.
- `generator/puzzles.py::make_puzzle` i `generator/generate.py` s'estenen per assignar dificultat, escollir `d` i objectiu segons perfil, i incrustar `brevi`/dificultat.

## 8. Model de dades (`puzzles.json`)

Per repte, **afegeix**:
- `digits`: ara de longitud **5–7** (només dígits actius). `centralIndex` hi indexa.
- `brevi`: `{ "operands": m, "count": Y }` — nombre d'operands mínim i quantes solucions hi ha.
- `difficulty`: `"facil" | "mitja" | "dificil"` (explícit; substitueix/alimenta el badge actual).
- `maxOperands`: ara **per repte** (pot ser >4 en reptes difícils perquè el conjunt comptat no quedi buit).

Es **manté**: `target`, `solutions`, `totalPoints`, `ranks`, `hasTutti`, `hints`, `rules`. `solutions`/`totalPoints`/`ranks`/`hints` es calculen sobre el conjunt comptat fins a `maxOperands` (via l'enumerador en reptes difícils).

## 9. Impacte al client

- **`ui.renderHive`**: cel·les grises per a `d<7`.
- **Taula de compleció Brevi**: nou bloc a la UI (a prop de l'objectiu o al peu) amb caselles `trobat/total`. Estat «Brevi complet».
- **`game.js`**: comptar Brevi trobat (solucions amb `leaves == brevi.operands`); estat «brevi complet»; bonus de punts.
- **Ratxa** (nova, persistència local PWA): dies consecutius completant **el Brevi** (ancora de la ratxa). Es guarda en `localStorage` amb clau per data; no requereix backend.
- **Tutti**: **sense canvis** (detecció en viu, +10, indicador).
- **Punts/rangs**: estructura igual; només es **repensa el valor del bonus Brevi** (proposta inicial: +10 per Brevi complet, a calibrar; opcionalment marcar cada solució curta trobada).

## 10. Testing / validació

- **Enumerador productivitzat**: reutilitzar `research/check_tutti_enum.py` (brute-force vs enum per a tots els valors n=4,5; acord d'existència; auto-consistència). Afegir test que, en reptes del banc, el conjunt comptat a k≤4 coincideixi amb el `generate` actual (regressió).
- **Brevi**: test que `brevi.operands` és el mínim real i `brevi.count == byLeaves[min]`.
- **Client (`js/tests`)**: detecció de Brevi per recompte d'operands; estat «brevi complet»; render de cel·les grises; ratxa (incrementa/reinicia segons dies).
- **Generador**: cada repte emès té `hasTutti`, Brevi dins de rang del perfil, i conjunt comptat no buit.

## 11. Cost, límits i fora d'abast

- **Generació**: els reptes difícils (pocs) són ràpids; els fàcils mantenen el cost actual. Regenerar el banc de 60 reptes és viable offline.
- **Fora d'abast**: regles amb **arrel/potència** (pendent de reconciliar semàntica); **par social** (no hi ha backend); una **matriu de compleció de tots els operands** (els tiers llargs tenen 10⁴–10⁵ solucions → només té sentit la taula del Brevi).
- **Deute conegut (preexistent)**: en mode obert, trobar solucions per sobre de `maxOperands` suma punts fora del denominador de rangs (pot superar el 100%). Es **redueix** en reptes difícils (maxOperands més alt) però no es reconcilia ací.
- **Migració**: el nou esquema afegeix camps; cal gestionar progrés desat antic (`localStorage`) amb tolerància (ignorar camps absents).

## 12. Ordre de construcció

1. **Productivitzar l'enumerador** a `generator/` + tests (port de `tutti_enum.py`).
2. **Generador**: espectre de dificultat + dígits variables (grisos) + extracció de Brevi + nova selecció d'objectiu.
3. **Regenerar `puzzles.json`** amb el nou esquema.
4. **Client**: render de grisos + taula de compleció Brevi + ratxa + bonus Brevi (tutti i punts intactes).
