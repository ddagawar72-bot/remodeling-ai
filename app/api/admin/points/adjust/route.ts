import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminAdjustPoints } from "@/lib/services/point.service";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") return null;
  return session;
}

// POST /api/admin/points/adjust
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });
  }
  const { userId, amount, reason } = await req.json();
  if (!userId || amount === undefined || !reason) {
    return NextResponse.json({ ok: false, error: "필수 필드 누락" }, { status: 400 });
  }
  const newBalance = await adminAdjustPoints(userId, Number(amount), reason);
  return NextResponse.json({ ok: true, data: { newBalance } });
}
