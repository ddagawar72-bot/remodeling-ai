import type { Role, LogStatus, TxType } from "@prisma/client";

export type { Role, LogStatus, TxType };

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  points: number;
}

export interface ApiSuccess<T = unknown> { ok: true; data: T; }
export interface ApiError { ok: false; error: string; code?: string; }
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface ExecuteRequest {
  featureName: string;
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  prompt?: string;
  idempotencyKey: string;
}

export interface ExecuteResult {
  logId: string;
  analysis: HouseMBTI;
  pointsUsed: number;
  remainingPoints: number;
}

// 집 MBTI 분석 결과
export interface HouseMBTI {
  mbti: string;
  mbtiName: string;
  description: string;
  traits: string[];
  colorPalette: string[];
  style: string;
}

// 궁합 결과
export interface CompatibilityResult {
  score: number;
  grade: string;
  summary: string;
  pros: string[];
  cons: string[];
  improvements: {
    area: string;
    current: string;
    suggestion: string;
  }[];
}

// 운세 분석 결과 (사업운 / 자녀교육운 / 연애운)
export type LuckType = "business" | "education" | "love";

export interface LuckResult {
  luckType: LuckType;
  currentMbti: string;
  targetMbti: string;
  targetMbtiName: string;
  currentScore: number;
  afterScore: number;
  summary: string;
  improvements: {
    area: string;
    current: string;
    suggestion: string;
    reason: string;
  }[];
  tips: string[];
}

// 기존 호환성 유지
export type InteriorAnalysis = HouseMBTI;

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  points: number;
  dailyUsageCount: number;
  createdAt: string;
}

export interface FeatureRow {
  id: string;
  name: string;
  displayName: string;
  description: string;
  pointCost: number;
  enabled: boolean;
  dailyLimit: number;
  timeoutSeconds: number;
}

export interface LogRow {
  id: string;
  userId: string;
  userEmail: string;
  featureName: string;
  status: LogStatus;
  pointsUsed: number;
  createdAt: string;
  errorMsg: string | null;
}

export interface PointAdjustRequest {
  userId: string;
  amount: number;
  reason: string;
}
