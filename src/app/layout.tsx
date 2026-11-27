import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Jadwal Tim Kerja Montib PKP", template: "%s · Jadwal Tim Kerja Montib PKP" },
  description: "Manajemen jadwal kegiatan dan task tim kerja per minggu",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Terapkan status sidebar (disembunyikan/tidak) sebelum render pertama agar tata letak tidak berkedip.
const SIDEBAR_SCRIPT = `try{if(localStorage.getItem("sidebar")==="hidden")document.documentElement.dataset.sidebar="hidden"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
