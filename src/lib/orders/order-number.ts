/** 주문 일시 기반 주문번호 — ORD-YYYYMMDDHHmmss (동일 초 충돌 시 -01, -02 …) */
export function formatOrderNumberBase(createdAt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = createdAt.getFullYear();
  const m = pad(createdAt.getMonth() + 1);
  const d = pad(createdAt.getDate());
  const h = pad(createdAt.getHours());
  const min = pad(createdAt.getMinutes());
  const s = pad(createdAt.getSeconds());
  return `${y}${m}${d}${h}${min}${s}`;
}

export function generateOrderNumber(
  createdAt: Date,
  existingIds: string[] = []
): string {
  const base = formatOrderNumberBase(createdAt);
  let candidate = `ORD-${base}`;
  let suffix = 0;

  while (existingIds.includes(candidate)) {
    suffix += 1;
    candidate = `ORD-${base}-${String(suffix).padStart(2, '0')}`;
  }

  return candidate;
}

/** 조회 입력값 정규화 (공백·하이픈 제거 후 대문자) */
export function normalizeOrderNumberInput(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
