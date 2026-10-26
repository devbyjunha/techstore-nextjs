# TechStore × Talon.One 도입 · 데이터 이관 · 식별자 가이드

> **Notion에 넣을 때:** 채팅/코드블록에 붙여넣지 마세요.  
> Notion → **Import** → **Markdown & CSV** → 이 파일 업로드  
> (또는 빈 페이지 본문에 Cmd+V. `/code` 블록 금지)

> 📌 **프로젝트:** TechStore (Next.js PoC)  
> **목적:** 라이선스 고객 온보딩 시 “무엇을 옮기고 / 어떤 순서로 도입하고 / Braze·Amplitude와 고객 ID를 어떻게 맞출지”를 한 문서로 정리  
> **작성 기준:** 2026-08-20  
> **관련 PoC:** `TALON-ONE-POC-NOTION.md` (세션·할인) · `TALON-MANAGEMENT-BRAZE-CC-POC-NOTION.md` (쿠폰) · `TALON-PROFILE-MIGRATION-POC-NOTION.md` (회원 프로필 이관)

---

## 이 문서에서 쓰는 이름

| 이름 | 인증 | 한 줄 |
|------|------|--------|
| **Integration API** | `ApiKey-v1` | 실시간 세션·프로필·주문 close. 카트/체크아웃 경로 |
| **Management API** | `ManagementKey-v1` | 쿠폰/포인트 Import, 쿠폰 Create. 백오피스·배치 |

> ⚠️ 카트·체크아웃처럼 실시간 할인이 필요한 경로에는 **Integration API**를 사용합니다. **Management API**는 쿠폰 생성·Import 같은 백오피스/배치 작업에만 사용합니다.

---

# 1. Talon 도입 시 필요한 데이터 이관

## 1.1 전반적인 Migration 전략

Talon.One은 **회원 정보를 관리하는 CRM/회원 마스터가 아닙니다.** 이름·연락처·주소 같은 핵심 회원 정보는 자사 DB에 두고, Talon에는 **프로모션 규칙 평가와 쿠폰·포인트 운영에 필요한 데이터만** 넣습니다.

| 구분 | 자사 DB에 유지 | Talon에 적재 / 재설계 |
|------|----------------|------------------------|
| 회원 정보 | 이름·연락처·주소 등 핵심 회원 정보 | 안정적인 `profileId` (`integrationId`) |
| 개인정보 | 이메일·전화번호 등 PII 원문 | 규칙 평가용 Customer Attribute 예: `MembershipTier` |
| 프로모션 | 레거시 프로모션 규칙 엔진 로직 | 캠페인 규칙 재설계. 쿠폰 코드·유효기간·사용 한도 |
| 인센티브 | 기존 시스템의 원천 데이터 | 로열티 잔액·카드. 필요 시 과거 주문을 `closed session`으로 적재 |

> 💡 레거시 프로모션 규칙은 1:1 자동 이관 대상이 아니라, Talon 캠페인 구조에 맞춰 재설계합니다.

**권장 순서**

| 단계 | 작업 | 주요 기준 |
|------|------|-----------|
| 1 | 공통 고객 ID 기준 정리 | `user_id` = Braze `external_id` = Talon `profileId` |
| 2 | 기본 설정 정의 | Dashboard에서 Attribute · Loyalty Program · Application/Currency 정의 |
| 3 | 캠페인 규칙 재설계 | 레거시 룰은 1:1 Import하지 않고 Talon 구조에 맞춰 재설계 |
| 4 | 쿠폰·포인트 적재 | Management API 또는 Dashboard Import 사용 |
| 5 | 프로필 속성·과거 주문 적재 | Integration API 사용. 필요 시 Batch로 선적재 |
| 6 | 쇼핑몰 실시간 연동 | BFF에서 Integration API 호출 |
| 7 | 필요 시점 동기화 운영 | Go-live 이후 로그인·카트·등급 변경 시점에 프로필 갱신 |

