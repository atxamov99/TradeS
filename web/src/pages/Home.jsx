import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import * as productsApi from '../api/products.api';

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure transactions' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
];

export default function Home() {
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
            Shop the Future<br />of E-Commerce
          </h1>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Discover thousands of products curated for quality, delivered to your door.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/products" className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-3">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="btn border-2 border-white/40 text-white hover:bg-white/10 px-6 py-3">
              Get Started
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

      {/* Products */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">All Products</h2>
            <p className="text-gray-500 text-sm mt-1">Browse everything listed by our sellers</p>
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No products yet. Check back soon!</p>
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
          <h2 className="text-3xl font-bold mb-3">Ready to start shopping?</h2>
          <p className="text-gray-400 mb-6">Join thousands of happy customers.</p>
          <Link to="/register" className="btn-primary btn px-8 py-3 text-base font-semibold">
            Create Account — It's Free
          </Link>
        </div>
      </section>
    </div>
  );
}
