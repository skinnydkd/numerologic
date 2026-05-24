# Client jugable (Pla 2b) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el client jugable de Numerològic al navegador (repte diari + pràctica lliure, rusc interactiu, validació en viu, puntuació, rangs, tutti, progrés desat), reutilitzant el nucli del Pla 2a.

**Architecture:** La lògica de partida (`game.js`), la persistència (`storage.js`) i el càlcul de modes (`modes.js`) són mòduls purs sense DOM, provats amb `node:test`. La capa DOM (`index.html`, `css/styles.css`, `ui.js`, `app.js`) connecta tot i es verifica visualment servint la pàgina. Reutilitza `parser/evaluator/canonical/validate/score` del 2a.

**Tech Stack:** JavaScript (ES modules), `node:test` per a la lògica, HTML/CSS vanilla per a la UI. Sense build ni dependències.

**Spec de referència:** `docs/superpowers/specs/2026-05-25-client-game-design.md`. Estètica validada amb mockups a `.superpowers/brainstorm/` (turquesa `#58b4c4`, coral `#ec5a52`, rusc amb buit uniforme).

**Prerequisit:** El Pla 2a (PR #2) ha d'estar fusionat a `main`. Treballar en una branca nova `feat/client-game` sortida de `main` (els mòduls `js/parser.js` … `js/score.js` i `data/puzzles.json` hi han de ser).

---

## File Structure

```
numerologic/
  index.html              # esquelet de la pàgina
  css/styles.css          # tema Paraulògic
  js/
    game.js               # estat i lògica de partida (pur)
    storage.js            # persistència localStorage (pur, store injectable)
    modes.js              # índex de repte diari / pràctica (pur)
    ui.js                 # helpers de render i DOM
    app.js                # entrada: fetch puzzles.json, modes, storage, game, ui
    tests/
      game.test.js
      storage.test.js
      modes.test.js
```

Reutilitza del 2a: `js/parser.js`, `js/evaluator.js`, `js/canonical.js`, `js/validate.js`, `js/score.js`.

---

## Task 1: `game.js` — lògica de partida

**Files:**
- Create: `js/game.js`
- Test: `js/tests/game.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/game.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, TUTTI_BONUS } from "../game.js";

function puzzle() {
  return {
    target: 28,
    digits: [1, 2, 3, 4, 5, 6, 7],
    centralIndex: 0, // central = 1
    solutions: ["(* 1 4 7)"], // 1*4*7 = 28
    totalPoints: 3,
    ranks: [["Principiant", 0], ["Mig", 2], ["Tot", 3]],
    hasTutti: true,
  };
}

test("solució comptada nova -> found", () => {
  const g = createGame(puzzle());
  const r = g.submit("1*4*7");
  assert.equal(r.status, "found");
  assert.equal(r.points, 3);
  assert.equal(g.found.size, 1);
  assert.equal(g.score(), 3);
});

test("dedup commutatiu -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("1*4*7");
  const r = g.submit("7*4*1"); // mateixa forma canònica
  assert.equal(r.status, "duplicate");
  assert.equal(g.found.size, 1);
});

test("no arriba a l'objectiu -> wrong", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("1+1").status, "wrong");
});

test("sintaxi invàlida -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("1*").status, "invalid");
});

test("sense el dígit central -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("4*7").status, "invalid"); // 28 pero sense l'1 central
});

test("vàlida i = objectiu però no a la llista -> notInList", () => {
  const g = createGame(puzzle());
  // 1*1*4*7 = 28, usa el central, pero canonica "(* 1 1 4 7)" no es a solutions
  assert.equal(g.submit("1*1*4*7").status, "notInList");
});

test("tutti (els 7 dígits) -> tutti amb bonus", () => {
  const g = createGame(puzzle());
  const r = g.submit("1+2+3+4+5+6+7"); // = 28, tots els digits
  assert.equal(r.status, "tutti");
  assert.equal(r.points, TUTTI_BONUS);
  assert.equal(g.tuttiFound, true);
  assert.equal(g.score(), 0); // el tutti no compta a la puntuacio
  assert.equal(g.tuttiBonus(), TUTTI_BONUS);
});

test("tutti repetit -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("1+2+3+4+5+6+7");
  assert.equal(g.submit("1+2+3+4+5+6+7").status, "duplicate");
});

test("rang segons la puntuació", () => {
  const g = createGame(puzzle());
  assert.equal(g.rank(), "Principiant");
  g.submit("1*4*7"); // score 3
  assert.equal(g.rank(), "Tot");
});

test("progress() i restauració amb createGame", () => {
  const g = createGame(puzzle());
  g.submit("1*4*7");
  g.submit("1+2+3+4+5+6+7");
  const p = g.progress();
  const g2 = createGame(puzzle(), p);
  assert.equal(g2.found.size, 1);
  assert.equal(g2.score(), 3);
  assert.equal(g2.tuttiFound, true);
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/game.test.js`
Expected: FAIL (`Cannot find module '../game.js'`).

- [ ] **Step 3: Implementar `js/game.js`**

```javascript
// Estat i lògica d'una partida (sense DOM). Reutilitza el nucli del Pla 2a.
import { parse, ParseError } from "./parser.js";
import { validate } from "./validate.js";
import { canonical } from "./canonical.js";
import { solutionPoints, hasPowOrSqrt, countLeaves, usesAllDigits } from "./score.js";

export const TUTTI_BONUS = 10;

export function createGame(puzzle, progress = null) {
  const { digits, target } = puzzle;
  const central = digits[puzzle.centralIndex];
  const solutionSet = new Set(puzzle.solutions);
  const found = new Map(); // canonical -> { text, points }
  let tuttiFound = false;

  if (progress) {
    for (const f of progress.found || []) {
      const ast = parse(f.text);
      found.set(f.canonical, {
        text: f.text,
        points: solutionPoints(countLeaves(ast), hasPowOrSqrt(ast)),
      });
    }
    tuttiFound = Boolean(progress.tuttiFound);
  }

  function submit(inputText) {
    let ast;
    try {
      ast = parse(inputText);
    } catch (e) {
      if (e instanceof ParseError) return { status: "invalid" };
      throw e;
    }
    const v = validate(ast, { digits, central });
    if (!v.ok) return { status: "invalid" };
    if (v.value !== target) return { status: "wrong" };

    if (usesAllDigits(ast, digits)) {
      if (tuttiFound) return { status: "duplicate" };
      tuttiFound = true;
      return { status: "tutti", points: TUTTI_BONUS };
    }

    const c = canonical(ast);
    if (solutionSet.has(c)) {
      if (found.has(c)) return { status: "duplicate" };
      const points = solutionPoints(countLeaves(ast), hasPowOrSqrt(ast));
      found.set(c, { text: inputText, points });
      return { status: "found", points, canonical: c };
    }
    return { status: "notInList" };
  }

  function score() {
    let s = 0;
    for (const { points } of found.values()) s += points;
    return s;
  }

  function rank() {
    const s = score();
    let name = puzzle.ranks[0][0];
    for (const [n, threshold] of puzzle.ranks) {
      if (s >= threshold) name = n;
      else break;
    }
    return name;
  }

  function tuttiBonus() {
    return tuttiFound ? TUTTI_BONUS : 0;
  }

  function progress() {
    return {
      found: [...found.entries()].map(([canonical, { text }]) => ({ canonical, text })),
      tuttiFound,
    };
  }

  return {
    puzzle,
    submit,
    score,
    rank,
    tuttiBonus,
    progress,
    get found() {
      return found;
    },
    get tuttiFound() {
      return tuttiFound;
    },
  };
}
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/game.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add js/game.js js/tests/game.test.js
git commit -m "feat: game.js (estat i logica de partida)"
```

---

## Task 2: `storage.js` — persistència

**Files:**
- Create: `js/storage.js`
- Test: `js/tests/storage.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/storage.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadProgress, saveProgress } from "../storage.js";

function fakeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

test("desa i carrega (round-trip)", () => {
  const store = fakeStore();
  const progress = { found: [{ canonical: "(* 1 4 7)", text: "1*4*7" }], tuttiFound: true };
  saveProgress(store, 12, progress);
  assert.deepEqual(loadProgress(store, 12), progress);
});

test("carregar un repte sense progrés -> null", () => {
  const store = fakeStore();
  assert.equal(loadProgress(store, 5), null);
});

test("índexs diferents no es barregen", () => {
  const store = fakeStore();
  saveProgress(store, 1, { found: [], tuttiFound: false });
  saveProgress(store, 2, { found: [{ canonical: "x", text: "y" }], tuttiFound: false });
  assert.equal(loadProgress(store, 1).found.length, 0);
  assert.equal(loadProgress(store, 2).found.length, 1);
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/storage.test.js`
Expected: FAIL (`Cannot find module '../storage.js'`).

- [ ] **Step 3: Implementar `js/storage.js`**

```javascript
// Persistència del progrés a un "store" tipus localStorage (injectable per als tests).

const PREFIX = "numerologic:p:";

export function loadProgress(store, poolIndex) {
  const raw = store.getItem(PREFIX + poolIndex);
  return raw ? JSON.parse(raw) : null;
}

export function saveProgress(store, poolIndex, progress) {
  store.setItem(PREFIX + poolIndex, JSON.stringify(progress));
}
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/storage.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add js/storage.js js/tests/storage.test.js
git commit -m "feat: storage.js (progres a localStorage)"
```

---

## Task 3: `modes.js` — índex de repte diari i pràctica

**Files:**
- Create: `js/modes.js`
- Test: `js/tests/modes.test.js`

- [ ] **Step 1: Escriure els tests que fallen**

`js/tests/modes.test.js`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyIndex, practiceIndex } from "../modes.js";

