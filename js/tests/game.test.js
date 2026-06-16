import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, TUTTI_BONUS, BREVI_BONUS, BREVI_POINTS } from "../game.js";

function puzzle() {
  return {
    target: 28,
    digits: [1, 2, 3, 4, 5, 6, 7],
    centralIndex: 0, // central = 1
    solutions: ["(* 1 4 7)"], // 1*4*7 = 28
    totalPoints: 3,
    ranks: [["Principiant", 0], ["Mig", 2], ["Tot", 3]],
    hasTutti: true,
  };
}

test("solució comptada nova -> found", () => {
  const g = createGame(puzzle());
  const r = g.submit("1*4*7");
  assert.equal(r.status, "found");
  assert.equal(r.points, 3);
  assert.equal(g.found.size, 1);
  assert.equal(g.score(), 3);
});

test("dedup commutatiu -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("1*4*7");
  const r = g.submit("7*4*1"); // mateixa forma canònica
  assert.equal(r.status, "duplicate");
  assert.equal(g.found.size, 1);
});

test("no arriba a l'objectiu -> wrong", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("1+1").status, "wrong");
});

test("sintaxi invàlida -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("1*").status, "invalid");
});

test("sense el dígit central -> invalid", () => {
  const g = createGame(puzzle());
  assert.equal(g.submit("4*7").status, "invalid"); // 28 pero sense l'1 central
});

test("vàlida i = objectiu, acceptada encara que no fos a l'antic conjunt -> found", () => {
  const g = createGame(puzzle());
  // 1*1*4*7 = 28, usa el central; el joc obert l'accepta (la variant per defecte permet repetir)
  const r = g.submit("1*1*4*7");
  assert.equal(r.status, "found");
  assert.equal(r.points, 4);
});

test("tutti (els 7 dígits) -> tutti amb bonus", () => {
  const g = createGame(puzzle());
  const r = g.submit("1+2+3+4+5+6+7"); // = 28, tots els digits
  assert.equal(r.status, "tutti");
  assert.equal(r.points, TUTTI_BONUS);
  assert.equal(g.tuttiFound, true);
  assert.equal(g.score(), TUTTI_BONUS); // el tutti suma 10 punts al total
  assert.equal(g.tuttiBonus(), TUTTI_BONUS);
});

test("tutti repetit -> duplicate", () => {
  const g = createGame(puzzle());
  g.submit("1+2+3+4+5+6+7");
  assert.equal(g.submit("1+2+3+4+5+6+7").status, "duplicate");
});

test("rang segons la puntuació", () => {
  const g = createGame(puzzle());
  assert.equal(g.rank(), "Principiant");
  g.submit("1*4*7"); // score 3
  assert.equal(g.rank(), "Tot");
});

test("progress() i restauració amb createGame", () => {
  const g = createGame(puzzle());
  g.submit("1*4*7");
  g.submit("1+2+3+4+5+6+7");
  const p = g.progress();
  const g2 = createGame(puzzle(), p);
  assert.equal(g2.found.size, 2); // la solució normal + el tutti
  assert.equal(g2.score(), 3 + TUTTI_BONUS); // 3 de la solució + 10 del tutti
  assert.equal(g2.tuttiFound, true);
});

test("progrés corrupte no peta (omet entrades dolentes)", () => {
  const g = createGame(puzzle(), { found: [{ canonical: "x", text: "@@@" }], tuttiFound: false });
  assert.equal(g.found.size, 0);
});

test("la suma de punts del panell quadra amb score (tutti inclòs)", () => {
  const g = createGame(puzzle());
  g.submit("1*4*7");          // +3
  g.submit("1+2+3+4+5+6+7");  // tutti +10
  let sum = 0;
  for (const { points } of g.found.values()) sum += points;
  assert.equal(sum, g.score());  // els ítems de la llista han de sumar el total
  assert.equal(g.found.size, 2); // el tutti és una solució trobada més
});

// --- Brevi (Pla 2) ---

function breviPuzzle() {
  return {
    target: 20,
    digits: [1, 3, 4, 5, 6, 7, 9],
    centralIndex: 4, // central = 6
    brevi: { operands: 3, count: 2 }, // (6-1)*4 i 5+6+9
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
  g.submit("(6-1)*4"); // brevi: val 10, no 3
  const entry = [...g.found.values()][0];
  assert.equal(entry.points, BREVI_POINTS);
});

test("completar el Brevi -> breviComplete i bonus", () => {
  const g = createGame(breviPuzzle());
  g.submit("(6-1)*4"); // brevi 1/2 (10)
  g.submit("5+6+9");   // brevi 2/2 (10)
  assert.equal(g.breviFound(), 2);
  assert.equal(g.breviComplete(), true);
  assert.equal(g.breviBonus(), BREVI_BONUS);
  assert.equal(g.score(), BREVI_POINTS + BREVI_POINTS + BREVI_BONUS); // 10+10 + bonus
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
