import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return null;
  }
  return session;
}

// GET /api/admin/features
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });
  }
  const features = await db.feature.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ ok: true, data: features });
}

// POST /api/admin/features — create or upsert
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });
  }
  const body = await req.json();
  const feature = await db.feature.upsert({
    where: { name: body.name },
    update: {
      displayName: body.displayName,
      description: body.description ?? "",
      pointCost: Number(body.pointCost),
      enabled: Boolean(body.enabled),
      dailyLimit: Number(body.dailyLimit),
      timeoutSeconds: Number(body.timeoutSeconds ?? 30),
    },
    create: {
      name: body.name,
      displayName: body.displayName,
      description: body.description ?? "",
      pointCost: Number(body.pointCost),
      enabled: Boolean(body.enabled),
      dailyLimit: Number(body.dailyLimit),
      timeoutSeconds: Number(body.timeoutSeconds ?? 30),
    },
  });
  return NextResponse.json({ ok: true, data: feature });
}

// PATCH /api/admin/features?id=xxx — toggle / update single field
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id 필요" }, { status: 400 });

  const body = await req.json();
  const feature = await db.feature.update({
    where: { id },
    data: body,
  });
  return NextResponse.json({ ok: true, data: feature });
}