그린필드(PoC처럼 기존 바우처가 없으면)라면 4·5는 생략할 수 있습니다. 다만 Go-live 이후에도 기존 쿠폰·포인트를 계속 사용할 계획이라면, 4·5를 이관 범위에 포함해 검토해야 합니다.

> 💡 여기서 Lazy 동기화는 모든 회원 정보를 미리 Talon에 계속 복제하는 방식이 아니라, **로그인·장바구니 진입·등급 변경처럼 할인 평가에 필요한 순간에만** 자사 DB의 최신 등급/속성을 Talon 프로필에 업데이트하는 방식입니다.

**이관 가능 vs 재설계**

| 이관 가능 | 재설계 필요 |
|-----------|-------------|
| 쿠폰 코드·유효기간·사용 한도 | 프로모션 **규칙** (Condition / Effect) |
| 로열티 잔액·카드 | 예산·스택·우선순위 정책 |
| 프로필 속성·과거 주문 실적 | 캠페인 운영 방식 자체 |

---

## 1.2 쿠폰, 적립금 등 인센티브 내역

쿠폰·포인트는 이름·연락처 같은 핵심 회원 정보와 분리해 관리하는 **운영 데이터**입니다.

| 데이터 | 언제 필요 | 방법 | API |
|--------|-----------|------|-----|
| 미사용 쿠폰 | 레거시 바우처를 Go-live 후에도 쓸 때 | CSV | Management API `import_coupons` 또는 Dashboard Import |
| 이미 사용된 쿠폰 | 재사용 방지 | closed session + `couponCodes` | **Integration** |
| 로열티 포인트 | 기존 적립금 이전 | CSV | Management API `import_points` |
| 로열티 카드 | 카드 기반 프로그램 | CSV | Management API `import_cards` |
| 신규 발급 | Braze/CRM이 코드를 만들 때 | Create | Management `POST .../coupons` (PoC는 BFF 경유) |

**쿠폰 CSV 실측 제약 (PoC)**

- `value` 필수, 최소 3자
- `expirydate`는 **미래**만 Import 가능
- 날짜: ISO-8601 / RFC3339
- `recipientintegrationid`가 있으면 **그 profileId만** 사용 가능. 키가 다르면 `CouponRecipientDoesNotMatch`
- 수신자 한정 쿠폰을 넣기 **전에** 공통 고객 ID 기준이 정리되어 있어야 함
- Import한 캠페인이 **Running**이어야 적용됨
- Management API는 백오피스용 (대략 3 req/s). 실시간 할인 경로 금지

런타임 적용은 항상 장바구니 **Integration 세션**입니다. Import만 하고 세션 평가가 없으면 할인이 붙지 않습니다.

---

## 1.3 사용자 프로필에 저장된 Custom Attribute

Customer Profile = `profileId`(integrationId) + 규칙에 쓰는 Attribute.

공식 가이드 기준, **고객 프로필·과거 주문은 Integration API로만** 프로그램 Import 합니다. (쿠폰/포인트처럼 Management CSV가 기본이 아님)

| 작업 | 엔드포인트 | 비고 |
|------|------------|------|
| 단건 프로필 | `PUT /v2/customer_profiles/{profileId}` | 로그인·카트 Lazy 동기화 |
| 대량 이관 | `PUT /v2/customer_profiles?silent=true` | 최대 1,000건/요청. `silent=true`는 규칙 엔진 미실행 (대량 적재용) |
| 조회 | `GET /v1/customer_profiles/{id}/inventory?profile=true` | PoC 검증 |
| 과거 주문 | `PUT /v2/customer_sessions/{id}` `state: closed` | 누적 구매·타겟팅 |

TechStore PoC Attribute:

| Entity | API name | Type | Picklist |
|--------|----------|------|----------|
| Customer Profile | `MembershipTier` | String | `GOLD`, `SILVER` |

경로: **Tools → Attributes** (앱 Settings의 Custom Attributes가 아님). 스키마를 먼저 만들고, 그다음 값을 PUT 합니다.

**화이트리스트 원칙:** 캠페인 Condition에 쓰는 것만. 가입일·채널 등은 규칙이 생기면 추가. 이름·전화·이메일 원문은 넣지 않음.

