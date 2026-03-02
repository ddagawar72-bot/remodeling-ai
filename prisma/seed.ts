import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Default features
  await db.feature.upsert({
    where: { name: "space_analyze" },
    update: {},
    create: {
      name: "space_analyze",
      displayName: "AI 공간 분석",
      description: "인테리어 사진을 업로드하면 스타일, 개선점, 예산을 분석합니다",
      pointCost: 10,
      enabled: true,
      dailyLimit: 10,
      timeoutSeconds: 30,
    },
  });

  // Default admin account
  const hash = await bcrypt.hash("admin1234!", 10);
  await db.user.upsert({
    where: { email: "admin@remodeling.ai" },
    update: {},
    create: {
      email: "admin@remodeling.ai",
      passwordHash: hash,
      name: "관리자",
      role: Role.ADMIN,
      points: 99999,
    },
  });

  console.log("✅ Seed complete");
  console.log("  Admin: admin@remodeling.ai / admin1234!");
  console.log("  Feature: space_analyze (10pt / 10회/일)");
}

main().finally(() => db.$disconnect());
