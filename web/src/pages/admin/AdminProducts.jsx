import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import * as productsApi from '../../api/products.api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', description: '', price: '', discount: '0', category: '',
  stock: '', brand: '',
  images: [{ url: '', alt: '' }],
};

export default function AdminProducts() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => productsApi.getProducts({ page, limit: 12, search }),
    keepPreviousData: true,
  });

  const result = data?.data?.data || {};
  const products = result.products || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); toast.success(t('admin_product_deleted')); },
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discount: product.discount,
      category: product.category,
      stock: product.stock,
      brand: product.brand || '',
      images: product.images?.length ? product.images : [{ url: '', alt: '' }],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const price = Number(form.price);
      const payload = {
        ...form,
        price,
        buyPrice: price,
        sellPrice: price,
        discount: Number(form.discount),
        stock: Number(form.stock),
        images: form.images.filter((img) => img.url),
      };
      if (editing) {
        await productsApi.updateProduct(editing.id, payload);
        toast.success(t('admin_product_updated'));
      } else {
        await productsApi.createProduct(payload);
        toast.success(t('admin_product_created'));
      }
      qc.invalidateQueries(['admin-products']);
      setModalOpen(false);
    } catch (_) {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('products')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t('add_product')}
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input className="input pl-10" placeholder={t('admin_search_products_ph')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={8} cols={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">{t('admin_col_product')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_category')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_price')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_stock')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]?.url || 'https://placehold.co/40x40'} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-100" />
                        <span className="font-medium line-clamp-1 max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize"><Badge color="gray">{p.category}</Badge></td>
                    <td className="px-4 py-3">
                      <span className="font-medium">${p.finalPrice?.toFixed(2)}</span>
                      {p.discount > 0 && <span className="ml-1 text-xs text-gray-400">(-{p.discount}%)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={p.stock > 0 ? 'green' : 'red'}>{p.stock}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(t('admin_confirm_delete_product', { name: p.name }))) deleteMutation.mutate(p.id); }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Pagination page={page} pages={result.pages || 1} onPageChange={setPage} />
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin_edit_product_title') : t('admin_new_product_title')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label={t('admin_product_name_label')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('admin_description_label')}</label>
              <textarea className="input min-h-[80px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <Input label={t('admin_price_label')} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label={t('admin_discount_label')} type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            <Input label={t('admin_category_label')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder={t('admin_category_ph')} />
            <Input label={t('admin_stock_label')} type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            <div className="sm:col-span-2">
              <Input label={t('admin_brand_label')} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder={t('admin_optional_ph')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('admin_image_url_label')}</label>
              <Input
                value={form.images[0]?.url || ''}
                onChange={(e) => {
                  const imgs = [...form.images];
                  imgs[0] = { ...imgs[0], url: e.target.value };
                  setForm({ ...form, images: imgs });
                }}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" isLoading={saving}>{editing ? t('admin_update_label') : t('admin_create_label')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
