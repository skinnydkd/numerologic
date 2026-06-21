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
  while (peripherals.length < 6) peripherals.push(null); // cel·les buides (grises) per a ruscos <7
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
      const isCenter = typeof cell === "object" && cell !== null;
      const value = isCenter ? cell.center : cell;
      if (value === null || value === undefined) {
        btn.className = "hex empty";
        btn.disabled = true;
      } else {
        btn.className = "hex" + (isCenter ? " center" : "");
        btn.textContent = String(value);
        btn.addEventListener("click", () => onCell(String(value)));
      }
      r.appendChild(btn);
    }
    container.appendChild(r);
  }
}

// Les regles permeten potència/arrel? (rules absent => regles completes del joc)
function allowsAdvanced(rules) {
  const ops = rules && rules.ops;
  return !ops || ops.includes("pow") || ops.includes("sqrt");
}

export function renderOps(container, onOp, rules) {
  container.innerHTML = "";
  const advanced = allowsAdvanced(rules);
  for (const [label, value] of OPS) {
    if (!advanced && (value === "^" || value === "√")) continue;
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
  wrong: "error", invalid: "error",
};
const MSG = {
  found: (p) => `Trobada! +${p}`,
  tutti: (p) => `★ TUTTI! +${p}`,
  duplicate: () => "Ja la tens",
  wrong: () => "No arriba a l'objectiu",
  invalid: (p, reason) => reason || "No és vàlida",
};
let flashTimer = null;
export function flash(el, result) {
  el.className = "flash " + (FLASH[result.status] || "error");
  el.textContent = MSG[result.status](result.points, result.reason);
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    el.className = "flash";
    el.textContent = "";
  }, 3000);
}

export function updateFooter({ countEl, rankEl, tuttiEl, breviEl,
                              found, score, rankName, tuttiFound, tuttiCount = 0,
                              breviFound, breviTotal, breviComplete, streak }) {
  countEl.textContent = `Has trobat ${found} solucions (${score} punts).`;
  rankEl.textContent = rankName;
  const nTutti = tuttiCount || (tuttiFound ? 1 : 0); // compat: si no arriba el recompte, deriva'l del booleà
  tuttiEl.textContent = nTutti > 0
    ? `★ ${nTutti} ${nTutti === 1 ? "tutti trobat" : "tuttis trobats"}`
    : "★ Tutti pendent";
  tuttiEl.classList.toggle("done", nTutti > 0);
  if (breviEl && breviTotal > 0) {
    const label = breviComplete ? "✦ Brevi complet!" : "✦ Brevi pendent";
    const streakTxt = streak > 0 ? ` · 🔥 Ratxa ${streak}` : "";
    breviEl.textContent = `${label} (${breviFound}/${breviTotal})${streakTxt}`;
    breviEl.classList.toggle("done", breviComplete);
  } else if (breviEl) {
    breviEl.textContent = "";
  }
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

// Taula de compleció: trobat/total per nombre d'operands. `byLeaves` = totals (claus string),
// `foundMap` = solucions trobades (amb camp `leaves`), `breviOperands` = el tier del Brevi (es marca).
export function completionHTML(byLeaves, foundMap, breviOperands) {
  const foundByLeaves = {};
  for (const { leaves } of foundMap.values()) {
    foundByLeaves[leaves] = (foundByLeaves[leaves] || 0) + 1;
  }
  const rows = Object.keys(byLeaves)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => {
      const total = byLeaves[String(k)];
      const f = foundByLeaves[k] || 0;
      const tag = k === breviOperands ? " <b>· Brevi</b>" : "";
      return `<li>${k} operands${tag}: <b>${f}</b> / ${total}</li>`;
    })
    .join("");
  return `<ul>${rows}</ul>` + foundListHTML(foundMap);
}

export function ranksHTML(ranks, score) {
  const items = ranks
    .map(([name, th]) => `<li>${score >= th ? "✓" : "·"} ${name} <small>(${th} pts)</small></li>`)
    .join("");
  return `<ul>${items}</ul>`;
}

