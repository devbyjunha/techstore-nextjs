# Braze Web Push Extra Keys → 파일 다운로드 PoC

> 📌 **프로젝트:** TechStore (Next.js)  
> **목적:** 「푸시 클릭 시 유저 기기에 이미지 자동 저장」문의에 대해, 모바일 앱 없이 **웹 푸시 + Extra Keys**로 노트북 브라우저 다운로드를 검증  
> **작성 기준:** 2026-08-26

**관련 코드**

| 파일 | 역할 |
|------|------|
| `public/service-worker.js` | Extra Key `action=save_image` 클릭 가로채기 |
| `src/lib/braze/push-save.ts` | extras 파싱, URL 허용 목록, REST 샘플 |
| `src/app/push-save/page.tsx` | 클릭 랜딩 · 다운로드 UI |
| `src/app/api/v1/push-save/route.ts` | `public/poc/push-save/` 정적 파일만 첨부 다운로드 |
| `src/app/admin/push-save-poc/page.tsx` | 로컬 알림 시뮬레이션 · 대시보드 가이드 |
| `src/lib/braze/push.ts` | 웹 푸시 권한 + 로컬 테스트 알림 |

**관리자 UI:** `/admin/push-save-poc`

---

## 한 줄 결론 (고객 문의)

| 질문 | 답 |
|------|----|
| Extra Keys로 이미지 URL·명령 전달? | **가능.** Braze는 key-value를 앱/웹에 전달만 합니다. |
| 클릭 시 휴대폰에 이미지 자동 저장? | **앱이 직접 구현하면 가능.** Braze SDK에 갤러리 저장 기능은 없습니다. 사진 권한 필요. |
| 유저마다 다른 URL? | **가능.** Custom Attribute / Catalog / Connected Content / trigger properties. |
| 클릭 없이 수신만으로 저장? | **불가에 가깝습니다.** iOS/Android/Web 모두 사용자 제스처(알림 탭)가 필요합니다. |

이 웹 PoC는 3번(개인화 URL)과 1번(extras → 클라이언트 명령)을 노트북에서 재현합니다. 카메라 롤 저장은 재현하지 않습니다.

---

## 1. 웹 PoC가 네이티브와 같은 점 / 다른 점

```
PUSH 발송
  extra.action     = save_image
  extra.image_url  = 유저별 URL
  extra.file_name  = ticket.svg
        │
        ▼
알림 클릭 (사용자 제스처)
        │
        ├─ 네이티브 앱: extras 읽고 다운로드 → Photos / MediaStore
        └─ 이 PoC (Web): extras 읽고 브라우저 다운로드 폴더에 저장
```

| | 네이티브 (문의 원안) | 이 웹 PoC |
|--|----------------------|-----------|
| Extra Keys | `apple_push.extra` / `android_push.extra` | `web_push.extra` |
| 클릭 후 동작 | 앱 코드가 갤러리에 저장 | `/push-save`가 파일 다운로드 |
| 저장 위치 | 카메라 롤 / 갤러리 | 노트북 다운로드 폴더 |
| 유저별 URL | Liquid 개인화 | 동일 + 샘플 티켓 A/B |

---

## 2. 로컬에서 바로 확인

1. `npm run dev` 후 로그인(또는 익명 세션) → `/admin/push-save-poc`
2. **알림 받기** (Chrome/Edge, localhost 허용)
3. 유저 A 또는 유저 B 선택 → **테스트 알림 보내기**
4. 시스템 알림을 **클릭**
5. `/push-save?...` 가 열리고 브라우저가 `techstore-ticket-*.svg` 를 받습니다

Braze 캠페인 없이 4번까지는 로컬 `showNotification` + 커스텀 서비스 워커만으로 됩니다. Extra Key 계약이 맞는지 먼저 검증하세요.

**바로 다운로드만 보려면**

- 랜딩: `/push-save?action=save_image&image_url=/poc/push-save/ticket-a.svg&file_name=techstore-ticket-a.svg`
- API: `/api/v1/push-save?image_url=/poc/push-save/ticket-a.svg`

---

## 3. Extra Keys 계약 (앱·웹 공통)

| Key | 값 | 설명 |
|-----|-----|------|
| `action` | `save_image` | 저장 명령. 다른 푸시와 구분 |
| `image_url` | 유저별 URL | 웹 PoC는 `/poc/push-save/*` 만 허용 |
| `file_name` | 저장 파일명 | 예: `techstore-ticket-a.svg` |

웹 서비스 워커는 `notification.data.extra` 또는 평탄화된 키를 모두 읽습니다.

### 유저마다 다른 URL

대시보드 Extra Keys:

```
action = save_image
image_url = {{custom_attribute.${ticket_image_url}}}
file_name = {{custom_attribute.${ticket_file_name}}}
```

또는 API-triggered:

```
image_url = {{api_trigger_properties.${image_url}}}
```

Connected Content로 발송 시점에 URL을 받아도 됩니다. TechStore 쿠폰 CC와 같은 패턴입니다.

속성 예시 (`POST /users/track`, 가상 데이터):

```json
{
  "attributes": [
    {
      "external_id": "shopper-a@example.com",
      "ticket_image_url": "/poc/push-save/ticket-a.svg",
      "ticket_file_name": "techstore-ticket-a.svg"
    }
  ]
}
```

---

