# TechStore × Talon.One 부분 할인 Budget PoC

> **목적:** 캠페인 Budget 잔액이 원래 할인 예정액보다 적을 때, 전체 할인을 거절하는 대신 잔액까지만 할인을 적용하고 사용자에게 부분 적용 사실을 안내한다.
>
> **대상 캠페인:** ID 15 `Cart Threshold 10%`, ID 16 `Coupon WELCOME10`
>
> **상태:** Talon.One Dashboard 설정과 TechStore 응답 매핑 변경 필요

---

## 1. 기대 동작

장바구니 44,900,000원의 10% 할인 예정액은 4,490,000원이다. 대상 캠페인의 `Discount Total` Budget 잔액이 2,000,000원이라면 Talon.One이 2,000,000원만 할인으로 반환하고, TechStore는 실제 반환된 금액을 결제 금액에 반영한다.

| 항목 | 예시 |
|---|---:|
| 장바구니 금액 | 44,900,000원 |
| 원래 할인 예정액 | 4,490,000원 |
| 캠페인 Budget 잔액 | 2,000,000원 |
| 실제 적용 할인액 | 2,000,000원 |
| 할인 후 금액 | 42,900,000원 |

사용자 알림 예시:

> 캠페인 예산 잔액에 따라 일부 할인이 적용되었습니다. 2,000,000원 할인 (원래 할인 예정액 4,490,000원)

---

## 2. Talon.One Dashboard 설정

### Application 기본 설정

1. Talon.One에서 TechStore Application을 연다.
2. **Settings → General Settings**로 이동한다.
3. **Partial discounts and rewards**를 활성화한다.

이 설정은 Application의 기본값이다. 특정 효과에서 기본값을 덮어쓸 수도 있다. [Talon.One: Partial discounts and rewards](https://docs.talon.one/docs/product/applications/manage-general-settings)

### 캠페인별 Discount effect 설정

Campaign 15와 16 각각의 할인 Rule을 확인한다.

1. **Rule Builder**에서 `Discount session total` effect를 연다.
2. **Advanced Settings → Allow lower discount value if budget is insufficient**를 확인한다.
3. **Yes**로 설정한다. Application 기본 설정을 사용하려면 `Application Default Settings`를 선택한다.

`Discount session total`은 Integration API에서 `setDiscount` effect로 반환된다. [Talon.One: Discount session total effect](https://docs.talon.one/docs/product/rules/effects/use-effects)

> **주의:** 잔액이 0원이면 부분 할인도 적용되지 않는다. 같은 effect에 여러 Budget 제한이 있으면 가장 제한적인 Budget이 적용된다. [Talon.One: Campaign budgets](https://docs.talon.one/docs/product/campaigns/settings/manage-campaign-budgets)

---

## 3. Talon.One 응답에서 읽을 값

부분 할인이 적용되면 `setDiscount.props`에 실제 적용액 `value`와 Budget 제한이 없을 때의 원래 할인액 `desiredValue`가 반환된다.

```json
{
  "effectType": "setDiscount",
  "campaignId": 15,
  "props": {
    "name": "Cart total 50k 10%",
    "value": 2000000,
    "desiredValue": 4490000
  }
}
```

- `value`: 결제 금액에서 차감할 실제 할인액
- `desiredValue`: Budget 제한 전 원래 할인 예정액
- 부분 적용 판별: `desiredValue > value`

API 문서는 부분 할인 시 `desiredValue`가 원래 할인 금액을 나타낸다고 정의한다. [Talon.One Integration API: Effects](https://docs.talon.one/docs/dev/integration-api/api-effects)

---

## 4. TechStore 개발 변경 사항

현재 TechStore는 Talon.One effect의 `props.value`를 할인액으로 합산해 장바구니와 결제 금액에 반영한다. `desiredValue`는 정규화된 effect 타입에 포함하지 않아 부분 할인 안내는 아직 표시하지 않는다.

| 파일 | 변경 내용 |
|---|---|
| `src/lib/talon/types.ts` | `TalonDiscountEffect`에 `desiredValue?: number` 추가 |
| `src/lib/talon/map-effects.ts` | `props.desiredValue`를 보존하고, 합계 할인액은 계속 실제 적용액 `props.value`로 계산 |
| `src/lib/talon/notifications.ts` | 캠페인별 실제 할인액과 예정액을 비교해 부분 할인 안내 생성 |
| `src/app/cart/page.tsx` | 주문 요약에 부분 할인 안내 표시 |
| `src/app/checkout/page.tsx` | 결제 요약에 동일한 안내 표시 |

### 금액 적용 원칙

- 결제 금액에는 Talon.One이 반환한 `value`만 적용한다.
- `desiredValue`는 표시와 비교에만 사용한다.
- `desiredValue > value`인 캠페인에 한해 부분 할인 안내를 표시한다.
- Campaign 15와 16이 모두 부분 할인되면 캠페인별로 각각 표시한다.
- 안내는 주문 요약/결제 요약에만 표시하고 toast와 중복하지 않는다.
- 예산 잔액이 0원이어서 effect가 반환되지 않으면 기존 캠페인 실패 안내를 유지한다.

---

## 5. 검증 시나리오

| 시나리오 | 예상 결과 |
|---|---|
| Budget 잔액 2,000,000원, 10% 할인 예정액 4,490,000원 | 실제 할인 2,000,000원, 부분 할인 안내 표시 |
| Budget 잔액이 예정 할인액보다 충분함 | 원래 할인액 전액 적용, 부분 할인 안내 없음 |
| Budget 잔액 0원 | 할인 effect 미반환, 캠페인 실패 안내 표시 |
| Campaign 15와 16에서 각각 부분 할인 발생 | 실제 반환된 각 `value`의 합만 할인하고 캠페인별 안내 표시 |
| Campaign 17 GOLD 조건 미충족 | 부분 할인으로 처리하지 않고 기존 조건 미충족 안내 표시 |

---

## 6. 적용 순서

1. Talon.One Application의 **Partial discounts and rewards**를 활성화한다.
2. Campaign 15와 16의 `Discount session total` effect에서 budget 부족 시 낮은 할인액 허용 설정을 확인한다.
3. TechStore가 `desiredValue`를 보존하고 실제 할인액과 비교하도록 변경한다.
4. 장바구니와 결제 요약에 부분 할인 안내를 표시한다.
5. 각 캠페인의 잔액을 조정해 검증 시나리오를 확인한다.
