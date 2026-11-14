import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import * as productsApi from '../api/products.api';

const features = [
  { icon: Truck, title: 'hm_f1_t', desc: 'hm_f1_d' },
  { icon: ShieldCheck, title: 'hm_f2_t', desc: 'hm_f2_d' },
  { icon: RefreshCw, title: 'hm_f3_t', desc: 'hm_f3_d' },
  { icon: Headphones, title: 'hm_f4_t', desc: 'hm_f4_d' },
];

export default function Home() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['storefront-products'],
    queryFn: () => productsApi.getProducts({ limit: 100 }),
  });

  const products = data?.data?.data?.products || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            {t('hm_hero_a')}<br />{t('hm_hero_b')}
          </h1>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            {t('hm_hero_p')}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/products" className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-3">
              {t('hm_shop_now')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="btn border-2 border-white/40 text-white hover:bg-white/10 px-6 py-3">{t('hm_get_started')}</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-white dark:bg-gray-900">
        <div className="container py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t(title)}</p>
                  <p className="text-xs text-gray-500">{t(desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">{t('hm_all_products')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('hm_browse_all')}</p>
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>{t('hm_no_products')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gray-900 dark:bg-gray-800 text-white py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-3">{t('hm_ready')}</h2>
          <p className="text-gray-400 mb-6">{t('hm_join')}</p>
          <Link to="/register" className="btn-primary btn px-8 py-3 text-base font-semibold">
            {t('hm_create')}
          </Link>
        </div>
      </section>
    </div>
  );
}
