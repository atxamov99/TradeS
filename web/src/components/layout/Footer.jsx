import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-gray-900 mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/dashboard" className="text-xl font-bold text-primary-600">
              TradeS
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              Your modern e-commerce platform for quality products.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/products" className="hover:text-primary-600">All Products</Link></li>
              <li><Link to="/products?category=electronics" className="hover:text-primary-600">Electronics</Link></li>
              <li><Link to="/products?category=clothing" className="hover:text-primary-600">Clothing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/profile" className="hover:text-primary-600">Profile</Link></li>
              <li><Link to="/orders" className="hover:text-primary-600">Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-primary-600">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="hover:text-primary-600 cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-primary-600 cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} TradeS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
