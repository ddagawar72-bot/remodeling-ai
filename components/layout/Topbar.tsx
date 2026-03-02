"use client";
import { signOut, useSession } from "next-auth/react";
import type { SessionUser } from "@/types";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  return (
    <header
      className="h-14 flex items-center justify-between px-6 border-b shrink-0"
      style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}
    >
      <div className="text-xs tracking-[3px] uppercase" style={{ color: "var(--txm)" }}>
        {user?.name ?? user?.email}
      </div>
      <div className="flex items-center gap-4">
        <span
          className="text-xs px-3 py-1 rounded-full border"
          style={{
            color: "var(--ac)",
            borderColor: "rgba(158,122,82,.2)",
            background: "rgba(158,122,82,.06)",
            letterSpacing: "1px",
          }}
        >
          {(user?.points ?? 0).toLocaleString()} pt
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs tracking-widest uppercase transition-colors"
          style={{ color: "var(--txm)", fontFamily: "'DM Sans',sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--dn)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--txm)")}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
