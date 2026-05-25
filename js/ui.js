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
  notInList: () => "No és una solució del repte",
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

export function instructionsHTML() {
  return `
    <p>Numerològic és un <b>Paraulògic matemàtic</b>: cada dia hi ha un número <b>objectiu</b> i un rusc de <b>7 dígits</b>. L'objectiu és descobrir <b>totes</b> les expressions que hi arriben.</p>

    <p><b>Com es juga</b></p>
    <ul>
      <li>Construeix una expressió tocant les <b>cel·les</b> del rusc i els <b>operadors</b> (o amb el <b>teclat</b>), i prem <b>Envia</b>.</li>
      <li>Cada expressió ha d'usar el <b>dígit central</b> (el coral) com a mínim un cop.</li>
      <li>Pots <b>reutilitzar</b> els dígits del rusc tantes vegades com vulguis.</li>
      <li><b>Esborra</b> treu l'últim símbol; <b>⟳ Remena</b> reordena les cel·les.</li>
    </ul>

    <p><b>Operacions i regles</b></p>
    <ul>
      <li>Pots usar <b>+ − × ÷</b>, potència <b>^</b>, arrel <b>√</b> i parèntesis <b>( )</b>.</li>
      <li>Les <b>divisions</b> i les <b>arrels</b> han de ser exactes (8÷4 ✓, 7÷2 ✗; √9 ✓, √8 ✗).</li>
      <li>Els resultats <b>intermedis</b> poden ser negatius; només cal que el resultat <b>final</b> sigui l'objectiu.</li>
      <li>Sota l'expressió veuràs el seu <b>resultat en viu</b> (es posa verd quan encertes).</li>
    </ul>

    <p><b>Punts, rangs i tutti</b></p>
    <ul>
      <li>Cada solució <b>nova</b> suma punts: <b>1 per operand</b>, <b>+2</b> si usa potència o arrel.</li>
      <li>Acumulant punts puges de <b>rang</b> (de Principiant a Totes).</li>
      <li><b>★ Tutti</b>: una solució que fa servir <b>els 7 dígits</b> diferents. És especial i dona bonus.</li>
      <li>La mateixa solució no compta dues vegades (3×4 i 4×3 són la mateixa).</li>
    </ul>

    <p><b>Més</b></p>
    <ul>
      <li><b>Dificultat</b> (Fàcil/Mitjà/Difícil): segons quantes solucions necessiten operacions avançades.</li>
      <li><b>Pistes</b>: recompte de solucions per operands i per operació, sense desvelar-ne cap.</li>
      <li><b>Modes</b>: repte <b>diari</b> (igual per a tothom) i <b>pràctica</b> lliure.</li>
      <li><b>Comparteix</b> el resultat sense revelar cap solució.</li>
    </ul>`;
}

export function hintsHTML(hints) {
  if (!hints) return "<p>Aquest repte no té pistes.</p>";
  const OPS = [["add", "+"], ["sub", "−"], ["mul", "×"], ["div", "÷"], ["pow", "^"], ["sqrt", "√"]];
  const total = Object.values(hints.byLeaves).reduce((a, b) => a + b, 0);
  const leaves = Object.entries(hints.byLeaves)
    .map(([n, c]) => `<li>${n} operands: <b>${c}</b></li>`)
    .join("");
  const ops = OPS.map(([k, sym]) => `<li>${sym} : <b>${hints.byOp[k]}</b></li>`).join("");
  return `
    <p><b>Solucions per nombre d'operands</b></p>
    <ul>${leaves}<li>Total: <b>${total}</b></li></ul>
    <p><b>Solucions que usen cada operació</b></p>
    <ul>${ops}</ul>`;
}
