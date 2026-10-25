// POST /api/jugador: crea jugador, sorteja àlies o surt del rànquing.
import { getRedis } from "./_lib/redis.js";
import { gestiona, jugador } from "./_lib/ranquing.js";

export async function POST(request) {
  return gestiona(request, (ctx) => jugador(getRedis(), ctx));
}
