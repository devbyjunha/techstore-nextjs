# TechStore × Talon.One PoC 정리

> **Notion에 넣을 때:** 이 파일을 채팅/코드블록에 붙여넣지 마세요.  
> Notion → **Import** → **Markdown** → `TALON-ONE-POC-NOTION.md` 업로드  
> (또는 `TALON-ONE-POC-NOTION.html` HTML Import)  
> 자세한 방법: `TALON-ONE-POC-NOTION-IMPORT.md` 참고

> **프로젝트:** TechStore (Next.js 데모 쇼핑몰)  
> **목적:** Braze(발급·CRM)와 역할을 분리한 상태에서 Talon.One 프로모션·쿠폰·세션 라이프사이클 PoC  
> **환경:** Talon.One Live Application `TechStore` (KRW)  
> **작성 기준:** 2026-08-06

---

## 1. PoC 한 줄 요약

장바구니/체크아웃에서 **Talon.One Integration API**로 세션을 평가하고, Dashboard에 정의한 캠페인(C1~C3) 규칙에 따라 **할인·쿠폰·멤버십 보너스**를 실시간 반영한다. 주문 완료/취소 시 세션을 **closed / cancelled**로 마감한다.

---

## 2. 역할 분리 (Braze vs Talon.One)

| 레이어 | 담당 | PoC에서 한 일 |
|--------|------|----------------|
| **Braze** | 쿠폰 발급(Connected Content), 메시징, 배너, `external_id` | 기존 유지. 로그인 시 `changeUser(email)` |
| **Talon.One** | 할인 규칙, 쿠폰 검증/적용, 로열티, effects | C1~C3 캠페인 + 세션 API 연동 |
| **TechStore** | UI, BFF API, 주문 상태 | `/api/v1/talon/session` 프록시, 카트/체크아웃 UI |

> **핵심:** 목록(SALE 뱃지) 할인 ≠ Talon 할인. PoC에서는 **카탈로그는 정가만 표시**하고, **할인은 장바구니에서 Talon이 평가**하도록 통일했다.

---

## 3. Talon.One Dashboard 구성

### 3.1 Application

| 항목 | 값 |
|------|-----|
| Application | TechStore (Live) |
| Currency | KRW |
| Application ID | `4` (URL `/applications/4/...`) |
| Base URL | `https://maxonomy.europe-west1.talon.one` |
| Integration API Key | Standard integration (No) — 서버에서 직접 호출 |

### 3.2 Custom Attribute

**경로:** Tools → Attributes (앱 Settings의 Custom Attributes가 아님)

| Entity | API name | Type | Picklist |
|--------|----------|------|----------|
| Customer Profile | `MembershipTier` | String | `GOLD`, `SILVER` |

### 3.3 Loyalty Program (Profile-based)

| 항목 | 값 |
|------|-----|
| Name | TechStore Points |
| Type | Profile-based |
| Subledgers | Off |
| Program ID | `5` (URL `/loyalty_programs/5/...`) |
| Time zone | Asia/Seoul |

> Loyalty earn/burn Rule은 프로그램만 생성. **적립/사용 Rule은 2차**로 진행 가능.

### 3.4 Campaigns (Running)

| ID | Campaign | Type | Condition | Effect |
|----|----------|------|-----------|--------|
| **C1** | Cart Threshold 10% | Standard | `Cart Items Total > 50,000` | 10% discount (`[Session.Total] * 10%`) |
| **C2** | Coupon WELCOME10 | Standard + **Coupons** | Coupon code is valid | 10% discount |
| **C3** | GOLD Member Bonus | Standard | `MembershipTier == GOLD` | 5% discount |

**C2 쿠폰**

- Type: **Universal code**
- Code: `WELCOME10`
- batch ID: Dashboard 관리용 (앱/API에 넣지 않음)

**Standard vs Item campaign**

- PoC는 **Standard campaign** 사용 (세션/프로필/쿠폰 기준)
- Item campaign은 SKU 라인 할인용 → Later

