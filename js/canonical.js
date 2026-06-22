// Forma canònica determinista d'un AST.
// Paritat byte a byte amb generator/engine.py::canonical per a expressions SENSE menys
// unari (amb ×1/÷1 absorbits). El menys unari (`neg`, només al client) es plega: el signe
// travessa × i ÷ i els dobles negatius s'anul·len, de manera que (−3)×(−7) ≡ 3×7.
// +, −, ^ i √ són neutres respecte del signe (preserven la paritat amb el generador).

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

function flatten(node, op, out) {
  // Aplana fills del mateix operador commutatiu, acumulant els seus {neg,key}.
  for (const child of [node[1], node[2]]) {
    if (child[0] === op) flatten(child, op, out);
    else out.push(signed(child));
  }
}

function wrap(s) {
  // Render d'un {neg,key}: anteposa el menys unari només si el signe net és negatiu.
  return s.neg ? "(~ " + s.key + ")" : s.key;
}

// {neg, key}: `key` és la canònica de la forma POSITIVA; `neg` indica si el conjunt va negat.
// El signe es factoritza per × i ÷ (i s'anul·la amb dobles negatius); +, −, ^ i √ el deixen
// dins de cada fill (neutres), cosa que manté la paritat amb el generador (sense menys unari).
function signed(ast) {
  const k = ast[0];
  if (k === "num") return { neg: false, key: String(ast[1]) };
  if (k === "neg") {
    const r = signed(ast[1]);
    return { neg: !r.neg, key: r.key };
  }
  if (k === "mul") {
    const parts = [];
    flatten(ast, "mul", parts);
    const neg = parts.reduce((n, p) => n !== p.neg, false);
    const keys = parts.map((p) => p.key).sort();
    return { neg, key: "(* " + keys.join(" ") + ")" };
  }
  if (k === "div") {
    const a = signed(ast[1]);
    const b = signed(ast[2]);
    return { neg: a.neg !== b.neg, key: "(/ " + a.key + " " + b.key + ")" };
  }
  if (k === "sqrt") return { neg: false, key: "r(" + wrap(signed(ast[1])) + ")" };
  if (k === "add") {
    const parts = [];
    flatten(ast, "add", parts);
    return { neg: false, key: "(+ " + parts.map(wrap).sort().join(" ") + ")" };
  }
  const sym = { sub: "-", pow: "^" }[k];
  return { neg: false, key: "(" + sym + " " + wrap(signed(ast[1])) + " " + wrap(signed(ast[2])) + ")" };
}

export function canonical(ast) {
  return wrap(signed(reduce1(ast)));
}
