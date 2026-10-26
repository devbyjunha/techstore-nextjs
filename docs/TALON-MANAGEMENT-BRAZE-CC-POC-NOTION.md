# TechStore × Talon Management API × Braze Connected Content PoC

> **Notion에 넣을 때:** 채팅/코드블록에 붙여넣지 마세요.  
> Notion → **Import** → **Markdown & CSV** → 이 파일 업로드  
> (또는 빈 페이지에 텍스트로 Cmd+V — `/code` 블록 금지)

> **프로젝트:** TechStore (Next.js)  
> **목적:** Management API로 쿠폰 적재·발급 + Braze IAM Connected Content로 Create 연동  
> **환경:** Talon.One App `TechStore` (ID `4`, KRW) · 쿠폰 캠페인 ID `18`  
> **작성 기준:** 2026-08-13  
> **관련 문서:** `TALON-ONE-POC-NOTION.md` (Integration API 세션 PoC), `BRAZE-TALON-CONNECTED-CONTENT-IAM.md`

---

## 1. PoC 한 줄 요약

- **Integration API:** 장바구니에서 쿠폰·할인 **실시간 평가** (기존 PoC)
- **Management API:** 쿠폰 **생성(Create)** · **CSV Import** (백오피스)
- **Braze Connected Content:** 메시지 발송 시 TechStore BFF를 거쳐 Talon **Create** → IAM에 코드 표시

역할: Braze = 발급·전달 / Talon = 규칙·적용 / TechStore = BFF·UI

---

## 2. Integration vs Management (복습)

| | Integration API | Management API |
|--|-----------------|----------------|
| 한 줄 | 손님 앞 계산대 | 본사 발권·이관 |
| 인증 | `ApiKey-v1` | `ManagementKey-v1` |
| 용도 | 세션 평가, 쿠폰 적용, close | 쿠폰 Create/Import, 캠페인 관리 |
| 호출 주체 | 카트 BFF | 어드민·배치·Connected Content BFF |
| RPS | 실시간·고부하 | 백오피스 (~3 req/s) |
| 카트 경로 | ✅ 사용 | ❌ 사용 금지 |

```
[준비] Management: Create / Import → Talon에 코드 적재
              ↓
[런타임] Integration: 장바구니에 코드 입력 → 할인 effect
```

---

## 3. 이번에 검증한 시나리오

### 3.1 Dashboard CSV Import (UI)

| 항목 | 내용 |
|------|------|
| 목적 | 레거시 쿠폰 이관 (Go-live 전)을 UI로 체험 |
| 방법 | Campaign 18 → Coupons → Import Coupons → CSV 업로드 |
| Management API? | ❌ UI Import (API와 동일 목적·다른 진입점) |
| 샘플 파일 | `scripts/talon-management/sample-legacy-coupons.csv` |

**CSV 제약 (실측·문서)**

- `value` 필수, 최소 3자
- `expirydate`는 **미래**만 Import 가능 (과거 만료일 거부)
- 날짜: ISO-8601 / RFC3339 (예: `2026-12-31T23:59:59+09:00`)
- 중복 코드 주의
- `recipientintegrationid` 있으면 해당 profile만 사용 가능 → `CouponRecipientDoesNotMatch`
- `discountlimit`이 너무 작으면 고가 카트에서 limit/effect 거절 가능

**캠페인 전제:** Import한 캠페인이 **Running**이어야 적용됨. 규칙 없으면 Activate 불가 → Rule: “Coupon code is valid” + Discount.

### 3.2 Management API Import (스크립트 → 관리자 UI)

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /v1/applications/{appId}/campaigns/{campaignId}/import_coupons` |
| 인증 | `ManagementKey-v1` (Account → Tools → Management API keys) |
| Allowed endpoints | `.../coupons (POST…)` + `.../import_coupons (POST)` |
| CLI | `npm run talon:import-coupons -- ./scripts/talon-management/sample-mapi-import-coupons.csv` |
| 관리자 | `/admin/talon-coupons` → 샘플 Import / Bulk Import |

### 3.3 Management API Create (발급)

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /v1/applications/{appId}/campaigns/{campaignId}/coupons` |
| 패턴 | `BRAZE-######` (1회용) |
| 관리자 | `/admin/talon-coupons` → **쿠폰 발급하기** |
| CLI | `npm run talon:create-coupon` |

### 3.4 Braze Connected Content → Talon Create

```
Braze IAM
  → POST /api/v1/connected-content/coupon
  → (멱등 키로 중복이면 기존 코드 반환, Talon 재호출 없음)
  → 신규면 Talon Management Create
  → { coupon_code, source: "talon" }
  → IAM에 코드 표시
  → 장바구니 Integration 적용
```

