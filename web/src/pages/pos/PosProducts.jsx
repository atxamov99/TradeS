import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import * as productsApi from '../../api/products.api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '-', price: '', discount: '0', category: 'general', stock: '', brand: '', images: [] };
const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'm'];

function fmtPrice(n) { return Number(n || 0).toFixed(2); }

export default function PosProducts() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  // Mirrors backend rule (product.service.js): owner OR ADMIN/SUPER_ADMIN may edit/delete.
  const canManage = (p) =>
    !!user && (['ADMIN', 'SUPER_ADMIN'].includes(user.role) || p.ownerId === user.id);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['pos-products-list', page, search],
    queryFn: () => productsApi.getProducts({ page, limit: 15, search }),
    keepPreviousData: true,
  });

  const result = data?.data?.data || {};
  const products = result.products || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries(['pos-products-list']); toast.success('Product deleted'); },
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price, discount: p.discount, category: p.category, stock: p.stock, brand: p.brand || '', images: p.images || [] });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const price = Number(form.price);
      const payload = { ...form, price, buyPrice: price, sellPrice: price, discount: Number(form.discount || 0), stock: Number(form.stock) };
      if (editing) await productsApi.updateProduct(editing.id, payload);
      else await productsApi.createProduct(payload);
      toast.success(editing ? 'Updated' : 'Created');
      qc.invalidateQueries(['pos-products-list']);
      setShowForm(false);
    } catch (_) {}
  };

  const stockColor = (s) => s === 0 ? 'text-red-400' : s <= 5 ? 'text-yellow-400' : 'text-pos-accent';

  return (
    <div className="min-h-screen bg-pos-bg text-pos-text p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-pos-accent hover:bg-pos-accentHover text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-pos-muted" />
        <input
          className="w-full bg-pos-card border border-pos-border rounded-xl pl-10 pr-4 py-3 text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent text-sm"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-pos-card" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-pos-muted">
          <Package className="h-16 w-16 mx-auto mb-3 opacity-30" />
          <p>No products yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-pos-card border border-pos-border rounded-xl hover:border-pos-accent/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{p.name}</p>
                  {p.discount > 0 && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md">-{p.discount}%</span>}
                </div>
                <p className="text-pos-muted text-xs mt-0.5 capitalize">{p.category}</p>
              </div>
              <div className="flex items-center gap-6 ml-4">
                <div className="text-right">
                  <p className="text-pos-accent font-bold">${fmtPrice(p.finalPrice || p.price)}</p>
                  {p.discount > 0 && <p className="text-pos-muted text-xs line-through">${fmtPrice(p.price)}</p>}
                </div>
                <div className="text-right min-w-[60px]">
                  <p className={`font-bold text-lg ${stockColor(p.stock)}`}>{p.stock}</p>
                  <p className="text-pos-muted text-xs">in stock</p>
                </div>
                {canManage(p) && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(p.id); }} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-pos-accent text-white' : 'bg-pos-card border border-pos-border hover:border-pos-accent'}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-pos-card border border-pos-border rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input className="w-full bg-pos-bg border border-pos-border rounded-xl px-4 py-3 text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent text-sm" placeholder="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="0.01" className="w-full bg-pos-bg border border-pos-border rounded-xl px-4 py-3 text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent text-sm" placeholder="Buy price *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                <input type="number" min="0" step="0.01" className="w-full bg-pos-bg border border-pos-border rounded-xl px-4 py-3 text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent text-sm" placeholder="Stock *" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full bg-pos-bg border border-pos-border rounded-xl px-4 py-3 text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent text-sm" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <input type="number" min="0" max="100" className="w-full bg-pos-bg border border-pos-border rounded-xl px-4 py-3 text-white placeholder-pos-muted focus:outline-none focus:border-pos-accent text-sm" placeholder="Discount %" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-pos-border text-pos-muted hover:border-pos-accent transition-colors text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-pos-accent hover:bg-pos-accentHover text-white font-semibold text-sm transition-colors">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
