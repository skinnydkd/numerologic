// Helpers de render i DOM (sense estat de joc). Reben elements i dades.
import { RANK_TABLE, formatTime, CHECK_PENALTY, HINT_PENALTY } from "./game.js";

const OP_SYM = { "+": "+", "-": "−", "*": "×", "/": "÷", "=": "" };
export const LEVEL_LABEL = { facil: "Fàcil", mitja: "Mitjà", dificil: "Difícil" };

// Etiqueta d'una gàbia: «12×», «2÷», «7»...
export const cageLabel = (c) => `${c.target}${OP_SYM[c.op]}`;

// Graella: vores gruixudes entre gàbies, etiqueta a la primera cel·la, valor o notes.
// `marks[i]`: "wrong" (comprovació errònia) o "" ; `selected`: índex de la cel·la activa.
export function renderBoard(el, game, cageOf, marks, selected, onCell) {
  const n = game.n;
  el.style.setProperty("--n", n);
  el.innerHTML = "";
  const sel = selected >= 0 ? [Math.floor(selected / n), selected % n] : null;
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n), c = i % n;
    const k = cageOf[i];
    const d = document.createElement("button");
    const edge = (rr, cc) => rr < 0 || cc < 0 || rr >= n || cc >= n || cageOf[rr * n + cc] !== k;
    d.className = "qc" +
      (edge(r - 1, c) ? " bt" : "") + (edge(r, c + 1) ? " br" : "") +
      (edge(r + 1, c) ? " bb" : "") + (edge(r, c - 1) ? " bl" : "") +
      (i === selected ? " sel" : sel && (sel[0] === r || sel[1] === c) ? " peer" : "") +
      (marks[i] ? " " + marks[i] : "") + (game.isLocked(i) ? " locked" : "");
    const cage = game.puzzle.cages[k];
    const [fr, fc] = cage.cells[0];
    const label = fr === r && fc === c ? `<span class="cl">${cageLabel(cage)}</span>` : "";
    const body = game.values[i]
      ? `<span class="qv">${game.values[i]}</span>`
      : `<span class="qn">${game.notes[i].map((v) => `<i>${v}</i>`).join("")}</span>`;
    d.innerHTML = label + body;
    d.setAttribute("aria-label", `Fila ${r + 1}, columna ${c + 1}${game.values[i] ? `: ${game.values[i]}` : ""}`);
    d.addEventListener("click", () => onCell(i));
    el.appendChild(d);
  }
}

export function renderKeys(el, n, onKey) {
  el.innerHTML = "";
  el.style.setProperty("--n", n);
  for (let v = 1; v <= n; v++) {
    const b = document.createElement("button");
    b.className = "key";
    b.textContent = String(v);
    b.addEventListener("click", () => onKey(v));
    el.appendChild(b);
  }
}

export function renderClock(el, game) {
  const pen = [];
  if (game.errors) pen.push(`+${game.errors * CHECK_PENALTY} s`);
  if (game.hints) pen.push(`+${game.hints * HINT_PENALTY} s`);
  el.textContent = `⏱ ${formatTime(game.seconds())}` + (pen.length ? `  (${pen.join(", ")})` : "");
}

let flashTimer = null;
export function flash(el, cls, text, keep = false) {
  el.className = "flash " + cls;
  el.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = keep ? null : setTimeout(() => { el.className = "flash"; el.textContent = ""; }, 3000);
}

export function updateFooter({ countEl, rankEl, goalEl, starEl, streakEl, game, streak }) {
  const filled = game.values.filter(Boolean).length;
  countEl.textContent = game.solved ? `Resolt en ${formatTime(game.seconds())}.` : `${filled}/${game.n * game.n} cel·les`;
  rankEl.textContent = game.rank() || "En joc";
  goalEl.textContent = game.solved ? "✦ Resolt!" : "✦ Pendent";
  goalEl.classList.toggle("done", game.solved);
  starEl.textContent = game.perfect ? "★ Perfecte!" : game.errors || game.hints ? "★ Sense Perfecte" : "★ Perfecte pendent";
  starEl.classList.toggle("done", game.perfect);
  streakEl.textContent = streak > 0 ? `🔥 Ratxa ${streak}` : "";
}

