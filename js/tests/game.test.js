import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, TUTTI_BONUS, BREVI_BONUS, BREVI_POINTS } from "../game.js";

// Fixture realista: central = 7 (mai 1), no-repeat. 4*7 = 28.
function puzzle() {
  return {
    target: 28,
    digits: [1, 2, 3, 4, 5, 6, 7],
    centralIndex: 6, // central = 7
    solutions: ["(* 4 7)"],
    totalPoints: 12,
    ranks: [["Principiant", 0], ["Mig", 6], ["Llegenda", 12]],
    hasTutti: true,
    rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
  };
}

test("solució comptada nova -> found (operands reduïts)", () => {
  const g = createGame(puzzle());
  const r = g.submit("4*7");
  assert.equal(r.status, "found");
  assert.equal(r.points, 2); // 2 operands
  assert.equal(g.found.size, 1);
  assert.equal(g.score(), 2);
});

test("dedup commutatiu -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("4*7");
  assert.equal(g.submit("7*4").status, "duplicate");
  assert.equal(g.found.size, 1);
});

test("×1 trivial no crea solució nova -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("4*7");
  const r = g.submit("4*7*1"); // ×1 -> mateixa forma canònica
  assert.equal(r.status, "duplicate");
  assert.equal(g.found.size, 1);
});

test("÷1 trivial no crea solució nova -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("4*7");
  assert.equal(g.submit("(4*7)/1").status, "duplicate");
});

test("no arriba a l'objectiu -> wrong", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("4+7").status, "wrong"); // 4+7=11, central ok, no repeat
});

test("sintaxi invàlida -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("4*").status, "invalid");
});

test("sense el dígit central -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("4*1*2").status, "invalid"); // no usa el 7 central
});

test("tutti real (1 sumat de debò) -> tutti amb bonus", () => {
  const g = createGame(puzzle());
  const r = g.submit("1+2+3+4+5+6+7"); // = 28, tots els dígits, l'1 sumat
  assert.equal(r.status, "tutti");
  assert.equal(r.points, TUTTI_BONUS);
  assert.equal(g.tuttiFound, true);
  assert.equal(g.tuttiBonus(), TUTTI_BONUS);
});

test("usar l'1 com a ×1 NO és tutti", () => {
  const g = createGame(puzzle());
  // (2*3+4+5+6+7)*1 = 28, usa els 7 dígits però l'1 és trivial -> no tutti
  const r = g.submit("(2*3+4+5+6+7)*1");
  assert.equal(r.status, "found");
  assert.equal(g.tuttiFound, false);
});

test("tutti repetit -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("1+2+3+4+5+6+7");
  assert.equal(g.submit("7+6+5+4+3+2+1").status, "duplicate");
});

test("rang segons la puntuació", () => {
  const g = createGame(puzzle());
  assert.equal(g.rank(), "Principiant");
  g.submit("1+2+3+4+5+6+7"); // tutti +10 >= 6
  assert.equal(g.rank(), "Mig");
});

test("progress() i restauració amb createGame", () => {
  const g = createGame(puzzle());
  g.submit("4*7");             // +2
  g.submit("1+2+3+4+5+6+7");   // tutti +10
  const g2 = createGame(puzzle(), g.progress());
  assert.equal(g2.found.size, 2);
  assert.equal(g2.score(), 2 + TUTTI_BONUS);
  assert.equal(g2.tuttiFound, true);
});

test("progrés corrupte no peta (omet entrades dolentes)", () => {
  const g = createGame(puzzle(), { found: [{ canonical: "x", text: "@@@" }], tuttiFound: false });
  assert.equal(g.found.size, 0);
});

test("la suma de punts del panell quadra amb score (tutti inclòs)", () => {
  const g = createGame(puzzle());
  g.submit("4*7");            // +2
  g.submit("1+2+3+4+5+6+7");  // tutti +10
  let sum = 0;
  for (const { points } of g.found.values()) sum += points;
  assert.equal(sum, g.score());
  assert.equal(g.found.size, 2);
});

// --- Brevi ---

function breviPuzzle() {
  return {
    target: 20,
    digits: [1, 3, 4, 5, 6, 7, 9],
    centralIndex: 4, // central = 6
    brevi: { operands: 3, count: 2 },
    ranks: [["Principiant", 0], ["Totes", 100]],
    rules: { allowRepeat: false, ops: ["add", "sub", "mul", "div"] },
  };
}

test("una solució de 3 operands compta com a Brevi", () => {
  const g = createGame(breviPuzzle());
  assert.equal(g.breviFound(), 0);
  const r = g.submit("(6-1)*4"); // = 20, 3 operands, central 6
  assert.equal(r.status, "found");
  assert.equal(g.breviFound(), 1);
  assert.equal(g.breviComplete(), false);
});

test("cada solució Brevi val BREVI_POINTS", () => {
  const g = createGame(breviPuzzle());
  g.submit("(6-1)*4");
  const entry = [...g.found.values()][0];
  assert.equal(entry.points, BREVI_POINTS);
});

test("completar el Brevi -> breviComplete i bonus", () => {
  const g = createGame(breviPuzzle());
  g.submit("(6-1)*4");
  g.submit("5+6+9");
  assert.equal(g.breviFound(), 2);
  assert.equal(g.breviComplete(), true);
  assert.equal(g.breviBonus(), BREVI_BONUS);
  assert.equal(g.score(), BREVI_POINTS + BREVI_POINTS + BREVI_BONUS);
});

test("una solució més llarga no compta com a Brevi", () => {
  const g = createGame(breviPuzzle());
  const r = g.submit("6*4-(3+1)"); // = 20, 4 operands
  assert.equal(r.status, "found");
  assert.equal(g.breviFound(), 0);
});

test("BREVI_BONUS és un nombre positiu", () => {
  assert.equal(typeof BREVI_BONUS, "number");
  assert.ok(BREVI_BONUS > 0);
});
