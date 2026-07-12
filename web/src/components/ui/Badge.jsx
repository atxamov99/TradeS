import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const colors = {
  gray:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  green:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  yellow:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  red:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  purple:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const ORDER_COLORS = {
  pending:   'yellow',
  paid:      'blue',
  shipped:   'purple',
  delivered: 'green',
  cancelled: 'red',
};

export default function Badge({ children, color = 'gray', className }) {
  return (
    <span className={clsx('badge', colors[color], className)}>{children}</span>
  );
}

export function OrderStatusBadge({ status }) {
  const { t } = useTranslation();
  const color = ORDER_COLORS[status] || 'gray';
  return (
    <Badge color={color} className="capitalize">
      {t(`order_status_${status}`, status)}
    </Badge>
  );
}
