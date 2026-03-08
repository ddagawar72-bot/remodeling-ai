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
        // jeon.shop으로 유저 정보 전송 후 팝업 닫기
        try {
          window.opener.postMessage(payload, "*");
        } catch(e) {}
        setTimeout(() => window.close(), 300);
      } else {
        // 팝업이 아닌 경우 jeon.shop 홈으로 이동
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
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: "2px solid rgba(158,122,82,.2)",
        borderTop: "2px solid #9e7a52",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        marginBottom: 14,
      }} />
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#9e7a52", textTransform: "uppercase" }}>
        로그인 중...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
