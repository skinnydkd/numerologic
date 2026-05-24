# Numerològic — Disseny: el Tutti real (Numerogram)

**Data:** 2026-05-24
**Estat:** Aprovat per l'usuari (pendent revisió final de la spec)
**Autor:** Pau + Claude
**Substitueix:** `2026-05-24-solucio-or-design.md` (la "Solució d'Or" no resultava rara amb dades reals).

## 1. Context

Recorregut fins ací:
- El **Numerogram** original (disseny base §5) era inassolible: exigia usar els 7 dígits però limitava a 6 operands.
- La **Solució d'Or** (la solució amb més punts) es va provar amb el pool real i **no és rara**: marcava ~112 de ~120 solucions per repte. L'espai de punts amb `max_leaves=4` és massa gruixut per singularitzar un cim.
- Un **prototip de viabilitat** del tutti autèntic ha donat: cerca per valors assolibles (no per expressions) → **sense explosió de memòria**; **~6 s/repte** amb early-exit; i **10/10 reptes** del pool tenen tutti.

**Decisió:** implementar el **tutti autèntic** (usar els 7 dígits), que ara sabem que és factible.

## 2. Concepte

El **Tutti** (recuperem el nom *Numerogram* si es vol) és una expressió vàlida que val l'objectiu i usa **els 7 dígits diferents** del rusc. És el cim rar i autèntic, l'equivalent del *tutti*/pangrama del Paraulògic. És un **assoliment a part**, no una de les solucions comptades del repte.

## 3. Definicions precises

- **Conjunt de solucions comptades**: expressions vàlides amb **2–4 operands** (cap `max_leaves=4`) que usen el dígit central, deduplicades per forma canònica. És el total que el jugador caça i el **denominador dels rangs**.
- **Tutti**: una expressió vàlida = objectiu el conjunt de **dígits usats** de la qual és **{els 7}**. Necessàriament ≥7 operands. El generador **garanteix** que existeix com a mínim la versió mínima: cada dígit **exactament una vegada** (7 operands).
- **Punts per solució comptada**: `leaves + (2 si usa ^ o √)`. (Sense cap bonus golden/numerogram a la fórmula base.)
- **total i rangs**: `total = Σ punts de les solucions comptades`; els rangs es calculen sobre `total`, igual que ara (`build_ranks`).

## 4. El tutti com a assoliment

- Cada repte del pool **garanteix ≥1 tutti**.
- Quan el jugador envia una expressió **vàlida = objectiu** el conjunt de dígits de la qual és els 7 → **tutti trobat**: celebració especial + bonus de punts (valor a decidir al client, p. ex. +10), mostrat **a part**. El tutti **no** altera els llindars de rang (es calculen sobre les comptades; trobar totes les comptades = rang màxim, i el tutti és una estrela addicional).
- **Detecció en viu al client**: no cal precalcular cap llista de tuttis. El client ja avalua i canonicalitza l'expressió enviada; només afegeix la comprovació "usa els 7 dígits diferents?".

## 5. Generació (motor)

- **Nou mòdul `generator/tutti.py`**: `tutti_exists(digits, target)` — DP de **valors assolibles** sobre subconjunts de bits (guarda enters, no expressions → sense OOM), amb **early-exit** en trobar l'objectiu. Reutilitza `combine`/`do_sqrt`/`InvalidExpr` de `engine.py`. ~6 s/repte.
- **`generator/puzzles.py`**:
  - `solution_points(leaves, uses_pow_sqrt)` torna a **2 paràmetres** (s'elimina el bonus d'or).
  - `make_puzzle` tria l'objectiu més ric dins la banda i **exigeix tutti** (`tutti_exists`): recorre els candidats per ordre de riquesa fins a un límit (`max_tutti_tries`) i es queda amb el primer que en tinga; si cap, retorna `None`.
  - La sortida **treu `goldenSolutions`** i **afegeix `hasTutti: true`**.
- **`generator/generate.py`**: sense canvis (ja gestiona `None` de `make_puzzle`).

## 6. Model de dades (`puzzles.json`)

- **Treu** `goldenSolutions`.
- **Afegeix** `hasTutti` (bool; sempre `true` als reptes inclosos).
- Resta igual: `target`, `digits`, `centralIndex`, `maxOperands`, `solutions`, `totalPoints`, `ranks`.

## 7. Impacte al client (Pla 2)

- El rusc ha de **permetre entrar expressions prou llargues per al tutti** (≥7 operands). La regla original "2–6 operands" s'actualitza: el joc reconeix (a) **solucions comptades** de 2–4 operands i (b) el **tutti** (qualsevol expressió que use els 7 dígits = objectiu). Les longituds 5–6 no compten (no són del pool ni tutti) — decisió de detall del Pla 2.
- Detecció del tutti **en viu** (conjunt de dígits usats == els 7) → celebració + bonus.

## 8. Cost i límits coneguts

- **Generació**: +~6 s/repte per la comprovació de tutti → ~6 min addicionals per als 60 reptes. El camí **lent** (~111 s) només es dóna en reptes **sense** tutti (raríssim al pool); es limita amb `max_tutti_tries`.
- El **tutti amb repeticions** de dígits (≥8 operands) també compta al client; el generador només garanteix el mínim (cada dígit una vegada).
