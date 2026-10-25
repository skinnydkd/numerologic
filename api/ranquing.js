// GET /api/ranquing?periode=dia|mes|sempre&ambit=global|lliga: top 20 i la posició del jugador.
import { getRedis } from "./_lib/redis.js";
import { gestiona, ranquing } from "./_lib/ranquing.js";

export async function GET(request) {
  return gestiona(request, (ctx) => ranquing(getRedis(), ctx));
}
