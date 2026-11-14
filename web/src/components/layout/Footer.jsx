import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-white dark:bg-gray-900 mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/products" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <img src="/logo.png" alt="TradeS" className="h-9 w-9 rounded-lg object-contain" />
              TradeS
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              {t('ft_tagline')}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('ft_shop')}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/products" className="hover:text-primary-600">{t('hm_all_products')}</Link></li>
              <li><Link to="/products?category=electronics" className="hover:text-primary-600">{t('ft_electronics')}</Link></li>
              <li><Link to="/products?category=clothing" className="hover:text-primary-600">{t('ft_clothing')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('ft_account')}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/profile" className="hover:text-primary-600">{t('profile')}</Link></li>
              <li><Link to="/orders" className="hover:text-primary-600">{t('ft_orders')}</Link></li>
              <li><Link to="/wishlist" className="hover:text-primary-600">{t('ft_wishlist')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('ft_support')}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="hover:text-primary-600 cursor-pointer">{t('ft_help')}</span></li>
              <li><span className="hover:text-primary-600 cursor-pointer">{t('ft_contact')}</span></li>
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
import { useTranslation } from 'react-i18next';
