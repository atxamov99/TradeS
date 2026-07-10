import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import * as wishlistApi from '../api/wishlist.api';

export default function Wishlist() {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.getWishlist,
  });

  const products = data?.data?.data?.wishlist?.products || [];

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" /> Wishlist
      </h1>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Your wishlist is empty</p>
          <Link to="/products" className="btn-primary btn mt-4 inline-flex">Discover Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
