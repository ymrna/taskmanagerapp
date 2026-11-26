import { NextResponse, type NextRequest } from "next/server";

// Pemeriksaan optimistis: tanpa cookie sesi → ke /login.
// Validasi sesi sebenarnya dilakukan di server (lib/auth.ts) pada setiap halaman & aksi.
export function proxy(req: NextRequest) {
  if (!req.cookies.has("sesi")) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
