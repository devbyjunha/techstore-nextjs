# Talon.One PoC 가이드 (TechStore)

Braze(발급·메시징) + Talon.One(규칙·적용·적립) 역할 분리 PoC입니다.  
이 문서는 **Dashboard 설정**, **캠페인 규칙**, **API 설계**, **구현 체크리스트**를 한곳에 모았습니다.

**관련 문서:** [PROJECT.md](./PROJECT.md) · [BRAZE-BANNERS.md](./BRAZE-BANNERS.md)

---

## 1. PoC 범위

| Priority | 기능 | 데모 포인트 |
|----------|------|-------------|
| Must | Cart session evaluation | 장바구니 합계에 실시간 할인 반영 |
| Must | Coupon redemption | Braze 발급 코드 → Talon 검증·적용 |
| Must | Session closeout | 주문 확정 시 session `closed` |
| Should | Loyalty earn/burn | 결제 적립 + 포인트 사용 할인 |
| Later | Free item / bundle | 노트북 구매 시 액세서리 무료 등 |

**역할 분리**

| 레이어 | 담당 |
|--------|------|
| Braze | 쿠폰 발급(Connected Content), 캠페인 메시지, 배너 |
| Talon.One | 할인 규칙, 쿠폰 검증, 로열티, effects |
| TechStore | 카트/체크아웃 UI, Integration API 프록시, 주문 상태 |

---

## 2. Talon.One Dashboard 설정 (단계별)

> Dashboard UI 문구는 계정/버전에 따라 약간 다를 수 있습니다.  
> 막히는 화면이 있으면 스크린샷이나 메뉴 경로를 알려주면 이어서 가이드합니다.

### Step A — Application & API Key

