// Helpers de render i DOM (sense estat de joc). Reben elements i dades.
import { CENTER, ROWS, prettyOp } from "./hive.js";

// Rusc en files 3-4-5-4-3. Cel·les: centre (valor inicial), al camí (amb l'ordre), tocables o apagades.
export function renderHive(el, game, onCell) {
  el.innerHTML = "";
  let i = 0;
  for (const len of ROWS) {
    const row = document.createElement("div");
    row.className = "hrow";
    for (let k = 0; k < len; k++, i++) {
      const cell = i;
      const b = document.createElement("button");
      const step = game.path.indexOf(cell);
      if (cell === CENTER) {
        b.className = "hex center" + (game.path.length ? "" : " here");
        b.textContent = String(game.puzzle.start);
        b.setAttribute("aria-label", `Inici: ${game.puzzle.start}`);
      } else {
        const can = game.canTap(cell);
        b.className = "hex" + (step >= 0 ? " on" : can ? "" : " off") + (step === game.path.length - 1 ? " here" : "");
        b.innerHTML = prettyOp(game.puzzle.ops[cell]) + (step >= 0 ? `<small>${step + 1}</small>` : "");
        b.disabled = !can && step < 0;
        b.setAttribute("aria-label", `Cel·la ${prettyOp(game.puzzle.ops[cell])}${step >= 0 ? `, pas ${step + 1}` : ""}`);
        b.addEventListener("click", () => onCell(cell));
      }
      row.appendChild(b);
    }
    el.appendChild(row);
  }
}

// «5 → ×3 → −1»: la ruta com a seqüència d'operacions.
export function routeText(start, ops, route) {
  return [String(start), ...route.map((c) => prettyOp(ops[c]))].join(" → ");
}

export function setRoute(routeEl, valueEl, game) {
  const p = game.puzzle;
  routeEl.textContent = game.path.length ? routeText(p.start, p.ops, game.path) : "Toca una cel·la veïna del centre";
  const v = game.value();
  valueEl.textContent = `= ${String(v).replace("-", "−")}`;
  valueEl.className = "result" + (game.path.length && v === p.target ? " hit" : "");
}

const MSG = {
  found: (p) => `Ruta nova! +${p}`,
  brevi: (p) => `✦ Brevi! +${p}`,
  marato: (p) => `★ Marató! +${p}`,
  duplicate: () => "Aquesta ruta ja la tens",
  wrong: () => "No arriba a l'objectiu",
};
const CLS = { found: "found", brevi: "tutti", marato: "tutti", duplicate: "dup", wrong: "error" };
let flashTimer = null;
export function flash(el, status, points, text) {
  el.className = "flash " + (CLS[status] || "found");
  el.textContent = text || MSG[status](points);
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { el.className = "flash"; el.textContent = ""; }, 3000);
}

export function updateFooter({ countEl, rankEl, breviEl, starEl, streakEl, game, streak }) {
  countEl.textContent = `Has trobat ${game.found.size} ${game.found.size === 1 ? "ruta" : "rutes"} (${game.score()} punts).`;
  rankEl.textContent = game.rank();
  const done = game.breviComplete();
  breviEl.textContent = `✦ Brevi ${done ? "complet!" : "pendent"} (${game.breviFound()}/${game.puzzle.brevi.length})`;
  breviEl.classList.toggle("done", done);
  starEl.textContent = game.maratoFound() ? "★ Marató!" : "★ Marató pendent";
  starEl.classList.toggle("done", game.maratoFound());
  streakEl.textContent = streak > 0 ? `🔥 Ratxa ${streak}` : "";
}

export function openPanel(panelEl, title, innerHTML) {
  panelEl.innerHTML = `<div class="panel-card"><h3>${title}</h3>${innerHTML}</div>`;
  panelEl.classList.remove("hidden");
}

const tag = (game, len) => (len === game.minLen ? " <b>· ✦ Brevi</b>" : len === game.maxLen ? " <b>· ★ Marató</b>" : "");

