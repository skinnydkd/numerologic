import { test } from "node:test";
import assert from "node:assert/strict";
import { buildShareText, gridEmoji } from "../share.js";

test("text de compartir amb graelles, punts, ★ i ratxa", () => {
  const squares = [gridEmoji(true, true), gridEmoji(true, true), gridEmoji(true, false)].join("");
  assert.equal(buildShareText({ number: 5, rankName: "Mestre", squares, score: 27, total: 30, clean: false, streak: 3 }), [
    "Simbològic #5 · Mestre", "🟦🟦🟥", "27/30 punts", "🔥 Ratxa 3", "https://numerologic.cat/simbologic/",
  ].join("\n"));
  assert.equal(gridEmoji(false, false), "⬜");
});

test("★ Net i sense ratxa", () => {
  const t = buildShareText({ number: 1, rankName: "Llegenda", squares: "🟦🟦🟦", score: 30, total: 30, clean: true, streak: 0 });
  assert.ok(t.includes("★ Net!") && !t.includes("Ratxa"));
});
