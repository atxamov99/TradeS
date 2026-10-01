import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Store, Package } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import * as shopApi from '../api/shop.api';

export default function ShopPage() {
  const { id } = useParams();

  const { data: shopData, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: () => shopApi.getShopById(id),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['shop-products', id],
    queryFn: () => shopApi.getShopProducts(id, { limit: 100 }),
  });

  const shop = shopData?.data?.data?.shop;
  const products = productsData?.data?.data?.products || [];

  if (shopLoading) {
    return (
      <div className="container py-10">
        <div className="h-24 w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container py-20 text-center">
        <p className="text-gray-500">Do'kon topilmadi.</p>
        <Link to="/products" className="btn-primary btn mt-4 inline-flex">Mahsulotlarga qaytish</Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Link to="/products" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Marketplace'ga qaytish
      </Link>

      <div className="card p-6 flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <Store className="h-8 w-8 text-primary-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">{shop.name}</h1>
          {shop.description && <p className="text-sm text-gray-500 mt-1">{shop.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{shop._count?.products ?? products.length} ta mahsulot</p>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Mahsulotlar</h2>

      {productsLoading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Bu do'konda hali mahsulot yo'q.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={{ ...p, shop }} />
          ))}
        </div>
      )}
    </div>
  );
}
