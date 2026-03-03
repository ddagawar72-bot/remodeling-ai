"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { SessionUser } from "@/types";

interface LogEntry {
  id: string;
  featureName: string;
  status: string;
  pointsUsed: number;
  createdAt: string;
  errorMsg: string | null;
}

const DAILY_LIMIT = 10;

export default function MyPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/history").then((r) => r.json()),
      fetch("/api/user/points").then((r) => r.json()),
    ]).then(([h, p]) => {
      if (h.ok) setLogs(h.data.logs);
      if (p.ok) setDailyCount(p.data.dailyUsageCount);
      setLoading(false);
    });
  }, []);

  const totalUsed = logs.filter((l) => l.status === "SUCCESS").reduce((a, l) => a + l.pointsUsed, 0);
  const successCount = logs.filter((l) => l.status === "SUCCESS").length;

  if (loading) return <div className="text-sm" style={{ color: "var(--txm)" }}>로딩 중...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="text-[9px] tracking-[5px] uppercase mb-2" style={{ color: "var(--ac)" }}>My Page</div>
        <h1 className="text-3xl tracking-[6px] uppercase font-light" style={{ fontFamily: "'Cormorant Garamond',serif" }}>내 포인트</h1>
      </div>

      {/* Points card */}
      <div
        className="p-6 rounded-lg border"
        style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}
      >
        <div className="text-[9px] tracking-[4px] uppercase mb-3" style={{ color: "var(--ac)" }}>보유 포인트</div>
        <div className="text-5xl font-light mb-1" style={{ fontFamily: "'Cormorant Garamond',serif", color: "var(--ac)" }}>
          {(user?.points ?? 0).toLocaleString()}
          <span className="text-xl ml-2" style={{ color: "var(--txm)" }}>pt</span>
        </div>
        <div className="text-xs mt-4 mb-2 flex justify-between" style={{ color: "var(--txm)" }}>
          <span>오늘 사용</span>
          <span>{dailyCount} / {DAILY_LIMIT}회</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "var(--bg3)" }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${Math.min(100, (dailyCount / DAILY_LIMIT) * 100)}%`,
              background: dailyCount >= DAILY_LIMIT ? "var(--dn)" : "var(--ac)",
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "총 사용 횟수", value: successCount + "회" },
          { label: "총 사용 포인트", value: totalUsed + " pt" },
          { label: "평균 포인트/회", value: successCount ? Math.round(totalUsed / successCount) + " pt" : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-lg border text-center" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
            <div className="text-[8px] tracking-[2px] uppercase mb-2" style={{ color: "var(--txm)" }}>{label}</div>
            <div className="text-lg font-light" style={{ fontFamily: "'Cormorant Garamond',serif", color: "var(--ac)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* History */}
      <div>
        <div className="text-[9px] tracking-[4px] uppercase mb-4" style={{ color: "var(--ac)" }}>사용 내역</div>
        {logs.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--txm)" }}>
            아직 사용 내역이 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border"
                style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}
              >
                <div>
                  <div className="text-xs font-medium">{l.featureName}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--txm)" }}>
                    {new Date(l.createdAt).toLocaleString("ko-KR")}
                  </div>
                  {l.errorMsg && <div className="text-[10px] mt-0.5" style={{ color: "var(--dn)" }}>{l.errorMsg}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: l.status === "SUCCESS" ? "rgba(58,104,71,.08)" : l.status === "REFUNDED" ? "rgba(158,122,82,.08)" : "rgba(184,64,64,.06)",
                      color: l.status === "SUCCESS" ? "var(--ok)" : l.status === "REFUNDED" ? "var(--ac)" : "var(--dn)",
                      border: `1px solid ${l.status === "SUCCESS" ? "rgba(58,104,71,.2)" : "var(--bd)"}`,
                    }}
                  >
                    {l.status}
                  </span>
                  <span className="text-xs" style={{ color: l.status === "REFUNDED" ? "var(--ok)" : "var(--dn)" }}>
                    {l.status === "REFUNDED" ? "+" : "-"}{l.pointsUsed} pt
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