1. [Talon.One Campaign Manager](https://www.talon.one/) 로그인
2. **Account → Applications → Create Application**
   - Name: `TechStore PoC`
   - Currency: `KRW` (상품 가격이 원 단위)
3. Application 생성 후 **Settings → Integration API Key**
   - Key 생성 → **한 번만 표시**되므로 안전한 곳에 보관
4. **Base URL** 확인 (예: `https://<deployment>.talon.one`)
5. TechStore `.env.local`에 추가 (값은 커밋하지 않음):

```bash
TALON_ONE_BASE_URL=https://YOUR_DEPLOYMENT.talon.one
TALON_ONE_API_KEY=
TALON_ONE_APPLICATION_ID=
# 로열티 프로그램 생성 후 채움
TALON_ONE_LOYALTY_PROGRAM_ID=
```

`.env` / `.env.local`은 반드시 `.gitignore`에 포함되어야 합니다.  
`.env.example`에는 키 이름만 두고 값은 비워 두세요.

### Step B — Attributes (커스텀 속성)

**Customer Profile** attributes:

| Name | Type | 용도 |
|------|------|------|
| `MembershipTier` | String | 로그인 시 `GOLD` / `SILVER` |

**Cart Item** attributes (선택, 카테고리 규칙용):

| Name | Type | 용도 |
|------|------|------|
| `Category` | String | `노트북`, `스마트폰`, `액세서리` 등 |

경로 예시: **Application → Settings → Attributes → Create Attribute**  
Entity를 Profile / Cart Item으로 맞춘 뒤 저장합니다.

### Step C — Coupons (쿠폰 캠페인용)

1. **Campaigns → Create Campaign**
   - Name: `PoC Coupons`
   - Type: 일반 프로모션 캠페인 (Coupon 사용 가능하도록 Features에서 Coupons 활성화)
2. Campaign 안 **Coupons → Create coupon** (또는 Import)
   - 수동 PoC용 코드 예시: `WELCOME10`, `SAVE5K`
3. Braze Connected Content가 발급하는 코드와 **동일 포맷/동일 코드 풀**을 쓰려면:
   - **옵션 A (PoC 간단):** Talon에서 미리 발급한 코드를 Braze 메시지에 넣어 발송
   - **옵션 B (권장 방향):** Braze 발급 API를 Talon Coupon Create API로 교체/연동해 한 곳에서 코드 관리

PoC 1차는 **옵션 A**로 빠르게 가고, 2차에서 Braze 발급 → Talon 생성으로 합치는 것을 권장합니다.

### Step D — Loyalty Program (Should)

1. **Loyalty → Create loyalty program**
   - Name: `TechStore Points`
   - Point name: `TSP` (또는 `points`)
2. 프로그램 ID를 `TALON_ONE_LOYALTY_PROGRAM_ID`에 저장
3. 적립/사용 규칙은 아래 캠페인 Rule에서 정의

### Step E — Campaigns & Rules (Must 3 + Should 1)

캠페인은 **하나씩 분리**해 디버깅을 쉽게 합니다.  
각 캠페인: **Rules → Create rule** → Condition / Effect.

#### Campaign 1: `Cart Threshold 10%`

| | |
|--|--|
| **Condition** | Session total (할인 전) ≥ `50000` |
| **Effect** | `setDiscount` — name: `cart_10pct`, value: `10%` of session total (또는 percentage discount effect) |
| **Budget** | PoC: 제한 없음 또는 daily redemptions 여유 있게 |

> 상품 가격대가 높으면(노트북 등) 임계값은 데모용으로 `300000`(액세서리) / `1000000` 등으로 조정해도 됩니다.

#### Campaign 2: `Coupon WELCOME10`

| | |
|--|--|
| **Condition** | Coupon code is valid **AND** coupon code = `WELCOME10` (또는 coupon value 기반) |
| **Effect** | `setDiscount` — `10%` of session (또는 fixed amount) |
| **Stacking** | Campaign 1과 동시 적용 여부 Dashboard에서 명시 (PoC는 **둘 다 적용** 권장 → 스택 시연) |

#### Campaign 3: `GOLD Member Bonus`

| | |
|--|--|
| **Condition** | Profile attribute `MembershipTier` = `GOLD` |
| **Effect** | `setDiscount` — additional `5%` **or** loyalty earn multiplier |

#### Campaign 4: `Loyalty Earn & Burn` (Should)

**Earn rule**

| | |
|--|--|
| **Condition** | Session will be closed (또는 checkout state) / always on open session preview |
| **Effect** | `addLoyaltyPoints` — e.g. `floor(total * 0.01)` (1%) |

**Burn rule** (카트에서 포인트 사용 시)

| | |
|--|--|
| **Condition** | Session has loyalty points to redeem (또는 custom attribute `RedeemPoints` > 0) |
| **Effect** | `redeemLoyaltyPoints` + matching `setDiscount` |

PoC에서는 burn을 **custom session attribute** `RedeemPoints` (Number)로 보내는 방식이 구현이 단순합니다.

### Step F — Campaign 활성화

1. 각 캠페인 상태 **Running**
2. **Rule Tester / Cart Preview**(있는 경우)로 샘플 카트 JSON 넣어 effects 확인
3. Application timezone / currency가 KRW인지 재확인

---

## 3. 데모 시나리오 (15분)

1. **게스트** — 액세서리만 담아 5만원 미만 → 자동 할인 없음  
2. 합계 ≥ 임계값 → **10% 자동 할인** effects 표시  
3. 쿠폰 `WELCOME10` 적용 → 추가 할인 (스택)  
4. **GOLD** 로그인 → 멤버 보너스  
5. 주문 완료 → session `closed`, (Should) 포인트 적립  
6. (여유) 주문 취소 → session 취소/포인트 롤백 설명

---

## 4. API 설계 (TechStore ↔ Talon.One)

### 4-1. 원칙

- Talon Integration API는 **서버(Route Handler)에서만** 호출
- API Key는 클라이언트에 노출 금지
- `sessionId`는 브라우저 카트 세션과 1:1 (예: `cart_${uuid}` — localStorage 유지)
- `profileId` 우선순위: Braze `external_id`(`getUserId` / `changeUser`와 동일) → 로그인 email → `guest_${sessionId}`

### 4-2. 환경 변수

| Key | Client? | 설명 |
|-----|---------|------|
| `TALON_ONE_BASE_URL` | No | Deployment base URL |
| `TALON_ONE_API_KEY` | No | Integration API Key |
| `TALON_ONE_APPLICATION_ID` | No | Application ID |
| `TALON_ONE_LOYALTY_PROGRAM_ID` | No | Loyalty program ID (optional) |

### 4-3. TechStore BFF 엔드포인트

| Method | Path | 역할 |
|--------|------|------|
| `POST` | `/api/v1/talon/session` | 카트 평가 (open/update session) |
| `POST` | `/api/v1/talon/session/close` | 주문 확정 시 close |
| `POST` | `/api/v1/talon/session/cancel` | 주문 취소 시 cancel (PoC) |
| `GET` | `/api/v1/talon/profile/[profileId]/loyalty` | 포인트 잔액 조회 (Should) |

### 4-4. `POST /api/v1/talon/session` 요청/응답

**Request (TechStore → BFF)**

```json
{
  "sessionId": "cart_abc123",
  "profileId": "user@example.com",
  "couponCodes": ["WELCOME10"],
  "redeemPoints": 0,
  "cartItems": [
    {
      "sku": "3",
      "name": "AirPods Pro 2세대",
      "quantity": 1,
      "price": 299000,
      "category": "액세서리"
    }
  ],
  "profileAttributes": {
    "MembershipTier": "GOLD"
  }
}
```

**BFF → Talon** (`PUT /v2/customer_sessions/{sessionId}?dry=false`)

```json
{
  "customerSession": {
    "profileId": "user@example.com",
    "state": "open",
    "cartItems": [
      {
        "name": "AirPods Pro 2세대",
        "sku": "3",
        "quantity": 1,
        "price": 299000,
        "attributes": { "Category": "액세서리" }
      }
    ],
    "couponCodes": ["WELCOME10"],
    "attributes": {
      "RedeemPoints": 0
    }
  },
  "customerProfile": {
    "attributes": {
      "MembershipTier": "GOLD"
    }
  }
}
```

**Response (BFF → UI로 정규화)**

```json
{
  "sessionId": "cart_abc123",
  "subtotal": 299000,
  "totalDiscount": 44850,
  "total": 254150,
  "coupons": [
    { "code": "WELCOME10", "accepted": true, "rejectionReason": null }
  ],
  "effects": [
    {
      "type": "setDiscount",
      "campaignId": 1,
      "name": "cart_10pct",
      "value": 29900
    }
  ],
  "loyalty": {
    "willEarn": 2541,
    "balance": 12000
  },
  "rawEffects": []
}
```

UI는 `rawEffects`를 그대로 쓰지 말고, BFF에서 **금액·쿠폰 수락 여부·적립 예정**만 내려주는 것을 권장합니다.

### 4-5. Close / Cancel

**Close** — `placeOrder` 직전/직후:

```json
{
  "customerSession": {
    "profileId": "user@example.com",
    "state": "closed",
    "cartItems": ["…동일…"],
    "couponCodes": ["WELCOME10"]
  }
}
```

**Cancel** — 주문 취소 시 `state: "cancelled"` (또는 Talon 문서의 cancel session 절차).  
부분 환불 PoC는 2차로 미룸.

### 4-6. 프론트 연동 지점

| 위치 | 동작 |
|------|------|
| `src/app/cart/page.tsx` | 수량 변경·쿠폰 적용 시 `POST /api/v1/talon/session` |
| `src/app/checkout/page.tsx` | 진입/결제 직전 재평가 |
| `StoreContext.placeOrder` | close session → 로컬 주문 저장 |
| 주문 취소 UI | cancel session |
| 로그인 | `MembershipTier`를 profile attributes로 전달 |

### 4-7. 제안 디렉터리

```
src/lib/talon/
  client.ts          # Integration API fetch 래퍼
  map-cart.ts        # CartItem[] → Talon cartItems
  map-effects.ts     # effects → UI discount model
  types.ts
src/app/api/v1/talon/
  session/route.ts
  session/close/route.ts
  session/cancel/route.ts
  profile/[profileId]/loyalty/route.ts
```

---

## 5. 캠페인 규칙 초안 (복붙용 요약)

| ID | Campaign | Condition | Effect |
|----|----------|-----------|--------|
| C1 | Cart Threshold 10% | `Session.Total ≥ 50000` | Discount 10% of session |
| C2 | WELCOME10 | Valid coupon `WELCOME10` | Discount 10% (or fixed ₩10,000) |
| C3 | GOLD Bonus | `MembershipTier == "GOLD"` | Extra 5% discount |
| C4a | Earn 1% | Always (on close / preview) | Add loyalty points = 1% of payable |
| C4b | Burn | `RedeemPoints > 0` | Redeem points + discount = points value (1pt=1KRW) |

**스택 정책 (PoC 제안)**

1. C1 (임계값 %)  
2. C2 (쿠폰)  
3. C3 (멤버) — 최종 payable에 대해 순차 적용할지, 각각 subtotal 기준인지 Rule에서 통일  
4. C4b burn은 할인 effects 이후 payable에 적용

실무에서는 **할인 베이스(원가 vs 이미 할인된 금액)** 를 팀과 한 줄로 못 박는 것이 중요합니다. PoC는 “모두 subtotal 기준 병렬 합산 후 cap”이 설명하기 쉽습니다.

---

## 6. 구현 체크리스트

### Dashboard

- [ ] Application `TechStore PoC` (KRW) 생성
- [ ] Integration API Key 발급 → `.env.local` 설정
- [ ] Attribute `MembershipTier` (Profile), `Category` (Cart Item)
- [ ] Coupon `WELCOME10` (및 테스트용 1–2개) 생성
- [ ] Loyalty program 생성 (Should)
- [ ] Campaign C1–C3 Running 확인
- [ ] Campaign C4 Running 확인 (Should)
- [ ] Rule Tester로 sample cart effects 확인

### Backend

- [x] `src/lib/talon/*` 클라이언트·매퍼
- [x] `POST /api/v1/talon/session` (open / close / cancel — `state`로 구분)
- [x] effects → `totalDiscount` / coupon rejection 정규화
- [x] 에러 시 카트는 할인 없이 진행 + 토스트
- [x] `.env.example`에 Talon 키 이름 추가

### Frontend

- [x] cart sessionId = `cartId` (StoreContext)
- [x] 카트 쿠폰 stub → 실제 적용 API 연결
- [x] 할인 내역·최종 금액 UI
- [x] checkout 재평가
- [x] `placeOrder` 시 close + 주문에 `talonSessionId` / `discountTotal` 저장
- [x] GOLD/SILVER → profile attributes 전달 (`MembershipTier`)
- [ ] (Should) 포인트 잔액·사용 입력

### 데모 / QA

- [ ] 임계값 미달 / 초과
- [ ] 유효·무효 쿠폰
- [ ] GOLD vs SILVER / 게스트
- [ ] 주문 close 후 동일 쿠폰 재사용 불가(한도 설정 시)
- [ ] (Should) 적립·사용
- [ ] Braze 발급 코드와 Talon 쿠폰 정합 (옵션 A/B)

### 보안

- [ ] API Key 서버 전용
- [ ] 개인정보(이메일) 로그 마스킹
- [ ] 내부 URL/키를 AI·채팅에 붙여넣지 않기

---

## 7. Braze 연동 메모

| 단계 | PoC 1차 | PoC 2차 |
|------|---------|---------|
| 쿠폰 발급 | Braze Connected Content 유지 + Talon에 동일 코드 사전 등록 | Braze webhook/CC가 Talon Create Coupon 호출 |
| 메시징 | Braze가 코드 전달 | 동일 |
| 적용 | Talon session `couponCodes` | 동일 |

기존 경로: `/api/v1/connected-content/coupon`, `/admin/coupon-issuances`

---

## 8. Dashboard 도움 받는 방법

이 채팅에서 이어서 도와드릴 수 있습니다. 예를 들면:

1. Application / Attribute 생성 화면 확인
2. Rule Builder Condition·Effect 문장 같이 쓰기
3. Coupon / Loyalty 설정 검증
4. Rule Tester용 sample JSON 작성
5. API 에러 응답 해석

**준비물:** Talon.One trial/sandbox 접근 권한, Application ID, (키 값은 채팅에 붙여넣지 말 것)

막히면 **메뉴 경로 + 화면에서 보이는 옵션 이름**(또는 민감정보 가린 스크린샷 설명)만 알려주세요.

---

## 9. 다음 액션

1. Dashboard에서 Step A–F 완료  
2. `.env.local`에 Talon 변수 추가  
3. 코드 구현: `lib/talon` + session API + 카트 UI 연결  

Dashboard 설정이 끝났거나, 지금 Rule을 같이 만들고 싶으면 현재 단계(예: “Application까지 만듦”)를 알려주세요.
