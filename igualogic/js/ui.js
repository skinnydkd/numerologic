// Helpers de render i DOM (sense estat de joc). Reben elements i dades.
import { RANKS_BY_GUESSES, MAX_GUESSES } from "./game.js";

// Mostra els operadors interns (* / -) amb símbols bonics.
export function pretty(text) {
  return text.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");
}

// Tauler: files enviades amb colors, la fila en curs amb el que s'escriu i la resta buides.
export function renderBoard(el, rows, current, length, maxi) {
  el.innerHTML = "";
  el.classList.toggle("maxi", !!maxi);
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement("div");
    row.className = "brow";
    row.style.setProperty("--len", length);
    const done = rows[r];
    const text = done ? done.guess : r === rows.length ? current : "";
    for (let i = 0; i < length; i++) {
      const t = document.createElement("div");
      t.className = "tile" + (done ? " " + done.colors[i] : text[i] ? " typed" : "");
      t.textContent = text[i] ? pretty(text[i]) : "";
      row.appendChild(t);
    }
    el.appendChild(row);
  }
}

const KEY_ROWS = [["digits", "1234567890"], ["ops", "+-*/="]];

export function renderKeys(el, onKey, colors) {
  el.innerHTML = "";
  for (const [cls, chars] of KEY_ROWS) {
    const row = document.createElement("div");
    row.className = "krow " + cls;
    for (const ch of chars) {
      const b = document.createElement("button");
      b.className = "key" + (colors[ch] ? " " + colors[ch] : "");
      b.textContent = pretty(ch);
      b.addEventListener("click", () => onKey(ch));
      row.appendChild(b);
    }
    el.appendChild(row);
  }
}

let flashTimer = null;
export function flash(el, cls, text, keep = false) {
  el.className = "flash " + cls;
  el.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = keep ? null : setTimeout(() => { el.className = "flash"; el.textContent = ""; }, 3000);
}

export function updateFooter({ countEl, rankEl, goalEl, starEl, streakEl, used, rankName, won, lost, hard, streak }) {
  countEl.textContent = won ? `Resolta en ${used}/${MAX_GUESSES} intents.` : lost ? "No resolta." : `Intent ${used + 1}/${MAX_GUESSES}`;
  rankEl.textContent = rankName || "En joc";
  goalEl.textContent = won ? "✦ Resolta!" : "✦ Pendent";
  goalEl.classList.toggle("done", won);
  starEl.textContent = hard ? (won ? "★ Mode difícil!" : "★ Mode difícil") : "★ —";
  starEl.classList.toggle("done", hard && won);
  streakEl.textContent = streak > 0 ? `🔥 Ratxa ${streak}` : "";
}

export function openPanel(panelEl, title, innerHTML) {
  panelEl.innerHTML = `<div class="panel-card"><h3>${title}</h3>${innerHTML}</div>`;
  panelEl.classList.remove("hidden");
}

export function ranksHTML(current, hintsUsed) {
  const items = RANKS_BY_GUESSES.map((name, i) =>
    `<li>${current === name ? "✓" : "·"} ${name} <small>(${i + 1} ${i ? "intents" : "intent"})</small></li>`).join("");
  const cap = hintsUsed ? "<p><small>Has fet servir pistes: com a molt, <b>Expert</b>.</small></p>" : "";
  return `<ul>${items}<li>${current === "Principiant" ? "✓" : "·"} Principiant <small>(no resolta)</small></li></ul>${cap}`;
}

const HINTS = [
  ["Operadors a l'esquerra", (h) => h.ops],
  ["Xifres del resultat", (h) => h.resultDigits],
  ["Alguna xifra repetida", (h) => (h.repeated ? "sí" : "no")],
];

// Pistes: cadascuna es revela amb un botó (`data-hint`); usar-ne alguna limita el rang a Expert.
export function hintsHTML(values, used) {
  const items = HINTS.map(([label, get], i) =>
    `<li>${label}: ${used.has(i) ? `<b>${get(values)}</b>` : `<button class="pill hint-btn" data-hint="${i}">Mostra</button>`}</li>`).join("");
  return `<p><small>Si en mires alguna, el rang màxim d'avui és <b>Expert</b>.</small></p><ul>${items}</ul>`;
}

export function yesterdayHTML(puzzle, number) {
  return `<p>Repte <b>Núm. ${number}</b>${puzzle.maxi ? " (Maxi)" : ""}:</p><p style="font-size:24px;font-weight:700;text-align:center">${pretty(puzzle.eq)}</p>`;
}

export function instructionsHTML() {
  const sq = (c) => `<span class="mini" style="background:${c}"></span>`;
  return `
    <p>Cada dia hi ha una <b>igualtat amagada</b> de 8 caselles, com <b>3×7−4=17</b>. El diumenge és <b>Maxi</b>, de 10. Tens <b>6 intents</b> per endevinar-la.</p>
    <p><b>Com es juga</b></p>
    <ul>
      <li>Escriu una igualtat amb el teclat de la pantalla o el de l'ordinador (<b>x</b> o <b>*</b> per a ×, <b>:</b> o <b>/</b> per a ÷) i prem <b>Envia</b>.</li>
      <li>Cada intent ha de ser una igualtat <b>certa</b>, amb un sol <b>=</b> i, a la dreta, només un nombre.</li>
      <li>Es calcula amb <b>prioritat</b>: × i ÷ abans que + i −. Les divisions han de ser <b>exactes</b>.</li>
      <li>No valen els zeros a l'esquerra (05) ni el menys davant d'un nombre (−3+9).</li>
    </ul>
    <p><b>Colors</b></p>
    <ul>
      <li>${sq("#58b4c4")} al lloc correcte · ${sq("#eab308")} hi és, però en un altre lloc · ${sq("#94a3b8")} no hi és.</li>
      <li>Si un caràcter es repeteix, cada aparició compta per separat, com al Wordle.</li>
    </ul>
    <p><b>Rang, ✦ i ★</b></p>
    <ul>
      <li>El <b>rang</b> depén dels intents: a la primera, <b>Llegenda</b>; a la sisena, <b>Aprenent</b>.</li>
      <li><b>✦ Objectiu del dia</b>: resoldre-la. Fa créixer la <b>ratxa</b> 🔥.</li>
      <li><b>★ Mode difícil</b>: s'activa abans del primer intent. Obliga a mantindre al seu lloc tota casella turquesa i a tornar a usar tot caràcter or.</li>
      <li><b>Pistes</b>: nombre d'operadors, xifres del resultat i si es repeteix alguna xifra. Si en mires alguna, el rang màxim és <b>Expert</b>.</li>
      <li><b>Comparteix</b> el resultat amb colors, sense revelar la igualtat.</li>
    </ul>
    <p>Igualògic és germà de <a href="/">Numerològic</a>. L'ha fet <b>Pau Monterde</b>, professor de secundària de Vila-real. És gratuït, sense anuncis i en català.</p>`;
}
