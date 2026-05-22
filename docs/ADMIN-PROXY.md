# `/api/admin/proxy` 가이드

관리자 **Braze API 테스트** · **Amplitude API 테스트** 메뉴에서 Send 버튼을 누를 때 사용하는 API입니다.

> **요약:** TechStore의 비즈니스 API가 아니라, 브라우저가 CORS·보안 때문에 Braze/Amplitude REST를 직접 호출할 수 없을 때, **서버가 Postman처럼 대신 요청을 보내 주는 개발/테스트용 릴레이**입니다.

---

## 목차

1. [전체 흐름](#1-전체-흐름)
2. [왜 브라우저에서 직접 호출하지 않나](#2-왜-브라우저에서-직접-호출하지-나)
3. [프록시가 하는 일 (비즈니스 로직인가?)](#3-프록시가-하는-일-비즈니스-로직인가)
4. [프로젝트 내 다른 API와 비교](#4-프로젝트-내-다른-api와-비교)
5. [꼭 필요한가?](#5-꼭-필요한가)
6. [요청·응답 형식](#6-요청응답-형식)
7. [환경 변수](#7-환경-변수)
8. [관련 소스 코드](#8-관련-소스-코드)
9. [방향 정리 다이어그램](#9-방향-정리-다이어그램)

---

## 1. 전체 흐름

관리자 페이지에서 **Send**를 누르면 다음 순서로 동작합니다.

```
[관리자 브라우저]
    │
    │  POST /api/admin/proxy
    │  { url, method, bearerToken, body }
    ▼
[TechStore Next.js 서버]
    │  · URL 허용 여부 검사 (braze.com / amplitude.com 만)
    │  · JSON 본문 정리 (// 주석 제거 등)
    │  · TLS 처리 (개발 환경)
    │
    │  POST https://rest.iad-01.braze.com/users/track  (예시)
    │  Authorization: Bearer <REST API Key>
    ▼
[Braze / Amplitude REST API]
    │
    │  200 / 401 / 400 ...
    ▼
[TechStore 서버] → 응답을 UI용 JSON으로 감싸서 브라우저에 반환
```

- **Braze 입장:** 요청 주체는 **TechStore 서버(Node)** 입니다.
- **브라우저 입장:** 같은 출처(예: `localhost:3000`, 배포 도메인)로만 통신합니다.

큰 그림에서는 **「외부 API 호출」이 맞고**, 그 호출을 **브라우저가 직접 하지 못해** 중간에 우리 API가 끼어 있습니다.

---

## 2. 왜 브라우저에서 직접 호출하지 않나?

Postman·curl처럼 **터미널/데스크톱 앱**에서 호출하면 프록시가 필요 없습니다.  
**웹 관리자 화면** 안에서 Send로 테스트하려면 보통 아래 이유로 서버 경유가 필요합니다.

### 2.1 CORS (가장 흔한 이유)

브라우저는 보안상 **다른 도메인**으로의 `fetch`를 제한합니다.

| 출발 | 도착 | 결과 |
|------|------|------|
| `https://your-shop.com` | `https://rest.iad-01.braze.com` | Braze가 `Access-Control-Allow-Origin`을 주지 않으면 **브라우저가 차단** |

Braze REST API는 **서버·백엔드 연동용**이라, 쇼핑몰 관리자 페이지 origin에서의 직접 호출을 허용하지 않는 경우가 많습니다.

| 도구 | CORS | Braze 직접 호출 |
|------|------|-----------------|
| Postman / curl | 없음 | 가능 |
| 관리자 웹 UI | 있음 | 불가 → `/api/admin/proxy` 필요 |

### 2.2 API Key 노출

관리자 화면에 입력한 **Braze REST API Key**를 브라우저 JavaScript로 Braze에 직접내면:

- DevTools Network 탭에 키가 노출되고
- 클라이언트 번들·로그에 남을 수 있습니다.

프록시를 쓰면 **브라우저 → 우리 서버** 구간만 보이고, 서버 → Braze 구간의 Bearer는 상대적으로 덜 드러납니다.

> **참고:** 운영 연동용 `/api/users/track`은 API 키를 **서버 `.env`에만** 두고, 클라이언트는 키 없이 우리 API만 호출합니다. 이것이 프로덕션에서 권장되는 패턴입니다.

### 2.3 개발 PC TLS 문제 (`fetch failed`)

회사 VPN·보안 프록시 환경에서는 **Node.js → Braze** HTTPS 연결 시 `SELF_SIGNED_CERT_IN_CHAIN` 등으로 실패할 수 있습니다.

- 터미널 `curl` → 성공하는 경우가 많음
- Next.js 서버 `fetch` → 실패 → UI에 `fetch failed` / 500

이 경우 요청은 **서버**에서 나가므로, `ADMIN_PROXY_INSECURE_TLS=true` 같은 **서버 측** 설정으로 우회할 수 있습니다. (`src/lib/admin/proxy-fetch.ts`)

---

## 3. 프록시가 하는 일 (비즈니스 로직인가?)

**아닙니다.** 쇼핑몰 상품·주문·Webhook 수신과는 **무관**합니다.

| 단계 | 동작 |
|------|------|
| 1 | UI가 보낸 `url`, `method`, `bearerToken`, `body` 수신 |
| 2 | **URL 화이트리스트** — `*.braze.com`, `*.amplitude.com` HTTPS만 허용 (SSRF 방지) |
| 3 | JSON 본문 **주석 제거·검증** (`//` 주석 등 비표준 JSON 처리) |
| 4 | 서버에서 `fetch` / `https`로 대상 API 호출 |
| 5 | 응답을 `{ ok, status, statusText, durationMs, headers, data }` 형태로 UI에 반환 |

다음과 같은 일은 **하지 않습니다.**

- Braze 요청 포맷을 우리 비즈니스 규칙으로 변환
- DB 저장, 캠페인 생성, 사용자 세션 처리
- TechStore 상품/주문 데이터 조회

**전달자(relay) + 최소한의 안전·개발 편의**에 가깝습니다.

---

## 4. 프로젝트 내 다른 API와 비교

| API | 목적 | 호출 주체 | 외부 키 위치 |
|-----|------|-----------|--------------|
| **`POST /api/admin/proxy`** | 관리자 API 테스트 (Postman 대체) | 관리자 브라우저 | UI 입력값을 **그대로 전달** |
| **`POST /api/users/track`** | 쇼핑몰 Braze 연동 (로그인 등) | 우리 프론트 → 우리 서버 | **서버 `.env`만** |
| **`POST /api/2/httpapi`** | 쇼핑몰 Amplitude 서버 전송 | 우리 프론트 → 우리 서버 | **서버 `.env`만** |
| **`GET /api/v1/*`** | 외부가 TechStore 데이터 조회·Webhook | Braze Webhook, 외부 시스템 | `TECHSTORE_API_KEY` 등 |

### 이름이 비슷해 보이는 이유

- Braze 공식 경로: `POST /users/track`
- 우리 연동 API: `POST /api/users/track` (서버가 Braze로 전달)
- 관리자 프록시: UI에서 **임의 URL** (예: `https://rest.../users/track`)을 `/api/admin/proxy`에 넘김

**같은 Braze 엔드포인트를 치더라도**, 용도·키 관리·호출 경로가 다릅니다.

---

## 5. 꼭 필요한가?

| 상황 | `/api/admin/proxy` 필요 여부 |
|------|------------------------------|
| 관리자 **웹 UI**에서 Send로 Braze/Amplitude 테스트 | **필요** (CORS·키·TLS) |
| Postman / curl / Braze 대시보드만 사용 | **불필요** |
| 쇼핑몰 운영(장바구니, 로그인 이벤트) | **무관** → `/api/users/track`, Web SDK |
| Braze Webhook이 **우리** API 호출 | **무관** → `/api/v1/webhooks/braze` (반대 방향) |

### 한 문장 정리

> `/api/admin/proxy`는 TechStore 비즈니스 API가 아니라, **관리자 브라우저용 API 테스트 UI**가 동작하기 위한 **개발/테스트 전용 릴레이**이다.

---

## 6. 요청·응답 형식

### 요청 (브라우저 → 우리 서버)

`POST /api/admin/proxy`

```json
{
  "url": "https://rest.iad-01.braze.com/users/track",
  "method": "POST",
  "bearerToken": "YOUR_BRAZE_REST_API_KEY",
  "body": "{\"attributes\":[{\"external_id\":\"test\"}]}"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `url` | O | 호출할 전체 URL (braze.com / amplitude.com 만) |
| `method` | O | GET, POST, PUT, PATCH, DELETE |
| `bearerToken` | X | Braze REST Bearer (있으면 Authorization 헤더에 설정) |
| `headers` | X | 추가 헤더 |
| `body` | X | 문자열 JSON (GET/DELETE 시 생략 가능) |

### 응답 (우리 서버 → 브라우저)

성공 시 예시:

```json
{
  "ok": true,
  "status": 201,
  "statusText": "Created",
  "durationMs": 342,
  "headers": { "content-type": "application/json" },
  "data": { "message": "success" }
}
```

실패 시 (연결/TLS 등):

```json
{
  "error": "fetch failed: self-signed certificate in certificate chain\n\n..."
}
```

---

## 7. 환경 변수

| 변수 | 용도 |
|------|------|
| `ADMIN_PROXY_INSECURE_TLS=true` | **개발 전용.** Node → Braze/Amplitude TLS 검증 완화. 프로덕션 사용 금지. |
| `BRAZE_REST_API_KEY` | `/api/admin/proxy`와 **무관**. `/api/users/track` 연동용. |
| `AMPLITUDE_API_KEY` | `/api/admin/proxy`와 **무관**. `/api/2/httpapi` 연동용. |

관리자 API 테스트 UI에서는 키를 **화면에 입력**하고, 프록시가 요청 body의 `bearerToken`으로 Braze에 전달합니다.

---

## 8. 관련 소스 코드

| 파일 | 역할 |
|------|------|
| `src/app/api/admin/proxy/route.ts` | 프록시 Route Handler (URL 검증, forward, 응답 포맷) |
| `src/lib/admin/proxy-fetch.ts` | 서버 → 외부 HTTPS `fetch` (TLS 우회 옵션) |
| `src/lib/admin/json-body.ts` | JSON 주석 제거·검증 |
| `src/components/admin/ApiTester.tsx` | 관리자 UI → `/api/admin/proxy` 호출 |
| `src/app/admin/braze-api/page.tsx` | Braze API 테스트 페이지 |
| `src/app/admin/amplitude-api/page.tsx` | Amplitude API 테스트 페이지 |

---

## 9. 방향 정리 다이어그램

```
[운영·연동]   쇼핑몰 ──► /api/users/track ──► Braze        (고정, env 키)
[운영·연동]   쇼핑몰 ──► /api/2/httpapi ──► Amplitude     (고정, env 키)
[브라우저 SDK] 쇼핑몰 ──► Braze/Amplitude SDK (직접)

[외부 → 우리] Braze Webhook ──► /api/v1/webhooks/braze
[외부 → 우리] 외부 시스템 ──► /api/v1/products 등

[테스트만]    관리자 UI ──► /api/admin/proxy ──► Braze/Amplitude (임의 URL·UI 키)
```

---

## 관련 문서

- [PROJECT.md](./PROJECT.md) — 프로젝트 전체 구조
- 관리자 **API 문서** (`/admin/api-docs`) — TechStore Public API (`/api/v1/*`) 목록
- [Braze Users Track](https://www.braze.com/docs/api/endpoints/user_data/post_user_track/)
- [Amplitude HTTP V2](https://amplitude.com/docs/apis/analytics/http-v2)
