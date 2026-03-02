import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/logs?page=1&limit=30&status=SUCCESS&feature=space_analyze
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });
  }
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 30));
  const status = searchParams.get("status");
  const feature = searchParams.get("feature");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (feature) where.featureName = feature;

  const [logs, total] = await Promise.all([
    db.usageLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
    db.usageLog.count({ where }),
  ]);

  const rows = logs.map((l) => ({
    id: l.id,
    userId: l.userId,
    userEmail: l.user.email,
    featureName: l.featureName,
    status: l.status,
    pointsUsed: l.pointsUsed,
    createdAt: l.createdAt.toISOString(),
    errorMsg: l.errorMsg,
  }));

  return NextResponse.json({ ok: true, data: { rows, total, page, limit } });
}
