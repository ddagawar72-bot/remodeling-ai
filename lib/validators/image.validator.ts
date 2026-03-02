const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ImageValidation {
  ok: boolean;
  error?: string;
  mimeType?: AllowedMime;
  base64?: string;
}

/**
 * Validate image from base64 data-URI string.
 * e.g. "data:image/jpeg;base64,/9j/..."
 */
export function validateImageDataUri(dataUri: string): ImageValidation {
  if (!dataUri || typeof dataUri !== "string") {
    return { ok: false, error: "이미지 데이터가 없습니다" };
  }

  const match = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "올바르지 않은 이미지 형식입니다" };
  }

  const mime = match[1] as AllowedMime;
  const base64 = match[2];

  if (!ALLOWED_MIME.includes(mime)) {
    return {
      ok: false,
      error: `지원하지 않는 형식입니다. (허용: ${ALLOWED_MIME.join(", ")})`,
    };
  }

  // Estimate size from base64 length
  const estimatedBytes = (base64.length * 3) / 4;
  if (estimatedBytes > MAX_BYTES) {
    return { ok: false, error: "이미지 크기가 10MB를 초과합니다" };
  }

  return { ok: true, mimeType: mime, base64 };
}