const MS = 86400000;
const start = new Date("2026-06-01T00:00:00").getTime();

test("dia 0 -> índex 0", () => {
  assert.equal(dailyIndex("2026-06-01", start + 12 * 3600 * 1000, 60), 0);
});

test("dia 3 -> índex 3", () => {
  assert.equal(dailyIndex("2026-06-01", start + 3 * MS, 60), 3);
});

test("dóna la volta al pool", () => {
  assert.equal(dailyIndex("2026-06-01", start + 60 * MS, 60), 0);
});

test("abans de l'inici no és negatiu", () => {
  const i = dailyIndex("2026-06-01", start - 1 * MS, 60);
  assert.ok(i >= 0 && i < 60);
});

test("practiceIndex evita el diari", () => {
  assert.equal(practiceIndex(() => 0, 60, 0), 1); // saltaria el 0
  assert.equal(practiceIndex(() => 0, 60, 5), 0); // 0 != 5, val
  for (let r = 0; r < 1; r += 0.05) {
    assert.notEqual(practiceIndex(() => r, 60, 7), 7);
  }
});
```

- [ ] **Step 2: Executar per verificar que fallen**

Run: `node --test js/tests/modes.test.js`
Expected: FAIL (`Cannot find module '../modes.js'`).

- [ ] **Step 3: Implementar `js/modes.js`**

```javascript
// Selecció de repte: índex diari (per data) i índex de pràctica (aleatori, evita el diari).

