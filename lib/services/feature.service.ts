import { db } from "@/lib/db";

export type FeatureCheckResult =
  | { ok: true; pointCost: number; featureId: string }
  | { ok: false; reason: string; status: number };

/**
 * Validate that a feature is usable by a user right now.
 * Checks: enabled, daily limit, points.
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: string
): Promise<FeatureCheckResult> {
  const feature = await db.feature.findUnique({ where: { name: featureName } });
  if (!feature) return { ok: false, reason: "기능을 찾을 수 없습니다", status: 404 };
  if (!feature.enabled) return { ok: false, reason: "현재 비활성화된 기능입니다", status: 503 };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { points: true, dailyUsageCount: true, dailyResetAt: true },
  });
  if (!user) return { ok: false, reason: "사용자를 찾을 수 없습니다", status: 404 };

  // Daily reset logic
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  if (!user.dailyResetAt || user.dailyResetAt < midnight) {
    await db.user.update({
      where: { id: userId },
      data: { dailyUsageCount: 0, dailyResetAt: now },
    });
    user.dailyUsageCount = 0;
  }

  if (user.dailyUsageCount >= feature.dailyLimit) {
    return {
      ok: false,
      reason: `일일 사용 한도(${feature.dailyLimit}회)를 초과했습니다`,
      status: 429,
    };
  }

  if (user.points < feature.pointCost) {
    return {
      ok: false,
      reason: `포인트가 부족합니다 (필요: ${feature.pointCost}, 보유: ${user.points})`,
      status: 402,
    };
  }

  return { ok: true, pointCost: feature.pointCost, featureId: feature.id };
}

/**
 * Increment daily usage count after successful execution.
 */
export async function incrementDailyUsage(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { dailyUsageCount: { increment: 1 } },
  });
}
