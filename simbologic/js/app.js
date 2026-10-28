// Punt d'entrada: carrega el pool, connecta game/ui/storage.
import { createGame, TOTAL } from "./game.js";
import { loadProgress, saveProgress, loadStreak, saveStreak } from "./storage.js";
import { computeStreak, streakDisplay, todayStr } from "./streak.js";
import { dailyIndex } from "./modes.js";
import * as ui from "./ui.js";
import { buildShareText, gridEmoji } from "./share.js";

const $ = (id) => document.getElementById(id);
const els = {
  tabs: $("tabs"), grid: $("grid"), symbols: $("symbols"), keys: $("keys"), flash: $("flash"),
  del: $("del"), check: $("check"), count: $("count"), rankBtn: $("rankBtn"), goalSt: $("goalSt"),
  star: $("star"), streak: $("streak"), panel: $("panel"), share: $("share"), help: $("help"),
  pistes: $("pistes"), num: $("num"), yesterday: $("yesterday"),
};

let pool;
try {
  const res = await fetch("data/puzzles.json");
  if (!res.ok) throw new Error("HTTP " + res.status);
  pool = await res.json();
} catch (e) {
  document.querySelector(".pl").innerHTML =
    '<p style="text-align:center;color:#dc2626;padding:20px">No s&apos;ha pogut carregar el joc. Recarrega la pàgina.</p>';
  throw e;
}

const poolIndex = dailyIndex(pool.startDate, Date.now(), pool.puzzles.length);
const puzzle = pool.puzzles[poolIndex];
const game = createGame(puzzle, loadProgress(localStorage, poolIndex));
const levels = puzzle.grids.map((g) => g.level);
let active = Math.max(0, levels.findIndex((_, gi) => !game.gridDone(gi)));
let selected = 0;
let bad = new Set(); // símbols erronis a l'última comprovació de la graella oberta

const streakNow = () => streakDisplay(loadStreak(localStorage), todayStr(Date.now()));
const save = () => saveProgress(localStorage, poolIndex, game.progress());
const nSyms = () => puzzle.grids[active].values.length;

// Primer símbol pendent a partir de `from` (o el mateix si no en queda cap).
function nextPending(from, dir = 1) {
  for (let k = 1; k <= nSyms(); k++) {
    const s = (from + dir * k + nSyms() * 2) % nSyms();
    if (!game.isSolved(active, s)) return s;
  }
  return from;
}

function render() {
  const g = puzzle.grids[active];
  ui.renderTabs(els.tabs, levels, levels.map((_, gi) => game.gridDone(gi)), active, selectGrid);
  ui.renderGrid(els.grid, g);
  const status = {};
  for (let s = 0; s < g.values.length; s++) status[s] = game.isSolved(active, s) ? "ok" : bad.has(s) ? "bad" : "";
  ui.renderSymbols(els.symbols, g.values.length, game.entries(active), status, game.gridDone(active) ? -1 : selected, (s) => {
    if (!game.isSolved(active, s)) { selected = s; render(); }
  });
  ui.updateFooter({
    countEl: els.count, rankEl: els.rankBtn, goalEl: els.goalSt, starEl: els.star, streakEl: els.streak,
    doneCount: levels.filter((_, gi) => game.gridDone(gi)).length, score: game.score(), rankName: game.rank(),
    allDone: game.allDone, clean: game.clean,
    anyFault: levels.some((_, gi) => game.gridState(gi).errors > 0 || game.gridState(gi).hints > 0),
    streak: streakNow(),
  });
}

function selectGrid(gi) {
  active = gi;
  bad = new Set();
  selected = game.isSolved(gi, 0) ? nextPending(0) : 0;
  render();
}

function type(ch) {
  if (game.gridDone(active) || game.isSolved(active, selected)) return;
  const cur = game.entries(active)[selected] || "";
  const next = ch === "-" ? (cur.startsWith("-") ? cur.slice(1) : "-" + cur) : cur + ch;
  if (game.enter(active, selected, next)) { bad.delete(selected); save(); render(); }
}

function del() {
  if (game.isSolved(active, selected)) return;
  game.enter(active, selected, (game.entries(active)[selected] || "").slice(0, -1));
  save();
  render();
}

