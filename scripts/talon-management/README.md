# Talon.One Management API PoC

카트/체크아웃(Integration API)과 **분리된** 백오피스 스크립트입니다.

| 시나리오 | 의미 | 스크립트 |
|----------|------|----------|
| **1. 발급 (Create)** | Braze/CRM이 회원용 새 코드를 API로 생성 | `create-coupon.mjs` |
| **2. 이관 (Import)** | Go-live 전 레거시 쿠폰 CSV 적재 | `import-coupons.mjs` |

## 2번 Import — Dashboard UI로도 되나?

**됩니다.** 공식 문서 기준 두 경로가 같습니다.

| 경로 | 언제 |
|------|------|
| **Campaign Manager UI** | 일회성·소수 건 PoC. Campaign → Coupons → (Create 옆 메뉴) → **Import Coupons** → CSV 업로드 |
| **Management API** `import_coupons` | 배치 자동화, CRM/ETL, CI, 반복 이관 |

CSV 컬럼 형식은 UI·API가 동일합니다 (`value` 필수).  
이 폴더의 `sample-legacy-coupons.csv`를 UI에 올려도, API 스크립트로 넣어도 됩니다.

## 사전 준비

1. Campaign Manager → **Developer settings**에서 **Management API Key** 발급  
   (Integration Key와 다름. 헤더는 `ManagementKey-v1`)
2. C2(쿠폰 캠페인) URL에서 **Campaign ID** 확인  
   예: `/applications/4/campaigns/12/...` → `12`
3. `.env.local`에 추가 (값은 Git 커밋 금지):

```bash
TALON_ONE_MANAGEMENT_API_KEY=
TALON_ONE_COUPON_CAMPAIGN_ID=
```

`.env` 파일은 반드시 `.gitignore`에 포함되어야 합니다.  
`.env.example` 파일에는 키 이름만 기재하고 값은 비워두세요.

## 실행 (권장: 관리자 UI)

데모용으로는 CLI보다 **관리자 화면 버튼**이 이해하기 쉽습니다.

1. TechStore → **관리자 → Talon 쿠폰 (MAPI)** (`/admin/talon-coupons`)
2. **쿠폰 발급하기** = Management `POST .../coupons` (Create)
3. **샘플 CSV Import 실행** = Management `POST .../import_coupons`
4. 화면에 나온 코드를 장바구니에 적용 (Integration API)

## 실행 (CLI)

```bash
# 시나리오 1 — Braze 발급 시뮬레이션 (코드 1개 생성)
npm run talon:create-coupon

# 시나리오 2 — 레거시 CSV 이관
npm run talon:import-coupons
```

생성/이관된 코드는 **기존 TechStore 장바구니**에 입력해 Integration API 적용을 확인합니다.

## 검증 체크리스트

- [ ] Management Key로 Create/Import 성공
- [ ] Integration Key로는 Management 엔드포인트 실패(권한 분리)
- [ ] Dashboard Coupons에 `BRAZE-*` / `MIG-*` 표시
- [ ] 장바구니에서 할인 적용 (기존 `/api/v1/talon/session`)
- [ ] 카트 BFF 코드에 Management 호출이 없음

## 주의

- Management API는 백오피스용(낮은 RPS). 실시간 할인 경로에 넣지 마세요.
- PoC 코드 prefix: `BRAZE-` / `MIG-` — 검증 후 Dashboard에서 삭제하기 쉽습니다.
