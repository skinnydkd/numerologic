import { test } from "node:test";
import assert from "node:assert/strict";
import { CELLS, CENTER, NEIGHBORS, applyOp } from "../hive.js";

test("mateixa geometria que Python: 19 cel·les, 888.205 rutes simples des del centre", () => {
  assert.equal(CELLS.length, 19);
  assert.deepEqual(CELLS[CENTER], [0, 0]);
  NEIGHBORS.forEach((nbs, a) => nbs.forEach((b) => assert.ok(NEIGHBORS[b].includes(a))));
  let count = 0;
  const dfs = (cell, mask) => {
    count++;
    for (const nb of NEIGHBORS[cell]) if (!((mask >> nb) & 1)) dfs(nb, mask | (1 << nb));
  };
  dfs(CENTER, 1 << CENTER);
  assert.equal(count, 888205);
});

test("operacions amb paritat amb apply_op de Python", () => {
  assert.equal(applyOp(7, "/2"), null);
  assert.equal(applyOp(-9, "/3"), -3);
  assert.equal(applyOp(400, "*3"), null);
  assert.equal(applyOp(5, "-9"), -4);
});
