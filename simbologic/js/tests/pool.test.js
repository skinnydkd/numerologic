import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pool = JSON.parse(readFileSync(join(here, "..", "..", "data", "puzzles.json"), "utf-8"));

const line = (syms, vals, op) => syms.map((s) => vals[s]).reduce((a, b) => (op === "*" ? a * b : a + b));

test("pool publicat: 364 dies × 3 graelles amb totals coherents", () => {
  assert.equal(pool.puzzles.length, 364);
  assert.equal(pool.startDate, "2026-10-26");
  for (const { grids } of pool.puzzles) {
    assert.deepEqual(grids.map((g) => g.level), ["facil", "mitja", "dificil"]);
    for (const g of grids) {
      assert.equal(g.cells.length, g.size);
      g.cells.forEach((r, i) => assert.equal(line(r, g.values, g.rowOps[i]), g.rowTotals[i]));
      for (let j = 0; j < g.size; j++) assert.equal(line(g.cells.map((r) => r[j]), g.values, "+"), g.colTotals[j]);
      assert.deepEqual([...g.order].sort(), g.values.map((_, s) => s));
    }
  }
});
