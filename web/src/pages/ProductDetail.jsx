import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Heart, Star, ArrowLeft, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import * as productsApi from '../api/products.api';
import * as wishlistApi from '../api/wishlist.api';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import formatPrice from '../utils/formatPrice';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { slug } = useParams();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProductBySlug(slug),
  });

  const product = data?.data?.data?.product;

  const handleAddToCart = () => {
    if (!user) { toast.error('Please login to add to cart'); return; }
    addItem(product.id, qty);
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login'); return; }
    const res = await wishlistApi.toggleWishlist(product.id);
    const action = res.data.data.action;
    toast.success(action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="container py-20 text-center">
      <p className="text-gray-500">Product not found.</p>
      <Link to="/products" className="btn-primary btn mt-4">Back to Products</Link>
    </div>
  );

  const reviews = product.reviews || [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  return (
    <div className="container py-8">
      <Link to="/products" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
            <img
              src={product.images?.[activeImage]?.url || 'https://placehold.co/600x600?text=No+Image'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === activeImage ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{product.category}</p>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.brand && <p className="text-sm text-gray-500 mt-1">by {product.brand}</p>}
          </div>

          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}

          <div>
            <span className="text-3xl font-bold text-primary-600">
              {formatPrice(product.finalPrice)}
            </span>
            {product.discount > 0 && (
              <>
                <span className="ml-2 text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                <span className="ml-2 badge bg-red-100 text-red-600">{product.discount}% OFF</span>
              </>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <button onClick={handleWishlist} className="p-3 rounded-lg border hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 text-xs font-bold">
                      {review.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{review.name}</span>
                  </div>
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
