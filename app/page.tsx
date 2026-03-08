import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--ac)",
            marginBottom: 14,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          AI MBTI Analysis
        </div>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(32px,6vw,52px)",
            fontWeight: 300,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--tx)",
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}
        >
          우리집 MBTI
        </h1>
        <p style={{ color: "var(--txm)", fontSize: 13, lineHeight: 1.8, maxWidth: 380, margin: "0 auto" }}>
          사진 한 장으로 우리집의 MBTI를 분석합니다.<br />
          집 성격 진단 · 나와의 궁합 · 맞춤 인테리어 제안까지.
        </p>
      </div>

      {/* Features */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 16,
          maxWidth: 680,
          width: "100%",
          marginBottom: 48,
        }}
      >
        {[
          { icon: "◈", label: "집 MBTI 진단", desc: "공간 사진으로 집의 성격 분석" },
          { icon: "◆", label: "궁합 분석", desc: "나의 MBTI와 집의 궁합 점수" },
          { icon: "◉", label: "개선 제안", desc: "벽지·조명·가구 맞춤 추천" },
          { icon: "✦", label: "AI 리포트", desc: "전문가 수준의 인테리어 제안" },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--bd)",
              borderRadius: 8,
              padding: "20px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 20, color: "var(--ac)", marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--tx)", marginBottom: 4 }}>
              {f.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--txm)", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/analyze"
          style={{
            background: "var(--ac)",
            color: "var(--bg)",
            padding: "14px 36px",
            borderRadius: 4,
            fontSize: 10,
            letterSpacing: 3,
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          무료로 시작하기 →
        </Link>
        <Link
          href="/login"
          style={{
            background: "transparent",
            color: "var(--txm)",
            padding: "14px 28px",
            borderRadius: 4,
            fontSize: 10,
            letterSpacing: 3,
            textTransform: "uppercase",
            textDecoration: "none",
            border: "1px solid var(--bd)",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          로그인
        </Link>
      </div>

      <p style={{ marginTop: 32, fontSize: 10, color: "var(--txm)", letterSpacing: 1 }}>
        가입 시 100포인트 무료 지급 · MBTI 궁합 분석 10회 이용 가능
      </p>
    </main>
  );
}
