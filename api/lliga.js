// POST /api/lliga: crea, uneix-se o surt d'una lliga.
import { getRedis } from "./_lib/redis.js";
import { gestiona, lliga } from "./_lib/ranquing.js";

export async function POST(request) {
  return gestiona(request, (ctx) => lliga(getRedis(), ctx));
}
