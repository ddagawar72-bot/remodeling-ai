import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";

// GET /api/auto-login?email=xxx&sig=yyy
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const sig   = req.nextUrl.searchParams.get("sig")   ?? "";

  if (!email || !sig) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 서명 검증 (jeon.shop doGoogleLogin과 동일)
  const secret   = process.env.NEXTAUTH_SECRET ?? "jeon2024remodelingSecretKey123456789";
  const expected = Buffer.from(email + secret).toString("base64").slice(0, 20);

  if (sig !== expected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // DB에서 사용자 조회
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, name: true, role: true, points: true },
  });

  if (!user) {
    // 미가입 → 회원가입 페이지 (이메일 자동 입력)
    const registerUrl = new URL("/login", req.url);
    registerUrl.searchParams.set("tab", "register");
    registerUrl.searchParams.set("email", email);
    return NextResponse.redirect(registerUrl);
  }

  // JWT 토큰 생성
  const token = await encode({
    token: {
      sub:    user.id,
      id:     user.id,
      email:  user.email,
      name:   user.name,
      role:   user.role,
      points: user.points,
    },
    secret,
  });

  // 쿠키 이름 (production vs dev)
  const isProd     = process.env.NODE_ENV === "production";
  const cookieName = isProd
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  // 분석 페이지로 리다이렉트 + 세션 쿠키 설정
  const res = NextResponse.redirect(new URL("/analyze", req.url));
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure:   isProd,
    sameSite: "lax",
    path:     "/",
    maxAge:   60 * 60 * 24 * 7, // 7일
  });

  return res;
}
