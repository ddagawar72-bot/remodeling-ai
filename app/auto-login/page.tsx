"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AutoLoginInner() {
  const { status } = useSession();
  const params = useSearchParams();

  useEffect(() => {
    if (status === "loading") return;

    const email = params.get("email") ?? "";
    const sig = params.get("sig") ?? "";

    if (!email || !sig) {
      window.location.href = "/login";
      return;
    }

    // 서명 검증 (jeon.shop과 동일한 로직)
    const secret = process.env.NEXT_PUBLIC_AUTO_LOGIN_SECRET ?? "jeon2024remodelingSecretKey123456789";
    const expected = btoa(email + secret).slice(0, 20);

    if (sig !== expected) {
      window.location.href = "/login";
      return;
    }

    if (status === "authenticated") {
      // 이미 로그인됨
      window.location.href = "/analyze";
      return;
    }

    // DB에서 사용자 확인 후 자동 로그인 또는 회원가입으로
    fetch("/api/auth/check-user?email=" + encodeURIComponent(email))
      .then(r => r.json())
      .then(data => {
        if (data.exists) {
          // 기존 회원 → credentials로 자동 로그인
          signIn("credentials", {
            email: email,
            autoLogin: "true",
            sig: sig,
            callbackUrl: "/analyze",
            redirect: true,
          });
        } else {
          // 미가입 → 회원가입 페이지로
          window.location.href = "/login?tab=register&email=" + encodeURIComponent(email);
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, [status, params]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8f6f2",
      fontFamily: "'DM Sans', sans-serif",
      gap: 16,
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "2px solid rgba(158,122,82,.2)",
        borderTop: "2px solid #9e7a52",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#9e7a52", textTransform: "uppercase" }}>
        자동 로그인 중...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AutoLoginPage() {
  return (
    <Suspense>
      <AutoLoginInner />
    </Suspense>
  );
}
