"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      const user = session.user as { id?: string; email?: string; name?: string; points?: number };

      const payload = {
        type: "GOOGLE_LOGIN_SUCCESS",
        user: {
          email: user.email ?? "",
          name: user.name ?? "구글 회원",
          points: user.points ?? 100,
        },
      };

      if (window.opener && !window.opener.closed) {
        // jeon.shop에 로그인 정보 전송
        window.opener.postMessage(payload, "*");
        // 잠깐 후 팝업 닫기 (remodeling-ai는 로그인 유지됨)
        setTimeout(() => window.close(), 500);
      } else {
        // 팝업이 아닌 경우 jeon.shop으로 이동
        window.location.href = "https://jeon.shop";
      }
    } else if (status === "unauthenticated") {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "GOOGLE_LOGIN_FAILED" }, "*");
        setTimeout(() => window.close(), 300);
      } else {
        window.location.href = "https://jeon.shop";
      }
    }
  }, [session, status]);

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
        로그인 연동 중...
      </div>
      <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 1 }}>
        jeon.shop + AI MBTI 동시 로그인
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