const MS_PER_DAY = 86400000;

export function dailyIndex(startDateISO, todayMs, poolLength) {
  const start = new Date(startDateISO + "T00:00:00").getTime();
  const days = Math.floor((todayMs - start) / MS_PER_DAY);
  return ((days % poolLength) + poolLength) % poolLength;
}

export function practiceIndex(random, poolLength, excludeIndex) {
  if (poolLength <= 1) return 0;
  let i = Math.floor(random() * (poolLength - 1));
  if (i >= excludeIndex) i += 1;
  return i;
}
```

- [ ] **Step 4: Executar per verificar que passen**

Run: `node --test js/tests/modes.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add js/modes.js js/tests/modes.test.js
git commit -m "feat: modes.js (index diari i practica)"
```

---

## Task 4: `index.html` + `css/styles.css` (esquelet i tema)

**Files:**
- Create: `index.html`
- Create: `css/styles.css`

- [ ] **Step 1: Crear `index.html`**

```html
<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>Numerològic</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <main class="pl">
    <header class="topbar">
      <div class="logo">Numerològic</div>
      <div class="modes">
        <button class="mode active" data-mode="daily">Diari</button>
        <button class="mode" data-mode="practice">Pràctica</button>
      </div>
    </header>

    <div class="goal">Arriba a <b id="target">—</b></div>
    <div class="disp" id="display"><span class="cursor">|</span></div>
    <div class="flash" id="flash"></div>

    <div class="hive" id="hive"></div>
    <div class="ops" id="ops"></div>

    <div class="actions">
      <button class="pill" id="del">Esborra</button>
      <button class="round" id="shuffle" title="Remena">⟳</button>
      <button class="pill send" id="send">Envia</button>
    </div>

    <div class="foot">
      <button class="found" id="count">—</button>
      <div class="meta">
        <button class="rankbtn" id="rankBtn">—</button>
        · <span class="star" id="tutti">★ Tutti pendent</span>
        <span id="practiceNew" class="hidden"> · <button class="rankbtn" id="newPractice">Nova pràctica</button></span>
      </div>
    </div>
  </main>

  <div class="panel hidden" id="panel" onclick="if(event.target===this)this.classList.add('hidden')"></div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Crear `css/styles.css`**

