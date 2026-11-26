import { getCurrentUser } from "@/lib/auth";
import { REPLACEMENT, STATUS } from "@/lib/labels";
import { loadSchedule, parseScheduleParams, type TaskView } from "@/lib/schedule";
import { shortDate, todayStr, weekInfo, monthLabel } from "@/lib/weeks";
import { buildXlsx, type Sheet } from "@/lib/xlsx";

const weekShort = (s: string) => {
  const w = weekInfo(s);
  return `M${w.index} ${monthLabel(w.month, true)}`;
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const data = await loadSchedule(parseScheduleParams(sp, todayStr().slice(0, 7)));
  const weeks = data.months.flatMap((m) => m.weeks);
  const officerName = new Map(data.officers.map((o) => [o.id, o.name]));

  const cellText = (t: TaskView) => {
    const lines = [`${STATUS[t.status].symbol} ${t.title} [${STATUS[t.status].label}]`];
    if (t.status === "diganti" && t.replacementType) {
      const detail =
        t.replacementType === "jadwal_ulang" && t.replacementWeek
          ? `ke ${weekShort(t.replacementWeek)}`
          : (t.replacementActivity ?? "");
      lines.push(`  ${REPLACEMENT[t.replacementType]}: ${detail}${t.replacementNote ? ` (${t.replacementNote})` : ""}`);
    }
    if (t.fromWeek) lines.push(`  Jadwal ulang dari ${weekShort(t.fromWeek)}`);
    const names = t.officerIds.map((id) => officerName.get(id)).filter(Boolean);
    if (names.length) lines.push(`  Petugas: ${names.join(", ")}`);
    return lines.join("\n");
  };

  const byCell = new Map<string, TaskView[]>();
  for (const t of data.tasks) {
    const k = `${t.activityId}|${t.weekStart}`;
    byCell.set(k, [...(byCell.get(k) ?? []), t]);
  }

  // Dua baris header: bulan (merge) & minggu
  const head1: string[] = ["Tim Kerja", "Kegiatan"];
  const head2: string[] = ["", ""];
  const merges: NonNullable<Sheet["merges"]> = [
    { r1: 0, c1: 0, r2: 1, c2: 0 },
    { r1: 0, c1: 1, r2: 1, c2: 1 },
  ];
  let col = 2;
  for (const m of data.months) {
    head1.push(m.label, ...Array(m.weeks.length - 1).fill(""));
    if (m.weeks.length > 1) merges.push({ r1: 0, c1: col, r2: 0, c2: col + m.weeks.length - 1 });
    for (const w of m.weeks) head2.push(`M${w.index} (${shortDate(w.start)}–${shortDate(w.end)})`);
    col += m.weeks.length;
  }

  const rows: string[][] = [head1, head2];
  for (const team of data.teams) {
    const acts = team.activities.length ? team.activities : [null];
    const startRow = rows.length;
    for (const act of acts) {
      rows.push([
        team.name,
        act?.name ?? "",
        ...weeks.map((w) => (act ? (byCell.get(`${act.id}|${w.start}`) ?? []).map(cellText).join("\n\n") : "")),
      ]);
    }
    if (acts.length > 1) merges.push({ r1: startRow, c1: 0, r2: rows.length - 1, c2: 0 });
  }

  const buf = buildXlsx({
    name: "Jadwal",
    rows,
    merges,
    headerRows: 2,
    freeze: { rows: 2, cols: 2 },
    colWidths: [22, 28, ...weeks.map(() => 28)],
  });

  const filename = `jadwal_${data.params.from}_${data.params.to}.xlsx`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