값이 비어 있는 등급(PoC `mig_none_001`)은 프로필만 만들고 `MembershipTier` Attribute는 생략합니다.

---

## 1.4 Integration API vs Management API (역할)

| 구분 | 실시간 쇼핑몰 경로 | 백오피스 / 배치 경로 |
|------|--------------------|----------------------|
| 사용 API | Integration API | Management API |
| 인증 | `ApiKey-v1` | `ManagementKey-v1` |
| 주요 사용처 | 세션 평가 · 쿠폰 적용 · 주문 완료/취소 · 프로필 Attribute PUT · 과거 주문 closed session | 쿠폰 생성 · 쿠폰 CSV Import · 포인트/카드 Import · 캠페인/컬렉션 관리 |
| 적용 위치 | 쇼핑몰 BFF / 카트 / 체크아웃 | 관리자 화면 / 운영 배치 / Campaign Manager |

| 작업 | 사용 API |
|------|----------|
| 장바구니 할인 평가 | Integration `PUT /v2/customer_sessions/{id}` |
| 주문 완료 / 취소 | Integration `closed` / `cancelled` |
| 고객 프로필 Attribute | Integration `customer_profiles` |
| 과거 주문 | Integration closed session |
| 사용된 쿠폰 redeemed | Integration closed session + 코드 |
| 미사용 쿠폰 CSV | **Management** `import_coupons` |
| 포인트 / 카드 | **Management** `import_points` / `import_cards` |
| 쿠폰 대량 생성 | **Management** `POST .../coupons` |
| 캠페인 규칙 | Dashboard (또는 Management). 레거시 1:1 이관 없음 |

키는 분리 보관합니다. Integration Key는 실시간 SLA 대상, Management Key는 백오피스입니다.

---

## 1.5 Data warehouse / CDI 연동 여부

**Braze CDI와 같은 ‘웨어하우스 SQL → 네이티브 스트림’은 Talon.One 기본 제품에 없습니다.**

Braze CDI는 Snowflake, BigQuery, Redshift 등에서 쿼리 결과를 사용자 Attribute로 주기 동기화합니다. Talon 공식 Import 가이드는 프로필·과거 주문을 **Integration API로 프로그램 적재**하라고 합니다.

DW에 있는 등급·세그먼트를 Talon에 넣고 싶다면 아래 중 하나입니다.

| 방식 | 설명 | Braze CDI와 비교 |
|------|------|------------------|
| **자사 배치** (권장 기본) | DW/DB → ETL → `PUT /v2/customer_profiles` (최대 1,000건, `silent=true`) | CDI를 직접 구현하는 형태 |
| **Reverse ETL** | Hightouch, Census 등이 Talon/HTTP destination으로 동기화 | CDI에 가장 가까움. Talon 네이티브는 아님 |
| **CDP 파트너** | Segment, mParticle, Zeotap 등 → Talon destination | 이벤트/오디언스 연동. 웨어하우스 CDI와는 별개 |
| **Braze CDI → Braze만** | 등급을 Braze Attribute로 넣은 뒤, 카트에서 자사 DB(또는 Braze)를 읽어 Talon에 PUT | Braze와 Talon 원장이 갈라질 수 있음. **할인 정본은 Talon** |

운영 권장:

- 할인·쿠폰·포인트의 **정본은 Talon** (또는 자사 incentive DB → Talon)
- Braze는 발급·메시징, Amplitude는 분석
- DW에서 매일 등급을 밀어 넣는 것과, 로그인/등급 변경 때 Lazy PUT하는 것을 병행할 수 있음
- 카트 경로에서 DW를 직접 치지 말 것

---

## 1.6 기타

