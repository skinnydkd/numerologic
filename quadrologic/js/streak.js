// Ratxa: dies consecutius completant el Brevi diari. Lògica pura (dates "YYYY-MM-DD").

function _prevDay(s) {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

// Data local "YYYY-MM-DD" a partir d'un timestamp (injectable per als tests).
export function todayStr(ts) {
  const dt = new Date(ts);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// Nova ratxa en completar el Brevi a `today`, donada la ratxa desada `prev` ({date, count} o null).
export function computeStreak(prev, today) {
  if (!prev) return { date: today, count: 1 };
  if (prev.date === today) return prev;                       // ja comptat avui
  if (prev.date === _prevDay(today)) return { date: today, count: prev.count + 1 };
  return { date: today, count: 1 };                            // dia saltat: reinicia
}

// Ratxa a mostrar: viva si l'última compleció és avui o ahir; si no, 0 (trencada).
export function streakDisplay(prev, today) {
  if (!prev) return 0;
  if (prev.date === today || prev.date === _prevDay(today)) return prev.count;
  return 0;
}
