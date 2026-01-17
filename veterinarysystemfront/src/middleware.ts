import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  console.log("Middleware ejecutado en:", req.nextUrl.pathname);

  const token = req.cookies.get("token")?.value;

  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("❌ No hay token, redirigiendo a login...");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("✅ Token encontrado, permitiendo acceso");
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], 
};
