// Punt d'entrada: carrega el pool, connecta game/ui/storage.
import { createGame } from "./game.js";
import { loadProgress, saveProgress, loadStreak, saveStreak } from "./storage.js";
import { computeStreak, streakDisplay, todayStr } from "./streak.js";
import { dailyIndex } from "./modes.js";
import * as ui from "./ui.js";
import { buildShareText } from "./share.js";

const $ = (id) => document.getElementById(id);
const els = {
  target: $("target"), route: $("route"), value: $("value"), flash: $("flash"), hive: $("hive"),
  back: $("back"), reset: $("reset"), send: $("send"), count: $("count"), rankBtn: $("rankBtn"),
  brevi: $("brevi"), star: $("star"), streak: $("streak"), panel: $("panel"), share: $("share"),
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
const streakNow = () => streakDisplay(loadStreak(localStorage), todayStr(Date.now()));

function render() {
  ui.renderHive(els.hive, game, tap);
  ui.setRoute(els.route, els.value, game);
  els.send.disabled = !game.path.length || game.value() !== puzzle.target;
  els.back.disabled = els.reset.disabled = !game.path.length;
  ui.updateFooter({ countEl: els.count, rankEl: els.rankBtn, breviEl: els.brevi, starEl: els.star, streakEl: els.streak, game, streak: streakNow() });
}

function tap(cell) {
  if (game.tap(cell)) render();
}

function send() {
  const wasComplete = game.breviComplete();
  const res = game.submit();
  if (res.status === "wrong") {
    if (game.path.length) ui.flash(els.flash, "wrong");
    return;
  }
  if (res.status === "duplicate") {
    game.reset();
  } else {
    saveProgress(localStorage, poolIndex, game.progress());
    if (!wasComplete && game.breviComplete()) {
      saveStreak(localStorage, computeStreak(loadStreak(localStorage), todayStr(Date.now())));
      ui.flash(els.flash, "brevi", 0, "✦ Brevi complet! +10");
      render();
      return;
    }
  }
  ui.flash(els.flash, res.status, res.points);
  render();
}

els.target.textContent = String(puzzle.target);
els.num.textContent = `Núm. ${poolIndex + 1}`;
els.back.addEventListener("click", () => { game.back(); render(); });
els.reset.addEventListener("click", () => { game.reset(); render(); });
els.send.addEventListener("click", send);
els.count.addEventListener("click", () => ui.openPanel(els.panel, "Compleció", ui.completionHTML(game)));
els.rankBtn.addEventListener("click", () => ui.openPanel(els.panel, "Rangs", ui.ranksHTML(puzzle.ranks, game.score())));
els.yesterday.addEventListener("click", () => {
  const yIdx = dailyIndex(pool.startDate, Date.now() - 86400000, pool.puzzles.length);
  ui.openPanel(els.panel, "Solució d'ahir", ui.yesterdayHTML(pool.puzzles[yIdx], yIdx + 1));
});
els.help.addEventListener("click", () => ui.openPanel(els.panel, "Com jugar", ui.instructionsHTML()));
els.pistes.addEventListener("click", () => ui.openPanel(els.panel, "Pistes", ui.hintsHTML(game)));
els.share.addEventListener("click", async () => {
  const text = buildShareText({
    number: poolIndex + 1, rankName: game.rank(), score: game.score(), found: game.found.size,
    breviComplete: game.breviComplete(), maratoFound: game.maratoFound(), streak: streakNow(),
  });
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      ui.flash(els.flash, "found", 0, "Copiat!");
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
  if (e.key === "Backspace") { game.back(); render(); e.preventDefault(); }
  else if (e.key === "Escape") { game.reset(); render(); }
  else if (e.key === "Enter" && !(document.activeElement && document.activeElement.classList.contains("hex"))) { send(); e.preventDefault(); }
});

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
