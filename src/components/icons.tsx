import type { SVGProps } from "react";

/** Ikon garis sederhana (gaya outline 24px), tanpa dependency. */
const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  calendar: "M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h2m4 0h2m-8 4h2m4 0h2",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  badge: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm5 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm-2 7c.6-1.8 2.2-3 4-3s3.4 1.2 4 3m1-9h0",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1m18 0v-1a4 4 0 0 0-3-3.9M15 3.1a4 4 0 0 1 0 7.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  logout: "M15 17l5-5-5-5m5 5H9m4 9H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  check: "m5 12 5 5L20 7",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  swap: "M7 7h11l-3-3m3 13H7l3 3",
  x: "M18 6 6 18M6 6l12 12",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  panel: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm5 0v14",
  chevronsLeft: "m11 17-5-5 5-5m7 10-5-5 5-5",
  antenna: "M12 13v8m-3.5 0h7M9 7.5a4 4 0 0 0 0 5M15 7.5a4 4 0 0 1 0 5M6.2 4.8a8 8 0 0 0 0 10.4M17.8 4.8a8 8 0 0 1 0 10.4M12 10h.01",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-5 w-5", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
