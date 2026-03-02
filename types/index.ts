import type { Role, LogStatus, TxType } from "@prisma/client";

export type { Role, LogStatus, TxType };

// ─── Auth ────────────────────────────────────
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  points: number;
}

// ─── API Response ────────────────────────────
export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
}
export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Feature Execution ───────────────────────
export interface ExecuteRequest {
  featureName: string;
  imageBase64: string;         // data:image/... base64
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  prompt?: string;
  idempotencyKey: string;
}

export interface ExecuteResult {
  logId: string;
  analysis: InteriorAnalysis;
  pointsUsed: number;
  remainingPoints: number;
}

export interface InteriorAnalysis {
  style: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  colorPalette: string[];
  estimatedBudget: string;
  recommendations: string[];
}

// ─── Admin ───────────────────────────────────
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
