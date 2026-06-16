# Brevi — Client (Pla 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afegir al client l'objectiu **Brevi** (detecció + bonus), la **ratxa**, la **taula de compleció** i el render d'**hexàgons grisos**; i regenerar el banc activant els grisos.

**Architecture:** El Brevi es detecta al client pel recompte d'operands (`leaves == puzzle.brevi.operands`) — no cal llista. La ratxa es desa a `localStorage` (global, ancorada a completar el Brevi diari). El render suporta dígits 5–7 (cel·les grises). Es regenera el banc amb nombre de dígits variable i es puja el SW.

**Tech Stack:** JS vanilla (ES modules, `node --test`), Python (generador), CSS.

**Spec:** `docs/superpowers/specs/2026-06-16-brevi-dificultat-design.md`. Depèn del Pla 1 (ja fusionat): `puzzle.brevi {operands,count}`, `difficulty`, `hints.byLeaves`.

**Decisió d'UI (usuari):** Brevi + ratxa al **peu** (compacte); taula de compleció sencera al panell del comptador. Bonus Brevi **+10** (com el tutti). Cel·la grisa = hexàgon esmorteït no clicable.

---

## Estructura de fitxers

- **Modifica** `js/score.js` — helpers purs: `breviFoundCount`, `isBreviComplete`.
- **Modifica** `js/game.js` — exposa `breviFound()`, `breviComplete()`, `breviBonus()`; `score()` suma el bonus.
- **Crea** `js/streak.js` — lògica pura de ratxa (`computeStreak`, `streakDisplay`, `todayStr`).
- **Modifica** `js/storage.js` — `loadStreak`/`saveStreak` (clau global).
- **Modifica** `js/ui.js` — `renderHive` amb cel·les grises; `updateFooter` amb línia Brevi+ratxa; `completionHTML` (taula trobat/total per operands).
- **Modifica** `js/app.js` — render de grisos al shuffle; actualitzar ratxa en completar el Brevi diari; panell de compleció.
- **Modifica** `index.html` — element del peu per a Brevi+ratxa.
- **Modifica** `css/styles.css` — `.hex.empty`, `.brevi`, slots.
- **Modifica** `js/share.js` — afegeix Brevi/ratxa al text compartit.
- **Modifica** `generator/generate.py` — `PROFILES` amb nombre de dígits variable; **regenera** `data/puzzles.json`.
- **Modifica** `generator/tests/test_data_integrity.py` — accepta 5–7 dígits reals.
- **Modifica** `sw.js` — cache `numerologic-v16`.

---

## Task 1: Detecció del Brevi (lògica pura + game.js)

**Files:**
- Modify: `js/score.js`
- Modify: `js/game.js`
- Test: `js/tests/game.test.js`

- [ ] **Step 1: Test de la detecció i el bonus del Brevi**

```javascript
// afegir a js/tests/game.test.js (segueix l'estil dels tests existents)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, BREVI_BONUS } from "../game.js";

// rusc avui-equivalent: brevi = 3 operands, count 2; objectiu 20
const PZ = {
  target: 20, digits: [1, 3, 4, 5, 6, 7, 9], centralIndex: 4, maxOperands: 4,
  brevi: { operands: 3, count: 2 },
  ranks: [["Principiant", 0], ["Totes", 100]],
  rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
};

test("una solució de 3 operands compta com a Brevi", () => {
  const g = createGame(PZ);
  // 6 + 5×... cal una solució real de 3 operands = 20; p.ex. (4+6)×... no.
  // 6 × 4 − 4? no repeat. Usem (1+4)×... Provem una de 3 operands coneguda: 6×4−4 invàlid.
  // (3+7)+... 2 operands. Construïm 20 amb 3 operands sense repetir i amb central 6:
  // 6 × 5 − ... no. 6 + 7 + 7 no. Usem la via segura: avaluació delegada al motor.
  const r = g.submit("(4-9)*(-4)"); // = 20, 2 operands -> NO és brevi de 3
  assert.equal(r.status === "found" || r.status === "wrong" || r.status === "invalid", true);
});

test("breviComplete passa a cert en trobar totes les solucions del tier mínim", () => {
  const g = createGame(PZ);
  assert.equal(g.breviComplete(), false);
  assert.equal(g.breviFound(), 0);
});

test("BREVI_BONUS està exportat i és un nombre positiu", () => {
  assert.equal(typeof BREVI_BONUS, "number");
  assert.ok(BREVI_BONUS > 0);
});
```

