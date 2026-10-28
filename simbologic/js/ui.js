// Helpers de render i DOM (sense estat de joc). Reben elements i dades.
import { RANKS, TOTAL } from "./game.js";

const SHAPES = [
  ["#58b4c4", '<polygon points="50,4 90,27 90,73 50,96 10,73 10,27"/>'],            // hexàgon
  ["#ec5a52", '<circle cx="50" cy="50" r="42"/>'],                                  // cercle
  ["#1f2937", '<polygon points="50,4 94,50 50,96 6,50"/>'],                         // rombe
  ["#eab308", '<polygon points="50,8 94,90 6,90"/>'],                               // triangle
];
export const SYMBOL_NAMES = ["hexàgon", "cercle", "rombe", "triangle"];
export const LEVEL_LABEL = { facil: "Fàcil", mitja: "Mitjà", dificil: "Difícil" };

export function symbolSVG(s, size = 34) {
  const [color, shape] = SHAPES[s];
  return `<svg class="sym" width="${size}" height="${size}" viewBox="0 0 100 100" fill="${color}" role="img" aria-label="${SYMBOL_NAMES[s]}">${shape}</svg>`;
}

const minus = (n) => String(n).replace("-", "−");

export function renderTabs(el, levels, doneFlags, active, onTab) {
  el.innerHTML = "";
  levels.forEach((lv, gi) => {
    const b = document.createElement("button");
    b.className = `tab ${lv}`;
    b.setAttribute("aria-pressed", String(gi === active));
    b.textContent = LEVEL_LABEL[lv] + (doneFlags[gi] ? " ✓" : "");
    b.addEventListener("click", () => onTab(gi));
    el.appendChild(b);
  });
}

// Graella: símbols, total de cada fila a la dreta (× si és producte) i de cada columna a sota.
export function renderGrid(el, grid) {
  const n = grid.size;
  el.style.setProperty("--n", n + 1);
  let html = "";
  grid.cells.forEach((row, i) => {
    html += row.map((s) => `<div class="cell">${symbolSVG(s, n === 3 ? 44 : 36)}</div>`).join("");
    const op = grid.rowOps[i] === "*" ? '<span class="op">×</span>' : "";
    html += `<div class="tot row">${op}${minus(grid.rowTotals[i])}</div>`;
  });
  html += grid.colTotals.map((t) => `<div class="tot col">${minus(t)}</div>`).join("") + '<div class="tot"></div>';
  el.innerHTML = html;
}

// Els símbols de la graella amb el valor escrit; `status[s]`: "ok" resolt, "bad" erroni a l'última comprovació.
export function renderSymbols(el, n, entries, status, selected, onSelect) {
  el.innerHTML = "";
  for (let s = 0; s < n; s++) {
    const b = document.createElement("button");
    b.className = "symval" + (status[s] ? " " + status[s] : "") + (s === selected ? " sel" : "");
    b.innerHTML = `${symbolSVG(s, 24)}<span class="v">${entries[s] ? minus(entries[s]) : "?"}</span>`;
    b.setAttribute("aria-label", `Valor del ${SYMBOL_NAMES[s]}`);
    b.addEventListener("click", () => onSelect(s));
    el.appendChild(b);
  }
}

export function renderKeys(el, onKey) {
  el.innerHTML = "";
  for (const ch of "1234567890-") {
    const b = document.createElement("button");
    b.className = "key";
    b.textContent = minus(ch);
    b.addEventListener("click", () => onKey(ch));
    el.appendChild(b);
  }
}

let flashTimer = null;
export function flash(el, cls, text, keep = false) {
  el.className = "flash " + cls;
  el.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = keep ? null : setTimeout(() => { el.className = "flash"; el.textContent = ""; }, 3000);
}

export function updateFooter({ countEl, rankEl, goalEl, starEl, streakEl, doneCount, score, rankName, allDone, clean, anyFault, streak }) {
  countEl.textContent = `Graelles ${doneCount}/3 (${score} punts).`;
  rankEl.textContent = rankName;
  goalEl.textContent = allDone ? "✦ Tres de tres!" : "✦ Tres de tres pendent";
  goalEl.classList.toggle("done", allDone);
  starEl.textContent = clean ? "★ Net!" : anyFault ? "★ Sense Net" : "★ Net pendent";
  starEl.classList.toggle("done", clean);
  streakEl.textContent = streak > 0 ? `🔥 Ratxa ${streak}` : "";
}