---

## 4. TechStore 구현 요약

### 4.1 환경 변수 (`.env.local` — Git 커밋 금지)

```bash
TALON_ONE_BASE_URL=https://maxonomy.europe-west1.talon.one
TALON_ONE_API_KEY=<Integration API Key>
TALON_ONE_APPLICATION_ID=4
TALON_ONE_LOYALTY_PROGRAM_ID=5
```

`.env.example`에는 **키 이름만** 유지.

### 4.2 API (BFF)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/talon/session` | 세션 open/update/close/cancel (`state` 필드) |

**Talon 호출:** `PUT /v2/customer_sessions/{sessionId}`  
**인증:** `Authorization: ApiKey-v1 {key}`

**Request 핵심 필드**

```json
{
  "sessionId": "cart_xxxxx",
  "profileId": "user@example.com",
  "state": "open",
  "cartItems": [{ "sku", "name", "quantity", "price", "category" }],
  "couponCodes": ["WELCOME10"],
  "membershipTier": "GOLD"
}
```

> `couponCodes: []`를 **항상 전송** — 제거 시에도 빈 배열로 보내야 세션에서 쿠폰이 해제됨.

**Response (정규화)**

- `subtotal`, `totalDiscount`, `total`
- `effects[]` (할인 내역)
- `coupons[]` (accept/reject)

### 4.3 profileId 매핑 (Braze 연동)

| 우선순위 | profileId |
|----------|-----------|
| 1 | Braze `getUserId()` / `changeUser` 값 |
| 2 | 로그인 email |
| 3 | `guest_{cartId}` |

로그인 시 Braze `external_id`와 Talon `profileId`를 **동일 키**로 맞춤.

### 4.4 TechStore에서 Talon.One API 호출 영역

> **브라우저 → Talon 직접 호출 없음.**  
> 프론트는 BFF(`POST /api/v1/talon/session`)만 호출하고, **서버(`src/lib/talon/client.ts`)만** Integration API를 친다.

#### 호출 흐름

```
[장바구니 / 체크아웃 UI]          [주문 완료 / 취소]
  cart/page.tsx                    StoreContext
  checkout/page.tsx                  │
        │                            │
        ▼                            ▼
  requestTalonSession()      finalizeTalonSession()
        │                     (state: closed|cancelled)
        └──────────┬─────────────────┘
                   ▼
         src/lib/talon/browser.ts
                   │  fetch POST
                   ▼
         POST /api/v1/talon/session
         src/app/api/v1/talon/session/route.ts
                   │
                   ▼
         src/lib/talon/client.ts  ← ★ Talon.One 실호출 유일 지점
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
 PUT /v2/customer_profiles/{id}   PUT /v2/customer_sessions/{id}
 (MembershipTier 있을 때만)       (항상 — open / closed / cancelled)
       │
       Authorization: ApiKey-v1 {TALON_ONE_API_KEY}
```

#### UI·비즈니스 트리거 (언제 호출되나)

| 영역 | 파일 | 함수 | 시점 | Talon `state` |
|------|------|------|------|---------------|
| 장바구니 | `src/app/cart/page.tsx` | `requestTalonSession` | 카트·유저·적용 쿠폰 변경 시 (`useEffect` → `evaluateCart`) | `open` |
| 장바구니 | 동일 | 동일 | 쿠폰 적용/제거 (단일 evaluation 경로) | `open` |
| 체크아웃 | `src/app/checkout/page.tsx` | `requestTalonSession` | 체크아웃 진입·카트 재평가 | `open` |
| 주문 완료 | `src/context/StoreContext.tsx` | `finalizeTalonSession` | `placeOrder` 직전 | `closed` |
| 주문 취소 | `src/context/StoreContext.tsx` | `finalizeTalonSession` | `cancelOrder` | `cancelled` |

#### 레이어별 역할

