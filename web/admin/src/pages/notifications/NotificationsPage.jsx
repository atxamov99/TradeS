import { useMemo } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";
import { useNotificationRead } from "../../hooks/useNotificationRead";
import { Icon } from "../../components/shared/Icon";

const priorityStyle = {
  high: { cls: "bg-error-container text-on-error-container", icon: "priority_high" },
  medium: { cls: "bg-[#fef3c7] text-[#92400e]", icon: "warning" },
  low: { cls: "bg-surface-variant text-on-surface-variant", icon: "info" },
};

const toneIcon = {
  success: { cls: "bg-primary-container/15 text-primary-container", icon: "check_circle" },
  danger: { cls: "bg-error-container text-error", icon: "error" },
  warning: { cls: "bg-[#fef3c7] text-[#92400e]", icon: "warning" },
  info: { cls: "bg-secondary-container/15 text-secondary", icon: "notifications" },
};

// Same source data as the header's NotificationBell dropdown — this page is
// just the full, permanent view of the same feed (no separate backend model).
export function NotificationsPage() {
  usePageTitle("Bildirishnomalar");
  const { notificationFeed, recentActivity } = useAdminData();
  const { t } = useI18n();

  const items = useMemo(() => {
    const alerts = (notificationFeed || []).map((n) => ({
      key: `alert-${n.id}`,
      kind: "alert",
      title: n.titleKey ? t(n.titleKey, {}, n.title || "Bildirishnoma") : n.title || "Bildirishnoma",
      detail: n.detail || (n.detailKey ? t(n.detailKey, {}, "") : ""),
      priority: n.priority || "low",
    }));
    // Content-derived key (not array index) — recentActivity shifts as new
    // entries get prepended, so an index-based key would silently "forget"
    // which items were already marked read as everything shifts down.
    const activity = (recentActivity || []).map((a) => ({
      key: `act-${a.title || ""}-${a.detail || ""}-${a.time || ""}`,
      kind: "activity",
      title: a.title || "Amal",
      detail: a.detail || "",
      time: a.time || "",
      tone: a.tone || "info",
    }));
    return [...alerts, ...activity];
  }, [notificationFeed, recentActivity, t]);

  const { isRead, markRead, markAllRead } = useNotificationRead();
  const unreadCount = items.filter((it) => !isRead(it.key)).length;

  return (
    <div className="space-y-section-gap">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Bildirishnomalar</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Tizimdagi ogohlantirishlar va so'nggi harakatlar
            {unreadCount > 0 && <span className="ml-2 text-error font-medium">({unreadCount} ta o'qilmagan)</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead(items.map((it) => it.key))}
            className="px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-body-sm text-on-surface hover:border-primary transition-colors"
          >
            Hammasini o'qilgan deb belgilash
          </button>
        )}
      </div>

      <div className="bg-surface-bright border border-outline-variant rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="notifications_off" className="text-on-surface-variant text-[28px]" />
            <p className="text-body-sm text-on-surface-variant mt-2">Hozircha bildirishnoma yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/60">
            {items.map((it) => {
              const style = it.kind === "alert" ? priorityStyle[it.priority] || priorityStyle.low : toneIcon[it.tone] || toneIcon.info;
              const read = isRead(it.key);
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => markRead(it.key)}
                  disabled={read}
                  className={`w-full text-left px-5 py-4 flex items-start gap-3 transition-colors ${
                    read ? "opacity-60" : "bg-primary-container/5 hover:bg-surface-container-low"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.cls}`}>
                    <Icon name={style.icon} className="text-[20px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body-sm font-medium text-on-surface flex items-center gap-2">
                      {it.title}
                      {!read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </p>
                    {it.detail && <p className="text-xs text-on-surface-variant mt-0.5 break-words">{it.detail}</p>}
                    {it.time && <p className="text-xs text-on-surface-variant/70 mt-0.5">{it.time}</p>}
                  </div>
                  {!read && <span className="text-xs text-primary shrink-0">O'qildi deb belgilash</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