> Nota d'implementació del test: construir expressions exactes de 3 operands a mà és fràgil. El test definitiu de detecció es fa al Step 3 amb expressions verificades pel motor; aquí només es fixa el contracte de l'API (`breviFound`, `breviComplete`, `BREVI_BONUS`). Substitueix els cossos pels casos reals un cop sàpigues 2 solucions de 3 operands del rusc (p. ex. via `python -m research.demo_tutti_diari` adaptat, o `generator.enumerate_solutions.solutions_by_tier([...],6,20,BASIC,3)`).

- [ ] **Step 2: Executar (falla: `BREVI_BONUS`/`breviFound` no existeixen)**

Run: `npm test`
Expected: FAIL a l'import de `BREVI_BONUS`.

- [ ] **Step 3: Implementar a `js/score.js` i `js/game.js`**

A `js/score.js` afegeix helpers purs (ja hi ha `countLeaves`):

```javascript
// nombre de solucions trobades amb el recompte d'operands del Brevi
export function breviFoundCount(foundMap, breviOperands) {
  let n = 0;
  for (const { leaves } of foundMap.values()) {
    if (leaves === breviOperands) n++;
  }
  return n;
}
```

A `js/game.js`: (a) afegeix `export const BREVI_BONUS = 10;`. (b) en desar cada solució a `found`, guarda també `leaves` (recompte d'operands) per no recalcular:

```javascript
// on es crea l'entrada de found (tant a la restauració com a submit):
const leaves = usesAllDigits(ast, digits) ? digits.length : countLeaves(ast);
found.set(c, { text: inputText, points, leaves });
```

(c) afegeix mètodes i el bonus al `score()`:

```javascript
import { breviFoundCount } from "./score.js"; // afegir a l'import existent

const breviOps = (puzzle.brevi && puzzle.brevi.operands) || null;
const breviTotal = (puzzle.brevi && puzzle.brevi.count) || 0;

function breviFound() {
  return breviOps ? breviFoundCount(found, breviOps) : 0;
}
function breviComplete() {
  return breviTotal > 0 && breviFound() >= breviTotal;
}
function breviBonus() {
  return breviComplete() ? BREVI_BONUS : 0;
}
// score(): suma el bonus
function score() {
  let s = breviBonus();
  for (const { points } of found.values()) s += points;
  return s;
}
// exposa breviFound, breviComplete, breviBonus al return de createGame
```

- [ ] **Step 4: Substituir els cossos dels tests amb 2 solucions reals de 3 operands**

Obté-les: `python -c "from generator.enumerate_solutions import solutions_by_tier; from generator.engine import Variant; print(list(solutions_by_tier([1,3,4,5,6,7,9],6,20,Variant(('add','sub','mul','div'),False,False),3)[3]))"`
Converteix la forma canònica a entrada infixa equivalent (o usa una expressió teva de 3 operands = 20 amb central 6, sense repetir). Escriu un test que enviï les 2 i comprovi `breviFound()==2` i `breviComplete()==true`, i que `score()` inclou `BREVI_BONUS`.

- [ ] **Step 5: Executar (ha de passar)**

Run: `npm test`
Expected: tots verds.

- [ ] **Step 6: Commit**

```bash
git add js/score.js js/game.js js/tests/game.test.js
git commit -m "feat(client): detecció del Brevi i bonus de compleció"
```

---

## Task 2: Ratxa (lògica pura + storage)

**Files:**
- Create: `js/streak.js`
- Modify: `js/storage.js`
- Test: `js/tests/streak.test.js`

- [ ] **Step 1: Test de la lògica de ratxa**

```javascript
// js/tests/streak.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStreak, streakDisplay } from "../streak.js";

test("primer dia: ratxa = 1", () => {
  assert.deepEqual(computeStreak(null, "2026-06-16"), { date: "2026-06-16", count: 1 });
});
test("dia consecutiu: incrementa", () => {
  assert.deepEqual(computeStreak({ date: "2026-06-15", count: 3 }, "2026-06-16"),
                   { date: "2026-06-16", count: 4 });
});
test("mateix dia: no canvia", () => {
  assert.deepEqual(computeStreak({ date: "2026-06-16", count: 4 }, "2026-06-16"),
                   { date: "2026-06-16", count: 4 });
});
test("dia saltat: reinicia a 1", () => {
  assert.deepEqual(computeStreak({ date: "2026-06-13", count: 9 }, "2026-06-16"),
                   { date: "2026-06-16", count: 1 });
});
test("streakDisplay: viu si ahir o avui, si no 0", () => {
  assert.equal(streakDisplay({ date: "2026-06-16", count: 4 }, "2026-06-16"), 4);
  assert.equal(streakDisplay({ date: "2026-06-15", count: 4 }, "2026-06-16"), 4); // viu
  assert.equal(streakDisplay({ date: "2026-06-14", count: 4 }, "2026-06-16"), 0); // trencada
  assert.equal(streakDisplay(null, "2026-06-16"), 0);
});
```

- [ ] **Step 2: Executar (falla: `js/streak.js` no existeix)**

Run: `npm test`
Expected: FAIL import.

- [ ] **Step 3: Implementar `js/streak.js`**

```javascript
// Ratxa: dies consecutius completant el Brevi diari. Lògica pura (dates com a "YYYY-MM-DD").
function _prevDay(s) {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function todayStr(ts) {
  const dt = new Date(ts);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function computeStreak(prev, today) {
  if (!prev) return { date: today, count: 1 };
  if (prev.date === today) return prev;
  if (prev.date === _prevDay(today)) return { date: today, count: prev.count + 1 };
  return { date: today, count: 1 };
}

export function streakDisplay(prev, today) {
  if (!prev) return 0;
  if (prev.date === today || prev.date === _prevDay(today)) return prev.count;
  return 0;
}
```

- [ ] **Step 4: Afegir `loadStreak`/`saveStreak` a `js/storage.js`**

```javascript
const STREAK_KEY = "numerologic-streak";
export function loadStreak(storage) {
  try { return JSON.parse(storage.getItem(STREAK_KEY)) || null; } catch { return null; }
}
export function saveStreak(storage, data) {
  try { storage.setItem(STREAK_KEY, JSON.stringify(data)); } catch { /* quota / privat */ }
}
```

- [ ] **Step 5: Executar (ha de passar)**

Run: `npm test`
Expected: verds.

- [ ] **Step 6: Commit**

```bash
git add js/streak.js js/storage.js js/tests/streak.test.js
git commit -m "feat(client): lògica i persistència de la ratxa"
```

---

## Task 3: Hexàgons grisos (render)

**Files:**
- Modify: `js/ui.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

- [ ] **Step 1: `renderHive` admet 5–7 dígits (cel·les grises)**

A `js/ui.js`, dins `renderHive`, després de calcular `peripherals`, **emplena fins a 6** amb `null` i renderitza els `null` com a cel·les grises no clicables:

```javascript
const peripherals = digits.filter((_, i) => i !== centralIndex);
while (peripherals.length < 6) peripherals.push(null); // cel·les buides (grises)
// ... al bucle de cel·les:
for (const cell of row) {
  const btn = document.createElement("button");
  const isCenter = typeof cell === "object" && cell !== null;
  const value = isCenter ? cell.center : cell;
  if (value === null) {
    btn.className = "hex empty";
    btn.disabled = true;
  } else {
    btn.className = "hex" + (isCenter ? " center" : "");
    btn.textContent = String(value);
    btn.addEventListener("click", () => onCell(String(value)));
  }
  r.appendChild(btn);
}
```

(El `layout` 2-3-2 ja indexa `peripherals[0..5]`; ara mai són `undefined`.)

- [ ] **Step 2: Arreglar el shuffle a `js/app.js` per a dígits <7**

A l'handler de `shuffle`, barreja només els dígits actius i re-renderitza (el padding a 6 el fa `renderHive`):

```javascript
els.shuffle.addEventListener("click", () => {
  const p = game.puzzle;
  const central = p.digits[p.centralIndex];
  const peripherals = p.digits.filter((_, i) => i !== p.centralIndex);
  for (let i = peripherals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [peripherals[i], peripherals[j]] = [peripherals[j], peripherals[i]];
  }
  const shuffled = [...peripherals];
  shuffled.splice(p.centralIndex, 0, central);
  ui.renderHive(els.hive, shuffled, p.centralIndex, addToken);
});
```

(Sense canvis estructurals si `p.centralIndex` segueix vàlid per a l'array escurçat; `splice` reinsereix el central.)

- [ ] **Step 3: CSS de la cel·la grisa**

A `css/styles.css`, després de `.hex.center`:

```css
.hex.empty { background: #e2e8f0; cursor: default; }
.hex.empty:active { filter: none; }
```

- [ ] **Step 4: Verificació manual (DOM, no unit-test)**

Genera un banc de prova amb 5 dígits i obre el joc localment (o crea un puzzle inline). Comprova: 2 cel·les grises, no clicables, central coral al centre, shuffle no trenca res, teclat segueix funcionant.
Run: `python -c "import json; d=json.load(open('data/puzzles.json',encoding='utf-8')); print([len(p['digits']) for p in d['puzzles'][:6]])"` (després de Task 5 hi haurà <7).

- [ ] **Step 5: Commit**

```bash
git add js/ui.js js/app.js css/styles.css
git commit -m "feat(client): render d'hexàgons grisos per a ruscos de 5-7 dígits"
```

---

## Task 4: Peu (Brevi + ratxa) i taula de compleció

**Files:**
- Modify: `index.html`
- Modify: `js/ui.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

- [ ] **Step 1: Element del peu a `index.html`**

Dins `.foot`, després del `<div class="meta">…</div>`, afegeix:

```html
<div class="brevi" id="brevi"></div>
```

- [ ] **Step 2: `updateFooter` mostra Brevi + ratxa (`js/ui.js`)**

Amplia `updateFooter` perquè rebi i pinti `breviEl`, `breviFound`, `breviTotal`, `breviComplete`, `streak`:

```javascript
export function updateFooter({ countEl, rankEl, tuttiEl, breviEl,
                              found, score, rankName, tuttiFound,
                              breviFound, breviTotal, breviComplete, streak }) {
  countEl.textContent = `Has trobat ${found} solucions (${score} punts).`;
  rankEl.textContent = rankName;
  tuttiEl.textContent = tuttiFound ? "★ Tutti trobat!" : "★ Tutti pendent";
  tuttiEl.classList.toggle("done", tuttiFound);
  if (breviEl) {
    const slots = "◻".repeat(Math.max(0, breviTotal - breviFound));
    const done = "◼".repeat(breviFound);
    const streakTxt = streak > 0 ? ` · 🔥 Ratxa ${streak}` : "";
    breviEl.innerHTML = `Brevi ${done}${slots} ${breviFound}/${breviTotal}${streakTxt}`;
    breviEl.classList.toggle("done", breviComplete);
  }
}
```

- [ ] **Step 3: Taula de compleció (`js/ui.js`)**

Substitueix el contingut del panell del comptador per una taula trobat/total per operands. Afegeix:

```javascript
// trobat/total per nombre d'operands. `byLeaves` són els totals (claus string), `foundMap` el trobat.
export function completionHTML(byLeaves, foundMap, breviOperands) {
  const foundByLeaves = {};
  for (const { leaves } of foundMap.values()) {
    foundByLeaves[leaves] = (foundByLeaves[leaves] || 0) + 1;
  }
  const rows = Object.keys(byLeaves).map(Number).sort((a, b) => a - b).map((k) => {
    const total = byLeaves[k];
    const f = foundByLeaves[k] || 0;
    const tag = k === breviOperands ? " <b>(Brevi)</b>" : "";
    return `<li>${k} operands${tag}: <b>${f}</b>/${total}</li>`;
  }).join("");
  return `<ul>${rows}</ul>` + foundListHTML(foundMap);
}
```

- [ ] **Step 4: Wire-up a `js/app.js`**

(a) afegeix `brevi: $("brevi")` a `els`. (b) `refreshFooter` passa els camps nous:

```javascript
import { loadStreak, saveStreak } from "./storage.js";
import { streakDisplay, todayStr } from "./streak.js";

function refreshFooter() {
  const today = todayStr(Date.now());
  ui.updateFooter({
    countEl: els.count, rankEl: els.rankBtn, tuttiEl: els.tutti, breviEl: els.brevi,
    found: game.found.size, score: game.score(), rankName: game.rank(),
    tuttiFound: game.tuttiFound,
    breviFound: game.breviFound(), breviTotal: game.puzzle.brevi ? game.puzzle.brevi.count : 0,
    breviComplete: game.breviComplete(),
    streak: streakDisplay(loadStreak(localStorage), today),
  });
}
```

(c) el panell del comptador usa la taula:

```javascript
els.count.addEventListener("click", () =>
  ui.openPanel(els.panel, "Compleció", ui.completionHTML(
    game.puzzle.hints.byLeaves, game.found, game.puzzle.brevi ? game.puzzle.brevi.operands : null))
);
```

- [ ] **Step 5: Actualitzar la ratxa en completar el Brevi (`js/app.js send()`)**

```javascript
function send() {
  if (!expr) return;
  const wasComplete = game.breviComplete();
  const res = game.submit(expr);
  ui.flash(els.flash, res);
  if (res.status === "found" || res.status === "tutti") {
    saveProgress(localStorage, poolIndex, game.progress());
    // ratxa: només en mode diari i quan el Brevi acaba de completar-se
    if (mode === "daily" && !wasComplete && game.breviComplete()) {
      const today = todayStr(Date.now());
      saveStreak(localStorage, computeStreak(loadStreak(localStorage), today));
      els.flash.className = "flash tutti";
      els.flash.textContent = "✦ Brevi complet!";
    }
    refreshFooter();
  }
  if (res.status === "found" || res.status === "tutti" || res.status === "duplicate") {
    expr = ""; showExpr();
  }
}
```

(afegeix `import { computeStreak } from "./streak.js";`)

- [ ] **Step 6: CSS del peu Brevi**

```css
.brevi { color: #6b7280; font-size: 13px; margin-top: 6px; }
.brevi.done { color: #16a34a; font-weight: 700; }
```

- [ ] **Step 7: Verificació manual**

Obre el joc; comprova que el peu mostra "Brevi ◻◻ 0/2 · 🔥 Ratxa N", que en trobar solucions de 3 operands s'omplen, que en completar surt "✦ Brevi complet!" i la ratxa puja, i que el comptador obre la taula de compleció.

- [ ] **Step 8: Commit**

```bash
git add index.html js/ui.js js/app.js css/styles.css
git commit -m "feat(client): peu amb Brevi+ratxa i taula de compleció"
```

---

## Task 5: Compartir + regenerar banc amb dígits variables

**Files:**
- Modify: `js/share.js`
- Modify: `js/tests/share.test.js`
- Modify: `generator/generate.py`
- Modify: `generator/tests/test_generate.py`
- Regenera: `data/puzzles.json`

- [ ] **Step 1: Afegir Brevi/ratxa al text compartit (TDD)**

Mira la signatura actual de `buildShareText` a `js/share.js` i el test. Afegeix paràmetres `breviComplete` i `streak` i una línia al text (p. ex. `Brevi ✓` i `🔥N`). Escriu/actualitza el test a `js/tests/share.test.js` amb les noves dades i assercions (el text conté `Brevi` quan `breviComplete` i `🔥` quan `streak>0`). Mantén que **no revela cap solució**.

- [ ] **Step 2: `PROFILES` amb nombre de dígits variable (`generator/generate.py`)**

Canvia `PROFILES` perquè inclogui el nombre de dígits i `build_pool` el faci servir (mostra `n_digits` dígits de 1..9):

```python
# (etiqueta, n_digits, target_range, banda)
PROFILES = [
    ("facil",   7, (10, 99),   (40, 120)),
    ("mitja",   6, (60, 299),  (8, 40)),
    ("dificil", 5, (150, 999), (1, 12)),
]
```

I a `build_pool`, substitueix la tria del rusc per un mostreig de `n_digits`:

```python
def build_pool(count, max_leaves=4, seed=0, start_date="2026-06-01", variant=FULL):
    rng = random.Random(seed)
    puzzles = []
    seen = set()
    attempts = 0
    while len(puzzles) < count and attempts < count * 400:
        attempts += 1
        difficulty, n_digits, tr, band = PROFILES[len(puzzles) % len(PROFILES)]
        ds = sorted(rng.sample(DIGITS, n_digits))
        centrals = [i for i in range(n_digits) if ds[i] != 1]
        if not centrals:
            continue
        rng.shuffle(centrals)
        for ci in centrals:
            pz = make_puzzle(ds, ci, band=band, max_leaves=max_leaves,
                             target_range=tr, variant=variant, difficulty=difficulty)
            if pz is None:
                continue
            key = (pz["target"], tuple(pz["digits"]), pz["centralIndex"])
            if key in seen:
                continue
            seen.add(key)
            puzzles.append(pz)
            break
    return {"startDate": start_date, "puzzles": puzzles}
```

- [ ] **Step 3: Actualitzar el test de l'espectre (`generator/tests/test_generate.py`)**

Canvia l'assert de `len(p["digits"]) == 7` per `5 <= len(p["digits"]) <= 7`, i afegeix `assert any(len(p["digits"]) < 7 for p in pz)` (hi ha grisos).

- [ ] **Step 4: Executar tests (Python + JS)**

Run: `python -m pytest generator/tests/test_generate.py -v` i `npm test`
Expected: verds.

- [ ] **Step 5: Regenerar el banc i validar**

Run: `python -m generator.generate --count 60 --seed 0 --no-repeat --no-pow-sqrt --start-date 2026-06-01`
Run: `python -m pytest generator/tests/test_data_integrity.py -v` (ja accepta 5–7 dígits)
Expected: 60 reptes, verds. Comprova amb `python -c "import json,collections;d=json.load(open('data/puzzles.json',encoding='utf-8'));print(collections.Counter(len(p['digits']) for p in d['puzzles']))"` que hi ha 5/6/7.

- [ ] **Step 6: Commit**

```bash
git add js/share.js js/tests/share.test.js generator/generate.py generator/tests/test_generate.py generator/tests/test_data_integrity.py data/puzzles.json
git commit -m "feat: dígits variables (grisos) al banc + Brevi/ratxa al compartir"
```

---

## Task 6: Service worker i verificació final

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Afegir `js/streak.js` als ASSETS i pujar la versió**

A `sw.js`: afegeix `"./js/streak.js"` a `ASSETS` i canvia `CACHE` a `"numerologic-v16"`.

- [ ] **Step 2: Suite completa**

Run: `npm test` (JS) i `python -m pytest generator/ -q` (Python)
Expected: tot verd.

- [ ] **Step 3: Verificació manual end-to-end**

Obre el joc (mode diari): rusc amb possibles grisos, peu amb Brevi+ratxa, completar el Brevi puja la ratxa, taula de compleció al comptador, tutti intacte. Recarrega → la ratxa i el progrés persisteixen.

- [ ] **Step 4: Commit**

```bash
git add sw.js
git commit -m "chore(pwa): SW a numerologic-v16 (streak.js + banc amb grisos)"
```

---

## Self-review notes

- **Cobertura spec:** Brevi detecció+bonus (§4) → Task 1; ratxa (§9) → Task 2; grisos (§5) → Task 3 + Task 5; taula de compleció (§4) → Task 4; compartir → Task 5; dades amb grisos (§8) → Task 5; SW → Task 6.
- **Tutti i punts:** intactes (només `score()` suma el bonus Brevi addicional).
- **Límits:** el render de grisos i el peu no tenen unit-test (DOM) → verificació manual als Steps corresponents. La lògica (Brevi, ratxa, compleció) sí que és pura i testada.
- **Migració:** progrés desat antic tolerat (`game.js` ja ignora entrades corruptes; `leaves` es recalcula a la restauració). La ratxa és clau nova.
