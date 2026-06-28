import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical } from "../canonical.js";
import { parse } from "../parser.js";

const c = (s) => canonical(parse(s));

// Bug (report del Pau): 7×2×5−6−4 es considerava DIFERENT de −6−4+7×5×2, tot i ser
// la mateixa solució (suma de termes amb signe reordenats). La canònica ha d'aplanar
// la capa additiva (+ i −, plegant el signe) en un multiconjunt ordenat de termes.
test("dedup additiu: reordenar sumands amb signe és la mateixa solució", () => {
  assert.equal(c("7*2*5-6-4"), c("-6-4+7*5*2"));   // el report exacte
  assert.equal(c("7*2*5-6-4"), c("7*2*5-4-6"));     // reordenar les restes
  assert.equal(c("9-3"), c("-3+9"));                 // a − b ≡ −b + a
  assert.equal(c("7*2*5-6-4"), c("7*2*5-(6+4)"));    // el signe distribueix sobre la suma
  assert.equal(c("1+2+3"), c("3+2+1"));              // commutativitat de la suma (ja funcionava)
});

test("dedup additiu: NO fusiona expressions de valor diferent", () => {
  assert.notEqual(c("9-3"), c("3-9"));               // 6 ≠ −6
  assert.notEqual(c("7-2"), c("7+2"));               // 5 ≠ 9
});
