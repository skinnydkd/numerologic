import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, TUTTI_BONUS } from "../game.js";

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
  assert.equal(g.score(), 0); // el tutti no compta a la puntuacio
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
  assert.equal(g2.found.size, 1);
  assert.equal(g2.score(), 3);
  assert.equal(g2.tuttiFound, true);
});

test("progrés corrupte no peta (omet entrades dolentes)", () => {
  const g = createGame(puzzle(), { found: [{ canonical: "x", text: "@@@" }], tuttiFound: false });
  assert.equal(g.found.size, 0);
});
