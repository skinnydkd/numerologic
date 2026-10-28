// Punt d'entrada: carrega el pool, connecta game/ui/storage.
import { createGame, hintValues, MAX_GUESSES } from "./game.js";
import { loadProgress, saveProgress, loadStreak, saveStreak } from "./storage.js";
import { computeStreak, streakDisplay, todayStr } from "./streak.js";
import { dailyIndex } from "./modes.js";
import * as ui from "./ui.js";
import { buildShareText } from "./share.js";

const $ = (id) => document.getElementById(id);
const els = {
  board: $("board"), keys: $("keys"), flash: $("flash"), del: $("del"), send: $("send"),
  hard: $("hard"), count: $("count"), rankBtn: $("rankBtn"), goalSt: $("goalSt"), star: $("star"),
  streak: $("streak"), panel: $("panel"), share: $("share"), difficulty: $("difficulty"),
  help: $("help"), pistes: $("pistes"), num: $("num"), yesterday: $("yesterday"),
};

const DIFF_LABEL = { facil: "Fàcil", mitja: "Mitjà", dificil: "Difícil" };

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
let cur = "";

const streakNow = () => streakDisplay(loadStreak(localStorage), todayStr(Date.now()));
const save = () => saveProgress(localStorage, poolIndex, game.progress());

function render() {
  ui.renderBoard(els.board, game.rows(), cur, game.length, puzzle.maxi);
  ui.renderKeys(els.keys, addKey, game.keyColors());
  els.hard.setAttribute("aria-pressed", String(game.hard));
  els.hard.disabled = game.guesses.length > 0;
  ui.updateFooter({
    countEl: els.count, rankEl: els.rankBtn, goalEl: els.goalSt, starEl: els.star, streakEl: els.streak,
    used: game.guesses.length, rankName: game.rank(), won: game.won, lost: game.lost,
    hard: game.hard, streak: streakNow(),
  });
}

function addKey(ch) {
  if (game.done || cur.length >= game.length) return;
  cur += ch;
  render();
}

function del() {
  cur = cur.slice(0, -1);
  render();
}

function send() {
  if (game.done) return;
  const res = game.submit(cur);
  if (res.status === "invalid" || res.status === "hardfail") {
    ui.flash(els.flash, "error", res.reason);
    return;
  }
  cur = "";
  save();
  if (res.status === "won") {
    saveStreak(localStorage, computeStreak(loadStreak(localStorage), todayStr(Date.now())));
    ui.flash(els.flash, "tutti", `✦ Resolta! ${game.rank()}`, true);
  } else if (res.status === "lost") {
    ui.flash(els.flash, "error", `Era ${ui.pretty(puzzle.eq)}`, true);
  }
  render();
}

els.difficulty.innerHTML = `<span class="${puzzle.difficulty}">${DIFF_LABEL[puzzle.difficulty]}</span>` +
  (puzzle.maxi ? ' <span class="special">Maxi · 10 caselles</span>' : "");
els.num.textContent = `Núm. ${poolIndex + 1}`;
if (game.won) ui.flash(els.flash, "tutti", `✦ Resolta! ${game.rank()}`, true);
else if (game.lost) ui.flash(els.flash, "error", `Era ${ui.pretty(puzzle.eq)}`, true);

els.del.addEventListener("click", del);
els.send.addEventListener("click", send);
els.hard.addEventListener("click", () => {
  if (game.setHard(!game.hard)) { save(); render(); }
});
const openRanks = () => ui.openPanel(els.panel, "Rangs", ui.ranksHTML(game.rank(), game.hintsUsed.size > 0));
els.count.addEventListener("click", openRanks);
els.rankBtn.addEventListener("click", openRanks);
els.yesterday.addEventListener("click", () => {
  const yIdx = dailyIndex(pool.startDate, Date.now() - 86400000, pool.puzzles.length);
  ui.openPanel(els.panel, "Solució d'ahir", ui.yesterdayHTML(pool.puzzles[yIdx], yIdx + 1));
});
els.help.addEventListener("click", () => ui.openPanel(els.panel, "Com jugar", ui.instructionsHTML()));
function openHints() {
  ui.openPanel(els.panel, "Pistes", ui.hintsHTML(hintValues(puzzle.eq), game.hintsUsed));
  els.panel.querySelectorAll("[data-hint]").forEach((b) => b.addEventListener("click", () => {
    game.useHint(Number(b.dataset.hint));
    save();
    render();
    openHints();
  }));
}
els.pistes.addEventListener("click", openHints);
els.share.addEventListener("click", async () => {
  const text = buildShareText({
    number: poolIndex + 1, rows: game.rows(), won: game.won, maxGuesses: MAX_GUESSES,
    rankName: game.rank() || "En joc", hard: game.hard, streak: streakNow(),
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

const KEYMAP = { x: "*", X: "*", ":": "/" };
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!els.panel.classList.contains("hidden")) {
    if (e.key === "Escape") els.panel.classList.add("hidden");
    return;
  }
  const k = KEYMAP[e.key] || e.key;
  if (k === "Enter") { send(); e.preventDefault(); }
  else if (k === "Backspace") { del(); e.preventDefault(); }
  else if (k === "Escape") { cur = ""; render(); }
  else if (/^[0-9+\-*/=]$/.test(k)) { addKey(k); e.preventDefault(); }
});

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
