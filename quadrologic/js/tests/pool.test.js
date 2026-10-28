import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pool = JSON.parse(readFileSync(join(here, "..", "..", "data", "puzzles.json"), "utf-8"));
const SIZE_BY_WEEKDAY = [6, 4, 4, 4, 5, 5, 6]; // getUTCDay: 0 = diumenge

function cageValue(op, vals) {
  if (op === "=") return vals[0];
  if (op === "+") return vals.reduce((a, b) => a + b);
  if (op === "*") return vals.reduce((a, b) => a * b);
  const a = Math.max(...vals), b = Math.min(...vals);
  return op === "-" ? a - b : a % b === 0 ? a / b : null;
}

test("pool publicat: 364 dies, mida per dia, quadrat llatí i gàbies coherents", () => {
  assert.equal(pool.puzzles.length, 364);
  assert.equal(pool.startDate, "2026-10-26");
  pool.puzzles.forEach((p, i) => {
    const n = p.size;
    assert.equal(n, SIZE_BY_WEEKDAY[new Date(Date.UTC(2026, 9, 26 + i)).getUTCDay()], `índex ${i}`);
    const want = Array.from({ length: n }, (_, k) => k + 1).join();
    for (let k = 0; k < n; k++) {
      assert.equal([...p.solution[k]].sort().join(), want);
      assert.equal(p.solution.map((r) => r[k]).sort().join(), want);
    }
    const seen = new Set();
    for (const c of p.cages) {
      assert.equal(cageValue(c.op, c.cells.map(([r, k]) => p.solution[r][k])), c.target);
      c.cells.forEach(([r, k]) => seen.add(r * n + k));
    }
    assert.equal(seen.size, n * n);
    assert.equal(p.order.length, n * n);
    assert.ok(p.refSeconds > 0);
  });
});
