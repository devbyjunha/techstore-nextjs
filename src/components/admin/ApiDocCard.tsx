'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { ApiDocEndpoint } from '@/lib/admin/api-docs';
import { buildCurlExample } from '@/lib/admin/api-docs';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
  PATCH: 'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
};

interface ApiDocCardProps {
  endpoint: ApiDocEndpoint;
  baseUrl: string;
  demoApiKey: string;
}

export default function ApiDocCard({
  endpoint,
  baseUrl,
  demoApiKey,
}: ApiDocCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'curl' | 'path' | null>(null);

  const curl = buildCurlExample(
    baseUrl,
    endpoint,
    endpoint.path.startsWith('/api/v1/webhooks')
      ? demoApiKey || 'YOUR_WEBHOOK_SECRET'
      : demoApiKey || 'YOUR_API_KEY'
  );

  const copy = async (text: string, type: 'curl' | 'path') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const fullPath = `${baseUrl}${endpoint.path.replace('{productId}', '1')}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex w-full items-start gap-4 p-5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-start gap-4 text-left transition-colors hover:opacity-90"
        >
          <span
            className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${METHOD_COLORS[endpoint.method]}`}
          >
            {endpoint.method}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{endpoint.title}</h3>
              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-indigo-700">
                {endpoint.path}
              </code>
            </div>
            <p className="mt-1 text-sm text-slate-600">{endpoint.description}</p>
          </div>
          {open ? (
            <ChevronUp className="shrink-0 text-slate-400" size={20} />
          ) : (
            <ChevronDown className="shrink-0 text-slate-400" size={20} />
          )}
        </button>
        <button
          type="button"
          onClick={() => void copy(fullPath, 'path')}
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="URL 복사"
        >
          {copied === 'path' ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
          {endpoint.auth && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                인증
              </p>
              <p className="mt-1 text-sm text-slate-700">{endpoint.auth}</p>
            </div>
          )}

          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Query Parameters
              </p>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">이름</th>
                      <th className="px-3 py-2 font-medium">설명</th>
                      <th className="px-3 py-2 font-medium">예시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {endpoint.queryParams.map((q) => (
                      <tr key={q.name}>
                        <td className="px-3 py-2 font-mono text-indigo-700">{q.name}</td>
                        <td className="px-3 py-2 text-slate-600">{q.description}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">
                          {q.example ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {endpoint.requestBody && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Request Body
              </p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-300">
                {endpoint.requestBody}
              </pre>
            </div>
          )}

          {endpoint.responseExample && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Response 예시
              </p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700">
                {endpoint.responseExample}
              </pre>
            </div>
          )}

          {endpoint.notes && endpoint.notes.length > 0 && (
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
              {endpoint.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

          {endpoint.links && endpoint.links.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {endpoint.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {link.label}
                  <ExternalLink size={14} />
                </Link>
              ))}
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                cURL 예시
              </p>
              <button
                type="button"
                onClick={() => void copy(curl, 'curl')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {copied === 'curl' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'curl' ? '복사됨' : '복사'}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
              {curl}
            </pre>
          </div>
        </div>
      )}
    </article>
  );
}
