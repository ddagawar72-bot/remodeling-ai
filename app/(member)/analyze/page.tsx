"use client";
export const dynamic = "force-dynamic";
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { SessionUser, HouseMBTI, CompatibilityResult, LuckResult, LuckType } from "@/types";

const MBTI_LIST = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];

const ANALYSIS_MODES = [
  { id: "compatibility", icon: "💑", label: "나와 집 궁합", desc: "내 MBTI와 집의 궁합 점수" },
  { id: "business", icon: "💼", label: "사업운", desc: "사업이 잘 풀리는 인테리어" },
  { id: "education", icon: "📚", label: "자녀교육운", desc: "공부 잘 하는 공간으로 변경" },
  { id: "love", icon: "💕", label: "연애운", desc: "연애운 좋아지는 인테리어" },
];

const LUCK_LABELS: Record<string, string> = {
  business: "사업운",
  education: "자녀교육운",
  love: "연애운",
};

function genKey() { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }

export default function AnalyzePage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const update = sessionData?.update;
  const user = session?.user as SessionUser | undefined;

  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [houseMbti, setHouseMbti] = useState<HouseMBTI | null>(null);
  const [analysisMode, setAnalysisMode] = useState<string>("");
  const [userMbti, setUserMbti] = useState<string>("");
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [luckResult, setLuckResult] = useState<LuckResult | null>(null);
  const [pointsUsed, setPointsUsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("이미지 파일만 업로드할 수 있습니다"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("이미지 크기는 10MB 이하여야 합니다"); return; }
    setError(null); setHouseMbti(null); setCompatibility(null); setLuckResult(null); setAnalysisMode("");
    const reader = new FileReader();
    reader.onload = (e) => setImageDataUri(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]; if (file) handleFile(file);
  }, [handleFile]);

  // Step 1: 집 MBTI 분석
  const handleAnalyze = async () => {
    if (!imageDataUri) return;
    setLoading(true); setLoadingMsg("우리집 MBTI 분석 중..."); setError(null);
    try {
      const res = await fetch("/api/feature/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureName: "space_analyze", imageBase64: imageDataUri, idempotencyKey: genKey() }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error ?? "오류가 발생했습니다"); return; }
      setHouseMbti(json.data.analysis);
      setPointsUsed(json.data.pointsUsed);
      await update?.();
    } catch { setError("네트워크 오류가 발생했습니다"); }
    finally { setLoading(false); setLoadingMsg(""); }
  };

  // Step 2a: 궁합 분석
  const handleCompatibility = async () => {
    if (!houseMbti || !userMbti) return;
    setLoading(true); setLoadingMsg("궁합 분석 중..."); setError(null);
    try {
      const res = await fetch("/api/feature/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houseMbti: houseMbti.mbti, userMbti, idempotencyKey: genKey() }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error ?? "오류가 발생했습니다"); return; }
      setCompatibility(json.data);
    } catch { setError("네트워크 오류가 발생했습니다"); }
    finally { setLoading(false); setLoadingMsg(""); }
  };

  // Step 2b: 운세 분석
  const handleLuck = async (luckType: LuckType) => {
    if (!houseMbti || !imageDataUri) return;
    setLoading(true); setLoadingMsg(`${LUCK_LABELS[luckType]} 분석 중...`); setError(null);
    try {
      const res = await fetch("/api/feature/luck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageDataUri, houseMbti: houseMbti.mbti, luckType }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error ?? "오류가 발생했습니다"); return; }
      setLuckResult(json.data.result);
      await update?.();
    } catch { setError("네트워크 오류가 발생했습니다"); }
    finally { setLoading(false); setLoadingMsg(""); }
  };

  const scoreColor = (s: number) => s >= 90 ? "#4a9e6b" : s >= 70 ? "#9e7a52" : s >= 50 ? "#c4a35a" : "#b84040";

  const luckIcon: Record<string, string> = { business: "💼", education: "📚", love: "💕" };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[9px] tracking-[5px] uppercase mb-2" style={{ color: "var(--ac)" }}>AI MBTI Analysis</div>
        <h1 className="text-3xl tracking-[6px] uppercase font-light mb-2" style={{ fontFamily: "'Cormorant Garamond',serif" }}>우리집 MBTI</h1>
        <p className="text-sm" style={{ color: "var(--txm)", letterSpacing: "0.5px" }}>
          사진 한 장으로 우리집의 MBTI를 분석하고, 원하는 운을 높이는 인테리어를 제안받으세요.
        </p>
      </div>

      {/* Points info */}
      <div className="flex items-center justify-between mb-6 px-4 py-3 rounded border text-xs"
        style={{ background: "rgba(158,122,82,.04)", borderColor: "rgba(158,122,82,.15)" }}>
        <span style={{ color: "var(--txm)", letterSpacing: "1px" }}>분석 1회 비용: <strong style={{ color: "var(--tx)" }}>10 pt</strong></span>
        <span style={{ color: "var(--txm)", letterSpacing: "1px" }}>보유 포인트: <strong style={{ color: "var(--ac)" }}>{(user?.points ?? 0).toLocaleString()} pt</strong></span>
      </div>

      {/* Upload zone */}
      <div className="rounded-lg border-2 border-dashed transition-all cursor-pointer mb-6"
        style={{ borderColor: dragging ? "var(--ac)" : "var(--bd)", background: dragging ? "rgba(158,122,82,.04)" : "var(--bg2)" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={handleDrop} onClick={() => inputRef.current?.click()}>
        {imageDataUri ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUri} alt="업로드된 이미지" className="w-full max-h-80 object-contain rounded-lg" />
            <button className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}
              onClick={(e) => { e.stopPropagation(); setImageDataUri(null); setHouseMbti(null); setCompatibility(null); setLuckResult(null); setAnalysisMode(""); }}>×</button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border" style={{ borderColor: "rgba(158,122,82,.25)", color: "var(--ac)" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-sm" style={{ color: "var(--txm)" }}>이미지를 드래그하거나 클릭하여 업로드</div>
            <div className="text-xs" style={{ color: "var(--txm)", opacity: 0.6 }}>JPG · PNG · WebP · 최대 10MB</div>
          </div>
        )}
        <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {error && <div className="mb-4 px-4 py-3 rounded text-sm border" style={{ background: "rgba(184,64,64,.06)", borderColor: "rgba(184,64,64,.2)", color: "var(--dn)" }}>{error}</div>}

      {/* Step 1: 분석 버튼 */}
      {!houseMbti && (
        <button disabled={!imageDataUri || loading} onClick={handleAnalyze}
          className="w-full py-4 rounded flex items-center justify-center gap-3 text-xs tracking-[3px] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--ac)", color: "var(--bg)", fontFamily: "'DM Sans',sans-serif" }}>
          {loading ? <><span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />{loadingMsg}</> : "✦ 우리집 MBTI 분석 시작"}
        </button>
      )}

      {/* 집 MBTI 결과 */}
      {houseMbti && (
        <div className="mt-6 space-y-5">
          <div className="text-[9px] tracking-[4px] uppercase flex items-center justify-between" style={{ color: "var(--ac)" }}>
            <span>우리집 MBTI 결과</span>
            <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: "rgba(58,104,71,.08)", color: "var(--ok)", border: "1px solid rgba(58,104,71,.2)" }}>-{pointsUsed} pt</span>
          </div>

          <div className="p-6 rounded-lg border text-center" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
            <div className="text-5xl font-light tracking-widest mb-2" style={{ fontFamily: "'Cormorant Garamond',serif", color: "var(--ac)" }}>{houseMbti.mbti}</div>
            <div className="text-lg tracking-widest mb-3" style={{ fontFamily: "'Cormorant Garamond',serif" }}>{houseMbti.mbtiName}</div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--txm)" }}>{houseMbti.description}</p>
          </div>

          <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
            <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ac)" }}>공간 특성</div>
            <div className="grid grid-cols-2 gap-2">
              {houseMbti.traits.map((t, i) => <div key={i} className="px-3 py-2 rounded text-xs text-center" style={{ background: "rgba(158,122,82,.06)", border: "1px solid rgba(158,122,82,.12)", color: "var(--tx)" }}>{t}</div>)}
            </div>
          </div>

          <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
            <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ac)" }}>어울리는 색상</div>
            <div className="flex gap-2 flex-wrap">
              {houseMbti.colorPalette.map((c, i) => <span key={i} className="px-3 py-1.5 rounded text-xs tracking-widest" style={{ background: "rgba(158,122,82,.08)", border: "1px solid rgba(158,122,82,.15)", color: "var(--tx)" }}>{c}</span>)}
            </div>
          </div>

          {/* Step 2: 분석 모드 선택 */}
          {!compatibility && !luckResult && (
            <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
              <div className="text-[9px] tracking-[3px] uppercase mb-4" style={{ color: "var(--ac)" }}>원하는 분석을 선택하세요</div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {ANALYSIS_MODES.map((m) => (
                  <button key={m.id} onClick={() => setAnalysisMode(m.id)}
                    className="p-4 rounded-lg text-left transition-all"
                    style={{
                      background: analysisMode === m.id ? "rgba(158,122,82,.12)" : "rgba(158,122,82,.04)",
                      border: `1px solid ${analysisMode === m.id ? "var(--ac)" : "rgba(158,122,82,.15)"}`,
                    }}>
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--tx)", letterSpacing: "0.5px" }}>{m.label}</div>
                    <div className="text-[10px]" style={{ color: "var(--txm)" }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* 궁합 모드 - MBTI 선택 */}
              {analysisMode === "compatibility" && (
                <div>
                  <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ac)" }}>나의 MBTI 선택</div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {MBTI_LIST.map((m) => (
                      <button key={m} onClick={() => setUserMbti(m)} className="py-2 rounded text-xs tracking-widest transition-all"
                        style={{ background: userMbti === m ? "var(--ac)" : "rgba(158,122,82,.06)", color: userMbti === m ? "var(--bg)" : "var(--tx)", border: `1px solid ${userMbti === m ? "var(--ac)" : "rgba(158,122,82,.12)"}` }}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <button disabled={!userMbti || loading} onClick={handleCompatibility}
                    className="w-full py-3 rounded text-xs tracking-[3px] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--ac)", color: "var(--bg)", fontFamily: "'DM Sans',sans-serif" }}>
                    {loading ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />{loadingMsg}</span>
                      : `💑 집(${houseMbti.mbti}) × 나(${userMbti || "??"}) 궁합 분석`}
                  </button>
                </div>
              )}

              {/* 운세 모드 */}
              {(analysisMode === "business" || analysisMode === "education" || analysisMode === "love") && (
                <button disabled={loading} onClick={() => handleLuck(analysisMode as LuckType)}
                  className="w-full py-3 rounded text-xs tracking-[3px] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--ac)", color: "var(--bg)", fontFamily: "'DM Sans',sans-serif" }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />{loadingMsg}</span>
                    : `${luckIcon[analysisMode]} ${LUCK_LABELS[analysisMode]} 인테리어 분석`}
                </button>
              )}
            </div>
          )}

          {/* 궁합 결과 */}
          {compatibility && (
            <div className="space-y-4">
              <div className="text-[9px] tracking-[4px] uppercase" style={{ color: "var(--ac)" }}>💑 궁합 분석 결과</div>
              <div className="p-6 rounded-lg border text-center" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                <div className="text-[9px] tracking-[3px] uppercase mb-2" style={{ color: "var(--txm)" }}>{houseMbti.mbti} 집 × {userMbti} 나</div>
                <div className="text-6xl font-light mb-1" style={{ fontFamily: "'Cormorant Garamond',serif", color: scoreColor(compatibility.score) }}>{compatibility.score}</div>
                <div className="text-xs mb-3" style={{ color: "var(--txm)" }}>/ 100점</div>
                <div className="text-lg tracking-widest mb-3" style={{ fontFamily: "'Cormorant Garamond',serif", color: scoreColor(compatibility.score) }}>{compatibility.grade}</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--txm)" }}>{compatibility.summary}</p>
                <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: "var(--bd)" }}>
                  <div className="h-full rounded-full" style={{ width: `${compatibility.score}%`, background: scoreColor(compatibility.score) }} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                  <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ok)" }}>잘 맞는 점</div>
                  <ul className="space-y-2">{compatibility.pros.map((p, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--txm)" }}><span style={{ color: "var(--ok)" }}>✓</span>{p}</li>)}</ul>
                </div>
                <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                  <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--dn)" }}>안 맞는 점</div>
                  <ul className="space-y-2">{compatibility.cons.map((c, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--txm)" }}><span style={{ color: "var(--dn)" }}>✗</span>{c}</li>)}</ul>
                </div>
              </div>
              <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                <div className="text-[9px] tracking-[3px] uppercase mb-4" style={{ color: "var(--ac)" }}>인테리어 개선 제안</div>
                <div className="space-y-4">
                  {compatibility.improvements.map((item, i) => (
                    <div key={i} className="border-l-2 pl-4" style={{ borderColor: "var(--ac)" }}>
                      <div className="text-xs font-medium mb-1" style={{ color: "var(--ac)", letterSpacing: "1px" }}>{item.area}</div>
                      <div className="text-xs mb-1" style={{ color: "var(--txm)" }}>현재: {item.current}</div>
                      <div className="text-sm" style={{ color: "var(--tx)" }}>→ {item.suggestion}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => { setCompatibility(null); setAnalysisMode(""); setUserMbti(""); }}
                className="w-full py-3 rounded text-xs tracking-[3px] uppercase" style={{ background: "transparent", color: "var(--txm)", border: "1px solid var(--bd)", fontFamily: "'DM Sans',sans-serif" }}>
                다른 분석하기
              </button>
            </div>
          )}

          {/* 운세 분석 결과 */}
          {luckResult && (
            <div className="space-y-4">
              <div className="text-[9px] tracking-[4px] uppercase" style={{ color: "var(--ac)" }}>
                {luckIcon[luckResult.luckType]} {LUCK_LABELS[luckResult.luckType]} 분석 결과
              </div>

              {/* 점수 비교 */}
              <div className="p-6 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                <div className="text-[9px] tracking-[3px] uppercase mb-4 text-center" style={{ color: "var(--txm)" }}>
                  현재 → 변경 후 {LUCK_LABELS[luckResult.luckType]} 점수
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-light" style={{ fontFamily: "'Cormorant Garamond',serif", color: scoreColor(luckResult.currentScore) }}>{luckResult.currentScore}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--txm)" }}>현재</div>
                    <div className="h-1.5 mt-2 rounded-full w-24" style={{ background: "var(--bd)" }}>
                      <div className="h-full rounded-full" style={{ width: `${luckResult.currentScore}%`, background: scoreColor(luckResult.currentScore) }} />
                    </div>
                  </div>
                  <div className="text-2xl" style={{ color: "var(--ac)" }}>→</div>
                  <div className="text-center">
                    <div className="text-4xl font-light" style={{ fontFamily: "'Cormorant Garamond',serif", color: scoreColor(luckResult.afterScore) }}>{luckResult.afterScore}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--txm)" }}>변경 후</div>
                    <div className="h-1.5 mt-2 rounded-full w-24" style={{ background: "var(--bd)" }}>
                      <div className="h-full rounded-full" style={{ width: `${luckResult.afterScore}%`, background: scoreColor(luckResult.afterScore) }} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(58,104,71,.08)", color: "var(--ok)", border: "1px solid rgba(58,104,71,.2)" }}>
                    +{luckResult.afterScore - luckResult.currentScore}점 상승 예상
                  </span>
                </div>
              </div>

              {/* 목표 MBTI */}
              <div className="p-5 rounded-lg border text-center" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                <div className="text-[9px] tracking-[3px] uppercase mb-2" style={{ color: "var(--ac)" }}>
                  {LUCK_LABELS[luckResult.luckType]}에 최적화된 공간 MBTI
                </div>
                <div className="text-3xl font-light tracking-widest mb-1" style={{ fontFamily: "'Cormorant Garamond',serif", color: "var(--ac)" }}>{luckResult.targetMbti}</div>
                <div className="text-sm" style={{ color: "var(--tx)" }}>{luckResult.targetMbtiName}</div>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--txm)" }}>{luckResult.summary}</p>
              </div>

              {/* 인테리어 개선 제안 */}
              <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                <div className="text-[9px] tracking-[3px] uppercase mb-4" style={{ color: "var(--ac)" }}>인테리어 변경 제안</div>
                <div className="space-y-5">
                  {luckResult.improvements.map((item, i) => (
                    <div key={i} className="border-l-2 pl-4" style={{ borderColor: "var(--ac)" }}>
                      <div className="text-xs font-medium mb-1" style={{ color: "var(--ac)", letterSpacing: "1px" }}>{item.area}</div>
                      <div className="text-xs mb-1" style={{ color: "var(--txm)" }}>현재: {item.current}</div>
                      <div className="text-sm mb-1" style={{ color: "var(--tx)" }}>→ {item.suggestion}</div>
                      <div className="text-xs px-2 py-1 rounded" style={{ background: "rgba(158,122,82,.06)", color: "var(--txm)" }}>💡 {item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 즉시 실천 팁 */}
              <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
                <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ac)" }}>즉시 실천할 수 있는 팁</div>
                <ul className="space-y-2">
                  {luckResult.tips.map((tip, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: "var(--txm)" }}>
                      <span style={{ color: "var(--ac)" }}>✦</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={() => { setLuckResult(null); setAnalysisMode(""); }}
                className="w-full py-3 rounded text-xs tracking-[3px] uppercase" style={{ background: "transparent", color: "var(--txm)", border: "1px solid var(--bd)", fontFamily: "'DM Sans',sans-serif" }}>
                다른 분석하기
              </button>
            </div>
          )}

          {/* 처음부터 */}
          {(compatibility || luckResult) && (
            <button onClick={() => { setHouseMbti(null); setCompatibility(null); setLuckResult(null); setUserMbti(""); setAnalysisMode(""); setImageDataUri(null); }}
              className="w-full py-3 rounded text-xs tracking-[3px] uppercase" style={{ background: "transparent", color: "var(--txm)", border: "1px solid var(--bd)", fontFamily: "'DM Sans',sans-serif" }}>
              처음부터 다시 분석
            </button>
          )}
        </div>
      )}
    </div>
  );
}
