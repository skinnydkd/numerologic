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

test("buildShareText amb diversos tuttis -> ×N", () => {
  assert.equal(
    buildShareText({ number: 12, rankName: "Geni", score: 460, found: 102, tuttiFound: true, tuttiCount: 3 }),
    "Numerològic #12 · Geni\n460 punts · 102 solucions\n★ Tutti ×3\nhttps://numerologic.cat"
  );
});

test("buildShareText amb Brevi i ratxa", () => {
  assert.equal(
    buildShareText({ number: 5, rankName: "Expert", score: 30, found: 6,
                     tuttiFound: false, breviComplete: true, streak: 4 }),
    "Numerològic #5 · Expert\n30 punts · 6 solucions\n✦ Brevi!\n🔥 Ratxa 4\nhttps://numerologic.cat"
  );
});

test("buildShareText no revela cap solució", () => {
  const txt = buildShareText({ number: 1, rankName: "Geni", score: 99, found: 50,
                               tuttiFound: true, breviComplete: true, streak: 7 });
  assert.ok(!/[0-9]\s*[+\-*/×÷]/.test(txt)); // cap expressió aritmètica
});
