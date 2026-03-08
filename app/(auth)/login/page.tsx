"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) { setError("이메일 또는 비밀번호가 올바르지 않습니다"); setLoading(false); return; }
    router.push("/analyze");
  };

  const handleRegister = async () => {
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error); setLoading(false); return; }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/analyze");
  };

  const handleKakao = async () => {
    setKakaoLoading(true);
    await signIn("kakao", { callbackUrl: "/analyze" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-[9px] tracking-[5px] uppercase mb-2" style={{ color: "var(--ac)" }}>
            AI MBTI
          </div>
          <div className="text-3xl tracking-[8px] uppercase font-light" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
            우리집 MBTI
          </div>
        </div>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakao}
          disabled={kakaoLoading}
          className="w-full py-3.5 rounded flex items-center justify-center gap-3 text-sm font-medium mb-4 transition-all disabled:opacity-50"
          style={{ background: "#FEE500", color: "#191919", fontFamily: "'DM Sans',sans-serif" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.58 1 1 3.91 1 7.5c0 2.28 1.39 4.28 3.5 5.5L3.76 16l3.74-2.5C7.82 13.66 8.4 13.75 9 13.75c4.42 0 8-2.91 8-6.25S13.42 1 9 1z" fill="#191919"/>
          </svg>
          {kakaoLoading ? "카카오 로그인 중..." : "카카오로 1초 로그인"}
        </button>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--bd)" }} />
          <span className="text-[10px] tracking-[2px]" style={{ color: "var(--txm)" }}>또는 이메일로</span>
          <div className="flex-1 h-px" style={{ background: "var(--bd)" }} />
        </div>

        {/* Card */}
        <div className="rounded-lg border p-8" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
          {/* Tabs */}
          <div className="flex border-b mb-6" style={{ borderColor: "var(--bd)" }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className="flex-1 pb-3 text-xs tracking-[2px] uppercase border-b-2 transition-all"
                style={{
                  color: tab === t ? "var(--ac)" : "var(--txm)",
                  borderColor: tab === t ? "var(--ac)" : "transparent",
                  fontFamily: "'DM Sans',sans-serif",
                  marginBottom: "-1px",
                }}
              >
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {tab === "register" && (
              <div>
                <label className="text-[10px] tracking-[2px] uppercase block mb-1.5" style={{ color: "var(--txm)" }}>이름</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동"
                  className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                  style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }} />
              </div>
            )}
            <div>
              <label className="text-[10px] tracking-[2px] uppercase block mb-1.5" style={{ color: "var(--txm)" }}>이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
                className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }} />
            </div>
            <div>
              <label className="text-[10px] tracking-[2px] uppercase block mb-1.5" style={{ color: "var(--txm)" }}>비밀번호</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? "6자 이상" : "••••••••"}
                className="w-full px-3 py-2.5 rounded border text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }}
                onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())} />
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(184,64,64,.06)", color: "var(--dn)", border: "1px solid rgba(184,64,64,.2)" }}>
                {error}
              </div>
            )}

            <button onClick={tab === "login" ? handleLogin : handleRegister} disabled={loading}
              className="w-full py-3 rounded text-xs tracking-[3px] uppercase transition-all disabled:opacity-50 mt-2"
              style={{ background: "var(--ac)", color: "var(--bg)", fontFamily: "'DM Sans',sans-serif" }}>
              {loading ? "처리 중..." : tab === "login" ? "로그인" : "가입하기"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] mt-6" style={{ color: "var(--txm)" }}>
          가입 시 포인트 100pt 지급 · AI 분석 10회 무료
        </p>
      </div>
    </div>
  );
}
