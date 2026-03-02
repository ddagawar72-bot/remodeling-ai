import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/users?page=1&limit=20&search=email
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });
  }
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const search = searchParams.get("search") ?? "";
  const skip = (page - 1) * limit;

  const where = search
    ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, role: true,
        points: true, dailyUsageCount: true, createdAt: true,
      },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ ok: true, data: { users, total, page, limit } });
}
