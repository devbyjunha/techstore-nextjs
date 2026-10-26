# TechStore × Talon.One 회원 프로필 이관 PoC

> **Notion에 넣을 때:** 채팅/코드블록에 붙여넣지 마세요.  
> Notion → **Import** → **Markdown** → 이 파일 업로드

> **프로젝트:** TechStore (Next.js 관리자 이관 + Next.js/Flutter 쇼핑몰)  
> **목적:** 자사 서비스 DB의 회원 정보를 Talon Customer Profile로 **최소 이관**하는 과정 시연  
> **환경:** Talon.One App `TechStore` · Attribute `MembershipTier` · 캠페인 C3 (GOLD Member Bonus)  
> **작성 기준:** 2026-08-20  
> **관련 문서:** `TALON-ONE-POC-NOTION.md` (세션·할인), `TALON-MANAGEMENT-BRAZE-CC-POC-NOTION.md` (쿠폰 Import)

---

## 1. 한 줄 요약

회원 원장(이름·연락처·주소)은 옮기지 않는다.  
**안정적인 `profileId` + 규칙에 쓰는 Customer Attribute(`MembershipTier`)만** Integration API로 적재하고, 장바구니에서 C3 GOLD 할인이 **클라이언트 등급 전송 없이** 붙는지 검증한다.

---

## 2. 이관하는 데이터 / 안 하는 데이터

자사 DB 추출본(CSV)에는 운영에서 흔히 나오는 컬럼을 **일부러** 넣어 두었다. Talon으로 나가는 payload에서는 잘라낸다.

| 소스 컬럼 | Talon으로? | 이유 |
|-----------|------------|------|
| `profileId` | ✅ `integrationId` | 세션·쿠폰·로열티가 붙는 키. Braze `external_id`와 동일해야 함 |
| `MembershipTier` | ✅ Customer Attribute | 캠페인 C3 조건 `MembershipTier == GOLD` |
| `legacy_email` | ❌ | 연락처는 자사 DB / Braze 정본 |
| `legacy_display_name` | ❌ | 프로모션 평가에 불필요 |
| `legacy_phone` | ❌ (`REDACTED`) | 개인정보. Talon에 넣지 않음 |
| `scenario` / `notes` | ❌ | PoC 운영 메모 |

**샘플 파일**

- `scripts/talon-management/sample-legacy-members.csv` — 초기 7명
- `scripts/talon-management/sample-legacy-members-tier-change.csv` — 같은 ID 덮어쓰기
- `scripts/talon-management/sample-member-bound-coupons.csv` — 수신자 한정 쿠폰

**Talon에 실제로 보내는 JSON (GOLD 1명 예시)**

```json
{
  "customerProfiles": [
    {
      "integrationId": "mig_gold_001",
      "attributes": { "MembershipTier": "GOLD" }
    }
  ]
}
```

---

## 3. 샘플 회원 (가상 데이터)

| profileId | Talon MembershipTier | 시나리오 | 로그인 |
|-----------|----------------------|----------|--------|
| `mig_gold_001` | GOLD | S1 C3 적용 | 로그인 화면 원클릭 |
| `mig_gold_002` | GOLD | S1 대량 이관 | (조회만) |
| `mig_silver_001` | SILVER | S2 C3 없음 | 로그인 화면 원클릭 |
| `mig_silver_002` | SILVER | S2 | (조회만) |
| `mig_none_001` | (없음) | S3 프로필만 존재 | 로그인 화면 원클릭 |
| `demo_user_001` | GOLD | S5 기존 쿠폰 `MIG-USER-001` 수신자 | 쿠폰 CSV와 키 맞춤 |
| `demo_user_002` | SILVER | S5 `MIG-USER-002` | 쿠폰 CSV와 키 맞춤 |

식별자 계약:

```
자사 user_id  =  Braze external_id  =  Talon profileId
예: mig_gold_001
```

---

## 4. 시나리오

전제: Dashboard에 `MembershipTier` Attribute와 C3(GOLD 5%)가 Running. 장바구니 합계 5만원 초과(C1도 같이 보임).

### S1 — GOLD 이관 회원, 클라이언트는 등급을 안 보냄

1. 관리자 `/admin/talon-profiles` → **샘플 회원 이관 실행**
2. **프로필 조회** `mig_gold_001` → `MembershipTier=GOLD`
3. `/login` → **GOLD 이관 회원** (폼의 GOLD/SILVER 셀렉트 사용 안 함)
4. 5만원 이상 담기
5. **기대:** C1 10% + **C3 GOLD 5%**. 장바구니 문구: `클라이언트 미전송 · Talon 이관 프로필 사용`

이게 이 PoC의 핵심이다. 할인이 로그인 셀렉트가 아니라 **이관된 Attribute**에서 나온다.

### S2 — SILVER 이관 회원

