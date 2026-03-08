"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

export default function GoogleAuthPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      // 이미 로그인 됨 → auth-callback으로
      window.location.href = "/auth-callback";
      return;
    }

    // 자동으로 구글 로그인 시작
    signIn("google", { callbackUrl: "/auth-callback" });
  }, [status]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8f6f2",
      fontFamily: "'DM Sans', sans-serif",
      gap: 14,
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: "2px solid rgba(158,122,82,.2)",
        borderTop: "2px solid #9e7a52",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#9e7a52", textTransform: "uppercase" }}>
        구글 로그인 연결 중...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
