import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../game.js";
import { CENTER, NEIGHBORS, run } from "../hive.js";

// Rusc fet a mà: tot +1 excepte la cel·la 4 (×2); start 2, target 5.
const ops = Array(19).fill("+1");
ops[CENTER] = null;
ops[4] = "*2";
// Totes les rutes reals fins a 3 salts que arriben al 5, calculades amb run().
function routesTo(target, maxLen) {
  const out = [];
  const dfs = (cell, path) => {
    if (path.length && run(2, ops, path) === target) out.push([...path]);
    if (path.length >= maxLen) return;
    for (const nb of NEIGHBORS[cell]) if (nb !== CENTER && !path.includes(nb)) dfs(nb, [...path, nb]);
  };
  dfs(CENTER, []);
  return out;
}
const all = routesTo(5, 3); // 2 → +1+1+1 = 5 (3 salts) o 2 → ×2 +1 = 5 (2 salts)
const minLen = Math.min(...all.map((r) => r.length));
const maxLen = Math.max(...all.map((r) => r.length));
const P = {
  start: 2, ops, target: 5,
  brevi: all.filter((r) => r.length === minLen), marato: all.filter((r) => r.length === maxLen),
  ranks: [["Principiant", 0], ["Aprenent", 5], ["Llegenda", 100]],
};

test("el valor s'actualitza en viu i només es poden tocar veïnes vàlides", () => {
  const g = createGame(P);
  assert.equal(g.value(), 2);
  assert.ok(!g.tap(0)); // no és veïna del centre
  assert.ok(g.tap(4));
  assert.equal(g.value(), 4);
  assert.ok(!g.tap(4)); // repetida
  g.back();
  assert.deepEqual(g.path, []);
});

test("enviar: ✦ val 10, repetida no compta, i completar les ✦ suma +10", () => {
  const g = createGame(P);
  assert.equal(g.submit().status, "wrong");
  for (const [k, r] of P.brevi.entries()) {
    r.forEach((c) => assert.ok(g.tap(c)));
    const res = g.submit();
    assert.equal(res.status, "brevi");
    assert.equal(res.points, 10);
    if (k === 0) {
      r.forEach((c) => g.tap(c));
      assert.equal(g.submit().status, "duplicate");
      g.reset();
    }
  }
  assert.ok(g.breviComplete());
  assert.equal(g.score(), 10 * P.brevi.length + 10);
  P.marato[0].forEach((c) => g.tap(c));
  assert.equal(g.submit().status, "marato");
  assert.ok(g.maratoFound());
});

test("rang pels llindars del repte i restauració del progrés", () => {
  const g = createGame(P);
  assert.equal(g.rank(), "Principiant");
  P.brevi[0].forEach((c) => g.tap(c));
  g.submit();
  assert.equal(g.rank(), "Aprenent");
  const again = createGame(P, JSON.parse(JSON.stringify(g.progress())));
  assert.equal(again.found.size, 1);
  assert.equal(again.score(), g.score());
  const bad = createGame(P, { found: [[0, 1, 2]] }); // ruta desada invàlida: s'ignora
  assert.equal(bad.found.size, 0);
});
