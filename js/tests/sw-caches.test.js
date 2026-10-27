import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));

// Executa l'activate del sw.js arrel amb caches falses i retorna les que queden.
async function cachesAfterActivate(existing) {
  const left = new Set(existing);
  const handlers = {};
  const self = { addEventListener: (t, h) => { handlers[t] = h; }, clients: { claim: async () => {} } };
  const caches = { keys: async () => [...left], delete: async (k) => left.delete(k) };
  vm.runInNewContext(readFileSync(join(here, "..", "..", "sw.js"), "utf-8"), { self, caches, URL, fetch });
  let done;
  handlers.activate({ waitUntil: (p) => { done = p; } });
  await done;
  return [...left].sort();
}

test("el SW de Numerològic no esborra les caches dels jocs germans", async () => {
  const left = await cachesAfterActivate(["numerologic-v1", "igualogic-v1", "simbologic-v3"]);
  assert.ok(left.includes("igualogic-v1"));
  assert.ok(left.includes("simbologic-v3"));
  assert.ok(!left.includes("numerologic-v1"), "les caches velles pròpies sí que s'esborren");
});
