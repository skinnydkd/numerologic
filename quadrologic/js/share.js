// Text de compartir (estil Wordle). Mai inclou cap xifra de la graella.
import { formatTime } from "./game.js";

const SITE_URL = "https://numerologic.cat/quadrologic/";

export function buildShareText({ number, size, seconds, solved, rankName, perfect, streak }) {
  const lines = [`Quadrològic #${number} · ${size}×${size}`];
  lines.push(solved ? `⏱ ${formatTime(seconds)} · ${rankName}` : "⏱ En joc");
  if (perfect) lines.push("★ Perfecte");
  if (streak > 0) lines.push(`🔥 Ratxa ${streak}`);
  lines.push(SITE_URL);
  return lines.join("\n");
}
