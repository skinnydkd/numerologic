// Punt d'entrada: carrega el pool, gestiona modes, connecta game/ui/storage.
import { createGame } from "./game.js";
import { loadProgress, saveProgress } from "./storage.js";
import { dailyIndex, practiceIndex } from "./modes.js";
import * as ui from "./ui.js";
import { buildShareText } from "./share.js";

const $ = (id) => document.getElementById(id);
const els = {
  target: $("target"), display: $("display"), flash: $("flash"),
  hive: $("hive"), ops: $("ops"), del: $("del"), shuffle: $("shuffle"),
  send: $("send"), count: $("count"), rankBtn: $("rankBtn"), tutti: $("tutti"),
  panel: $("panel"), share: $("share"), practiceNew: $("practiceNew"), newPractice: $("newPractice"),
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
els.count.addEventListener("click", () =>
  ui.openPanel(els.panel, "Solucions trobades", ui.foundListHTML(game.found))
);
els.rankBtn.addEventListener("click", () =>
  ui.openPanel(els.panel, "Rangs", ui.ranksHTML(game.puzzle.ranks, game.score()))
);
els.newPractice.addEventListener("click", () =>
  start(practiceIndex(Math.random, pool.puzzles.length, dailyIdx()))
);
els.share.addEventListener("click", async () => {
  const text = buildShareText({
    number: poolIndex + 1,
    rankName: game.rank(),
    found: game.found.size,
    total: game.puzzle.solutions.length,
    tuttiFound: game.tuttiFound,
  });
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      els.flash.className = "flash found";
      els.flash.textContent = "Copiat!";
    }
  } catch {
    // l'usuari ha cancel·lat o no s'ha pogut compartir; ignora
  }
});
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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
