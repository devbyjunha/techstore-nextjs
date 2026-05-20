# TechStore Next.js

Amplitude·Braze 연동이 포함된 Next.js 테크 쇼핑몰 데모입니다.

## 문서 안내

| 문서 | 내용 |
|------|------|
| **이 README** | 빠른 실행, npm·Git 명령어 |
| **[docs/PROJECT.md](./docs/PROJECT.md)** | 프로젝트 구조, 프론트/백엔드 구분, 환경 변수·Analytics 상세, Next.js/Jest 설명 |
| **[.env.example](./.env.example)** | 환경 변수 키 목록 (값은 로컬 `.env.local`에만 입력) |

상세한 아키텍처·환경 변수 설명은 README보다 **`docs/PROJECT.md`** 에 두는 것을 권장합니다. GitHub 저장소 첫 화면은 README만 보이므로, 여기서는 요약과 링크만 제공합니다.

---

## 요구 사항

- Node.js 18.18+ (권장 20 LTS)
- npm 9+

```bash
node -v && npm -v
```

---

## 빠른 시작

```bash
git clone https://github.com/devbyjunha/techstore-nextjs.git
cd techstore-nextjs
npm install

cp .env.example .env.local
# .env.local 에 Amplitude / Braze 키 입력 (없어도 앱 실행은 가능)

npm run dev    # http://localhost:3000
```

Analytics 키 발급·변수 설명 → [docs/PROJECT.md#환경-변수](./docs/PROJECT.md#환경-변수)

---

## 코드 변경 후

```bash
git pull origin main
npm install
npm run lint          # 선택
npm run test
npm run build
# EC2: pm2 restart techstore 등
```

---

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm install` | 의존성 설치 |
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 (포트 3000) |
| `npm run lint` | ESLint |
| `npm run test` | Jest 테스트 |
| `npm run test:watch` | 테스트 watch |
| `npm run test:coverage` | 커버리지 포함 테스트 |

---

## EC2 배포 (요약)

```bash
# Node 설치 후
git clone https://github.com/devbyjunha/techstore-nextjs.git
cd techstore-nextjs
npm install
# .env 작성
npm run build && npm run test

npm install -g pm2
pm2 start npm --name "techstore" -- start
pm2 save
```

업데이트: `git pull` → `npm install` → `npm run build` → `pm2 restart techstore`

자세한 내용 → [docs/PROJECT.md](./docs/PROJECT.md)

---

## Git 치트시트

원격: `https://github.com/devbyjunha/techstore-nextjs.git` · 브랜치: `main`

```bash
git status
git add .
git commit -m "설명: 변경 요약"
git push origin main

git pull origin main
git log --oneline -10
```

`git push` 503 → GitHub 일시 장애 가능, 몇 분 후 재시도.

커밋 전: `.env`가 스테이징되지 않았는지 `git status`로 확인.

---

## 프로젝트 한 줄 구조

```
src/app/          페이지 + API Routes (프론트 UI + 백엔드 API)
src/components/   UI 컴포넌트
src/context/      장바구니·로그인 상태
src/lib/          Amplitude / Braze (client=브라우저, server=API)
src/data/         정적 상품 데이터
```

프론트/백엔드 구분·데이터 흐름·이벤트 목록 → **[docs/PROJECT.md](./docs/PROJECT.md)**

---

## 저장소

https://github.com/devbyjunha/techstore-nextjs