export function instructionsHTML(rules) {
  const advanced = allowsAdvanced(rules);
  const allowRepeat = !rules || rules.allowRepeat !== false;
  const repeatLine = allowRepeat
    ? `<li>Pots <b>reutilitzar</b> els dígits del rusc tantes vegades com vulguis.</li>`
    : `<li>Cada dígit del rusc s'usa <b>com a molt un cop</b> dins d'una expressió.</li>`;
  const opsLine = advanced
    ? `<li>Pots usar <b>+ − × ÷</b>, potència <b>^</b>, arrel <b>√</b> i parèntesis <b>( )</b>.</li>`
    : `<li>Pots usar <b>+ − × ÷</b> i parèntesis <b>( )</b>.</li>`;
  const exactLine = advanced
    ? `<li>Les <b>divisions</b> i les <b>arrels</b> han de ser exactes (8÷4 ✓, 7÷2 ✗; √9 ✓, √8 ✗).</li>`
    : `<li>Les <b>divisions</b> han de ser exactes (8÷4 ✓, 7÷2 ✗).</li>`;
  const pointsBonus = advanced ? ", <b>+2</b> si usa potència o arrel" : "";
  return `
    <p>Numerològic és un <b>Paraulògic matemàtic</b>: cada dia hi ha un número <b>objectiu</b> i un <b>rusc</b> de 5–7 dígits (en els reptes difícils algunes cel·les queden <b>grises</b>, és a dir buides). Troba <b>expressions</b> que hi arribin: <b>qualsevol</b> expressió vàlida compta i suma punts (no cal encertar cap llista amagada, i no hi ha límit de longitud).</p>

    <p><b>Com es juga</b></p>
    <ul>
      <li>Construeix una expressió tocant les <b>cel·les</b> del rusc i els <b>operadors</b> (o amb el <b>teclat</b>), i prem <b>Envia</b>.</li>
      <li>Cada expressió ha d'usar el <b>dígit central</b> (el coral) com a mínim un cop.</li>
      ${repeatLine}
      <li><b>Esborra</b> treu l'últim símbol; <b>⟳ Remena</b> reordena les cel·les.</li>
    </ul>

    <p><b>Operacions i regles</b></p>
    <ul>
      ${opsLine}
      ${exactLine}
      <li>Els resultats <b>intermedis</b> poden ser negatius; només cal que el resultat <b>final</b> sigui l'objectiu.</li>
      <li>Sota l'expressió veuràs el seu <b>resultat en viu</b> (es posa verd quan encertes).</li>
    </ul>

    <p><b>Punts, Brevi i tutti</b></p>
    <ul>
      <li>Cada solució <b>nova</b> suma punts: <b>1 per operand</b>${pointsBonus}.</li>
      <li><b>✦ Brevi</b>: les solucions amb <b>menys operands</b> (les més curtes i difícils de veure) — l'objectiu del dia. Cadascuna val <b>10 punts</b>, i completar-les <b>totes</b> en suma <b>10</b> més.</li>
      <li><b>★ Tutti</b>: una solució que fa servir <b>tots els dígits</b> del rusc. Cadascun val <b>10 punts</b> i en pots trobar <b>més d'un</b>.</li>
      <li>Acumulant punts puges de <b>rang</b> (de Principiant a Llegenda).</li>
      <li>Multiplicar o dividir per <b>1</b> no crea una solució nova.</li>
      <li>La mateixa solució no compta dues vegades (3×4 i 4×3 són la mateixa); si la repeteixes, l'expressió s'esborra sola.</li>
    </ul>

    <p><b>Més</b></p>
    <ul>
      <li><b>Dificultat</b> (Fàcil/Mitjà/Difícil): els reptes difícils tenen objectius més <b>grans</b>, <b>menys dígits</b> (amb cel·les grises) i <b>menys solucions</b>.</li>
      <li><b>Ratxa</b> 🔥: dies seguits completant el Brevi.</li>
      <li><b>Pistes</b>: quantes solucions hi ha del Brevi i per nombre d'operands i operació, sense desvelar-ne cap.</li>
      <li><b>Modes</b>: repte <b>diari</b> (igual per a tothom) i <b>pràctica</b> lliure.</li>
      <li><b>Comparteix</b> el resultat sense revelar cap solució.</li>
    </ul>`;
}

export function hintsHTML(hints, rules, brevi) {
  if (!hints) return "<p>Aquest repte no té pistes.</p>";
  let OPS = [["add", "+"], ["sub", "−"], ["mul", "×"], ["div", "÷"], ["pow", "^"], ["sqrt", "√"]];
  if (!allowsAdvanced(rules)) OPS = OPS.filter(([k]) => k !== "pow" && k !== "sqrt");
  const total = Object.values(hints.byLeaves).reduce((a, b) => a + b, 0);
  const breviOps = brevi ? brevi.operands : null;
  const breviLine = brevi
    ? `<p>✦ <b>Brevi</b>: ${brevi.count} ${brevi.count === 1 ? "solució" : "solucions"} de <b>${brevi.operands} operands</b> — les més curtes. Troba-les totes!</p>`
    : "";
  const leaves = Object.entries(hints.byLeaves)
    .map(([n, c]) => {
      const tag = Number(n) === breviOps ? ` <b>· Brevi</b>` : "";
      return `<li>${n} operands${tag}: <b>${c}</b></li>`;
    })
    .join("");
  const ops = OPS.map(([k, sym]) => `<li>${sym} : <b>${hints.byOp[k]}</b></li>`).join("");
  return `
    ${breviLine}
    <p><b>Solucions per nombre d'operands</b></p>
    <ul>${leaves}<li>Total: <b>${total}</b></li></ul>
    <p><b>Solucions que usen cada operació</b></p>
    <ul>${ops}</ul>`;
}
