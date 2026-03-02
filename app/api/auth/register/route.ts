import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { TxType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { email, name, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "이메일과 비밀번호를 입력하세요" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "이미 사용 중인 이메일입니다" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        passwordHash,
        points: 100, // 가입 보너스
      },
    });
    // 가입 보너스 트랜잭션 기록
    await tx.pointTransaction.create({
      data: {
        userId: u.id,
        amount: 100,
        type: TxType.SIGNUP_BONUS,
        reason: "회원가입 보너스",
        balanceAfter: 100,
      },
    });
    return u;
  });

  return NextResponse.json({ ok: true, data: { id: user.id, email: user.email } });
}
