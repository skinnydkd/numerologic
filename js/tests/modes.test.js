import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyIndex, practiceIndex } from "../modes.js";

const MS = 86400000;
const start = new Date("2026-06-01T00:00:00").getTime();

test("dia 0 -> índex 0", () => {
  assert.equal(dailyIndex("2026-06-01", start + 12 * 3600 * 1000, 60), 0);
});

test("dia 3 -> índex 3", () => {
  assert.equal(dailyIndex("2026-06-01", start + 3 * MS, 60), 3);
});

test("dóna la volta al pool", () => {
  assert.equal(dailyIndex("2026-06-01", start + 60 * MS, 60), 0);
});

test("abans de l'inici no és negatiu", () => {
  const i = dailyIndex("2026-06-01", start - 1 * MS, 60);
  assert.ok(i >= 0 && i < 60);
});

test("practiceIndex evita el diari", () => {
  assert.equal(practiceIndex(() => 0, 60, 0), 1); // saltaria el 0
  assert.equal(practiceIndex(() => 0, 60, 5), 0); // 0 != 5, val
  for (let r = 0; r < 1; r += 0.05) {
    assert.notEqual(practiceIndex(() => r, 60, 7), 7);
  }
});
