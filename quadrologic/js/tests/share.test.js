import { test } from "node:test";
import assert from "node:assert/strict";
import { buildShareText } from "../share.js";

test("text de compartir: mida, temps, rang, ★ i ratxa", () => {
  assert.equal(buildShareText({ number: 21, size: 5, seconds: 192, solved: true, rankName: "Mestre", perfect: true, streak: 2 }), [
    "Quadrològic #21 · 5×5", "⏱ 3:12 · Mestre", "★ Perfecte", "🔥 Ratxa 2", "https://numerologic.cat/quadrologic/",
  ].join("\n"));
});

test("sense resoldre no diu temps ni rang", () => {
  const t = buildShareText({ number: 3, size: 4, seconds: 50, solved: false, rankName: null, perfect: false, streak: 0 });
  assert.equal(t, "Quadrològic #3 · 4×4\n⏱ En joc\nhttps://numerologic.cat/quadrologic/");
});
