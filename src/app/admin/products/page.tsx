'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react';
import { useProducts } from '@/context/ProductsContext';
import { useStore } from '@/context/StoreContext';
import ProductFormModal from '@/components/admin/ProductFormModal';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, resetProducts } =
    useProducts();
  const { addToast } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (
    data: {
      name: string;
      description: string;
      price: string;
      category: string;
      image: string;
      rating: string;
      reviews: string;
      originalPrice: string;
      discount: string;
      isOnSale: boolean;
    },
    id?: string
  ) => {
    const payload = {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      category: data.category,
      image: data.image,
      rating: Number(data.rating),
      reviews: Number(data.reviews),
      isOnSale: data.isOnSale,
      ...(data.originalPrice ? { originalPrice: Number(data.originalPrice) } : {}),
      ...(data.discount ? { discount: Number(data.discount) } : {}),
    };

    if (id) {
      updateProduct(id, payload);
      addToast({ type: 'success', message: '상품이 수정되었습니다.', duration: 3000 });
    } else {
      addProduct(payload);
      addToast({ type: 'success', message: '상품이 등록되었습니다.', duration: 3000 });
    }
  };

  const handleDelete = (product: Product) => {
    if (confirm(`"${product.name}" 상품을 삭제할까요?`)) {
      deleteProduct(product.id);
      addToast({ type: 'success', message: '상품이 삭제되었습니다.', duration: 3000 });
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">상품 관리</h1>
          <p className="mt-1 text-slate-600">총 {products.length}개 상품 · 변경 사항은 쇼핑몰에 반영됩니다</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('모든 상품을 초기 데이터로 되돌릴까요?')) {
                resetProducts();
                addToast({ type: 'info', message: '상품 목록이 초기화되었습니다.', duration: 3000 });
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            초기화
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl btn-primary px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} />
            상품 등록
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="상품명, 카테고리 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">가격</th>
                <th className="px-4 py-3 font-medium">평점</th>
                <th className="px-4 py-3 font-medium">특가</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-400">ID: {product.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatPrice(product.price)}원
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.rating} ({product.reviews})
                  </td>
                  <td className="px-4 py-3">
                    {product.isOnSale ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                        특가
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                        title="수정"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-slate-500">검색 결과가 없습니다.</p>
        )}
      </div>

      <ProductFormModal
        open={modalOpen}
        product={editingProduct}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