| 레이어 | 경로 | Talon 직접 호출? | 역할 |
|--------|------|------------------|------|
| Browser helper | `src/lib/talon/browser.ts` | ❌ BFF만 | profileId 해석, cart 매핑, `fetch('/api/v1/talon/session')` |
| BFF Route | `src/app/api/v1/talon/session/route.ts` | ❌ (client 위임) | 요청 검증 → `updateCustomerSession` → effects 정규화 |
| Talon client | `src/lib/talon/client.ts` | ✅ **유일** | Integration API `PUT` (session + optional profile) |
| Config | `src/lib/talon/config.ts` | — | `TALON_ONE_*` env |
| Mappers | `map-cart.ts`, `map-effects.ts` | ❌ | cart ↔ Talon items, effects → UI quote |
| UI (표시만) | `TalonDiscountAccordion.tsx` | ❌ | 할인 아코디언 렌더 (API 호출 없음) |

#### Talon Integration API 엔드포인트 (서버 outbound)

| Method | Talon Path | 호출 조건 | 구현 |
|--------|------------|-----------|------|
| `PUT` | `/v2/customer_sessions/{sessionId}` | 모든 세션 평가·마감 | `updateCustomerSession` |
| `PUT` | `/v2/customer_profiles/{profileId}` | `membershipTier`가 있을 때 선행 | `updateCustomerProfileAttributes` |

> PoC에서 **Management API는 호출하지 않음.** (Import·쿠폰 생성 등은 §12·§13)

#### 관련 파일 트리

```
src/lib/talon/
  browser.ts      ← 프론트 → BFF
  client.ts       ← BFF → Talon.One (실호출)
  config.ts / types.ts / map-cart.ts / map-effects.ts
src/app/api/v1/talon/session/route.ts
src/app/cart/page.tsx
src/app/checkout/page.tsx
src/context/StoreContext.tsx
src/components/talon/TalonDiscountAccordion.tsx  ← 표시만
```

### 4.5 프론트 UX (PoC)

| 영역 | 동작 |
|------|------|
| 할인 표시 | 무신사 스타일 **아코디언** — 접으면 총 할인액, 펼치면 캠페인별 내역 |
| 할인 0원 | `0원 할인` 항상 표시 |
| 쿠폰 | 입력 → 적용 / 제거. session 1회 호출 |
| 카탈로그 | SALE 뱃지·취소선 제거 (Talon과 혼동 방지) |
| 저가 테스트 | 5만원 미만 상품 4개 + `/products?under=50000` 필터 |

---

## 5. 세션 라이프사이클

| 앱 `state` | Dashboard Event | 시점 |
|------------|-----------------|------|
| `open` | `talon_session_updated` | 카트 진입, 수량 변경, 쿠폰 적용 |
| `closed` | `talon_session_closed` | 주문 완료 (`placeOrder`) |
| `cancelled` | `talon_session_revoked` | 주문 취소 |

**검증 방법**

1. Network → `POST /api/v1/talon/session` payload의 `state` 확인
2. Dashboard → Sessions → `integrationId` (= `cart_…`) 검색
3. open → closed → (취소 시) revoked 이벤트 순서 확인

---

## 6. 테스트 시나리오

### C1 — 장바구니 5만원 이상 10% (로그인 불필요)

- [ ] 5만원 **미만** 저가 상품만 담기 → 할인 `0원`
- [ ] 5만원 **초과** 상품 담기 → 약 10% 할인
- [ ] Network `profileId` = `guest_cart_…`

### C2 — 쿠폰 WELCOME10 (로그인 불필요)

- [ ] 5만원 이상 카트 + `WELCOME10` 적용 → 추가 할인
- [ ] 잘못된 코드 → 거절 토스트, 할인 유지(C1만)
- [ ] **제거** 클릭 → C2 할인만 빠지고 C1 유지
- [ ] session API **1회** 호출 (성공/실패 모두)

### C3 — GOLD 멤버 5% (로그인 필요)

- [ ] `/login` → GOLD 선택
- [ ] `braze.getUser().getUserId()` = email
- [ ] 카트 할인에 GOLD 보너스 effect 추가
- [ ] SILVER 로그인 → C3 할인 없음

