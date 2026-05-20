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

## 생성 위치 (로컬 예시)

```
/Users/bluejunha/Documents/git/techstore-nextjs
```

같은 상위 폴더에 Flutter 버전 [`techstore-flutter`](https://github.com/devbyjunha/techstore-flutter)가 있습니다.

---

## 요구 사항

- **Node.js** 18.18 이상 (권장 **20 LTS**)
- **npm** 9 이상 (Node 설치 시 기본 포함)

이 저장소에는 **앱 소스만** 있습니다. `node`, `npm`, `npx` 명령은 Node.js를 별도로 설치해야 사용할 수 있습니다.

## Node.js 설치 (필수)

### 설치 확인

```bash
node -v && npm -v
```

정상이면 예: `v20.x.x`, `10.x.x` 형태로 버전이 출력됩니다. 아래처럼 나오면 Node.js가 없거나 PATH에 등록되지 않은 상태입니다.

```text
zsh: command not found: node
zsh: command not found: npm
```

### 설치 방법 (macOS)

**방법 A — Homebrew (간단)**

```bash
brew install node@20
brew link --overwrite node@20   # 필요 시
```

**방법 B — nvm (여러 Node 버전 관리)**

```bash
# nvm 설치: https://github.com/nvm-sh/nvm#installing-and-updating
nvm install 20
nvm use 20
```

**방법 C — 공식 설치 프로그램**

- https://nodejs.org/ 에서 **LTS** 설치 파일 다운로드 후 실행

### 설치 후

```bash
node -v    # v18.18.0 이상인지 확인
npm -v
```

> PATH를 수정했다면 **새 터미널**을 열거나 `source ~/.zshrc` 후 다시 시도하세요.

Next.js 15는 프로젝트 의존성으로 `npm install` 시 함께 설치됩니다. 전역 `npm install -g next`는 **필수가 아닙니다**.

---

## 빠른 시작

> 아래 명령은 **Node.js 설치가 완료된 뒤** 실행하세요.

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

---

## 문제 해결

### `zsh: command not found: node` / `npm`

| 원인 | 해결 |
|------|------|
| Node.js 미설치 | 위 [Node.js 설치](#nodejs-설치-필수) 절차 진행 |
| PATH 미등록 (nvm 등) | `nvm use 20` 또는 Homebrew 경로가 `~/.zshrc`에 있는지 확인 |
| 설치 직후에도 동일 | 터미널 앱을 완전히 종료 후 다시 실행 |

프로젝트 코드 오류가 아니라 **로컬 개발 환경** 문제입니다.

### `npm install` / `npm run dev` 실패

- Node 버전: `node -v` → 18.18 미만이면 20 LTS로 업그레이드
- 의존성 재설치: `rm -rf node_modules package-lock.json && npm install`
- 포트 충돌: 3000번 사용 중이면 다른 프로세스 종료 후 `npm run dev` 재시도
- 환경 변수: Analytics 없이도 실행 가능. 키는 `.env.local` 참고 → [.env.example](./.env.example)

### `next: command not found`

개발 시에는 **전역 Next.js가 필요 없습니다**. 프로젝트 루트에서 `npm run dev`를 사용하세요 (`package.json`의 `next`가 `node_modules`에서 실행됩니다).
