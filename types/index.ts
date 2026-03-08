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
  mbti: string;           // 예: "INFP"
  mbtiName: string;       // 예: "감성 힐링 공간"
  description: string;   // 집 MBTI 설명
  traits: string[];       // 공간 특성 4가지
  colorPalette: string[]; // 어울리는 색상
  style: string;          // 인테리어 스타일
}

// 궁합 결과
export interface CompatibilityResult {
  score: number;           // 0~100점
  grade: string;           // 예: "환상의 궁합"
  summary: string;         // 궁합 요약
  pros: string[];          // 잘 맞는 점
  cons: string[];          // 안 맞는 점
  improvements: {
    area: string;          // 예: "벽지", "조명"
    current: string;       // 현재 상태
    suggestion: string;    // 개선 제안
  }[];
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
