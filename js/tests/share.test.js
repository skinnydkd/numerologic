import { test } from "node:test";
import assert from "node:assert/strict";
import { emojiBar, buildShareText } from "../share.js";

test("emojiBar buit", () => {
  assert.equal(emojiBar(0, 118), "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜");
});

test("emojiBar ple", () => {
  assert.equal(emojiBar(118, 118), "🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦");
});

test("emojiBar parcial", () => {
  assert.equal(emojiBar(87, 118), "🟦🟦🟦🟦🟦🟦🟦🟨⬜⬜");
});

test("buildShareText sense tutti", () => {
  assert.equal(
    buildShareText({ number: 12, rankName: "Expert", found: 87, total: 118, tuttiFound: false }),
    "Numerològic #12 · Expert\n87/118 · 🟦🟦🟦🟦🟦🟦🟦🟨⬜⬜\nhttps://numerologic.cat"
  );
});

test("buildShareText amb tutti", () => {
  assert.equal(
    buildShareText({ number: 12, rankName: "Geni", found: 118, total: 118, tuttiFound: true }),
    "Numerològic #12 · Geni\n118/118 · 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦\n★ Tutti!\nhttps://numerologic.cat"
  );
});
