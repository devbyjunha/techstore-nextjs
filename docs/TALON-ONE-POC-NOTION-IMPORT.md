# Notion에 PoC 문서 넣는 방법

> Markdown을 **채팅/코드 블록에 붙여넣으면** `#`, `**` 같은 기호가 그대로 보입니다.  
> 아래 방법 중 **하나**를 사용하세요.

## 방법 1 — Markdown 파일 Import (권장)

1. Notion 왼쪽 사이드바 **Settings** (또는 워크스pace 이름) 클릭
2. **Import** 선택
3. **Markdown & CSV** → **Upload**
4. 파일 선택: `TALON-ONE-POC-NOTION.md`
5. Import 완료 후 새 페이지가 생성됨 → 제목·표·체크리스트가 자동 변환됨

## 방법 2 — HTML Import

1. 동일하게 **Import** → **HTML** 선택
2. 파일 선택: `TALON-ONE-POC-NOTION.html`
3. 표·제목·목록이 Notion 블록으로 변환됨

## 방법 3 — 빈 페이지에 붙여넣기 (코드 블록 금지)

1. Notion에서 **새 빈 페이지** 생성
2. 본문 **빈 줄**을 클릭 (코드 블록 `/code` 안에 넣지 말 것)
3. `TALON-ONE-POC-NOTION.md` 파일을 **텍스트 에디터**에서 열어 전체 복사
4. Notion 페이지에 **Cmd+V** (Mac) / **Ctrl+V** (Windows)
5. Notion이 `#` → 제목, `- [ ]` → to-do 등으로 변환하는지 확인

## 하지 말아야 할 것

- Cursor/채팅에서 **Markdown 코드 블록** 통째로 복사 → Notion에도 코드 블록으로 들어감
- Notion에서 `/code` 블록 만든 뒤 붙여넣기

## 문서에 포함된 주요 장표

- §4.4 TechStore에서 Talon API 호출 영역 (흐름도 + 트리거 표)
- §12 Integration API vs Management API (도식 + 비교표)
- §13 실제 도입 시 Import / 마이그레이션 체크리스트

## 파일 위치

```
techstore-nextjs/docs/
  TALON-ONE-POC-NOTION.md      ← Import용 Markdown (최신)
  TALON-ONE-POC-NOTION.html    ← Import용 HTML
  TALON-ONE-POC-NOTION-IMPORT.md  ← 이 가이드
```

## 이미 Notion에 Import한 경우

페이지를 통째로 다시 Import하거나, §12·§13만 새 페이지로 Import한 뒤 기존 페이지에 링크/이동하세요.
이전 Markdown을 덮어쓰려면 Notion Import 후 새 페이지가 생기므로, 필요하면 기존 페이지를 archive하고 새 페이지를 쓰면 됩니다.