## 4. Braze 대시보드 (Web Push)

1. Settings → Push → Web Push: VAPID 키 (이미 웹 푸시를 쓰고 있으면 생략)
2. Campaign → **Web Push**
3. Extra Keys: 위 3개 키
4. On-click: **Redirect to web URL**

```
https://YOUR_PUBLIC_HOST/push-save?action=save_image&image_url={{custom_attribute.${ticket_image_url}}}&file_name={{custom_attribute.${ticket_file_name}}}
```

On-click URL은 Braze 기본 서비스 워커가 여는 주소입니다. Extra Key와 같은 값을 넣으면, 커스텀 워커가 가로채지 못해도 랜딩이 다운로드를 수행합니다.

5. Test Send → 푸시를 허용한 브라우저로 발송 → 알림 클릭

### REST (`POST /messages/send`)

```json
{
  "external_user_ids": ["YOUR_EXTERNAL_ID"],
  "messages": {
    "web_push": {
      "title": "TechStore 티켓이 도착했습니다",
      "alert": "알림을 클릭하면 이미지가 노트북에 저장됩니다.",
      "custom_uri": "https://YOUR_PUBLIC_HOST/push-save?action=save_image&image_url=%2Fpoc%2Fpush-save%2Fticket-a.svg&file_name=techstore-ticket-a.svg",
      "extra": {
        "action": "save_image",
        "image_url": "/poc/push-save/ticket-a.svg",
        "file_name": "techstore-ticket-a.svg"
      }
    }
  }
}
```

관리자 **Braze API 테스트** (`/admin/braze-api`)의 `messages.send`에 붙여 넣을 수 있습니다.

---

## 5. 네이티브 앱 가이드 (문의 회신용)

Braze는 이미지를 기기에 저장하지 않습니다. Extra Keys를 읽고 저장하는 것은 **앱 커스텀 코드**입니다.

### 대시보드

- iOS / Android 푸시 Compose → **Key-Value Pairs (Extras)** 에 웹과 동일한 `action` / `image_url` / `file_name`
- 이미지 URL은 https, 만료·서명 URL이면 클릭 시점까지 유효해야 함

### iOS

1. `UNUserNotificationCenterDelegate` 의 알림 **응답(클릭)** 에서 `userInfo` extras 읽기
2. `action == save_image` 이면 URLSession으로 이미지 다운로드
3. `PHPhotoLibrary` 권한 후 PhotoKit으로 저장
4. Info.plist 사용 목적 문구 필수
5. Notification Service Extension은 리치 푸시 **미리보기**용입니다. 갤러리 저장 장소가 아닙니다.

### Android

1. `BrazePushNotificationClicked` / 클릭 인텐트의 extras
2. `action == save_image` 이면 다운로드
3. Android 10+ 는 `MediaStore.Images` 로 갤러리 저장 (앱 전용 저장소만이면 권한 없이 가능하지만, 사용자 갤러리 노출은 MediaStore)
4. 클릭 없이 수신만으로 저장하면 Play 정책·배터리 제한에 걸립니다.

### 개인화

유저별 URL은 웹과 동일하게 Attribute / Catalog / Connected Content / Canvas trigger properties 를 Extra 값에 Liquid로 넣습니다.

---

## 6. 보안 (웹 PoC)

- 다운로드 API는 알림 클릭이 헤더를 못 보내므로 **공개 GET** 입니다
- 읽을 수 있는 파일은 `public/poc/push-save/` + 허용 확장자만
- 경로 순회(`..`), 다른 호스트, `javascript:` 는 거부
- 임의 CDN URL 프록시는 하지 않습니다 (SSRF 방지). 운영 앱은 네이티브가 https URL을 직접 받습니다
- 샘플 티켓은 가상 유저 A/B 이며 실명·연락처가 없습니다

운영에서 유저 생성 이미지를 쓴다면 파일 다운로드 기능을 정보보안 검토 대상으로 올리는 것이 맞습니다. 이 PoC는 정적 샘플만 다룹니다.

---

## 7. 체크리스트

- [x] Extra Keys 계약 (`action`, `image_url`, `file_name`)
- [x] 서비스 워커가 extras를 읽고 `/push-save` 로 이동
- [x] 랜딩에서 브라우저 다운로드
- [x] 유저 A / 유저 B 서로 다른 에셋
- [x] 로컬 알림 시뮬레이션 (Braze 캠페인 없이)
- [ ] Braze Dashboard Web Push Test Send
- [ ] `/messages/send` 로 실유저 `external_id` 발송
- [ ] (별도) iOS/Android 앱 extras → 갤러리 저장

---

## 8. 고객 회신 초안

> Extra Keys로 이미지 URL과 저장 명령을 앱에 전달하는 것은 가능합니다. Braze 대시보드 Key-Value(또는 REST `extra`)에 `action`, `image_url`을 넣고, 앱이 알림 클릭 시 extras를 읽어 다운로드·갤러리 저장을 구현하면 됩니다. 유저별 URL은 Custom Attribute/Connected Content Liquid로 개인화합니다.
>
> 다만 **Braze SDK가 사진을 자동 저장하지는 않습니다.** 클릭 없는 백그라운드 강제 저장은 iOS/Android가 제한합니다. 웹에서는 동일 extras 계약으로 브라우저 다운로드까지 검증할 수 있습니다.