- **게스트 적립 기본값:** 비회원 세션에는 포인트/수신자 쿠폰을 쌓지 않는 것이 일반적입니다. 카트 상품과 입력 중인 범용 코드만 로그인 후 재평가합니다. 게스트 원장을 회원 프로필에 자동 merge하는 것은 Braze `changeUser` 기본값과 다르며, 인센티브 부정 이용 위험이 있습니다. 자세한 내용은 §3.
- **로그아웃:** Talon 서버 프로필은 지우지 않습니다. 다음 세션의 `profileId`만 `guest_…`로 바꿉니다. Braze `wipeData()`는 기기 SDK 식별 해제이지, 서버 유저 삭제가 아닙니다.
- **Flutter:** 쇼핑몰 로그인·장바구니·체크아웃 세션 평가는 Next.js와 동일하게 구현되어 있습니다. **관리자 이관 UI는 Next.js만** 있습니다. 시드 데이터는 Talon 클라우드에 있으므로 Next.js에서 이관하면 Flutter에서도 같은 `profileId`로 검증할 수 있습니다.
- **보안:** API Key·내부 URL·실제 개인정보를 코드/문서 예시에 넣지 않습니다. PoC 회원은 `mig_gold_001` 같은 가상 ID입니다.

---

# 2. 서비스 내 Talon 도입 진행 순서

## A. 공통 고객 ID 기준 정리 (가장 먼저)

```
자사 user_id  =  Braze external_id  =  Talon profileId
```

- 가능하면 **불변 user_id**. 이메일은 변경·중복에 취약합니다.
- 게스트는 `guest_{cartId}`처럼 **회원 키와 절대 겹치지 않게**.
- 로그인: `braze.changeUser(user_id)`와 동시에 다음 Talon 세션 PUT의 `profileId`도 `user_id`.
- 로그아웃: Braze는 로컬 식별 해제(`wipeData` 등), Talon은 다음 세션을 `guest_…`로. **서버 프로필은 유지.**
- TechStore PoC 함정: `profileId`를 Braze `getUserId()` 우선으로 잡습니다. UI만 로그아웃하고 `wipeData()`를 안 하면 Talon도 회원으로 평가됩니다. 실도입에서는 둘을 같이 끊습니다.

**로그인 시 게스트를 회원에 합칠지 (merge)**

| 대상 | 권장 |
|------|------|
| 장바구니 **상품** | 회원 카트로 가져감 (이커머스 표준) |
| 카트에 입력만 한 **범용 코드** | 회원 세션에서 **다시 평가** (쿠폰/포인트 소유 정보 이전이 아님) |
| 이미 사용된 쿠폰/할인 | 이전하지 않음 |
| 게스트에게 쌓인 **포인트·바인딩 쿠폰** | 기본은 **자동 merge 하지 않음** |

Braze `changeUser()`는 익명 **행동**을 기명 유저에 붙입니다. Talon은 `guest_*`와 `user_id`를 자동 합치지 않습니다. 게스트 지갑을 회원에게 넘기는 것은 공용 기기·몰아넣기 위험이 있어, “비회원 적립 후 가입 시 이전”을 **명시하고 한도를 둔 상품**이 아니면 하지 않는 편이 안전합니다.

---

## B. Attribute + 캠페인 (taxonomy)

Dashboard Attribute가 **어휘**이고, Campaign Condition/Effect가 그 어휘로 쓴 **문장**입니다.

1. 규칙에 쓸 속성만 화이트리스트 (`MembershipTier`, 필요 시 가입일·채널)
2. Tools → Attributes에서 스키마 생성
3. Campaign Manager에서 조건/효과 **재구성** (레거시 엔진 1:1 이관 없음)
4. **PII는 Attribute에 넣지 않음**

TechStore 캠페인 예:

| ID | 캠페인 | Condition | Effect |
|----|--------|-----------|--------|
| C1 | Cart Threshold 10% | 카트 합계 > 50,000 | 10% |
| C2 | Coupon WELCOME10 | 쿠폰 유효 | 10% |
| C3 | GOLD Member Bonus | `MembershipTier == GOLD` | 5% |

C3는 스키마 + 프로필 값이 있어야 평가됩니다.

---

## C. 등급 동기화 — Lazy / Batch

정본은 **자사 DB**입니다. Talon은 스냅샷을 받아 규칙을 돌립니다.

