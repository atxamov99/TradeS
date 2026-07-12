import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import * as adminApi from '../../api/admin.api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getAllUsers({ page, limit: 15, search }),
    keepPreviousData: true,
  });

  const result = data?.data?.data || {};
  const users = result.users || [];

  const blockMutation = useMutation({
    mutationFn: (id) => adminApi.blockUser(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success(t('admin_user_blocked')); },
  });

  const unblockMutation = useMutation({
    mutationFn: (id) => adminApi.unblockUser(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success(t('admin_user_unblocked')); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success(t('admin_user_deleted')); },
  });

  const roleColors = { USER: 'gray', ADMIN: 'blue', SUPER_ADMIN: 'purple' };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin_users_title')}</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{result.total || 0} {t('admin_total_suffix')}</span>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input
          className="input pl-10"
          placeholder={t('admin_search_users_ph')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={8} cols={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">{t('admin_col_user')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_role')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_status')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin_col_joined')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge color={roleColors[u.role] || 'gray'}>{u.role}</Badge>
                        {u.isTestUser && <Badge color="yellow">{t('admin_test_badge')}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.isBlocked ? 'red' : 'green'}>
                        {u.isBlocked ? t('admin_blocked') : t('admin_active')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.isBlocked ? (
                          <button
                            onClick={() => unblockMutation.mutate(u.id)}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title={t('admin_unblock')}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => blockMutation.mutate(u.id)}
                            className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            title={t('admin_block')}
                          >
                            <ShieldOff className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(t('admin_confirm_delete_user', { name: u.name }))) deleteMutation.mutate(u.id);
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title={t('admin_delete_action')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Pagination page={page} pages={result.pages || 1} onPageChange={setPage} />
      </div>
    </div>
  );
}
