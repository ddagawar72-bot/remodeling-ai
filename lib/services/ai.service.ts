import type { HouseMBTI, CompatibilityResult } from "@/types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const MBTI_SYSTEM_PROMPT = `당신은 인테리어 전문가이자 MBTI 분석가입니다.
사용자가 업로드한 실내 공간 사진을 분석하여 공간의 MBTI를 판단합니다.
반드시 아래 JSON 형식으로만 응답하세요. JSON 이외 텍스트는 절대 포함하지 마세요.

{
  "mbti": "INFP",
  "mbtiName": "감성 힐링 공간",
  "description": "이 공간의 MBTI와 성격 설명 (3문장)",
  "traits": ["특성1", "특성2", "특성3", "특성4"],
  "colorPalette": ["색상1", "색상2", "색상3"],
  "style": "현재 인테리어 스타일명"
}`;

const COMPATIBILITY_SYSTEM_PROMPT = `당신은 인테리어 전문가이자 MBTI 궁합 분석가입니다.
반드시 아래 JSON 형식으로만 응답하세요. JSON 이외 텍스트는 절대 포함하지 마세요.

{
  "score": 85,
  "grade": "환상의 궁합",
  "summary": "궁합 전체 요약 (2문장)",
  "pros": ["잘 맞는 점1", "잘 맞는 점2", "잘 맞는 점3"],
  "cons": ["안 맞는 점1", "안 맞는 점2"],
  "improvements": [
    { "area": "벽지", "current": "현재 상태", "suggestion": "구체적 개선 제안" },
    { "area": "조명", "current": "현재 상태", "suggestion": "구체적 개선 제안" },
    { "area": "가구 배치", "current": "현재 상태", "suggestion": "구체적 개선 제안" }
  ]
}`;

async function callOpenAI(systemPrompt: string, userContent: any[], timeoutSeconds: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-4o", max_tokens: 1000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }] }),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(`OpenAI API error ${res.status}: ${JSON.stringify(err)}`); }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() ?? "";
  } finally { clearTimeout(timer); }
}

export interface AiCallOptions {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  prompt?: string;
  timeoutSeconds?: number;
}

export async function analyzeHouseMBTI(options: AiCallOptions): Promise<HouseMBTI> {
  const { imageBase64, mimeType, timeoutSeconds = 30 } = options;
  const raw = await callOpenAI(MBTI_SYSTEM_PROMPT, [
    { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" } },
    { type: "text", text: "이 공간의 MBTI를 분석해주세요." },
  ], timeoutSeconds);
  return JSON.parse(raw) as HouseMBTI;
}

export async function analyzeCompatibility(houseMbti: string, userMbti: string, timeoutSeconds = 30): Promise<CompatibilityResult> {
  const raw = await callOpenAI(COMPATIBILITY_SYSTEM_PROMPT, [
    { type: "text", text: `집 MBTI: ${houseMbti}\n나의 MBTI: ${userMbti}\n궁합을 분석하고 인테리어 개선 방향을 제시해주세요.` },
  ], timeoutSeconds);
  return JSON.parse(raw) as CompatibilityResult;
}

export async function analyzeInterior(options: AiCallOptions): Promise<HouseMBTI> {
  return analyzeHouseMBTI(options);
}
