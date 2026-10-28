// Text de compartir (estil Wordle). Mai inclou la solució: només colors.

const SITE_URL = "https://numerologic.cat/igualogic/";
const EMOJI = { g: "🟦", y: "🟨", x: "⬜" };

export function buildShareText({ number, rows, won, maxGuesses, rankName, hard, streak }) {
  const score = won ? rows.length : "X";
  const lines = [`Igualògic #${number} · ${score}/${maxGuesses} · ${rankName}${hard && won ? " ★" : ""}`];
  for (const { colors } of rows) lines.push([...colors].map((c) => EMOJI[c]).join(""));
  if (streak > 0) lines.push(`🔥 Ratxa ${streak}`);
  lines.push(SITE_URL);
  return lines.join("\n");
}
