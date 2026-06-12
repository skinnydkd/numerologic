// Classifica la dificultat d'un repte segons el TIPUS de solucions, no el valor objectiu.
// L'eix depèn de la variant de regles (`rules`, opcional; absent => regles completes):
//   - Regles completes: quina proporció de solucions necessita operacions avançades (^ o √).
//     Com més solucions requereixen ^ o √, més difícil. Llindars 0,81 / 0,90 (terciles del pool).
//   - Variant bàsica (només +−×÷): quina proporció de solucions depèn de la divisió exacta,
//     l'operació rara i difícil de detectar (la profunditat d'operands no discrimina: gairebé
//     totes les solucions són de 4 operands). Llindars als terciles d'un pool real (0,15 / 0,24).
export function difficulty(hints, rules) {
  const total = Object.values(hints.byLeaves).reduce((a, b) => a + b, 0) || 1;
  const ops = rules && rules.ops;
  const hasAdvanced = !ops || ops.includes("pow") || ops.includes("sqrt");
  if (hasAdvanced) {
    const advanced = (hints.byOp.pow / total + hints.byOp.sqrt / total) / 2;
    if (advanced >= 0.90) return "Difícil";
    if (advanced >= 0.81) return "Mitjà";
    return "Fàcil";
  }
  const divReliance = hints.byOp.div / total;
  if (divReliance >= 0.24) return "Difícil";
  if (divReliance >= 0.15) return "Mitjà";
  return "Fàcil";
}