| 항목 | 내용 |
|------|------|
| BFF | `POST /api/v1/connected-content/coupon` |
| 멱등 키 | `campaign_api_id` + `dispatch_id` + `promotion_id` + `user_id` |
| Talon | `recipientIntegrationId` = Braze `user_id` |
| 이력 | `/admin/coupon-issuances` (`source`: Talon / local) |
| 직접 Talon 호출? | ❌ 권장하지 않음 (키 노출·멱등·관측). BFF 경유 |

**Vercel 스모크 성공 예**

- `"source": "talon"`
- `"coupon_code": "BRAZE-…"`
- message: Talon.One에서 발급되었습니다

---

## 4. 구현·파일 맵

### 4.1 Management / 어드민

| 경로 | 역할 |
|------|------|
| `src/lib/talon/management-client.ts` | Management Create / Import / Bulk |
| `src/lib/talon/config.ts` | `getTalonManagementConfig()` |
| `src/app/api/admin/talon/coupons/create` | 어드민 Create API |
| `src/app/api/admin/talon/coupons/import` | 샘플 CSV Import |
| `src/app/api/admin/talon/coupons/import-bulk` | Bulk Import (최대 100건/클릭) |
| `src/app/admin/talon-coupons/page.tsx` | 관리자 UI + 제약 안내 |
| `scripts/talon-management/*` | CLI PoC 스크립트·샘플 CSV |

### 4.2 Braze Connected Content

| 경로 | 역할 |
|------|------|
| `src/app/api/v1/connected-content/coupon/route.ts` | CC 진입점 |
| `src/lib/braze/coupon-idempotency.ts` | 멱등 + Talon Create 호출 |
| `src/lib/braze/coupon-response.ts` | `coupon_code`, `source` 응답 |
| `src/app/admin/coupon-issuances` | 발급 이력 (Source 컬럼) |
| `docs/BRAZE-TALON-CONNECTED-CONTENT-IAM.md` | IAM Liquid 상세 |

### 4.3 기존 Integration (변경 없음·런타임 적용)

| 경로 | 역할 |
|------|------|
| `src/lib/talon/client.ts` | Integration 세션/프로필 |
| `POST /api/v1/talon/session` | 장바구니 평가 |

---

## 5. 환경 변수

`.env` / Vercel에 설정. **값을 Git에 커밋하지 말 것.**

| Key | 용도 |
|-----|------|
| `TALON_ONE_BASE_URL` | Deployment URL |
| `TALON_ONE_API_KEY` | Integration API |
| `TALON_ONE_APPLICATION_ID` | `4` |
| `TALON_ONE_LOYALTY_PROGRAM_ID` | (기존) |
| `TALON_ONE_MANAGEMENT_API_KEY` | Management API |
| `TALON_ONE_COUPON_CAMPAIGN_ID` | 쿠폰 캠페인 `18` |
| `BRAZE_WEBHOOK_SECRET` | Connected Content 인증 |

Management Key 발급: **Account → Tools → Management API keys**  
(Application Settings의 Integration API Keys와 다름)

Vercel: env 추가 후 **Redeploy** 필수.

---

## 6. Bulk / Import 제약 (공식·PoC)

### Import coupons (`import_coupons`)

- CSV multipart, `value` 필수 (최소 3자)
- 파일 크기 권장 ≤ **~500MB**
- 코드 유니크 (또는 `skipDuplicates`)
- `expirydate` **미래**만
- 코드 길이 UI 가독성 **30자 이하** 권장
- Management API ~ **3 req/s**

### Create coupons

| API | 한도 |
|-----|------|
| 동기 `…/coupons` | ≤ 20,000 (unique prefix 시 ≤ 200,000) |
| async `…/coupons_async` | ≤ ~5,000,000 (20,001+ 권장) |
| `coupons_with_recipients` | ≤ 1,000 recipients/요청 |

### 이 PoC 추가 제한

- 관리자 Bulk Import: **최대 100건/클릭**
- 클릭마다 유니크 prefix (`BULK-{timestamp}-…`)로 중복 Import 회피

---

## 7. Braze IAM 설정 요약

| 항목 | 값 |
|------|-----|
| Channel | In-App Message (Modal) |
| CC URL | `https://YOUR_HOST/api/v1/connected-content/coupon?webhook_secret=…` |
| Method | **POST** (GET은 캐시 대상) |
| `:retry` | **IAM에서 사용 불가** → 제거 |
| `dispatch_id` Liquid | IAM 검증에서 거절될 수 있음 → **고정 문자열** 사용 권장 |
| `user_id` | `{{${user_id}}}` (external_id) |

