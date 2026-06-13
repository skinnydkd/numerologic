import { test } from "node:test";
import assert from "node:assert/strict";
import { buildShareText } from "../share.js";

test("buildShareText sense tutti", () => {
  assert.equal(
    buildShareText({ number: 12, rankName: "Expert", score: 87, found: 20, tuttiFound: false }),
    "Numerològic #12 · Expert\n87 punts · 20 solucions\nhttps://numerologic.cat"
  );
});

test("buildShareText amb tutti", () => {
  assert.equal(
    buildShareText({ number: 12, rankName: "Geni", score: 441, found: 100, tuttiFound: true }),
    "Numerològic #12 · Geni\n441 punts · 100 solucions\n★ Tutti!\nhttps://numerologic.cat"
  );
});
