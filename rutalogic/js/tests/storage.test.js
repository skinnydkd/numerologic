import { test } from "node:test";
import assert from "node:assert/strict";
import { loadProgress, saveProgress, loadStreak, saveStreak } from "../storage.js";

function fakeStore() {
  const m = new Map();
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

test("prefix propi: no es barreja amb Numerològic", () => {
  const store = fakeStore();
  store.setItem("numerologic:p:3", JSON.stringify({ found: [] }));
  assert.equal(loadProgress(store, 3), null);
  saveProgress(store, 3, { guesses: ["2+3*4=14"] });
  saveStreak(store, { date: "2026-10-27", count: 2 });
  assert.deepEqual([...store.m.keys()].sort(), ["numerologic:p:3", "rutalogic:p:3", "rutalogic:streak"]);
  assert.deepEqual(loadProgress(store, 3), { guesses: ["2+3*4=14"] });
  assert.deepEqual(loadStreak(store), { date: "2026-10-27", count: 2 });
});
