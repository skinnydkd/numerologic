import { test } from "node:test";
import assert from "node:assert/strict";
import { buildShareText } from "../share.js";

test("text de compartir: rang, punts, ✦, ★ i ratxa", () => {
  assert.equal(buildShareText({ number: 8, rankName: "Expert", score: 120, found: 14, breviComplete: true, maratoFound: true, streak: 3 }), [
    "Rutalògic #8 · Expert", "120 punts · 14 rutes", "✦ Brevi!", "★ Marató!", "🔥 Ratxa 3", "https://numerologic.cat/rutalogic/",
  ].join("\n"));
  const t = buildShareText({ number: 1, rankName: "Principiant", score: 0, found: 1, breviComplete: false, maratoFound: false, streak: 0 });
  assert.equal(t, "Rutalògic #1 · Principiant\n0 punts · 1 ruta\nhttps://numerologic.cat/rutalogic/");
});