export function completionHTML(game) {
  const byLen = {};
  for (const f of game.found.values()) byLen[f.len] = (byLen[f.len] || 0) + 1;
  const rows = Object.entries(game.puzzle.byLength)
    .map(([len, total]) => `<li>${len} salts${tag(game, Number(len))}: <b>${byLen[len] || 0}</b> / ${total}</li>`).join("");
  const list = [...game.found.values()].sort((a, b) => a.len - b.len)
    .map((f) => `<li>${routeText(game.puzzle.start, game.puzzle.ops, f.route)} <small>(+${f.points})</small></li>`).join("");
  return `<ul>${rows}</ul>${list ? `<p><b>Les teues rutes</b></p><ul>${list}</ul>` : "<p>Encara no has trobat cap ruta.</p>"}`;
}

export function ranksHTML(ranks, score) {
  return `<ul>${ranks.map(([name, th]) => `<li>${score >= th ? "✓" : "·"} ${name} <small>(${th} pts)</small></li>`).join("")}</ul>`;
}

export function hintsHTML(game) {
  const p = game.puzzle;
  const total = Object.values(p.byLength).reduce((a, b) => a + b, 0);
  const rows = Object.entries(p.byLength).map(([len, n]) => `<li>${len} salts${tag(game, Number(len))}: <b>${n}</b></li>`).join("");
  return `
    <p>✦ <b>Brevi</b>: ${p.brevi.length} ${p.brevi.length === 1 ? "ruta" : "rutes"} de <b>${game.minLen} salts</b>, les més curtes.</p>
    <p>★ <b>Marató</b>: la ruta més llarga fa <b>${game.maxLen} salts</b>.</p>
    <p><b>Rutes per longitud</b></p><ul>${rows}<li>Total: <b>${total}</b></li></ul>`;
}

export function yesterdayHTML(p, number) {
  const li = (r) => `<li>${routeText(p.start, p.ops, r)} = ${p.target}</li>`;
  return `
    <p>Repte <b>Núm. ${number}</b>: de <b>${p.start}</b> a <b>${p.target}</b>.</p>
    <p>✦ <b>Brevi</b> (${p.brevi[0].length} salts):</p><ul>${p.brevi.map(li).join("")}</ul>
    <p>★ <b>Marató</b> (${p.marato[0].length} salts):</p><ul>${li(p.marato[0])}</ul>`;
}

export function instructionsHTML() {
  return `
    <p>Surts del <b>centre</b> (el roig) amb el seu valor i vas tocant cel·les <b>veïnes</b>. Cada cel·la aplica la seua operació. Has d'acabar exactament en l'<b>objectiu</b>.</p>
    <p><b>Com es juga</b></p>
    <ul>
      <li>Toca una cel·la que toque l'última de la ruta. No pots repetir-ne cap.</li>
      <li>Les divisions han de ser <b>exactes</b> i el valor no pot arribar a <b>1000</b>. Les cel·les que no pots tocar es veuen apagades.</li>
      <li><b>Enrere</b> (o Retrocés) desfà l'últim salt. <b>Esborra</b> (o Esc) torna al centre. <b>Envia</b> (o Enter) quan el valor és l'objectiu.</li>
      <li>Cada ruta és una <b>seqüència de cel·les</b>: dues rutes que arriben al mateix valor per llocs diferents són dues solucions.</li>
    </ul>
    <p><b>Punts, ✦ i ★</b></p>
    <ul>
      <li>Cada ruta nova val <b>1 punt per salt</b>.</li>
      <li><b>✦ Brevi</b>: les rutes més curtes. Valen <b>10</b> cadascuna, i trobar-les <b>totes</b> en suma <b>10</b> més i fa créixer la <b>ratxa</b> 🔥.</li>
      <li><b>★ Marató</b>: una de les rutes més llargues. També val <b>10</b>.</li>
      <li>El <b>rang</b> va pel percentatge dels punts totals del dia. A <b>Pistes</b> veus quantes rutes hi ha de cada longitud.</li>
      <li><b>Comparteix</b> el resultat sense revelar cap ruta.</li>
    </ul>
    <p>Rutalògic és germà de <a href="/">Numerològic</a>. L'ha fet <b>Pau Monterde</b>, professor de secundària de Vila-real. És gratuït, sense anuncis i en català.</p>`;
}
