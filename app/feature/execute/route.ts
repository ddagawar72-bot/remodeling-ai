import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deductPoints, refundPoints } from "@/lib/services/point.service";
import { checkFeatureAccess, incrementDailyUsage } from "@/lib/services/feature.service";
import { analyzeInterior } from "@/lib/services/ai.service";
import { validateImageDataUri } from "@/lib/validators/image.validator";
import { LogStatus } from "@prisma/client";

const executionLocks = new Set<string>();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { featureName, imageBase64: dataUri, idempotencyKey, prompt } = body;

  if (!featureName || !dataUri || !idempotencyKey) {
    return NextResponse.json({ ok: false, error: "필수 필드가 누락되었습니다" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_-]{10,64}$/.test(idempotencyKey)) {
    return NextResponse.json({ ok: false, error: "올바르지 않은 요청 키입니다" }, { status: 400 });
  }

  const existing = await db.usageLog.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (existing.status === LogStatus.SUCCESS && existing.resultData) {
      return NextResponse.json({ ok: true, data: { logId: existing.id, analysis: JSON.parse(existing.resultData), pointsUsed: existing.pointsUsed } });
    }
    return NextResponse.json({ ok: false, error: "이미 처리 중인 요청입니다" }, { status: 409 });
  }

  if (executionLocks.has(userId)) {
    return NextResponse.json({ ok: false, error: "이전 요청이 처리 중입니다" }, { status: 429 });
  }
  executionLocks.add(userId);

  let logId: string | null = null;
  let pointsDeducted = 0;

  try {
    const imageVal = validateImageDataUri(dataUri);
    if (!imageVal.ok) {
      return NextResponse.json({ ok: false, error: imageVal.error }, { status: 400 });
    }

    const check = await checkFeatureAccess(userId, featureName);
    if (!check.ok) {
      return NextResponse.json({ ok: false, error: check.reason }, { status: check.status });
    }

    const deduct = await deductPoints(userId, check.pointCost, `${featureName} 기능 사용`);
    if (!deduct.success) {
      return NextResponse.json({ ok: false, error: deduct.error }, { status: 402 });
    }
    pointsDeducted = check.pointCost;

    const log = await db.usageLog.create({
      data: { userId, featureName, status: LogStatus.PENDING, pointsUsed: check.pointCost, idempotencyKey },
    });
    logId = log.id;

    const feature = await db.feature.findUnique({ where: { name: featureName } });
    const analysis = await analyzeInterior({
      imageBase64: imageVal.base64!,
      mimeType: imageVal.mimeType!,
      prompt,
      timeoutSeconds: feature?.timeoutSeconds ?? 30,
    });

    await db.usageLog.update({ where: { id: logId }, data: { status: LogStatus.SUCCESS, resultData: JSON.stringify(analysis) } });
    await incrementDailyUsage(userId);

    return NextResponse.json({ ok: true, data: { logId, analysis, pointsUsed: check.pointCost, remainingPoints: deduct.remainingPoints } });

  } catch (err: unknown) {
    console.error("[feature/execute]", err);
    if (pointsDeducted > 0) {
      await refundPoints(userId, pointsDeducted, `${featureName} 실패 환불`).catch(() => {});
    }
    if (logId) {
      await db.usageLog.update({ where: { id: logId }, data: { status: LogStatus.FAILED, errorMsg: err instanceof Error ? err.message : "Unknown error" } }).catch(() => {});
    }
    return NextResponse.json({ ok: false, error: "AI 분석 중 오류가 발생했습니다. 포인트가 환불되었습니다." }, { status: 500 });
  } finally {
    executionLocks.delete(userId);
  }
}
