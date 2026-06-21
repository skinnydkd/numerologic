// Forma canònica determinista d'un AST.
// Paritat byte a byte amb generator/engine.py::canonical (amb ×1/÷1 absorbits).

function isOne(ast) {
  return ast[0] === "num" && ast[1] === 1;
}

export function reduce1(ast) {
  // Absorbeix ×1 i ÷1 del dígit-fulla 1 (identitats; preserva el valor).
  const k = ast[0];
  if (k === "num") return ast;
  if (k === "sqrt") return ["sqrt", reduce1(ast[1])];
  if (k === "neg") return ["neg", reduce1(ast[1])];
  const a = reduce1(ast[1]);
  const b = reduce1(ast[2]);
  if (k === "mul") {
    if (isOne(a)) return b;
    if (isOne(b)) return a;
  } else if (k === "div") {
    if (isOne(b)) return a;
  }
  return [k, a, b];
}

function flatten(ast, op) {
  // Aplana fills del mateix operador commutatiu i retorna les seves cadenes canòniques.
  const parts = [];
  for (const child of [ast[1], ast[2]]) {
    if (child[0] === op) {
      parts.push(...flatten(child, op));
    } else {
      parts.push(canonicalRaw(child));
    }
  }
  return parts;
}

function canonicalRaw(ast) {
  const k = ast[0];
  if (k === "num") return String(ast[1]);
  if (k === "sqrt") return "r(" + canonicalRaw(ast[1]) + ")";
  if (k === "neg") return "(~ " + canonicalRaw(ast[1]) + ")"; // menys unari (només al client)
  if (k === "add") return "(+ " + flatten(ast, "add").sort().join(" ") + ")";
  if (k === "mul") return "(* " + flatten(ast, "mul").sort().join(" ") + ")";
  const sym = { sub: "-", div: "/", pow: "^" }[k];
  return "(" + sym + " " + canonicalRaw(ast[1]) + " " + canonicalRaw(ast[2]) + ")";
}

export function canonical(ast) {
  return canonicalRaw(reduce1(ast));
}
