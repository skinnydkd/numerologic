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
