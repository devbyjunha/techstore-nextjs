# Braze IAM × Connected Content × Talon Create PoC

**시나리오:** GOLD/로그인 환영 쿠폰 — Braze IAM으로 코드 표시 → TechStore 장바구니에서 Talon 적용.

```
Braze IAM
  → Connected Content POST /api/v1/connected-content/coupon
  → Talon Management Create (BRAZE-******)
  → IAM에 coupon_code 표시
  → 장바구니 Integration API 적용
```

---

## 1. Connected Content (Braze Compose)

**권장: POST** (GET은 Braze 캐시 대상).

URL 예 (공개 HTTPS 필요 — 로컬은 ngrok 등):

```text
https://YOUR_PUBLIC_HOST/api/v1/connected-content/coupon?webhook_secret=YOUR_BRAZE_WEBHOOK_SECRET
```

또는 헤더 `X-Braze-Webhook-Secret: …` / `Authorization: Bearer <TECHSTORE_API_KEY>`.

### Connected Content Liquid (메시지 상단)

변수명은 Braze UI에서 지정한 별칭에 맞춥니다. 아래는 별칭을 `coupon`으로 둔 예입니다.

```liquid
{% connected_content https://YOUR_PUBLIC_HOST/api/v1/connected-content/coupon?webhook_secret=YOUR_SECRET :method post :headers {"Content-Type": "application/json"} :body campaign_api_id={{campaign.${api_id}}}&dispatch_id={{campaign.${dispatch_id}}}&promotion_id=gold-welcome-2026&user_id={{${user_id}}}&discount_percent=10 :content_type application/json :save coupon %}
```

JSON body를 쓰는 환경이라면 Compose의 Connected Content에서 **Raw JSON body**로:

```json
{
  "campaign_api_id": "{{campaign.${api_id}}}",
  "dispatch_id": "{{campaign.${dispatch_id}}}",
  "promotion_id": "gold-welcome-2026",
  "user_id": "{{${user_id}}}",
  "discount_percent": 10
}
```

`:save coupon` 후 응답 필드:

| 필드 | 용도 |
|------|------|
| `{{coupon.coupon_code}}` | IAM에 표시할 코드 |
| `{{coupon.status}}` | `issued` / `duplicate` |
| `{{coupon.source}}` | `talon` / `local` |
| `{{coupon.message}}` | 안내 문구 |

발급 실패 시 IAM이 깨지지 않게:

```liquid
{% if coupon.success %}
{% else %}
{% abort_message('coupon issuance failed') %}
{% endif %}
```

---

## 2. IAM 문구 초안 (한글)

**채널:** In-App Message · Modal 또는 Slideup  
**트리거 (PoC):** Test Send / 로그인 직후 Session Start  
**Audience:** `external_id` 있는 유저

### 제목

```text
환영 쿠폰이 도착했어요
```

### 본문

```liquid
{{${first_name} | default: '고객'}}님, TechStore 전용 할인 쿠폰이 발급되었습니다.

쿠폰 코드
{{coupon.coupon_code}}

장바구니에서 코드를 입력하면 할인이 적용됩니다.
{% if coupon.status == 'duplicate' %}
(이미 발급된 코드를 다시 보여드립니다.)
{% endif %}
```

### 버튼

| 버튼 | 동작 |
|------|------|
| 장바구니로 이동 | Deep link / URL: `https://YOUR_STORE_HOST/cart` |
| 닫기 | Dismiss |

### 짧은 Slideup 버전

```liquid
쿠폰 {{coupon.coupon_code}} — 장바구니에서 적용하세요
```

---

## 3. 캠페인 설정 체크리스트

- [ ] Channel = **In-App Message**
- [ ] Connected Content URL이 공개 HTTPS로 도달 가능
- [ ] `.env`에 `TALON_ONE_MANAGEMENT_API_KEY` + `TALON_ONE_COUPON_CAMPAIGN_ID` (캠페인 18)
- [ ] Talon 캠페인 18 Running + “Coupon code is valid” 룰
- [ ] TechStore 로그인 → Braze `changeUser(email)` = CC의 `user_id`
- [ ] 발급 후 `/admin/coupon-issuances`에서 `source=Talon` 확인
- [ ] Dashboard Coupons에 `BRAZE-******` 표시
- [ ] 장바구니에 동일 코드 적용

---

## 4. 로컬 스모크 (Braze 없이)

```bash
curl -sS -X POST "http://localhost:3000/api/v1/connected-content/coupon" \
  -H "Content-Type: application/json" \
  -H "X-Braze-Webhook-Secret: $BRAZE_WEBHOOK_SECRET" \
  -d '{
    "campaign_api_id": "test-camp",
    "dispatch_id": "test-disp-1",
    "promotion_id": "gold-welcome-2026",
    "user_id": "demo@example.com",
    "discount_percent": 10
  }'
```

응답의 `coupon_code` / `source`를 확인한 뒤 장바구니에 넣습니다.
