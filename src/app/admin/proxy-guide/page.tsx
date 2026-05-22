import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default async function AdminProxyGuidePage() {
  const filePath = path.join(process.cwd(), 'docs/ADMIN-PROXY.md');
  let content = '';

  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    content = 'docs/ADMIN-PROXY.md 파일을 읽을 수 없습니다.';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/api-docs"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          API 문서
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <BookOpen size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">/api/admin/proxy 가이드</h1>
          <p className="mt-0.5 text-slate-600">
            관리자 API 테스트용 프록시 — 동작 원리와 다른 API와의 차이
          </p>
        </div>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700">
          {content}
        </pre>
      </article>

      <p className="text-xs text-slate-500">
        원본 파일: <code className="rounded bg-slate-100 px-1">docs/ADMIN-PROXY.md</code>
      </p>
    </div>
  );
}