### 풀 시나리오 (데모 15분)

1. GOLD 로그인
2. 5만원 이상 담기 → C1 + C3
3. `WELCOME10` → C1 + C2 + C3
4. 주문 완료 → `talon_session_closed`
5. (선택) 주문 취소 → `talon_session_revoked`

---

## 7. Network 디버깅 치트시트

**게스트 profileId 확인**

1. DevTools → Network → `session`
2. Request Payload:
   - `sessionId`: `cart_xxxxx`
   - `profileId`: `guest_cart_xxxxx` (비로그인) / email (로그인)

**할인 effects 확인**

- Response → `effects`, `totalDiscount`, `coupons`

---

## 8. 설계 결정 & 학습 포인트

### 8.1 Headless 프로모션 엔진

- **Backend/BFF:** session 평가, effects 정규화, close/cancel
- **Dashboard:** 캠페인·쿠폰 Rule (마케팅/운영)
- **Frontend:** 기존 카트/체크아웃에 **금액·아코디언**만 추가 — Talon 브랜딩은 PoC용으로 최소화 가능

### 8.2 Braze와 ID 정합

- Braze SDK에만 ID가 남고 UI는 로그아웃 → Talon은 `guest_`로 평가
- **로그인 + `changeUser`** 후 카트 재평가로 profile 통일

### 8.3 구현 중 이슈 & 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| 쿠폰 API 3회 호출 | Apply + useEffect + addToast 재렌더 | 단일 evaluation 경로 + skip ref |
| 쿠폰 제거 후 할인 유지 | `couponCodes` 필드 미전송 | 항상 `couponCodes: []` 전송 |
| 저가 상품 안 보임 | `localStorage` 구 카탈로그 | defaults merge + image sync |
| 상품 이미지 깨짐 | Unsplash 404 URL | URL 교체 |
| Attributes 메뉴 | 앱 Settings vs Account Tools | **Tools → Attributes** |

---

## 9. PoC 완료 / 미완료

### ✅ 완료

- [x] Application, API Key, KRW
- [x] Attribute `MembershipTier`
- [x] Campaign C1, C2, C3 Running
- [x] Universal coupon `WELCOME10`
- [x] Loyalty program 생성 (Profile-based)
- [x] `/api/v1/talon/session` BFF
- [x] 카트/체크아웃 할인 UI (아코디언)
- [x] 쿠폰 적용/제거
- [x] Braze profileId 연동
- [x] Session close / cancel
- [x] C1~C3 + 세션 라이프사이클 수동 검증

### ⏳ Later (2차)

- [ ] Loyalty earn/burn Rule + UI
- [ ] Braze 발급 코드 ↔ Talon Coupon Create API 통합
- [ ] Free item / bundle 캠페인
- [ ] 운영 UI에서 Talon 문구 제거 (할인 금액만 표시)
- [ ] (실도입) 레거시 쿠폰·로열티·프로필 Import — §13 참고

---

## 10. 참고 링크 & 문서

| 리소스 | 위치 |
|--------|------|
| 상세 기술 가이드 | `techstore-nextjs/docs/TALON-ONE-POC.md` |
| 프로젝트 아키텍처 | `techstore-nextjs/docs/PROJECT.md` |
| Braze 배너 PoC | `techstore-nextjs/docs/BRAZE-BANNERS.md` |
| Talon Integration API | https://docs.talon.one/docs/dev/integration-api/overview |
| Talon Management API | https://docs.talon.one/docs/dev/management-api/overview |
| API 비교·Import 가이드 | 이 문서 §12, §13 |
| Talon Dashboard | Campaign Manager → TechStore Application |

---

## 11. 데모 스크립트 (발표용)

> "TechStore는 Braze로 쿠폰을 **발급**하고, Talon.One으로 **적용 규칙**을 관리합니다."