**Lazy (PoC와 동일, 이후 운영의 기본)**

로그인·장바구니·등급 변경 시 Integration `PUT customer_profiles`. 방문 전에는 Talon에 없어도, 카트 평가 시점에는 충분합니다.

**Batch (Go-live 전, 필요할 때만)**

- 쿠폰 CSV의 `recipientintegrationid`로 특정 회원만 쓰게 묶는 경우
- 로열티 잔액을 회원별로 Import하는 경우
- 아직 방문하지 않은 GOLD 회원에게 Talon 쪽 타겟팅이 필요한 경우

실무는 **오픈 전 한 번 Batch + 이후 Lazy**가 보통입니다. 둘 중 하나만 고르는 관계가 아닙니다.

PoC 장바구니는 `membershipTier`가 있을 때만 프로필 PUT을 합니다. **이관 계정 원클릭 로그인**은 등급을 안 보내므로, C3는 이관된 Talon 저장값에서만 붙습니다.

---

## D. Incentive 적재 (사용자 원장과 별개)

- 미사용 쿠폰: Management `import_coupons` 또는 Dashboard CSV
- 이미 사용된 쿠폰: Integration closed session으로 redeemed 마킹
- 포인트: Management `import_points` / `import_cards`
- 수신자 한정: CSV `recipientintegrationid` = §2.A의 `profileId`. 다르면 `CouponRecipientDoesNotMatch`

수신자 쿠폰을 넣을 거면 **공통 고객 ID 기준 정리 → (필요 시) 프로필 Batch → 쿠폰 Import** 순서가 안전합니다.

---

# 3. Braze · Amplitude · Talon 프로필 관리 — 공통점 / 차이점

세 제품 모두 “이 사람이 누구인지”가 필요하지만, **저장하는 것과 로그아웃 때 하는 일**이 다릅니다.

## 3.1 한눈에

| | **Braze** | **Amplitude** | **Talon.One** |
|--|-----------|---------------|---------------|
| 역할 | 발급·메시징·CRM | 분석 | 프로모션·쿠폰·로열티 **지급** |
| 식별 키 | `external_id` | `user_id` | `profileId` (integrationId) |
| SDK 식별 | `changeUser()` | `setUserId()` | SDK 없음. 세션 PUT의 `profileId` |
| 서버 프로필 | 로그아웃해도 남음 | 유저 프로퍼티·이벤트 남음 | Customer Profile·쿠폰/포인트 정보 남음 |
| 로그아웃 로컬 | `wipeData()` 등 → 기기 익명화. **서버 삭제 아님** | user_id 해제 / 새 디바이스 세션 | 다음 세션을 `guest_…`로. **wipe API 없음** |
| 익명→기명 | `changeUser`가 익명 **행동**을 기명에 merge (기본) | 식별 후 이벤트 연결. 지갑 없음 | 자동 merge 없음. 카트 재평가 ≠ 원장 이전 |
| 커스텀 속성 | 세그먼트·개인화 | 분석 프로퍼티 | **규칙 Condition** |
| 쿠폰/포인트 관리 | 없음 (Connected Content로 코드만 전달 가능) | 없음 | **있음** |
| DW 네이티브 | **CDI** (Snowflake 등) | 웨어하우스 export / 스트리밍 | **없음.** Integration 배치·CDP·Reverse ETL |
| PII | 메시징에 필요하면 보유 | 분석 최소 | 넣지 않는 것이 원칙 |

실도입 키 계약:

```
자사 user_id  =  Braze external_id  =  Amplitude user_id  =  Talon profileId
```

게스트 ID는 세 곳 모두 회원 키와 겹치면 안 됩니다.

## 3.2 공통점

- 식별자는 **불변 회원키**가 이상적입니다.
- 서버 쪽 기명 프로필은 로그아웃해도 지워지지 않습니다.
- 로그아웃에서 끊는 것은 **이 기기/세션의 현재 식별자**입니다.
- 등급 같은 속성은 여러 툴에 복제될 수 있으나, **용도별 정본**을 정해야 합니다.

