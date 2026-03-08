import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeCompatibility } from "@/lib/services/ai.service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { houseMbti, userMbti } = await req.json();
  if (!houseMbti || !userMbti) {
    return NextResponse.json({ ok: false, error: "MBTI 정보가 필요합니다" }, { status: 400 });
  }

  try {
    const result = await analyzeCompatibility({ houseMbti, userMbti });
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[compatibility]", err);
    return NextResponse.json({ ok: false, error: "궁합 분석 중 오류가 발생했습니다" }, { status: 500 });
  }
}
