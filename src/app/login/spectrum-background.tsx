/**
 * Latar halaman login bertema monitoring spektrum frekuensi: tampilan layar
 * spectrum analyzer (graticule, trace live & max-hold, marker sinyal, garis ambang).
 * Dibuat statis dengan PRNG ber-seed agar hasilnya identik di setiap render.
 */

const W = 1600;
const H = 900;
const TOP = 140; // batas atas area plot
const BOTTOM = 760; // batas bawah area plot
const F_START = 30; // MHz
const F_END = 3000; // MHz
// Margin samping: layar lebar/sempit memotong tepi (preserveAspectRatio slice)
const X0 = 140;
const X1 = W - 140;

const fx = (mhz: number) => X0 + ((mhz - F_START) / (F_END - F_START)) * (X1 - X0);

function prng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

type Sig = { f: number; bw: number; level: number; flat?: boolean };
// Level: 0 = noise floor, 1 = puncak tertinggi
const SIGNALS: Sig[] = [
  { f: 88, bw: 6, level: 0.42 },
  { f: 98.5, bw: 5, level: 0.78 },
  { f: 104, bw: 5, level: 0.55 },
  { f: 155, bw: 4, level: 0.3 },
  { f: 474, bw: 14, level: 0.5, flat: true },
  { f: 578, bw: 14, level: 0.62, flat: true },
  { f: 690, bw: 14, level: 0.45, flat: true },
  { f: 925, bw: 18, level: 0.58, flat: true },
  { f: 950, bw: 10, level: 0.48, flat: true },
  { f: 1842, bw: 40, level: 0.7, flat: true },
  { f: 2140, bw: 30, level: 0.6, flat: true },
  { f: 2350, bw: 22, level: 0.4, flat: true },
  { f: 2437, bw: 20, level: 0.52, flat: true },
  { f: 2462, bw: 20, level: 0.36, flat: true },
];

const MARKERS = [
  { f: 98.5, label: "M1 · FM 98,5 MHz" },
  { f: 578, label: "M2 · TV UHF 578 MHz" },
  { f: 1842, label: "M3 · LTE 1842 MHz" },
  { f: 2437, label: "M4 · Wi-Fi 2437 MHz" },
];

function levelAt(mhz: number) {
  let v = 0;
  for (const s of SIGNALS) {
    const d = (mhz - s.f) / s.bw;
    v = Math.max(v, s.level * Math.exp(-(s.flat ? d ** 8 : d * d)));
  }
  return v;
}

const yOf = (level: number) => BOTTOM - 60 - level * (BOTTOM - TOP - 120);

function buildTraces() {
  const rnd = prng(20261127);
  const N = 640;
  const live: string[] = [];
  const hold: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = X0 + (i / N) * (X1 - X0);
    const mhz = F_START + (i / N) * (F_END - F_START);
    const base = levelAt(mhz);
    const noise = (rnd() - 0.5) * 0.06 + (rnd() - 0.5) * 0.03;
    const yl = yOf(Math.max(-0.05, base + noise));
    const yh = yOf(Math.max(0.02, base * 1.08 + 0.045 + rnd() * 0.02));
    live.push(`${i ? "L" : "M"}${x.toFixed(1)},${yl.toFixed(1)}`);
    hold.push(`${i ? "L" : "M"}${x.toFixed(1)},${yh.toFixed(1)}`);
  }
  const area = `${live.join(" ")} L${X1},${BOTTOM} L${X0},${BOTTOM} Z`;
  return { live: live.join(" "), hold: hold.join(" "), area };
}

const TRACES = buildTraces();
const TICKS = [30, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000];

export function SpectrumBackground() {
  const threshold = yOf(0.5);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      {/* Graticule 10 × 8 seperti layar analyzer */}
      <g stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={X0 + (i * (X1 - X0)) / 10} x2={X0 + (i * (X1 - X0)) / 10} y1={TOP} y2={BOTTOM} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1={X0} x2={X1} y1={TOP + (i * (BOTTOM - TOP)) / 8} y2={TOP + (i * (BOTTOM - TOP)) / 8} />
        ))}
      </g>

      {/* Garis ambang */}
      <line x1={X0} x2={X1} y1={threshold} y2={threshold} stroke="#f87171" strokeOpacity="0.45" strokeDasharray="6 6" />
      <text x={X1 - 8} y={threshold - 8} textAnchor="end" fill="#fca5a5" fillOpacity="0.6" fontSize="13" fontFamily="monospace">
        AMBANG −60 dBm
      </text>

      {/* Trace */}
      <path d={TRACES.area} fill="#38bdf8" fillOpacity="0.08" />
      <path d={TRACES.hold} fill="none" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="1.2" />
      <path d={TRACES.live} fill="none" stroke="#38bdf8" strokeOpacity="0.6" strokeWidth="1.6" strokeLinejoin="round" />

      {/* Marker */}
      {MARKERS.map((m) => {
        const x = fx(m.f);
        const y = yOf(levelAt(m.f)) - 14;
        const left = x > X1 - 220;
        return (
          <g key={m.label} fontFamily="monospace" fontSize="13">
            <path d={`M${x - 6},${y - 10} L${x + 6},${y - 10} L${x},${y} Z`} fill="#67e8f9" fillOpacity="0.8" />
            <text x={left ? x - 10 : x + 10} y={y - 14} textAnchor={left ? "end" : "start"} fill="#a5f3fc" fillOpacity="0.75">
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Sumbu frekuensi */}
      <g fontFamily="monospace" fontSize="12" fill="#bfdbfe" fillOpacity="0.45">
        {TICKS.map((f) => (
          <text key={f} x={fx(f)} y={BOTTOM + 24} textAnchor={f === 30 ? "start" : f === 3000 ? "end" : "middle"}>
            {f >= 1000 ? `${(f / 1000).toLocaleString("id-ID")} GHz` : `${f} MHz`}
          </text>
        ))}
      </g>

      {/* Info layar */}
      <g fontFamily="monospace" fontSize="13" fill="#bfdbfe" fillOpacity="0.4">
        <text x={X0} y={TOP - 16}>SPECTRUM MONITOR · REF −20 dBm · 10 dB/div</text>
        <text x={X1} y={TOP - 16} textAnchor="end">
          RBW 100 kHz · VBW 300 kHz · SWT 50 ms
        </text>
        <text x={X0} y={BOTTOM + 52}>START 30 MHz</text>
        <text x={X1} y={BOTTOM + 52} textAnchor="end">
          STOP 3 GHz
        </text>
      </g>
    </svg>
  );
}