## 3.3 차이점 (실수하기 쉬운 곳)

**1) merge의 의미**

- Braze: 익명 탐색·메시지 이력을 이 사람으로 봅니다. 돈이 이동하지 않습니다.
- Talon: 프로필 merge는 **포인트·바인딩 쿠폰 소유 정보를 이전**하는 일입니다. 카트 상품을 가져오는 것과 다른 결정입니다.

**2) 속성 정본**

- Braze `membership_tier` → 배너 A/B
- Amplitude user property → 퍼널
- Talon `MembershipTier` → **C3 할인**

할인 규칙은 Talon만 믿습니다. Braze에만 GOLD를 넣고 Talon PUT을 안 하면 장바구니 보너스가 없습니다.

**3) 로그아웃**

Braze `wipeData()`를 “프로필 삭제”로, Talon에 그대로 대입하면 안 됩니다. Talon에서 지울 것은 없고, **다음 카트가 회원 `profileId`로 평가되지 않게** 게스트로 돌리면 됩니다. 열린 세션을 회원에 묶인 채 두면 게스트 카트에 GOLD가 붙습니다.

**4) 발급 vs 적용**

PoC 역할 분리: Braze = 쿠폰 **발급·전달**, Talon = **규칙·적용**, TechStore = BFF·UI.

---

# 4. Migration 관련 PoC

> 범위: **Next.js** = 관리자 이관 + 쇼핑몰. **Flutter** = 쇼핑몰(로그인·카트·체크아웃). 관리자 이관 UI는 Next.js만.

## 4.1 시나리오 소개

전제: Dashboard `MembershipTier`, 캠페인 C3 Running, 카트 5만원 초과(C1과 함께 보임).

샘플은 자사 DB 추출을 흉내 내되, Talon으로는 `profileId` + `MembershipTier`만 보냅니다. `legacy_email` / `legacy_display_name` / `legacy_phone`(값은 `REDACTED`)는 버립니다.

| ID | 시나리오 | 기대 |
|----|----------|------|
| **S1** | `mig_gold_001` 이관 후, 로그인에서 등급을 **안 보내고** 카트 | C1 + **C3**. 문구: 클라이언트 미전송 · Talon 이관 프로필 사용 |
| **S2** | `mig_silver_001` | C1만. C3 없음 |
| **S3** | `mig_none_001` 프로필만, 등급 없음 | C1만 |
| **S4** | 로그인 폼에서 임의 이메일 + GOLD 선택 | 세션마다 등급 PUT (이관 경로와 대조) |
| **S5** | 수신자 한정 쿠폰. GOLD 코드는 `mig_gold_001`만 | SILVER가 GOLD 코드 쓰면 `CouponRecipientDoesNotMatch` |
| **S6** | 이관 payload에 PII 없음 | `droppedColumns`에 legacy_* |
| **S7** | 같은 ID를 GOLD→SILVER 덮어쓰기 | C3 사라짐 (클라이언트가 등급을 안 보내므로 Talon 저장값이 진실) |

이관 핵심(S1): 할인이 로그인 셀렉트가 아니라 **미리 적재된 Attribute**에서 나옵니다.

데모 순서:

1. **Next.js** 관리자 **Talon 프로필 이관** → 샘플 회원 이관 → `mig_gold_001` 조회
2. **Next.js 또는 Flutter** 로그인 → **GOLD 이관 회원** 원클릭 (폼의 GOLD/SILVER 사용 안 함)
3. 5만원 이상 장바구니 → C3 + 위 문구
4. (선택, Next.js 관리자) GOLD/SILVER 전용 쿠폰 Import, GOLD→SILVER 덮어쓰기

Flutter 웹은 Next.js BFF(`POST /api/v1/talon/session`)를 호출합니다. Integration Key는 앱에 넣지 않습니다.

## 4.2 현재 서비스 구현 (Next.js)

**관리자** `/admin/talon-profiles`

