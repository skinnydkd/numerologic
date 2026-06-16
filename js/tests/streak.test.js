import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStreak, streakDisplay, todayStr } from "../streak.js";

test("primer dia: ratxa = 1", () => {
  assert.deepEqual(computeStreak(null, "2026-06-16"), { date: "2026-06-16", count: 1 });
});

test("dia consecutiu: incrementa", () => {
  assert.deepEqual(computeStreak({ date: "2026-06-15", count: 3 }, "2026-06-16"),
                   { date: "2026-06-16", count: 4 });
});

test("mateix dia: no canvia", () => {
  assert.deepEqual(computeStreak({ date: "2026-06-16", count: 4 }, "2026-06-16"),
                   { date: "2026-06-16", count: 4 });
});

test("dia saltat: reinicia a 1", () => {
  assert.deepEqual(computeStreak({ date: "2026-06-13", count: 9 }, "2026-06-16"),
                   { date: "2026-06-16", count: 1 });
});

test("canvi de mes: dia consecutiu correcte", () => {
  assert.deepEqual(computeStreak({ date: "2026-05-31", count: 2 }, "2026-06-01"),
                   { date: "2026-06-01", count: 3 });
});

test("streakDisplay: viva si avui o ahir, si no 0", () => {
  assert.equal(streakDisplay({ date: "2026-06-16", count: 4 }, "2026-06-16"), 4);
  assert.equal(streakDisplay({ date: "2026-06-15", count: 4 }, "2026-06-16"), 4); // viva
  assert.equal(streakDisplay({ date: "2026-06-14", count: 4 }, "2026-06-16"), 0); // trencada
  assert.equal(streakDisplay(null, "2026-06-16"), 0);
});

test("todayStr formata YYYY-MM-DD", () => {
  const ts = new Date(2026, 5, 16, 10, 30).getTime(); // mes 5 = juny (0-indexat)
  assert.equal(todayStr(ts), "2026-06-16");
});
