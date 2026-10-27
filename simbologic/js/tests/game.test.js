import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, RANKS, TOTAL } from "../game.js";

const grid = (level, values, order) => ({ level, values, order });
const P = { grids: [grid("facil", [4, 7, 9], [0, 1, 2]), grid("mitja", [1, 2, 3, 5], [3, 2, 1, 0]), grid("dificil", [-2, 6, 8, 11], [1, 0, 2, 3])] };

function solveAll(g, gi) {
  P.grids[gi].values.forEach((v, s) => g.enter(gi, s, String(v)));
  return g.check(gi);
}

test("resoldre una graella neta dona 10 punts", () => {
  const g = createGame(P);
  const r = solveAll(g, 0);
  assert.deepEqual(r.wrong, []);
  assert.ok(r.complete && g.gridDone(0));
  assert.equal(g.gridPoints(0), 10);
  assert.equal(g.score(), 10);
});

test("cada valor erroni compta un error (−2) i no queda fixat", () => {
  const g = createGame(P);
  g.enter(0, 0, "4");
  g.enter(0, 1, "8");
  const r = g.check(0);
  assert.deepEqual(r.right, [0]);
  assert.deepEqual(r.wrong, [1]);
  assert.ok(g.isSolved(0, 0) && !g.isSolved(0, 1));
  assert.equal(g.enter(0, 0, "5"), false); // resolt: ja no es pot canviar
  solveAll(g, 0);
  assert.equal(g.gridPoints(0), 8);
});

test("negatius i pistes (−3), amb mínim d'1 punt", () => {
  const g = createGame(P);
  assert.equal(g.hint(2), 1); // primer de l'ordre del solucionador
  assert.equal(g.entries(2)[1], "6");
  for (let i = 0; i < 5; i++) { g.enter(2, 0, "2"); g.check(2); }
  g.enter(2, 0, "-2");
  solveAll(g, 2);
  assert.equal(g.gridPoints(2), 1);
});

test("✦ tres de tres, ★ net i rangs per percentatge", () => {
  const g = createGame(P);
  assert.equal(g.rank(), "Principiant");
  solveAll(g, 0); solveAll(g, 1);
  assert.ok(!g.allDone);
  assert.equal(g.rank(), "Mestre"); // 20/30 = 67 %
  solveAll(g, 2);
  assert.ok(g.allDone && g.clean);
  assert.equal(g.score(), TOTAL);
  assert.equal(g.rank(), "Llegenda");
  const h = createGame(P);
  h.hint(0); solveAll(h, 0); solveAll(h, 1); solveAll(h, 2);
  assert.ok(h.allDone && !h.clean);
  assert.equal(h.rank(), "Geni"); // 27/30 = 90 %
  assert.equal(RANKS.length, 7);
});

test("entrades: només un enter de fins a 3 caràcters", () => {
  const g = createGame(P);
  assert.equal(g.enter(0, 0, "12a"), false);
  assert.equal(g.enter(0, 0, "-"), true); // a mig escriure
  assert.deepEqual(g.check(0).wrong, []); // «-» sol no és un valor: no compta
});

test("restaura el progrés desat", () => {
  const g = createGame(P);
  g.enter(1, 0, "9"); g.check(1);
  g.hint(1);
  g.enter(1, 2, "3");
  const again = createGame(P, JSON.parse(JSON.stringify(g.progress())));
  assert.ok(again.isSolved(1, 3));
  assert.equal(again.entries(1)[2], "3");
  assert.equal(again.gridState(1).errors, 1);
  assert.equal(again.gridState(1).hints, 1);
});
