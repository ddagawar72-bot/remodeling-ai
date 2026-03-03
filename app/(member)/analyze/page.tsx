"use client";
export const dynamic = "force-dynamic";
import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { SessionUser, InteriorAnalysis } from "@/types";

function genKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AnalyzePage() {
  const { data: session, update } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InteriorAnalysis | null>(null);
  const [pointsUsed, setPointsUsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 크기는 10MB 이하여야 합니다");
      return;
    }
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImageDataUri(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleAnalyze = async () => {
    if (!imageDataUri) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/feature/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": genKey(),
        },
        body: JSON.stringify({
          featureName: "space_analyze",
          imageBase64: imageDataUri,
          idempotencyKey: genKey(),
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "오류가 발생했습니다");
        return;
      }

      setResult(json.data.analysis);
      setPointsUsed(json.data.pointsUsed);
      await update(); // Refresh session points
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[9px] tracking-[5px] uppercase mb-2" style={{ color: "var(--ac)" }}>
          AI Interior Analysis
        </div>
        <h1
          className="text-3xl tracking-[6px] uppercase font-light mb-2"
          style={{ fontFamily: "'Cormorant Garamond',serif" }}
        >
          공간 분석
        </h1>
        <p className="text-sm" style={{ color: "var(--txm)", letterSpacing: "0.5px" }}>
          인테리어 사진을 업로드하면 AI가 스타일, 개선점, 예산을 분석합니다.
        </p>
      </div>

      {/* Points info */}
      <div
        className="flex items-center justify-between mb-6 px-4 py-3 rounded border text-xs"
        style={{ background: "rgba(158,122,82,.04)", borderColor: "rgba(158,122,82,.15)" }}
      >
        <span style={{ color: "var(--txm)", letterSpacing: "1px" }}>
          분석 1회 비용: <strong style={{ color: "var(--tx)" }}>10 pt</strong>
        </span>
        <span style={{ color: "var(--txm)", letterSpacing: "1px" }}>
          보유 포인트:{" "}
          <strong style={{ color: "var(--ac)" }}>{(user?.points ?? 0).toLocaleString()} pt</strong>
        </span>
      </div>

      {/* Upload zone */}
      <div
        className="rounded-lg border-2 border-dashed transition-all cursor-pointer mb-6"
        style={{
          borderColor: dragging ? "var(--ac)" : "var(--bd)",
          background: dragging ? "rgba(158,122,82,.04)" : "var(--bg2)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {imageDataUri ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUri}
              alt="업로드된 이미지"
              className="w-full max-h-80 object-contain rounded-lg"
            />
            <button
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
              style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}
              onClick={(e) => { e.stopPropagation(); setImageDataUri(null); setResult(null); }}
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center border"
              style={{ borderColor: "rgba(158,122,82,.25)", color: "var(--ac)" }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-sm" style={{ color: "var(--txm)" }}>
              이미지를 드래그하거나 클릭하여 업로드
            </div>
            <div className="text-xs" style={{ color: "var(--txm)", opacity: 0.6 }}>
              JPG · PNG · WebP · 최대 10MB
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded text-sm border"
          style={{ background: "rgba(184,64,64,.06)", borderColor: "rgba(184,64,64,.2)", color: "var(--dn)" }}
        >
          {error}
        </div>
      )}

      {/* Analyze button */}
      <button
        disabled={!imageDataUri || loading}
        onClick={handleAnalyze}
        className="w-full py-4 rounded flex items-center justify-center gap-3 text-xs tracking-[3px] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "var(--ac)",
          color: "var(--bg)",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            AI 분석 중...
          </>
        ) : (
          "✦ AI 공간 분석 시작"
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-[9px] tracking-[4px] uppercase" style={{ color: "var(--ac)" }}>
              분석 결과
            </div>
            <span
              className="text-[10px] px-3 py-1 rounded-full"
              style={{ background: "rgba(58,104,71,.08)", color: "var(--ok)", border: "1px solid rgba(58,104,71,.2)" }}
            >
              -{pointsUsed} pt 사용됨
            </span>
          </div>

          {/* Style + Summary */}
          <div
            className="p-5 rounded-lg border"
            style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}
          >
            <div className="text-[9px] tracking-[3px] uppercase mb-1" style={{ color: "var(--ac)" }}>
              현재 스타일
            </div>
            <div
              className="text-xl tracking-widest mb-3"
              style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400 }}
            >
              {result.style}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--txm)" }}>
              {result.summary}
            </p>
          </div>

          {/* Color palette */}
          <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
            <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ac)" }}>
              추천 컬러 팔레트
            </div>
            <div className="flex gap-2 flex-wrap">
              {result.colorPalette.map((c, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded text-xs tracking-widest"
                  style={{ background: "rgba(158,122,82,.08)", border: "1px solid rgba(158,122,82,.15)", color: "var(--tx)" }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
              <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ok)" }}>
                강점
              </div>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "var(--txm)" }}>
                    <span style={{ color: "var(--ok)" }}>✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
              <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ac)" }}>
                개선 포인트
              </div>
              <ul className="space-y-2">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "var(--txm)" }}>
                    <span style={{ color: "var(--ac)" }}>→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Budget + Recommendations */}
          <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
            <div className="text-[9px] tracking-[3px] uppercase mb-1" style={{ color: "var(--ac)" }}>
              예상 예산
            </div>
            <div className="text-lg font-light mb-4" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
              {result.estimatedBudget}
            </div>
            <div className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: "var(--ac)" }}>
              AI 제안
            </div>
            <ul className="space-y-2">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-sm" style={{ color: "var(--txm)" }}>
                  {i + 1}. {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
