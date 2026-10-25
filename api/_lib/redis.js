// Client d'Upstash Redis a partir de l'entorn (Marketplace de Vercel: KV_REST_API_*).
import { Redis } from "@upstash/redis";

let client;

export function getRedis() {
  // Sense deserialització automàtica: els pid hexadecimals ("1234...") no s'han de convertir en nombres.
  client ??= new Redis({
    url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN,
    automaticDeserialization: false,
  });
  return client;
}