- 샘플 7명 bulk PUT (`silent=true`)
- 프로필 조회 (inventory)
- 수신자 한정 쿠폰 Import (Management)
- GOLD→SILVER 재이관

**로그인** `/login`

- 기존 폼: 등급을 고르면 카트마다 `membershipTier` 전송 (S4)
- 이관 계정 원클릭: `profileId`만, 등급 미전송 (S1–S3)

**장바구니**

- `POST /api/v1/talon/session` → 서버만 Integration 호출
- `membershipTier`가 있을 때만 프로필 PUT 후 세션 평가
- 이관 계정은 PUT 없이 세션만 → Talon에 있던 GOLD로 C3

**식별자**

```
Braze getUserId()  →  로그인 email  →  guest_{cartId}
```

이관 계정은 `email`/`changeUser` 값에 `mig_gold_001`을 써서 Talon과 맞춥니다.

## 4.3 Flutter 쇼핑몰

Talon 키 없이 Next.js BFF만 호출합니다.

| 경로 | 역할 |
|------|------|
| `lib/talon/config.dart` | `TECHSTORE_API_BASE_URL` (기본 `http://localhost:3000`) |
| `lib/talon/client.dart` | `profileId` 해석, `POST /api/v1/talon/session` |
| `lib/talon/models.dart` | 이관 데모 계정 `mig_gold_001` 등 |
| `lib/screens/login_screen.dart` | 이관 계정 원클릭 (등급 미전송) |
| `lib/screens/cart_screen.dart` | 세션 평가 · 쿠폰 적용 · 멤버십 문구 |
| `lib/screens/checkout_screen.dart` | 할인 반영 · 주문 시 session `closed` |

```bash
# Next.js
cd techstore-nextjs && npm run dev

# Flutter web (port 8080 → CORS 허용 origin)
cd techstore-flutter
flutter run -d web-server --web-port=8080 \
  --dart-define=TECHSTORE_API_BASE_URL=http://localhost:3000
```

Next.js `.env.example`의 `TECHSTORE_CORS_ORIGINS`가 Flutter 웹 origin을 허용합니다.

**환경 변수 (키 이름만. 값은 `.env.local` / Vercel, Git 금지)**

- Integration: `TALON_ONE_BASE_URL`, `TALON_ONE_API_KEY`, `TALON_ONE_APPLICATION_ID`
- Management: `TALON_ONE_MANAGEMENT_API_KEY`, `TALON_ONE_COUPON_CAMPAIGN_ID`
- Flutter 웹 CORS: `TECHSTORE_CORS_ORIGINS`

**아직 이 PoC에 없는 것**

- 로열티 earn/burn UI, 포인트 CSV Import 실행
- 과거 주문 closed session 배치
- 게스트 포인트 → 회원 프로필 merge
- Flutter 관리자 이관 UI (Next.js `/admin/talon-profiles` 사용)
- DW/CDI 네이티브 연동

쿠폰 Create/Import·Braze Connected Content는 `TALON-MANAGEMENT-BRAZE-CC-POC-NOTION.md`를 참고합니다.

---

## 참고 링크

| 문서 | URL / 경로 |
|------|------------|
| Import customer data | https://docs.talon.one/docs/dev/tutorials/import-customer-data |
| Import coupons | https://docs.talon.one/docs/dev/tutorials/import-coupon-codes |
| Import loyalty data | https://docs.talon.one/docs/dev/tutorials/import-loyalty-data |
| Integration API | https://docs.talon.one/docs/dev/integration-api/overview |
| Management API | https://docs.talon.one/docs/dev/management-api/overview |
| Technology partners | https://docs.talon.one/docs/dev/technology-partners/overview |
| 세션 PoC | `docs/TALON-ONE-POC-NOTION.md` |
| 쿠폰 Management PoC | `docs/TALON-MANAGEMENT-BRAZE-CC-POC-NOTION.md` |
| 프로필 이관 PoC (상세 시나리오) | `docs/TALON-PROFILE-MIGRATION-POC-NOTION.md` |

---

*TechStore Next.js — Talon.One 도입·이관·식별자 가이드*
