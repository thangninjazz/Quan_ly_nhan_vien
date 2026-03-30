'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Edit2, History, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import ProductTypeDialog from '@/components/admin/product-type-dialog';
import PieceRateDialog from '@/components/admin/piece-rate-dialog';

type ProductType = {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
  rates?: { rateVnd: number }[];
};

export default function ProductTypesPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/product-types');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch product types', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: ProductType) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleHistory = (product: ProductType) => {
    setSelectedProduct(product);
    setIsHistoryOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa loại sản phẩm này?')) return;
    try {
      await api.patch(`/product-types/${id}`, { isActive: false });
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product type', err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">Loại sản phẩm</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Quản lý danh mục sản phẩm và đơn giá khoán tương ứng.
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Thêm loại mới
        </button>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full rounded-xl border-none bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Tên sản phẩm</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Đơn vị</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Đơn giá hiện tại</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                  <td className="px-6 py-4"><div className="ml-auto h-4 w-8 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                </tr>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{product.name}</td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{product.unit}</td>
                  <td className="px-6 py-4">
                    {product.rates && product.rates.length > 0 ? (
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {product.rates[0].rateVnd.toLocaleString()} đ
                      </span>
                    ) : (
                      <button
                        onClick={() => handleHistory(product)}
                        className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
                        title="Thêm đơn giá để bắt đầu tính lương"
                      >
                        Chưa có giá
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Thêm</span>
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => handleEdit(product)}
                         className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                       >
                         <Edit2 className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleHistory(product)}
                         className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                       >
                         <History className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(product.id)}
                         className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  Không tìm thấy sản phẩm nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductTypeDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSaved={fetchProducts}
        initialData={selectedProduct}
      />

      <PieceRateDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        productType={selectedProduct}
        onSaved={fetchProducts}
      />
    </div>
  );
}
