import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CENTER, run } from "../hive.js";

const here = dirname(fileURLToPath(import.meta.url));
const pool = JSON.parse(readFileSync(join(here, "..", "..", "data", "puzzles.json"), "utf-8"));

test("pool publicat: 364 taulers i les rutes ✦ i ★ arriben a l'objectiu amb el JS", () => {
  assert.equal(pool.puzzles.length, 364);
  assert.equal(pool.startDate, "2026-10-26");
  for (const p of pool.puzzles) {
    assert.equal(p.ops.length, 19);
    assert.equal(p.ops[CENTER], null);
    const lens = Object.keys(p.byLength).map(Number);
    const min = Math.min(...lens), max = Math.max(...lens);
    assert.ok(min >= 4 && min <= 6);
    assert.equal(p.brevi.length, p.byLength[min]);
    assert.equal(p.marato.length, p.byLength[max]);
    for (const r of p.brevi) assert.ok(r.length === min && run(p.start, p.ops, r) === p.target);
    for (const r of p.marato) assert.ok(r.length === max && run(p.start, p.ops, r) === p.target);
    const routes = Object.values(p.byLength).reduce((a, b) => a + b, 0);
    assert.ok(routes >= 20 && routes <= 200);
  }
});
