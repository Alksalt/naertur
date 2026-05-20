// Helpers shared across trail screens.

export function todayStamp(lang: 'no' | 'en'): string {
  const d = new Date();
  const months =
    lang === 'no'
      ? ['JAN', 'FEB', 'MAR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DES']
      : ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const m = months[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${String(d.getDate()).padStart(2, '0')} ${m} · ${hh}:${mm}`;
}

export function fmtMinShort(m: number, lang: 'no' | 'en'): string {
  if (m < 60) return String(m);
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hUnit = lang === 'no' ? 't' : 'h';
  return r === 0 ? `${h}${hUnit}` : `${h}${hUnit}${r}`;
}