```css
* { box-sizing: border-box; }
body {
  margin: 0; background: #f1f5f9; font-family: system-ui, sans-serif; color: #1f2937;
  display: flex; justify-content: center; padding: 16px;
}
.pl {
  width: 100%; max-width: 400px; background: #fff; border: 1px solid #eef2f4;
  border-radius: 18px; padding: 16px 16px 20px; box-shadow: 0 8px 26px rgba(0,0,0,.06);
}
.topbar { display: flex; justify-content: space-between; align-items: center; }
.logo { font-weight: 800; font-size: 20px; letter-spacing: .5px; }
.modes { display: flex; gap: 6px; }
.mode {
  border: 1.5px solid #d8dee4; background: #fff; color: #475569; border-radius: 999px;
  padding: 6px 12px; font-size: 13px; cursor: pointer;
}
.mode.active { background: #58b4c4; border-color: #58b4c4; color: #fff; }

.goal { text-align: center; color: #6b7280; font-size: 13px; margin-top: 12px; }
.goal b { display: block; font-size: 38px; color: #1f2937; line-height: 1.15; }
.disp { text-align: center; font-size: 26px; letter-spacing: 2px; margin: 12px 0 4px; min-height: 34px; }
.cursor { color: #58b4c4; }
.flash { text-align: center; min-height: 22px; font-size: 14px; font-weight: 600; }
.flash.found { color: #16a34a; }
.flash.tutti { color: #eab308; }
.flash.dup { color: #d97706; }
.flash.error { color: #dc2626; }

.hive { display: flex; flex-direction: column; align-items: center; margin: 6px 0 16px; }
.hrow { display: flex; gap: 8px; }
.hrow + .hrow { margin-top: -14px; }
.hex {
  width: 72px; height: 83px; background: #58b4c4; color: #fff; font-size: 28px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; cursor: pointer; border: none;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
.hex.center { background: #ec5a52; }
.hex:active { filter: brightness(.92); }

.ops { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 12px; }
.op { padding: 11px 0; border: 1.5px solid #e2e8f0; border-radius: 999px; background: #fff; color: #334155; font-size: 19px; cursor: pointer; }
.actions { display: flex; align-items: center; justify-content: center; gap: 14px; }
.pill { padding: 11px 22px; border: 1.5px solid #d8dee4; border-radius: 999px; background: #fff; color: #374151; font-size: 14px; cursor: pointer; }
.round { width: 44px; height: 44px; border: 1.5px solid #d8dee4; border-radius: 999px; background: #fff; color: #58b4c4; font-size: 18px; cursor: pointer; }
.send { border-color: #58b4c4; color: #0e7490; font-weight: 700; }

.foot { text-align: center; margin-top: 16px; }
.found { background: none; border: none; color: #374151; font-size: 14px; cursor: pointer; }
.meta { color: #6b7280; font-size: 13px; margin-top: 6px; }
.rankbtn { background: none; border: none; color: #1f2937; font-weight: 600; cursor: pointer; font-size: 13px; }
.star { color: #eab308; }
.star.done { color: #eab308; font-weight: 700; }

.panel { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; padding: 20px; }
.panel-card { background: #fff; border-radius: 14px; padding: 18px 20px; max-width: 360px; width: 100%; max-height: 70vh; overflow: auto; }
.panel-card h3 { margin: 0 0 10px; }
.panel-card ul { margin: 0; padding-left: 18px; }
.panel-card li { margin: 4px 0; }
.hidden { display: none; }
```

- [ ] **Step 3: Verificar visualment**

