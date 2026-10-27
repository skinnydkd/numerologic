// Rusc de Rutalògic: la mateixa geometria que gen_rutalogic/hive.py (19 cel·les, centre = 9).

export const CELLS = [];
for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) if (Math.abs(q + r) <= 2) CELLS.push([q, r]);
export const CENTER = 9;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const idx = (q, r) => CELLS.findIndex(([a, b]) => a === q && b === r);
export const NEIGHBORS = CELLS.map(([q, r]) => DIRS.map(([dq, dr]) => idx(q + dq, r + dr)).filter((i) => i >= 0));
export const ROWS = [3, 4, 5, 4, 3];
const LIMIT = 1000;

// Valor després de passar per una cel·la, o null si la divisió no és exacta o se'n va de límit.
export function applyOp(value, op) {
  const n = Number(op.slice(1));
  let v;
  if (op[0] === "+") v = value + n;
  else if (op[0] === "-") v = value - n;
  else if (op[0] === "*") v = value * n;
  else if (value % n !== 0) return null;
  else v = value / n;
  return Math.abs(v) < LIMIT ? v : null;
}

// Valor al final de `route` (cel·les després del centre), o null si no és vàlida.
export function run(start, ops, route) {
  let value = start, cell = CENTER;
  const seen = new Set([CENTER]);
  for (const nb of route) {
    if (seen.has(nb) || !NEIGHBORS[cell].includes(nb)) return null;
    value = applyOp(value, ops[nb]);
    if (value === null) return null;
    seen.add(nb);
    cell = nb;
  }
  return value;
}

export const prettyOp = (op) => op.replace("*", "×").replace("/", "÷").replace("-", "−");
