import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import * as wishlistApi from '../../api/wishlist.api';
import formatPrice from '../../utils/formatPrice';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add to cart'); return; }
    addItem(product.id, 1);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to use wishlist'); return; }
    try {
      const res = await wishlistApi.toggleWishlist(product.id);
      const action = res.data.data.action;
      toast.success(action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const image = product.images?.[0]?.url || 'https://placehold.co/400x300?text=No+Image';

  return (
    <Link to={`/products/${product.slug || product.id}`} className="group">
      <div className="card overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.discount > 0 && (
            <span className="absolute top-2 left-2 badge bg-red-500 text-white">
              -{product.discount}%
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white font-medium text-sm">Out of Stock</span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleWishlist}
              className="p-2 rounded-full bg-white shadow-md hover:bg-red-50 text-gray-600 hover:text-red-500"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-400 mb-1 capitalize">{product.category}</p>
          <h3 className="font-medium text-sm line-clamp-2 mb-3">{product.name}</h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-primary-600">
                {formatPrice(product.finalPrice ?? product.price)}
              </span>
              {product.discount > 0 && (
                <span className="ml-1.5 text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
