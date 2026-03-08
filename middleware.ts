import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // token이 없으면 로그인 페이지로
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "로그인이 필요합니다" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = (token.role as string | undefined) || "MEMBER";

    // Admin routes — ADMIN only
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ ok: false, error: "권한이 없습니다" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // 모든 요청 통과 → 위 함수에서 처리
    },
  }
);

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
