# 우리집 리모델링 고민 — Next.js SaaS

AI 기반 인테리어 분석 서비스 · OpenAI GPT-4o Vision 사용

---

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.local.example .env.local
# → OPENAI_API_KEY, NEXTAUTH_SECRET 입력

# 3. DB 초기화
npm run db:push
npm run db:seed

# 4. 개발 서버
npm run dev
```

→ http://localhost:3000

---

## 기본 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| Admin | admin@remodeling.ai | admin1234! |

회원가입 시 **100pt 자동 지급** (분석 10회)

---

## 아키텍처 핵심

### AI 실행 보안 플로우 (`/api/feature/execute`)

```
요청 → 세션 검증 → 멱등성 키 중복 확인 → 실행 락
     → 이미지 서버사이드 검증 → Feature 활성 확인
     → 일일 한도 확인 → Atomic 포인트 차감 (DB 트랜잭션)
     → PENDING 로그 생성 → OpenAI API 호출 (timeout 30s)
     → SUCCESS 마킹 OR 실패 시 자동 포인트 환불
```

### 포인트 시스템 (`lib/services/point.service.ts`)

- `deductPoints()` — `prisma.$transaction()` 으로 원자적 차감
- `refundPoints()` — AI 실패 시 자동 호출
- `adminAdjustPoints()` — 어드민 수동 조정

### 보안

- 서버사이드 전용 AI 호출 (클라이언트에 API 키 노출 없음)
- `middleware.ts` RBAC 라우트 보호
- `idempotencyKey @unique` 중복 실행 차단
- `AbortController` 타임아웃 보호
- 이미지 크기·타입 서버사이드 재검증

---

## 배포 (Vercel)

```bash
# PostgreSQL로 전환
# prisma/schema.prisma → provider = "postgresql"

# 환경변수 설정
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=...
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...

# 배포
vercel --prod
```

---

## 기능 추가 방법

DB에 Feature 레코드 추가 후 `/api/feature/execute` 에서
`featureName` 분기 처리 — ai.service.ts에 새 함수 추가

```typescript
// 예: 스타일 추천 기능 추가
await db.feature.create({
  data: {
    name: "style_recommend",
    displayName: "스타일 추천",
    pointCost: 15,
    enabled: true,
    dailyLimit: 5,
  }
})
```
