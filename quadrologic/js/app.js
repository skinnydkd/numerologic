// Punt d'entrada: carrega el pool, connecta game/ui/storage i porta el rellotge.
import { createGame } from "./game.js";
import { loadProgress, saveProgress, loadStreak, saveStreak } from "./storage.js";
import { computeStreak, streakDisplay, todayStr } from "./streak.js";
import { dailyIndex } from "./modes.js";
import * as ui from "./ui.js";
import { buildShareText } from "./share.js";

const $ = (id) => document.getElementById(id);
const els = {
  board: $("board"), keys: $("keys"), flash: $("flash"), clock: $("clock"), notes: $("notes"),
  del: $("del"), check: $("check"), count: $("count"), rankBtn: $("rankBtn"), goalSt: $("goalSt"),
  star: $("star"), streak: $("streak"), panel: $("panel"), share: $("share"), difficulty: $("difficulty"),
  help: $("help"), pistes: $("pistes"), num: $("num"), yesterday: $("yesterday"),
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
const n = puzzle.size;
const cageOf = Array(n * n);
puzzle.cages.forEach((c, k) => c.cells.forEach(([r, col]) => { cageOf[r * n + col] = k; }));

let selected = game.values.findIndex((v) => !v);
let notesMode = false;
let marks = {};
let running = game.started && !game.solved;

const streakNow = () => streakDisplay(loadStreak(localStorage), todayStr(Date.now()));
const save = () => saveProgress(localStorage, poolIndex, game.progress());

function render() {
  ui.renderBoard(els.board, game, cageOf, marks, game.solved ? -1 : selected, (i) => { selected = i; render(); });
  ui.renderClock(els.clock, game);
  els.notes.setAttribute("aria-pressed", String(notesMode));
  ui.updateFooter({ countEl: els.count, rankEl: els.rankBtn, goalEl: els.goalSt, starEl: els.star, streakEl: els.streak, game, streak: streakNow() });
}

function won() {
  running = false;
  saveStreak(localStorage, computeStreak(loadStreak(localStorage), todayStr(Date.now())));
  ui.flash(els.flash, "tutti", `✦ Resolt! ${game.rank()}${game.perfect ? " ★" : ""}`, true);
}

// Totes les accions passen per aquí: engeguen el rellotge, desen i detecten la resolució.
function act(fn) {
  if (game.solved || selected < 0) return;
  const changed = fn();
  if (!changed) return;
  running = true;
  if (game.solved) won();
  save();
  render();
}

function key(v) {
  act(() => {
    delete marks[selected];
    return notesMode ? game.toggleNote(selected, v) : game.set(selected, v);
  });
}

function del() {
  act(() => { delete marks[selected]; return game.clear(selected); });
}

function check() {
  if (game.solved) return;
  const wrong = game.check();
  marks = Object.fromEntries(wrong.map((i) => [i, "wrong"]));
  running = true;
  save();
  if (wrong.length) ui.flash(els.flash, "error", `${wrong.length === 1 ? "1 cel·la errònia" : `${wrong.length} cel·les errònies`} (+30 s)`);
  else ui.flash(els.flash, "found", "De moment, tot bé");
  render();
}

function move(dr, dc) {
  const r = Math.floor(Math.max(selected, 0) / n), c = Math.max(selected, 0) % n;
  selected = ((r + dr + n) % n) * n + ((c + dc + n) % n);
  render();
}

els.difficulty.innerHTML = `<span class="${puzzle.difficulty}">${ui.LEVEL_LABEL[puzzle.difficulty]} · ${n}×${n}</span>`;
els.num.textContent = `Núm. ${poolIndex + 1}`;
if (game.solved) ui.flash(els.flash, "tutti", `✦ Resolt! ${game.rank()}${game.perfect ? " ★" : ""}`, true);
ui.renderKeys(els.keys, n, key);

els.del.addEventListener("click", del);
els.check.addEventListener("click", check);
els.notes.addEventListener("click", () => { notesMode = !notesMode; render(); });
const openRanks = () => ui.openPanel(els.panel, "Rangs", ui.ranksHTML(puzzle.refSeconds, game.rank()));
els.count.addEventListener("click", openRanks);
els.rankBtn.addEventListener("click", openRanks);
els.yesterday.addEventListener("click", () => {
  const yIdx = dailyIndex(pool.startDate, Date.now() - 86400000, pool.puzzles.length);
  ui.openPanel(els.panel, "Solució d'ahir", ui.yesterdayHTML(pool.puzzles[yIdx], yIdx + 1));
});
els.help.addEventListener("click", () => ui.openPanel(els.panel, "Com jugar", ui.instructionsHTML()));
els.pistes.addEventListener("click", () => {
  ui.openPanel(els.panel, "Pistes", ui.hintsHTML(!game.solved));
  const b = $("doHint");
  if (b) b.addEventListener("click", () => {
    const i = game.hint();
    delete marks[i];
    selected = i;
    running = true;
    els.panel.classList.add("hidden");
    if (game.solved) won();
    save();
    render();
  });
});
els.share.addEventListener("click", async () => {
  const text = buildShareText({
    number: poolIndex + 1, size: n, seconds: game.seconds(), solved: game.solved,
    rankName: game.rank(), perfect: game.perfect, streak: streakNow(),
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

const ARROWS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!els.panel.classList.contains("hidden")) {
    if (e.key === "Escape") els.panel.classList.add("hidden");
    return;
  }
  if (ARROWS[e.key]) { move(...ARROWS[e.key]); e.preventDefault(); }
  else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { del(); e.preventDefault(); }
  else if (e.key === "Enter") { check(); e.preventDefault(); }
  else if (e.key === "n" || e.key === "N") { notesMode = !notesMode; render(); }
  else if (/^[1-9]$/.test(e.key) && Number(e.key) <= n) key(Number(e.key));
});

// Rellotge: compta només amb la pestanya visible i la partida començada i sense resoldre.
let ticks = 0;
setInterval(() => {
  if (!running || game.solved || document.visibilityState !== "visible") return;
  game.tick(1);
  ui.renderClock(els.clock, game);
  if (++ticks % 5 === 0) save();
}, 1000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