1. `/login` → **SILVER 이관 회원**
2. 같은 카트
3. **기대:** C1만. C3 없음

### S3 — 등급 없이 프로필만 이관

1. `/login` → **등급 없음**
2. **기대:** C1만. 조회 시 MembershipTier 없음

### S4 — 미이관 대조군

1. 로그인 폼에 임의 이메일 + 비밀번호, 등급은 고르지 않거나(기존 폼은 등급 필수) **아무 이메일로 GOLD를 고르면 런타임 PUT**이 된다
2. 이관 PoC와 비교할 때: 폼에서 등급을 고르면 `membershipTier`가 세션마다 Talon으로 나간다
3. **이관 경로를 보려면 반드시 원클릭 이관 계정**을 쓴다

### S5 — 수신자 한정 쿠폰

1. (선택) **GOLD/SILVER 전용 쿠폰 Import** 또는 CLI 쿠폰 CSV
2. GOLD 계정으로 GOLD 바인딩 코드 적용 → 성공
3. SILVER 계정으로 GOLD 바인딩 코드 적용 → `CouponRecipientDoesNotMatch`

`recipientintegrationid` = 이관할 때 쓴 **같은 profileId**여야 한다.

### S6 — PII 미이관

1. 이관 성공 화면의 **payload JSON**에 email / name / `REDACTED`가 없는지 확인
2. `droppedColumns`에 `legacy_email`, `legacy_display_name`, `legacy_phone`이 표시됨

### S7 — 같은 profileId 덮어쓰기

1. **GOLD → SILVER 덮어쓰기**
2. 다시 GOLD 이관 계정으로 장바구니 평가
3. **기대:** C3 사라짐 (클라이언트가 등급을 안 보내므로 Talon 저장값이 진실)

---

## 5. 실행 방법

### 관리자 UI (권장, Next.js)

1. TechStore → **관리자 → Talon 프로필 이관** (`/admin/talon-profiles`)
2. 샘플 회원 이관 → 조회 → (선택) 수신자 쿠폰
3. Next.js 또는 Flutter `/login` → GOLD 이관 회원 → 장바구니

### Flutter 쇼핑몰

Next.js `npm run dev` 후:

```bash
flutter run -d web-server --web-port=8080 \
  --dart-define=TECHSTORE_API_BASE_URL=http://localhost:3000
```

### CLI

```bash
npm run talon:import-profiles
npm run talon:import-profiles -- --tier-change
```

인증은 **Integration API Key** (`TALON_ONE_API_KEY`). Management Key가 아니다.

엔드포인트: `PUT /v2/customer_profiles?silent=true`  
(`silent=true` = 규칙 엔진 미실행. 대량 이관용. 장바구니 평가는 기존 세션 API.)

---

## 6. 구현 맵

| 경로 | 역할 |
|------|------|
| `src/lib/talon/profile-migration.ts` | CSV 파싱, PII 컬럼 제거, 데모 계정 |
| `src/lib/talon/client.ts` | bulk PUT + inventory GET |
| `src/app/api/admin/talon/profiles/import` | 이관 API |
| `src/app/api/admin/talon/profiles/[profileId]` | 조회 |
| `src/app/api/admin/talon/profiles/bound-coupons` | 수신자 쿠폰 (Management) |
| `src/app/admin/talon-profiles/page.tsx` | 관리자 UI |
| `src/app/login/page.tsx` | 이관 계정 원클릭 (MembershipTier 미전송) |
| `scripts/talon-management/import-profiles.mjs` | CLI |

카트/체크아웃 경로에는 이관 API를 넣지 않는다. 실시간 할인은 기존 `POST /api/v1/talon/session`.

---

## 7. 체크리스트

- [ ] Tools → Attributes · `MembershipTier` (GOLD, SILVER)
- [ ] C3 GOLD Member Bonus Running
- [ ] 샘플 7명 이관 성공, payload에 PII 없음
- [ ] `mig_gold_001` 조회 시 GOLD
- [ ] 이관 계정 로그인 후 장바구니 C3 (클라이언트 미전송)
- [ ] SILVER / 등급 없음은 C3 없음
- [ ] (선택) 수신자 한정 쿠폰 거절 확인
- [ ] (선택) GOLD→SILVER 덮어쓰기 후 C3 제거

---

## 8. 라이선스 고객에 그대로 가져갈 때

1. `profileId` = 불변 회원키 (이메일은 비권장)
2. Attribute는 규칙에 쓰는 것만 화이트리스트
3. 초기 적재: Integration bulk PUT (`silent=true`), 이후 등급 변경은 회원 이벤트/로그인 시 단건 PUT
4. 쿠폰 `recipientintegrationid`는 이 키와 먼저 맞춘 뒤 Import
5. 이름·전화·실이메일·내부 ID가 아닌 키는 Talon에 넣지 않음

---

*TechStore Next.js PoC — Talon.One Customer Profile Migration*
