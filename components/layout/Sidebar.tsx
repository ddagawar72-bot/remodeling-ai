"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { SessionUser } from "@/types";

const memberNav = [
  { href: "/analyze", label: "AI 공간 분석", icon: "✦" },
  { href: "/mypage", label: "내 포인트 / 내역", icon: "◈" },
];
const adminNav = [
  { href: "/admin", label: "대시보드", icon: "▣" },
  { href: "/admin/users", label: "회원 관리", icon: "◉" },
  { href: "/admin/features", label: "기능 관리", icon: "◆" },
  { href: "/admin/logs", label: "사용 로그", icon: "◎" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const isAdmin = user?.role === "ADMIN";
  const nav = isAdmin ? [...adminNav, ...memberNav] : memberNav;

  return (
    <aside
      className="hidden md:flex flex-col w-56 border-r shrink-0"
      style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}
    >
      {/* Logo */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: "var(--bd)" }}
      >
        <div
          className="text-xs tracking-[5px] uppercase"
          style={{ color: "var(--ac)", fontFamily: "'DM Sans',sans-serif" }}
        >
          Interior AI
        </div>
        <div
          className="text-lg mt-1 tracking-widest"
          style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300 }}
        >
          우리집 고민
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-[2px] uppercase transition-all"
              style={{
                color: active ? "var(--ac)" : "var(--txm)",
                background: active ? "rgba(158,122,82,.08)" : "transparent",
                fontFamily: "'DM Sans',sans-serif",
                letterSpacing: "1.5px",
              }}
            >
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Points badge */}
      {user && (
        <div
          className="mx-3 mb-4 px-4 py-3 rounded border"
          style={{ background: "rgba(158,122,82,.06)", borderColor: "rgba(158,122,82,.2)" }}
        >
          <div className="text-[9px] tracking-[3px] uppercase mb-1" style={{ color: "var(--ac)" }}>
            보유 포인트
          </div>
          <div className="text-xl font-light" style={{ color: "var(--tx)" }}>
            {user.points.toLocaleString()}
            <span className="text-xs ml-1" style={{ color: "var(--txm)" }}>pt</span>
          </div>
        </div>
      )}
    </aside>
  );
}
