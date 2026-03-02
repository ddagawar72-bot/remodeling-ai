import type { InteriorAnalysis } from "@/types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `당신은 전문 인테리어 디자이너입니다. 
사용자가 업로드한 실내 공간 사진을 분석하여 아래 JSON 형식으로만 응답하세요.
절대 JSON 이외의 텍스트를 포함하지 마세요.

{
  "style": "현재 스타일 (예: 모던 미니멀, 북유럽, 클래식 등)",
  "summary": "공간 전반적 요약 (2-3문장)",
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "colorPalette": ["추천 색상 이름1", "추천 색상 이름2", "추천 색상 이름3"],
  "estimatedBudget": "예상 리모델링 예산 범위 (예: 500만원 ~ 1,500만원)",
  "recommendations": ["구체적 인테리어 제안1", "구체적 인테리어 제안2", "구체적 인테리어 제안3"]
}`;

export interface AiCallOptions {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  prompt?: string;
  timeoutSeconds?: number;
}

export async function analyzeInterior(
  options: AiCallOptions
): Promise<InteriorAnalysis> {
  const { imageBase64, mimeType, prompt, timeoutSeconds = 30 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: prompt ?? "이 인테리어 공간을 전문가적으로 분석해주세요.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI API error ${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // Strip possible markdown fences
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed: InteriorAnalysis = JSON.parse(clean);
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}
