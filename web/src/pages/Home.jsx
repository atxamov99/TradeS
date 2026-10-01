import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones, Store } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import * as productsApi from '../api/products.api';
import * as shopApi from '../api/shop.api';
import * as contentApi from '../api/content.api';

const features = [
  { icon: ShieldCheck, title: 'Xavfsiz xarid', desc: "Har bir buyurtma himoyalangan" },
  { icon: Truck, title: 'Tez yetkazish', desc: "Do'konlar tez javob beradi" },
  { icon: RefreshCw, title: 'Oson qaytarish', desc: "Muammo bo'lsa yordam beramiz" },
  { icon: Headphones, title: "24/7 Qo'llab-quvvatlash", desc: "Har doim yordamga tayyormiz" },
];

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['storefront-products'],
    queryFn: () => productsApi.getProducts({ limit: 100 }),
  });

  const { data: shopsData, isLoading: shopsLoading } = useQuery({
    queryKey: ['marketplace-shops'],
    queryFn: () => shopApi.getShops({ limit: 12 }),
  });

  const { data: bannerData } = useQuery({
    queryKey: ['public-content', 'media_asset'],
    queryFn: () => contentApi.getPublicContent({ type: 'media_asset', limit: 1 }),
  });

  const products = data?.data?.data?.products || [];
  const shops = shopsData?.data?.data?.shops || [];

  const bannerRow = bannerData?.data?.data?.content?.[0];
  let banner = null;
  if (bannerRow) {
    try {
      const parsed = JSON.parse(bannerRow.body);
      if (parsed?.imageUrl) banner = parsed;
    } catch {
      // body isn't valid banner JSON — skip rendering rather than show a broken banner.
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Kerakli narsani<br />topib xarid qiling
          </h1>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Turli do'konlardan minglab mahsulot — hammasi bir joyda.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/products" className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-3">
              Xarid qilish <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="btn border-2 border-white/40 text-white hover:bg-white/10 px-6 py-3">
              Boshlash
            </Link>
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
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo banner */}
      {banner && (
        <section className="container pt-12">
          <BannerCard banner={banner} />
        </section>
      )}

      {/* Shops */}
      {(shopsLoading || shops.length > 0) && (
        <section className="container py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Do'konlar</h2>
            <p className="text-gray-500 text-sm mt-1">Marketplace'dagi faol do'konlar</p>
          </div>

          {shopsLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-4 h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {shops.map((shop) => (
                <Link key={shop.id} to={`/shops/${shop.id}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{shop.name}</p>
                    <p className="text-xs text-gray-500">{shop._count?.products ?? 0} ta mahsulot</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Products */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Barcha mahsulotlar</h2>
            <p className="text-gray-500 text-sm mt-1">Do'konlarimizdagi barcha mahsulotlar</p>
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Hozircha mahsulot yo'q. Keyinroq qayta tekshiring!</p>
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
          <h2 className="text-3xl font-bold mb-3">O'zingizning do'koningizni oching</h2>
          <p className="text-gray-400 mb-6">Ro'yxatdan o'ting va bugun sotishni boshlang.</p>
          <Link to="/register" className="btn-primary btn px-8 py-3 text-base font-semibold">
            Bepul hisob yaratish
          </Link>
        </div>
      </section>
    </div>
  );
}

function BannerCard({ banner }) {
  const content = (
    <div className="relative overflow-hidden rounded-2xl">
      <img src={banner.imageUrl} alt={banner.caption || ''} className="h-48 w-full object-cover sm:h-64" />
      {(banner.caption || banner.linkLabel) && (
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/60 via-black/20 to-transparent">
          <div className="px-6 sm:px-10 text-white">
            {banner.caption && <p className="text-xl sm:text-2xl font-bold max-w-md">{banner.caption}</p>}
            {banner.linkLabel && (
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                {banner.linkLabel} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return banner.linkUrl ? (
    <Link to={banner.linkUrl}>{content}</Link>
  ) : (
    content
  );
}
