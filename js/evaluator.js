// Avaluador d'expressions amb regles de validesa.
// Paritat amb generator/engine.py (combine, do_sqrt, evaluate).

export const CAP = 1_000_000;
export const MAX_EXPONENT = 19;

export class InvalidExpr extends Error {
  constructor(...args) {
    super(...args);
    this.name = "InvalidExpr";
  }
}

export function combine(op, a, b) {
  let v;
  if (op === "add") v = a + b;
  else if (op === "sub") v = a - b;
  else if (op === "mul") v = a * b;
  else if (op === "div") {
    if (b === 0 || a % b !== 0) throw new InvalidExpr();
    v = a / b;
  } else if (op === "pow") {
    if (b < 0 || b > MAX_EXPONENT || (a === 0 && b === 0)) throw new InvalidExpr();
    v = a ** b;
  } else {
    throw new Error("operador desconegut: " + op);
  }
  if (Math.abs(v) >= CAP) throw new InvalidExpr();
  return v;
}

export function doSqrt(v) {
  if (v < 0 || v === 0 || v === 1) throw new InvalidExpr();
  const r = Math.round(Math.sqrt(v));
  if (r * r !== v) throw new InvalidExpr();
  return r;
}

export function evaluate(ast) {
  const k = ast[0];
  if (k === "num") return ast[1];
  if (k === "sqrt") return doSqrt(evaluate(ast[1]));
  if (k === "neg") return -evaluate(ast[1]); // menys unari (p. ex. ×(−7))
  const a = evaluate(ast[1]);
  const b = evaluate(ast[2]);
  return combine(k, a, b);
}
