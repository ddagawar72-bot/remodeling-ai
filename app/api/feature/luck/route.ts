import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeLuck } from "@/lib/services/ai.service";
import { deductPoints, refundPoints } from "@/lib/services/point.service";
import { checkFeatureAccess } from "@/lib/services/feature.service";
import { validateImageDataUri } from "@/lib/validators/image.validator";
import { db } from "@/lib/db";
import { LogStatus } from "@prisma/client";
import type { LuckType } from "@/types";

function genKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { imageBase64: dataUri, houseMbti, luckType } = await req.json();

  if (!dataUri || !houseMbti || !luckType) {
    return NextResponse.json({ ok: false, error: "필수 필드가 누락되었습니다" }, { status: 400 });
  }

  const validLuckTypes = ["business", "education", "love"];
  if (!validLuckTypes.includes(luckType)) {
    return NextResponse.json({ ok: false, error: "올바르지 않은 운 종류입니다" }, { status: 400 });
  }

  const imageVal = validateImageDataUri(dataUri);
  if (!imageVal.ok) {
    return NextResponse.json({ ok: false, error: imageVal.error }, { status: 400 });
  }

  const check = await checkFeatureAccess(userId, "space_analyze");
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.reason }, { status: check.status });
  }

  const deduct = await deductPoints(userId, check.pointCost, `${luckType} 운세 분석`);
  if (!deduct.success) {
    return NextResponse.json({ ok: false, error: deduct.error }, { status: 402 });
  }

  const idempotencyKey = genKey();
  const log = await db.usageLog.create({
    data: { userId, featureName: `luck_${luckType}`, status: LogStatus.PENDING, pointsUsed: check.pointCost, idempotencyKey },
  });

  try {
    const result = await analyzeLuck({
      imageBase64: imageVal.base64!,
      mimeType: imageVal.mimeType!,
      luckType: luckType as LuckType,
      houseMbti,
    });

    await db.usageLog.update({ where: { id: log.id }, data: { status: LogStatus.SUCCESS, resultData: JSON.stringify(result) } });

    return NextResponse.json({ ok: true, data: { result, pointsUsed: check.pointCost, remainingPoints: deduct.remainingPoints } });
  } catch (err) {
    console.error("[luck]", err);
    await refundPoints(userId, check.pointCost, "운세 분석 실패 환불").catch(() => {});
    await db.usageLog.update({ where: { id: log.id }, data: { status: LogStatus.FAILED, errorMsg: err instanceof Error ? err.message : "Unknown" } }).catch(() => {});
    return NextResponse.json({ ok: false, error: "운세 분석 중 오류가 발생했습니다. 포인트가 환불되었습니다." }, { status: 500 });
  }
}