Run: `python -m http.server 8000`
Obrir `http://localhost:8000` al navegador.
Expected: es veu el marc (logo, modes, objectiu "—", rusc buit, operadors buits, accions, peu). El rusc i els operadors encara són buits (els omple `ui.js`/`app.js`). L'estètica (turquesa/coral/pastilles) coincideix amb el mockup. Aturar amb Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: esquelet HTML i tema Paraulogic del client"
```

---

## Task 5: `ui.js` — helpers de render i DOM

**Files:**
- Create: `js/ui.js`

- [ ] **Step 1: Implementar `js/ui.js`**

```javascript
// Helpers de render i DOM (sense estat de joc). Reben elements i dades.

// Mostra els operadors interns (* / -) amb símbols bonics.
export function pretty(text) {
  return text.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");
}

const OPS = [
  ["+", "+"], ["−", "-"], ["×", "*"], ["÷", "/"],
  ["^", "^"], ["√", "√"], ["(", "("], [")", ")"],
];

// Disposa els 7 dígits en flor 2-3-2 (perifèriques + central).
export function renderHive(container, digits, centralIndex, onCell) {
  container.innerHTML = "";
  const order = [0, 1, 2, 3, 4, 5]; // posicions perifèriques (índexs a `peripherals`)
  const peripherals = digits.filter((_, i) => i !== centralIndex);
  const central = digits[centralIndex];
  const layout = [
    [peripherals[0], peripherals[1]],
    [peripherals[2], { center: central }, peripherals[3]],
    [peripherals[4], peripherals[5]],
  ];
  for (const row of layout) {
    const r = document.createElement("div");
    r.className = "hrow";
    for (const cell of row) {
      const btn = document.createElement("button");
      const value = typeof cell === "object" ? cell.center : cell;
      btn.className = "hex" + (typeof cell === "object" ? " center" : "");
      btn.textContent = String(value);
      btn.addEventListener("click", () => onCell(String(value)));
      r.appendChild(btn);
    }
    container.appendChild(r);
  }
}

export function renderOps(container, onOp) {
  container.innerHTML = "";
  for (const [label, value] of OPS) {
    const b = document.createElement("button");
    b.className = "op";
    b.textContent = label;
    b.addEventListener("click", () => onOp(value));
    container.appendChild(b);
  }
}

export function setTarget(el, target) {
  el.textContent = String(target);
}

export function setDisplay(el, text) {
  el.innerHTML = pretty(text) + '<span class="cursor">|</span>';
}

const FLASH = {
  found: "found", tutti: "tutti", duplicate: "dup",
  wrong: "error", invalid: "error", notInList: "error",
};
const MSG = {
  found: (p) => `Trobada! +${p}`,
  tutti: (p) => `★ TUTTI! +${p}`,
  duplicate: () => "Ja la tens",
  wrong: () => "No arriba a l'objectiu",
  invalid: () => "No és vàlida",
  notInList: () => "No és del repte d'avui",
};
export function flash(el, result) {
  el.className = "flash " + (FLASH[result.status] || "error");
  el.textContent = MSG[result.status](result.points);
}

export function updateFooter({ countEl, rankEl, tuttiEl, found, total, rankName, tuttiFound }) {
  countEl.textContent = `Has trobat ${found} de ${total} solucions.`;
  rankEl.textContent = rankName;
  tuttiEl.textContent = tuttiFound ? "★ Tutti trobat!" : "★ Tutti pendent";
  tuttiEl.classList.toggle("done", tuttiFound);
}

export function openPanel(panelEl, title, innerHTML) {
  panelEl.innerHTML = `<div class="panel-card"><h3>${title}</h3>${innerHTML}</div>`;
  panelEl.classList.remove("hidden");
}

export function foundListHTML(foundMap) {
  if (foundMap.size === 0) return "<p>Encara no has trobat cap solució.</p>";
  const items = [...foundMap.values()]
    .sort((a, b) => b.points - a.points)
    .map((f) => `<li>${pretty(f.text)} <small>(+${f.points})</small></li>`)
    .join("");
  return `<ul>${items}</ul>`;
}

export function ranksHTML(ranks, score) {
  const items = ranks
    .map(([name, th]) => `<li>${score >= th ? "✓" : "·"} ${name} <small>(${th} pts)</small></li>`)
    .join("");
  return `<ul>${items}</ul>`;
}
```

- [ ] **Step 2: Verificar que carrega sense errors de sintaxi**

Run: `node --check js/ui.js`
Expected: cap sortida (sintaxi vàlida). (No s'executa: usa `document`, que no existeix a Node; només es comprova la sintaxi.)

- [ ] **Step 3: Commit**

```bash
git add js/ui.js
git commit -m "feat: ui.js (render del rusc, operadors, peu, panells)"
```

---

## Task 6: `app.js` — orquestració i joc complet

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Implementar `js/app.js`**

```javascript
// Punt d'entrada: carrega el pool, gestiona modes, connecta game/ui/storage.
import { createGame } from "./game.js";
import { loadProgress, saveProgress } from "./storage.js";
import { dailyIndex, practiceIndex } from "./modes.js";
import * as ui from "./ui.js";

