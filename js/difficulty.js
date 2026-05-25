// Classifica la dificultat d'un repte segons el TIPUS de solucions, no el valor objectiu.
// Senyal: quina proporció de solucions necessita operacions avançades (potència o arrel).
// Com més solucions requereixen ^ o √ (menys es poden fer amb +−×÷), més difícil.
// Llindars (0,81 / 0,90) triats a partir dels terciles del pool real.
export function difficulty(hints) {
  const total = Object.values(hints.byLeaves).reduce((a, b) => a + b, 0) || 1;
  const advanced = (hints.byOp.pow / total + hints.byOp.sqrt / total) / 2;
  if (advanced >= 0.90) return "Difícil";
  if (advanced >= 0.81) return "Mitjà";
  return "Fàcil";
}
