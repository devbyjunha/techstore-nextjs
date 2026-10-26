# Web SDK IAM Pseudo Control Group 구현안

## 목적

실제 Braze Control Group 대신 일반 IAM Variant를 대조군으로 사용합니다.

- 실행군 Variant: IAM UI 노출
- 대조군 역할 Variant: impression만 기록하고 UI 미노출
- 일반 Variant이므로 Liquid 사용 가능

> 대조군 Variant의 impression은 실제 화면 노출이 아닌, 브라우저가 IAM을 수신하고 대조군으로 판정된 시점에 기록됩니다.

## Campaign 설정

Campaign의 기본 Control Group은 사용하지 않습니다.

| Variant | Extra key | Extra value |
|---|---|---|
| 실행군 A | `experiment_group` | `tg_a` |
| 실행군 B | `experiment_group` | `tg_b` |
| 대조군 역할 Variant | `experiment_group` | `cg` |

대조군 Variant에는 `{% abort_message %}`를 사용하지 않습니다. Abort되면 브라우저가 IAM을 받지 못해 수동 impression을 기록할 수 없습니다.

## Braze SDK 초기화

`IamExperimentWrapper.install()`은 `braze.openSession()` 전에 실행합니다.

```typescript
// braze.ts
import * as braze from "@braze/web-sdk";
import { IamExperimentWrapper } from "./IamExperimentWrapper";

braze.initialize("YOUR_BRAZE_WEB_SDK_API_KEY", {
  baseUrl: "YOUR_BRAZE_SDK_ENDPOINT",
});

// 호출하지 않음
// braze.automaticallyShowInAppMessages();

new IamExperimentWrapper().install();

braze.openSession();
```

## IamExperimentWrapper

```typescript
// IamExperimentWrapper.ts
import * as braze from "@braze/web-sdk";

export class IamExperimentWrapper {
  private readonly loggedControlMessages = new WeakSet<object>();

  install(): void {
    braze.subscribeToInAppMessage((message) => {
      const experimentGroup = message.extras?.experiment_group;

      // CG 역할의 일반 IAM Variant:
      // impression만 수동 기록하고 UI는 표시하지 않음
      if (experimentGroup === "cg") {
        if (!this.loggedControlMessages.has(message)) {
          this.loggedControlMessages.add(message);
          message.logImpression();
        }

        return;
      }

      // `experiment_group`가 없거나 tg_a, tg_b 등인 IAM은 표시
      braze.showInAppMessage(message);
    });
  }
}
```

## 처리 결과

| IAM 유형 | 처리 | UI 노출 | Impression |
|---|---|---:|---:|
| `experiment_group: "cg"` | `message.logImpression()` 후 종료 | 아니요 | 수동 기록 |
| `experiment_group: "tg_a"` | `showInAppMessage()` | 예 | SDK 자동 기록 |
| `experiment_group` 없음 | `showInAppMessage()` | 예 | SDK 자동 기록 |

## 유의사항

- 이 Wrapper는 Android의 `DefaultInAppMessageViewWrapper`와 다른 애플리케이션 레벨 분기 로직입니다.
- Web SDK에서는 `subscribeToInAppMessage()`가 IAM 표시 여부를 제어하는 공식 지점입니다.
- 실행군에 수동 `logImpression()`과 `showInAppMessage()`를 함께 호출하지 않습니다. 자동 impression과 중복될 수 있습니다.
- `experiment_group: "cg"`를 다른 용도로 쓸 수 있다면 `iam_experiment_group`처럼 전용 Extra key를 사용합니다.

## Related docs

- [Trigger In-App Messages](https://www.braze.com/docs/developer_guide/in_app_messages/triggering_messages)
- [Conditionally Display In-App Messages](https://www.braze.com/docs/developer_guide/in_app_messages/tutorials/conditionally_displaying_messages)
- [In-App Message Reporting](https://www.braze.com/docs/user_guide/channels/in_app_messages/reporting)