const $ = (id) => document.getElementById(id);
const els = {
  target: $("target"), display: $("display"), flash: $("flash"),
  hive: $("hive"), ops: $("ops"), del: $("del"), shuffle: $("shuffle"),
  send: $("send"), count: $("count"), rankBtn: $("rankBtn"), tutti: $("tutti"),
  panel: $("panel"), practiceNew: $("practiceNew"), newPractice: $("newPractice"),
};

const pool = await fetch("data/puzzles.json").then((r) => r.json());

let mode = "daily";
let poolIndex = 0;
let game = null;
let expr = "";

function dailyIdx() {
  return dailyIndex(pool.startDate, Date.now(), pool.puzzles.length);
}

function start(index) {
  poolIndex = index;
  const puzzle = pool.puzzles[index];
  game = createGame(puzzle, loadProgress(localStorage, index));
  expr = "";
  ui.setTarget(els.target, puzzle.target);
  ui.renderHive(els.hive, puzzle.digits, puzzle.centralIndex, addToken);
  ui.renderOps(els.ops, addToken);
  ui.setDisplay(els.display, expr);
  els.flash.textContent = "";
  refreshFooter();
}

function refreshFooter() {
  ui.updateFooter({
    countEl: els.count, rankEl: els.rankBtn, tuttiEl: els.tutti,
    found: game.found.size, total: game.puzzle.solutions.length,
    rankName: game.rank(), tuttiFound: game.tuttiFound,
  });
}

function addToken(t) {
  expr += t;
  ui.setDisplay(els.display, expr);
}

function del() {
  expr = expr.slice(0, -1);
  ui.setDisplay(els.display, expr);
}

function send() {
  if (!expr) return;
  const res = game.submit(expr);
  ui.flash(els.flash, res);
  if (res.status === "found" || res.status === "tutti") {
    saveProgress(localStorage, poolIndex, game.progress());
    refreshFooter();
    expr = "";
    ui.setDisplay(els.display, expr);
  }
}

function setMode(next) {
  mode = next;
  document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === next));
  els.practiceNew.classList.toggle("hidden", next !== "practice");
  if (next === "daily") start(dailyIdx());
  else start(practiceIndex(Math.random, pool.puzzles.length, dailyIdx()));
}

// Events
els.del.addEventListener("click", del);
els.send.addEventListener("click", send);
els.shuffle.addEventListener("click", () => start(poolIndex)); // re-render barreja l'ordre? -> veure nota
els.count.addEventListener("click", () =>
  ui.openPanel(els.panel, "Solucions trobades", ui.foundListHTML(game.found))
);
els.rankBtn.addEventListener("click", () =>
  ui.openPanel(els.panel, "Rangs", ui.ranksHTML(game.puzzle.ranks, game.score()))
);
els.newPractice.addEventListener("click", () =>
  start(practiceIndex(Math.random, pool.puzzles.length, dailyIdx()))
);
document.querySelectorAll(".mode").forEach((b) =>
  b.addEventListener("click", () => setMode(b.dataset.mode))
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { send(); e.preventDefault(); }
  else if (e.key === "Backspace") { del(); e.preventDefault(); }
  else if (e.key === "Escape") { expr = ""; ui.setDisplay(els.display, expr); }
  else if (/^[1-9]$/.test(e.key)) addToken(e.key);
  else if ("+-*/^()".includes(e.key)) addToken(e.key);
  else if (e.key === "r") addToken("√");
});