// Tanca la graella: ✦ i ratxa quan s'acaben les tres, i passa a la següent pendent.
function afterProgress(wasAllDone) {
  if (game.gridDone(active)) {
    if (!wasAllDone && game.allDone) {
      saveStreak(localStorage, computeStreak(loadStreak(localStorage), todayStr(Date.now())));
      ui.flash(els.flash, "tutti", game.clean ? "✦ Tres de tres! ★ Net!" : "✦ Tres de tres!", true);
    } else {
      ui.flash(els.flash, "found", `Graella resolta! +${game.gridPoints(active)}`);
      selectGrid(levels.findIndex((_, gi) => !game.gridDone(gi)));
    }
  } else {
    selected = nextPending(selected - 1);
  }
}

function check() {
  if (game.gridDone(active)) return;
  const wasAllDone = game.allDone;
  const r = game.check(active);
  if (!r.right.length && !r.wrong.length) {
    ui.flash(els.flash, "error", "Escriu algun valor abans de comprovar");
    return;
  }
  bad = new Set(r.wrong);
  save();
  if (r.wrong.length) ui.flash(els.flash, "error", r.wrong.length === 1 ? "Hi ha 1 valor incorrecte (−2)" : `Hi ha ${r.wrong.length} valors incorrectes (−${2 * r.wrong.length})`);
  afterProgress(wasAllDone);
  render();
}

els.num.textContent = `Núm. ${poolIndex + 1}`;
if (game.allDone) ui.flash(els.flash, "tutti", game.clean ? "✦ Tres de tres! ★ Net!" : "✦ Tres de tres!", true);
selectGrid(active);
ui.renderKeys(els.keys, type);

els.del.addEventListener("click", del);
els.check.addEventListener("click", check);
els.count.addEventListener("click", () => ui.openPanel(els.panel, "Punts", ui.pointsHTML(levels.map((level, gi) => ({
  level, points: game.gridPoints(gi), done: game.gridDone(gi), ...game.gridState(gi),
})))));
els.rankBtn.addEventListener("click", () => ui.openPanel(els.panel, "Rangs", ui.ranksHTML(game.score())));
els.yesterday.addEventListener("click", () => {
  const yIdx = dailyIndex(pool.startDate, Date.now() - 86400000, pool.puzzles.length);
  ui.openPanel(els.panel, "Solució d'ahir", ui.yesterdayHTML(pool.puzzles[yIdx], yIdx + 1));
});
els.help.addEventListener("click", () => ui.openPanel(els.panel, "Com jugar", ui.instructionsHTML()));
els.pistes.addEventListener("click", () => {
  ui.openPanel(els.panel, "Pistes", ui.hintsHTML(levels[active], !game.gridDone(active)));
  const b = $("doHint");
  if (b) b.addEventListener("click", () => {
    const wasAllDone = game.allDone;
    const s = game.hint(active);
    bad.delete(s);
    save();
    els.panel.classList.add("hidden");
    afterProgress(wasAllDone);
    render();
  });
});
els.share.addEventListener("click", async () => {
  const text = buildShareText({
    number: poolIndex + 1, rankName: game.rank(), score: game.score(), total: TOTAL, clean: game.clean,
    squares: levels.map((_, gi) => gridEmoji(game.gridDone(gi), game.gridClean(gi))).join(""),
    streak: streakNow(),
  });
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      ui.flash(els.flash, "found", "Copiat!");
    }
  } catch {
    // l'usuari ha cancel·lat o no s'ha pogut compartir; ignora
  }
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!els.panel.classList.contains("hidden")) {
    if (e.key === "Escape") els.panel.classList.add("hidden");
    return;
  }
  if (e.key === "Enter") { check(); e.preventDefault(); }
  else if (e.key === "Backspace") { del(); e.preventDefault(); }
  else if (/^[0-9-]$/.test(e.key)) type(e.key);
  else if (e.key === "Tab" || e.key === "ArrowRight" || e.key === "ArrowDown") {
    selected = nextPending(selected, e.shiftKey && e.key === "Tab" ? -1 : 1); render(); e.preventDefault();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    selected = nextPending(selected, -1); render(); e.preventDefault();
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
