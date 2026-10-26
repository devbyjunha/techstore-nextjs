'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Store,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ALL_STORES, TechStoreDefinition } from '@/lib/talon/stores';

interface TalonStoreItem {
  id: number;
  created: string;
  name: string;
  description?: string;
  storeIntegrationId?: string;
  integrationId?: string;
}

export default function AdminTalonStoresPage() {
  const [stores, setStores] = useState<TalonStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState<TalonStoreItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formStoreIntegrationId, setFormStoreIntegrationId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/talon/stores');
      const data = await res.json();
      if (res.ok && data.ok) {
        setStores(data.data || []);
      } else {
        setError(data.error || '스토어 목록 조회 실패');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 요청 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleSyncAll = async () => {
    if (!confirm('TechStore의 기본 7개 스토어(온라인 1개 + 오프라인 6개)를 Talon.One에 일괄 생성하시겠습니까?')) {
      return;
    }

    setSyncingAll(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/talon/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-all' }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const successCount = data.results.filter((r: { ok: boolean }) => r.ok).length;
        setActionMessage({
          type: 'success',
          text: `일괄 동기화 완료: ${successCount}개 생성 완료 (또는 이미 존재)`,
        });
        fetchStores();
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || '일괄 동기화 중 오류가 발생했습니다.',
        });
      }
    } catch (e) {
      setActionMessage({
        type: 'error',
        text: e instanceof Error ? e.message : '동기화 요청 실패',
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);

    try {
      if (editingStore) {
        // Update
        const res = await fetch('/api/admin/talon/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            storeId: editingStore.id,
            name: formName,
            description: formDescription,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setActionMessage({ type: 'success', text: `"${formName}" 스토어가 수정되었습니다.` });
          setShowAddModal(false);
          setEditingStore(null);
          fetchStores();
        } else {
          alert(data.error || '수정 실패');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/talon/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            name: formName,
            storeIntegrationId: formStoreIntegrationId,
            description: formDescription,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setActionMessage({ type: 'success', text: `"${formName}" 스토어가 생성되었습니다.` });
          setShowAddModal(false);
          setFormName('');
          setFormStoreIntegrationId('');
          setFormDescription('');
          fetchStores();
        } else {
          alert(data.error || '생성 실패');
        }
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '요청 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (store: TalonStoreItem) => {
    if (!confirm(`"${store.name}" (${store.storeIntegrationId || store.integrationId}) 스토어를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/talon/stores?storeId=${store.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.ok || res.status === 204)) {
        // Optimistic UI update: 즉시 화면 상태에서 해당 스토어 제거
        setStores((prev) => prev.filter((s) => s.id !== store.id));
        setActionMessage({ type: 'success', text: `"${store.name}" 스토어가 삭제되었습니다.` });
        // 백그라운드 재조회 동기화
        await fetchStores();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 요청 실패');
    }
  };

  const openAddModal = (preset?: TechStoreDefinition) => {
    setEditingStore(null);
    if (preset) {
      setFormName(preset.name);
      setFormStoreIntegrationId(preset.storeIntegrationId);
      setFormDescription(preset.channel === 'online' ? 'Online e-Commerce' : `Offline POS ${preset.city || ''}`);
    } else {
      setFormName('');
      setFormStoreIntegrationId('');
      setFormDescription('');
    }
    setShowAddModal(true);
  };

  const openEditModal = (store: TalonStoreItem) => {
    setEditingStore(store);
    setFormName(store.name);
    setFormStoreIntegrationId(store.storeIntegrationId || store.integrationId || '');
    setFormDescription(store.description || '');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="text-indigo-600" />
            Talon.One 스토어 관리
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Talon.One Application(ID: 4)에 매장(Store)을 생성하고 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchStores}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncingAll || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {syncingAll ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
            7개 매장 일괄 동기화
          </button>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={16} />
            스토어 직접 추가
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            actionMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
          )}
          <span className="text-sm font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* Permission Warning if 401 */}
      {error && error.includes('401') && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <ShieldAlert size={28} className="shrink-0 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-amber-900">
                Talon.One Management API 권한(Scope) 설정 필요
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                현재 설정된 Management API Key에 <strong>&apos;Stores&apos; 관련 엔드포인트 권한</strong>이 부여되어 있지 않습니다.
              </p>
              <div className="mt-4 rounded-xl bg-white p-4 text-xs font-mono text-slate-700 border border-amber-200 space-y-1">
                <p>1. Talon.One 대시보드 우측 상단 <strong>Account &gt; Tools &gt; Management API keys</strong> 이동</p>
                <p>2. 현재 사용 중인 키를 수정하거나 새로 생성</p>
                <p>3. <strong>Allowed Endpoints</strong>에서 <strong>Stores</strong> 그룹의 <code>/v1/applications/&#123;applicationId&#125;/stores</code> 허용</p>
                <p>4. <code>.env.local</code>의 <code>TALON_ONE_MANAGEMENT_API_KEY</code> 업데이트</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preset Cards (Defined in TechStore) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">TechStore 정의 프리셋 (7개 매장)</h2>
        <p className="mt-1 text-xs text-slate-500">
          시스템에서 사용하는 7개 매장 규격입니다. 등록되어 있지 않은 매장을 클릭하여 즉시 개별 생성할 수 있습니다.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {ALL_STORES.map((preset) => {
            const isRegistered = stores.some(
              (s) => (s.storeIntegrationId || s.integrationId) === preset.storeIntegrationId
            );
            return (
              <div
                key={preset.storeIntegrationId}
                className={`rounded-xl border p-3 flex flex-col justify-between ${
                  isRegistered
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50 hover:border-indigo-300 transition'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border text-slate-600">
                      {preset.channel === 'online' ? '🌐 온라인' : `🏪 ${preset.city}`}
                    </span>
                    {isRegistered && <CheckCircle2 size={14} className="text-emerald-600" />}
                  </div>
                  <p className="mt-2 font-bold text-slate-900 text-sm">{preset.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">{preset.storeIntegrationId}</p>
                </div>

                {!isRegistered && (
                  <button
                    onClick={() => openAddModal(preset)}
                    className="mt-3 w-full rounded-lg bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
                  >
                    + 등록하기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stores Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            등록된 Talon.One 스토어 목록 ({stores.length})
          </h2>
          <a
            href="https://maxonomy.europe-west1.talon.one/applications/4/stores"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Talon.One 대시보드 바로가기 <ExternalLink size={12} />
          </a>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">스토어 정보를 불러오는 중...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Store size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">등록된 스토어가 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              상단의 &apos;7개 매장 일괄 동기화&apos; 버튼을 눌러 스토어를 추가하세요.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">스토어 이름</th>
                  <th className="px-6 py-3.5">Store Integration ID</th>
                  <th className="px-6 py-3.5">설명</th>
                  <th className="px-6 py-3.5">생성 일시</th>
                  <th className="px-6 py-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{store.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{store.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                        {store.storeIntegrationId || store.integrationId || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{store.description || '-'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(store.created).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(store)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="수정"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(store)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingStore ? '스토어 수정' : '새 스토어 생성'}
            </h3>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  스토어 이름 (Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: TechStore 서울점"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Integration ID *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingStore}
                  value={formStoreIntegrationId}
                  onChange={(e) => setFormStoreIntegrationId(e.target.value)}
                  placeholder="예: techstore-pos-seoul"
                  className={`w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono ${
                    editingStore
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {editingStore
                    ? 'Store Integration ID는 Talon.One 정책상 수정할 수 없습니다.'
                    : '영문 소문자, 하이픈 권장 (한 번 생성 후 수정 불가)'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  설명 (Description)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="선택 사항"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingStore ? '수정 저장' : '스토어 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