start(dailyIdx());
```

> Nota: per a "Remena" cal barrejar només les 6 cel·les perifèriques mantenint la central. Implementar a `ui.renderHive` un paràmetre opcional d'ordre, o barrejar `digits` conservant `centralIndex`. Per simplicitat, el botó "⟳" torna a renderitzar el rusc amb les perifèriques en ordre aleatori; veure Step 2.

- [ ] **Step 2: Afegir la barreja real a "Remena"**

Substituir, a `js/app.js`, la línia del listener de `shuffle`:

```javascript
els.shuffle.addEventListener("click", () => start(poolIndex)); // re-render barreja l'ordre? -> veure nota
```

per una barreja de perifèriques que conserva la central i el progrés:

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
  shuffled.splice(p.centralIndex, 0, central); // re-insereix la central a la seva posició
  ui.renderHive(els.hive, shuffled, p.centralIndex, addToken);
});
```

- [ ] **Step 3: Verificar sintaxi**

Run: `node --check js/app.js`
Expected: cap sortida (sintaxi vàlida).

- [ ] **Step 4: Verificació manual end-to-end**

Run: `python -m http.server 8000`
Obrir `http://localhost:8000`. Comprovar:
1. Es carrega el repte **diari**: objectiu, rusc ple (central coral), operadors.
2. Construir una solució tocant cel·les/operadors o pel teclat; "Envia" amb una solució vàlida → flash verd "Trobada! +N", el comptador puja, el display es buida.
3. Repetir la mateixa solució (o commutativa) → flash taronja "Ja la tens", el comptador NO puja.
4. Una expressió que no arribi a l'objectiu → flash vermell.
5. Si trobes un **tutti** (els 7 dígits) → flash daurat "★ TUTTI! +10" i l'estrela passa a "Tutti trobat!".
6. Tocar el comptador obre la llista de trobades (amb el teu text); tocar el rang mostra els llindars.
7. **Recarregar la pàgina** → el progrés del diari es manté.
8. Canviar a **Pràctica** → repte diferent; "Nova pràctica" en porta un altre; el progrés de pràctica també es desa.
Aturar amb Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "feat: app.js (joc complet: modes, entrada, progres)"
```

---

## Task 7: Suite i tancament

- [ ] **Step 1: Executar tota la suite JS**

Run: `node --test` (des de l'arrel)
Expected: tots els tests passen (els del 2a + game, storage, modes del 2b).

- [ ] **Step 2: Verificació manual completa**

Repetir el Step 4 de la Tasca 6 i confirmar que els 8 punts funcionen. Aquesta és la verificació de la capa DOM (no coberta per tests unitaris).

- [ ] **Step 3: Completar la branca**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."
**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch — verificar tests, presentar opcions i, en triar PR, obrir-lo cap a `main` al repo `skinnydkd/numerologic`.

---

## Self-Review

- **Cobertura de la spec (`2026-05-25-client-game-design.md`):**
  - §3 fitxers/mòduls → Tasks 1-6. ✓
  - §4 `game.js` (createGame, submit amb tots els status, score, rank, tuttiBonus, progress) → Task 1. ✓
  - §5 `storage.js` (load/save per índex, store injectable, tots dos modes desen) → Task 2 + ús a app (Task 6). ✓
  - §6 modes (dailyIndex per data, practiceIndex evita el diari) → Task 3 + ús a app. ✓
  - §7 UI (render, entrada tàctil + teclat, flaixos, llista de trobades, panell de rangs, Remena) → Tasks 4-6. ✓
  - §7b forma llegible = text del jugador (Opció A) → `found` desa `text`; `foundListHTML` el mostra (pretty). ✓
  - §2 estètica (tema, rusc uniforme) → Task 4 CSS. ✓
  - §8 proves (lògica amb node:test; UI manual) → Tasks 1-3 (test) + Tasks 4/6 (manual). ✓
  - §9 límits (`notInList` per 5-6 operands) → cobert per game.submit + missatge. ✓
- **Placeholders:** cap; tot fitxer té el codi complet. La "Nota" de la Tasca 6 es resol al Step 2 amb codi real.
- **Consistència de tipus/noms:** `createGame(puzzle, progress)`, `game.submit→{status,points?}`, `game.found` (Map), `game.score/rank/tuttiBonus/progress`, `TUTTI_BONUS` — coherents entre test, game.js i app.js. `loadProgress/saveProgress(store, index, progress)` coherents. `dailyIndex(startDateISO, todayMs, len)` i `practiceIndex(random, len, exclude)` coherents. `ui.renderHive/renderOps/setTarget/setDisplay/flash/updateFooter/openPanel/foundListHTML/ranksHTML/pretty` usats igual a app.js. ✓
```
