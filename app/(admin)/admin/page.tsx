"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import type { FeatureRow, LogRow, UserRow } from "@/types";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-5 rounded-lg border" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
      <div className="text-[9px] tracking-[3px] uppercase mb-2" style={{ color: "var(--ac)" }}>{label}</div>
      <div className="text-2xl font-light" style={{ fontFamily: "'Cormorant Garamond',serif" }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--txm)" }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [adjustModal, setAdjustModal] = useState<UserRow | null>(null);
  const [adjustAmt, setAdjustAmt] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [pointModal, setPointModal] = useState<FeatureRow | null>(null);
  const [newPointCost, setNewPointCost] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users?limit=10").then((r) => r.json()),
      fetch("/api/admin/features").then((r) => r.json()),
      fetch("/api/admin/logs?limit=10").then((r) => r.json()),
    ]).then(([u, f, l]) => {
      if (u.ok) setUsers(u.data.users);
      if (f.ok) setFeatures(f.data);
      if (l.ok) setLogs(l.data.rows);
      setLoading(false);
    });
  }, []);

  const toggleFeature = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/admin/features?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if ((await res.json()).ok) {
      setFeatures((f) => f.map((x) => (x.id === id ? { ...x, enabled } : x)));
    }
  };

  const handlePointCostUpdate = async () => {
    if (!pointModal || !newPointCost) return;
    const cost = Number(newPointCost);
    if (isNaN(cost) || cost < 1) return;
    const res = await fetch(`/api/admin/features?id=${pointModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointCost: cost }),
    });
    const json = await res.json();
    if (json.ok) {
      setFeatures((f) => f.map((x) => (x.id === pointModal.id ? { ...x, pointCost: cost } : x)));
      setPointModal(null);
      setNewPointCost("");
    }
  };

  const handleAdjust = async () => {
    if (!adjustModal) return;
    const res = await fetch("/api/admin/points/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adjustModal.id, amount: Number(adjustAmt), reason: adjustReason }),
    });
    const json = await res.json();
    if (json.ok) {
      setUsers((u) => u.map((x) => x.id === adjustModal.id ? { ...x, points: json.data.newBalance } : x));
      setAdjustModal(null); setAdjustAmt(""); setAdjustReason("");
    }
  };

  const successLogs = logs.filter((l) => l.status === "SUCCESS").length;
  const failedLogs = logs.filter((l) => l.status === "FAILED" || l.status === "REFUNDED").length;

  if (loading) return <div className="text-sm" style={{ color: "var(--txm)" }}>로딩 중...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="text-[9px] tracking-[5px] uppercase mb-2" style={{ color: "var(--ac)" }}>Admin</div>
        <h1 className="text-3xl tracking-[6px] uppercase font-light" style={{ fontFamily: "'Cormorant Garamond',serif" }}>대시보드</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="총 회원" value={users.length + "+"} />
        <StatCard label="활성 기능" value={features.filter((f) => f.enabled).length} sub={`전체 ${features.length}개`} />
        <StatCard label="최근 성공" value={successLogs} sub="최근 10건 기준" />
        <StatCard label="최근 실패" value={failedLogs} sub="환불 포함" />
      </div>

      {/* Features */}
      <div>
        <div className="text-[9px] tracking-[4px] uppercase mb-4" style={{ color: "var(--ac)" }}>기능 관리</div>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bd)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(158,122,82,.06)", borderBottom: "1px solid var(--bd)" }}>
                {["기능명", "포인트 비용", "일일 한도", "상태", "관리"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] tracking-[2px] uppercase" style={{ color: "var(--txm)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} style={{ borderBottom: "1px solid var(--bd)", background: "var(--bg2)" }}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-xs">{f.displayName}</div>
                    <div className="text-[10px]" style={{ color: "var(--txm)" }}>{f.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: "var(--ac)" }}>{f.pointCost} pt</span>
                      <button
                        onClick={() => { setPointModal(f); setNewPointCost(String(f.pointCost)); }}
                        className="text-[9px] px-2 py-0.5 rounded border transition-all"
                        style={{ borderColor: "rgba(158,122,82,.3)", color: "var(--ac)" }}>
                        수정
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{f.dailyLimit}회</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                      background: f.enabled ? "rgba(58,104,71,.08)" : "rgba(184,64,64,.06)",
                      color: f.enabled ? "var(--ok)" : "var(--dn)",
                      border: `1px solid ${f.enabled ? "rgba(58,104,71,.2)" : "rgba(184,64,64,.2)"}`,
                    }}>
                      {f.enabled ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFeature(f.id, !f.enabled)}
                      className="text-[10px] px-3 py-1 rounded border transition-all"
                      style={{ borderColor: "var(--bd)", color: "var(--txm)" }}>
                      {f.enabled ? "비활성화" : "활성화"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users */}
      <div>
        <div className="text-[9px] tracking-[4px] uppercase mb-4" style={{ color: "var(--ac)" }}>최근 회원</div>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bd)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(158,122,82,.06)", borderBottom: "1px solid var(--bd)" }}>
                {["이메일", "권한", "포인트", "오늘 사용", "포인트 조정"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] tracking-[2px] uppercase" style={{ color: "var(--txm)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--bd)", background: "var(--bg2)" }}>
                  <td className="px-4 py-3 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                      background: u.role === "ADMIN" ? "rgba(158,122,82,.1)" : "rgba(28,26,23,.05)",
                      color: u.role === "ADMIN" ? "var(--ac)" : "var(--txm)",
                      border: "1px solid var(--bd)",
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--ac)" }}>{u.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{u.dailyUsageCount}회</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setAdjustModal(u)}
                      className="text-[10px] px-3 py-1 rounded border transition-all"
                      style={{ borderColor: "rgba(158,122,82,.3)", color: "var(--ac)" }}>
                      조정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs */}
      <div>
        <div className="text-[9px] tracking-[4px] uppercase mb-4" style={{ color: "var(--ac)" }}>최근 실행 로그</div>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bd)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(158,122,82,.06)", borderBottom: "1px solid var(--bd)" }}>
                {["사용자", "기능", "상태", "포인트", "시간"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] tracking-[2px] uppercase" style={{ color: "var(--txm)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: "1px solid var(--bd)", background: "var(--bg2)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--txm)" }}>{l.userEmail}</td>
                  <td className="px-4 py-3">{l.featureName}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: l.status === "SUCCESS" ? "var(--ok)" : l.status === "PENDING" ? "var(--ac)" : "var(--dn)", fontSize: 10 }}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ac)" }}>{l.pointsUsed} pt</td>
                  <td className="px-4 py-3" style={{ color: "var(--txm)" }}>{new Date(l.createdAt).toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 포인트 비용 수정 모달 */}
      {pointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(28,26,23,.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setPointModal(null)}>
          <div className="w-full max-w-sm p-6 rounded-lg border"
            style={{ background: "var(--bg2)", borderColor: "var(--bdh)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-[9px] tracking-[4px] uppercase mb-4" style={{ color: "var(--ac)" }}>포인트 비용 수정</div>
            <div className="text-sm mb-1" style={{ color: "var(--tx)" }}>{pointModal.displayName}</div>
            <div className="text-xs mb-4" style={{ color: "var(--txm)" }}>현재: {pointModal.pointCost} pt</div>
            <input
              type="number"
              placeholder="새 포인트 비용"
              value={newPointCost}
              onChange={(e) => setNewPointCost(e.target.value)}
              className="w-full px-3 py-2.5 rounded border mb-4 text-sm"
              style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }}
              min="1"
            />
            <div className="flex gap-3">
              <button onClick={handlePointCostUpdate} className="flex-1 py-2.5 rounded text-xs tracking-[2px] uppercase" style={{ background: "var(--ac)", color: "var(--bg)" }}>
                저장
              </button>
              <button onClick={() => setPointModal(null)} className="flex-1 py-2.5 rounded border text-xs tracking-[2px] uppercase" style={{ borderColor: "var(--bd)", color: "var(--txm)" }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(28,26,23,.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setAdjustModal(null)}>
          <div className="w-full max-w-sm p-6 rounded-lg border"
            style={{ background: "var(--bg2)", borderColor: "var(--bdh)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-[9px] tracking-[4px] uppercase mb-4" style={{ color: "var(--ac)" }}>포인트 조정</div>
            <div className="text-sm mb-4" style={{ color: "var(--txm)" }}>
              {adjustModal.email} — 현재 {adjustModal.points} pt
            </div>
            <input type="number" placeholder="조정 포인트 (양수/음수)" value={adjustAmt}
              onChange={(e) => setAdjustAmt(e.target.value)}
              className="w-full px-3 py-2.5 rounded border mb-3 text-sm"
              style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }} />
            <input type="text" placeholder="사유" value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded border mb-4 text-sm"
              style={{ background: "var(--bg)", borderColor: "var(--bd)", color: "var(--tx)" }} />
            <div className="flex gap-3">
              <button onClick={handleAdjust} className="flex-1 py-2.5 rounded text-xs tracking-[2px] uppercase" style={{ background: "var(--ac)", color: "var(--bg)" }}>적용</button>
              <button onClick={() => setAdjustModal(null)} className="flex-1 py-2.5 rounded border text-xs tracking-[2px] uppercase" style={{ borderColor: "var(--bd)", color: "var(--txm)" }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
