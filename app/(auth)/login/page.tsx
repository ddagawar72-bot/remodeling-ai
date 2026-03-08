"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get("tab") === "register") setTab("register");
    if (params.get("email")) setEmail(params.get("email")!);
  }, [params]);

  const handleLogin = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요"); return; }
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("이메일 또는 비밀번호가 올바르지 않습니다"); return; }
    router.push("/analyze");
  };

  const handleRegister = async () => {
    if (!name || !email || !password) { setError("모든 항목을 입력해주세요"); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다"); return; }
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, phone }),
    });
    const json = await res.json();
    if (!json.ok) { setError(json.error ?? "회원가입 실패"); setLoading(false); return; }
    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/analyze");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="text-[9px] tracking-[5px] uppercase mb-2" style={{ color: "var(--ac)" }}>AI MBTI</div>
          <div className="text-3xl tracking-[8px] uppercase font-light" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
            우리집 MBTI
          </div>
          <div className="text-[10px] tracking-[2px] mt-2" style={{ color: "var(--txm)" }}>
            jeon.shop 계정으로 이용하세요
          </div>
        </div>

        {/* 카드 */}
        <div className="rounded-lg border p-8" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
          {/* 탭 */}
          <div className="flex border-b mb-6" style={{ borderColor: "var(--bd)" }}>
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                className="flex-1 pb-3 text-xs tracking-widest uppercase transition-colors"
                style={{ color: tab === t ? "var(--ac)" : "var(--txm)", borderBottom: tab === t ? "1px solid var(--ac)" : "1px solid transparent" }}>
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] tracking-widest uppercase block mb-1.5" style={{ color: "var(--txm)" }}>이메일</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="이메일" onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="w-full px-4 py-3 rounded text-sm border outline-none transition-all"
                  style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }} />
              </div>
              <div>
                <label className="text-[10px] tracking-widest uppercase block mb-1.5" style={{ color: "var(--txm)" }}>비밀번호</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호" onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="w-full px-4 py-3 rounded text-sm border outline-none transition-all"
                  style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }} />
              </div>
              {error && <p className="text-xs" style={{ color: "var(--err)" }}>{error}</p>}
              <button onClick={handleLogin} disabled={loading}
                className="w-full py-3.5 rounded text-xs tracking-widest uppercase font-medium transition-all disabled:opacity-50"
                style={{ background: "var(--ac)", color: "#fff" }}>
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {[
                { label: "이름", val: name, set: setName, type: "text", ph: "이름" },
                { label: "이메일", val: email, set: setEmail, type: "email", ph: "이메일" },
                { label: "연락처", val: phone, set: setPhone, type: "tel", ph: "연락처 (선택)" },
                { label: "비밀번호", val: password, set: setPassword, type: "password", ph: "6자 이상" },
                { label: "비밀번호 확인", val: confirm, set: setConfirm, type: "password", ph: "재입력" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] tracking-widest uppercase block mb-1.5" style={{ color: "var(--txm)" }}>{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} onKeyDown={e => e.key === "Enter" && handleRegister()}
                    className="w-full px-4 py-3 rounded text-sm border outline-none transition-all"
                    style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }} />
                </div>
              ))}
              {error && <p className="text-xs" style={{ color: "var(--err)" }}>{error}</p>}
              <button onClick={handleRegister} disabled={loading}
                className="w-full py-3.5 rounded text-xs tracking-widest uppercase font-medium transition-all disabled:opacity-50"
                style={{ background: "var(--ac)", color: "#fff" }}>
                {loading ? "가입 중..." : "회원가입"}
              </button>
              <p className="text-[10px] text-center" style={{ color: "var(--txm)" }}>가입 시 포인트 100pt 지급 · AI 분석 10회 무료</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
