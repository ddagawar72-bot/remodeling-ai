"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      const user = session.user as { id?: string; email?: string; name?: string; points?: number };

      // jeon.shop으로 유저 정보 전달
      const payload = {
        type: "GOOGLE_LOGIN_SUCCESS",
        user: {
          email: user.email ?? "",
          name: user.name ?? "구글 회원",
          points: user.points ?? 100,
        },
      };

      // opener(jeon.shop)에 메시지 전송
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, "https://jeon.shop");
        setTimeout(() => window.close(), 500);
      } else {
        // 팝업이 아닌 경우 jeon.shop으로 리다이렉트
        window.location.href = "https://jeon.shop";
      }
    } else if (status === "unauthenticated") {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "GOOGLE_LOGIN_FAILED" }, "https://jeon.shop");
        setTimeout(() => window.close(), 300);
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
      background: "var(--bg)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "2px solid rgba(158,122,82,.3)",
        borderTop: "2px solid #9e7a52",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        marginBottom: 16,
      }} />
      <div style={{ fontSize: 12, letterSpacing: 2, color: "#9e7a52" }}>
        로그인 처리 중...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
