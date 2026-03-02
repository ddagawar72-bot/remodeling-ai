import { db } from "@/lib/db";
import { TxType } from "@prisma/client";

interface DeductResult {
  success: boolean;
  remainingPoints: number;
  error?: string;
}

/**
 * Atomically deduct points from a user.
 * Returns false if insufficient balance.
 */
export async function deductPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<DeductResult> {
  try {
    const result = await db.$transaction(async (tx) => {
      // Lock the row with a fresh read inside the transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });

      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.points < amount) throw new Error("INSUFFICIENT_POINTS");

      const newBalance = user.points - amount;

      await tx.user.update({
        where: { id: userId },
        data: { points: newBalance },
      });

      await tx.pointTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: TxType.DEDUCT,
          reason,
          balanceAfter: newBalance,
        },
      });

      return newBalance;
    });

    return { success: true, remainingPoints: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "INSUFFICIENT_POINTS") {
      const user = await db.user.findUnique({ where: { id: userId }, select: { points: true } });
      return { success: false, remainingPoints: user?.points ?? 0, error: msg };
    }
    throw err;
  }
}

/**
 * Atomically refund points to a user (on AI failure).
 */
export async function refundPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<number> {
  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const newBalance = user.points + amount;

    await tx.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    await tx.pointTransaction.create({
      data: {
        userId,
        amount,
        type: TxType.REFUND,
        reason,
        balanceAfter: newBalance,
      },
    });

    return newBalance;
  });

  return result;
}

/**
 * Admin manual point adjustment.
 */
export async function adminAdjustPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<number> {
  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const newBalance = Math.max(0, user.points + amount);

    await tx.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    await tx.pointTransaction.create({
      data: {
        userId,
        amount,
        type: TxType.ADMIN_ADJUST,
        reason,
        balanceAfter: newBalance,
      },
    });

    return newBalance;
  });

  return result;
}