export function openPanel(panelEl, title, innerHTML) {
  panelEl.innerHTML = `<div class="panel-card"><h3>${title}</h3>${innerHTML}</div>`;
  panelEl.classList.remove("hidden");
}

export function ranksHTML(ref, current) {
  const items = RANK_TABLE.map(([name, r]) =>
    `<li>${current === name ? "✓" : "·"} ${name} <small>(${r === Infinity ? `més de ${formatTime(3 * ref)}` : `fins a ${formatTime(Math.floor(r * ref))}`})</small></li>`).join("");
  return `<p><small>Temps de referència d'avui: <b>${formatTime(ref)}</b>. Cada comprovació errònia suma ${CHECK_PENALTY} s i cada pista, ${HINT_PENALTY} s.</small></p><ul>${items}</ul>`;
}

export function hintsHTML(pending) {
  const btn = pending
    ? '<p style="text-align:center"><button class="pill send" id="doHint">Revela una cel·la</button></p>'
    : "<p>La graella ja està resolta.</p>";
  return `<p>La pista omple la cel·la que se sol deduir primer d'entre les que encara no tens bé. Suma <b>${HINT_PENALTY} s</b> i fa perdre el ★ Perfecte.</p>${btn}`;
}

export function yesterdayHTML(puzzle, number) {
  const n = puzzle.size;
  const rows = puzzle.solution.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
  return `<p>Repte <b>Núm. ${number}</b> (${n}×${n}):</p><table class="ysol">${rows}</table>`;
}

export function instructionsHTML() {
  return `
    <p>Omple la graella amb les xifres de l'<b>1</b> a la <b>N</b> (N és la mida: 4, 5 o 6) sense repetir cap xifra en una <b>fila</b> ni en una <b>columna</b>.</p>
    <p><b>Gàbies</b></p>
    <ul>
      <li>Les vores gruixudes marquen les <b>gàbies</b>. L'etiqueta diu el resultat i l'operació de les seues xifres: <b>7+</b> suma 7, <b>12×</b> multiplica 12.</li>
      <li><b>1−</b> i <b>2÷</b> només tenen dues cel·les: la gran menys la xicoteta, o la gran entre la xicoteta, en qualsevol ordre.</li>
      <li>Una gàbia d'una cel·la només porta el número: és el valor de la cel·la.</li>
      <li>Dins d'una gàbia es poden repetir xifres si no comparteixen fila ni columna.</li>
    </ul>
    <p><b>Com es juga</b></p>
    <ul>
      <li>Toca una cel·la (o mou-te amb les fletxes) i escriu-hi una xifra. <b>Esborra</b>, Retrocés o 0 la buiden.</li>
      <li><b>Notes</b> (o la tecla N): escriu candidats en petit. Escriure un valor esborra les notes de la cel·la.</li>
      <li>Quan la graella és plena i correcta, es resol sola. <b>Comprova</b> marca de roig les cel·les errònies i suma ${CHECK_PENALTY} s si n'hi ha cap.</li>
    </ul>
    <p><b>Temps, ✦ i ★</b></p>
    <ul>
      <li>De dilluns a dimecres, 4×4; dijous i divendres, 5×5; el cap de setmana, 6×6.</li>
      <li>El <b>rang</b> depén del temps comparat amb el de referència del dia (el veus a Rangs). Les pistes sumen ${HINT_PENALTY} s.</li>
      <li><b>✦ Resolt</b> fa créixer la <b>ratxa</b> 🔥. <b>★ Perfecte</b>: sense comprovacions errònies ni pistes (les notes sí que valen).</li>
      <li><b>Comparteix</b> el temps i el rang sense revelar cap xifra.</li>
    </ul>
    <p>Quadrològic és germà de <a href="/">Numerològic</a>. L'ha fet <b>Pau Monterde</b>, professor de secundària de Vila-real. És gratuït, sense anuncis i en català.</p>`;
}
