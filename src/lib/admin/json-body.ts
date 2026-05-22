/** Remove // line comments outside JSON strings (Postman-style drafts). */
export function stripJsonComments(raw: string): string {
  return raw
    .split('\n')
    .map((line) => {
      let inString = false;
      let escape = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString && char === '/' && line[i + 1] === '/') {
          return line.slice(0, i).trimEnd();
        }
      }
      return line;
    })
    .join('\n');
}

export function normalizeRequestBody(raw: string): {
  ok: true;
  body: string;
} | {
  ok: false;
  error: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, body: '' };
  }

  const withoutComments = stripJsonComments(trimmed);

  try {
    const parsed = JSON.parse(withoutComments) as unknown;
    return { ok: true, body: JSON.stringify(parsed) };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON';
    return {
      ok: false,
      error: `요청 본문 JSON이 올바르지 않습니다. // 주석을 제거하거나 JSON 형식을 확인하세요. (${message})`,
    };
  }
}
