// Classifica la dificultat d'un repte segons el tipus de número objectiu.
// Fàcil: positiu petit (0..999). Mitjà: positiu gran (>=1000) o negatiu petit (-999..-1).
// Difícil: negatiu gran (<= -1000).
export function difficulty(target) {
  if (target <= -1000) return "Difícil";
  if (target < 0 || target >= 1000) return "Mitjà";
  return "Fàcil";
}