### Body Liquid 초안 (IAM용)

```liquid
{% connected_content https://tstore-nextjs.vercel.app/api/v1/connected-content/coupon?webhook_secret=YOUR_SECRET :method post :headers {"Content-Type": "application/json"} :body {"campaign_api_id":"{{campaign.${api_id}}}","dispatch_id":"gold-welcome-iam-poc","promotion_id":"gold-welcome-2026","user_id":"{{${user_id}}}","discount_percent":10} :content_type application/json :save coupon %}
{% if coupon.success == true %}
{{${first_name} | default: '고객'}}님, TechStore 전용 할인 쿠폰이 발급되었습니다.

쿠폰 코드
{{coupon.coupon_code}}

장바구니에서 위 코드를 입력하면 할인이 적용됩니다.
{% else %}
쿠폰 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.
{% endif %}
```

**Header 예:** `환영 쿠폰이 도착했어요`  
**Button:** 장바구니로 이동 → `/cart`

### Braze에서 겪은 오류와 대응

| 오류 | 대응 |
|------|------|
| `dispatch_id` is not valid | Liquid `campaign.${dispatch_id}` 제거 → 고정 문자열 |
| `:retry` not available for this message type | `:retry` 삭제 |
| CC 실패 / local fallback | Vercel에 Management·Webhook env + Redeploy |

### Talon을 Braze에서 직접 호출?

기술적으로 가능하나 **비권장**: Management Key 노출, CC 중복 호출 시 다량 Create, 응답 파싱·이력 부재. **TechStore BFF 경유**가 PoC·운영 모두 적합.

---

## 8. 데모 순서 (발표용)

1. **Integration 복습:** 장바구니 → 캠페인 15(임계)/쿠폰 적용  
2. **Dashboard Import:** CSV → Coupons 목록 → `MIG-OPEN-OK` 적용  
3. **관리자 Create:** `/admin/talon-coupons` → 발급 → `BRAZE-…` → 장바구니  
4. **관리자 Bulk Import:** 20건 → Dashboard에 `BULK-…`  
5. **Braze IAM:** Test Send → IAM에 `BRAZE-…` → 장바구니 적용  
6. **이력:** `/admin/coupon-issuances`에서 `source=Talon`  
7. **멱등:** 동일 키 재호출 → `status=duplicate`, 동일 코드

---

## 9. 체크리스트

### Management API

- [x] Management API Key 발급 (Coupons Create + Import)
- [x] Campaign 18 Running + Coupon valid 룰
- [x] Dashboard CSV Import
- [x] CLI / 관리자 Import
- [x] 관리자 Create
- [x] Bulk Import UI + 제약 문구

### Braze × Talon

- [x] Connected Content → Talon Create 연동 (코드)
- [x] Vercel 배포 + env (`BRAZE_WEBHOOK_SECRET`, Management 키 등)
- [x] curl로 `source=talon` / `BRAZE-…` 확인
- [ ] Braze IAM 캠페인 Launch + 실기기/웹에서 IAM 표시 확인
- [ ] IAM 표시 코드를 장바구니에서 적용 확인

### 운영 주의

- [ ] Management Key / Integration Key 분리 보관
- [ ] 카트 경로에 Management 호출 없음
- [ ] 시크릿을 Git·공개 Liquid에 장기 방치하지 않기 (PoC 후 로테이션)

---

## 10. 참고 링크

| 문서 | URL / 경로 |
|------|------------|
| Management API overview | https://docs.talon.one/docs/dev/management-api/overview |
| Import coupons | https://docs.talon.one/docs/dev/tutorials/import-coupon-codes |
| Manage Management API keys | https://docs.talon.one/docs/product/account/dev-tools/manage-mapi-keys |
| Integration 세션 PoC (Notion용) | `docs/TALON-ONE-POC-NOTION.md` |
| IAM Liquid 상세 | `docs/BRAZE-TALON-CONNECTED-CONTENT-IAM.md` |
| Notion Import 방법 | `docs/TALON-ONE-POC-NOTION-IMPORT.md` |
| 관리자 MAPI UI | `/admin/talon-coupons` |
| 발급 이력 | `/admin/coupon-issuances` |

---

## 11. 한 줄 결론

> **레거시 코드는 Management Import(또는 Dashboard CSV)로 넣고, 신규 발급은 Braze Connected Content → TechStore BFF → Talon Create로 만들며, 손님의 적용·할인은 항상 Integration API(장바구니)로 한다.**
