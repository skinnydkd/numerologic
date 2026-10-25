// POST /api/sync: recalcula la puntuació d'avui a partir de les expressions.
import { getRedis } from "./_lib/redis.js";
import { gestiona, sync } from "./_lib/ranquing.js";

export async function POST(request) {
  return gestiona(request, (ctx) => sync(getRedis(), ctx));
}