export function openPanel(panelEl, title, innerHTML) {
  panelEl.innerHTML = `<div class="panel-card"><h3>${title}</h3>${innerHTML}</div>`;
  panelEl.classList.remove("hidden");
}

export function ranksHTML(score) {
  const items = RANKS.map(([name, th]) => `<li>${score >= th ? "✓" : "·"} ${name} <small>(${th} pts)</small></li>`).join("");
  return `<ul>${items}</ul><p><small>${score} de ${TOTAL} punts.</small></p>`;
}

export function pointsHTML(rows) {
  const items = rows.map((r) =>
    `<li>${LEVEL_LABEL[r.level]}: <b>${r.points}</b> punts${r.done ? "" : " (pendent)"} <small>· ${r.errors} errors · ${r.hints} pistes</small></li>`).join("");
  return `<ul>${items}</ul><p><small>Cada graella val 10 punts: −2 per error i −3 per pista (mínim 1).</small></p>`;
}

export function hintsHTML(level, pending) {
  const btn = pending
    ? '<p style="text-align:center"><button class="pill send" id="doHint">Revela un símbol</button></p>'
    : "<p>Aquesta graella ja està resolta.</p>";
  return `<p>La pista revela el símbol que se sol deduir primer de la graella <b>${LEVEL_LABEL[level]}</b>. Costa <b>3 punts</b> i fa perdre el ★ Net.</p>${btn}`;
}

export function yesterdayHTML(puzzle, number) {
  const grids = puzzle.grids.map((g) =>
    `<li>${LEVEL_LABEL[g.level]}: ${g.values.map((v, s) => `${symbolSVG(s, 16)} ${minus(v)}`).join(" · ")}</li>`).join("");
  return `<p>Repte <b>Núm. ${number}</b>:</p><ul>${grids}</ul>`;
}

export function instructionsHTML() {
  return `
    <p>Cada símbol amaga un <b>nombre enter</b>. A la dreta de cada fila tens el seu <b>total</b>, i a sota de cada columna, el de la columna. Troba el valor de tots els símbols.</p>
    <p><b>Com es juga</b></p>
    <ul>
      <li>Toca un símbol de sota la graella i escriu-ne el valor amb el teclat de la pantalla o el de l'ordinador (<b>Tab</b> o les fletxes canvien de símbol).</li>
      <li>Prem <b>Comprova</b> (o <b>Enter</b>): els valors correctes es pinten de <b>turquesa</b> i queden fixos; els incorrectes, de <b>roig</b>, i cada un compta com a error.</li>
      <li>Les files i les columnes <b>sumen</b>. A la graella difícil, les files marcades amb <b>×</b> es <b>multipliquen</b>, i hi ha valors <b>negatius</b>.</li>
      <li>Truc: si dues files només es diferencien en un símbol, resta-les.</li>
    </ul>
    <p><b>Punts, ✦ i ★</b></p>
    <ul>
      <li>Hi ha <b>3 graelles</b> cada dia: Fàcil (3×3), Mitjà (4×4) i Difícil (4×4 amb × i negatius).</li>
      <li>Cada graella resolta val <b>10 punts</b>: <b>−2</b> per error i <b>−3</b> per pista, com a mínim 1. El rang va pel percentatge dels 30 punts del dia.</li>
      <li><b>✦ Tres de tres</b>: resoldre les tres. Fa créixer la <b>ratxa</b> 🔥.</li>
      <li><b>★ Net</b>: les tres sense cap error ni pista.</li>
      <li><b>Pistes</b>: revela un símbol de la graella oberta.</li>
      <li><b>Comparteix</b> el resultat sense revelar cap valor.</li>
    </ul>
    <p>Simbològic és germà de <a href="/">Numerològic</a>. L'ha fet <b>Pau Monterde</b>, professor de secundària de Vila-real. És gratuït, sense anuncis i en català.</p>`;
}