1. **5만원 미만** 카트 → 할인 0원 (C1 미적용)
2. **고가 상품** 추가 → C1 10% 자동 할인 (아코디언 펼쳐 캠페인 ID 확인)
3. **`WELCOME10`** 적용 → C2 스택
4. **GOLD 로그인** → C3 추가
5. **주문 완료** → Dashboard Sessions에서 `talon_session_closed`
6. (선택) **주문 취소** → `talon_session_revoked`

---

## 12. Integration API vs Management API

> PoC는 **Integration API만** 사용했다. (호출 위치는 **§4.4**)  
> 라이선스 고객의 **초기 Import·백오피스**는 주로 **Management API**(또는 Campaign Manager UI)다.

### 12.1 한눈에 보는 역할 도식

```
┌─────────────────┐     Integration API      ┌──────────────────────┐
│  쇼핑몰 / BFF    │ ───────────────────────► │  Talon.One Engine     │
│  (TechStore)     │  실시간 세션·프로필·효과   │  (할인 평가)          │
└─────────────────┘  ApiKey-v1               └──────────────────────┘
                                                      ▲
┌─────────────────┐     Management API               │
│  백오피스 / 배치  │ ───────────────────────► │  Campaign Manager    │
│  CRM / 마이그    │  쿠폰·로열티 Import, 캠페인 │  (설정·Import)       │
└─────────────────┘  ManagementKey-v1        └──────────────────────┘
```

| | **Integration API** | **Management API** |
|---|---|---|
| **한 줄** | 고객·카트 실시간 연동 | Campaign Manager를 코드로 |
| **주요 용도** | 세션 평가, 쿠폰 적용, 주문 close | 쿠폰/로열티 Import, 캠페인·속성 관리 |
| **호출 주체** | 쇼핑몰 BFF, 체크아웃 | 배치 잡, 어드민, 마이그레이션 |
| **인증** | `ApiKey-v1 {key}` | `ManagementKey-v1 {key}` |
| **부하·SLA** | 실시간·고부하 (계약 SLA 대상) | 백오피스 (~3 req/s), SLA 비대상이 일반적 |
| **PoC에서** | ✅ `/api/v1/talon/session` | ❌ 미사용 |

### 12.2 무엇을 어느 API로 하나

| 작업 | API | 비고 |
|------|-----|------|
| 장바구니 할인 평가 | **Integration** | `PUT /v2/customer_sessions/{id}` |
| 주문 완료 / 취소 | **Integration** | `state: closed` / `cancelled` |
| 고객 프로필 속성 (`MembershipTier` 등) | **Integration** | `PUT /v2/customer_profiles/{id}` |
| 과거 주문(히스토리) 적재 | **Integration** | closed session으로 배치 |
| 이미 사용된 쿠폰 redeemed 마킹 | **Integration** | closed session + `couponCodes` |
| 레거시 쿠폰 CSV Import | **Management** | `.../import_coupons` |
| 로열티 포인트 / 카드 Import | **Management** | `import_points` / `import_cards` |
| 쿠폰 대량 생성 (발급 연동) | **Management** | `POST .../coupons` |
| Attribute / Collection Import | **Management** | Tools·Collections |
| 캠페인 규칙 설계 | **Dashboard (또는 Management)** | 레거시 규칙 1:1 자동 이관 없음 |

### 12.3 아키텍처 흐름 (도입 시)

```
[레거시 Incentive DB]
        │
        ├─ 쿠폰 CSV ──────────► Management API (import_coupons)
        ├─ 포인트/카드 ────────► Management API (import_points / cards)
        └─ 프로필·과거주문 ────► Integration API (profiles / closed sessions)
                                      │
[Campaign Manager] ◄── 규칙 재설계 ───┘
        │
        ▼
[쇼핑몰 BFF] ── Integration API ──► 실시간 할인·쿠폰·로열티
```

> **주의:** Management API를 카트/체크아웃 경로에 쓰지 말 것. 실시간 평가는 항상 Integration API.

---

## 13. 실제 도입 시 초기 Import / 마이그레이션

