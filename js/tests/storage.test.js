import { test } from "node:test";
import assert from "node:assert/strict";
import { loadProgress, saveProgress } from "../storage.js";

function fakeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

test("desa i carrega (round-trip)", () => {
  const store = fakeStore();
  const progress = { found: [{ canonical: "(* 1 4 7)", text: "1*4*7" }], tuttiFound: true };
  saveProgress(store, 12, progress);
  assert.deepEqual(loadProgress(store, 12), progress);
});

test("carregar un repte sense progrés -> null", () => {
  const store = fakeStore();
  assert.equal(loadProgress(store, 5), null);
});

test("índexs diferents no es barregen", () => {
  const store = fakeStore();
  saveProgress(store, 1, { found: [], tuttiFound: false });
  saveProgress(store, 2, { found: [{ canonical: "x", text: "y" }], tuttiFound: false });
  assert.equal(loadProgress(store, 1).found.length, 0);
  assert.equal(loadProgress(store, 2).found.length, 1);
});

test("valor corrupte -> null (no llança)", () => {
  const store = fakeStore();
  store.setItem("numerologic:p:9", "{no json");
  assert.equal(loadProgress(store, 9), null);
});
