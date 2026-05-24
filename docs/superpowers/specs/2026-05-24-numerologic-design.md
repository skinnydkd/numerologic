# Numerològic — Document de disseny

**Data:** 2026-05-24
**Estat:** Aprovat (pendent revisió final de l'usuari)
**Autor:** Pau + Claude

## 1. Visió

Un *Paraulògic matemàtic*. Cada dia apareix un **objectiu** (un número) i un **rusc de 7 dígits**. El jugador ha de descobrir **totes** les expressions matemàtiques vàlides que arriben a l'objectiu, com qui busca totes les paraules del Paraulògic. Progrés per rangs i comptador de solucions trobades sobre el total.

## 2. Mecàniques de joc

| Element | Definició |
|---|---|
| **Rusc** | 7 cel·les hexagonals: 6 perifèriques + 1 **central obligatòria** (ressaltada en groc). |
| **Valors** | 7 dígits **diferents** triats de l'1 al 9. |
| **Objectiu** | Número a assolir, mostrat gran a dalt ("Arriba a 128"). |
| **Operacions** | `+ − × ÷`, potència `^`, arrel `√`, i parèntesis `( )`. |
| **Obligatorietat** | Cada expressió ha d'usar el dígit central com a mínim un cop. |
| **Reutilització** | Es poden repetir dígits del rusc, limitat pel màxim d'operands per expressió. |
| **Igualtat de solucions** | Dedup commutatiu: `3×4×2` = `2×4×3`, però `3×8` ≠ `4×6`. |

## 3. Regles de validació d'una expressió

Una expressió és **vàlida** si i només si:

1. Usa entre **2 i 6 operands** (comptant repeticions).
2. Tots els operands són dígits presents al rusc.
3. Usa el dígit **central** com a mínim un cop.
4. Totes les **divisions són exactes** (`8÷4`✓, `7÷2`✗): cap pas dona fracció.
5. Totes les **arrels són exactes** i d'enters no negatius (`√9`✓, `√8`✗, `√−4`✗).
6. Les **potències** tenen exponent **enter ≥ 0**; tot valor (intermedi o final) ha de quedar **< 1.000.000** (cap anti-explosió).
7. Els resultats **intermedis poden ser negatius**; el resultat **final** ha de ser igual a l'objectiu exacte.

> Nota: l'arrel `√` és un operador **unari prefix**. La potència `^` és binària i associativa per la dreta. La precedència és la matemàtica estàndard, modificable amb parèntesis.

## 4. Igualtat de solucions (canonicalització)

Dues expressions són **la mateixa solució** si tenen la **mateixa forma canònica**. La forma canònica es calcula:

1. Construir l'arbre sintàctic (AST) de l'expressió.
2. Per als operadors **commutatius** (`+` i `×`), **ordenar els fills** segons un ordre canònic estable (per forma canònica del subarbre).
3. Serialitzar l'arbre a una **cadena canònica** determinista.

`+` i `×` són commutatius i s'aplanen+ordenen. `−`, `÷`, `^`, `√` **no** es reordenen. La cadena canònica és la clau de deduplicació.

**Requisit crític:** el generador (Python) i el client (JS) han de produir **exactament la mateixa cadena canònica** per a la mateixa expressió. El format de la cadena canònica es defineix una sola vegada i s'implementa idènticament als dos costats. Hi haurà tests de paritat.

## 5. Puntuació i rangs

**Punts per solució** (fórmula inicial, ajustable):

```
punts = nombre_operands + (2 si usa ^ o √, altrament 0)
```

- **Numerogram**: una solució que usa **els 7 dígits del rusc** (tots diferents presents) rep **+10 punts** i un destacat visual especial. És l'equivalent del *tutti*/pangrama del Paraulògic.

**Rangs** segons el % de punts acumulats sobre el total del repte (llindars inicials, ajustables):

| Rang | % punts |
|---|---|
| Principiant | 0% |
| Bé | 10% |
| Molt bé | 25% |
| Expert | 45% |
| Mestre | 65% |
| Geni | 85% |
| **Totes** | 100% |

El client mostra rang actual, punts i comptador `trobades/total`.

## 6. Modes de joc

- **Repte diari**: el mateix per a tothom; es determina per la data (índex sobre el pool). Es desa el progrés del dia.
- **Pràctica lliure**: reptes il·limitats extrets del mateix pool pre-generat (exclou el repte diari actiu per no fer spoiler).

## 7. Compartir resultat

Botó de compartir estil Wordle/Paraulògic: copia al porta-retalls el **rang assolit + una barra de progrés amb emojis** i la data/número de repte, **sense desvelar cap solució**.

## 8. Arquitectura tècnica

**PWA estàtica, offline-first, sense backend.** Estat del jugador a `localStorage`.

### 8.1 Generador (Python, offline / build-time)

Script que produeix el pool de reptes:

1. Tria 7 dígits diferents (1-9) i un índex central.
2. **Enumera per força bruta** totes les expressions vàlides (operands del rusc amb reutilització, longitud 2-6, operadors permesos, totes les formes d'arbre i parèntesis), aplicant les regles del §3.
3. Agrupa per **forma canònica** (§4) i per **valor resultant**.
4. Per a cada possible objectiu, compta solucions canòniques que **usin el central**. Selecciona objectius amb comptador dins la **banda [40, 120]**.
5. Marca els **Numerograms** (solucions que usen els 7 dígits).
6. Calcula punts per solució, punts totals i llindars de rang.
7. Escriu el **pool a `data/puzzles.json`**.

Inclou tests: avaluador, canonicalitzador, cercador de solucions (casos petits coneguts), filtre de banda.

### 8.2 Client (JS vanilla)

Mòduls (un fitxer = una responsabilitat):

- `parser.js` — tokenitza i parseja l'entrada a AST (precedència, parèntesis, `√` unari, `^` dreta).
- `evaluator.js` — avalua l'AST aplicant les regles del §3 (divisió/arrel exactes, cap de valor, etc.).
- `canonical.js` — forma canònica (§4), **paritat amb Python**.
- `validate.js` — comprova totes les regles d'una expressió per a un repte donat.
- `score.js` — punts per solució, punts totals, rang.
- `game.js` — estat de la partida (repte, solucions trobades, intent actual).
- `storage.js` — persistència a `localStorage` (progrés diari, estadístiques).
- `share.js` — generació del text/emoji per compartir.
- `ui.js` — render del rusc (layout Opció A: operadors en fila), display d'expressió, llista de trobades, rang.

**Flux de validació d'un intent:** parseja → valida regles → avalua = objectiu? → canonicalitza → és nova (no trobada abans)? → si tot ✓: compta com a solució, suma punts, actualitza rang. El conjunt pre-generat defineix el **total** i els llindars; qualsevol expressió vàlida i igual a l'objectiu que sigui canònicament nova es compta com a trobada.

### 8.3 PWA

- `manifest.json` + `sw.js` (service worker) per a instal·labilitat i ús offline.
- Cau dels actius i del `puzzles.json`.

### 8.4 Layout (UI) — Opció A "Calculadora"

Objectiu gran a dalt → display de l'expressió en construcció → rusc hexagonal (central groc) → fila d'operadors (`+ − × ÷ ^ √ ( )`) → botons d'acció (Esborra, Remena, = Envia).

## 9. Estructura de fitxers (proposta)

```
numerologic/
  index.html
  css/styles.css
  js/{parser,evaluator,canonical,validate,score,game,storage,share,ui}.js
  data/puzzles.json
  generator/
    generate.py        # orquestra la generació del pool
    solver.py          # enumeració + avaluació + cerca
    canonical.py       # forma canònica (paritat amb canonical.js)
    tests/
  manifest.json
  sw.js
  documents/           # platform-docs, styleguide, roadmap, data-reference
```

## 10. Estratègia de proves

- **Python**: unit tests de l'avaluador, canonicalitzador i cercador amb casos petits verificables a mà; test del filtre de banda de solucions.
- **JS**: tests de parser/avaluador/canonicalitzador, regles de validació, càlcul de punts i rangs.
- **Paritat canònica**: bateria d'expressions comparant la cadena canònica de Python i JS — han de coincidir sempre.

## 11. Fora d'abast (primera versió)

- Backend, comptes d'usuari, rànquings globals en línia.
- Concatenació de dígits, factorials, altres operadors.
- Generació de reptes en viu al client (s'usa pool pre-generat).
- Multi-idioma (la primera versió és en català/valencià).

## 12. Criteris d'èxit

1. El repte diari té sempre un nombre de solucions dins la banda objectiu.
2. Cap fals positiu/negatiu en validar intents (paritat canònica garantida pels tests).
3. Funciona offline com a PWA instal·lable.
4. El comptador i els rangs reflecteixen fidelment el progrés, estil Paraulògic.
