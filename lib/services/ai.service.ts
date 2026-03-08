import type { HouseMBTI, CompatibilityResult, LuckResult, LuckType } from "@/types";

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

const LUCK_SYSTEM_PROMPT = `당신은 풍수지리와 인테리어를 결합한 전문가입니다.
공간의 MBTI를 분석하고 특정 운(사업운/자녀교육운/연애운)을 높이기 위한 인테리어 변경을 제안합니다.
반드시 아래 JSON 형식으로만 응답하세요. JSON 이외 텍스트는 절대 포함하지 마세요.

{
  "luckType": "business",
  "currentMbti": "ISTJ",
  "targetMbti": "ENTJ",
  "targetMbtiName": "성공을 부르는 리더십 공간",
  "currentScore": 45,
  "afterScore": 88,
  "summary": "현재 공간 분석과 변경 후 기대 효과 요약 (2문장)",
  "improvements": [
    {
      "area": "벽지",
      "current": "현재 상태 설명",
      "suggestion": "구체적인 색상/소재/패턴 변경 제안",
      "reason": "이 변경이 해당 운에 좋은 이유"
    },
    {
      "area": "바닥",
      "current": "현재 상태 설명",
      "suggestion": "구체적인 색상/소재 변경 제안",
      "reason": "이 변경이 해당 운에 좋은 이유"
    },
    {
      "area": "조명",
      "current": "현재 상태 설명",
      "suggestion": "구체적인 조명 변경 제안",
      "reason": "이 변경이 해당 운에 좋은 이유"
    },
    {
      "area": "가구 배치",
      "current": "현재 상태 설명",
      "suggestion": "구체적인 배치/색상 변경 제안",
      "reason": "이 변경이 해당 운에 좋은 이유"
    },
    {
      "area": "소품/인테리어",
      "current": "현재 상태 설명",
      "suggestion": "추가하면 좋은 소품/식물/장식 제안",
      "reason": "이 변경이 해당 운에 좋은 이유"
    }
  ],
  "tips": ["즉시 실천할 수 있는 팁1", "팁2", "팁3"]
}

운별 핵심 MBTI:
- 사업운(business): ENTJ, ESTJ → 강한 리더십, 붉은 계열/골드, 넓은 공간, 정돈된 책상
- 자녀교육운(education): INTJ, INFJ → 집중력, 초록/파랑 계열, 독서 공간, 밝은 조명
- 연애운(love): ENFP, ISFP → 따뜻한 감성, 핑크/베이지/코랄 계열, 꽃/식물, 부드러운 조명`;

async function callOpenAI(systemPrompt: string, userContent: any[], timeoutSeconds: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1500,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
      }),
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

// 집 MBTI 분석
export async function analyzeHouseMBTI(options: AiCallOptions): Promise<HouseMBTI> {
  const { imageBase64, mimeType, timeoutSeconds = 30 } = options;
  const raw = await callOpenAI(MBTI_SYSTEM_PROMPT, [
    { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" } },
    { type: "text", text: "이 공간의 MBTI를 분석해주세요." },
  ], timeoutSeconds);
  return JSON.parse(raw) as HouseMBTI;
}

// 궁합 분석
export async function analyzeCompatibility(options: { houseMbti: string; userMbti: string }, timeoutSeconds = 30): Promise<CompatibilityResult> {
  const { houseMbti, userMbti } = options;
  const raw = await callOpenAI(COMPATIBILITY_SYSTEM_PROMPT, [
    { type: "text", text: `집 MBTI: ${houseMbti}\n나의 MBTI: ${userMbti}\n궁합을 분석하고 인테리어 개선 방향을 제시해주세요.` },
  ], timeoutSeconds);
  return JSON.parse(raw) as CompatibilityResult;
}

// 운세 분석 (사진 + 운 종류)
export async function analyzeLuck(options: AiCallOptions & { luckType: LuckType; houseMbti: string }): Promise<LuckResult> {
  const { imageBase64, mimeType, luckType, houseMbti, timeoutSeconds = 40 } = options;
  const luckLabel = luckType === "business" ? "사업운" : luckType === "education" ? "자녀교육운" : "연애운";
  const raw = await callOpenAI(LUCK_SYSTEM_PROMPT, [
    { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" } },
    { type: "text", text: `현재 집 MBTI: ${houseMbti}\n분석 목적: ${luckLabel} 향상\nluckType 필드값: "${luckType}"\n이 공간을 ${luckLabel}이 좋아지도록 인테리어 변경 제안을 해주세요.` },
  ], timeoutSeconds);
  return JSON.parse(raw) as LuckResult;
}

// 기존 호환성 유지
export async function analyzeInterior(options: AiCallOptions): Promise<HouseMBTI> {
  return analyzeHouseMBTI(options);
}
