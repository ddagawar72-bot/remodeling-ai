import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const role = token?.role as string | undefined;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "권한이 없습니다" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (
    pathname.startsWith("/analyze") ||
    pathname.startsWith("/mypage") ||
    pathname.startsWith("/api/feature") ||
    pathname.startsWith("/api/user")
  ) {
    if (!token || !role || role === "GUEST") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "로그인이 필요합니다" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/analyze/:path*",
    "/mypage/:path*",
    "/api/admin/:path*",
    "/api/feature/:path*",
    "/api/user/:path*",
  ],
};