> PoC(C1~C3)는 **그린필드**라 Import가 없어도 된다.  
> 기존 Incentive·쿠폰·로열티를 **이어 쓰는 Go-live**라면 아래가 검토 대상이다.

### 13.1 PoC vs 라이선스 고객

| | **PoC (현재)** | **라이선스 고객 초기 세팅** |
|---|---|---|
| 캠페인 | C1~C3 Dashboard 수동 생성 | 비즈니스 규칙으로 재설계·생성 |
| 기존 쿠폰/바우처 | Universal `WELCOME10`만 | 레거시 코드 **bulk import** |
| 로열티 잔액 | 프로그램만 생성 (earn/burn 미구현) | 포인트/카드 **잔액 import** |
| 고객·구매 이력 | 세션 평가만 | 타겟팅용 프로필·과거 session 적재 |

### 13.2 Import 대상과 API

| 데이터 | 필요 시나리오 | API / 경로 | 방식 |
|--------|---------------|------------|------|
| **쿠폰 코드** | 기존 바우처를 Talon에서 계속 사용 | Management `import_coupons` 또는 UI | CSV |
| **로열티 포인트** | 기존 적립금 이전 | Management `import_points` 또는 UI | CSV |
| **로열티 카드** | 카드 기반 프로그램 | Management `import_cards` 또는 UI | CSV |
| **Customer Profile** | 멤버십·세그먼트 속성 | Integration `customer_profiles` | 배치 PUT |
| **과거 주문** | 누적 구매·예산·타겟팅 | Integration `customer_sessions` (`closed`) | 배치 PUT |

공식 가이드:
- [Import coupons](https://docs.talon.one/docs/dev/tutorials/import-coupon-codes)
- [Import loyalty data](https://docs.talon.one/docs/dev/tutorials/import-loyalty-data)
- [Import customer data](https://docs.talon.one/docs/dev/tutorials/import-customer-data)

### 13.3 “자사 Incentive 전체 Migration”의 범위

| 이관 가능 | 재설계 필요 |
|-----------|-------------|
| 쿠폰 코드·유효기간·사용 한도 | 프로모션 **규칙 엔진 로직** (1:1 자동 이관 없음) |
| 로열티 잔액·카드 | 캠페인 Condition / Effect 재정의 |
| 프로필 속성·과거 주문 실적 | 예산·스택·우선순위 정책 |

### 13.4 도입 초기 체크리스트

- [ ] Application / Currency / Attributes / Loyalty Program 정의
- [ ] 캠페인·룰을 Campaign Manager에서 재구성
- [ ] (필요 시) 레거시 쿠폰 CSV → `import_coupons`
- [ ] (필요 시) 이미 사용된 쿠폰 → Integration closed session으로 redeemed 마킹
- [ ] (필요 시) 로열티 `import_points` / `import_cards`
- [ ] (필요 시) 프로필·과거 주문 배치 (Integration API)
- [ ] BFF에서 Integration API로 실시간 연동 (PoC와 동일 레이어)
- [ ] Management Key / Integration Key 권한·보관 분리

### 13.5 PoC와의 관계 (한 줄)

**실시간 할인 = Integration API (PoC 범위).**  
**초기 데이터 Import = Management API + (프로필/이력은) Integration API 배치.**  
레거시 규칙 엔진은 Import가 아니라 **Talon Campaign으로 재설계**한다.

---

## 14. 참고 링크 (API·Import)

| 리소스 | URL |
|--------|-----|
| Integration API overview | https://docs.talon.one/docs/dev/integration-api/overview |
| Management API overview | https://docs.talon.one/docs/dev/management-api/overview |
| Import coupons | https://docs.talon.one/docs/dev/tutorials/import-coupon-codes |
| Import loyalty data | https://docs.talon.one/docs/dev/tutorials/import-loyalty-data |
| Import customer data | https://docs.talon.one/docs/dev/tutorials/import-customer-data |

---

*TechStore Next.js PoC — Talon.One Integration*
