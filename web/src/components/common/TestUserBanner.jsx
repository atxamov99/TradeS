import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Persistent-per-session reminder that the logged-in account is a Test/Trial
// account. Dismissible for the current page view only (local state, not
// persisted) so it reappears on the next navigation/reload — the whole point
// is to keep reminding the user they're on a trial, not to be silenced forever.
export default function TestUserBanner({ user }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!user || !user.isTestUser || dismissed) return null;

  const daysLeft = user.testExpiresAt
    ? Math.max(0, Math.ceil((new Date(user.testExpiresAt) - new Date()) / 86400000))
    : 0;
  // 45 mirrors backend/src/utils/testUserLimits.js's TEST_USER_ACTION_CAP —
  // only used if an older cached user object lacks testActionCap from the API.
  const actionCap = user.testActionCap || 45;
  const actionsLeft = Math.max(0, actionCap - (user.testActionCount || 0));

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800/50 text-yellow-800 dark:text-yellow-300">
      <Clock size={16} className="flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm font-medium">
        <span className="font-bold">{t('test_banner_label')}</span>
        <span className="opacity-70">•</span>
        <span>{t('test_banner_days_label')}: {daysLeft}</span>
        <span className="opacity-70">•</span>
        <span>{t('test_banner_actions_label')}: {actionsLeft}</span>
        <Link
          to="/register"
          className="ml-1 underline font-semibold hover:text-yellow-900 dark:hover:text-yellow-100"
        >
          {t('test_banner_register_cta')}
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800/40 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
