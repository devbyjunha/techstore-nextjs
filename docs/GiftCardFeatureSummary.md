# TechStore – 기프트카드 기능 개발 문서

## 📖 개요
TechStore에 기프트카드 전체 워크플로우를 구현했습니다.
- **등록:** 마이페이지에서 카드 번호 등록
- **조회:** 총 잔액 및 카드별 잔액 확인
- **차감:** 결제 시 포인트 차감
- 모든 기능은 Talon.One을 기반으로 동작하며, Integration API를 우선 호출하고 실패 시 Management API로 폴백합니다.

## 🗂️ 변경된 파일
| 경로 | 설명 |
|------|------|
| `src/lib/talon/gift-cards.ts` | 핵심 API 래퍼 – 잔액 조회, 프로필 연결, 카드 등록, 포인트 차감(PoC 시뮬레이션 포함) |
| `src/app/api/v1/gift-cards/route.ts` | GET → 카드 목록 조회; POST → 카드 등록 |
| `src/app/api/v1/gift-cards/redeem/route.ts` | POST → 결제 시 잔액 차감 |
| `src/components/mypage/GiftCardPanel.tsx` | UI 패널 – 총 잔액, 카드 목록, 등록 폼, 메시지 표시 |
| `src/lib/talon/__tests__/gift-cards.test.ts` | 단위 테스트 – 매핑, 프로필 연결, 유효성 검사, 차감 엣지케이스 |
| `package.json` | `dev` 스크립트를 `next dev --webpack`으로 변경 (Turbopack 폰트 오류 방지) |
| `.env.local` | Talon.One 인증 정보 (`BASE_URL`, `API_KEY`, `MANAGEMENT_API_KEY`, `GIFT_CARD_PROGRAM_ID`) |

## 🔧 기술 상세

### 백엔드 로직
- **잔액 조회:** `getGiftCard`는 우선 **Integration API** `/v1/loyalty_programs/{id}/cards/{code}/balances`를 호출합니다. 404 등 실패 시 **Management API**로 폴백합니다.
- **프로필 연결:** `POST /v2/loyalty_programs/{id}/cards/{code}/link_profile`에 `{ integrationId: profileId }`를 전달합니다. 권한 오류가 발생하면 먼저 `updateCustomerProfileAttributes`로 프로필 존재를 보장한 뒤 재시도합니다.
- **포인트 차감:** `PUT /v1/loyalty_programs/{id}/cards/{code}/deduct_points`를 호출합니다. PoC 환경에서 `401/403` 오류 발생 시 시뮬레이션 값(`max(0, 현재잔액 - 차감액)`)을 반환하여 결제 흐름이 끊기지 않도록 합니다.
- **데이터 매핑:** `mapLoyaltyCard`는 `ledger` 및 `balance` 필드를 모두 읽어 `current`, `pending`, `spent` 포인트를 계산하고 `linked` 상태를 판별합니다.

### 프론트엔드 UI
- 입력 placeholder: **`(예: MXNM-GIFT-XXXX-XXXX)`**
- 안내 문구: **`보유하신 기프트카드 번호(예: MXNM-GIFT-XXXX-XXXX)를 위에 입력해 등록하세요.`**
- 총 잔액(KRW), 카드별 상태 배지, 오류/안내 메시지 표시
- 새로고침 버튼(`RefreshCw` 아이콘)으로 카드 데이터 재로드

### 테스트
```bash
npm test -- src/lib/talon/__tests__/gift-cards.test.ts
```
4개 테스트 모두 통과:
- 로열티 카드 데이터 매핑
- 미연결 프로필 감지
- 카드 코드 형식 유효성 검사
- 0 이하 차감 금액 거부

## 🚀 로컬 실행 방법
```bash
# 의존성 설치
npm install

# 개발 서버 시작 (Webpack 모드)
npm run dev
# → http://localhost:3000

# API 호출 예시
curl http://localhost:3000/api/v1/gift-cards?profileId=your.email@example.com
curl -X POST http://localhost:3000/api/v1/gift-cards \
  -H "Content-Type: application/json" \
  -d '{"profileId":"your.email@example.com","code":"MXNM-GIFT-U0JZ-OJC3"}'
```

## 🐞 알려진 이슈 및 해결 방법
- **포인트 차감 권한:** 현재 PoC 환경에서는 Management API의 `deduct_points` 권한이 없어 시뮬레이션 폴백을 사용합니다. 실 운영 환경에서는 해당 권한을 발급받아야 합니다.
- **Turbopack 폰트 오류:** `next dev --webpack`으로 Turbopack을 비활성화해 해결했습니다. 향후 Turbopack으로 전환 시 Google Fonts 접근 가능 여부를 확인하거나 로컬 폰트를 사용해야 합니다.
- **VS Code 무한 로딩:** `.sf` 메타데이터 폴더 손상이 원인이었습니다. 해당 폴더를 삭제하면 해결됩니다.

## 📚 향후 개선 사항
1. Management API에 `deduct_points` 권한 요청 – 실제 포인트 차감 구현
2. 기프트카드 데이터 SSR(서버사이드 렌더링) 적용 – SEO 및 성능 개선
3. UI: 잔액 새로고침 버튼에 낙관적 UI 업데이트 추가
4. 단위 테스트 확장 – 오류 처리 엣지케이스 및 통합 테스트 추가

---

*Antigravity (AI 코딩 어시스턴트)가 2026‑10‑22에 작성했습니다.*
