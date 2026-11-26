/**
 * Logika minggu kalender.
 *
 * Aturan: minggu = Senin s.d. Minggu, dan sebuah minggu "milik" bulan tempat
 * hari Kamis-nya jatuh (sama seperti aturan ISO-8601 untuk tahun). Hasilnya
 * setiap bulan punya 4 atau 5 minggu, tanpa minggu ganda/terlewat.
 *
 * Semua tanggal berupa string "YYYY-MM-DD" dan dihitung di UTC agar tidak
 * terpengaruh zona waktu server/browser.
 */

export type MonthKey = string; // "YYYY-MM"
export type DateStr = string; // "YYYY-MM-DD"

export type Week = {
  start: DateStr; // Senin
  end: DateStr; // Minggu
  index: number; // 1..5 dalam bulan
  month: MonthKey;
};

export type MonthWeeks = { month: MonthKey; label: string; weeks: Week[] };

const DAY = 86_400_000;
export const MAX_MONTHS = 24;

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function toDate(s: DateStr): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): DateStr {
  return d.toISOString().slice(0, 10);
}

export function addDays(s: DateStr, n: number): DateStr {
  return fmt(new Date(toDate(s).getTime() + n * DAY));
}

export function isValidDate(s: string): s is DateStr {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && fmt(toDate(s)) === s;
}

export function isValidMonth(s: string): s is MonthKey {
  if (!/^\d{4}-\d{2}$/.test(s)) return false;
  const m = Number(s.slice(5));
  return m >= 1 && m <= 12;
}

export function isMonday(s: string): boolean {
  return isValidDate(s) && toDate(s).getUTCDay() === 1;
}

/** Senin dari minggu yang memuat tanggal s. */
export function mondayOf(s: DateStr): DateStr {
  const dow = (toDate(s).getUTCDay() + 6) % 7; // Senin=0
  return addDays(s, -dow);
}

/** Bulan pemilik minggu yang dimulai pada Senin `start`. */
export function monthOfWeek(start: DateStr): MonthKey {
  return addDays(start, 3).slice(0, 7);
}

export function weeksOfMonth(month: MonthKey): Week[] {
  const first = `${month}-01`;
  // Kamis pertama di bulan ini
  const dow = (toDate(first).getUTCDay() + 6) % 7; // Senin=0, Kamis=3
  const firstThursday = addDays(first, (3 - dow + 7) % 7);
  const weeks: Week[] = [];
  let start = addDays(firstThursday, -3);
  while (monthOfWeek(start) === month) {
    weeks.push({ start, end: addDays(start, 6), index: weeks.length + 1, month });
    start = addDays(start, 7);
  }
  return weeks;
}

/** Info minggu (bulan & nomor) untuk Senin `start`. */
export function weekInfo(start: DateStr): Week {
  const month = monthOfWeek(start);
  const w = weeksOfMonth(month).find((x) => x.start === start);
  if (!w) throw new Error(`Bukan awal minggu: ${start}`);
  return w;
}

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function monthDiff(from: MonthKey, to: MonthKey): number {
  const [y1, m1] = from.split("-").map(Number);
  const [y2, m2] = to.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

export function monthLabel(month: MonthKey, short = false): string {
  const [y, m] = month.split("-").map(Number);
  return `${(short ? BULAN_SINGKAT : BULAN)[m - 1]} ${y}`;
}

export function shortDate(s: DateStr): string {
  const d = toDate(s);
  return `${d.getUTCDate()} ${BULAN_SINGKAT[d.getUTCMonth()]}`;
}

export function weekLabel(start: DateStr): string {
  const w = weekInfo(start);
  return `M${w.index} ${monthLabel(w.month, true)} (${shortDate(w.start)}–${shortDate(w.end)})`;
}

/** Daftar bulan [from..to] beserta minggunya. Rentang dibatasi MAX_MONTHS. */
export function monthRange(from: MonthKey, to: MonthKey): MonthWeeks[] {
  const n = Math.min(Math.max(monthDiff(from, to), 0), MAX_MONTHS - 1);
  return Array.from({ length: n + 1 }, (_, i) => {
    const month = addMonths(from, i);
    return { month, label: monthLabel(month), weeks: weeksOfMonth(month) };
  });
}

export function todayStr(now = new Date()): DateStr {
  // Tanggal lokal Asia/Jakarta, agar "minggu ini" sesuai pengguna di Indonesia.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}
